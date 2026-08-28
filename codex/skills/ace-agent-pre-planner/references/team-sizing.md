# Auto-sizing rubric

Consumed by SKILL.md Phase 3 — read before selecting the count band.
An explicit `--agents N` overrides the band as the source of `N`; the band is still selected
on both paths, and the reconciliation rules below apply on both paths.

## Scope signals

Assessed against the Phase 2 exploration:

- Number of distinct subsystems or modules the change touches.
- Number of files created or materially changed.
- Depth of the dependency chain between the tasks the brief implies.
- Number of intermediate validation gates the work crosses.
- Blast radius — how many existing consumers or call-sites are affected.

The concern count is deliberately not a scope signal — it shapes the team within the band
(Phase 3 step 3), it does not raise the band.

## Count bands

Count bands (non-sceptic `N`), keyed to scope size:

- `N = 1-2` — narrow: a single subsystem or package, a shallow or absent dependency chain,
  a handful of files. Localised bugfix, small isolated feature, or a bounded single-package
  migration.
- `N = 3` — moderate (the fallback): two-to-three subsystems, a moderate dependency chain,
  several validation gates.
- `N = 4-5` — broad: four or more subsystems, deeper dependency chains, multiple validation
  gates, wider blast radius.
- `N = 6-7` — cross-cutting: many subsystems, wide blast radius, concerns that genuinely
  cannot be covered together.

Sizing rule: pick the band from scope size and complexity first, then fit the concerns into
it per `../agent-shared/team-mechanics.md` `## Team sizing` — distinct lenses
over a shared file set buy little independence and duplicate the read pass. The sceptic is
never part of `N`.

Band-boundary precedence: scope confined to one package or module defaults to the narrow
band, even when several subsystem-like concerns are nameable within it — they overlap
enough for one or two analysts to cover, and the single-package clause dominates the
subsystem count unless dependency-chain depth or blast radius independently indicates a
wider band. Risk plays no role in sizing: it neither raises the band nor grants a model
promotion, and rationale lines must not cite risk as a sizing justification.

## Reconciling `N` against the identified concerns

Applies whether `N` came from `--agents` or from the band ceiling:

- If concerns exceed `N`, group the most closely related and lowest-weight concerns into
  combined specialisations until `N` remain, and note the grouping in the report. Grouping
  is the normal path for a small scope with many nameable concerns, not an exception.
- If concerns are fewer than `N` (only reachable via an explicit `--agents N`), assign the
  identified concerns first and fill the remainder with breadth/generalist analysts, and
  note that `N` exceeds the distinct concerns found.
