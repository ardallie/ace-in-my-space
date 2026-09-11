# Harness model tiers

Data file for `$ace:detect-harness` (`SKILL.md`). Tiers are
this workflow suite's own capability classification, not any vendor's. Each tier
carries the two settings a Codex consumer resolves at spawn time: model and
reasoning effort.

## Tier definitions

- **Tier-1** -- the frontier model at `medium` effort on both harnesses: reserve the
  most capable model for demanding work without making maximum effort the default.
- **Tier-2** -- the heavy general-purpose tier: synthesis, collation, judgement, and
  orchestrated writing.
- **Tier-3** -- the mid tier: bounded, well-briefed work such as per-file mapping,
  verification against a brief, and mechanical passes.

These tiers describe workflow roles, not benchmarked equivalence between models or
harnesses. Keep three tiers while they cover all consumers; add a lighter tier only
when a workflow needs it. Revisit assignments when representative tasks show
insufficient quality or excessive cost or latency.

## Mapping

### Codex

A tier is a (model, effort) pair. Pass its values through `collaboration.spawn_agent`'s
separate `model` and `reasoning_effort` fields; overrides require `fork_turns: "none"` or a
positive turn count -- full-history (`"all"`) forks do not accept them. The accepted
spawn parameters are the record of an agent's (model, effort) settings; a spawned
agent's self-description must not be used to verify that an override took effect.

- Tier-1: model `gpt-6-astra`, effort `medium`
- Tier-2: model `gpt-5.6-sol`, effort `high`
- Tier-3: model `gpt-5.6-luna`, effort `max`
