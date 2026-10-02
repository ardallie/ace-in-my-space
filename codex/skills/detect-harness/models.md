# Harness model tiers

Data file for `$ace:detect-harness` (`SKILL.md`),
which reads the tier entries below and defines how consumers apply them. Tiers are this
workflow suite's own capability classification, not any vendor's. Each
tier maps to a model and a reasoning effort.

## Tier definitions

- **Tier-1** -- the frontier tier: the most capable model, reserved for the most
  demanding work, at `medium` effort on both harnesses so that maximum effort is not
  the default.
- **Tier-2** -- the heavy general-purpose tier: synthesis, collation, judgement, and
  orchestrated writing.
- **Tier-3** -- the mid tier: bounded, well-briefed work such as per-file mapping,
  verification against a brief, and mechanical passes.

Tiers describe workflow roles, not benchmarked equivalence between models or harnesses.
Keep three tiers while they cover every consumer; add a lighter tier only when a
workflow needs one. Revisit the assignments when representative tasks show insufficient
quality or excessive cost or latency.

## Mapping

### Codex

A tier is a (model, effort) pair, passed through `collaboration.spawn_agent`'s separate
`model` and `reasoning_effort` fields.

- Tier-1: model `gpt-6-astra`, effort `high`
- Tier-2: model `gpt-6.1-sol`, effort `high`
- Tier-3: model `gpt-6-luna`, effort `max`

**Overrides.** Both fields are accepted only with `fork_turns: "none"` or a positive
integer string. Omitting `fork_turns` or passing `"all"` forks the full history and
rejects overrides.

**Effort.** Valid reasoning efforts are `low`, `medium`, `high`, `xhigh`, `max`, and
`ultra`. `gpt-6-luna` supports up to `max`; `gpt-6-astra` and `gpt-6.1-sol` also
support `ultra`.

**Reporting.** The accepted spawn parameters, not a spawned agent's self-description,
are the record of its model and effort.
