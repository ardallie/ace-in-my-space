---
name: ws-create
description: "Finds or creates a workstream -- a .ace/ws/{yyyyMMdd}-{slug}/ directory, a new one holding index.md, inputs.md, decisions.md, prompts/ and workings/ -- for given inputs or a name, reusing the one those inputs already belong to, and prints its path."
---
# Workstream create

**Invocation input:** `[--ws <path | name | slug>] [<files>] [<issue or PR number or URL>] [instructions]`

Read `../ws-shared/workstream-conventions.md` first; this skill carries out its find-or-create variant.

## Inputs

- `--ws` resolves by name only (path, name or slug).
- Otherwise match by the subject inputs the caller passes, an input inside a ws matching that ws by its location. When the user runs this skill directly, classify the inputs per the conventions.
- An argument `conversation: {ask}` is a subject stated only in conversation: match and record it under the key `conversation`.

## Outcomes

- Found: create only what is missing of `workings/` and `inputs.md`, never `prompts/` or `index.md`, so an old-layout ws gains nothing else and a missing index waits until the next run that takes a step regenerates it; never touch an existing `decisions.md`; append a line for each subject input lying inside no ws (the conventions' `## Inputs`) whose key is not yet recorded, or whose ask differs from its latest line for that key, stating what it now asks for.
- Created: create `.ace/ws/{yyyyMMdd}-{slug}/` with an empty `workings/` and an empty `prompts/`; copy `../ws-shared/decisions-template.md` to `decisions.md` and `../ws-shared/inputs-template.md` to `inputs.md`, byte for byte; append one line per subject input lying inside no ws to `inputs.md`; then write `index.md` in the conventions' `## Workstream index` form, listing `inputs.md` and `decisions.md`, no step, and `Latest: none` and `Next: none`.
- Asked: ask where the conventions say to ask, offering each ws as their `## Resolving a ws` says; a declined choice prints no `Workstream:` line.

The skill is idempotent: the same inputs or name give `reused`, changing nothing but appended inputs.

## Output

Print, as the last lines:

- one line saying why this ws: created for which subject, matched on which key, or named;
- `Workstream: .ace/ws/{ws} (created | reused)`.

When the user invoked this skill (not a scope skill), add the next step, in the form of the conventions' `## Hand-off loop`, with the subject inputs filled in (one inside the ws named ws-relative, a `conversation` subject as its ask): `$ace:scope-envelope --ws {ws} {subject inputs}` or `$ace:scope-review --ws {ws} {subject inputs}`.
