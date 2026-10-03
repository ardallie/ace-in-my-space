---
name: scope-review
description: "Closes a workstream by reviewing delivered work against its scope -- envelope and decision log, or scope documents: did goals land, were decisions honoured, was anything silently deferred, what remediation follows. Multi-agent and architectural, sceptic included. Not a review of the scope definition; not a code review, which gates a diff before merge. Opt-in --sweep reviews an existing area."
---
# Scope review

**Invocation input:** `[--ws <path | name | slug>] [--sweep] [--checks full|cheap|skip] [--model <name or instruction>] [<issue or PR number or URL> ...] [<file or mapping> ...] [instructions]`

Act as the orchestrator for a scope review: an architectural review of delivered work, anchored to its scope.

Spawn the agents directly as subagents (route: direct subagents): fan out independent assignments, send load-bearing claims to adversarial verification, collect every result, and synthesise. Spawn each agent with its own `collaboration.spawn_agent` call -- a unique `task_name`, its assignment in `message`, `agent_type: "default"`, `fork_turns: "none"`, and the `model` and `reasoning_effort` that `../detect-harness/SKILL.md`'s consumer contract gives for its tier or override, omitting any override the contract says to omit -- issuing independent calls before waiting; each result arrives through the collaboration completion notification. Share findings through later spawns: a later agent's `message` carries the collected results it must build on or challenge, and a follow-up is a fresh spawn given the earlier result.

Read first:

- `../ws-shared/workstream-conventions.md` -- this skill uses the **find-or-ask** resolution variant
- The ws's `decisions.md`, once the ws is resolved.
- `../ws-shared/orchestration.md`
- `../detect-harness/SKILL.md`
- `../scope-review/assets/report-template.md`
- `../agent-shared/interview.md`
- `../agent-shared/verification-checks.md`

## Usage

- `--sweep` -- a discovery sweep instead of a closing review (Modes).
- `--checks full|cheap|skip` (default `cheap`) -- the battery tier, as defined in verification-checks.md.
- `--ws`, `--model` -- as in the conventions and orchestration.md.
- Input forms beyond the conventions: several issues or PRs are allowed, a number naming whichever exists; an issue is scope input, a PR is delivered work, as is a named branch, commit or range; a scope input (issue, package or other scope document) is the run's subject input. A path under `.ace/mappings/` scopes a sweep (Mapping scopes).

## Modes

- A closing review unless `--sweep` is given; `Mode:` records which.
- A closing review needs a baseline and delivered work; if either cannot be found, ask: name it, run a discovery sweep instead, or stop.
- A discovery sweep reviews an existing area before any scope exists; conformance does not apply. It emits no stages and no matrix: its actionable findings take the `envelope` disposition and seed `$ace:scope-envelope --ws {ws}` in the same ws.
- An incremental sweep (another area, in a ws holding a sweep) re-examines the prior findings inside its area and carries the rest under their ids as not re-examined, without re-verifying them.

## The run (R1-R10)

- R1 **Workstream.** Once the inputs are actionable or `--ws` names a ws to review, and once the spawn confirmation in orchestration.md's `## Route` passes, resolve the ws (find-or-ask) through `../ws-create/SKILL.md` and pass the caller check; record `Workstream:`. Read `inputs.md` and the ws's current reports.
- R2 **Inputs.** Establish the mode; the baseline; the delivered work; the grounding commit; the prior; the sweep area (Mapping scopes). Record `Source:`, `Mode:`, `Baseline:`, `Delivered:`, `Prior:`.
  - Baseline (closing review): the current envelope plus the accepted D entries. Without an envelope, the scope documents given as input, where a ruling recorded inside one counts as a baseline decision. Scope documents given alongside an envelope are cross-checked against it; an item tracing to no goal and no recorded disposition is a silent-deferral finding.
  - Delivered work: find it if not named, record the set and how it was found, and confirm a found set with the user before the review team starts.
  - Grounding: a commit containing all of the delivered work -- the checkout's HEAD when it contains it, else the default branch's tip when it does, else ask. Never switch, reset or change the user's checkout: read other states through git and execute them in an isolated copy.
- R3 **State and battery.** Record `Grounded at:` for the grounding commit in place of HEAD, with the reviewed state's tree state (`clean tree` when it is read through git or an isolated copy); orchestration.md's `## Repository state` otherwise applies. Run the `--checks` battery once, before the review team starts, on the reviewed state: in the checkout when it is that state, else in the isolated copy. Record `Checks:` in the record grammar of verification-checks.md, its command summary naming the isolated copy when used. Its results are facts agents reuse, never a substitute for a finding's own probe.
- R4 **Commitment list** (closing review). Before the review team starts, list in `workings/` every baseline goal with its bounding requirements (an envelope goal's bullets; without an envelope, what the scope documents require of it), every accepted decision (a superseded one through its successor), every gate clause, every open item of the baseline (one the baseline assigned to no stage or to the closing review keeps the owner the baseline names, recorded on its row; it is `landed` when the delivery settled it, else `unverified`, and a still-open `user`-owned one becomes this report's own question), and every input item with its disposition (the envelope's `## Input coverage` lines; without an envelope, each item the scope documents list for delivery); in a repeat closing review, also the prior review's remediation stages and their gate clauses. Synthesis waits until every row has a verdict. The walk is never waived; gates are judged as behaviour, however the delivery re-cut the stages.
- R5 **Team.** Resolve tiers. Name owners for architecture and maintainability, core lenses in both modes, in the allocation record (one analyst may hold both on a narrow scope). In a closing review, add a dedicated conformance owner, accountable for every row's verdict. Sceptic angle: is each gap real or cosmetic, and did the baseline's own premises hold. Ask any shared-external-state authorisation now, before the review team starts.
- R6 **Review.** Conformance walk, lens analysis, probes, instruments and tie-break (below); adversarial verification per orchestration.md.
- R7 **Synthesise.** Completeness check against the Guarantees; dispositions; any area in scope that no agent examined, listed under Outside the stages with its reason; remediation stages; the file-collision matrix; draft the full report, header included, to `workings/`.
- R8 **Revision pass** per orchestration.md; the reviewer is also given the commitment list and its evidence; record it on `Revision pass:`.
- R9 **Save, interview, record.** Save the report under the ws filename (`Decisions: pending`); then the conventions' interview in a ws, append and report update.
- R10 **Close.** Print the report path and the D ids added; a sweep prints `$ace:scope-envelope --ws {ws}`. When a sibling owns questions this run raised, name them (a baseline question still awaiting answers in an open exchange is cited with its exchange id, not re-sent): they go to that repository's `$ace:agent-consultant` as a pasted list (not the whole report, whose every unresolved line it would answer), and its answers come back as grounding input to a later run in this ws.

## Conformance

Closing review only. Each row: one verdict, its evidence, fact or assessment.

| Verdict | Meaning | Must cite | Finding |
|---|---|---|---|
| `landed` | delivered as the baseline states | evidence | no |
| `reinterpreted` | delivered differently under a recorded owner ruling | the `D{n}`, or a consistent external record (then logged as a direction entry) | no |
| `diverged` | delivered differently; no record, or conflicting records | finding id + a ratify-or-restore question | yes (C or R) |
| `deferred` | not delivered, under a recorded reason | the `D{n}`, the baseline's `X{n}`, or a consistent external record (then logged as a direction entry) | no |
| `silently-deferred` | not delivered; nothing records why | finding id | yes (C or R), never an Insight |
| `premise-void` | the premise never held | evidence | usually a C correcting the baseline |
| `unverified` | could not be judged here | why, what would settle it, owner | yes (C or R), never an Insight |

- Delivered in part: the verdict of the undelivered part, naming what landed.
- `landed` on observable behaviour needs executed evidence (a test exercising it, a probe, an observation); otherwise it is marked an assessment.
- A gate clause that does not hold is a conformance gap with its own finding and disposition.
- Look actively for silent deferral.
- A `diverged` row asks the owner, as a `[blocking]` `user` question, to ratify (its keep-current option: the delivered behaviour stands) or restore; the answer is a `D{n}`; until it is answered, the finding's disposition is the restoring stage. On ratify, the row becomes `reinterpreted` citing that `D{n}` and the finding `out of scope -- ratified by D{n}`; on restore, the stage stands and relies on the `D{n}`.

## Lenses, probes and instruments

- Facts: the ground rules in orchestration.md apply; in addition, a claim about what compiles, runs, behaves or counts is a fact only with its executed command and exact result or a file:line chain.
- Isolation: a probe that writes files (edits, builds, generated output, snapshots, installs) runs isolated from the shared checkout -- the harness's per-agent isolation where it offers one, otherwise a disposable copy of the reviewed commit (a worktree, or an exported copy where git metadata cannot be written) in a verified temporary location outside the checkout.
- Once the probe's commands, exact results and evidence are in `workings/` and cited, remove only what the probe created.
- A probe that cannot run leaves its claim `unverified`; an inconclusive probe is evidence of nothing.
- Shared external state (a running service, a database, a browser profile, an account) is not covered by checkout isolation: touch it only with the user's authorisation -- read-only probes, probes that change it and restore it, or none (those claims stay unverified, owned by the user). One owning agent per resource, which records and restores what it changed and reports residue; record each resource on `External state:`.
- Instruments, before a Risk or Opportunity becomes a finding: the cheapest execution check that could refute it; its area's change frequency in git history; the sceptic's duplication and gold-plating check. An overturned claim becomes a Correction with its evidence inline.
- Tie-break: the more specifically evidenced claim wins (executed probe, then file:line chain, then inspection); on a tie, report both; for a verdict, the reading that leaves work open stands.

## Mapping scopes

A path under `.ace/mappings/` scopes the run by its type -- feature: its modules' structure mappings and their source paths, plus its parent subsystem via `subsystems/_index.md`; subsystem: its modules and shared modules; structure mapping: its source paths. Index files (`_index.md`, `_graph.md`, `_summary.md`) are not a scope: ask for a specific mapping.

## Dispositions and open items

- Every Correction, Risk and Opportunity and every conformance gap gets exactly one disposition: `S{k}` (a remediation stage's Covers), `backlog` (a `Defer:` entry in decisions.md), `envelope` (sweep only: input for the scope envelope it seeds), or `out of scope -- {reason}`. Insights and Confirmed need none; a correction to the input alone is `out of scope -- corrects the input only`. No optional items.
- Setting aside a `[high]` finding as out of scope is a direction-level choice and is logged (a ratifying `D{n}` is that log).
- Questions take an owner (one of the owners the template's Open items guidance lists), never a disposition; word each so a reader holding only this report can answer it (the question text restates any decision it depends on).

## Guarantees

The completeness check and the revision reviewer test these:

1. Closing review: a verdict row for every commitment-list item; every `diverged`, `silently-deferred` or `unverified` row and every unmet gate clause links to a finding with a disposition; every `unverified` names an owner.
2. Architecture and maintainability each covered by a named owner.
3. Every C, R and O and every conformance gap has exactly one disposition: in a stage's Covers (a split finding names its part in each) or on one line under Outside the stages.
4. Facts distinct from assessments: every finding and row cites evidence or is marked an assessment; probe-derived facts cite a `workings/` path; file-writing probes ran isolated; shared external state was touched only as authorised.
5. Remediation stages and the file-collision matrix meet the template's guidance.
6. `Checks:`, mode and delivered set recorded.
7. Sceptic: premise challenged; challenges recorded as adopted or not.

## Repeat runs and prior

- A discovery sweep is never a closing review's prior; if one is named, stop and say why.
- A repeat closing review is a full closing review: every row gets a verdict at this run's `Grounded at:`; a verdict may be carried only where nothing it rests on changed, and the report says so.
- In Changes from prior (accounting per the conventions), a prior finding the remediation fixed resolves `-> V{n}`, the Confirmed entry recording the remediation evidence, and one superseded by a `D{n}`, later finding or scope change is retired; carried wins unless the other cites evidence. Problems the remediation introduced are new findings. Open `Defer:` entries in the ws are re-checked.
