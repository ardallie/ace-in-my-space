---
name: scope-envelope
description: "Opens a workstream by defining the scope of a large or loosely specified ambition: a knowledge-first multi-agent deliberation, sceptic always included, producing a scope envelope -- direction, goals, assumptions and suggested stages with observable gates -- beside the workstream's decision log. /ace:scope-review later closes it."
argument-hint: "[--ws <path | name | slug>] [--model <name or instruction>] [<files>] [<issue or PR number or URL>] [instructions]"
disable-model-invocation: false
---
# Scope envelope

Act as the orchestrator for a scope envelope: the direction, goals and suggested stages for an ambition, at envelope altitude -- modules, seams and contracts, not edit sites, task lists or severities.

Use the `Workflow` tool to run the agents where it is available; otherwise spawn subagents directly.

Read first, after Usage's `--ws` check where Usage has one; this file states only its deltas:

- `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/workstream-conventions.md` -- this skill uses the **find-or-create** resolution variant.
- The ws's `index.md`, once the ws is resolved, for orientation only (the conventions' `## Workstream index`).
- The ws's `decisions.md`, once the ws is resolved, read as the conventions' `## Decision log` says.
- `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/orchestration.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/scope-envelope/assets/report-template.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/interview.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/scope-consultant/assets/stack-profile.md` -- only when E9 prints a consultation round, to fill its `--target` (Sibling routing).

A copy this file shares with `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/workstream-conventions.md`, kept aligned and edited together, this file's copy canonical: the condition under which this skill's Close prints the implementing run in place of the repeat envelope -- an open sibling-owned question held, every open sibling-owned question `[deferrable]`, and a fallback recorded for each -- which that file's envelope edge repeats.

## Usage

- Inputs and `--ws` per the conventions; `--model` per orchestration.md.
- In a ws that holds an envelope or a current discovery sweep, inputs may be empty.

## Step

Per the conventions' `## Steps`. Every report this skill reads -- current, prior or consumed -- is found per their `## Discovery and currency`, and in a ws holding old-layout records per their `## Old-layout workstreams`. It reads no delivery records: delivery reaches it through a consumed closing review.

- Open point: after E1's caller check, any question E2-E3 ask (E3's live-observation authorisation) and the conventions' overlap question (`## Discovery and currency`), if asked; before E4's allocation record, the run's first `workings/` write. Values E1-E3 record before the open are held by the run: at the open the input line opens the state record; it and the rest go into the report where its template puts it (`External state:` in `## Run record`, the others in the header).
- Read-only exits, beyond the conventions' shared ones (`## Steps`): E1's stop when nothing is actionable.
- Resume: never; a repeat or re-entry run that opens takes a new step.
- Artefact: an envelope report, `{nn}-scope-envelope.md`; input line `Source:`; no `Mode:`; status field `Decisions:`. Its records: `workings/{nn}-scope-envelope/`.

## The run (E1-E9)

- E1 **Ambition and workstream.** Establish the ambition from the inputs and steering; nothing actionable, and no `--ws` naming a ws that holds an envelope or a current discovery sweep, means say so and stop. Once the spawn confirmation in orchestration.md's `## Route` passes, resolve the ws (find-or-create) through `${CLAUDE_PLUGIN_ROOT}/skills/ws-create/SKILL.md`, pass the caller check, and record `Workstream:`.
- E2 **Records.** Read `inputs.md` and the ws's current reports. The prior (the conventions' `## Discovery and currency`; normally the current envelope) supplies or refines the ambition. A current discovery sweep or closing review whose ids the prior's `## Input coverage` does not account for (or one given as input) is consumed as input. The answers to the prior and to each report consumed -- the consultation records the conventions' `## Discovery and currency` finds for them -- are grounding (see Repeat run and consultation re-entry). Record `Source:` (its template's form; a sweep or closing review consumed but not given as input is not on it, `## Input coverage` recording its consumption; the consultation records read follow the inputs) and `Prior:`.
- E3 **Grounding.** Record repository state on `Grounded at:` per orchestration.md. Grounding file: the newest file (by the timestamp in its name, else modification time) under `.ace/specification/sys-reports-collated/`, else under `.ace/specification/sys-reports-project/`, else none -- never a fixed filename, never both trees; record it on `Grounding:`. Look for sibling evidence: a boundary seam in the specification or a sibling reference in the inputs; the stack profile is none (Sibling routing). Observing an instance that is already running is grounding only with the user's authorisation, per orchestration.md's `## Probes and external state` (a question outside the interview, per the conventions); the observer changes nothing, leaves shared state as found, and its anchors read `verified (live observation)`; record it on `External state:`.
- E4 **Team.** Resolve tiers. Plan roles with distinct ownership over the concern axes, the seams and any sibling seam. Sceptic angle: is this the right ambition and direction, is there a simpler shape, which goals are gold-plating. Write the allocation record for `## Run record`. A small ambition gets fewer stages.
- E5 **Deliberate.** Knowledge-first, then code: reason from what systems of this shape need and the grounding, then read the code no support agent has anchored; a support agent's anchor arrives verified: an analyst re-reading it adds cost, not evidence, unless a claim goes beyond it. Adversarial verification, the completeness check and the sceptic's challenge run per orchestration.md. No envelope agent runs a probe that writes files: a claim only such a probe could settle is an assessment, or an open item owned by the stage that can run it.
- E6 **Synthesise.** Complete the ledger (Guarantee 9), with a section per stage holding the findings that stage keeps and noting any record recommendation the report overturned; the stage's `Detail:` names that section. Resolve contradictions: a consequence and a goal may not disagree, nor a stage's `Detail:` findings and its gate. Cut goals that cannot be achieved, each as a direction-level `D{n}` proposal with its reason, so the closing review can tell a cut from a silent deferral. A design choice inside one stage can stay a finding behind that stage's `Detail:` rather than bind as a `D{n}`. Text resting on an open `user` question may follow its recommended option, marked `(follows Q{n})`; a preference only the owner can settle stays a `user` question. Draft the full report, header included, to `workings/`.
- E7 **Revision pass** per orchestration.md; the reviewer is also given the ledger, checks that nothing it says landed is missing or thinned, and judges text marked `(follows Q{n})` against the option it follows; record it on `Revision pass:`.
- E8 **Save, interview, route, record.** Save the report as the step's artefact (Step), with `Decisions: pending` and `Next: pending`. If sibling-answerable questions exist, ask Sibling routing's consent question; a set routed on consent is marked as that section says and stays out of the interview; on decline, its questions are `user`-owned and asked in it. Then the conventions' interview in a ws and append; then the report update: a `(follows Q{n})` mark its answer confirms becomes that entry's `D{m}` (in a gate clause, among its ids), text its answer invalidates is revised, and a mark whose question stays open stays.
- E9 **Close.** Write the report's `Next:`, the next steps this Close prints, as the artefact's final write; then print the report path, the D ids added and the next steps: the conventions' `## Hand-off loop` envelope edge, in that section's form -- with an open sibling-owned question, the consultation round first, its line naming this report and its `--target` filled as Sibling routing says, then the repeat envelope; in every case, the implementing run, then the closing review, the implementing run's line marked as in place of the repeat envelope only where the report holds an open sibling-owned question and every open sibling-owned question is `[deferrable]` with a fallback recorded for each (text marked `(follows Q{n})`, or how the dependent stage proceeds without the answers). Not printed, as it describes those runs: the implementing run reads the current envelope and `decisions.md` first and records its decisions there, and on the alternative takes the answers for the stage that depends on them, which the closing review then accounts for.

## Guarantees

Used by the completeness check and the revision reviewer.

1. Concern sweep: a verdict on every axis of the template's Concern sweep -- implicated (with the ids carrying its treatment) or not implicated (why). Axes may be added; none dropped.
2. Assumption inventory: every load-bearing premise is an `A{n}` with a status; every open entry has an owner; a premise found false is recorded `refuted`, so it is not re-adopted.
3. Every opportunity found is a goal or an `X{n}` with a reason; every input item (each unit of work an input enumerates for delivery, such as a package's items; entries it routes to other work are not input items), and every actionable id of a consumed sweep or closing review, has an Input coverage line.
4. Altitude in the report and its `D{n}` proposals: modules, seams, contracts; no edit sites, task lists or severities, though a claim keeps its anchor (`path:line` is evidence, not an edit site).
5. Stages: every goal covered; every gate clause meets the template's Stages guidance; where a stage changes a file that other work not yet landed also changes, the report names that work and the order between them -- a `D{n}`, or an external entry in the stage's `Depends on:` when the other work lands first -- or why none is needed.
6. Facts distinct from assessments: every claim in Scope, Goals and the Assumption inventory cites an anchor or is marked an assessment.
7. Sceptic: premise challenged; every challenge recorded as adopted or not, with its reason.
8. Sibling seam probed where grounding evidences a sibling; every agent handed this guarantee also gets Sibling routing's never-read bullet verbatim.
9. Every finding a deliberation agent recorded has a disposition in the run's ledger: a report or `D{n}` id, a stage's `Detail:`, or dropped with its reason. A question an agent left to the owner that the report does not keep as a `user` question carries the reason the owner need not answer it.

## Repeat run and consultation re-entry

- The prior (normally the current envelope) is accounted for per the conventions; every guarantee still applies, and the sceptic challenges the prior's direction like any premise.
- An axis verdict may be carried only where nothing it rests on changed, and the report says so.
- Consultant answers -- the consultation records E2 reads -- are evidence, not decisions: a fact verifies or refutes an `A{n}` (the sibling-owned question is accounted `resolved -> A{n}`); a preference it raises goes to the interview; anything unanswered stays open with its owner, a sibling-owned question no round reached staying sibling-owned for the next round.

## Sibling routing

- Applies when grounding evidences a sibling repository; never read, run or touch anything in it: a sibling is researched only through a consultation round, under its own instructions and the round's confinement and records.
- Classify each open question, except a sibling-owned one carried from the prior that no consultation record E2 read reached, which keeps its owner: sibling-answerable (the sibling's code, contracts or plans can settle it) or not.
- Ask one whole-set consent question, per the conventions' questions outside the interview: route the sibling-answerable set, or ask the owner everything now.
- On consent, write those lines in the plain form with `Owner: sibling ({role})` (a stage that listed one under `Owns:` names it under `Depends on:` as external instead). This run composes no request: the round composes it from these lines.
- E9's round line names this report, adding `--target {name}` before it only where the profile, `.profile/stack.profile.md` at this repository's root read as `${CLAUDE_PLUGIN_ROOT}/skills/scope-consultant/assets/stack-profile.md` says, names exactly one entry that every open sibling-owned question's role belongs to -- the role equal to the entry's name, ignoring case, the marker excluded (the asset's `## Matching` name rule); otherwise the flag is left out and the round resolves its target. A missing or malformed profile only leaves the flag out. The profile is read for nothing else: it is no evidence about a sibling, and triggers neither this section nor Guarantee 8.
- Answers re-enter through the step set: a repeat run in this ws, or the implementing run on E9's alternative, reads the consultation records whose `Source:` names this report; every line the round prints carries `--ws`.
