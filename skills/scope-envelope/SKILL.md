---
name: scope-envelope
description: "Opens a workstream by defining the scope of a large or loosely specified ambition: a knowledge-first multi-agent deliberation, sceptic always included, producing a scope envelope -- direction, goals, assumptions and suggested stages with observable gates -- beside the workstream's decision log. /ace:scope-review later closes it."
argument-hint: "[--ws <path | name | slug>] [--model <name or instruction>] [<files>] [<issue or PR number or URL>] [instructions]"
disable-model-invocation: false
---
# Scope envelope

Act as the orchestrator for a scope envelope: the direction, goals and suggested stages for an ambition, at envelope altitude -- modules, seams and contracts, not edit sites, task lists or severities.

Use the `Workflow` tool to run the agents where it is available; otherwise spawn subagents directly.

Read first; this file states only its deltas:

- `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/workstream-conventions.md` -- this skill uses the **find-or-create** resolution variant.
- The ws's `decisions.md`, once the ws is resolved.
- `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/orchestration.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/scope-envelope/assets/report-template.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/interview.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/sibling-exchange-protocol.md` -- only when routing.

## Usage

- Inputs and `--ws` per the conventions; `--model` per orchestration.md.
- In a ws that holds an envelope or a current discovery sweep, inputs may be empty.

## The run (E1-E9)

- E1 **Ambition and workstream.** Establish the ambition from the inputs and steering; nothing actionable, and no `--ws` naming a ws that holds an envelope or a current discovery sweep, means say so and stop. Once the spawn confirmation in orchestration.md's `## Route` passes, resolve the ws (find-or-create) through `${CLAUDE_PLUGIN_ROOT}/skills/ws-create/SKILL.md`, pass the caller check, and record `Workstream:`.
- E2 **Records.** Read `inputs.md` and the ws's current reports. The prior (per the conventions; normally the current envelope) supplies or refines the ambition. A current discovery sweep or closing review whose ids the prior's `## Input coverage` does not account for (or one given as input) is consumed as input. Consultant answers whose exchange id matches an `Exchange:` line of the current envelope are grounding (see Repeat run and consultation re-entry). Record `Source:` (on an input-less repeat run, the prior file), `Prior:` and `Exchange:` (when answers are consumed, or carried from the prior while its exchange stays open).
- E3 **Grounding.** Record repository state on `Grounded at:` per orchestration.md. Grounding file: the newest file (by the timestamp in its name, else modification time) under `.ace/specification/sys-reports-collated/`, else under `.ace/specification/sys-reports-project/`, else none -- never a fixed filename, never both trees; record it on `Grounding:`. Look for sibling evidence: a boundary seam in the specification or a sibling reference in the inputs. Observing an instance that is already running is grounding only with the user's authorisation (a question outside the interview, per the conventions); the observer changes nothing, leaves shared state as found, and its anchors read `verified (live observation)`; record it on `External state:`.
- E4 **Team.** Resolve tiers. Plan roles with distinct ownership over the concern axes, the seams and any sibling seam. Sceptic angle: is this the right ambition and direction, is there a simpler shape, which goals are gold-plating. Write the allocation record for `## Run record`. A small ambition gets fewer stages.
- E5 **Deliberate.** Knowledge-first, then code: reason from what systems of this shape need and the grounding, then read the code no support agent has anchored; a support agent's anchor arrives verified: an analyst re-reading it adds cost, not evidence, unless a claim goes beyond it. Adversarial verification, the completeness check and the sceptic's challenge run per orchestration.md. No envelope agent runs a probe that writes files: a claim only such a probe could settle is an assessment, or an open item owned by the stage that can run it.
- E6 **Synthesise.** Complete the ledger (Guarantee 9), with a section per stage holding the findings that stage keeps and noting any record recommendation the report overturned; the stage's `Detail:` names that section. Resolve contradictions: a consequence and a goal may not disagree. Cut goals that cannot be achieved, each as a direction-level `D{n}` proposal with its reason, so the closing review can tell a cut from a silent deferral. A design choice inside one stage can stay a finding behind that stage's `Detail:` rather than bind as a `D{n}`. Text resting on an open `user` question may follow its recommended option, marked `(follows Q{n})`; a preference only the owner can settle stays a `user` question. Draft the full report, header included, to `workings/`.
- E7 **Revision pass** per orchestration.md; the reviewer is also given the ledger, checks that nothing it says landed is missing or thinned, and judges text marked `(follows Q{n})` against the option it follows; record it on `Revision pass:`.
- E8 **Save, interview, route, record.** Save the report under the ws filename per the conventions, with `Decisions: pending`. If sibling-answerable questions exist, ask Sibling routing's consent question; a set routed on consent stays out of the interview; on decline, its questions are `user`-owned and asked in it. Then the conventions' interview in a ws and append; on consent, compose the request now, so it carries the answers; then the report update: a `(follows Q{n})` mark its answer confirms becomes that entry's `D{m}` (in a gate clause, among its ids), text its answer invalidates is revised, and a mark whose question stays open stays.
- E9 **Close.** Print the report path, the D ids added, and the hand-offs: when routed, `/ace:agent-consultant {request path}` (the user copies the request into the sibling repository and runs it there) and `/ace:scope-envelope --ws {ws} {answers path}` (run here); otherwise point the downstream orchestrator at the report and `decisions.md`, and name `/ace:scope-review --ws {ws}` for closing.

## Guarantees

Used by the completeness check and the revision reviewer.

1. Concern sweep: a verdict on every axis of the template's Concern sweep -- implicated (with the ids carrying its treatment) or not implicated (why). Axes may be added; none dropped.
2. Assumption inventory: every load-bearing premise is an `A{n}` with a status; every open entry has an owner; a premise found false is recorded `refuted`, so it is not re-adopted.
3. Every opportunity found is a goal or an `X{n}` with a reason; every input item (each unit of work an input enumerates for delivery, such as a package's items; entries it routes to other work are not input items), and every actionable id of a consumed sweep or closing review, has an Input coverage line.
4. Altitude in the report and its `D{n}` proposals: modules, seams, contracts; no edit sites, task lists or severities, though a claim keeps its anchor (`path:line` is evidence, not an edit site).
5. Stages: every goal covered; every gate clause meets the template's Stages guidance; where a stage changes a file that other work not yet landed also changes, the report names that work and the order between them -- a `D{n}`, or an external entry in the stage's `Depends on:` when the other work lands first -- or why none is needed.
6. Facts distinct from assessments: every claim in Scope, Goals and the Assumption inventory cites an anchor or is marked an assessment.
7. Sceptic: premise challenged; every challenge recorded as adopted or not, with its reason.
8. Sibling seam probed where grounding evidences a sibling.
9. Every finding a deliberation agent recorded has a disposition in the run's ledger: a report or `D{n}` id, a stage's `Detail:`, or dropped with its reason. A question an agent left to the owner that the report does not keep as a `user` question carries the reason the owner need not answer it.

## Repeat run and consultation re-entry

- The prior (normally the current envelope) is accounted for per the conventions; every guarantee still applies, and the sceptic challenges the prior's direction like any premise.
- An axis verdict may be carried only where nothing it rests on changed, and the report says so.
- Consultant answers are evidence, not decisions: a fact verifies or refutes an `A{n}` (the routed question is accounted `resolved -> A{n}`); a preference it raises goes to the interview; anything unanswered stays open with its owner, or is routed again as the next round.

## Sibling routing

- Applies when grounding evidences a sibling repository; never read, run or touch anything in it.
- Classify each open question, except a `[Routed]` one whose answers this run does not consume (it is carried with its `Exchange:` line): sibling-answerable (the sibling's code, contracts or plans can settle it) or not.
- Ask one whole-set consent question, per the conventions' questions outside the interview: route the sibling-answerable set, or ask the owner everything now.
- On consent, after the interview's append, compose a request per the protocol's `## Request envelope`, its recap carrying the content of every `D{n}` the routed questions depend on, never a provisional number (the consultant never reads decisions.md). Exchange id: the id on the counterpart's open `Exchange:` line with the round incremented, else a fresh 8-hex id; this supersedes the protocol's run-suffix correlation. The request's `Source:` names the envelope in ws terms: `{ws}/{this report's filename} -- {title}`. Save the request at the protocol's path and print it.
- Only once the request file exists: mark those lines `[Routed]` with `Owner: sibling ({role})` (a stage that listed one under `Owns:` names it under `Depends on:` as external instead), add the `Routed:` line, and set `Exchange:`.
- Answers re-enter as an input to a repeat run in the same ws (above); without `--ws`, that ws is the one whose current envelope's `Exchange:` line carries the answers' exchange id, passed to ws-create as `--ws`. This supersedes the protocol's re-entry route.
