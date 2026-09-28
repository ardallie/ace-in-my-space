# Harness model tiers

Data file for `/ace:detect-harness` (`${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`),
which reads the tier entries below and defines how consumers apply them. Tiers are this
workflow suite's own capability classification, not any vendor's.
On each harness a tier maps to a model and an effort: on Claude a model alias and an
effort level, on Codex a model and a reasoning effort.

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

### Claude

A tier is an (alias, effort) pair. The full model ids in parentheses are for reference
only and are never passed at spawn time.

- Tier-1: alias `fable`, effort `medium` (`claude-fable-5-1`)
- Tier-2: alias `opus`, effort `high` (`claude-opus-5-5`)
- Tier-3: alias `sonnet`, effort `high` (`claude-sonnet-5-5`)

**Model.** The alias is passed as the Agent tool's `model` override, which accepts
exactly `fable`, `opus`, `sonnet`, or `haiku`. Context-window suffixes such as `[1m]`
and composite aliases such as `opusplan` are session settings, not override values;
`inherit` is valid only as a definition's `model:` frontmatter value. A spawned
subagent's model resolves in this order: the per-call override, the definition's
`model:` frontmatter, the `CLAUDE_CODE_SUBAGENT_MODEL` environment variable, and
finally the parent session's model. Forks (`subagent_type: "fork"`) ignore the override
and always run the parent's model, so apply a tier's model with a non-fork spawn.

**Effort.** Effort cannot be passed per call: the Agent tool has no effort field. A
tier's effort applies only through the `effort:` frontmatter of the spawned
definition, which overrides the session effort while that subagent runs. The
`CLAUDE_CODE_EFFORT_LEVEL` environment variable takes precedence over frontmatter
`effort:`, and a `maxEffortLevel` setting (top-level, or per model under
`modelSettings`) caps it. Effort levels are `low`, `medium`, `high`, `xhigh`, and
`max`.

Plugin definitions pinned to a tier (`${CLAUDE_PLUGIN_ROOT}/agents/*.md`) therefore
carry both the tier's `model:` and `effort:`; update them when this mapping changes. A
per-call override changes a definition's model but not its effort: passing another
tier's alias to a pinned definition runs that alias at the definition's effort. A
definition without `effort:`, including the built-in `general-purpose` type, runs at
the session effort.

**Reporting.** Report each spawn's model by the source that applied: the override, the
definition's `model:`, the `CLAUDE_CODE_SUBAGENT_MODEL` default, or inherited from the
parent. A fork always reports inherited; never claim a tier's override took effect on
one. Report effort as the definition's `effort:` value, subject to the environment
variable and cap above, or as inherited when the definition sets none. `/tasks`
(Claude Code v2.1.242 or later) shows each subagent's model, plus its effort when the
definition sets one; that display, not the agent's self-description, is the record of
what applied.

### Codex

A tier is a (model, effort) pair, passed through `collaboration.spawn_agent`'s separate
`model` and `reasoning_effort` fields.

- Tier-1: model `gpt-6-astra`, effort `medium`
- Tier-2: model `gpt-6-sol`, effort `high`
- Tier-3: model `gpt-6-luna`, effort `max`

**Overrides.** Both fields are accepted only with `fork_turns: "none"` or a positive
integer string. Omitting `fork_turns` or passing `"all"` forks the full history and
rejects overrides.

**Effort.** Valid reasoning efforts are `low`, `medium`, `high`, `xhigh`, `max`, and
`ultra`. `gpt-6-luna` supports up to `max`; `gpt-6-astra` and `gpt-6-sol` also
support `ultra`.

**Reporting.** The accepted spawn parameters, not a spawned agent's self-description,
are the record of its model and effort.
