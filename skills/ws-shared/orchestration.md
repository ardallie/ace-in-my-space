# Orchestration

Consumed by both scope skills. Method stays with the orchestrator and each skill.

## Role

- Add, re-task and follow up agents as the work reveals the need (verification, gap-filling, adversarial checks); caps count roles, not spawns.

## Route

- The SKILL.md's orchestration sentence names the route: the orchestration facility it names, or direct subagents.
- Facility agents run in the background; every user-facing step (ws choice, authorisation, routing consent, interview) stays in the orchestrator's own loop.
- Agents inherit no conversation history: give each everything it needs, a unique id prefix, the template forms its record feeds and the `## Ground rules` below verbatim included; pass long records and sources by path, naming the parts each agent needs, not inline; a return that restates a record is paid for twice.
- Before the ws is resolved, confirm that agents can be spawned: resolve tiers with detect-harness, then spawn one Tier-3 support agent through the route the run will use, with a minimal read-only task the run can use -- list the existing `.ace/ws/` directories, each with the entries under `## Inputs` in its `inputs.md` and its `report-*` files -- and continue only once its result comes back. This agent gets only that task and its tier values (not the ground rules), writes nothing, and is not a role on `Team:`. If the orchestration facility cannot spawn it, retry with direct subagents and use that route for the run (a rejected tier value is not such a failure: follow detect-harness's stale-mapping rule); if no agent can be spawned at all, say the skill's multi-agent guarantees cannot be met and stop; never run solo.

## Guarantees

Outcomes to secure, not agents to launch:

- Fan-out with distinct ownership and shared, continuously de-duplicated findings.
- Adversarial verification of every load-bearing claim before anything leans on it.
- A completeness check before synthesis, runnable beside the challenge: every owned concern returned, and every guarantee the SKILL.md lists met.
- A verification or challenge counts only once its result reaches synthesis; drafting may start sooner, at the risk of rework.
- Under limited capacity, run in waves; never drop a role, the sceptic or the revision reviewer; disclose any verification that could not run (the report's `Not verified:` line and `(unverified)` markers).
- Read the report template before planning the team, so every guarantee-bearing section has an owner.

## Team and tiers

- Sceptic: Tier-1, always; challenges premise, framing, simpler alternatives, unstated assumptions and gold-plating; each SKILL.md adds its angle.
- Analysts: Tier-2; up to two promoted to Tier-1 for the matters needing most judgement. A Tier-1 role costs several times a Tier-2 one for the same reading: worth it where judgement, not breadth, is the bottleneck.
- Support agents: Tier-3, sparingly, for mechanical, verification or exploration tasks; not analysts.
- Revision reviewer: Tier-2 by default; it may take a Tier-1 slot instead of a promoted analyst.
- Tier-1 ceiling: three roles per run, sceptic and reviewer included. Soft cap about 7-9 analysts for large scopes (excludes sceptic, support, reviewer); smaller scopes get smaller teams.
- Resolve tiers with `${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`; its cache lives only in the orchestrator, so pass resolved values to agents and scripts explicitly.
- Apply each tier's model and effort through every per-agent control the active route offers (`${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/models.md` records each route's controls). Where detect-harness says effort cannot be passed per call, that describes a route without a per-agent effort control; on a route that has one, apply effort and report it. Record effort as `inherited` where no control exists, and as `default` where the consumer contract omits it. Add no tier-pinned agent definitions.

## Override

- `--model <name or instruction>` (or the same instruction in trailing text): a model name, a tier name, or prose (tiers per role, a mix, effort). It beats every default, the Tier-1 ceiling included.
- Explicit model names follow detect-harness's rules for explicit `--model` arguments.

## Allocation record

Per role: what it owned, tier, resolved model, effort (`inherited` or `default` where so), plus the route and a one-line rationale; the template's `## Run record` holds it.

## Ground rules

Copied verbatim into every assignment:

- A fact names its anchor: a whole-file read (`path`), `path:line`, or an executed command with its exact result kept in the workstream's `workings/`. A sampled, counted-by-inspection or inferred claim is an assessment and says so; a partial read is marked `(sampled: path)`.
- Settle from code and records before asking; questions are only for what evidence cannot settle.
- `.ace/specification/` and `.ace/mappings/` are read-only grounding: never flagged stale, regenerated or made a subject; where they contradict source, source wins and the finding is about the source.
- Never change the shared checkout; a probe writes only in the isolated location its assignment names. Keep a record under the workstream's `workings/`: each finding with an id under your assignment's prefix (as is every other id the record mints, so none reads as a report id or another record's), any option it depends on and its proposed landing (a report section, a decision, a stage, or nowhere, with why), load-bearing ones marked; rejected alternatives with why they lost, hazards a stage must guard, files other work also changes and precedents to follow are findings too. Return its path and only what your assignment asks for.
- Propose decisions; never append them to decisions.md.

## Repository state

The orchestrator records HEAD and tree state at start for `Grounded at:`; if HEAD moves during the run, never reset it, and report the move on `Grounded at:`.

## Revision pass

- One fresh-context reviewer (no inherited history, never a fork) is given the draft, the template, the evidence, decisions.md, the run's proposed entries, the interview's option-list rules for the draft's questions, and the prior if any. It reads as the downstream orchestrator would and checks:
  - contract: template fields and order; id grammar (unique, never rebound, citations resolve); an owner for every open item; every `D{n}` resolves in decisions.md or among proposed entries; no proposed entry contradicts an owner's answer (the evidence behind it becomes a question for this run's interview); the skill's own guarantee list;
  - fidelity: no claim stronger than its evidence, above all one synthesis introduced or generalised, and no absence without the search that found nothing; `(sampled)`, `(unverified)` and assessment markers honest; the sceptic's dissent kept;
  - actionability: build one stage packet (template's Stages paragraph) and judge whether an agent could start from it without re-asking; nothing deferred without a stated reason.
- The orchestrator weighs the findings and applies the valid ones in one pass, with no loop; draft and findings stay in `workings/`. Saving the report and what follows belong to the SKILL.md.
