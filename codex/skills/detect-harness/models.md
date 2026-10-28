# Harness model tiers

Data file for `$ace:detect-harness` (`SKILL.md`),
which reads the tier entries below and defines how consumers apply them. Tiers are this
workflow suite's own capability classification, not any vendor's. Each
tier maps to a model and a baseline reasoning effort.

## Tier definitions

- **Tier-1** -- the top tier: the most demanding work, where judgement rather than
  breadth decides the result.
- **Tier-2** -- the heavy general-purpose tier: synthesis, collation, judgement, and
  orchestrated writing.
- **Tier-3** -- the mid tier: bounded, well-briefed work such as per-file mapping,
  verification against a brief, and mechanical passes.

A tier's effort is its baseline: the consumer contract in `SKILL.md` selects the effort
each assignment passes, starting from it.

Tiers describe workflow roles, not benchmarked equivalence between models or harnesses.
Keep three tiers while they cover every consumer; add a lighter tier only when a
workflow needs one. Revisit the assignments when representative tasks show insufficient
quality or excessive cost or latency.

## Mapping

### Codex

A tier is a (model, baseline effort) pair. Pass its model and the effort selected
under `SKILL.md`'s consumer contract through `collaboration.spawn_agent`'s separate
`model` and `reasoning_effort` fields.

- Tier-1: model `gpt-6-astra`, effort `high`
- Tier-2: model `gpt-6.1-sol`, effort `high`
- Tier-3: model `gpt-6.1-terra`, effort `high`

**Overrides.** Model and effort overrides require explicit user, `AGENTS.md` or skill
instructions and `fork_turns: "none"` with a self-contained brief. The supported fork
values are `"none"` and `"all"`; omitting the field or passing `"all"` inherits the
parent's model and effort and rejects overrides. Verified on codex-cli 0.165.0.

**Spawn surface.** `collaboration.spawn_agent` requires `task_name` and `message`;
`fork_turns`, `model` and `reasoning_effort` are optional. It has no agent-type field.
Verified on codex-cli 0.165.0. A hyphenated `task_name` was rejected and underscore names
accepted, so separate words with underscores, as the plan pipeline's task names do.
Observed in a later review session's runtime; the full accepted character set is not
documented.

**Continuation.** `collaboration.send_message` queues guidance to an existing agent
without starting a turn. `collaboration.followup_task` starts a turn if the agent is
idle; otherwise it delivers guidance at a message boundary or after the pending tool
call completes. Both take only `target` and `message`, with no model or effort
control. A different model or effort, even within one tier, needs a fresh spawn.
Verified on codex-cli 0.165.0.

**Effort.** The collaboration tool advertises `low`, `medium`, `high`, `xhigh`, `max`,
and `ultra`. Each mapped model supports all six: `gpt-6-astra`, `gpt-6.1-sol` and
`gpt-6.1-terra`. These are collaboration reasoning-effort settings, not API effort
parameters. Verified on codex-cli 0.165.0.

**Defaults and payloads.** For a `"none"` spawn, explicit settings override the
corresponding `[agents]` defaults, which override the parent's settings. Selecting a
model without a per-call or configured effort uses that model's default effort. The
exposed spawn tool cannot select a custom-agent TOML definition. The suite's
`../../agents/*.md` files are message payloads, with no model or effort frontmatter;
read them into `message` and select settings through the consumer contract. Verified
on codex-cli 0.165.0; defaults precedence per the official Subagents documentation.

**Reporting.** Record accepted model and effort overrides. When either is omitted,
report default selection or inheritance as the consumer contract directs; do not
invent its value or use a spawned agent's self-description as verification. Verified
on codex-cli 0.165.0.
