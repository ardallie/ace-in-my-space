# Design principles

General layer -- keep byte-identical across sibling repositories.

Guidance for architectural and scope decisions. Principles describe defaults, not absolutes -- deviate with a documented rationale.

## Production-representative infrastructure shape

When introducing infrastructure (services, deployment topology, configuration surfaces), prefer the shape the production system will use, even when the initial configuration is minimal. Retrofitting a fundamentally different topology later is more expensive than configuring a production-shaped one today.

The principle applies to *shape*, not *scale*. Start with minimal config and sensible defaults on a topology that maps cleanly to the target environment; do not pre-build features (speculative caching layers, multi-region or multi-tenant fan-out, custom middleware, elaborate retry ladders) until a concrete requirement emerges. The goal is to pay the cost of the correct *outline* now, not the cost of features that may never be needed.

## No backward compatibility (greenfield project)

**IMPORTANT: This is a greenfield project with no production users.** Do not retain old properties, constants, variables, configuration keys, or function signatures for backward compatibility. When refactoring, remove dead code immediately. Renaming an identifier means updating every consumer and deleting the old name -- never keep both.

Applies across every public surface: entity and DTO types, function and method signatures, constants, configuration keys and settings sections, schemas, generator templates, and every package's public API. Shim properties, deprecation wrappers, and `// removed` placeholder comments are anti-patterns at this stage -- delete cleanly and update every consumer in the same change.

## Long-term architectural stability

Greenfield status is licence to build the right foundations, not licence to defer them. Maintainability, clarity, and minimum tech debt are first-order goals: pay the cost of robust abstractions, consistent patterns, and clean separation of concerns now, when changes are cheap. Shortcuts taken at this stage compound -- every ambiguity, duplicated definition, or leaky boundary is paid for many times over once the system has consumers, integrations, and operational history.

Concrete defaults:

- **Single source of truth.** One authoritative definition drives every derived artefact (schema -> generated types, hooks, and code); no parallel hand-maintained definitions or derivatives.
- **Explicit over implicit.** Named patterns, clear contracts, no magic. Convention is acceptable when documented and uniform across the codebase.
- **Consistency across scopes.** Type patterns, naming, and generated patterns should align across comparable scopes and modules. Divergence is allowed but must be deliberate and have a stated reason.
- **Eager refactoring.** Remove emerging duplication and unclear boundaries the moment they appear. Combined with "No backward compatibility", this keeps the codebase free of accreted residue.
- **Tests at real seams.** Prefer integration coverage that survives refactors over heavy mocking that locks the implementation in place.
- **Design for the next ten changes, not the next one.** When a local fix and a structural fix have comparable cost, take the structural one. When they do not, take the local fix and record the structural shape for later.

Maintainability is a concrete payoff, not architectural aesthetics -- and it must not be traded away for short-term wins. Reductions in defect rate, onboarding cost, refactor risk, and time-to-change are concrete payoffs in their own right and a valid basis for a recommendation, even when no immediate end-user feature depends on them. The rule against bare symmetry justifications targets *cosmetic* alignment ("matches the X precedent"); it does not discourage foundational investment.

When the immediate-benefit lens and the long-term-stability lens disagree, long-term stability wins by default at this stage of the project. A more expensive option that prevents a category of future defects, eliminates a class of duplication, or keeps the architecture coherent should be recommended over a cheaper option that meets the immediate requirement but bakes in drift. State the trade-off plainly in the recommendation so the user can override if they want speed; do not silently pick the short-term path.

## Presenting design options

When offering the user a choice between design paths, every option list must satisfy two rules.

1. **Include "keep current behaviour" as a first-class option.** This is greenfield, so speculative work is expected and welcome -- but the keep-current-behaviour option must appear alongside the active alternatives, framed as a peer rather than as an opt-out. Without this, additions become hidden defaults.
2. **Mark exactly one option `(recommended)`.** The marker tells the user which option the agent would pick; omitting it forces them to guess or to redo the evaluation themselves. If the trade-offs are genuinely balanced, state that explicitly ("no recommendation -- trade-offs are balanced") rather than leaving the field blank.

When justifying a recommendation, lead with the concrete payoff. Architectural symmetry alone is not a reason to add scope: phrases like "matches the X precedent" or "mirrors the Y pattern" are aesthetic rather than functional and should not tip a decision. Cite the precedent as supporting context only once the payoff is established. "Concrete payoff" is not restricted to end-user features -- maintainability, clarity, and tech-debt reduction count, on the terms set out in *Long-term architectural stability*.

These rules apply to every interview surface -- `AskUserQuestion`, the `ace-run-interview` skill, and ad-hoc prompts in commands, skills, and subagents -- not only to flows that route through `/ace-run-interview`.
