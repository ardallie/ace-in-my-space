---
name: plan-start
description: Drafts a plan from a brief (slug, file, instruction text, pre-planner report, or GitHub issue), saves it to .ace/plans/, validates it via the plan-validate subagent, applies findings via plan-revisor into a v1 revision, then publishes the issue inline via the /ace:report-publish pipeline (--publish no to skip).
argument-hint: "[--model <name or instruction>] [--skip-interview] [--publish yes|no] [<slug|file-path|report-path|issue> ...] [additional instructions]"
disable-model-invocation: false
---

# Generate and publish a plan from a brief

## Usage

- /ace:plan-start — uses the most recent actionable user message as the brief
- /ace:plan-start <slug-or-path> [<slug-or-path> ...] — loads brief from file(s); concatenated peers
- /ace:plan-start <slug-or-path> ... <additional instructions> — first non-resolving token + remainder become additional instructions
- /ace:plan-start <path-to-agent-pre-planner-report.md> — generates a plan from a pre-plan analysis report; resolved decisions and `### Confirmed` findings become constraints, `[blocking]` open-questions feed the Phase 3 interview; `[deferrable]` ones become drafter-directed 'resolve in the plan' constraint lines
- /ace:plan-start <issue> — generates a plan from a GitHub issue (bare number or full URL). The issue body plus its comments are the sole source of truth for the run; a published pre-planner report is detected from the issue content and receives the same transform as the file form
- /ace:plan-start [--model <name or instruction>] [--skip-interview] [--publish yes|no] <inputs ...> — flags first (in any order), positional second

## Context

Runs outside Claude Code's plan mode. The brief arrives as free text, local files, or a GitHub issue (Phase 1's issue route). A `plan-drafter` subagent reads the codebase and writes the plan to a deterministic path under `.ace/plans/`.

The `plan-drafter` subagent receives Read, Glob, Grep, Bash, and Write — the set declared in its `tools:` frontmatter (Bash is constrained to read-only use by the agent prompt). The `acceptEdits` permission mode does not enforce a per-path restriction at the platform level; the subagent's prompt is the binding constraint — it writes only the single plan file.

Beyond the pipeline's own artefacts, this skill depends on the following sibling files; a port of the plan pipeline must carry this set: `${CLAUDE_PLUGIN_ROOT}/agents/plan-drafter.md`, `${CLAUDE_PLUGIN_ROOT}/agents/plan-validate.md` (the subagent Phase 7 spawns directly — not the standalone `/ace:plan-validate` skill at `${CLAUDE_PLUGIN_ROOT}/skills/plan-validate/SKILL.md`, which this skill never invokes or reads), `${CLAUDE_PLUGIN_ROOT}/agents/plan-revisor.md`, `${CLAUDE_PLUGIN_ROOT}/skills/report-publish/SKILL.md`, `${CLAUDE_PLUGIN_ROOT}/skills/run-interview/SKILL.md`, the shared files `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md`, `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/pre-planner-detection.md`, and `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/resolution-markers.md`, and this skill's own `references/issue-route.md` and `references/pre-planner-transform.md`.

The audit trail assumes `.ace/plans/` is committed (or otherwise preserved); on repos that ignore it, the GitHub issue body is the only durable artefact. All locally-persisted signals — the `- Issue:` linkage bullets, the duplicate-publish probe — additionally assume a single working clone; multi-clone or multi-user operation is outside the pack's design.

## Task

Ten phases executed in order, plus the conditional Phase 2.5 gate between Phases 2 and 3.

### Phase 1 — Parse arguments

Pre-pass: strip leading `--model {value}`, `--skip-interview`, and `--publish {value}` flags.
- `--model` value directs the planner's model — a model name or a prose instruction (a tier, a mix, a reference), resolved against the models the harness offers; defaults to Tier-2. If the value is missing, report the error and stop.
- `--skip-interview` is a boolean; default false.
- `--publish` value defaults to `yes`; accepted values `yes|no`. If the value is missing or unknown, report the valid values and stop. `no` skips issue creation in Phase 10.

Main pass: apply the slug-resolution rule to remaining tokens.

**Issue detection (interleaved with slug resolution).** A token that is a full GitHub issue URL (`https://github.com/<owner>/<repo>/issues/<n>`, resolved to the current repository's issue number) is an issue input and is never tested as a path — without this precedence, rule 3's path-shaped exception would reject it. A purely numeric token is an issue input only when rules 1–2 below do not resolve it as a file (file-first precedence; here rule 2's `.md` probe means even a file named `838.md` claims the bare token `838`). At most one issue input per invocation; a later numeric or URL token folds into additional instructions. An issue input may combine with resolved files and trailing text under Phase 2's precedence rules.

Slug-resolution rule for each token (in order):
1. Try the token literally as a path (absolute or repo-relative).
2. Try `<token>.md`.
3. Token does not resolve — it and all subsequent tokens become additional instructions. Exception: a non-resolving token that looks like a path (contains `/` or ends with `.md`) is an error — report `Input path '<token>' does not resolve to a file` and stop. A typo'd path must not silently become the free-text brief; this exception is the reachable form of the "path-shaped token fails to resolve" error path.

After the slug-resolution pass, warn when any residual token matches `^--` (e.g. `--skip-interview` typed after a positional token) — a misplaced flag would otherwise fold silently into the drafter brief as additional instructions. Also warn (do not stop) when a residual token looks like a path (contains `/` or ends in `.md`) — a mistyped file path would otherwise fold in the same way. This is a distinct surface from rule 3's path-shaped exception above, which errors on the specific token that ends slug resolution; this warning instead covers every residual token still standing after that pass, including ones beyond the first, and never stops the run — additional instructions may legitimately contain paths.

If no token resolved AND the first token matches `^[a-z0-9-]+$` (a purely numeric first token never reaches this branch — issue detection claims it first), emit a single warning: "No file matched `{token}` — interpreting as free-text."

If no arguments are provided, fall back to the most recent actionable user message.

**Route exclusivity.** A local-path input makes the file the sole source of truth: no `gh` calls, no issue lookup, even when the file records a published twin. An issue input makes the issue body plus its comments the sole source of truth: never search for, and never read, a local twin of the published report. The two routes never merge. On the local route, when a resolved pre-planner report carries a `## Publication` `- Issue:` line (appended by the `/ace:report-publish` pipeline), emit a one-line note naming that issue and stating that the file is this run's source — a signpost, not a fetch. The note also warns that any Phase 3 question resolutions from this run land only in the local file — the published issue would permanently misreport answered questions as blocking-unresolved; pass the issue as the input instead when the published record matters.

**Issue route — fetch, classify, stage.** For an issue input, execute the four steps in `references/issue-route.md` — read it now; it carries the single fetch, the four-arm classification with its redirects, the staging write, and the hand-off that holds the issue URL for Phases 2, 3, and 10.

### Phase 2 — Assemble brief

For slug/path inputs the brief is by-reference: emit one line `Source: <repo-relative path>` per resolved file plus an instruction to the drafter to read each listed file in full. Do not re-emit file contents into the payload — the drafter reads the `Source:` files itself (the same contract as the pre-planner transform below).

**Detection** (applies before the rules below): classify each resolved input file per the two-rule detection in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/pre-planner-detection.md` — read it now; it carries both arms and their precedence, and `/ace:plan-validate` and `/ace:plan-update` consume the same detection. A file the detection does not match falls through to the regular list rows. Issue inputs arrive pre-classified from Phase 1's issue route; the pre-planner staged filename matches the filename rule by construction, so no re-classification occurs.

**Precedence when input classes mix.** When a pre-planner report is among the resolved inputs alongside other files or trailing text: the report drives the transform and the slug (Phase 4); any other resolved files become additional `Source:` rows appended after the report's header block; trailing non-resolving text becomes additional instructions appended as a separate paragraph. At most one pre-planner report is honoured as the driver; a second detected report is treated as an additional `Source:` row.

Brief assembly — literal payload to the `plan-drafter` subagent:

- **No arguments** — `Design an implementation for: {most recent actionable user message verbatim}`
- **Single slug/path** — `Design an implementation for the brief in the source file below; read it in full.` followed by its `Source: <repo-relative path>` line
- **Multi slug/path** — `Design an implementation for the brief in the source files below; read each in full.` followed by one `Source: <repo-relative path>` line per resolved file in input order
- **Issue input (plain brief)** — treated as a single-path input over the staged file, with one addition: the `Source: <staged path>` line is immediately followed by an `Issue: <issue URL>` line naming the origin. The drafter cites the issue, not the transport file (see `${CLAUDE_PLUGIN_ROOT}/agents/plan-drafter.md`)
- **Free-text only** — `Design an implementation for: {free-text verbatim}` (no file; unchanged by the by-reference contract)
- **Mixed** — the `Source:` lines as above, then `\n\nAdditional instructions: {instructions}` (instructions appended as a separate paragraph)
- **Pre-planner report** — build the payload per the transform in `references/pre-planner-transform.md` `## Phase 2 transform` — read it now. The transform's failure modes govern a missing or unparseable `### Workload split` and a missing `## Enhanced brief`.

### Phase 2.5 — Sceptic-veto pre-check (pre-planner report only)

Runs only when input was detected as a pre-planner report and the report has a parseable `### Workload split` section — stated in full in the reference below, which also carries this gate's rationale; amend both sites together. Execute the gate per `references/pre-planner-transform.md` `## Phase 2.5` — it matches the split's mandatory `Recommendation:` line (prose-regex fallback for hand-written reports) and, on a "no plan" recommendation, runs one `AskUserQuestion` whose Abort option halts immediately — do not fall through to Phase 3 or any later phase.

### Phase 3 — Optional interview

Scan for `[Question]`-prefixed lines in two places: a grep over the resolved non-pre-planner `Source:` files (the brief no longer inlines their contents; pre-planner reports are excluded from the grep — their questions arrive solely via the transform's synthesised lines, and a verbatim `[Question]` string carried inside a report body must not re-surface as a phantom question) and any lines the orchestrator synthesised into the brief in Phase 2 (e.g. the pre-planner blocking questions and workload selector). If any are found AND `--skip-interview` was not set, run an `AskUserQuestion` interview: present each `[Question]` line to the user and collect answers. Record each resolution in the brief payload — for synthesised lines, replace `[Question]` with `[Resolved]` and append `Answer: ...` in-place; for questions grepped from non-pre-planner `Source:` files, append a `[Resolved] {question} Answer: {answer}` paragraph to the brief (those source files are not mutated).

For a synthesised line that originated as a `[blocking]` pre-planner question, execute the write-back per `references/pre-planner-transform.md` `## Phase 3 write-back` — it carries the `Q{n} `-anchored Edit, the staged-copy variant, and the issue-comment post. With typical brief inputs this phase is a silent no-op; the gate exists so that pre-planner reports (which carry `[Question]` prefixes) can be passed directly as `/ace:plan-start` inputs without a separate resolution step. The `Resolve in the plan` constraint lines synthesised for `[deferrable]` questions carry no `[Question]` prefix and are therefore not surfaced here; they pass through to the drafter as constraints.

### Phase 4 — Compute plan filename

Compute the slug:
- Single slug input — use basename minus `.md`. Items with three `--`-delimited segments use the last segment only; drop the leading segments. Truncate to 3 keywords (hyphen-delimited tokens) from the start.
- Multi-slug input — truncate each slug to its first keyword, then join the first two with `-and-` (e.g. `user-profile` + `audit-log` -> `user-and-audit`). Truncating before joining means the result never ends in a dangling `-and`.
- Issue input (plain brief) — derive the slug from the issue title held from the Phase 1 fetch per the issue-title slug rule in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` (single-sourced there; `/ace:plan-validate`'s issue staging and `/ace:plan-update` Phase 2A — which its Phase 2B executes by reference — consume the same rule). A pre-planner issue input uses the pre-planner report rule below against the staged copy, not this rule.
- Pre-planner report input — derive the slug from the report's `Title:` field:
  - **Title** — extract the report's `Title:` field (first line under `## Summary` matching `^Title:\s*(.+)$`).
  - **Slug derivation** — apply the report-title slug rule in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` (label strip, kebab-casing on every non-alphanumeric boundary, stop-word drop, 3-keyword truncation, with worked examples — single-sourced there).
  - **Unit marker** — if a workload unit was selected — via the Phase 3 selector or named in additional instructions (the transform's pre-answered-selector rule) — append a unit marker: prefer the report's native unit identifier when the split labels its units distinctively (e.g. `Plan 3a` -> `-3a`, keeping the identifier the report and user both use; a generic `unit N` label is not a native identifier and takes the fallback — never a bare `-{n}`), falling back to `-unit{n}` for unlabelled or generically labelled splits.
  - **Parse failure** — if `Title:` parse fails, fall back to the free-text rule below (subagent derives the slug from the plan's H1; the unit marker is lost on this path — the drafter never appends markers — an accepted edge reachable only via a malformed report).
  - **Precedence** — when both a pre-planner report and slug/multi-slug inputs are present, the pre-planner slug rule wins (the report is the transform driver per Phase 2 precedence).
  - **Sync note** — the title-derivation rule is single-sourced in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md`, which `${CLAUDE_PLUGIN_ROOT}/agents/plan-drafter.md` step 4 also consumes. The unit-marker append is parent-side only — for slug-derived inputs the drafter receives a fully-formed target path and never appends unit markers itself.
- Free-text input or no resolved slug — the slug is not computed in Phase 4. The parent passes the timestamp and 8-hex suffix to the subagent in Phase 5; the subagent derives a ≤3-keyword slug from the plan title and composes the final path itself.

The 8-hex id ensures uniqueness — a short slug does not risk collisions across plans.

Compute the timestamp: `date +%Y%m%d` and `date +%H%M` (local time).

Compute the suffix per the 8-hex snippet in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` (test output non-emptiness, not exit status — the rationale is recorded there).

For slug-derived inputs only, compose the candidate path: `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v0-{slug}-{8hex}.md`. The `plan-v0` segment marks the unvalidated draft; Phase 9 emits the validated revision as `plan-v1`.

Collision handling: if the path already exists, append `-2`, `-3`, ... to the slug component until the path is free. For free-text inputs, the subagent applies the same collision rule against its own composed path. This timestamp-plus-collision-increment idiom is canonical here; aligned copies increment a different per-site target — the version segment (Phase 9), the `-staged` suffix (the issue route's staging step, and `plan-update` Phase 2A), the run slug (`/ace:run-retro`'s report path), or the whole filename (a sibling pack's eval report path) — deliberately: aligning the increment targets across sites would be a behaviour change.

For free-text inputs, Phase 4 finalises only the timestamp and suffix; the subagent owns slug generation and final path composition.

### Phase 5 — Spawn planning subagent

Spawn-model prescriptions here are tier references (`Tier-1`-`Tier-3`); resolve them at spawn time per the consumer contract in `${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md` — against the `Harness:` block already in context, invoking `/ace:detect-harness` first if none is present; where the detect-harness package is absent, resolve tiers against the harness's own model catalogue. This applies to every subagent spawn in this skill (Phases 5, 7, and 9).

Spawn a single subagent via `Agent`:
- `subagent_type`: `ace:plan-drafter`
- `model`: value from Phase 1 (default `{Tier-2}`)
- Brief: assembled in Phase 2
- Target path: from Phase 4 for slug-derived inputs. For free-text inputs, instead pass the timestamp and 8-hex suffix and the path convention `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v0-{slug}-{8hex}.md`; the subagent derives a ≤3-keyword slug from the plan title and composes the final path itself.

The subagent reads the codebase, writes the plan to the target (or self-composed) path via the Write tool, and returns a trailing ` ```result ` block with a `path` key. Parse the block to retrieve the absolute plan path; for free-text inputs, the slug Phase 7's report-path composition needs is read from this returned path's filename (the path convention embeds it). If the result block is unparseable, the orchestrator holds the 8-hex it supplied; glob `.ace/plans/*-plan-v0-*-{8hex}.md` to recover the written file before failing (for slug inputs the candidate path is already known from Phase 4, so no recovery glob is needed). The wait is notification-driven — do not poll or schedule wakeups (this applies to every subagent wait in this skill: Phases 5, 7, and 9).

### Phase 6 — Verify file written

Check that the path exists and the trimmed content is non-empty. If not, report the failure and stop — do not chain into `/ace:report-publish` against an empty file.

### Phase 7 — Spawn validation subagent

Spawn a fresh subagent via `Agent` to validate the draft plan against the codebase:

- `subagent_type`: `ace:plan-validate`
- `model`: **always** `{Tier-3}`. The `--model` flag from Phase 1 propagates only to the planner (Phase 5); it does not affect the validator. This is intentional — validation quality should not vary with the planning model.
- Brief: the absolute path to the draft plan file written in Phase 5, plus the full report target path `.ace/plans/{yyyyMMdd}-{HHmm}-val-v1-{slug}-{8hex}.md`, composed by the orchestrator from the plan's slug and 8-hex id, reusing the Phase 4 timestamp — draft, report, and revision share one prefix, matching the Phase 10 banner — so the artefact set is deterministic. The report version matches the next plan revision the orchestrator will produce — for a `plan-v0` draft, the report is `val-v1` and the revised plan will be `plan-v1`.
- Exploratory-read cap: the subagent caps additional codebase reads (files discovered during validation but not mentioned in the plan) at 40. Files explicitly referenced by the plan are exempt from the cap.

The subagent reads the plan, explores the codebase to verify referenced files, functions, and patterns, generates the report with `[Question]` prefixes on findings that require user input, and writes the report to the exact path supplied by the parent (so report and plan share the same id and the report timestamp is deterministic). It returns a trailing ` ```result ` block with `report_path` and `has_questions` keys. Parse the block to retrieve the report path and the question flag. In this chained flow `has_questions` is informational only — Phase 8 re-derives question state from the report itself; the flag is load-bearing only for the standalone `/ace:plan-validate` skill. The subagent does not run an interview; interview is orchestrator-owned in Phase 8.

If the subagent fails or returns no report path, stop with a clear error and the draft plan path so the user can re-invoke validation manually. Do not chain `/ace:report-publish` against an unvalidated draft. The same handling applies when the report file does not exist or is empty after the subagent returns — empty means trimmed length zero; a partial-write that produces non-empty truncated content is acceptable to proceed against, since Phase 8's per-bullet parser is robust to incomplete tails.

### Phase 8 — Resolve findings

Read the report file in full. Parse it into discrete findings using a **per-bullet rule**: every top-level `- ` bullet under `## Findings` (or under `### Clarity`/`### Accuracy`/`### Completeness`/`### Feasibility`) is one finding. An inline `[Question]` prefix on the bullet drives that finding's classification through steps 2–3 below. An inline `[Advisory]` prefix marks a finding the validator judged advisory — an observation the revisor folds into the plan as a note, not a revision; advisory findings never carry `[Question]` and are never interviewed. A bullet's continuation lines and nested sub-bullets belong to the parent bullet. Same report -> same parse across runs. The `## Verified` section is a top-level H2 outside `## Findings` and is not parsed — its bullets are confirmations, never findings, and never trigger the revisor spawn.

Walk every parsed finding:

1. **Non-question findings** — collect verbatim. These become applied revisions in Phase 9. Findings prefixed `[Advisory]` collect in an `advisory` state instead — the revisor folds them as notes rather than reworking the plan's actions.
2. **`[Question]`-prefixed findings** — the classification criteria belong to `${CLAUDE_PLUGIN_ROOT}/agents/plan-validate.md` step 2, which the validator applies when writing the report; this phase only reads the prefix it left. For each, attempt autonomous resolution from the brief, the draft plan, and files already read in this run; a bounded codebase look-up (Read/Glob/Grep) is permitted when a single targeted check settles the question unambiguously. If resolved, mark the finding `[Resolved]` internally and record the resolution.
3. **Remaining unresolved questions** — if `--skip-interview` was set in Phase 1, leave them unresolved (they stay as `[Question]` in the v1 footer audit trail and in the saved report). Otherwise, run an `AskUserQuestion` interview following the rules in `${CLAUDE_PLUGIN_ROOT}/skills/run-interview/SKILL.md`, which govern the option format in full. Batch across multiple `AskUserQuestion` calls if needed, presenting findings in report order with any `[Question]` finding that gates other findings first. The user may decline individual questions mid-interview; declined questions remain unresolved.

**Write resolutions back to the report.** For every finding resolved from context or by interview, execute the write-back per `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/resolution-markers.md` — read it now; it carries the Edit-in-place shape and the Write-once fallback. This makes chained-flow interview answers durable: `/ace:plan-update --from-report` maps `[Resolved]` findings to `resolved-by-interview` and would otherwise lose them.

After this phase, every finding is in one of five states: applied (no prefix), advisory, resolved-from-context, resolved-by-interview, or left-unresolved (when `--skip-interview` was set OR the user declined mid-interview).

### Phase 9 — Pre-seed v1 and conditionally spawn plan-revisor

Phase 9 is a thin coordination step. The orchestrator owns v1 file creation and the audit footer in every path; the revisor (when spawned) only edits the v1 body.

Compute the v1 path: take the draft path and replace the `plan-v{m}` segment with `plan-v{m+1}`, where `{m}` is the source draft's version segment. Example: `plan-v0` -> `plan-v1` (`.ace/plans/20260430-0946-plan-v0-foo-1f459cff.md` -> `.ace/plans/20260430-0946-plan-v1-foo-1f459cff.md`). If the target path already exists, increment the version segment to `plan-v{m+2}`, `plan-v{m+3}`, ... until a free path is found. (A collision-incremented `plan-v{n}` may then pair with a lower `val-v{m}` report — the "report version matches the next revision" convention breaks in that reachable-only-via-manual-states case; the footer's `Validation report:` path remains the authoritative linkage.)

Compute the audit-footer values:
- Validation report path (repo-relative).
- ISO 8601 local timestamp (`date -Iseconds`).
- Unresolved-question count from Phase 8.

**Pre-seed v1 (every run).** The three-step block below is the canonical pre-seed definition, so the footer shape has this single writer definition: `/ace:plan-update` Phase 2A executes both this pre-seed block and the conditional-revisor-spawn block below by reference — reading them from this file — with its own inputs and its stated deltas (its state set excludes `resolved-from-context`; flow control stays with that skill).

1. `cp <draft path> <v1 path>` via Bash. On Windows MINGW64, both paths must be in POSIX form (`/c/...`).
2. Strip any existing `## Validation audit` block (the H2 header through end-of-file) from `<v1 path>` before appending. A `plan-v0` draft has no footer, so the strip is a no-op in this skill; it is load-bearing for the by-reference `/ace:plan-update` execution, whose staged issue bodies already carry a published footer — without the strip each round trip accretes a duplicate `## Validation audit` H2, violating the byte-identical-structure invariant below and leaving the revisor's "do not edit the audit footer" contract ambiguous.
3. Append the audit footer to `<v1 path>`. The canonical structure: a blank line, the `## Validation audit` H2 header, a blank line, then `- ` bullets for `Validation report: <repo-relative report path>` and `Validated on: <ISO 8601 timestamp>`. Append a third bullet `Unresolved questions: <count>` only when the count is greater than zero. The footer must be byte-identical in structure across runs so downstream `/ace:plan-implement` step 2 parsing (the `Validation report:` / `Validated on:` / `Unresolved questions:` bullets) remains agnostic to whether a revisor edit followed. (The `/ace:report-publish` pipeline Phase 10 runs appends a final `- Issue: <url>` bullet to the local file after publication; that bullet is absent from the published issue body by construction.)

**Conditional revisor spawn.** The block runs from this lead-in through the **Post-spawn checks** paragraph below, which is its final part; the Edit-failure paragraph after it is outside the block.

- If Phase 8 left no finding in an applied, advisory, or resolved state (zero findings parsed, or every parsed finding unresolved), skip the revisor spawn — the pre-seeded v1 is the final file. Unresolved findings do not trigger the spawn: the revisor's contract leaves them untouched, so spawning on an all-unresolved set is a guaranteed no-op, and the footer already records the unresolved count. Any finding in an `applied`, `advisory`, `resolved-from-context`, or `resolved-by-interview` state triggers the spawn. Proceed to Phase 10. The output banner reports `Plan revised: <v1 path>` as before.
- Otherwise, spawn the `plan-revisor` subagent via `Agent`:

  - `subagent_type`: `ace:plan-revisor`
  - `model`: `{Tier-3}`
  - Brief: the v1 path (the pre-seeded file with the footer already appended), the report path, and the parsed-and-resolved findings from Phase 8 (with their resolution state — applied / advisory / resolved-from-context / resolved-by-interview / unresolved). Do not pass the timestamp, the unresolved-question count, or the draft path; the orchestrator owns the footer and the revisor edits in place.

  The revisor reads the v1 file once, applies Edit calls to fold the resolved findings into the body, and returns a trailing ` ```result ` block with an `applied_count` key. It does not call Write and does not edit the audit footer.

**Post-spawn checks.** After the conditional spawn (or after pre-seed when the spawn was skipped), verify the v1 file exists and is non-empty. If verification fails, report and stop; the original draft and report are preserved on disk for manual recovery. Do not chain `/ace:report-publish`. When the revisor was spawned, parse the trailing ` ```result ` block from its reply and compare its `applied_count` against the number of applied/advisory/resolved findings passed to it (applied + advisory + resolved-from-context + resolved-by-interview; unresolved findings are excluded, as the revisor leaves them untouched by contract). On a mismatch, emit a one-line warning naming both counts — a revisor that silently folded fewer findings than passed still produces a non-empty file and would otherwise pass unnoticed. The warning does not stop the run.

If the revisor reports an Edit failure (non-unique anchor or anchor not found), the orchestrator reports the error and stops. The v1 on disk may be partially revised (the revisor applies Edits incrementally); the original draft remains pristine on disk for re-copying during manual recovery.

### Phase 10 — Publish v1 as a GitHub issue

When `--publish` is `no`, skip issue creation: no `- Issue:` bullet is appended to the audit footer, and the output banner's final line becomes the ready-to-run `/ace:report-publish <v1 path>` line instead of `Issue created:`.

Otherwise (`--publish yes`, the default), publish inline by executing the `/ace:report-publish` pipeline verbatim against the v1 file: read the bash pipeline from `${CLAUDE_PLUGIN_ROOT}/skills/report-publish/SKILL.md` and run it unchanged with `<v1 path>` as the path argument. That pipeline is the single definition of title composition (header `Title:`/`Type:`/`Stage:` fields with the `# ` H1 as `Title:` fallback; a v1 plan carries `Type: plan` in its header, so the title composes as `[PLAN] <plan H1>`) — running it from that file rather than restating it here is what guarantees this phase and a standalone `/ace:report-publish` can never emit diverging titles.

The issue body becomes the validated v1 content (including the audit footer). Capture `$URL` for the output banner. The pipeline itself persists the linkage: after `gh issue create` it appends `- Issue: $URL` to the artefact — a v1 plan carries `Type: plan`, so the append lands as the audit footer's final bullet — and nothing on disk is left without a record of which issue a revision was published to. The published issue body predates the append and lacks this one bullet; the divergence is accepted. On Windows MINGW64, `<v1 path>` must be in POSIX form (`/c/...`) for the pipeline's `head`/`grep`, redirection, and `--body-file` arguments — `gh` itself accepts either form, but the bash pipeline does not. The standalone `/ace:report-publish <path>` slash command remains the recovery path if this inline call fails; it runs the same inline `gh issue create` pipeline (including the linkage append) rather than a subagent. Print the v1 plan path alongside the error, so the re-invocation is ready to run. A failure shaped like `command not found` on coreutils or `unable to find git executable` is usually shell `PATH` degradation, not `gh` auth — apply the degraded-shell fallback documented in `${CLAUDE_PLUGIN_ROOT}/skills/report-publish/SKILL.md` (absolute binary paths, `--repo` on `gh issue create`) before re-invoking, since the standalone command would otherwise hit the identical failure.

**Reverse link (issue route only).** When the run's driving input arrived as an issue, post one comment to that source issue after the plan publishes — `gh issue comment <source-n> --body "Plan published: $URL"` — so the source pre-planner issue resolves forward to its plan; the plan's Context section cites the source issue in the other direction per the drafter contract, closing the linkage loop. If the comment post fails, warn and continue. Under `--publish no` there is no plan issue and no reverse link.

Output:

    Plan drafted:   .ace/plans/{yyyyMMdd}-{HHmm}-plan-v0-{slug}-{8hex}.md
    Plan validated: .ace/plans/{yyyyMMdd}-{HHmm}-val-v1-{slug}-{8hex}.md
    Plan revised:   .ace/plans/{yyyyMMdd}-{HHmm}-plan-v1-{slug}-{8hex}.md
    Issue created:  https://github.com/.../issues/<n>

On the issue route, append a fifth line `Source issue:   https://github.com/.../issues/<m>` noting the reverse-link comment (or its posting failure). Under `--publish no` no reverse link exists; the line still prints, minus the comment note, so the banner records the run's input.

If a re-run produced `plan-v2` or higher (collision against an existing revision), the second and third lines reflect the actual version used (`val-v2`, `plan-v2`, etc.). Under `--publish no`, the final line is instead:

    Publish with:   /ace:report-publish .ace/plans/{yyyyMMdd}-{HHmm}-plan-v1-{slug}-{8hex}.md

## Constraints

- Do not invoke `EnterPlanMode` or `ExitPlanMode` — reachable here: unlike the three agent files (`plan-drafter`, `plan-revisor`, `plan-validate`), this orchestrator carries neither a `tools:` allowlist nor `permissionMode` frontmatter, so nothing else forecloses plan mode at the platform level; those three drop this bullet because their own frontmatter already does.
- The validation report becomes mutable in Phase 8: findings resolved from context or by interview gain `[Resolved]`/`Answer:` markers written back in place. A pre-planner report becomes mutable in Phase 3: gate-resolved blocking questions gain the same markers on their `### Question` findings — on the issue route the staged copy receives them and the resolutions are additionally posted as one issue comment; the published issue body is never edited. No other phase mutates either report.

## Error handling

- Argument parsing fails, or a path-shaped token fails to resolve — see Phase 1 (pre-pass, and rule 3's path-shaped exception). GitHub issue URLs are exempt from the path rules — issue detection matches them first.
- An issue input's fetch fails, its body is empty, or it classifies as a published plan, a review report, or a scope envelope — see `references/issue-route.md` steps 1–2 for the exact conditions, messages, and redirect targets.
- The issue-route staging write fails — report and stop; do not proceed against a partial staged file (`references/issue-route.md` step 3).
- The Phase 3 resolution comment or Phase 10 reverse-link comment fails to post — see Phase 3 and Phase 10; both warn and continue.
- Pre-planner report transform failures (a missing or unparseable `### Workload split`, a missing `## Enhanced brief`) — see the failure modes in `references/pre-planner-transform.md`.
- Sceptic-veto Option 1 (Abort) selected — not an error path; see Phase 2.5.
- The planning subagent fails to write the file, or the verified plan file is empty — see Phase 6.
- The input is free-text and the drafter's `result` block is unparseable — see Phase 5.
- The validation subagent fails to return a report path, or the report file does not exist or is empty after it returns — see Phase 7.
- A `[Question]` finding cannot be resolved from context AND the user declined or `--skip-interview` was set — not an error; see Phase 8 and Phase 9 (v1 emission proceeds, footer records `Unresolved questions: <count>`).
- The plan-revisor subagent fails or the v1 file does not exist after it returns — see Phase 9.
- The chained `gh issue create` fails — see Phase 10.
