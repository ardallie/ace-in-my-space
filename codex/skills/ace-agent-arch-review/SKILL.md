---
name: ace-agent-arch-review
description: Runs a multi-agent architectural review (three to six analysts, sceptic included) over a feature, subsystem, structure mapping, GitHub issue, or file set. Produces a two-part report -- an enhanced brief followed by consolidated findings -- that feeds into $ace:ace-agent-pre-planner or a planning session. Not a code review -- use $ace:ace-agent-code-review for pre-PR review.
---
# Run an architectural review

**Invocation input:** `[--model <name or instruction>] [--prior <report-path>] [--checks full|cheap|skip] [--publish yes|no] <issue-number|file-path...>`

## Usage

- `$ace:ace-agent-arch-review` — uses the most recent actionable user message as the scope area
- `$ace:ace-agent-arch-review <issue>` — uses the specified issue (bare number, e.g. `85`, or full issue URL)
- `$ace:ace-agent-arch-review <file1> <file2> ...` — reads files as the scope area definition
- `$ace:ace-agent-arch-review [--model <name or instruction>] [--prior <report-path>] [--checks full|cheap|skip] [--publish yes|no] <inputs ...>` — flags first (in any order), positional second
- `--model` directs model selection for every analyst (sceptic included) — a model name or a prose instruction (a tier, a mix, a reference), resolved against the models the harness offers. Omit `--model` to let Phase 3 assign per agent: the sceptic on Tier-2, other analysts on Tier-3, plus at most one Tier-2 promotion for a load-bearing concern.
- `--prior P` — path to a previous arch-review report for the same scope; analysts verify its findings against the current state (re-review). Prior reports are pushed only when passed explicitly — there is no auto-detection. The prior report also carries forward interview decisions (its `[Resolved]` question answers) — pass it for any repeat review of the same scope, not only to verify remediation. A `--prior`-only invocation (no positional inputs) is the canonical re-review-same-scope form — the scope seeds from the prior report (Phase 1).
- `--checks full|cheap|skip` — how much of the Phase 2 shared verification battery runs before analysts spawn; tier definitions in `../agent-shared/verification-checks.md`. Default `cheap` — the typical review runs the cheap battery; `full` (the whole CI gate set) and `skip` (no shared battery; the report, context package, and spawn prompts record that) are per-run opt-ins. `skip` does not suppress the `--prior` pre-build (Phase 3).
- `--publish yes|no` — publish the saved report as a GitHub issue (Phase 8, after the final save). Default `yes`.
- Text after the last valid file path or issue number is passed to all analysts as additional instructions. When the first token is neither a file nor an issue number and an actionable brief exists in conversation context, the entire argument text is treated as additional instructions over that brief (Phase 1)

Mapping files under `.ace/mappings/{features,subsystems,structure}/` are classified by path prefix and traversed per type. Examples:

- `$ace:ace-agent-arch-review .ace/mappings/features/{slug}.md` — feature scope
- `$ace:ace-agent-arch-review .ace/mappings/subsystems/{slug}.md` — subsystem scope
- `$ace:ace-agent-arch-review .ace/mappings/structure/{package}/{module}.md` — structure scope

## Shared conventions

This skill consumes the suite's shared convention files under `../agent-shared/`; each phase names the file it applies. Read a shared file at the phase that first applies it:

- `input-conventions.md` — flag pre-pass, positional parsing, residual-token warnings (Phase 1); the adjacent-toolchain input convention the mappings tree is read under (Phases 1-3)
- `verification-checks.md` — the `--checks` flag grammar, the shared-battery tier definitions, and the record grammar for what ran (Phase 2; the Usage and Phase 1 flag bullets restate the grammar)
- `analysis-conventions.md` — context-package checklist, analyst instructions, sceptic remit, consolidation rules, enhanced-brief regeneration rules (Phases 2, 3, 5)
- `team-mechanics.md` — team sizing, run suffix, pre-spawn capture, spawning, package handoff, collect, tree hygiene, sceptic re-spawn (Phases 3-4)
- `report-conventions.md` — standard header fields, save procedure, publish phase (Phases 5-8)
- `interview.md` — the canonical interview procedure (Phase 7)

## Context

Use this for systematic architectural review, feature by feature or module by module. It surfaces technical debt and informs a separate planning session. It is designed for incremental sweeps — invoke against one feature, subsystem, or module mapping per session, then iterate across the inventory over time.

Each invocation spawns an analysis team that examines the chosen scope from multiple angles. The output is a two-part report: an enhanced brief followed by a consolidated findings list.

This is not a code review — it produces architectural findings that feed directly into a pre-planning session. Invoke `$ace:ace-agent-pre-planner` with this report, or pass it to a planning agent.

## Task

Eight phases executed in order.

### Phase 1 — Extract brief

Pre-pass: strip leading `--model {value}`, `--prior {path}`, `--checks {value}`, and `--publish {value}` flags per the flag pre-pass in `../agent-shared/input-conventions.md` — read that file now; it carries the `--model` grammar, the `--publish` grammar, the positional parsing rules, and the residual-token warnings this phase applies.

Local deltas on the shared conventions:

- If no model guidance is supplied (via `--model` or the additional instructions), Phase 3 assigns each analyst's model; there is no fixed team-wide default. Supplied guidance is honoured as a Phase 3 per-analyst assignment and recorded in the Summary's `Analysts:` rationale.
- `--prior` value is a path to a previous arch-review report. If the value is missing or does not resolve to a readable file, report the error and stop. Read the file — it is pushed to all analysts in Phase 3, outside any read cap.
- `--checks` value, when supplied, selects the shared-verification tier defined in `../agent-shared/verification-checks.md`; accepted values `full`, `cheap`, and `skip`. If parsing fails (missing value or any other value), report the valid values and stop. If omitted, `cheap`. Drives Phase 2.
- `--publish` defaults to `yes`. Drives Phase 8.

Main pass: apply the shared positional-parsing rules (file paths, issue number with the mixed issue-plus-files form, no arguments, and the prose-invocation fallback) to the remaining tokens, then the shared residual-token warnings. The parsed input is the brief. Four local divergences:

- **Unreadable tokens** — a token that exists on disk but is not a readable regular file (directories included) is an error: report it and stop (do not fold it into additional instructions). This broader test replaces the shared "exists but is not readable" test throughout the parsing rules.
- **Issue URL form** — an issue may also be given as a full GitHub issue URL, from which the number is extracted via the regex `github.com/([^/]+)/([^/]+)/issues/(\d+)`; it is then fetched and handled exactly as a numeric issue token.
- **Mapping-aware classification** — if any file in the list resolves under `.ace/mappings/`, classify it per `references/mapping-traversal.md` — read that file when (and only when) a mapping path appears; it carries the classification rule, the index-file rejection (report and stop), the mixed-form exception, and Phase 2's per-type traversal.
- **`--prior` with no positional tokens** — the canonical re-review-same-scope form; it matches before the no-arguments rule. Seed the scope from the prior report itself: its `Source:` field (including any parenthesised issue/package reference) names the original inputs, and its Summary and enhanced brief define the scope area. Re-read any `Source:` file inputs that still exist and combine with actionable conversation context when present. When the prior report's `Source:` is a bare `conversation context`, take the most recent actionable message in this conversation as the scope area; if none exists, use `request_user_input` when it is available in Plan mode, otherwise ask the same concise plain-text question, to clarify the scope.

One further divergence from the shared final rule: if the first token does not exist as a file and is not an issue number (numeric or URL form), and no actionable conversation context exists, do not stop — use `request_user_input` when it is available in Plan mode, otherwise ask the same concise plain-text question, to clarify (the exists-but-unreadable error above takes precedence over this prompt; a leading `--model` flag has already been stripped or errored by the pre-pass). Present the input value and the available forms (file path, issue number, no arguments), then proceed based on the user's response.

### Phase 2 — Explore codebase

Perform targeted exploration driven by the brief and build a context package per the `## Context package` section of `../agent-shared/analysis-conventions.md` — read that file now; Phase 3 pushes its analyst instructions and Phase 5 applies its consolidation rules. In the multi-brief case the Context files section is grouped per suggested brief, per the report skeleton.

**Mapping-aware traversal** — when Phase 1 classified the scope as a mapping file, apply the per-type traversal in `references/mapping-traversal.md` (feature, subsystem, and structure scope rules; cap exemptions; the mappings-are-reference-snapshots note).

- Pre-verify the brief's load-bearing claims against the tree and hand analysts the verified divergences as leads with a confirm-extend-refute framing, rather than leaving each analyst to rediscover them.
- **Mark a primary owner per lead** when a lead goes to multiple analysts — deliberate double-coverage stays available where wanted, but unmarked leads invite redundant triple confirmation on expensive teams.

**Shared verification before spawning** — apply the selected `--checks` tier, per the tier definitions in `../agent-shared/verification-checks.md` — read that file now. Record the applied tier alongside each command and its exact result in the context package as established facts; instruct analysts not to re-run recorded gates. Where the run executed no gates — `skip` by flag, or a tier that resolved to an empty gate set — record the mode in the context package instead, per that file's record grammar and its degradation rules. In every run the report's Summary carries a `Checks:` line in the same grammar (`assets/report-template.md` carries the field's guidance): the context package is a temporary file, so the report line is the durable record and must carry enough to stand alone.

- Recorded gate results attest to HEAD state only — they do not license skipping rule 9's change-specific probes; verifying a proposed change's feasibility still requires the analyst's own probe. Rule 9 is independent of `--checks`: `skip` disables the parent's shared battery, never the analysts' probes.

### Phase 3 — Spawn analysts

Generate the run's hex suffix and capture the working-tree state and current commit per `../agent-shared/team-mechanics.md` (run suffix, pre-spawn capture) — Phase 4's tree-hygiene check compares against the capture.

**Team size.** Size the team per `../agent-shared/team-mechanics.md` `## Team sizing`. For the typical work-package or comparably broad scope, spawn six analysts: the two pre-defined analysts, three flexible analysts, and the sceptic. For a tightly scoped feature or structure mapping, spawn flexible analysts only for genuine gaps not covered by the pre-defined pair — one or two, possibly none — giving a reduced team of three to five analysts (the pre-defined pair, any gap-covering flexible analysts, and the sceptic). When `--prior` was supplied, default to the reduced band regardless of scope — a re-review is mostly verification of known findings; escalate to six only when the scope has materially grown since the prior report, and note the escalation in the Summary's `Analysts:` rationale.

**Model assignment.** When model guidance was supplied (Phase 1 — via `--model` or the additional instructions), assign models per analyst to honour it and record the assignment in the `Analysts:` rationale. When none was supplied:

- The **sceptic** runs on Tier-2 — its premise-challenging judgement is where the heavier tier pays off.
- Other analysts run on Tier-3 — adequate for scoped analytical lenses, with the sceptic's Tier-2 slot covering the open-ended judgement. Do not raise this default without new evidence.
- At most one non-sceptic analyst owning the single most load-bearing concern (an architecture, cross-package-boundary, or unresolved-design lens) may be promoted to Tier-2; none if no concern clearly stands out.

Record each analyst's assigned model; it surfaces in the `## Analysts` list and the Summary's `Analysts:` line, together with the team-size rationale.

**Naming.** Name each analyst `arch-{specialisation-slug}-{suffix}` (e.g. `arch-architecture-a3f9b2c1`, `arch-sceptic-a3f9b2c1`) and use these names in the report's `## Analysts` list.

Spawn the analysts in a single message and hand off the context package per `../agent-shared/team-mechanics.md` (spawning, package handoff), passing each analyst's model assignment as the per-spawn `model` parameter.

When `--prior` was supplied, build the affected projects once before spawning (the project's build command, where the project defines one — a scope with no build surface skips this step) and state in the package that the built state is current — analysts reuse it for probes (no-rebuild test runs) instead of each rebuilding the same HEAD. This pre-build is a probe-support step, not part of the shared battery: it runs under every `--checks` tier, `skip` included, and appends the `(+ --prior pre-build)` suffix to the `Checks:` record per `../agent-shared/verification-checks.md`, so a `skip` run never reads as having built nothing. Under `--checks full` the battery's own build satisfies it — build once and omit the suffix.

Each analyst receives: the brief (verbatim), the context package (by path, per the shared handoff rule), their specialisation, the prior report when `--prior` was supplied (outside the exploratory read cap), any additional instructions from the user, and the analyst instructions below. The spawn prompt states that the package's recorded gate results (Phase 2, shared verification before spawning) are established facts analysts must not re-run; where the run executed no gates — `--checks skip`, or a tier that resolved to an empty gate set — there are no recorded gate results, and the spawn prompt instead states that no shared battery ran and that rule 9's change-specific probes still apply.

Two analysts receive pre-defined specialisations (Architecture and Maintainability). The flexible analysts receive specialisations chosen by the system based on the brief and Phase 2 exploration; each new system-assigned analyst covers gaps not addressed by the analysts already assigned. The last analyst is the **sceptic**, whose remit is in `../agent-shared/analysis-conventions.md` `## Sceptic remit`.

- **1. Architecture analyst** (pre-defined) -- Separation of concerns, coupling, data flow, abstractions, module boundaries, shared functionality
- **2. Maintainability analyst** (pre-defined) -- Dead code, redundancy, naming consistency, complexity hotspots, test alignment
- **3-5. Flexible analysts** (system-assigned; three on the typical scope, fewer on a narrow scope per the team-size rule above) -- Gap coverage relative to the analysts already assigned
- **Last. Sceptic** (pre-defined, always spawned) -- Additionally questions whether problems are real or cosmetic; owns the gold-plating / duplication instrument (rule 9)

Pre-defined analysts receive their specific review dimensions. System-assigned analysts receive dimensions appropriate to their chosen specialisation.

Each analyst must follow rules 1-8 in `../agent-shared/analysis-conventions.md` `## Analyst instructions`, plus the two arch-review-local rules:

9. When the brief proposes or reviews changes to runtime behaviour or to the shape of generated output — judged from the brief and the Phase 2 exploration at spawn time, not from the Phase 5 stamp flags — apply three corrective instruments before recommending a finding. The analysts inherit execution-class tool grants (the project's compile/typecheck, test, and package-manager commands, plus `git`), so these are full execution checks, not grep-only. Every probe must leave no residual working-tree diff — `git status` clean afterwards; throwaway test artefacts are deleted before the analyst returns, and probes that mutate files follow rule 6's worktree/scratchpad-or-revert constraint:
   - **Source-verify every Opportunity and Risk** — run the project's cheapest compile or typecheck probe (and other cheap execution checks) to confirm a claim is feasible before it becomes a finding. This tests truth and feasibility (a constraint), so it is compatible with rule 4 ("leave design space for the planner") — it constrains *what is true*, not *how to implement*. Concentrate this on the Architecture analyst and the flexible analysts whose dimension covers the scope.
   - **Git-history drift-frequency analysis** — use `git log` / `git show` to weigh whether a flagged area churns enough to justify the proposed scope.
   - **Gold-plating / duplication check** — check whether a proposed addition duplicates existing behaviour or over-builds; this sits in the sceptic's remit.
10. **Prior report** (when `--prior` was supplied) — verify each prior finding against the current state and classify it: remediated, still open, or superseded, with file:line or probe evidence for remediated and superseded classifications. A finding remediated at only part of its named surface is classified still open (noting the remediated surface), with the residue promoted to a new finding under Phase 5's continue-above-max numbering. Re-check the prior report's backlog candidates the same way. The parent consolidates the classifications in Phase 5, and may partition the prior findings across analysts by primary ownership, provided every finding has an owner and any analyst may classify any finding; disagreements resolve by Phase 5's still-open-wins rule.

**Mappings are out of scope as a review subject.** Treat every `.ace/mappings/` file as read-only reference material — scope definition and context, not a deliverable. Mappings are generated once (an expensive step) and reused across a round of arch reviews, so regeneration is out of scope. Do not flag a mapping as stale or out of date, and never recommend regenerating or updating a mapping or re-running a `/crawler-*` command. This does not restrict work on the brief's content: when a mapping conflicts with source, source is authoritative — surface the discrepancy as a Correction that fixes the brief in place (with file:line evidence), and fold any missing-but-relevant behaviour into the enhanced brief. Frame these as statements about the source ("source does X"), never as "the mapping is stale — regenerate it".

### Phase 4 — Collect analyses

Collect the analysts' final messages, run the tree-hygiene check against the Phase 3 capture, and apply the member-failure and sceptic re-spawn rules, all per `../agent-shared/team-mechanics.md` (collect, tree-hygiene check, member failure and the sceptic). Beyond the shared sceptic rule: the premise-challenge layer and the gold-plating instrument (rule 9) are the report's differentiating guarantee.

### Phase 5 — Generate report

The report's two content sections, the order they are built and presented in, and the enhanced-brief regeneration rules are in `../agent-shared/analysis-conventions.md` `## Enhanced brief` — read that file now if Phase 2 did not. Apply it with the local additions below.

**Findings**

Apply the consolidation rules in `../agent-shared/analysis-conventions.md` `## Consolidation rules`, plus the local rules below:

- For `--prior` re-reviews, continue above the prior namespace: number new findings from the next free slot above the prior report's per-category maximum (a prior report ending at R4 means new risks start at R5) — never assign an identifier the prior report already binds, so a bare `R1` and a `prior:R1` citation can never denote different findings in one report. For fresh reviews, the shared contiguous-numbering rule applies unchanged.
- Drop any finding or recommendation that treats a mapping as an artefact to fix — staleness flags, or regenerating/updating/re-running `/crawler-*` (Phase 3 mappings rule). Mapping-vs-source discrepancies stay as in-place Corrections to the brief (source authoritative), never regeneration tasks
- **Contradictory fresh findings.** When two analysts assert contradictory facts, the claim backed by the more specific verified evidence — an executed probe or a file:line chain — wins, and the contradicted claim is dropped. Surface both with the contradiction stated when neither claim is more specifically evidenced: either both are probe-backed, or neither is and the cited evidence is comparably specific. (The same tie-break shape as the prior-findings still-open-wins rule below.)
- Prior findings (when `--prior` was supplied): the parent owns the consolidation of the analysts' classifications. On disagreement, still open wins unless a remediated or superseded classification cites file:line or probe evidence. Prior findings live only in the `### Prior findings` section, cited with the `prior:` prefix (e.g. `prior:R2`)

**Enhanced brief**

Apply the shared regeneration rules, plus the arch-review-local additions below:

- The premise-overturned exception is widened here: it also covers the post-implementation case, where the described work has already merged, and the licence may be cited from a Correction, a Confirmed finding, or the brief's own declaration.
  - **Post-implementation inputs are a recognised class.** A brief may describe work that has already merged by the time the review runs (e.g. a work package reviewed retrospectively). For such inputs the enhanced brief may restructure into a landed / diverged / still-open form rather than walking the original element by element, citing the Correction or Confirmed finding that establishes the work as merged — or the brief's own declaration when it states this itself.
  - A `--prior` re-review of remediation work is a named sub-case of this class: the enhanced brief may restructure into a confirmed-closed / residual / carried-forward form, citing the prior-finding classifications that establish each bucket. Gaps introduced by the remediation itself are first-class new findings — numbered per the Phase 5 continue-above-max rule, never annotations on prior findings.
- Where a source-verified instrument (Phase 3 rule 9) overturns a claim, surface it as a Correction with the compile-probe / `git` / grep evidence inline, reusing the shared file:line evidence format.
- When `--prior` was supplied, carry the prior report's `[Resolved]` question answers forward as established design decisions (constraints) woven into the narrative — never re-open them as fresh questions unless the current state contradicts the recorded answer

**Open questions** remain as a distinct subsection — they require user input and cannot be resolved into the narrative. Group questions by priority: blocking first, then deferrable. A Question finding answerable only by an external probe or a third party — not by the user — is excluded from this subsection and from the Phase 7 interview: it stays in `### Question` carrying a routing note naming who or what can settle it, and still receives a disposition in the Workload assessment. Putting an unanswerable question in front of the user is never correct.

**Workload assessment** — at the end of the enhanced brief, include a scope assessment that tells the downstream pre-planning session whether a single brief can absorb the findings or whether they should be split across multiple briefs. Evaluate scope by considering: the number of distinct subsystems or modules implicated by the findings, the depth of dependencies between proposed changes, and whether intermediate validation gates make staging necessary. Mapping regeneration is never a workload item or suggested brief (Phase 3 mappings rule); the assessment covers source-code work only.

When splitting is warranted, list each suggested pre-planning brief with a short title, the findings it covers (by identifier — e.g., C1, R3, O2), and any ordering dependencies on prior briefs. When `--prior` was supplied, a suggested brief and its stamp may additionally cite still-open prior findings using a `prior:` prefix (e.g. `prior:C3`) so identifier hygiene stays checkable — never a bare prior identifier. Order briefs by dependency — earlier briefs must not depend on later ones. When the scope is narrow enough for one session, state that a single pre-planning brief is sufficient.

For every suggested brief — including the single-brief case — emit a structured per-brief stamp with two parts:

- **(a) Flag fields** — four computable flags set from the findings. Definitions:
  - `behaviour-change` — the brief's work alters observable runtime behaviour (rendered output, requests, persisted data), not only internal structure, documentation, or tests.
  - `cross-package` — the covered findings implicate files in more than one separately built or separately versioned unit of the repository (package, project, module — e.g. an app package and an API-client package, or two projects in one multi-project build).
  - `generated-runtime-shape` — the work changes the shape of generated code or artefacts consumed at runtime (e.g. code-generator output or schema-derived types).
  - `mechanical` — the work is repetitive and judgement-free once specified (renames, documentation/comment updates, test-only alignment) with no design decisions.

  The flag field in the stamp contains only the set flags as `|`-separated tokens from these four names (or `none`) — no prose inside the brackets.
- **(b) Advisory routing hint** — `Pre-planner: RECOMMENDED | SKIP`, derived from the flags alone: `RECOMMENDED` when any of `behaviour-change` / `cross-package` / `generated-runtime-shape` is set, `SKIP` when none is set. The hint is a human-read routing aid, not a mechanical gate, and there is no `OPTIONAL(delta)` state.

When the assessment splits scope into more than one brief, include a shared-file matrix listing each file touched by more than one of the emitted briefs and the briefs that collide on it. The matrix covers only collisions among the briefs the arch-review itself emits; it does not and cannot catch briefs discovered out-of-band during execution — do not claim coverage of later-discovered briefs.

**One disposition per finding.** There are three dispositions: covered by a suggested brief (its covers list), backlog candidate, and out-of-scope/down-ranked. No finding may appear in more than one. Every actionable finding (Correction, Risk, Opportunity, and each unresolved Question) receives exactly one; Confirmed findings and purely informational Insights need none. A take-it-or-leave-it finding that a brief could absorb but does not require is listed in that brief's covers list with an `(optional)` marker, not double-listed as a backlog candidate. A brief's pre-planner invocation id list must equal its covers list minus resolved questions — the two adjacent lines define the same brief and must not disagree.

**Backlog candidates — listed for manual capture.** Findings that fall outside every suggested brief's core scope — of any severity, each with a one-line stated reason (e.g. belongs to another cluster, warrants its own future brief) — are listed under a "Backlog candidates" heading at the end of the Workload assessment, not folded into a suggested brief. Every entry cites a finding identifier: a gap with no consolidated finding is promoted to a finding before listing, or omitted. When `--prior` was supplied, the prior report's backlog candidates are re-checked (analyst rule 10) and re-listed with their classification, cited by `prior:` identifier; remediated entries drop out. Findings deliberately down-ranked or ruled out of scope are listed under the optional "Out of scope / down-ranked" heading with the reason for exclusion — that heading is their single disposition, exclusive of the backlog list.

**Standard header fields.** Per `../agent-shared/report-conventions.md` `## Standard header fields`, with `Type: arch-review`.

Output the report per the skeleton in `assets/report-template.md` — read it before generating; bracketed text is guidance, not literal output.

### Phase 6 — Save report

Write the report to `.ace/arch-review/{yyyyMMdd}-{HHmm}-ace-agent-arch-review-{suffix}.md` per the save procedure in `../agent-shared/report-conventions.md` `## Save report` (`{suffix}` is the Phase 3 hex suffix).

If the report contains an `### Open questions` subsection with questions, proceed to the interview phase. Otherwise skip to Phase 8.

### Phase 7 — Interview

Follow the canonical interview procedure in `../agent-shared/interview.md` — read it now; it carries the run/collect/update/save mechanics and the unresolved-marker grammar. This skill has no divergences from it.

Local bindings for the shared update rules:

- The assessment sections to re-read are `## Summary` and `### Workload assessment`; a wholesale rewrite here means briefs added, dropped, or re-scoped, backlog candidates re-dispositioned, and affected findings updated.
- On a successful save, the changed sections to output are the woven-in answers, the updated Question findings, any revised Summary or Workload assessment passages, any unresolved marker, and the Open questions removal.

Proceed to Phase 8.

### Phase 8 — Publish

Follow the publish phase in `../agent-shared/report-conventions.md` `## Publish`; the default here is `--publish yes`.

## Constraints

- The report feeds directly into `$ace:ace-agent-pre-planner` or a planning agent — do not produce a change list or implementation plan
- Mappings under `.ace/mappings/` are an adjacent-toolchain input per `../agent-shared/input-conventions.md` `## Adjacent-toolchain inputs` — the mappings-specific binding is in the Phase 3 mappings note

## Error handling

- If `--prior` does not resolve to a readable file, or `--checks` has a missing value or one outside `full`/`cheap`/`skip`, report the error and stop
- If a token exists on disk but is not a readable regular file (directories included), report the error and stop
- If a mapping index file (`_index.md`, `_graph.md`, `_summary.md`) is passed as scope, report the message in `references/mapping-traversal.md` and stop
- If `gh` commands fail outside Phase 8's publish step, report the error and stop
