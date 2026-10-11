# Mode: pr

Read at step 5 of the run in `../branch/SKILL.md`, which this file does not restate. Purpose:
a history a pull-request reviewer can read commit by commit, ready for `$ace:pr-create`.

## Plan

Work from metadata: messages, authors, trailers, paths, and line counts. Read a capped diff only to settle an open
question, never whole files.

1. **Evidence.** For each non-merge original in `<base>..HEAD`, oldest first: its message, mailmapped author email,
   trailers, issue references, and changed paths with line counts. A commit whose body carries an `Absorbed:` list
   (written by review mode) stands for the originals it lists: resolve their SHAs where a backup still holds them, and
   otherwise use the list as hints.
2. **Keep.** An original is sound when it is not a merge; was not written by review mode (no `Absorbed:` list, no
   list of excluded files); is intentful -- its subject states a change and it is not a placeholder (`wip`, `tmp`), a
   `fixup!`, `squash!`, or `amend!` commit, or a review response; holds one concern; needs nothing a later commit adds;
   and is not fixed up or reverted later on the branch. Style alone is no defect, and doubt counts as sound: rewriting
   for its own sake churns reviewers. Keep the longest run of sound commits that starts on the base.
   - The run spans the branch: nothing to rewrite.
   - Otherwise its tip, or the base when the run is empty, is the **regroup base**.
3. **Net change** from the regroup base to HEAD, renames paired (`git diff-tree -r -M -z --raw --numstat`).
4. **Group whole files, never hunks**, so every new commit holds only file versions that already exist at the regroup
   base or the backup:
   - Each concern that an intentful original holds seeds a group; seeds that share intent merge. With no seeds,
     directory and co-change define the concerns.
   - Each net-changed path joins exactly one group at its backup version, together with its rename partner and any
     file/directory counterpart.
   - A path several concerns touch goes to the latest of them. If that strips an earlier concern of most of its
     change, merge the two and label the result honestly.
   - Followers: a lockfile joins its manifest; generated output, tests, snapshots, and catalogues join their source;
     documentation spanning several concerns comes last, in its own commit; any other path follows co-change, else its
     directory, and is flagged.
   - Order: no commit needs what a later commit adds or uses what an earlier one removes; dependencies and refactors
     come before the behaviour changes that use them; otherwise keep the original order.
   - A refactor, documentation, dependency, or generated commit holds only that kind of change, or names its
     exceptions in its body.
   - Fold empty groups. The count follows the change: a small branch may become a single commit.
5. **Coverage.** Stop before the backup unless the groups partition the net change, and every issue reference and
   trailer from the originals is placed or listed as dropped.

The plan shows the verdict (kept, or rewrite, with the defects found), coverage as N/N paths, references, and
trailers, and for each new commit: subject, why, paths, the originals it draws on, references, trailers, and flags.

## Messages

- Say why as well as what, from the originals' own wording and evidence. Invent nothing, and cite no old SHA.
- Carry issue references and trailers (`Co-authored-by`, `Signed-off-by`, and their kind), deduplicated, to each new
  commit that holds a path their original touched. A closing keyword ("Closes #12") goes only on the last such commit;
  earlier ones carry the plain reference.
- An original whose content dropped out entirely passes its plain references to the last commit; its trailers are
  listed as dropped, never carried, because a sign-off on absent content would certify nothing.

## Rewrite

1. `git reset -q <regroup base>` (mixed: the branch and index move; the working tree does not).
2. For each group in order: stage its paths from the backup --
   `git --literal-pathspecs restore --source=<backup> --staged --pathspec-from-file=- --pathspec-file-nul`, which also
   stages deletions -- then commit.

Intermediate commits are not built; there is no stack-agnostic way to build each one. The run's gate checks every
commit against the plan and the final tree against the backup.

## Report block

```
Old -> new:
  <old sha> <old subject> -> <new sha>[, <new sha>]
Same tree as an original: <new sha> = <old sha>
Coverage: <n>/<n> paths, <n>/<n> references, <n>/<n> trailers (dropped: <list>)
Intermediate commits not built.
```

A rerun of pr mode on its own output finds nothing to rewrite, then nothing to do.
