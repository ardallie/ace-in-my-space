---
name: agent-pre-planner
description: Runs a multi-agent pre-plan analysis (auto-sized team of one to seven analysts plus a sceptic) over an issue, file set, or conversation brief before entering plan mode. Produces a two-part report -- an enhanced brief followed by consolidated findings -- consumed by $ace:plan-start or a planning agent. Downstream of $ace:agent-arch-review and $ace:agent-scope, whose reports it consumes as briefs; not a post-implementation code review -- that is $ace:agent-code-review.
---
# Run a pre-plan analysis

**Invocation input:** `[--model <name or instruction>] [--agents 1-7] [--publish yes|no] <issue-number|file-path...>`

## Usage

- `$ace:agent-pre-planner` — uses the most recent actionable user message as the brief
- `$ace:agent-pre-planner <issue>` — uses the specified issue number (e.g., `85`)
- `$ace:agent-pre-planner <file1> <file2> ...` — reads files as the brief
- `$ace:agent-pre-planner [--model <name or instruction>] [--agents 1-7] [--publish yes|no] <inputs ...>` — flags first (in any order), positional second
- `--model` directs model selection for every analyst (sceptic included) — a model name or a prose instruction (a tier, a mix, a reference), resolved against the models the harness offers. Omit `--model` to let Phase 3 assign per agent: the sceptic on Tier-2, other analysts on Tier-3, plus at most one Tier-2 promotion for a load-bearing concern in broad or cross-cutting scope.
- `--agents N` sets the number of **non-sceptic** analysts (`1-7`). The sceptic is always added on top, so total analysts = `N + 1`. Omit `--agents` to auto-size the team from the scope discovered during exploration.
- `--publish yes|no` — publish the saved report as a GitHub issue (Phase 9, after the final save). Default `yes`.
- Text after the last valid file path or issue number is passed to all analysts as additional instructions

## Shared conventions

This skill consumes the suite's shared convention files under `../agent-shared/`; each phase names the file it applies. Read a shared file at the phase that first applies it:

- `input-conventions.md` — flag pre-pass, positional parsing, residual-token warnings (Phase 1)
- `analysis-conventions.md` — context-package checklist, analyst instructions, sceptic remit, consolidation rules, enhanced-brief regeneration rules (Phases 2, 4, 6)
- `team-mechanics.md` — team sizing, run suffix, pre-spawn capture, spawning, package handoff, collect, tree hygiene, sceptic re-spawn (Phases 3-5)
- `report-conventions.md` — standard header fields, save procedure, publish phase (Phases 6-9)
- `interview.md` — the canonical interview procedure (Phase 8)

## Context

Use this before entering plan mode. 
It spawns an analysis team to explore the codebase from multiple angles, surface risks, correct assumptions, and identify opportunities. 
The output is a two-part report: an enhanced brief followed by a consolidated findings list.

Unlike the review commands, this command takes no `--prior` flag: a pre-planner report's re-consumption channel is `$ace:plan-start` itself — passing the report (or its published issue) as the brief carries `[Resolved]` decisions forward as binding constraints and preserves its identifier namespace — so no separate re-review machinery is needed.

## Task

Nine phases executed in order.

### Phase 1 — Extract brief

Pre-pass: strip leading `--model {value}`, `--agents {value}`, and `--publish {value}` flags per the flag pre-pass in `../agent-shared/input-conventions.md` — read that file now; it carries the `--model` grammar, the `--publish` grammar, the positional parsing rules, and the residual-token warnings this phase applies.

Local deltas on the shared conventions:

- If no model guidance is supplied (via `--model` or the additional instructions), Phase 3 assigns each analyst's model from scope; there is no fixed default. Supplied guidance is honoured as a Phase 3 per-analyst assignment and recorded in the report's analyst list.
- `--agents` value is an integer `1-7` and sets the number of non-sceptic analysts. If `--agents` is present but its value is missing, non-integer, or outside `1-7`, report the valid range (`1-7`) and stop. If `--agents` is omitted, Phase 3 auto-sizes the count from scope; there is no fixed default.
- `--publish` defaults to `yes`. Drives Phase 9.

Main pass: apply the shared positional-parsing rules (file paths, issue number with the mixed issue-plus-files form, no arguments, and the prose-invocation fallback) to the remaining tokens, then the shared residual-token warnings. The parsed input is the brief.

**Scope directive.** When the additional instructions contain a scope directive of the form `Scope: ... only` (e.g. the per-brief invocation an arch-review report emits: `Scope: Brief 2 -- {title} ({ids}) only`), the directive binds the orchestrator as well as the analysts, not only the analysts' reading of the brief; Phases 2, 3, and 6 each state their own handling. When the directive's finding set disagrees with the input document's own description of the same brief (e.g. an emitted invocation dropped ids the brief description lists), the directive as given is authoritative — but flag the discrepancy in the report's Summary (or as a Question when the omission looks unintended) rather than resolving it silently.

### Phase 2 — Explore codebase

Perform targeted exploration driven by the brief and build a context package per the `## Context package` section of `../agent-shared/analysis-conventions.md` — read that file now; Phase 4 pushes its analyst instructions and Phase 6 applies its consolidation rules.

When a `Scope:` directive applies (Phase 1), read the whole brief for context but centre exploration on the scoped subset — its findings, files, and dependencies — and spend the exploratory budget there.

**Git-state verification for review-report inputs.** When the brief is a review report or prior analysis that cites a HEAD commit or claims a clean tree, verify those claims against the current repository state (`git rev-parse HEAD`; `git diff --stat <cited-head>` when they differ). If the cited HEAD is stale, note which cited claims the intervening commits may have invalidated and have the enhanced brief report the current HEAD — the analysis binds to the tree as it is now, not as the input saw it.

### Phase 3 — Evaluate scope and size the team

Having explored the codebase in Phase 2, decide how many analysts to spawn. When a `Scope:` directive applies (Phase 1), assess the scope signals and identify concerns from the scoped subset only — not the whole input document. The pre-planner feeds a downstream planner that re-derives much of this detail, so over-spawning duplicates effort and wastes tokens — bias toward fewer, broader analysts and reserve large teams for genuinely cross-cutting scope.

The auto-sizing rubric — the scope signals, the count bands, the sizing rule, band-boundary precedence, and the reconciliation of `N` against the identified concerns — is in `references/team-sizing.md`; read it before step 1. An explicit `--agents N` overrides the band as the source of `N`; the band is still selected on both paths, and the rubric's reconciliation rules apply on both paths.

1. **Assess scope size and complexity** against the rubric's scope signals and select a count band.
2. **Identify the distinct analytical concerns** the brief raises. Each concern is a lens a dedicated specialist would own — e.g. data model, query/caching, routing, auth, i18n, accessibility/keyboard, generator templates, testing. Derive concerns from the brief and the Phase 2 exploration; do not guess.
3. **Fit the concerns into the band to determine the non-sceptic count `N`**, per the sizing rule under the rubric's Count bands heading and its Reconciling `N` against the identified concerns section. When `--agents N` was supplied (Phase 1), honour it exactly — it overrides the band, and the reconciliation rules still apply. Fall back to `N = 1` for a narrow scope with no clear concern split, or `N = 3` only when scope is genuinely inconclusive.
4. **Name each non-sceptic analyst's specialisation** from the (possibly grouped) concerns. These specialisations feed into Phase 4 together with the model assignment below.
5. **Assign each analyst's model.** When model guidance was supplied (Phase 1 — via `--model` or the additional instructions), honour it per analyst — the default assignment below does not apply. When none was supplied:
   - The **sceptic** runs on Tier-2. Its premise-challenging judgement is where the heavier tier pays off.
   - Non-sceptic analysts run on Tier-3. The orchestrator runs the heavier session model, so verification-oriented lenses do not each need Tier-2.
   - When the scope falls in the broad or cross-cutting band, additionally promote the single most load-bearing concern — an architecture, cross-package-boundary, or unresolved-design lens — to Tier-2. At most one such promotion, and none if no concern clearly stands out.

   Record each analyst's assigned model; it surfaces in the Analysts list and the Summary.

### Phase 4 — Spawn analysts

Generate the run's hex suffix, capture the working-tree state and current commit, spawn all `N + 1` analysts in a single message, and hand off the context package per `../agent-shared/team-mechanics.md` (run suffix, pre-spawn capture, spawning, package handoff) — Phase 5's tree-hygiene check compares against the capture. Pass each analyst's Phase 3 model assignment as the per-spawn `model` parameter.

Each analyst receives: the brief (verbatim), the context package (by path, per the shared handoff rule), their specialisation, any additional instructions from the user, and the analyst instructions in `../agent-shared/analysis-conventions.md` `## Analyst instructions` (rules 1-8; `agent-arch-review`'s local rules 9 and 10 — the runtime-behaviour corrective instruments and the `--prior` prior-report classification — do not apply here).

Name each analyst `{role}-{suffix}` — the specialisation kebab-cased plus the run's hex suffix (e.g. `data-model-a3f9b2c1`); the sceptic is `sceptic-{suffix}`. These names fill the `[name]` slots in the report's `## Analysts` list.

The `N` non-sceptic analysts receive the specialisations named in Phase 3. One additional analyst is the **sceptic**, whose remit is in `../agent-shared/analysis-conventions.md` `## Sceptic remit`.

### Phase 5 — Collect analyses

Collect the analysts' final messages, run the tree-hygiene check against the Phase 4 capture, and apply the member-failure and sceptic re-spawn rules, all per `../agent-shared/team-mechanics.md` (collect, tree-hygiene check, member failure and the sceptic). Once all `N + 1` have returned, proceed. Beyond the shared sceptic rule: the sceptic's absence undermines the downstream sceptic-veto gate (`$ace:plan-start` Phase 2.5, `../plan-start/references/pre-planner-transform.md`), which depends on the premise-challenge layer.

### Phase 6 — Generate report

The report's two content sections, the order they are built and presented in, and the enhanced-brief regeneration rules are in `../agent-shared/analysis-conventions.md` `## Enhanced brief` — read that file now if Phase 2 did not. Apply it with the local additions below.

**Findings**

Apply the consolidation rules in `../agent-shared/analysis-conventions.md` `## Consolidation rules`, plus the local rules below:

- **Derived briefs occupy the identifier namespace.** When the input brief is itself a findings document carrying category-prefixed identifiers (an arch-review, a prior pre-planner report), preserve the input's IDs for its items — do not renumber them — and number only new pre-planner findings from the next free slot in each category (an input ending at R4 means new risks start at R5). Never assign an identifier the input already binds to a different item; every reference then names exactly one finding across brief and report. For fresh (non-derived) briefs, the shared contiguous-numbering rule applies unchanged.
- The before-planning test governs the question priority tag: a question that changes the plan's content or file-set without changing the plan count or entry point is still `[blocking]` when the plan cannot be written without the answer. (The load-bearing/route test in `../plan-route/SKILL.md` — would different answers produce a different route or entry point? — classifies questions for workflow routing; it does not tag report questions.)

**Enhanced brief**

Apply the shared regeneration rules, plus the pre-planner-local additions below:

- When a `Scope:` directive applies (Phase 1), regenerate only the scoped subset of the input, state the restriction in the Summary, and omit the out-of-scope remainder rather than regenerating the whole multi-brief document
- A derived brief may be a multi-section report (an enhanced-brief section plus findings, appendices, and folded-in consultation answers) rather than a linear brief to walk: assembling the scoped subset into one coherent itemised brief is expected synthesis, not a deviation from the shared carry-forward rule
- Informal prose citation of upstream findings (e.g. "corrects the arch-review's O3 framing") is acceptable style with no mandated namespace. This rule is the canonical copy; `../agent-scope/SKILL.md` carries an aligned copy of it

**Open questions** remain as a distinct subsection — they require user input and cannot be resolved into the narrative. Each line begins with the question's `Q{n}` identifier (matching its `### Question` finding) and a single trailing space, followed by its priority tag `[blocking]` or `[deferrable]` verbatim; both are mandatory on every line — prose group labels do not substitute for them. `$ace:plan-start`'s transform (`../plan-start/references/pre-planner-transform.md`) matches the tags literally over this block and anchors its write-back on `Q{n} `; the anchor rule is restated beside the skeleton in `assets/report-template.md`. Order the lines blocking first, then deferrable.

A finding marked `(optional)` — in the Scope directive's id list or, when the directive carries bare ids, in the input document's own covers list — is an owner decision deferred to this run: surface its keep/drop fate as a `[deferrable]` open question, with the analysts' consensus as the recommended option — never silently fold the recommendation in, even when the analysts agree. Silently folding costs the owner the decision; a deferrable question costs one interview option.

If the scope is large enough to warrant multiple implementation stages, include a workload split as the final part of the enhanced brief. Evaluate scope by considering: the number of distinct subsystems affected, the depth of the dependency chain between tasks, and whether intermediate validation gates exist.

When splitting is warranted, list each plan with a short title, its constituent tasks, dependencies on prior plans, and a validation gate (how to verify that plan's work before proceeding). Order plans by dependency — earlier plans must not depend on later ones. When the scope is narrow, state that a single plan is sufficient.

End the split with an explicit machine-checkable recommendation line: `Recommendation: {N} plan(s)` (e.g. `Recommendation: 1 plan`) when planning is warranted, or `Recommendation: no plan` when the analysis argues against producing a plan. `$ace:plan-start` Phase 2.5 (`../plan-start/references/pre-planner-transform.md`) matches this line before falling back to its prose regex, so the line is mandatory.

When the split's shape depends on an open question, emit the split as an explicit placeholder stating the dependency (which question, which shapes each answer produces); Phase 8 finalises it after the interview.

**Standard header fields.** Per `../agent-shared/report-conventions.md` `## Standard header fields`, with `Type: pre-planner`. The numbered stage this skill emits `Stage: {n}/{m}` for is a `Scope: Brief {n}` directive over an `{m}`-brief input: the directive supplies `{n}`; derive `{m}` from the input's own split enumeration (e.g. an arch-review's Workload assessment lists the briefs). When the input carries no enumerable total, omit `Stage:` rather than guess.

Output the report per the skeleton in `assets/report-template.md` — read it before generating; bracketed text is guidance, not literal output.

### Phase 7 — Save report

Write the report to `.ace/plans/{yyyyMMdd}-{HHmm}-agent-pre-planner-{suffix}.md` per the save procedure in `../agent-shared/report-conventions.md` `## Save report` (`{suffix}` is the Phase 4 hex suffix).

If the report contains an `### Open questions` subsection with questions, proceed to the interview phase. Otherwise skip to Phase 9.

### Phase 8 — Interview

Follow the canonical interview procedure in `../agent-shared/interview.md` — read it now; it carries the run/collect/update/save mechanics and the unresolved-marker grammar. Two stated divergences: deferrable questions left unanswered flow to the planner via `$ace:plan-start`'s "Resolve in the plan" constraint lines (its pre-planner transform, `../plan-start/references/pre-planner-transform.md`) rather than being re-asked (deferrable questions are still interviewed whenever the user is present), and when one question's relevance depends on another's answer, fold the conditional into the parent question's options rather than asking it separately. These two rules are the canonical copy; `../agent-scope/SKILL.md` carries an aligned copy of them.

Local bindings for the shared update rules:

- The assessment sections to re-read are `## Summary` and `### Workload split` — revise any statement the answers invalidate (e.g. "one design decision remains for the planner" after that question was resolved, or a split whose shape depended on an answer). A Phase 6 placeholder split is finalised here from the answers.
- On a successful save, the changed sections to output are the woven-in answers, the updated Question findings, any unresolved marker, and the Open questions removal.

Proceed to Phase 9.

### Phase 9 — Publish

Follow the publish phase in `../agent-shared/report-conventions.md` `## Publish`; the default here is `--publish yes`.

Beyond the shared `## Publication` block note: the publish pipeline appends the block after creating the issue, so it is not part of the Phase 6 skeleton and the published issue body does not contain it (divergence accepted).

## Error handling

- If `--agents` has a missing, non-integer, or out-of-range value, report the valid range (`1-7`) and stop
- If `gh` commands fail outside Phase 9's publish step, report the error and stop
