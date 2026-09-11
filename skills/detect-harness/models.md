# Harness model tiers

Data file for `/ace:detect-harness` (`${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`). Tiers are
this workflow suite's own capability classification, not any vendor's. Each tier
carries, per harness, the settings a consumer resolves at spawn time -- on Claude a
model alias and an effort level, on Codex two separately passed values: model and
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

### Claude

A tier is an (alias, effort) pair. The alias is what the Agent tool's `model` override
accepts; the full model ids in parentheses are reference only, never passed at spawn
time. Context-window suffixes such as `[1m]` are session settings, not spawn aliases.
Effort values are Claude Code effort levels (`low`, `medium`, `high`, `xhigh`, `max`).

- Tier-1: alias `fable`, effort `medium` (`claude-fable-5-1`)
- Tier-2: alias `opus`, effort `high` (`claude-opus-5`)
- Tier-3: alias `sonnet`, effort `high` (`claude-sonnet-5`)

Effort is not a spawn-time argument on Claude: the Agent tool has no per-call effort
field. A tier's effort takes effect only through the `effort:` frontmatter of the
subagent definition being spawned, which overrides the session effort while that
subagent is active. Plugin definitions pinned to a tier
(`${CLAUDE_PLUGIN_ROOT}/agents/*.md`) therefore carry both the tier's `model:` and
`effort:`; update them when this mapping changes. A definition without `effort:`,
including the built-in `general-purpose` type, inherits the session effort; report
such spawns as inheriting effort, not as running the tier's effort.

Frontmatter effort does not override the `CLAUDE_CODE_EFFORT_LEVEL` environment
variable, and a `maxEffortLevel` setting (top-level or per model under
`modelSettings`) caps it. `/tasks` shows each subagent's model, plus its effort when
the definition sets one; that display, not the agent's self-description, is the
record of what applied.

The override is ignored for `subagent_type: "fork"`, which always inherits the parent
model. Use a non-fork spawn to apply a tier's model. If the calling workflow requires
a fork, report inheritance rather than claiming the tier's model override took effect.

### Codex

A tier is a (model, effort) pair. Pass its values through the spawn tool's separate
`model` and `reasoning_effort` fields; overrides require `fork_turns: "none"` or a
positive turn count -- full-history (`"all"`) forks do not accept them. The accepted
spawn parameters are the record of an agent's (model, effort) settings; a spawned
agent's self-description must not be used to verify that an override took effect.

- Tier-1: model `gpt-6-astra`, effort `medium`
- Tier-2: model `gpt-5.6-sol`, effort `high`
- Tier-3: model `gpt-5.6-luna`, effort `max`
