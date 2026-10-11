# Mode: review

Read at step 5 of the run in `../branch/SKILL.md`, which this file does not restate. Purpose:
let a reviewer -- a person, or `$ace:agent-code-review commit <sha>` -- read only the changes that need judgement.

## Result

- On the base, commit 1 holds the files out of review scope; commit 2, its child, holds everything else. When either
  group is empty, make one commit. Neither is a merge, so `git show` of the in-scope commit is exactly the in-scope
  diff.
- Commit 1 is the base plus the excluded paths taken from `<orig>`; commit 2 is `<orig>`'s whole tree. A path the
  classification never saw therefore lands in review, never in commit 1.
- Each message states plainly which group it holds, in the repository's convention. Commit 1's body lists the excluded
  paths with their reasons, grouped by family and directory, under a line reading exactly `Excluded from review:`,
  which pr mode matches; there, and only there, a directory whose changed files all share one reason may collapse to
  one line. Pull-request reviewers see the commits, not the run's report.
- The last commit's body carries an `Absorbed:` paragraph, one line per replaced original: its full SHA, its subject,
  and then ` -- ` and its issue references, if any. It precedes the issue references and the trailer block (step 8).
  pr mode reads that list later, so the history collapsed here is not lost. Each original's trailers -- hook-generated
  identifiers aside (step 8) -- are carried, deduplicated, as real trailers on every new commit holding a path that
  original touched.

## Plan: classify by role, not extension

The same extension can fall on either side: markdown is often documentation, but in a repository of prompts or
specifications it is the product; generated code can look hand-written. Doubt resolves toward review scope: hiding
code from review is the costly error, and an extra file in the review commit is cheap.

**Gather once,** batched, from the base and HEAD objects -- never the working tree. Cost scales with the file count, not
file size: never read whole files and never pass every file through a model.

- `git diff-tree -r -M -z --raw --numstat <base> HEAD` -- status, renames, modes, line counts, and binaries (`-`
  counts). If git warns that rename detection was skipped, rerun with `-l0`.
- One `GIT_ATTR_NOSYSTEM=1 git check-attr --cached --stdin -z` pass for `linguist-generated`, `gitlab-generated`,
  `linguist-vendored`, and `linguist-documentation`. `--cached` is sound because the index equals HEAD after the clean
  preflight; the system attributes file is ignored because it is not the project's.
- The tree listing at HEAD (`git ls-tree -r -l -z`) for sizes and siblings.
- `git grep -I -n -i -E` with one alternation (separate `-e` patterns can stall on large files), for example
  `'generated|do not (edit|modify)|^[[:space:]]*(name|description):|^version https://git-lfs|sourceMappingURL|snapshot v[0-9]'`,
  once over the changed paths at HEAD and once over deleted paths and rename sources at the base. Keep only hits on
  lines 1-10; `-m` (git 2.38) is an optional per-file cap, not a line window.

**Decide** each file by its new path (a deletion by its old path, with base evidence). The first matching rule wins:

1. **In -- pinned.** An attribute above explicitly unset or `false`; a mode, type, symlink, or submodule change; git
   dotfiles (`.gitattributes`, `.gitignore`); manifests; build, CI, and tool configuration; tests (by basename, or a
   test segment in the path), with their helpers and fixtures but not recorded snapshots. A generated test leaves only
   on a generated attribute; otherwise it stays in, flagged.
2. **Out -- strong evidence.**
   - `linguist-generated` or `gitlab-generated` set, or a marker declaring the whole file generated: both "generated"
     and "do not edit" (or "do not modify") within lines 1-10, or an `@generated`-style tag, with every earlier line
     blank or starting with a non-alphanumeric character after indentation. Either counts only when the range also
     changes what plausibly regenerates the file -- its source, schema, generator, or the generator's configuration.
     Otherwise keep it in, flagged, and warn: generated output changed without its source.
   - A lockfile by exact well-known name (`package-lock.json`, `yarn.lock`, `Cargo.lock`, `go.sum`, `poetry.lock`,
     `Gemfile.lock`, `composer.lock`, and their kind) whose manifest changed in, above, or below its directory. An
     unpaired lockfile stays in, flagged, and is the first warning.
   - Binary media and fonts: `-` numstat counts, or an LFS pointer, on a media or font extension. Other binaries stay
     in, flagged.
3. **Out -- corroborated.** Two signals of different kinds that name the same role:
   - path: a documentation, vendored, build-output, generated, or snapshot segment, or a project-prose name
   - name: a prose extension, `.min.`, a snapshot suffix, or a locale code
   - content: a snapshot header, a source-map reference, or an average line over 500 bytes (blob size from the tree
     listing divided by its `git grep -c ''` line count)
   - attribute: `linguist-vendored` or `linguist-documentation` set
   - set: paths that differ only by locale code, two or more of them coded, whose uncoded source member also changed.
     The source member itself carries no set signal. Locale codes and sets name the translation role

   The build-output, generated, and vendored roles also need rule 2's condition: the range changes their source,
   generator, build configuration, or the manifest that pins them. Otherwise the file stays in, flagged, with the
   warning "output changed without its source".

   Prose is product, not documentation, when it carries `name:` and `description:` front matter, or when more than
   half of the tracked files at HEAD are prose; product prose carries no prose signal. Project-prose names are always
   documentation and are left out of that count.
4. **In -- everything else.** Flag a file that carried one signal or a loose marker phrase.

Closed lists -- anything not listed is not that signal:

- documentation segments: `doc`, `docs`, `documentation`, `.docs`
- test segments: `test`, `tests`, `__tests__`, `spec`, `specs`
- vendored segments: `vendor`, `vendored`, `third_party`, `third-party`, `node_modules`
- build-output segments: `dist`, `build`, `out`
- generated segments: `gen`, `_gen`, `generated`, `__generated__`
- snapshot segments and suffixes: `__snapshots__`, `__screenshots__`, `snapshots`; `.snap`, `.ambr`, `.approved.*`,
  `.verified.*`
- prose extensions: `md`, `markdown`, `rst`, `adoc`, `txt`
- media and font extensions: `png`, `jpg`, `jpeg`, `gif`, `webp`, `ico`, `bmp`, `tif`, `tiff`, `mp3`, `mp4`, `wav`,
  `ogg`, `webm`, `mov`, `pdf`, `woff`, `woff2`, `ttf`, `otf`, `eot`
- locale code: a two-letter language code, optionally with a region (`de`, `pt-BR`, `zh_TW`), as a dot- or
  underscore-delimited token of the file name other than its final extension, or as a whole directory segment
- project-prose names, by stem, case-insensitive: `README`, `CHANGELOG`, `CHANGES`, `LICENSE`, `LICENCE`, `CONTRIBUTING`

Guards:

- **Attributes the branch changes.** When the range changes any `.gitattributes`, an attribute supports exclusion only
  where a separate `GIT_ATTR_NOSYSTEM=1 git check-attr --source=<base> --stdin -z` call agrees -- never combined with
  `--cached`, which silently wins. That needs git 2.40; below it, attributes support no exclusion in such a range.
  Opt-outs always count.
- **Local attribute sources.** Only tracked `.gitattributes` files may support an exclusion. When
  `$(git rev-parse --git-path info/attributes)` or the global attributes file (`core.attributesFile`, by default
  `$XDG_CONFIG_HOME/git/attributes` or `~/.config/git/attributes`) mentions `linguist-` or `gitlab-generated`,
  attributes support opt-outs only, and the report says so.
- **Renames stay whole.** A rename lands in one commit with both sides, classified by its new path; it is out only when
  both paths would be out and it stays in one directory. Otherwise both sides are in. A file replaced by a directory of
  the same name, or the reverse, follows the same rule.
- **Undetected renames.** When renames stay undetected even with `-l0`, an excluded addition that shares a basename
  with a deleted path stays in.

**Nothing to rewrite** when `<base>..HEAD` is free of merges, starts on the base, splits no rename, and is one commit
or two whose first holds only exclusions -- and the last commit holds no file the classification excludes, unless it
is the only commit and is wholly excluded. The messages need not already name their groups.

The plan lists the two groups, every exclusion as `<path> -- <family>: <evidence>`, every flag as
`kept: <path> -- <reason>`, and the warnings.

## Rewrite

1. `git reset -q <base>` (mixed: the branch and index move; the working tree does not).
2. Stage the excluded paths from `<orig>` -- `git --literal-pathspecs restore --source=<orig> --staged
   --pathspec-from-file=- --pathspec-file-nul`, which also stages their deletions -- and commit.
3. Stage `<orig>`'s whole tree (`git --literal-pathspecs restore --source=<orig> --staged -- .`) and commit.

With an empty group, skip its commit. Step 8's per-commit check runs after each.

## Report block

```
Excluded from review:
  <path> -- <family>: <evidence>
Kept, flagged:
  kept: <path> -- <reason>
```

One line per excluded path, never collapsed into its directory, ordered by family and directory; empty lists read
"none". Families: documentation, vendored, build output, generated, snapshot, translation, lockfile, media. The run's
Next line names the in-scope commit by its full SHA.
