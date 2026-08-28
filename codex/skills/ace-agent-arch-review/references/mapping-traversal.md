# Mapping classification and traversal

Consumed by SKILL.md Phases 1 and 2 — read when (and only when) a positional file token
resolves under `.ace/mappings/`. Carries the mapping-aware classification rule, the
index-file rejection, and the per-type traversal.

## Mapping-aware classification (Phase 1)

In the mixed issue-plus-files form, mapping-aware classification does not apply to the
file tokens after the issue number — the issue is the primary scope, so mapping files
listed there are supporting context only, with no per-type traversal in Phase 2.

If any file in the list resolves under `.ace/mappings/`, the first such file becomes the
primary scope-area definition. Classify it by path prefix to enable per-type traversal in
Phase 2:

- `.ace/mappings/features/{slug}.md` -> **feature scope**
- `.ace/mappings/subsystems/{slug}.md` -> **subsystem scope**
- `.ace/mappings/structure/{package}/{module}.md` -> **structure scope**
- Any other path under `.ace/mappings/` -> generic file (no per-type traversal)

Reject index files (`_index.md`, `_graph.md`, `_summary.md`) under any of the three
subtrees with the message "Index files cannot be used as scope. Pass a specific mapping
file under `.ace/mappings/{features,subsystems,structure}/` instead." and stop.

All remaining files in the list (mapping or otherwise) become supporting context — read
once without per-type traversal. Mixing mapping types in a single invocation is not
supported; the first mapping file's classification governs Phase 2 traversal.

## Mapping-aware traversal (Phase 2)

When Phase 1 classified the scope as a mapping file, apply the per-type rule below. The
primary scope file and any adjacent mappings auto-loaded by these rules count as "files
explicitly referenced in the brief" and are exempt from the 40-file cap. Source-code reads
count against the cap. Modules without a structure mapping are silently skipped.

- **Feature scope** — read the feature file, then:
  1. Resolve the parent subsystem by reverse-lookup in
     `.ace/mappings/subsystems/_index.md` when that index exists, then read the matching
     `.ace/mappings/subsystems/{subsystem-slug}.md`.
     - Its `## Feature inventory` block lists `{subsystem-slug}/{feature-slug}` — match on
       the feature slug.
     - Where the slug appears under more than one subsystem, take the first match in file
       order and note the ambiguity in the Context files section.
     - Where the index is absent (a repository with feature mappings but no subsystem
       tree), skip the subsystem read and note the gap in the Context files section.
  2. For each module in the feature's `Modules:` line, read its structure mapping at
     `.ace/mappings/structure/{package}/{module}.md`.
  3. Read source files in each module's `Path:` header — the form the structure grammar
     emits. Also accept a `path:` YAML-frontmatter form, for a host whose mappings come
     from a different producer.
- **Subsystem scope** — read the subsystem file, then:
  1. For each module in `Modules:` and each in `Shared modules:`, read its structure
     mapping.
  2. Read source files in each module's `Path:` / `path:`. Do **not** read
     `.ace/mappings/subsystems/_index.md` — its feature inventory would pull in unrelated
     subsystems.
- **Structure scope** — read the structure file, then:
  1. Optionally reverse-lookup the parent subsystem in
     `.ace/mappings/subsystems/_index.md`; read it if found.
  2. Optionally read direct-dependency structure mappings noted in the file.
  3. Read source files in `Path:` / `path:`.

Evaluation outputs under `.ace/mappings/{usability,improvements,novelty}/` are not
auto-loaded.

`Related features` in feature files is an exploratory lead, not a mandatory load —
analysts may follow it under the 40-file cap. Subsystem files carry no cross-subsystem
link field; dependency leads for a subsystem scope come from its modules' structure
mappings (subsystem scope, step 1).

**Mappings are reference snapshots** — read them for scope and context only, never as
review subjects. Do not assess their freshness (no `Mapped:`/`mapped:` staleness check) or
flag a mapping as stale; the full rule (no regeneration, mapping-vs-source handling) is the
**Mappings are out of scope** note in SKILL.md Phase 3 and the adjacent-toolchain input
convention it applies.

Maintainer note: every rule above is coupled to the adjacent crawler toolchain's output
layout under `.ace/mappings/` — the path prefixes, the index filenames, the mapping-file
field names, and the evaluation subtrees. If the toolchain relocates output or changes
that grammar, update this file, SKILL.md's mapping sites, and wherever the host
repository documents the layout in the same change; otherwise mapping paths are silently
classified as generic files and field lookups silently return nothing.
