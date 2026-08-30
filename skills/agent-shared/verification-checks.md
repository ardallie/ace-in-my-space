# Verification checks

The `--checks` flag and the shared verification-battery tiers for the review skills that
run a battery before spawning their team. Consumers:

- `${CLAUDE_PLUGIN_ROOT}/skills/agent-code-review/SKILL.md` -- Phase 3 shared verification
- `${CLAUDE_PLUGIN_ROOT}/skills/agent-arch-review/SKILL.md` -- Phase 2 shared verification

`--checks` is a per-skill flag in the `--prior`/`--reviewers` idiom, deliberately not a
common flag in `input-conventions.md` -- that file's other consumers run no verification
battery (`agent-pre-planner`, `agent-scope`, `plan-route`), and `agent-consultant` carries
its own conditional cheap-gates step and no flag. Each consumer's SKILL.md states where
its battery runs (at which repository state) and where the results are recorded, and
restates the flag grammar in its Usage and Phase 1 flag bullets (the per-skill flag
idiom); the tier definitions below are defined here only. A consumer's Usage bullet may
carry a one-phrase gloss of a tier as a pointer to the definition, never a second
definition of it.

## Flag grammar

`--checks full|cheap|skip` -- selects the verification tier for the run. Default `cheap`
for every consumer. If the value is missing or unknown, report the valid values and stop.

**Naming, settled.** The flag name and value set were settled by owner interview against
the alternatives `--gates` and `--verify` and the value-set variants `full|quick|off` and
`all|fast|none`. It is named `--checks` rather than `--verify` to keep the review skills'
gate-tier flag distinct from a differently-scoped `--verify` in the host's own command set
-- in this repository `/wpak-4-compose`'s `--verify auto|all|skip`, which selects a corpus
subset rather than a gate tier; a replication into a host without such a flag keeps the name
and loses only the collision. `full` and that flag's `all` are the same idea under different
names, accepted because the two flags never appear on the same command.

## Tiers

- `full` -- enumerate the gate set from the project's CI definitions (its workflow files
  or equivalent) and run every gate they define, the build included. A project's own
  development docs may document a narrower everyday battery, which is not the gate set.
- `cheap` (default) -- run the cheap gates only: compile/typecheck plus any fast
  verification or parity scripts the repository defines. A gate qualifies when it neither
  builds nor runs a test suite, and completes in the inner-loop time the project expects
  of it: compile/typecheck and the project's own fast verification, parity, or consistency
  scripts qualify; a build, a test suite, and a repository-wide formatting or linting sweep
  do not. Where the project documents both a narrow everyday form and a broader form of a
  qualifying gate, take the narrowest form that covers the scope under review. Record the
  derived list, so two runs over the same scope resolve the same battery. `cheap` never
  expands to the whole CI gate set -- the typical review runs this tier, and `full` is the
  per-run opt-in for a state that warrants the whole CI battery.
- `skip` -- run no shared battery at all. The run must still record that checks were
  skipped by flag (see Degradation below) -- `skip` silences the battery, never the
  record of it.

**No compile or test surface** -- when the scope under review (the diff, file set, or
scope area -- never the whole repository) has no compile or test surface -- a
documentation or prompt pack, or a diff touching only such files -- the scope's own
executable surfaces are the battery under `full` and `cheap` alike: syntax checks over
embedded shell blocks (`sh -n`), mechanical greps, and, where the repository defines a
mechanical skills-package checker, that checker's check battery -- in the suite's home
repository `pnpm skills:check`, a host-local example naming the alias rather than a pack contract, so
a replication into a repository without one loses nothing but the example. Where none
exists, `sh -n` and the greps remain the battery. These surfaces substitute for the CI gate
set only where the CI definitions resolve no gate covering the scope; where a workflow does
gate this scope class, `full` enumerates and runs it as its own definition requires, and the
scope's own surfaces run alongside.

**Path filters compose with this fallback.** Where a consumer's `full`-tier binding
evaluates the CI definitions' path-scoping rules against the scope, the two rules compose
rather than compete: record the path-filter outcome -- which CI gates were out of scope for
this scope -- *and* run the scope's own executable surfaces per the fallback above. The
fallback substitutes the gates that run; it never suppresses the record of which CI gates
did not apply.

## Degradation

Downstream rules in the consumers assume gate results exist. They degrade on the run's
**outcome**, not on the flag value: a `cheap` or `full` tier that resolves to an empty gate
set executed nothing and is recorded as such, exactly as a `skip` run is.

- **The record grammar.** Wherever a consumer records the shared battery -- a report line,
  a context package -- it records one value in this shape:

  `{tier-or-mode}[ -- {executed commands | no-gate marker}][ (+ --prior pre-build)]`

  - `{tier-or-mode}` is `full`, `cheap`, or `skipped by flag`.
  - A tier that executed commands carries them: the executed command list, or a one-line
    summary of it where the recording surface is a single line -- `cheap -- typecheck +
    parity script, passed`, `cheap -- no compile surface, greps only`.
  - A tier that executed nothing carries the no-gate marker in its place --
    `cheap -- no gate resolved`.
  - `skipped by flag` carries no command clause; there is nothing to list.
  - The `(+ --prior pre-build)` suffix is appended only by a consumer whose `--prior`
    handling builds before spawning (see below).

  The mode always displaces a command list rather than sitting beside an empty one, so a
  reader never mistakes an unverified state for a passing one.
- Rules that push a failing gate downstream as an established fact apply only to gates
  actually run.
- Spawn prompts that present recorded gate results as established facts must, whenever the
  run executed no gates -- `skip` by flag, or a tier that resolved to an empty set -- state
  that no shared battery ran instead of implying verification happened.
- Team members' own change-specific probes are independent of this flag: `--checks skip`
  disables the parent's shared battery, never a member's probe obligations.

**`--prior` pre-builds sit outside the battery.** Where a consumer builds before spawning
because `--prior` was supplied -- so members reuse the built state for probes instead of
each rebuilding the same state -- that build is a probe-support step, not a shared-battery
gate: it runs under every `--checks` tier, `skip` included, and is disclosed by the
`(+ --prior pre-build)` suffix on the record, so a `skip` run never reads as having built
nothing. Under `full` the battery's own build satisfies it -- build once, and append the
suffix only where the pre-build ran outside the battery.
