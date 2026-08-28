---
name: ace-plan-read
description: Loads plan and handoffs from a GitHub issue to continue work started in a previous session; read-only. Accepts one or more issue numbers, and an optional "then <follow-on>" directive.
argument-hint: "[<issue> ...] [then <follow-on>]"
disable-model-invocation: false
---

# Load context from a GitHub issue

## Usage

- `/ace-plan-read` - Uses the issue number from conversation context
- `/ace-plan-read <issue>` - Loads context from the specified issue (e.g., `85`)
- `/ace-plan-read <issue> <issue> ...` - Loads multiple issues; fetched one at a time and presented as a condensed cross-issue synthesis (see step 4)
- `/ace-plan-read <issue> then <follow-on>` - Loads the issue, then handles the named follow-on (e.g. `/ace-plan-read 957 then handle phase 1`); see step 5.

## Context

Use this to continue work started in a previous session. The issue contains the plan (description) and any handoff comments documenting progress. After completing work, use `/ace-plan-handoff` to document the session.

## Task

1. Identify the issue number — or numbers, in the multi-issue form — from the arguments, or search the conversation for a GitHub issue URL or number, taking the most recent when the conversation carries more than one. If none is found, report this and stop. This rule is canonical; its aligned copies within the plan-workflow bundle are `/ace-plan-handoff` step 1 and `/ace-plan-update` Phase 1, and an amendment lands at all three. (`${CLAUDE_PLUGIN_ROOT}/skills/ace-pr-create/SKILL.md` and `${CLAUDE_PLUGIN_ROOT}/skills/ace-pr-response/SKILL.md` carry the same idiom undeclared, pending a relay-workflow-scoped pass. `/ace-pr-read` step 2 phrases the same stop as "report usage and stop". The wording differs and the behaviour does not; both are in the set and neither is a drift to repair.)
2. Fetch all data in a single call per issue:
   ```bash
   gh issue view <issue> --json title,body,state,comments
   ```
   - With multiple issue numbers, run one call per issue — never a single bulk JSON fetch — and decide the capture up front: redirect each response to its own scratch file, then read the files (a combined blob is both unreadable and re-fetched anyway).
   - Capture to a scratch file likewise for a single-issue fetch expected to exceed step 4's size threshold, so the condensed synthesis has a saved full body to point at.
   - A single bad issue fails the run — never silently present the remainder: an issue that cannot be fetched, or whose body fails step 3's emptiness check, stops the command naming that issue number.
3. Before continuing, trim the body field and check its length. If the trimmed body is empty:

   > Issue #{number} has an empty body. The plan content is missing.
   > This is irrecoverable for automated continuation — the plan must be
   > populated before continuing. Common causes: the plan was deleted from
   > the issue body, or the issue was created by hand (e.g. `gh issue create`
   > run against an empty file). Reopen the issue, paste the plan content,
   > and re-run.

   Stop the command.
4. Present the data in this order:
   - Issue title and state
   - Issue body (the plan)
   - Comments in chronological order (revised prompt, handoffs, discussion)

   The verbatim presentation above applies to the single-issue case. With multiple issues — or whenever the combined content is too large to present usefully verbatim (roughly 30 KB or more) — present a condensed cross-issue synthesis instead: per-issue state, decisions, and open items, plus the cross-issue relationships, noting where the full bodies were saved so they remain readable on demand.
5. Summarise the current state and ask how to proceed. When the invocation named a follow-on after `then`, skip the question; for a follow-on that directs a planning artefact, invoke `/ace-plan-route` — it ends the turn with the recommended invocation rather than acting — and otherwise act on the follow-on directly

## Requirements

- This is read-only — do not modify the issue
- For each comment: include author, timestamp, and full body (verbatim mode; when step 4's condensed synthesis applies, it condenses instead)

## Error handling

- If issue number cannot be determined, report this clearly and stop
- If issue does not exist, report the error
- If the issue body is empty or whitespace-only, report this clearly and stop
- If there are permission issues, report them
