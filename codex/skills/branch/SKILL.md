---
name: branch
description: "Rewrites the current feature branch for one purpose -- review (material a reviewer can skip, then the code under review), pr (logical commits), or rebase (onto the latest default branch) -- then force-pushes it under a pinned lease, keeping a local backup. Runs only on an explicit request to rewrite the current branch."
---
# Reshape the current branch

**Invocation input:** `<review|pr|rebase> [--dry-run] [--push-backup] [--base <remote>/<branch>] [--checks cheap|full|skip]`

Rewrites the current feature branch's history for one purpose, then force-pushes it. Rewriting a pushed branch is the
riskiest operation in the suite: wherever safety conflicts with speed or elegance, choose safety.

## Usage

| Invocation | Result | Next step |
|---|---|---|
| `$ace:branch review` | Two commits on the base: material a code reviewer can skip, then the code under review | `$ace:agent-code-review commit <sha>` on the in-scope commit |
| `$ace:branch pr` | Logical commits a pull-request reviewer can read one by one | `$ace:pr-create` |
| `$ace:branch rebase` | The branch replayed onto the latest default branch, conflicts resolved | `$ace:branch review`, `$ace:branch pr`, or carry on working |

- `--dry-run` -- run steps 1-5, print the plan, stop.
- `--push-backup` -- also push the backup as a new remote branch; by default it stays local.
- `--base <remote>/<branch>` -- base on that branch instead of the default branch (a stacked branch, or a fork whose
  upstream is another remote). Split the value at the longest prefix naming a configured remote. It replaces only the
  base side; the default branch is still resolved, fetched, and guarded.
- `--checks cheap|full|skip` -- rebase mode only: the tier of project checks its gate runs, default `cheap`.

Parse the arguments first. No mode: ask which of the three to run. An unknown mode, flag, or value, or `--checks`
outside rebase mode: print this usage and stop.

Ask with `request_user_input`; where it is unavailable, ask in plain text and wait for the answer. Every question here is
a routing choice: no keep-current option, at most three options, longer lists in the question text.

## Consent

An explicit request for this rewrite -- invoking `$ace:branch`, or asking in so many words for this skill to rewrite
the current branch -- is consent to rewrite and force-push the current branch; do not ask again. Consent comes only
from such an explicit request: when the skill was chosen by inference from a looser request (for example "tidy my
branch"), confirm before changing any branch. Otherwise ask only where a step below says so.

## Invariants

- **One writer.** Only you touch the index, refs, and remote; spawn no subagents.
- **Content comes from objects.** In review and pr modes never write the working tree or add working-tree files: move
  the branch and index with a mixed reset and stage each path from the base or backup tree. Never commit untracked
  files. Rebase writes the working tree by nature; its conflict resolution is the one deliberate exception.
- **Literal pathspecs from the top level.** Run path-taking commands from the top level as `git --literal-pathspecs`;
  address the whole tree as `.`, never `:/`. Pass path lists on stdin (`--pathspec-from-file=- --pathspec-file-nul`)
  where accepted, otherwise in chunks well under the Windows command-line limit -- never an empty list.
- **Plumbing for checks:** `diff-tree`, `rev-parse`, `ls-tree`. Porcelain diffs honour settings that hide paths; the
  clean-tree test is the one exception.
- **Full refs and literal SHAs:** `refs/remotes/<r>/<x>` and `refs/heads/<b>`, never a bare default-branch name (it can
  resolve to a stale local branch or a tag); never `@{u}` or an abbreviated SHA as a lease.
- **Nothing waits on a terminal:** `git commit -F -`; `GIT_EDITOR=true` on rebase commands; `git --no-pager`;
  `GIT_TERMINAL_PROMPT=0` on network commands. Run the push in the foreground with a long timeout; judge it only once
  it exits.
- **Shell:** run git in a POSIX shell. Shell state does not persist between commands, so repeat environment prefixes
  and write SHAs, the backup name, and the marker path literally into each command.

## The run

Every mode follows this order. Every stop in steps 1-5 halts the run before any branch changes, the backup included.

### 1. Preflight: local

Stop, saying why, when:

- git is older than 2.25.1
- the marker `$(git rev-parse --git-path branch-rewrite-in-progress)` exists: an earlier run was interrupted. Print its
  contents, the recovery (Failure and interruption), and the command that deletes it once recovered
- HEAD is detached
- an operation is in progress: `rebase-merge`, `rebase-apply`, or `sequencer` under `git rev-parse --git-path`;
  `MERGE_HEAD`, `CHERRY_PICK_HEAD`, or `REVERT_HEAD` resolving with `git rev-parse -q --verify`; or `BISECT_START`
- tracked files have uncommitted changes, staged or not. Untracked files are fine and are left alone
- an index entry is flagged assume-unchanged or skip-worktree (`git ls-files -v`: a lowercase tag, or `S`): such
  hidden edits pass the clean test and would be lost when the index is rebuilt. This covers sparse checkouts too
- the committer identity is unset (`git var GIT_COMMITTER_IDENT` fails)
- the repository is shallow; suggest `git fetch --unshallow`

### 2. Resolve and fetch

- **Remote `<r>`:** the branch's upstream remote unless it is `.`; else the only remote; else `origin`. Several
  remotes, none `origin`: ask which. No remote: stop -- the push is part of the contract.
- **Push remote:** `git for-each-ref --format='%(push:remotename)' refs/heads/<b>`, else `branch.<b>.pushRemote`, else
  `remote.pushDefault`, else `<r>` (never `@{push}`, which fails without an upstream). When it differs from `<r>`, ask:
  use it as `<r>` and redo this step, keep `<r>`, or stop.
- **Push target:** stop when `remote.<r>.mirror` is true or `<r>` has more than one push URL. When the push URL differs
  from the fetch URL, the probe below must return the same SHA through both, or stop.
- **Default branch `<db>`,** resolved against `<r>` -- deliberately unlike `$ace:pr-create`'s resolver, which
  hard-codes `origin`. Empty output, not exit status, is the failure signal; the first non-empty wins:
  1. `git ls-remote --symref <r> HEAD`: the `ref:` line ending in `HEAD`
  2. `git symbolic-ref -q refs/remotes/<r>/HEAD`, the `refs/remotes/<r>/` prefix removed as a literal string
  3. `gh repo view <fetch URL of r> --json defaultBranchRef --jq .defaultBranchRef.name`
  4. exactly one of `refs/remotes/<r>/main` and `refs/remotes/<r>/master`

  All empty: stop.
- **Counterpart `<dst>`:** the upstream branch when its remote is `<r>`, else the local name. An upstream that is
  `<db>` or the `--base` branch -- git's default for a branch created from it -- is ignored for the local name, and the
  report says so. An upstream with a different name: ask -- the local name (recommended), the upstream name, or stop.
- **Probe:** `git ls-remote --exit-code <r> refs/heads/<dst>`. Exit 2: absent, a first push. Otherwise its SHA is the
  lease candidate.
- **Fetch** with forced tracking refspecs, `+refs/heads/<x>:refs/remotes/<r>/<x>`: `<db>`, the counterpart if present,
  and the `--base` branch from its own remote. A failed fetch stops the run. Each fetched ref must resolve to a commit,
  and the counterpart must equal the probe; if not, probe once more, then stop.
- **Record literally:** `<db-tip>`; `<base-tip>` (the `--base` tip, else `<db-tip>`); the lease SHA, or "absent"; and
  `<base>` = `git merge-base HEAD <base-tip>`. No merge-base: stop.

### 3. Preflight: remote

Stop when:

- the local branch is `<db>` or the `--base` branch, or `<dst>` is either of them
- `<base>..HEAD` holds no commits
- the counterpart's tip is not integrated locally -- reachable neither from HEAD nor from any entry of the branch's own
  reflog: `{ echo <lease>; echo ^HEAD; git log -g --format='^%H' refs/heads/<b> --; } | git rev-list --count --stdin`
  prints 0 when integrated. Never use the HEAD reflog (it mixes branches) or `--reflog` (it includes the fetched
  tracking ref, so it always passes). An error is a stop, never a pass. An unintegrated tip is someone else's push; a
  tip the user rewrote away locally is still in the reflog and passes. A missing reflog can only cause a false stop --
  say so. `--force-if-includes` is a no-op beside a pinned lease and is not passed.

When the published part, `<base>..<lease sha>`, holds commits whose mailmapped author email (`%aE`) is not the user's,
ask -- in every mode -- whether to rewrite and force-push or stop: others may have built on them.

### 4. Warnings

Report; never ask:

- review and pr: commits by more than one author -- the user becomes author of every new commit
- merge commits, which the rewrite flattens
- an open pull request on `<dst>` with reviews, which the push makes outdated (`gh pr list -R <repo of r> --head <dst>
  --state open --json number,reviews`; without `gh`, "not checked")
- signed commits, whose signatures the rewrite drops
- a local `<db>` behind `refs/remotes/<r>/<db>`, which `$ace:pr-create` diffs against

### 5. Plan

- **Message convention:** a commit-msg hook (`git rev-parse --git-path hooks`) or commit-lint configuration, then
  `commit.template`, then recent non-merge subjects on `<db-tip>`. Inferred now so the plan shows final subjects.
  Never copy a host-appended suffix such as `(#12)`.
- **The mode's plan:** read only the chosen mode's reference and follow it --
  `../branch/references/review.md`, `../branch/references/pr.md`,
  or `../branch/references/rebase.md`.
- **Collision stop:** a path the rewrite or a restore may write, but HEAD does not track, exists on disk as an untracked
  or ignored file, link, or directory. Git treats ignored files as expendable, so name the paths and stop. Compute with
  `--no-renames`, so rename sources count:
  - review and pr: paths tracked at the base (pr: the regroup base) and absent from HEAD
  - rebase: paths tracked at `<base-tip>`, or touched by any commit in `<base>..HEAD`, and absent from HEAD
- **Nothing to rewrite** (the mode defines it): skip step 8 only; every forced push still gets a backup.
- **Nothing to do:** nothing to rewrite and the counterpart equals HEAD. Report it and stop, with no backup.

### 6. Dry run

With `--dry-run`, print the plan and stop: only remote-tracking refs moved; no branch, backup, or push changed.

### 7. Backup

- **Name** `branch-backup/<branch>/<date -u +%Y%m%dT%H%M%SZ>`. Validate with `git check-ref-format --branch`, then
  `git branch <name> <HEAD sha>` -- never `-f`. Any failure, a same-second collision included, is a stop.
- **Remote tip:** when the lease SHA is not an ancestor of HEAD (the branch was rebased by hand, or a rebase was left
  local), also create `<name>-remote` at the lease SHA, so the tip about to be overwritten keeps a ref.
- **`--push-backup`:** push each create-only, never with `-u`:
  `git push --porcelain --force-with-lease=refs/heads/<name>: <r> refs/heads/<name>:refs/heads/<name>` (the empty
  expected value means the ref must not exist). A failure stops before rewriting.
- **Marker:** write the branch, mode, backup names, base, and lease SHA to
  `$(git rev-parse --git-path branch-rewrite-in-progress)`.
- **Announce** the backup names and the recovery for each state (Failure and interruption) before rewriting; repeat
  them in every later question.
- The skill never deletes a backup.

### 8. Rewrite

Per the mode's reference. For every commit:

- Hooks run normally: never `--no-verify` or `-n`, never `-S` or `--no-gpg-sign`.
- No message line starts with the comment character (`commit.cleanup=strip` drops it); carry no hook-generated
  per-commit identifiers from the originals.
- Review and pr: one `Co-authored-by: <name> <email>` trailer per other author (matched by mailmapped email) whose
  replaced commits touched a path in this commit.
- The stored message must still carry its planned references and trailers.

### 9. Gate

Review and pr -- all must hold:

1. After each commit, `git diff-tree -r --no-renames --name-only` shows HEAD differing from the base (pr: the regroup
   base) in exactly the paths planned so far, and from the backup in exactly the rest.
2. `HEAD^{tree}` equals `<backup>^{tree}`. A hook that rewrites content trips this: report it, never bypass it.
3. After the last commit, the tracked working tree is clean.

Rebase has its own gate (rebase.md).

### 10. Push

```
git push --porcelain --force-with-lease=refs/heads/<dst>:<lease sha> <r> refs/heads/<b>:refs/heads/<dst>
```

- No counterpart: the empty expected value (`--force-with-lease=refs/heads/<dst>:`) plus `-u`, so the upstream is set
  for `$ace:pr-create`.
- Never `+`, `--force`, or `--mirror`; never fall back to them. A bare `--force-with-lease` passes once a background
  fetch moves the tracking ref; the pinned SHA does not.
- Read the exit status and the porcelain line for `refs/heads/<dst>` (`=` is up to date). If the outcome is unclear
  after the push exits, `git ls-remote <r> refs/heads/<dst>`: the new HEAD -- it landed; the lease SHA -- it did not
  (Failure); anything else or an error -- neither restore nor push again; keep the branch, backup, and marker, and
  report "push outcome unknown" with both SHAs, both restore lines, and the marker's delete command.
- Once it lands, delete the marker.

### 11. Report

```
$ace:branch <mode>: <b> -> <r>/<dst>
Base: <short sha> (merge-base with <remote>/<branch> at <short tip>)
Plan: <rewritten | nothing to rewrite>
Commits:
  <sha> <subject> (<n> files)
<the mode's report block>
Warnings: <each, or none>
Push: <forced update | new branch, upstream set | up to date | rejected: <reason> | outcome unknown>
Backup: <names> (<k> backups of <b>; delete older: git branch -D <names>)
Restore (local): git reset --keep <backup>
Restore (remote): git push --force-with-lease=refs/heads/<dst>:<new sha> <r> <lease sha>:refs/heads/<dst>
Next: <the mode's next step>
```

- Count backups by the whole `branch-backup/<b>/<timestamp>` name, so a branch whose name extends `<b>` is not
  counted. The delete list never includes a backup holding the lease SHA.
- `Restore (local)` runs on `<b>` and refuses rather than overwrite local edits. `Restore (remote)` returns the remote
  to its pre-run tip, only when a push landed; after a first push it is a leased delete,
  `git push --force-with-lease=refs/heads/<dst>:<new sha> <r> :refs/heads/<dst>`.
- Next, review: `$ace:agent-code-review commit <full sha>` on the commit holding the in-scope files (the second, or the
  only one when nothing was excluded), with trailing text saying the first commit holds the excluded files. Only an
  empty in-scope group means nothing needs review. pr: `$ace:pr-create`; with `--base`, note that it targets the
  default branch, so set the pull request's base by hand. rebase: `$ace:branch review`, `$ace:branch pr`, or carry on.

## Failure and interruption

**Failure** -- a hook, the gate, or a rejected lease after the backup: restore, then push nothing further.

- Review and pr: `git reset -q <backup>` (mixed; the working tree still holds the backup's content), then restore from
  the backup only the tracked paths whose content now differs (hook edits).
- Rebase in progress: `git rebase --abort`. Replay finished: `git reset --keep <backup>`; if it refuses, stop and
  report. Never `--hard`.
- Verify `refs/heads/<b>` equals the backup and the tracked tree is clean, delete the marker, and report what failed
  with the backup and the local restore line. A rejected lease means someone pushed meanwhile: the user integrates their
  work and reruns.
- The exception: rebase mode's failing checks block the push without restoring (rebase.md).

**Interruption** -- the session ends mid-run or while a question waits. The marker remains, so the next run stops at
step 1 and prints the recovery for the repository's state:

- review or pr: `git reset -q <backup>`, then `git --literal-pathspecs restore --source=<backup> --worktree -- .` from
  the top level
- rebase in progress: `git rebase --abort`; rebase finished: `git reset --keep <backup>`
- then `rm "$(git rev-parse --git-path branch-rewrite-in-progress)"`

Git 2.25.1 or later (`--pathspec-from-file` for `restore`, and its 2.25.1 fix). Newer features are optional, each with
its fallback where used: `git merge-tree --write-tree` and `git grep -m` (2.38), `git check-attr --source` (2.40).
