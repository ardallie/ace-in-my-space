# Mode: pr

Read at step 5 of the run in `../git-branch/SKILL.md`, which this file does not restate.
Purpose: a history a pull-request reviewer can read commit by commit, ready for `$ace:pr-create`.

## Plan

Work from metadata: messages, authors, trailers, paths, and line counts. Read a capped diff only to settle an open
question, never whole files.

1. **Evidence.** For each non-merge original in `<base>..HEAD`, oldest first: its message, mailmapped author email,
   trailers, issue references, and changed paths with line counts.
2. **Keep.** An original is sound when it is not a merge; is intentful -- its subject states a change and it is not a
   placeholder (`wip`, `tmp`), a `fixup!`, `squash!`, or `amend!` commit, or a review response; holds one concern;
   needs nothing a later commit adds; and is not fixed up or reverted later on the branch. Style is no defect, nor is
   an exception or merged concern its body names, and doubt counts as sound: rewriting for its own sake churns
   reviewers. Keep the longest run of sound commits that starts on the base.
   - The run spans the branch: nothing to rewrite.
   - Otherwise its tip, or the base when the run is empty, is the **regroup base**.
3. **Net change** from the regroup base to HEAD, renames paired (`git diff-tree -r -M -z --raw --numstat`).
4. **Group whole files, never hunks**, so every new commit holds only file versions that already exist at the regroup
   base or `<orig>`:
   - Each concern that an intentful original holds seeds a group; seeds that share intent merge. With no seeds,
     directory and co-change define the concerns.
   - Each net-changed path joins exactly one group at its `<orig>` version, together with its rename partner and any
     file/directory counterpart.
   - A path several concerns touch goes to the latest of them, decided per path even when most of that file's own
     change belongs to an earlier concern; the receiving commit's body names the change it carries for the earlier
     one. If that strips an earlier concern of most of its change, merge the two and label the result honestly.
   - Followers: a lockfile joins its manifest; generated output, tests, and snapshots join their source; catalogues
     join the concern whose code uses their strings; documentation of one concern joins it, and documentation spanning
     several comes last, in its own commit; any other path follows co-change, else its directory, and is flagged.
   - In place of the Followers rule, a generator whose sources span several concerns forms its own group, the
     generator with all its output, after every group holding a source it reads, its body naming the generator as its
     exception (below); a generator that reads one concern's sources follows that concern.
   - Order: no commit needs what a later commit adds or uses what an earlier one removes; dependencies and refactors
     come before the behaviour changes that use them; otherwise a group sits where its earliest original did.
   - A refactor, documentation, dependency, or generated commit holds only that kind of change, or names its
     exceptions in its body.
   - Fold empty groups. The count follows the change: a small branch may become a single commit.
5. **Coverage.** Stop before the backup unless the groups partition the net change, and every issue reference and
   trailer from the originals is placed or listed as dropped.

The plan shows the verdict (kept, or rewrite, with the defects found), coverage as N/N paths, references, and
trailers, and for each new commit: subject, why, paths, the originals it draws on, references, trailers, and flags.

## Messages

- Say why as well as what, from the originals' wording and from capped diffs. Claim nothing neither shows, and cite
  no old SHA, review or report ID, or bare finding number whose meaning depended on the original commit. Keep a
  version claim (`bump to x.y.z`) only when a version file is in the commit's paths. Where no original gives a reason,
  state only what changed.
- Carry issue references and credit trailers -- `Co-authored-by`, `Signed-off-by`, `Reviewed-by`, `Acked-by`,
  `Tested-by`, `Reported-by`, `Helped-by` -- deduplicated, to each new commit that holds a path their original
  touched; issue references sit in a paragraph before the trailer block. Any other line parsed as a trailer that is
  not an issue reference (`Deferred:`, for example) is listed as dropped, never carried. A closing keyword
  ("Closes #12") goes only on the last such commit; earlier ones carry the plain reference.
- An original whose content dropped out entirely passes its plain references to the last commit; its trailers are
  listed as dropped, never carried, because a sign-off on absent content would certify nothing.

## Rewrite

1. `git reset -q <regroup base>` (mixed: the branch and index move; the working tree does not).
2. For each group in order: stage its paths from `<orig>` --
   `git --literal-pathspecs restore --source=<orig> --staged --pathspec-from-file=- --pathspec-file-nul`, which also
   stages deletions -- then commit. Step 8's per-commit check runs after each.

Intermediate commits are not built; there is no stack-agnostic way to build each one. Step 8 checks every commit
against the plan, and the step-9 gate checks the final tree against `<orig>`.

## Report block

```
Old -> new:
  <old sha> <old subject> -> <new sha>[, <new sha>]
Same tree as an original: <new sha> = <old sha>
Coverage: <n>/<n> paths (--no-renames), <n>/<n> references, <n>/<n> trailers (dropped: <list or none>)
Intermediate commits not built.
```

`Old -> new` maps each replaced original `<o>` to every new commit whose paths
(`git diff-tree -r --no-renames --name-only -z <new>^ <new>`) meet its own
(`git diff-tree -r --no-renames --name-only -z <o>^ <o>`).

A rerun of pr mode on its own output finds nothing to rewrite, then nothing to do.
