---
name: plan-validate
description: Validates the plan against the codebase after plan creation and before implementation, interviews the engineer if needed (--skip-interview to bypass), and outputs a structured findings report. Accepts a GitHub issue number, local plan files, or the plan already in conversation context.
argument-hint: "[--skip-interview] [<issue>|<file-path> ...] [additional instructions]"
disable-model-invocation: false
---

# Validate a plan before implementation

## Usage

- `/ace:plan-validate` — uses issue number from conversation context
- `/ace:plan-validate <issue>` — validates the plan from the specified issue number (e.g., `85`)
- `/ace:plan-validate <file1> <file2> ...` — validates the plan from local files
- Text after the last valid file path or issue number is passed as additional instructions
- Pass `--skip-interview` to skip the interview phase regardless of `[Question]` findings

## Context

Validates the plan against the codebase to verify assumptions and surface issues that are harder to spot during planning.
Run in a fresh session where possible — absent planning context, gaps and errors are more visible.
The output is a structured validation report.

## Task

Four phases executed in order.

### Phase 1 — Load the plan and compute identifiers

Pre-pass: strip leading flag tokens from the argument list. Recognise `--skip-interview` and remove it; remember whether it was set. The remaining tokens follow the existing parsing rules below. After parsing, warn when any residual token matches `^--` (e.g. `--skip-interview` typed after a positional token) — a misplaced flag would otherwise fold silently into the additional instructions. Also warn when a residual token looks like a path (contains `/` or ends in `.md`) — a mistyped file path would otherwise fold in the same way. Warn only, do not stop: additional instructions may legitimately contain paths. This is a distinct surface from the file-list rule below, which stops on the path-shaped token that ends the file list; this warning covers every residual token still standing after that pass, including ones beyond the first, and never stops the run. Aligned copy of the residual-token warning idiom canonical at `/ace:plan-start` Phase 1; amend both sites together.

Parse the arguments:

- **File paths provided** — test each whitespace-delimited token as a file path in order. The first token that does not resolve to a readable file ends the file list. Ahead of the path-shaped test below, when that token is a full GitHub issue URL (`https://github.com/<owner>/<repo>/issues/<n>`), report `Pass the issue number, not the URL — run /ace:plan-validate <n>` and stop: the URL is path-shaped and would otherwise draw the mistyped-path diagnosis. This skill accepts only numeric issue tokens — a deliberate divergence from `/ace:plan-start`, which exempts issue URLs from its path test, and not drift to repair. Otherwise, if that token is path-shaped (contains `/` or ends in `.md`), report `Input path '<token>' does not resolve to a file` and stop — aligned with `/ace:plan-start`'s hard error; a mistyped plan path must not silently reroute. If it is neither, that token and everything after it is passed as additional instructions. Read each valid file and concatenate their contents as the plan text.
- **Numeric token** — if the first token is not a valid file path but is numeric, treat it as a GitHub issue number and stage its body per `references/issue-staging.md` — read it now; it carries the title fetch, the slug and 8-hex derivation (footer reuse vs fresh identifiers), the clobber guard, the staging redirection, and the empty-body guard. Everything after the issue number is passed as additional instructions.
- **No arguments** — if the plan is already in the conversation (from a prior `/ace:plan-read`), stage it to a file: derive the slug and a fresh 8-hex per the report-title slug rule and 8-hex snippet in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md`, and Write the conversation-held plan text to `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v0-{slug}-{8hex}.md`, then treat it as file-input from that path (the validator's contract is path-only — a file must exist). This staged file is not cleaned up either — same handling as the numeric-token branch. Otherwise look for an issue number in conversation context and stage it per `references/issue-staging.md`. If not found, report this and stop.

If a file path resolves but is not readable, report the error and stop. If the plan text is empty, report this and stop.

If a resolved plan file matches the pre-planner two-rule detection in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/pre-planner-detection.md` — read it now; it carries both arms and their precedence — stop with: `<path> is a pre-plan analysis, not a plan. Run /ace:plan-start <path> to generate a plan from it.` The validator would otherwise treat the analysis as a plan (slug `pre-plan-analysis` from the H1).

Compute the report identifiers (they compose the report target path handed to Phase 2, so report and plan share an id):

- **Plan-file input matching the convention** (`{yyyyMMdd}-{HHmm}-plan-v{m}-{slug}-{8hex}.md`) — reuse the slug and 8-hex id from the filename so the report shares the plan's id; set the report version `{n}` to `{m}+1` (the next revision the developer will produce).
- **Plan-file input not matching the convention** — generate a fresh 8-hex per the snippet in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` (test output non-emptiness, not exit status); derive the slug from the plan's first H1 title (kebab-cased, ≤3 keywords, per the report-title slug rule in the same file); set `{n}` to `1`.
- **Issue input** — the identifiers were already derived during staging (`references/issue-staging.md`): footer present — reuse `{slug}`/`{8hex}` from the footer's `Validation report:` path and set `{n}` to `{m}+1`; no footer — the fresh 8-hex, the title-derived slug, and `{n}` set to `1`.

Compute the report timestamp (`date +%Y%m%d` and `date +%H%M`, local time) and compose the full report target path: `.ace/plans/{yyyyMMdd}-{HHmm}-val-v{n}-{slug}-{8hex}.md`. The subagent writes to this exact path.

### Phase 2 — Validate

Spawn the `plan-validate` subagent via `Agent` with `subagent_type: ace:plan-validate` and `model: {Tier-3}` — a tier reference resolved at spawn time per the consumer contract in `${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`, against the `Harness:` block already in context, invoking `/ace:detect-harness` first if none is present, and against the harness's own model catalogue where the detect-harness package is absent; the agent file's frontmatter `model:` is the fallback for direct invocation. Pass the plan path (the file path for file-input; the temp-file path staged in Phase 1 for issue-input), the full report target path (computed in Phase 1), and any additional instructions collected in Phase 1 as inputs. The additional instructions bias which criteria and areas receive scrutiny; the chained `/ace:plan-start` Phase 7 passes none. The subagent owns all codebase exploration and writes the report; the orchestrator does not pre-explore.

### Phase 3 — Output the report

Parse the ` ```result ` block from the subagent's reply. Read `report_path` and `has_questions`. Output the report file in full.

If `has_questions` is false, the run ends here. Otherwise proceed to Phase 4.

### Phase 4 — Interview

If `--skip-interview` was set, skip this phase; the run ends after Phase 3 with all `[Question]` findings unresolved in the report.

This phase collects user answers and writes them back into the report at `report_path` via in-place Edits.

**Run the interview tool:**

Use the `AskUserQuestion` tool to present questions interactively. Present findings in report order, with any `[Question]` finding that gates other findings first. The validator's `[Question]` format carries no blocking/deferrable tags — that vocabulary belongs to the analysis reports (pre-planner, arch-review, scope). For each question, follow the rules in `${CLAUDE_PLUGIN_ROOT}/skills/run-interview/SKILL.md`, which govern the option format. Draw each question's options from codebase evidence, trade-offs, or reasonable alternatives, so the user selects rather than composes a response from scratch — a rule specific to this phase, not carried by that file.

If there are more questions than the tool supports per call, batch them across multiple calls — gating questions in the first batch.

**Collect answers:**

The tool returns the user's selections. The user may also provide free-text via the built-in "Other" option. If the user declines to answer a question, leave it unresolved. If all questions are unresolved, end the interview.

**Update the report** — execute the write-back per `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/resolution-markers.md` — read it now; it carries the Edit-in-place shape, the audit-trail rule, the no-summary rule, and the Write-once fallback. Use Read once on `report_path` at the start of Phase 4 to confirm the file's structure; subsequent updates use Edit only. Skipped questions: no Edit.

Output the updated report in full.

## Constraints

- Do not execute the report instructions — they are for the planning agent in a subsequent session
- The saved report is the deliverable; the run ends after Phase 3's output when `has_questions` is false or `--skip-interview` was set, and otherwise after Phase 4's write-back

## Error handling

- If no issue number can be determined and no file is provided, report this clearly and stop
- If the issue does not exist, report the error and stop
- If the issue body is empty or whitespace-only, report this clearly and stop
- If a file path resolves but is not readable, or the plan text is empty, report the error and stop (Phase 1 staging guard)
- If the composed temp path already exists with content differing from the fetched issue body, report the collision and the `/ace:plan-validate <path>` file-input alternative, and stop (the clobber guard in `references/issue-staging.md`)
