# Harness model tiers

Data file for `/ace:detect-harness` (`${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`). Tiers are
this workflow suite's own capability classification, not any vendor's. Each tier
carries, per harness, the settings a consumer resolves at spawn time -- on Claude a
model alias, on Codex two separately passed values: model and reasoning effort.

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

### Claude

Values are the aliases the Agent tool's `model` override accepts; the full model ids in
parentheses are reference only, never passed at spawn time.

- Tier-1: `fable` (`claude-fable-5`)
- Tier-2: `opus` (`claude-opus-5`)
- Tier-3: `sonnet` (`claude-sonnet-5`)

The override is ignored for `subagent_type: "fork"`, which always inherits the parent
model.

### Codex

A tier is a (model, effort) pair. Pass its values through the spawn tool's separate
`model` and `reasoning_effort` fields; overrides require `fork_turns: "none"` or a
positive turn count -- full-history (`"all"`) forks do not accept them. The accepted
spawn parameters are the record of an agent's (model, effort) settings; a spawned
agent's self-description is not reliable attestation and must not be used to verify
that an override took effect.

- Tier-1: model `gpt-5.6-sol`, effort `xhigh`
- Tier-2: model `gpt-5.6-sol`, effort `high`
- Tier-3: model `gpt-5.6-sol`, effort `medium`

## Recorded decisions

- **Tier-1 Codex effort is `xhigh`, not `ultra`.** Tier-1 is defined above as the
  default-strength frontier model -- the peer of Claude's `fable`, which is the frontier
  model at default strength, not a maximum-cost configuration. `ultra`, the top of the
  `gpt-5.6-sol` reasoning ladder, would redefine Tier-1 as "absolute strongest
  regardless of cost".
- **No `[1m]` context-window variants.** The `[1m]` suffix selects a session
  context-window variant (a `/model` concern); the Agent tool's `model` override accepts
  only the bare aliases, so `claude-opus-5[1m]`-style values do not work at spawn time.
  A workflow that needs 1M context is session configuration for the operator, not tier
  data for spawned agents.
