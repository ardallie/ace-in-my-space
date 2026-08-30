# Harness model tiers

Data file for `$ace:detect-harness` (`SKILL.md`). Tiers are
this workflow suite's own capability classification, not any vendor's. Each tier carries the two settings a Codex consumer resolves at spawn time: model and reasoning effort.

## Tier definitions

- **Tier-1** -- the default-strength frontier model: the strongest model a spawn
  normally targets, not a maximum-cost configuration.
- **Tier-2** -- the heavy general-purpose tier: synthesis, collation, judgement, and
  orchestrated writing.
- **Tier-3** -- the mid tier: bounded, well-briefed work such as per-file mapping,
  verification against a brief, and mechanical passes.

Three tiers only. No in-scope workflow skill spawns a lighter tier; add a Tier-4 in the
change that produces a consumer for it, not speculatively here.

## Mapping


### Codex spawn settings

A tier is a (model, effort) pair. Pass its values through `collaboration.spawn_agent`'s separate
`model` and `reasoning_effort` fields; overrides require `fork_turns: "none"` or a
positive turn count -- full-history (`"all"`) forks do not accept them. The accepted
spawn parameters are the record of an agent's (model, effort) settings; a spawned
agent's self-description is not reliable attestation and must not be used to verify
that an override took effect.

- Tier-1: model `gpt-5.6-sol`, effort `xhigh`
- Tier-2: model `gpt-5.6-sol`, effort `high`
- Tier-3: model `gpt-5.6-sol`, effort `medium`

## Recorded decisions

- **Tier-1 Codex effort is `xhigh`, not `ultra`.** Tier-1 is the default-strength frontier tier, not a maximum-cost configuration. `ultra`, the top of the `gpt-5.6-sol` reasoning ladder, would redefine it as absolute strongest regardless of cost.
