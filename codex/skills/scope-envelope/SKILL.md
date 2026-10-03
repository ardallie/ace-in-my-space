---
name: scope-envelope
description: "Opens a workstream by defining the scope of a large or loosely specified ambition: a knowledge-first multi-agent deliberation, sceptic always included, producing a scope envelope -- direction, goals, assumptions and suggested stages with observable gates -- beside the workstream's decision log. $ace:scope-review later closes it."
---
# Scope envelope

**Invocation input:** `[--ws <path | name | slug>] [--model <name or instruction>] [<files>] [<issue or PR number or URL>] [instructions]`

Act as the orchestrator for a scope envelope: the direction, goals and suggested stages for an ambition, at envelope altitude -- modules, seams and contracts, not edit sites, task lists or severities.

Spawn the agents directly as subagents (route: direct subagents): fan out independent assignments, send load-bearing claims to adversarial verification, collect every result, and synthesise. Spawn each agent with its own `collaboration.spawn_agent` call -- a unique `task_name`, its assignment in `message`, `agent_type: "default"`, `fork_turns: "none"`, and the `model` and `reasoning_effort` that `../detect-harness/SKILL.md`'s consumer contract gives for its tier or override, omitting any override the contract says to omit -- issuing independent calls before waiting; each result arrives through the collaboration completion notification.

Read first; this file states only its deltas:

- `../ws-shared/workstream-conventions.md` -- this skill uses the **find-or-create** resolution variant.
- The ws's `decisions.md`, once the ws is resolved.
- `../ws-shared/orchestration.md`
- `../detect-harness/SKILL.md`
- `../scope-envelope/assets/report-template.md`
- `../agent-shared/interview.md`
- `../agent-shared/sibling-exchange-protocol.md` -- only when routing.

## Usage

- Inputs per the conventions; `--ws` per the conventions; `--model` per orchestration.md; trailing text steers the run.
- In a ws that holds an envelope or a current discovery sweep, inputs may be empty.

## The run (E1-E9)

- E1 **Ambition and workstream.** Establish the ambition from the inputs and steering (a read-only lookup of `--ws` may come first); nothing actionable, and no `--ws` naming a ws that holds an envelope or a current discovery sweep, means say so and stop. Once the spawn confirmation in orchestration.md's `## Route` passes, resolve the ws (find-or-create) through `../ws-create/SKILL.md`, pass the caller check, and record `Workstream:`.
- E2 **Records.** Read decisions.md, `inputs.md` and the ws's current reports. The current envelope is the prior and supplies or refines the ambition. A current discovery sweep or closing review whose ids the prior's `## Input coverage` does not account for (or one given as input) is consumed as input. Consultant answers whose exchange id matches an `Exchange:` line of the current envelope are grounding (see Repeat run and consultation re-entry). Record `Source:` (on an input-less repeat run, the prior file), `Prior:` and, when answers are consumed, `Exchange:`.
- E3 **Grounding.** Record repository state on `Grounded at:` per orchestration.md. Grounding file: the newest file (by the timestamp in its name, else modification time) under `.ace/specification/sys-reports-collated/`, else under `.ace/specification/sys-reports-project/`, else none -- never a fixed filename, never both trees; record it on `Grounding:`. Look for sibling evidence: a boundary seam in the specification or a sibling reference in the inputs. Observing an instance that is already running is grounding only with the user's authorisation, asked in your own loop; the observer changes nothing, leaves shared state as found, and its anchors read `verified (live observation)`.
- E4 **Team.** Resolve tiers. Plan roles with distinct ownership over the concern axes, the seams and any sibling seam. Sceptic always, with this angle: is this the right ambition and direction, is there a simpler shape, which goals are gold-plating. Write the allocation record for `## Run record`. A small ambition gets a smaller team and fewer stages.
- E5 **Deliberate.** Knowledge-first, then code: reason from what systems of this shape need and the grounding, then verify against the code. Support agents ground anchors so analysts reason from verified ones. Adversarial verification and the sceptic's challenge run per orchestration.md.
- E6 **Synthesise.** Run the completeness check against the Guarantees below. Resolve contradictions: a consequence and a goal may not disagree. Cut goals that cannot be achieved, each as a direction-level `D{n}` proposal with its reason, so the closing review can tell a cut from a silent deferral. Draft every template section to `workings/`.
- E7 **Revision pass** per orchestration.md; record it on `Revision pass:`.
- E8 **Save, route, interview, record.** Save the report under the ws filename per the conventions, with `Decisions: pending`. If sibling-answerable questions exist, run Sibling routing. Then the conventions' interview in a ws, append and report update.
- E9 **Close.** Print the report path, the D ids added, and the hand-offs: when routed, `$ace:agent-consultant {request path}` (run in the sibling repository) and `$ace:scope-envelope --ws {ws} {answers path}` (run here); otherwise point the downstream orchestrator at the report and `decisions.md`, and name `$ace:scope-review --ws {ws}` for closing.

## Guarantees

Used by the completeness check and the revision reviewer.

1. Concern sweep: a verdict on every axis -- data model; contracts and boundaries; auth; state and lifecycle; migration and compatibility; operability; testing -- implicated (with the ids carrying its treatment) or not implicated (why). Axes may be added; none dropped.
2. Assumption inventory: every load-bearing premise is an `A{n}` with a status; every open entry has an owner; a premise found false is recorded `refuted`, so it is not re-adopted.
3. Every opportunity found is a goal or an `X{n}` with a reason; every input item, and every actionable id of a consumed sweep or closing review, has an Input coverage line.
4. Altitude: modules, seams, contracts; no edit sites, task lists or severity ledgers.
5. Stages: every goal covered; every gate clause meets the template's Stages guidance.
6. Facts distinct from assessments: every claim in Scope, Goals and the Assumption inventory cites an anchor or is marked an assessment.
7. Sceptic: premise challenged; every challenge recorded as adopted or not, with its reason.
8. Sibling seam probed where grounding evidences a sibling.

## Repeat run and consultation re-entry

- The current envelope is the prior (accounting per the conventions); every guarantee still applies, and the sceptic challenges the prior's direction like any premise.
- An axis verdict may be carried only where nothing it rests on changed, and the report says so.
- Consultant answers are evidence, not decisions: a fact verifies or refutes an `A{n}` (the routed question is accounted `resolved -> A{n}`); a preference it raises goes to the interview; an answer that undermines an owner's answer becomes a new owner question; anything unanswered stays open with its owner, or is routed again as the next round.

## Sibling routing

- Applies when grounding evidences a sibling repository; never read, run or touch anything in it.
- Classify each open question: sibling-answerable (the sibling's code, contracts or plans can settle it) or not.
- Ask one whole-set consent question, per the conventions' questions outside the interview: route the sibling-answerable set (recommended where the sibling evidently can answer), or ask the owner everything now.
- On consent, compose a request per the protocol's `## Request envelope`, its recap carrying the content of every `D{n}` the routed questions depend on (the consultant never reads decisions.md). Exchange id: one per counterpart -- the id on that counterpart's open `Exchange:` line with the round incremented, else a fresh 8-hex id; this supersedes the protocol's run-suffix correlation. Save the request at the protocol's path and print it.
- Only once the request file exists: mark those lines `[Routed]` with `Owner: sibling ({role})`, add the `Routed:` line, and set `Exchange:`.
- Answers re-enter as an input to a repeat run in the same ws (above); this supersedes the protocol's re-entry route.
