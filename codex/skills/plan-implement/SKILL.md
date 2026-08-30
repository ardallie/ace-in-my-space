---
name: plan-implement
description: "Implements the plan from a GitHub issue: loads it via $ace:plan-read, gates on the Validation audit footer's unresolved-question count, executes the work items sequentially with per-item verification, then posts the session handoff via $ace:plan-handoff. Use when a published plan exists and the user asks to implement it. Do not use when no plan has been published yet (that is $ace:plan-start), or for $ace:plan-route's implement-direct route, which deliberately has no entry-point command."
---
**Invocation input:** `[<issue>]`


# Implement a plan from a GitHub issue

## Usage

- `$ace:plan-implement` — uses the issue number from conversation context
- `$ace:plan-implement <issue>` — implements the plan from the specified issue (e.g., `85`)

## Context

Run this after the plan has been created and published (`$ace:plan-start`, or `$ace:report-publish` for a hand-published plan file). The issue description contains the plan; comments may contain handoffs from prior sessions. The `## Validation audit` footer, when present, is produced by `$ace:plan-start` Phase 9 (or `$ace:plan-update --from-report` Phase 2A) and records whether unresolved questions remain.

## Task

1. Load the plan by running `$ace:plan-read` (pass the issue number if provided as argument).
2. Inspect the trailing `## Validation audit` block in the plan body, if present.
   - Parse `Validation report: <path>`, `Validated on: <timestamp>`, `Unresolved questions: <N>`.
   - If the block is absent or malformed, proceed silently (a hand-published plan can lack the footer).
   - If `Unresolved questions:` is absent (zero-questions plans omit the line per the audit-footer contract — the bullet is appended only when the count is greater than zero) or `N` equals zero, proceed silently.
   - If `N > 0`, print the count and the report path, then ask through `request_user_input` when it is available in Plan mode, otherwise through the same concise plain-text question: "Proceed with `<N>` unresolved questions?" with options:
     - "Proceed" (Recommended) — payoff: each question is surfaced in context when the relevant work item is reached.
     - "Stop and run $ace:plan-update first" — payoff: all questions are resolved before any code changes.
3. Parse the plan body into ordered work items.
4. Implement each work item sequentially:
   - Make the changes.
   - Verify the changes compile per item via the project's cheap compile/typecheck command, derived from the repository's tooling at runtime (when the environment already runs it automatically after every edit — e.g. a post-edit hook — that result suffices). Do not run the full test suite per item — it is the once-after-all-items gate in step 5.
   - Report the outcome before proceeding to the next item.
5. After the last item, run the project's full test suite once, using the repository's standard test command derived at runtime. A long-running suite exceeds the foreground command timeout, so launch it in the background. The run summary (`N passed / 0 failed`, exit 0) is the authoritative signal — a load or collection error in any edited test file fails the whole run — so per-file confirmation is better done with a scoped assertion (e.g. a grep sweep for removed or renamed symbols) than by fishing per-file lines out of a truncated reporter stream.
6. After all items are processed, summarise what was implemented and list any items skipped or deferred, with reasons.
7. Invoke `$ace:plan-handoff <issue>`, passing the same issue number used in step 1, to post a technical handoff comment documenting the implementation session.

## Requirements

- Follow the plan as written. Do not make unrelated changes.
- Do not commit to Git — leave changes for user review.
- If an item is ambiguous or appears incorrect, use `request_user_input` when it is available in Plan mode, otherwise ask the same question in concise plain text to clarify before proceeding.
- If a work item fails (does not compile, breaks tests), report the failure and ask how to proceed rather than guessing a fix.

## Error handling

- Issue resolution failures (number cannot be determined, issue does not exist or is inaccessible) are handled by `$ace:plan-read`'s own `## Error handling`, which step 1 runs fully by reference.
- If the session ends mid-loop (interruption, or a failure the user stops on), no on-disk progress marker exists: completed items survive only in the working tree. Recovery is a fresh `$ace:plan-implement <issue>` run — compare the plan's work items against the tree state, report which items already appear implemented, and confirm the resume point with the user before continuing. A `$ace:plan-handoff <issue>` comment posted for the partial session is the durable progress record the next run reads via step 1.
