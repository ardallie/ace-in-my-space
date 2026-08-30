---
name: agent-scope
description: Runs a deliberative multi-agent panel (one to four lenses plus a sceptic) over a large, loosely specified ambition -- a new feature area, a major architectural change, a deep refactor -- producing a scope envelope -- a grounded direction, achievable goals, a concern-axis sweep, an assumption inventory, and a staged workload split, each stage sized to one $ace:agent-pre-planner plus plan cycle. Reserved for the largest initiatives; typical work enters at $ace:agent-pre-planner instead.
---
# Run a scoping analysis

**Invocation input:** `[--model <name or instruction>] [--publish yes|no] <issue-number|file-path...>`

## Usage

- `$ace:agent-scope` — uses the most recent actionable user message as the ambition
- `$ace:agent-scope <issue>` — uses the specified issue number (e.g., `85`)
- `$ace:agent-scope <file1> <file2> ...` — reads files as the ambition (specification, requirements, sibling-system notes)
- `$ace:agent-scope [--model <name or instruction>] [--publish yes|no] <inputs ...>` — flags first (in any order), positional second
- `--model` directs model selection for every panel member (sceptic included) — a model name or a prose instruction (a tier, a mix, a reference), resolved against the models the harness offers. Omit `--model` for the default assignment: every panel member on Tier-2 (rationale, and the Tier-1 opt-in, in Phase 4).
- `--publish yes|no` — publish the saved report as a GitHub issue (Phase 9, after the final save). Default `yes`.
- Text after the last valid file path or issue number is passed to all panel members as additional instructions; it may name a sibling system the envelope must probe against, or direct a per-member model mixture in prose (Phase 1).

## Shared conventions

This skill consumes the suite's shared convention files under `../agent-shared/`; each phase names the file it applies. Read a shared file at the phase that first applies it:

- `input-conventions.md` — flag pre-pass, positional parsing, residual-token warnings (Phase 1); the adjacent-toolchain input convention the system specification is read under (Phase 2)
- `team-mechanics.md` — team sizing, run suffix, pre-spawn capture, spawning, package handoff, collect, tree hygiene, sceptic re-spawn (Phases 4-5)
- `report-conventions.md` — standard header fields, save procedure, publish phase (Phases 6-9)
- `interview.md` — the canonical interview procedure (Phase 8)
- `sibling-exchange-protocol.md` — the cross-repository exchange contract (Phase 8, via the routing gate)

The shared `analysis-conventions.md` is deliberately not consumed: Phase 2 uses a knowledge-first approach with a 12-read budget in place of its exploration checklist, and the panel instructions in Phase 4 are this skill's own.

## Context

The broadest step in the workflow, upstream of `$ace:agent-pre-planner`. It takes a large, loosely specified ambition — a brand-new feature area, a major architectural change, a deep refactor — and produces a **scope envelope**: a direction grounded in architecture practice for systems of this shape, a set of achievable goals tailored to the current system, the consequences and limitations of committing to that direction alongside the opportunities it opens, and a staged workload split in which each stage is sized to one pre-planner-plus-plan cycle and closes with its own validation gate.

The envelope's elicitation machinery exists to surface the known unknowns and convert unknown unknowns into known ones. Four instruments do that work — the concern sweep and the assumption inventory (Phase 2), the sceptic and the sibling-seam probe (Phase 4) — and elicitation is complete only when nothing is left implicit: every concern axis has a verdict, every load-bearing premise has an inventory entry, and every open entry has an owner.

Reserved for the largest initiatives — the ones that span multiple pre-planning and implementation sessions. Typical incremental work enters the workflow at `$ace:agent-pre-planner`, which remains the more efficient entry point; Phase 3's off-ramp routes a pre-planner-sized ambition there rather than committing the user to an envelope the evidence does not support.

**Knowledge-first, code-second.** The step's primary reasoning instrument is pretrained architectural knowledge — what is known about systems of this shape — applied before any file is opened. Grounding comes from two sources, in order of preference: the system specification (the pre-digested whole-system picture, sibling services included; Phase 2) and a small number of targeted reads verifying that the envelope's anchor points exist as claimed. Codebase search is a grounding check, not a discovery activity, and never the run's main activity; the exploratory-read budgets (orchestrator 12, panel members 8 — a fraction of the pre-planner's 40) enforce the posture rather than aspiring to it. The successive `$ace:agent-pre-planner` runs own the deep code exploration.

**Boundary with the pre-planner.** This step stops where `$ace:agent-pre-planner` begins. It produces no plan-level task detail, no file:line implementation constraints, and no per-finding severity ledger — those are the pre-planner's and the planner's outputs. Goals, direction, staging, and unknowns elicitation are its whole surface; anchors cite paths, modules, seams, and contracts, never edit sites. A report that reads like a shallower pre-planner report has failed this contract — regenerate it at envelope altitude before saving (Phase 6).

This command takes no `--prior` flag: an envelope's re-consumption channels are the per-stage `$ace:agent-pre-planner` invocations it prints and, for a re-scope, passing the old envelope back as an input file — so no separate re-review machinery is needed. A consultant answers report carried back from a sibling repository re-enters the same way — as an input file beside the old envelope; the matching `Exchange:` ids in the two files are the audit link (`../agent-shared/sibling-exchange-protocol.md`). A re-scope consuming an answers report emits a new envelope; the prior envelope is an input, never an edit target, so its `[Routed]` markers and `Routed:` line stay as the audit record.

## Task

Nine phases executed in order.

### Phase 1 — Extract the ambition

Pre-pass: strip leading `--model {value}` and `--publish {value}` flags per the flag pre-pass in `../agent-shared/input-conventions.md` — read that file now; it carries the `--model` grammar, the `--publish` grammar, the positional parsing rules, and the residual-token warnings this phase applies.

Local deltas on the shared conventions:

- If no model guidance is supplied (via `--model` or the additional instructions), Phase 4 assigns the default; supplied guidance is honoured as a Phase 4 per-member assignment.
- `--publish` defaults to `yes`. Drives Phase 9.

Main pass: apply the shared positional-parsing rules (file paths, issue number with the mixed issue-plus-files form, no arguments, and the prose-invocation fallback) to the remaining tokens, then the shared residual-token warnings. The parsed input is the ambition. One local delta: two noise tokens are dropped before the file-path test — any bare `--` separator token, and a leading `read` verb whose immediately following token resolves to a readable file — invocations habitually write `-- read <path>`, and taken literally those tokens would end the file list and fold the intended ambition file into additional instructions unread.

If no ambition is found (no arguments and no actionable message in context), report this and stop.

### Phase 2 — Ground and draft

The system specification is an adjacent-toolchain input, read per `../agent-shared/input-conventions.md` `## Adjacent-toolchain inputs`.

**Grounding paths (adjust per repository — the only project-tuned lines in this file).** The convention is replicated across projects; a port adjusts this block only:

- Preferred: `.ace/specification/sys-reports-collated/system-specification-collated.md`
- Fallback: `.ace/specification/sys-reports-project/system-specification-project.md`

1. **Resolve the grounding source.** Use the preferred file when it exists, else the fallback, else none. The collated file supersedes the per-project one entry-for-entry, so never read both. Record the choice for the report's `Grounding:` line. When the resolved file exists but is unreadable, warn, continue ungrounded (`Grounding: none`), and record the incident in `## Summary`. Absent grounding degrades the run, not the posture: the seed is still drafted knowledge-first and the anchor budget is unchanged.
2. **Read the inputs.** Read the grounding file and every file the ambition references (both uncapped — they are the brief, not exploration). From the specification, extract for the Phase 4 package: the system characterisation, the capability and feature entries the ambition touches, the boundary seams (sibling seams included), and the data-model shape.
3. **Knowledge-first seed.** Before any code read, draft the seed envelope from pretrained knowledge of systems of this shape plus the grounding: the candidate direction (and what it deliberately is not), candidate goals with the envelope-level requirements that bound them, a first verdict per concern axis (below), the assumption-inventory candidates (every load-bearing premise the direction rests on), sibling-seam notes, and a first staging sketch. Where the ambition is thin, requirements elicitation stays at envelope level — one to three bounding requirements per goal, drawn from the ambition, the grounding, or (later) the interview; enough to bound the goal, never a requirements document.
4. **Concern sweep.** The fixed axis vocabulary is: data model; contracts and boundaries; auth; state and lifecycle; migration and compatibility; operability; testing. Every axis receives a verdict in the seed and in the final report — *implicated* (with the envelope's treatment) or *not implicated* (one line saying why). No axis may be omitted silently.
5. **Anchor verification.** Spend up to 12 exploratory reads confirming the seed's anchor points exist as claimed — named modules, seams, and contracts; existence and shape, not implementation. Mark each verified assumption `verified ({anchor})`, citing paths or modules, never line-level edit targets; leave the rest `open`. A claim about a file's contents must rest on a whole-file read or be stated explicitly as a sample-limited observation ("first N lines show…") — a head-limited read presented as the file's shape seeds false caveats the panel then wastes effort refuting. The grounding file and ambition-referenced files are exempt from the budget. If the budget is reached, the unverified anchors stay `open` — note them.

### Phase 3 — Off-ramp gate

Assess the seed against the pre-planner-sized signals: the ambition fits a single pre-planner-plus-plan cycle when it would land in the pre-planner's narrow-to-moderate scope bands — at most three subsystems, a shallow-to-moderate dependency chain, no intermediate validation gate between separately plannable units — and it leaves no direction-level design fork open and renegotiates no sibling seam. (This is the same yardstick Phase 6 sizes stages with, so the gate and the split cannot disagree about what one cycle absorbs.) An envelope-sized ambition proceeds to Phase 4 silently — no question.

When the signals say pre-planner-sized, present one question through `request_user_input` when it is available in Plan mode, otherwise as the same concise plain-text question before any panel is spawned — invoking the command must never commit the user to a heavyweight envelope the evidence does not support. The option list follows `../../rules/principles.md` under "Presenting design options":

1. **Direct to pre-planner (Recommended)** — the ambition fits one pre-planner-plus-plan cycle; an envelope would add a layer without adding direction.
2. **Produce the envelope anyway** — proceed as invoked (the keep-current-behaviour option: the invocation asked for an envelope).

On option 1, end the turn with a short terminal message and nothing saved or published (`--publish` is moot on this path): one paragraph naming the signals that place the ambition in pre-planner range, then the line `Recommendation: direct to pre-planner`, then — as the final line — the ready-to-run invocation re-emitting this run's positional inputs and additional instructions verbatim (e.g. `$ace:agent-pre-planner <file1> <file2> <additional instructions>`). Never run the route.

On option 2, proceed to Phase 4. If an available `request_user_input` call and its plain-text fallback both fail (a tool error, not a user decline), proceed as invoked and record the unanswered gate in `## Summary`.

### Phase 4 — Assemble the panel

Generate the run's hex suffix and capture the working-tree state and current commit per `../agent-shared/team-mechanics.md` (run suffix, pre-spawn capture) — Phase 5's tree-hygiene check compares against both; the captured commit, rendered short-form, plus the summarised tree state fill the report's `Grounded at:` line.

**Panel shape.** The panel is deliberative, not exploratory: its members are lenses reasoning from a shared grounding package and their pretrained knowledge, not parallel code explorers. Group the implicated concern axes into **one to four lenses** — typically two or three — each owning one to three related axes (e.g. data model with contracts and boundaries; auth with state and lifecycle; migration with operability and testing). When sibling grounding exists (a boundary seam in the specification, or a sibling reference in the inputs), assign the sibling-seam probe to the most seam-adjacent lens — or as its own lens, within the band, when the seam is load-bearing. The **sceptic** is always spawned on top. Size the panel per `../agent-shared/team-mechanics.md` `## Team sizing` — an ambition whose implicated axes genuinely collapse into one lens takes one, plus the sceptic.

**Model assignment.** When model guidance was supplied (Phase 1), honour it per panel member; when a mixture names a stronger and a weaker tier (e.g. `use a mixture of Tier-1 and Tier-2`), put the stronger tier on the sceptic and the most load-bearing lens first. Otherwise every panel member — lenses and sceptic — runs on Tier-2. This deliberately diverges from the sibling commands' Tier-3-specialist default: their analysts verify scoped claims against code, where Tier-3 is adequate; every lens here is open-ended architectural judgement with almost no mechanical surface, the panel is small, and the command runs rarely (largest initiatives only), so the cost delta is bounded and judgement quality is the product. Tier-1 sits above Tier-2 and suits these judgement-heavy lenses best, but the cost delta over an already-small all-Tier-2 panel does not pay for itself by default — opt in via `--model Tier-1` or a prose mixture. Record the assignment in the `Panel:` rationale.

**Naming.** Name each lens `scope-{lens-slug}-{suffix}` (e.g. `scope-data-contracts-a3f9b2c1`); the sceptic is `scope-sceptic-{suffix}`. These names fill the report's `## Panel` list.

Spawn all members in a single message and hand off the grounding package per `../agent-shared/team-mechanics.md` (spawning, package handoff), passing each member's model assignment as the per-spawn `model` parameter. The package carries: the ambition verbatim; the seed envelope; the specification extracts from Phase 2; the anchor-verification results; the grounding file's path (consultable, exempt from the read cap); sibling-seam notes; and any additional instructions.

Each lens must:

1. Reason knowledge-first from the package and pretrained knowledge. The seed envelope is a proposal to challenge, extend, or confirm — not to re-derive, and not to treat as settled.
2. Cap code reads at 8 — anchor checks only (existence and shape of named modules, seams, and contracts). The grounding file and package-named files are exempt. The cap is a budget, not a hard stop: a member that must exceed it notes the overage and its reason in its returned analysis — never invent an authority for it. No execution probes — reads only: nothing at envelope altitude turns on an executed compile or test, a deliberate divergence from the sibling commands' probe instruments.
3. Stay at envelope altitude: goals, constraints, consequences, unknowns — never edit sites, task lists, or severity tags.
4. Distinguish facts (an anchor confirmed by a read, or a claim the specification states) from assessments (analytical judgement), and label them.
5. Return, per owned axis: the implicated / not-implicated verdict with treatment or reason; assumption deltas (new premises with a proposed status; challenges to seed statuses, with the anchor when one was read); goal adjustments (unachievable as stated, missing, or mis-bounded — with why); consequence and opportunity items; user-facing questions tagged `[blocking]` or `[deferrable]`; and a stage-boundary opinion (where the seed's split cuts wrongly and why).
6. List any files read beyond the package, so they merge into the report's context file list.
7. Leave the working tree untouched.

The sceptic additionally: challenges the premise — is the ambition real, right-sized, and correctly framed; proposes simpler alternatives, including the direct-to-pre-planner outcome when the evidence supports it (its case feeds the report's `Recommendation:` line); flags scope risks; tests the staged split's shape and count; and identifies unstated assumptions the inventory missed.

### Phase 5 — Collect analyses

Collect the members' final messages, run the tree-hygiene check against the Phase 4 capture, and apply the member-failure and sceptic re-spawn rules, all per `../agent-shared/team-mechanics.md` (collect, tree-hygiene check, member failure and the sceptic). Local notes on the shared rules:

- The ambient-writes distinction carries more weight here than in the sibling commands, because this panel runs no execution probes: a modification the panel did not make is ambient by construction.
- Record any read-cap overage a member reported — member, count, reason — as a `## Summary` process note.
- Beyond the shared sceptic rule: the premise challenge is the report's differentiating guarantee and the `Recommendation:` line's warrant.

### Phase 6 — Generate report

The orchestrator owns the final envelope. Consolidation rules:

- Rebuild the direction and goals from the seed plus the panel's deltas. Each goal keeps its bounding requirements; goals the panel showed unachievable are cut or restated, with the reason in prose.
- Finalise the concern sweep: every axis has a verdict. A lens's silence on an owned axis is filled by the orchestrator's seed verdict and noted as unchallenged.
- Rebuild the assumption inventory: deduplicate, settle final statuses, and give every `open` entry an owner — a `Q{n}` when only the user can settle it, otherwise the stage whose pre-planner run resolves it. The status vocabulary is `verified ({anchor})`, `settled (Q{n})` (interview answer), `open (Q{n})` (user question pending), `open (Stage {k})` (routed downstream), and `moot (Q{n})` (premise made irrelevant by an interview answer — assigned only in Phase 8).
- Consolidate user-facing questions as `Q1..Qn`, blocking first. No per-member attribution anywhere. Informal prose citation of an input document's own finding identifiers is acceptable style with no mandated namespace — an aligned copy of the canonical rule in `../agent-pre-planner/SKILL.md` Phase 6.
- Every statement elsewhere in the report whose content depends on an open question carries a bold **see Q{n}** marker at generation time — Phase 8's update pass locates the dependent statements by these markers, so an unmarked dependency is one the interview cannot reliably reach.
- Identifier grammar: `G{n}` goals, `A{n}` assumptions, `Q{n}` questions — contiguous within each category, exactly one identifier per item. Downstream steps preserve this namespace under the pre-planner's derived-brief rule, so never bind one identifier to two items.
- Draw the staged split: each stage sized to a single pre-planner-plus-plan cycle (the yardstick is the pre-planner's own scope bands — a stage should land in its narrow-to-moderate range), ordered by dependency, with a validation gate stated in terms of observable behaviour or the project's standard verification — never a named toolchain command. Each stage lists the goals it covers and the open entries it owns. When the split's shape depends on an open question, emit the split as an explicit placeholder stating the dependency; Phase 8 finalises it.
- Per-stage invocation grammar: `$ace:agent-pre-planner {report path} Scope: Stage {k} -- {title} ({goal ids}) only` — the `Scope: ... only` form is exactly what the pre-planner's Phase 1 scope directive parses, so each stage line is a ready entry point; the published issue number substitutes for the path.
- Set the `Recommendation:` line, weighing the sceptic's case: `Recommendation: scope envelope` when the staged envelope is warranted, or `Recommendation: direct to pre-planner` when the panel shrank the ambition to one cycle — then collapse the split to a single stage and follow the line with the ready-to-run unscoped invocation (`$ace:agent-pre-planner {report path}`). The line is mandatory and machine-checkable, mirroring the pre-planner's `Recommendation: no plan` idiom; its readers are the user and the session that consumes the envelope.

**Standard header fields.** Per `../agent-shared/report-conventions.md` `## Standard header fields`, with `Type: scope`. One divergence: never emit `Stage:` — the envelope defines the stages; it is not itself one. Each stage's own pre-planner report carries `Stage: {n}/{m}`.

Output the report per the skeleton in `assets/report-template.md` — read it before generating; bracketed text is guidance, not literal output.

### Phase 7 — Save report

Write the report to `.ace/scope/{yyyyMMdd}-{HHmm}-agent-scope-{suffix}.md` per the save procedure in `../agent-shared/report-conventions.md` `## Save report` (`{suffix}` is the Phase 4 hex suffix).

If the report contains an `### Open questions` subsection with unresolved questions, proceed to the interview phase. Otherwise skip to Phase 9.

### Phase 8 — Interview

**Sibling routing gate** — runs before any interview, per `../agent-shared/sibling-exchange-protocol.md`. When the run's grounding evidences a sibling repository (a boundary seam in the specification, or a sibling reference in the inputs — the same evidence Phase 4 uses to assign the seam probe), read `references/sibling-routing.md` and run the gate; when no sibling grounding exists, skip it silently. The gate classifies each open question sibling-answerable or owner-only, may route the sibling-answerable set into a consultant request envelope, and hands the remaining owner-only questions to the interview below.

**Interview** — follow the canonical interview procedure in `../agent-shared/interview.md` — read it now; it carries the run/collect/save mechanics and the unresolved-marker grammar. Three stated divergences: the sibling-routing gate above precedes it and has no counterpart in the canonical procedure; resolved questions stay in place in `### Open questions` as the audit trail rather than being removed; and it additionally flips assumption-inventory statuses, a step with no analogue in a report that carries no assumption inventory. Two further rules on running the tool, held here as an aligned copy of the canonical statement in `../agent-pre-planner/SKILL.md` Phase 8: deferrable questions are interviewed whenever the user is present, and when one question's relevance depends on another's answer, fold the conditional into the parent question's options rather than asking it separately.

**Update the report** — this block replaces the shared procedure's `## Update the report` rules (the divergences above reshape them); the shared moot-question licence applies unchanged. For each answered question:

- **Envelope**: weave the answer into the relevant section as a statement of fact or design decision, referencing the question in bold (e.g. **see Q2**).
- **Open questions subsection**: rewrite the answered line in place — `Q{n} [blocking] [Resolved] — {question} Answer: {answer}` — keeping the tags canonical (identifier, priority tag verbatim, then `[Resolved]`; qualifications go in prose, never inside the tags). Resolved lines stay in the block as the audit trail — a deliberate divergence from the pre-planner, which removes answered lines and keeps its trail in a findings ledger; the envelope has no findings ledger, so the block doubles as the trail.
- **Assumption inventory**: flip each dependent entry from `open (Q{n})` to `settled (Q{n})`. An answer that makes a premise irrelevant rather than settling it flips the entry to `moot (Q{n})` with a one-line reason — the assumption-side mirror of the shared moot-questions rule.
- **Divergent answers**: when an answer rejects the option marked `(Recommended)`, record the divergence as an owner call — one line in `## Summary`'s process notes naming the question and the chosen direction — so a downstream pre-planner reads that boundary as an owner override, not panel consensus.
- **Summary, Concern sweep, and Staged split**: re-read `## Summary`, `## Concern sweep`, and `## Staged split` and revise any statement the answers invalidate — implicated-axis verdicts carry per-axis decision state as often as the prose sections do. A placeholder split is finalised here. A premise-inverting answer may flip the `Recommendation:` line; flipping to `direct to pre-planner` collapses the split to a single stage and appends the ready-to-run invocation.
- Skipped questions: no changes — the entry stays `open (Q{n})` and the staged split routes it to the stage that owns it.

**Unresolved marker** — per the shared grammar, with one local rule: routed questions are excluded from the count — the gate's `Routed:` line records them, keeping the pack-shared `Interview:` marker grammar untouched — and an interview skipped because every question was routed appends no marker.

**Save updated report** — per the shared procedure; the changed sections to output are the woven-in answers, the rewritten question lines, any flipped inventory entries, and any revised Summary, Concern sweep, or Staged split passages. Proceed to Phase 9.

### Phase 9 — Publish

Runs in every path that saved a report; the Phase 3 direct route saves nothing and never reaches this phase. Follow the publish phase in `../agent-shared/report-conventions.md` `## Publish`; the default here is `--publish yes`.

## Constraints

- The exploratory-read budgets are binding as posture: 12 for the orchestrator (Phase 2), 8 per panel member (Phase 4), each phase stating its own exemptions. An overage is never silent — the member notes it with its reason and the orchestrator records it in `## Summary` (Phases 4-5).
- The Phase 8 routing gate never runs the consultant or touches the sibling repository — the request envelope is a hand-carried artefact per `../agent-shared/sibling-exchange-protocol.md`, and routed questions remain unresolved in the saved report until a later run consumes the answers.

## Error handling

- If `gh` commands fail outside Phase 9's publish step, report the error and stop — a publish-step failure is handled by the shared publish procedure (Phase 9)
- If the request-envelope write fails, the write mechanism in `../agent-shared/report-conventions.md` `## Save report` applies; this artefact's fallback deliverable is the printed copy — note the failure in the final summary
