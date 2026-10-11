---
name: branch
description: "Rewrites the current feature branch for one purpose -- review (material a reviewer can skip, then the code under review), pr (logical commits), or rebase (onto the latest default branch) -- then force-pushes it under a pinned lease, keeping a local backup. Runs only on an explicit request to rewrite the current branch."
---
# Reshape the current branch

**Invocation input:** `<review|pr|rebase> [--dry-run] [--push-backup] [--base <remote>/<branch>] [--checks full|cheap|skip]`

Rewrites the current feature branch's history for one purpose, then force-pushes it. Rewriting a pushed branch is the
riskiest operation in the suite: wherever safety conflicts with speed or elegance, choose safety.

## Usage

| Invocation | Result | Next step |
|---|---|---|
| `$ace:branch review` | On the base: material a code reviewer can skip, then the code under review (one commit when either is empty) | `$ace:agent-code-review commit <sha>` on the in-scope commit |
| `$ace:branch pr` | Logical commits a pull-request reviewer can read one by one | `$ace:pr-create` |
| `$ace:branch rebase` | The branch replayed onto the latest default branch, conflicts resolved | `$ace:branch review`, `$ace:branch pr` (with the same `--base`), or carry on working |

- `--dry-run` -- run steps 1-5, print the plan, stop.
- `--push-backup` -- also push the backup as a new remote branch; by default it stays local.
- `--base <remote>/<branch>` -- base on that branch instead of the default branch (a stacked branch, or a fork whose
  upstream is another remote). Split the value at the longest prefix naming a configured remote; with none, or with
  nothing after it, print the usage and stop. It replaces only the base side; the default branch is still resolved,
  fetched, and guarded. No later run remembers it, so every `$ace:branch` command the skill prints, and every rerun it
  tells the user to do, repeats the run's `--base <remote>/<branch>` when one was given ("the same `--base`").
- `--checks full|cheap|skip` -- rebase mode only: the tier of project checks its gate runs, default `cheap`.

Parse the arguments first: an unknown mode, flag, or value, or `--checks` outside rebase mode, prints this usage and
stops. `--checks` without a mode implies rebase. With no mode and no `--checks`, print this usage and stop.

Ask with `request_user_input`; where it is unavailable, ask in plain text and wait for the answer. Every question here is
a routing choice: no keep-current option, at most three options, longer lists in the question text -- this supersedes
run-interview's keep-current rule for them.

## Consent

An explicit request for this rewrite -- invoking `$ace:branch`, or asking in so many words for this skill to rewrite
the current branch -- is consent to rewrite and force-push the current branch; do not ask again. Consent comes only
from such an explicit request: when the skill was chosen by inference from a looser request (for example "tidy my
branch") -- possible only where the harness allows implicit invocation -- confirm before changing any branch.
Otherwise ask only where a step below says so.

## Invariants

- **One writer.** Only you touch the index, refs, and remote; spawn no subagents.
- **Content comes from objects.** In review and pr modes never write the working tree or add working-tree files (the
  Failure restore, after its patch is saved, is the one exception): move the branch and index with a mixed reset and
  stage each path from the base or backup tree. Never commit untracked files. Rebase writes the working tree by
  nature; its conflict resolution is the one deliberate exception.
- **Literal pathspecs from the top level.** Run path-taking commands from the top level as `git --literal-pathspecs`;
  address the whole tree as `.`, never `:/`. Pass path lists on stdin (`--pathspec-from-file=- --pathspec-file-nul`)
  where accepted, otherwise in chunks well under the Windows command-line limit -- never an empty list.
- **Plumbing for checks:** `diff-tree`, `diff-files`, `rev-parse`, `ls-tree`. Porcelain diffs honour settings that hide
  paths; the clean-tree test is the one exception.
- **Full refs and literal SHAs:** `refs/remotes/<r>/<x>` and `refs/heads/<b>`, never a bare default-branch name (it can
  resolve to a stale local branch or a tag). Restore and verify by the literal original SHA, `<orig>`. Never use `@{u}`
  or an abbreviated SHA as a lease.
- **Nothing waits on a terminal:** `git commit -F -`; `GIT_EDITOR=true` on rebase commands; `git --no-pager`;
  `GIT_TERMINAL_PROMPT=0` on network commands. It does not cover an SSH passphrase or host-key prompt or a credential
  helper's own prompt, which can block a command until it times out; do not set `GIT_SSH_COMMAND` to suppress them,
  since it overrides the user's `core.sshCommand`. Run the push in the foreground with a long timeout; judge it only
  once it exits.
- **Shell:** run git in a POSIX shell. Shell state does not persist between commands, so repeat environment prefixes
  and write SHAs, the backup name, and the marker path literally into each command. Where a pipeline's result decides
  a guard, run its producers on their own first and stop on their failure.

## The run

Every mode follows this order. Every stop in steps 1-5 halts the run before any branch changes, the backup included.
A stop prints the stop report (step 11).

### 1. Preflight: local

`<b>` is the current branch (`git symbolic-ref -q HEAD` without `refs/heads/`; during a rebase in progress, its
`head-name` under `git rev-parse --git-path rebase-merge`) and `<orig>` its tip's SHA, recorded literally now.
`<common>` is the absolute path of the shared git directory, `"$(cd "$(git rev-parse --git-common-dir)" && pwd)"`,
recorded literally now (`--git-common-dir` alone can print the relative `.git`). `<marker>` is
`<common>/branch-rewrite-in-progress/<b>`, shared by every worktree. Check all of these; stop, naming each that holds:

- git is older than 2.25.1
- `<marker>` exists as a file: an earlier run on `<b>` was interrupted. Print its contents and the Interruption
  recovery for the user to run; do not run it
- `<marker>` exists as a directory: a run on a branch named `<b>/...` was interrupted. Name the marker files under it;
  a run on that branch prints its recovery
- HEAD is detached (`git symbolic-ref -q HEAD` fails)
- an operation is in progress: `rebase-merge`, `rebase-apply`, `sequencer`, or `BISECT_START` exists under
  `git rev-parse --git-path`, or `MERGE_HEAD`, `CHERRY_PICK_HEAD`, or `REVERT_HEAD` resolves with
  `git rev-parse -q --verify`
- tracked files have uncommitted changes, staged or not (`git status --porcelain --untracked-files=no` prints
  anything). Untracked files are fine and are left alone
- an index entry is flagged assume-unchanged or skip-worktree (`git ls-files -v`: a lowercase tag, or `S`): such
  hidden edits pass the clean test and would be lost when the index is rebuilt. This covers sparse checkouts too
- the committer identity is unset (`git var GIT_COMMITTER_IDENT` fails)
- the repository is shallow (`git rev-parse --is-shallow-repository`); suggest `git fetch --unshallow`

### 2. Resolve and fetch

- **Remote `<r>`:** no remote at all: stop -- the push is part of the contract. Otherwise the branch's upstream remote
  unless it is `.`; else the only remote; else `origin`; with several remotes and none named `origin`, ask which.
- **Push remote:** `git for-each-ref --format='%(push:remotename)' refs/heads/<b>`; when that prints nothing or `.`,
  `branch.<b>.pushRemote`, then `remote.pushDefault`, then `<r>`, skipping a `.` value (never `@{push}`, which fails
  without an upstream). When it differs from `<r>`, ask: use it as `<r>`, keep `<r>`, or stop; then continue without
  re-asking.
- **Push target:** stop when `remote.<r>.mirror` is true or `git remote get-url --push --all <r>` prints more than one
  URL. When that URL differs from `git remote get-url <r>`, the probe below must return the same SHA through both URLs,
  or stop.
- **Default branch `<db>`,** resolved against `<r>` -- deliberately unlike `$ace:pr-create`'s resolver, which
  hard-codes `origin`. The first non-empty answer wins; empty output, not exit status, means "try the next", but a
  failing `ls-remote` means the remote is unreachable: stop.
  1. `git ls-remote --symref <r> HEAD`: the `ref: refs/heads/<db>` line ending in `HEAD`
  2. `git symbolic-ref -q refs/remotes/<r>/HEAD`, the `refs/remotes/<r>/` prefix removed as a literal string
  3. `gh repo view <OWNER/REPO from r's URL> --json defaultBranchRef --jq .defaultBranchRef.name`, for a GitHub URL
  4. exactly one of `refs/remotes/<r>/main` and `refs/remotes/<r>/master`

  All empty: stop.
- **Counterpart `<dst>`:** the upstream branch when its remote is `<r>`, else the local name. An upstream that is
  `<db>` or the `--base` branch -- git's default for a branch created from it -- is ignored for the local name, and the
  report says so. An upstream with a different name: ask -- the local name (recommended), the upstream name, or stop.
- **Probe:** `git ls-remote --exit-code <r> refs/heads/<dst>`, keeping only the line whose ref is exactly
  `refs/heads/<dst>`. Exit 2: absent -- a first push, and the lease is "absent". Exit 0: that line's SHA is the lease
  candidate; with no exact line, absent. Any other exit: stop.
- **Fetch** with forced tracking refspecs, `+refs/heads/<x>:refs/remotes/<r>/<x>`: `<db>`, the counterpart if present,
  and the `--base` branch from its own remote. A failed fetch stops the run. Verify each ref with its own
  `git rev-parse -q --verify '<ref>^{commit}'`; the counterpart must equal the probe -- if not, probe again, and stop
  unless the two then agree.
- **Record literally:** `<db-tip>`; `<base-tip>` (the `--base` tip, else `<db-tip>`); the lease SHA or "absent"; and
  `<base>` = `git merge-base HEAD <base-tip>`. No merge-base: stop.

### 3. Preflight: remote

Stop when:

- the local branch is `<db>` or the `--base` branch, or `<dst>` is either of them
- `<base>..HEAD` holds no commits
- the counterpart's tip is not integrated locally -- reachable neither from HEAD nor from any entry of the branch's own
  reflog. Run `git log -g --format=%H refs/heads/<b> --` alone first (a failure is a stop), then
  `{ echo <lease>; echo ^HEAD; git log -g --format='^%H' refs/heads/<b> --; } | git rev-list --count --stdin`, which
  prints 0 when integrated. Never use the HEAD reflog (it mixes branches) or `--reflog` (it includes the fetched
  tracking ref, so it always passes). An unintegrated tip is someone else's push; a tip the user rewrote away locally
  is still in the reflog and passes. A missing reflog can only cause a false stop -- say so. `--force-if-includes` is
  a no-op beside a pinned lease and is not passed.

When the published part, `<base>..<lease sha>`, holds commits whose mailmapped author email (`%aE`) differs from the
user's (`git config user.email`, mapped with `git check-mailmap`), ask in every mode whether to rewrite and force-push
or stop: others may have built on them. In a dry run, put this in the plan instead of asking.

With the lease absent, skip the integration test and that question.

### 4. Warnings

Report; never ask, except for a reviewed pull request (below):

- review and pr: commits by more than one author -- the user becomes author of every new commit
- merge commits, which the rewrite flattens; rebase drops them, with any change made only in a merge (its gate stops
  the run if that loses content)
- an open pull request on `<dst>` with reviews, which the push makes outdated:
  `gh pr list -R <OWNER/REPO from r's URL> --head <dst> --state open --json number,reviews`. When it returns an open
  pull request with a non-empty `reviews` array, ask whether to continue or stop: the reviewers' comments go outdated,
  and `Restore (remote)` does not undo that. In a dry run, put this in the plan instead of asking. When the URL is not a
  GitHub repository, `gh` is missing, or the call fails, only warn: "pull-request reviews not checked (<reason>)"
- signed commits, whose signatures the rewrite drops -- or re-signs as the user, where commit signing is configured
- a local `<db>` behind `refs/remotes/<r>/<db>`, which `$ace:pr-create` diffs against
- `<dst>` is not the configured upstream (when that is neither `<db>` nor the `--base` branch): the upstream branch
  keeps the old commits and any pull request open on it

### 5. Plan

- **Message convention** (review and pr): a commit-msg hook (`git rev-parse --git-path hooks`) or commit-lint
  configuration, then `commit.template`, then recent non-merge subjects on `<db-tip>`. Inferred now so the plan shows
  final subjects. Never copy a host-appended suffix such as `(#12)`.
- **The mode's plan:** read only the chosen mode's reference and follow it --
  `../branch/references/review.md`, `../branch/references/pr.md`,
  or `../branch/references/rebase.md`.
- **Nothing to do:** nothing to rewrite (the mode defines it), and the counterpart equals HEAD. Report it and stop, with
  no backup.
- **Nothing to rewrite:** skip step 8 only; every forced push still gets a backup.
- **Collision stop,** when there is something to rewrite: a path the rewrite or a restore may write but HEAD does not
  track exists on disk as an untracked or ignored file, link, or directory -- or one of its leading directories that
  HEAD does not track exists as a file or link. Git treats ignored files as expendable, so name the paths and stop.
  Compute with `--no-renames`, so rename sources count:
  - review and pr: paths tracked at the base (pr: the regroup base) and absent from HEAD
  - rebase: paths tracked at `<base-tip>`, or touched by any commit in `<base>..HEAD`, and absent from HEAD

### 6. Dry run

With `--dry-run`, print the plan and stop: only remote-tracking refs moved; no branch, backup, or push changed.

### 7. Backup

First re-check, since questions and the fetch left time for the user to act: HEAD is still `refs/heads/<b>` at
`<orig>`, the clean test passes, no operation is in progress, and nothing exists at `<marker>`. Otherwise stop:
nothing has changed yet.

- **Name** `branch-backup/<b>/<date -u +%Y%m%dT%H%M%SZ>`. Validate with `git check-ref-format --branch`, then
  `git branch <name> <orig>` -- never `-f`. Any failure, a same-second collision included, is a stop.
- **Remote tip:** when a lease exists and is not an ancestor of `<orig>` (the branch was rebased by hand, or a rebase
  was left local), also create `<name>-remote` at the lease SHA, so the tip about to be overwritten keeps a ref.
- **`--push-backup`:** push each create-only, never with `-u`:
  `git push --porcelain --force-with-lease=refs/heads/<name>: <r> refs/heads/<name>:refs/heads/<name>` (the empty
  expected value means the ref must not exist). A failure stops before rewriting; the report uses the full template
  with `Plan: failed at step 7` and names every backup made, local and remote.
- **Marker:** write `key=value` lines -- `backup` (and `backup-remote`), `orig`, `branch`, `mode`, `remote`, `dst`,
  `lease`, `base` -- to a temporary file beside `<marker>` (create its directory), then `mv` it there. If that fails,
  or `<marker>` is then not a file, stop before rewriting and report as for a failed `--push-backup`.
- **Announce** the backup names and the recovery for each state (Failure and interruption) before rewriting; repeat
  them in every later question.
- The skill never deletes a backup.

### 8. Rewrite

Per the mode's reference. For every commit:

- Hooks run normally: never `--no-verify` or `-n`, never `-S` or `--no-gpg-sign`.
- No message line starts with the comment character (`commit.cleanup=strip` drops it); carry no hook-generated
  per-commit identifiers from the originals. Layout: the body, then (review) the `Absorbed:` paragraph, then issue
  references, then the trailer block last, so `git interpret-trailers --parse` reads every trailer.
- Review and pr: one `Co-authored-by: <name> <email>` trailer per other author (matched by mailmapped email) whose
  replaced commits touched a path in this commit, deduplicated with trailers carried from the originals.
- Review and pr, immediately after the commit, before the next one: `git diff-tree -r --no-renames --name-only` shows
  HEAD differing from the base (pr: the regroup base) in exactly the paths planned so far, and from `<orig>` in exactly
  the rest; and the stored message still carries its planned references and trailers. Otherwise stop rewriting:
  Failure.

### 9. Gate

Review and pr -- both must hold:

1. `HEAD^{tree}` equals `<orig>^{tree}`. A hook that rewrites content trips this: report it, never bypass it.
2. The tracked working tree is clean.

Rebase has its own gate (rebase.md).

### 10. Push

`<new>` is the SHA the gate passed on. If HEAD is no longer `refs/heads/<b>` at `<new>`, the user moved it: stop
without restoring, keep the branch, backup, and marker, and report `Push: stopped: branch moved during the run`.
Otherwise add `new=<new>` to the marker.

```
git push --porcelain --no-follow-tags --force-with-lease=refs/heads/<dst>:<lease sha> <r> refs/heads/<b>:refs/heads/<dst>
```

- No counterpart: the empty expected value (`--force-with-lease=refs/heads/<dst>:`) plus `-u`, so the upstream is set
  for `$ace:pr-create`; when that replaces an existing upstream, the report says so.
- Never `+`, `--force`, or `--mirror`; never fall back to them. A bare `--force-with-lease` passes once a background
  fetch moves the tracking ref; the pinned SHA does not.
- Read the exit status and the porcelain line for `refs/heads/<dst>` (`=` is up to date; `!` -- a stale lease or a
  server-side rejection -- is Failure, with its reason reported; a non-zero exit with no porcelain line, as a declining
  local pre-push hook gives, is also Failure). If the outcome is unclear after the push exits, check
  `git ls-remote <r> refs/heads/<dst>` (exact ref): the new HEAD -- it landed; the lease SHA, or nothing when the
  lease was absent -- it did not (Failure); anything else or an error -- neither restore nor push again: keep the
  branch, backup, and marker, and report `Push: outcome unknown` with both SHAs, both restore lines, and the marker's
  delete command.
- Once it lands, delete the marker, and any directories it leaves empty under `branch-rewrite-in-progress`.

### 11. Report

```
$ace:branch <mode>: <b> -> <r>/<dst>
Base: <short sha> (merge-base with <remote>/<branch> at <short tip>, before the rewrite)
Plan: <rewritten | nothing to rewrite | failed at step <n>: <reason>>
Commits:
  <short sha> <subject> (<n> paths)
<the mode's report block>
Warnings: <each, or none>
Push: <forced update | new branch, upstream set | up to date | rejected: <reason> | blocked: <reason> | stopped: <reason> | not attempted | outcome unknown>
Backup: <names> (<k> backups of <b>; delete older: <git branch -D <names> | none>)
Restore (local): git reset --keep refs/heads/<backup>
Restore (remote): git push --force-with-lease=refs/heads/<dst>:<new sha> <r> <lease sha>:refs/heads/<dst>
Next: <the mode's next step>
```

- Path counts use `--no-renames`, so a rename counts twice. Empty lists read "none".
- Backups of `<b>` are the refs named `branch-backup/<b>/<timestamp>` with an optional `-remote`, `-rebased`, or
  `-interrupted` suffix, so a branch whose name extends `<b>` is not counted. The delete list never includes a backup
  holding the lease SHA, one that served as rebase mode's pre-rebase reference, or a `-rebased` or `-interrupted` one.
- `Restore (local)` runs on `<b>` and refuses rather than overwrite local edits. `Restore (remote)` returns the remote
  to its pre-run tip and appears only when a push landed; after a first push it is a leased delete,
  `git push --force-with-lease=refs/heads/<dst>:<new sha> <r> :refs/heads/<dst>`.
- Next, review: `$ace:agent-code-review commit <full sha>` on the commit holding the in-scope files (the second, or the
  only one when nothing was excluded), with trailing text saying the first commit holds the excluded files. Only an
  empty in-scope group means nothing needs review. Add that a pull request needs `$ace:branch pr` before
  `$ace:pr-create`: one described from the two review commits says little. pr: `$ace:pr-create`; with `--base`, note
  that it targets the default branch and builds the description from the commits and diff since it, so the parent
  branch's commits are included: edit the description and set the pull request's base by hand, or create it with
  `gh pr create --base <branch>` instead. rebase: `$ace:branch review`, `$ace:branch pr`, or carry on. Every
  `$ace:branch` command here carries the same `--base` (Usage).
- A stop before the backup reports only `$ace:branch <mode>: <b> -- stopped at step <n>: <reasons>`, what moved (at most
  remote-tracking refs), and what the user can do. A dry run reports the header, `Base:`, the plan, `Warnings:`,
  and "nothing changed". A failure after the backup uses the full template.

## Failure and interruption

**Failure** -- a hook, a check, the gate, or a rejected lease after the backup: restore, then push nothing further.
First check HEAD is `refs/heads/<b>`, or detached by this run's own rebase in progress; if it is neither, the user
moved it: reset nothing, keep the marker, and report.

- Review and pr: `git reset -q <orig>` (mixed; writes no files). Then `git update-index -q --refresh` and list
  `git diff-files --name-only -z`: these differ from the original -- hook edits, or the user's own. When the list is
  not empty, first save them with plumbing, which no diff setting alters, under `set -C` so nothing is overwritten:
  `git diff-files -p --binary > "<common>/branch-rewrite-saved-<backup timestamp>.patch"`.
  Check it with `git apply --check -R <file>`; if the check fails, stop and keep the marker. Add `saved=<file>` to the
  marker and name the file in the report, then restore those paths with
  `git --literal-pathspecs restore --source=<orig> --worktree --pathspec-from-file=- --pathspec-file-nul`.
- Rebase: when the run has completed at least one conflicted pick, first keep the resolutions as
  `git branch <backup>-rebased HEAD` (unless that ref exists). Then, with a rebase in progress, `git rebase --abort`;
  if the branch is still not at `<orig>`, `git reset --keep <orig>`. If that refuses, save the
  `git diff-files --name-only -z` paths as above, restore them from the index (`restore --worktree` without
  `--source`), and retry once; else stop and report, keeping the marker. Never `--hard`.
- Verify `refs/heads/<b>` equals `<orig>` and the tracked tree is clean; if not, keep the marker and print the recovery.
  Otherwise delete the marker and report what failed with the backup and the local restore line. A rejected lease means
  someone pushed meanwhile: the user integrates their work and reruns.
- The exception: rebase mode's failing project checks block the push without restoring (rebase.md).

**Interruption** -- the session ends mid-run or while a question waits. The marker remains, so the next run stops at
step 1 and prints this recovery as literal commands, with the marker's values filled in (no `orig`: the newest
`branch-backup/<b>/<timestamp>` without a suffix), for the user to run in order. They start with
`cd <absolute top level>` (`git rev-parse --show-toplevel`), since the user may be in a subdirectory:

1. If a git process may still be running, wait; a lock file left by the killed run (`index.lock`, a ref's `.lock`)
   may be removed once none is. A `saved=` line names a patch holding edits a restore set aside: keep it.
2. A rebase in progress: only when the marker says `mode=rebase`, the rebase's `head-name` (under
   `git rev-parse --git-path rebase-merge`) is `refs/heads/<b>`, and its `orig-head` is `<orig>` -- first, if HEAD
   differs from the rebase's `onto`, `git branch <backup>-interrupted HEAD`; then `git rebase --abort` (unstaged
   resolutions are lost). Otherwise the rebase is the user's own: stop until they finish or abort it.
3. `<b>` must be checked out; if another branch is, `git switch <b>` only when the tracked tree is clean, else stop.
4. When the marker has `new`: with `lease=absent`, `git ls-remote --exit-code <r> refs/heads/<dst>` first -- exit 2
   means the first push never landed: go to item 5 (the restore). Otherwise `git fetch <r> refs/heads/<dst>` (without
   touching local branches); if it fails, stop and keep the marker. If `FETCH_HEAD` is `new` or descends from it
   (`git merge-base --is-ancestor <new> FETCH_HEAD`), the push landed: only delete the marker.
5. If HEAD is not `<orig>`, keep it -- `git branch <backup>-interrupted HEAD`, unless that ref exists -- and list
   `git log --format='%H %s' <orig>..HEAD`. Then restore as under Failure: review or pr -- mixed reset, saved and
   checked patch, restore; rebase -- `git reset --keep <orig>`, with the same fallback. List any file `git status`
   shows that `<orig>` does not track; never delete it.
6. Delete the marker, `rm <marker>`, and any directories it leaves empty under `branch-rewrite-in-progress`.

Git 2.25.1 or later (`--pathspec-from-file` for `restore`, and its 2.25.1 fix). Newer features are optional, each with
its fallback where used: `git merge-tree --write-tree` and `git grep -m` (2.38), `git check-attr --source` (2.40).
