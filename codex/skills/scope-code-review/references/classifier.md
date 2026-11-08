# Classifier

The same extension can fall on either side: markdown is often documentation, but in a repository of prompts or
specifications it is the product; generated code can look hand-written. Doubt resolves toward review scope: hiding
code from review is the costly error, and an extra file in the review set is cheap.

**Gather once,** batched, from the base and pinned tip objects -- never the working tree. The base is the subject's
(`SKILL.md`, `## Subject`). Cost scales with the file count, not file size: never read whole files and never pass
every file through a model.

- `git diff-tree -r -M -z --raw --numstat <base> {pinned tip}` -- status, renames, modes, line counts, and binaries
  (`-` counts). If git warns that rename detection was skipped, rerun with `-l0`. A folder is listed as additions from
  the empty tree (`git hash-object -t tree /dev/null`, without `-w`) to the pinned commit, the folder as pathspec.
- One `GIT_ATTR_NOSYSTEM=1 git check-attr --source={pinned tip} --stdin -z` pass for `linguist-generated`,
  `gitlab-generated`, `linguist-vendored`, and `linguist-documentation`. Attributes come from the subject's own tree,
  never `--cached` or the index. The system attributes file is ignored because it is not the project's.
- Below git 2.40, which lacks `--source`, no attributes are resolved per path and no attribute-based exclusion
  applies; opt-outs cannot be resolved either, so where a tracked attribute file at the pinned tip (found with
  `git grep`) or a local attribute source mentions `linguist-` or `gitlab-generated`, every file the rules would set
  aside stays in, flagged; all disclosed in the plan record and `## Coverage`, saying no attributes were resolved per
  path.
- The tree listing at the pinned tip (`git ls-tree -r -l -z`) for sizes and siblings.
- `git grep -I -n -i -E` with one alternation (separate `-e` patterns can stall on large files), this one, every
  member required:
  `'generated|do not (edit|modify)|^[[:space:]]*(name|description):|^version https://git-lfs|sourceMappingURL|snapshot v[0-9]'`,
  once over the changed paths at the pinned tip and once over deleted paths and rename sources at the base. Keep only
  hits on lines 1-10; `-m` (git 2.38) is an optional per-file cap, not a line window.

The git commands in this file, whose attribute reads set their policy with a POSIX environment prefix
(`GIT_ATTR_NOSYSTEM=1 git check-attr ...`), run in a POSIX shell; where none is available, in the active shell's
per-command form where it has one, else by setting the variable, running the git command and removing the variable at
once, so the policy reaches that one git command only.

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
   half of the tracked files at the pinned tip are prose; product prose carries no prose signal. Project-prose names
   are always documentation and are left out of that count.
4. **In -- everything else.** Flag a file that carried one signal or a loose marker phrase.

For a folder, "the range changes X" reads "X is in the folder", the guard for attributes the range changes does not
apply, and the prose-majority count stays repository-wide at the pinned commit.

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

- **Attributes the range changes.** When the range changes any `.gitattributes`, an attribute supports exclusion only
  where a separate `GIT_ATTR_NOSYSTEM=1 git check-attr --source=<base> --stdin -z` call agrees -- never combined with
  `--cached`, which silently wins. That needs git 2.40. At git 2.40 and above, opt-outs always count.
- **Local attribute sources.** Only tracked `.gitattributes` files may support an exclusion. When
  `$(git rev-parse --git-path info/attributes)` or the global attributes file (`core.attributesFile`, by default
  `$XDG_CONFIG_HOME/git/attributes` or `~/.config/git/attributes`) mentions `linguist-` or `gitlab-generated`,
  attributes support opt-outs only, and the plan record and `## Coverage` say so.
- **Renames stay whole.** A rename is selected or set aside whole, both sides together, classified by its new path; it
  is out only when both paths would be out and it stays in one directory. Otherwise both sides are in. A file replaced
  by a directory of the same name, or the reverse, follows the same rule.
- **Undetected renames.** When renames stay undetected even with `-l0`, an excluded addition that shares a basename
  with a deleted path stays in.

The plan record lists every exclusion as `<path> -- <family>: <evidence>`, every flag as `kept: <path> -- <reason>`,
and the warnings. Families: documentation, vendored, build output, generated, snapshot, translation, lockfile, media.
