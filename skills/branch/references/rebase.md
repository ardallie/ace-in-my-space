# Mode: rebase

Read at step 5 of the run in `${CLAUDE_PLUGIN_ROOT}/skills/branch/SKILL.md`, which this file does not restate. Purpose:
replay the current branch, from where it stands, onto `<base-tip>` -- the freshly fetched default branch, or the
`--base` branch -- with conflicts resolved. The default branch is never checked out, and the original authors are
kept.

## Plan

- The commits to replay: `<base>..HEAD` without merges, oldest first, onto the pinned `<base-tip>` SHA. Commits whose
  change is already upstream will be dropped; list them.
- Collision paths for the run's step 5: tracked at `<base-tip>`, or touched by any commit in `<base>..HEAD`
  (`git log --no-renames --format= --name-only`), and absent from HEAD.
- With `--dry-run`, add predicted conflicts from `git merge-tree --write-tree --name-only <base-tip> HEAD` (exit 1
  means conflicts), labelled a prediction: it merges the net change, so a commit-by-commit replay can differ. Before
  git 2.38, print "conflicts not predicted".
- **Nothing to rewrite** when `<base-tip>` is already the merge-base and the range holds no merges -- for example a
  rerun after the push was blocked by a failing check and the user committed a fix.

## Replay

```
GIT_EDITOR=true git -c rebase.updateRefs=false -c rebase.rebaseMerges=false -c rebase.autoStash=false \
  -c rerere.autoUpdate=false rebase --merge <base-tip sha>
```

- Pass the literal SHA, never the tracking ref name a background fetch could move, and repeat the same `-c` settings
  on every `--continue`. `rebase.updateRefs` would otherwise force-move the backup, which points at a commit being
  rebased; older git ignores keys it does not know. `--merge` keeps the merge backend: the apply backend can place a
  hunk wrongly without reporting a conflict.
- After the rebase, check that the backup's SHA is unchanged.
- Hooks are not suppressed, but git does not run pre-commit or commit-msg on replayed commits.

## Conflicts

- **Resolve real conflicts only**, keeping both sides' intent. Before `git add` on a resolved file, check that no
  conflict marker remains in it; then continue.
- **Generated files and lockfiles:** regenerate them with the command the repository documents; when none is known,
  ask.
- **Ambiguous intent** -- a semantic conflict, not just a textual one: both sides changing the same behaviour
  differently, a delete against a modify, a rename against an edit with no clear target. Stop and ask, with the rebase
  left in progress. The question states the backup name and the exact way back (`git rebase --abort`, then
  `git reset --keep <backup>` if the branch is not at the backup), so the user has it even if the session ends. Offer
  the proposed resolution, an alternative where one exists, and "abort and restore". Any outcome other than
  completing the rebase aborts it and restores the backup.
- **rerere:** where the repository already records resolutions, report each one rerere reused and verify it like your
  own. Never enable rerere: that would create `rr-cache` and switch it on for the repository.
- **The same conflict, commit after commit:** ask whether to continue or to abort and restore. Abort suggests
  `/ace:branch review` first, which collapses the branch to two commits, then `/ace:branch rebase`, then
  `/ace:branch pr`.

## Gate

There is no content invariant: content changes on purpose.

1. **Conflict markers.** No line added in `<base-tip>..HEAD` starts with seven `<`, `>`, or `|` followed by a space or
   the end of the line; a bare `=======` counts only between such lines. `--checks skip` never skips this.
2. **Project checks** at the `--checks` tier, default `cheap`. The tiers and the record grammar are those of
   `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/verification-checks.md` (Tiers; Degradation); its team, spawn, and
   `--prior` clauses do not apply here. Discover the checks yourself: read the CI definitions and the scripts or
   targets the repository defines; for `cheap`, keep compile or typecheck and fast consistency scripts, preferring the
   project-wide typecheck, since upstream changes can break callers outside the branch's own diff. Record the derived
   list, and run it at the rebased HEAD in the working tree. A check that changes tracked files counts as failing.
   Nothing discovered is recorded as `cheap -- no gate resolved` with a warning that the rebase is unverified -- never
   as a pass. `skip` is recorded as `skipped by flag`.
3. **What the rebase changed** in the branch's own patches:
   `git --no-pager range-diff --no-color <base> <backup> HEAD`, printed in the report unparsed, so every conflict
   resolution can be reviewed. Dropped commits show as `<` lines.

## Failing checks or markers

Block the push, and do not restore: the rebased branch stays local and unpushed as the user's starting point for a
fix. Delete the run's marker. The report shows the failing command or the marker locations, the backup, and the local
restore line, and tells the user to commit or discard any change a check made before rerunning. From there:

- fix, commit, and rerun `/ace:branch rebase`: nothing is left to rewrite, the gate runs again, and the push goes out
  under a lease pinned to the remote's pre-rebase tip, which the branch's reflog still reaches
- or rerun with `--checks skip` to push as it is; conflict markers are still checked

A failure of anything else -- a hook, the backup check, a rejected lease -- follows the run's Failure section.

## Report block

```
Replayed: <n> commits onto <remote>/<branch> at <short tip>; dropped: <list or none>
Conflicts: <path -- how resolved, or none>; rerere reused: <list or none>
Gate: markers <clean | found: ...>; checks <record per verification-checks.md>
Range-diff:
  <git range-diff output>
```
