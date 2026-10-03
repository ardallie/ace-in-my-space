---
name: ws-create
description: "Finds or creates a workstream -- the .ace/ws/{yyyyMMdd}-{slug}/ directory holding inputs.md, decisions.md and workings/ -- for given inputs or a name, reusing the one those inputs already belong to, and prints its path."
---
# Workstream create

**Invocation input:** `[--ws <path | name | slug>] [<files>] [<issue or PR number or URL>] [instructions]`

Layout, naming, the inputs record and matching are defined in `../ws-shared/workstream-conventions.md`. Read it first; this skill carries out the find-or-create variant and is the only writer of a ws skeleton and its `inputs.md`.

## Inputs

- `--ws` resolves by name only (path, name or slug).
- Otherwise match by the subject inputs the caller passes. When the user runs this skill directly, classify the inputs per the conventions.
- With no name and nothing to derive one from, ask for a name or a subject.

## Outcomes

- Found: create only what is missing (`workings/`, `inputs.md`); never touch an existing `decisions.md` or change an `inputs.md` line; append the subject inputs not yet recorded with that ambition.
- Created: create `.ace/ws/` if missing, then `.ace/ws/{yyyyMMdd}-{slug}/` with an empty `workings/`; copy `../ws-shared/decisions-template.md` to `decisions.md` and `../ws-shared/inputs-template.md` to `inputs.md`, byte for byte; append one line per subject input to `inputs.md`.
- Asked: ask where the conventions say to ask; a declined choice prints no `Workstream:` line.

The skill is idempotent: the same inputs or name give `reused`, changing nothing but appended inputs. Nothing is written outside the ws or to GitHub.

## Output

Print, as the last lines:

- one line saying why this ws: created for which subject, matched on which key, or named;
- `Workstream: .ace/ws/{name} (created | reused)`.

When the user invoked this skill (not a scope skill), add the next step: `$ace:scope-envelope --ws {name} ...` or `$ace:scope-review --ws {name} ...`.

The caller verifies the result with the conventions' caller check.
