---
name: ws-create
description: "Finds or creates a workstream -- the .ace/ws/{yyyyMMdd}-{slug}/ directory holding inputs.md, decisions.md and workings/ -- for given inputs or a name, reusing the one those inputs already belong to, and prints its path."
argument-hint: "[--ws <path | name | slug>] [<files>] [<issue or PR number or URL>] [instructions]"
disable-model-invocation: false
---
# Workstream create

Read `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/workstream-conventions.md` first; this skill carries out its find-or-create variant.

## Inputs

- `--ws` resolves by name only (path, name or slug).
- Otherwise match by the subject inputs the caller passes. When the user runs this skill directly, classify the inputs per the conventions.
- An argument `conversation: {ask}` is a subject stated only in conversation: match and record it under the key `conversation`.

## Outcomes

- Found: create only what is missing (`workings/`, `inputs.md`); never touch an existing `decisions.md`; append a line for each subject input whose key is not yet recorded, or whose ask differs from its latest line for that key, stating what it now asks for.
- Created: create `.ace/ws/{yyyyMMdd}-{slug}/` with an empty `workings/`; copy `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/decisions-template.md` to `decisions.md` and `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/inputs-template.md` to `inputs.md`, byte for byte; append one line per subject input to `inputs.md`.
- Asked: ask where the conventions say to ask; a declined choice prints no `Workstream:` line.

The skill is idempotent: the same inputs or name give `reused`, changing nothing but appended inputs.

## Output

Print, as the last lines:

- one line saying why this ws: created for which subject, matched on which key, or named;
- `Workstream: .ace/ws/{name} (created | reused)`.

When the user invoked this skill (not a scope skill), add the next step with the recorded subject inputs filled in (a `conversation` subject as its ask): `/ace:scope-envelope --ws {name} {subject inputs}` or `/ace:scope-review --ws {name} {subject inputs}`.
