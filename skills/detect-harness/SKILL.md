---
name: detect-harness
description: "Detects which agent harness the session is running in (Claude Code or Codex CLI) from the harness's self-identification and prints a Harness: block mapping the three capability tiers to spawn settings, read from the models.md mapping beside this file. Invoke before spawning tiered agents when no Harness: block carrying its session-cache marker is already in the conversation context; the printed block is the session cache."
disable-model-invocation: false
---

# Detect harness

## Purpose

Workflow skills spawn agents at capability tiers rather than by vendor model name. This
skill determines which harness the session is running in and prints the tier -> model
mapping valid for that harness, so downstream skills can resolve "spawn a Tier-2 agent"
to spawn settings the current harness accepts. The mapping data lives in
`${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/models.md`; this file holds the detection procedure, the
output contract, and the consumer contract. The split is deliberate, not progressive
disclosure: `models.md` is the small data file a consumer reads at spawn time and the
file a mapping change edits (a sibling replication re-points it without touching the
procedure), so mapping maintenance never rides on the procedure text.

Total cost per resolution: one read of `models.md` (~2.6 kB) plus, when the procedure or
contract is not already in context, one read of this file (~6.5 kB). No shell commands.
The printed block then serves the whole session.

## Cache check (before detecting)

The printed output block is the cache: it sits in the conversation context for the rest
of the session, and the harness cannot change within a session. The block's `Harness:`
line carries the literal marker `(detect-harness, session cache)`; a skill that needs
tier information checks the context for a line bearing that exact marker and re-runs
detection only when none is present. The marker is the whole test -- text without it (a
paraphrase, or a summarised block after context compaction) is not a cache hit, however
plausible it reads.

There is no file-based cache, deliberately: a file would survive across sessions, going
stale when `models.md` changes or the operator switches harness, to save a per-session
cost of one small read.

## Detection

One signal: self-identification. The harness names itself in the agent's own system
prompt ("You are Claude Code ...", "You are Codex ..."). Reading it costs nothing, and
the harness's own agent always has it -- no environment probe or other side channel is
consulted.

### Resolution

- Self-identification names exactly one harness with a `### {harness}` section in
  `models.md` -> that harness.
- Self-identification names a harness with no `### {harness}` section in `models.md` ->
  print `Harness: unknown`, name the unmapped harness in the explanation line, print no
  tier lines, and stop.
- Self-identification is absent, or names more than one harness -> print
  `Harness: unknown` with one line stating what was found, print no tier lines, and
  stop. Do not guess: a wrong harness answer poisons every downstream spawn in the
  session, while `unknown` merely sends the operator here to look.

## Output contract

On success, read `${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/models.md` and print exactly one block:
stable field names, one field per line, values taken from the mapping at invocation time
(never from the examples below, so mapping edits propagate), and the session-cache
marker on the `Harness:` line. Each `Tier-N` value carries the spawn settings for that
tier: on Claude a model alias passed verbatim; on Codex a space-separated model and
effort, which a consumer splits into the spawn tool's `model` and `reasoning_effort`
fields (`models.md` records the accompanying spawn constraints).

On Claude:

```
Harness: claude  (detect-harness, session cache)
Tier-1: fable
Tier-2: opus
Tier-3: sonnet
```

On Codex:

```
Harness: codex  (detect-harness, session cache)
Tier-1: gpt-5.6-sol xhigh
Tier-2: gpt-5.6-sol high
Tier-3: gpt-5.6-sol medium
```

On failure: `Harness: unknown`, no tier lines, one line of explanation, stop.

If a spawn later rejects a mapped value, treat the mapping as stale rather than
substituting a different model: print `Harness: unknown` with the rejection as the
explanation line and send the operator to `models.md`.

Print nothing else as part of the contract -- downstream skills read the block
mechanically, keyed on the `Harness:` line.

## Consumer contract

Workflow skills prescribe spawned-agent models as tier references: prose uses the bare
`Tier-1` / `Tier-2` / `Tier-3` form; spawn specs use the brace placeholder in the model
position (`model: {Tier-2}`). Consumers resolve them as follows:

- Tier prescriptions resolve at spawn time against the `Harness:` block in the session
  context (the marker line -- see the cache check). If no such block is present, detect
  first: read `models.md`, take the `### {harness}` section matching the session's own
  self-identification, and print the block per the output contract. Where the harness
  exposes `/ace:detect-harness` as an invokable skill, invoking it performs exactly this
  and is equivalent.
- The block's `Tier-N` value substitutes for the reference. On Claude it is a single
  model alias, passed verbatim as the Agent tool's `model` override. On Codex it is a
  space-separated pair: split it into the spawn tool's separate `model` and
  `reasoning_effort` fields, and observe the spawn constraints in `models.md`
  (`### Codex`) -- overrides are rejected on full-history (`"all"`) forks, so pass
  `fork_turns: "none"` or a positive turn count.
- When resolution returns `Harness: unknown` (no tier lines), do not guess a model:
  spawn with the harness's own default model selection, and state in the run's report
  that tier resolution was unavailable.
- Report surfaces record the resolved assignment -- the actual model names used, not the
  tier references.
- Tier names are valid `--model` prose values by construction: the flag's value is an
  instruction carrying model information, and `Tier-2` is such an instruction. Flag
  documentation may use them in examples. A `--model` value naming a model the current
  harness does not offer resolves to the nearest tier by capability; where no such
  reading is available, report it to the user together with the `Harness:` block's tier
  values and stop.
