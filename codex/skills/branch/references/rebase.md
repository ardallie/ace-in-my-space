# Mode: rebase

Read at step 5 of the run in `../branch/SKILL.md`, which this file does not restate. Purpose:
replay the current branch, from where it stands, onto `<base-tip>` -- the freshly fetched default branch, or the
`--base` branch -- with conflicts resolved. The default branch is never checked out, and the original authors and
messages are kept.

## Plan

- The commits to replay: `<base>..HEAD` without merges, oldest first, onto the pinned `<base-tip>` SHA. Commits whose
  change is already upstream will be dropped (`git cherry <base-tip> HEAD <base>` marks them `-`); list them.
- With `--dry-run`, add predicted conflicts from `git merge-tree --write-tree --name-only <base-tip> HEAD` (exit 1
  means conflicts), labelled a prediction: it merges the net change, so a commit-by-commit replay can differ. Before
  git 2.38, print "conflicts not predicted".
- **Nothing to rewrite** when `<base-tip>` is already the merge-base and the range holds no merges -- for example a
  rerun after the push was blocked by the gate and the user committed a fix.

## Replay

```
GIT_EDITOR=true git -c rebase.updateRefs=false -c rebase.rebaseMerges=false -c rebase.autoStash=false \
  -c rerere.autoUpdate=false -c commit.cleanup=scissors rebase --merge <base-tip sha>
```

- Pass the literal SHA, never the tracking ref name a background fetch could move, and repeat the same `-c` settings
  on every `--continue`. `rebase.updateRefs` would otherwise force-move the backup, which points at a commit being
  rebased; `commit.cleanup=scissors` keeps message lines that start with `#` through a conflicted pick; older git
  ignores keys it does not know. `--merge` keeps the merge backend: the apply backend can place a hunk wrongly without
  reporting a conflict.
- After the rebase, the backup must still point at `<orig>`. If it moved, put it back with
  `git update-ref refs/heads/<backup> <orig> <moved sha>`, then go to Failure.
- Hooks are not suppressed. On replayed commits git runs prepare-commit-msg and post-rewrite, but not pre-commit or
  commit-msg. A pre-rebase hook that refuses leaves no rebase in progress: verify the branch is still at `<orig>`,
  report, and delete the marker.

## Conflicts

- **Resolve real conflicts only**, keeping both sides' intent. Stage only the paths `git diff-files --name-only -z
  --diff-filter=U` lists, plus any file you regenerated, with `git --literal-pathspecs add --pathspec-from-file=-
  --pathspec-file-nul` -- never `git add -A` or `.` -- after checking that no conflict marker remains in them; then
  continue.
- **Generated files and lockfiles:** regenerate them with the command the repository documents, after resolving their
  sources. When no command is known, ask: take the upstream version
  (`git --literal-pathspecs checkout --ours -- <path>`: during a rebase "ours" is upstream), with the report telling
  the user to regenerate and commit; keep the branch's version (`git --literal-pathspecs checkout --theirs -- <path>`);
  or abort and restore.
- **Ambiguous intent** -- a semantic conflict, not just a textual one: both sides changing the same behaviour
  differently, a delete against a modify, a rename against an edit with no clear target. Stop and ask, with the rebase
  left in progress. The question states the backup name and the exact way back (`git rebase --abort`, which returns the
  branch to `<orig>`, then deleting `<marker>`), so the user has it even if the session ends. Offer the proposed
  resolution, an alternative where one exists, and "abort and restore". Any outcome other than completing the rebase
  aborts it: restore per the run's Failure section and report `Plan: failed at step 8: aborted at <commit>` with
  `Push: not attempted`.
- **rerere:** where the repository already records resolutions, report each one rerere reused and verify it like your
  own. Never enable rerere: that would create `rr-cache` and switch it on for the repository.
- **The same path conflicting in three or more commits:** ask whether to continue or to abort and restore. Abort
  suggests `$ace:branch review` first, which collapses the branch to two commits, then `$ace:branch rebase`, then
  `$ace:branch pr`, each with the same `--base`.

## Gate

There is no content invariant: content changes on purpose. `<pre>` names the pre-rebase commits the push replaces:
`<orig>` when this run replays; with nothing to rewrite, the `-remote` backup, else the newest backup of `<b>` (no
suffix) that is not an ancestor of HEAD, else none. `<old base>` is the merge-base of `<pre>` and `<base-tip>`.

1. **Conflict markers.** In `git diff-tree -r -p --text --no-textconv --no-ext-diff <base-tip> HEAD`, and in each
   replayed commit's own diff, with carriage returns stripped (`tr -d '\r'`), no added line matches
   `^\+(<{7,}|>{7,}|\|{7,})( |$)` or `^\+={7,}$` (`grep -a -E`) -- unless `<old base>..<pre>`, scanned the same
   way, already added that line. `--checks skip` never skips this. With no `<pre>`, nothing is exempt: ask the user to
   confirm marker-like lines the branch adds on purpose (test fixtures, documentation) before failing.
2. **Content,** when this run replayed: every path where HEAD differs from `<pre>`
   (`git diff-tree -r --no-renames --name-only <pre> HEAD`) is one upstream changed in `<old base>..<base-tip>` --
   either side of a rename there, or a path under a directory it renamed. A resolution never adds a file the branch
   did not touch, and nothing the branch had -- a merge commit's own changes included -- is lost outside what upstream
   changed.
3. **Commits and messages,** when this run replayed: pair each replayed commit with its original as range-diff pairs
   them. When a resolution changes a patch too much for range-diff to match, it prints the original as a `<` line and
   the replay as a `>` line; pair such leftovers by subject, then by replay order, leaving out the originals
   `git cherry` marked as upstream. Each replayed commit keeps every line of its original's message, in order, compared after
   `git stripspace`; lines a prepare-commit-msg hook added are reported, not failed. An original left unpaired is
   dropped: expected when `git cherry` marked it; otherwise it became empty during resolution -- name it, and ask
   whether to accept the drop or abort and restore.
4. **Project checks** at the `--checks` tier, default `cheap`. The tiers and the record grammar are those of
   `../agent-shared/verification-checks.md` (Tiers; Degradation); its team, spawn, `--prior`,
   and no-compile-surface clauses do not apply here. Discover the checks yourself: read the CI definitions and the
   scripts or targets the repository defines; for `cheap`, keep compile or typecheck and fast consistency scripts,
   preferring the project-wide typecheck, since upstream changes can break callers outside the branch's own diff.
   Record the derived list, and run it at the rebased HEAD in the working tree. A check that changes tracked files
   counts as failing. Nothing discovered is recorded as `<tier> -- no gate resolved` with a warning that the rebase is
   unverified -- never as a pass -- and the push goes ahead. `skip` is recorded as `skipped by flag`.
5. **What the rebase changed** in the branch's own patches, when `<pre>` exists: `git --no-pager range-diff
   --no-color <old base>..<pre> <base-tip>..HEAD`, printed in the report unparsed, so every conflict resolution can be
   reviewed. A `<` line alone does not mean a drop; gate 3 decides which originals were dropped.

## Gate failures

Gates 1-3 catch the run's own resolution errors: their failure follows the run's Failure section, which restores
`<orig>` and keeps the rebased result as `<backup>-rebased` for inspection; the report names the markers, content, or
messages. A rerun replays again from the original. When nothing was replayed, a gate 1 failure restores nothing: HEAD
is still `<orig>`. Delete the marker and report with the full template (`Plan: failed at step 9: markers in <paths>`,
`Push: not attempted`); the lines are the user's own, and a rerun fails until they are fixed.

Failing project checks (gate 4) block the push without restoring: the rebased branch stays local and unpushed as the
user's starting point for a fix. Delete the run's marker. The report shows `Push: blocked: <reason>`, the failing
command, the backup, and the local restore line, and tells the user to commit or discard any change a check made before
rerunning, and not to `git pull`, which would merge the pre-rebase commits back. From there:

- fix, commit, and rerun `$ace:branch rebase` with the same `--base`: nothing is left to rewrite, gates 1, 4 and 5 run
  again, and the push goes out under a lease pinned to the remote's pre-rebase tip, which the branch's reflog still
  reaches
- or rerun with `--checks skip` and the same `--base` to push without the project checks; gate 1 still runs

Anything else -- a hook, the backup check, a rejected lease -- also follows the run's Failure section.

## Report block

```
Replayed: <n> commits onto <remote>/<branch> at <short tip>; dropped: <originals gate 3 left unpaired, or none>
Before the rebase: git reset --keep refs/heads/<pre backup>      (when <pre> is an earlier backup)
Conflicts: <path -- how resolved, or none>; rerere reused: <list or none>
Gate: markers <clean | found: ...>; content <clean | outside upstream's changes: ...>;
  messages <unchanged | changed: ...>; checks <record>
Range-diff:
  <git range-diff output>
```
