# Harness model tiers

Data file for `/ace:detect-harness` (`${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`),
which reads the tier entries below and defines how consumers apply them. Tiers are this
workflow suite's own capability classification, not any vendor's.
On each harness a tier maps to a model and a baseline effort: on Claude a model alias and an
effort level, on Codex a model and a reasoning effort.

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

### Claude

A tier is an (alias, baseline effort) pair. The full model ids in parentheses are for
reference only and are never passed at spawn time.

- Tier-1: alias `opus`, effort `xhigh` (`claude-opus-5-5`)
- Tier-2: alias `opus`, effort `high` (`claude-opus-5-5`)
- Tier-3: alias `sonnet`, effort `high` (`claude-sonnet-5-5`)

**Model.** The alias is passed as the Agent tool's `model` override, which accepts
exactly `fable`, `opus`, `sonnet`, or `haiku`. Context-window suffixes such as `[1m]`
and composite aliases such as `opusplan` are session settings, not override values;
`inherit` is valid only as a definition's `model:` frontmatter value. A spawned
subagent's model resolves in this order: the per-call override, the definition's
`model:` frontmatter, the `CLAUDE_CODE_SUBAGENT_MODEL` environment variable, and
finally the parent session's model. With `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` set to `1`,
neither the override nor the definition's `model:` applies: subagents run on
`CLAUDE_CODE_SUBAGENT_MODEL`, or on the parent's model when that is unset. Forks
(`subagent_type: "fork"`) ignore the override and always run the parent's model, so
apply a tier's model with a non-fork spawn. Verified on Claude Code 2.1.312;
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` per its documentation.

**Effort.** The effort is passed as the Agent tool's per-call `effort` field, which
accepts `low`, `medium`, `high`, `xhigh`, and `max`. Claude Code's documentation lists
all five for both mapped models, `opus` (`claude-opus-5-5`) and `sonnet`
(`claude-sonnet-5-5`); a provider pin or `ANTHROPIC_DEFAULT_OPUS_MODEL` can resolve an
alias to a model with fewer levels. A level a model does not support runs at the
highest level it supports below that one. Forks ignore the field, as they ignore the
model override, so apply a tier's effort with a non-fork spawn too. Without a per-call
value, the spawned definition's `effort:` frontmatter applies, overriding the session
effort while that subagent runs. The `CLAUDE_CODE_EFFORT_LEVEL` environment variable
takes precedence over both the per-call value and frontmatter `effort:`, and a
`maxEffortLevel` setting (top-level, or per model under `modelSettings`; the lowest cap
across settings scopes applies) caps whichever applies. Verified on Claude Code 2.1.312; model support per its documentation.

**Continuation.** `SendMessage` resumes or steers an existing subagent and takes no
`model` or `effort`; the subagent keeps its per-call model and effort. A different
model or effort therefore needs a fresh spawn. Verified on Claude Code 2.1.312.

Plugin definitions pinned to a tier (`${CLAUDE_PLUGIN_ROOT}/agents/*.md`) carry both the
tier's `model:` and its baseline `effort:`; update them when this mapping changes. Their
`effort:` applies only when no per-call effort is passed. A per-call model override
changes a definition's model but not its effort: passing another tier's alias to a
pinned definition runs that alias at the definition's effort unless an effort is passed
per call too, as every tiered spawn does. A definition without
`effort:`, including the built-in `general-purpose` type, runs at the session effort
when none is passed per call. Documented for Claude Code 2.1.312, except the
session-effort default for a definition without `effort:`, which is inferred: no source
states it for the `Agent` tool.

**Reporting.** Report each spawn's model by the source that applied: the override, the
definition's `model:`, the `CLAUDE_CODE_SUBAGENT_MODEL` default or forced value, or
inherited from the parent. A fork always reports inherited; never claim a tier's
override took effect on one. Report effort as the per-call value passed, else the
definition's `effort:` value, or as inherited when neither is set. That is the level
requested: the environment variable, cap and model-support fallback above can change
the level that applies without the orchestrator seeing it, so note one only where it is
known. `/tasks` shows each subagent's model, plus its effort where one is set; that
display, not the agent's self-description, is the record of what was set. Verified on
Claude Code 2.1.312; the `/tasks` display per its documentation.

**Workflow tool.** Agents started through the `Workflow` tool take a per-agent `model`
and `effort` (the same five levels): pass the tier's alias as the agent's `model` and
the selected effort as its `effort`. The agent's model resolves in the subagent order
above, the script's `model` counting as the per-call override; an agent given no
`effort` runs at the session effort. Both parts of a tier therefore apply on that
route, and its effort is reported as the level passed, not inherited. The paragraphs
above describe the `Agent` tool route. Verified on Claude Code 2.1.312.

**Agent teams.** With agent teams enabled, an `Agent` call that passes `name` launches
a teammate instead of a subagent. Teammates take the lead's effort by default, and the
documentation gives them no per-spawn effort, so tiered spawns pass no `name`.
Documented for Claude Code 2.1.312; agent teams were not enabled in the verifying
session.

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
