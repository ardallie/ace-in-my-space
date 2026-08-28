# Output style

General layer -- keep byte-identical across sibling repositories.

## Writing style

- Write technically and concisely; limit adjectives and adverbs.
- State what the code does, not what it might intend to do.
- Provide actionable suggestions and reference specific lines where possible.

## Language conventions

- Use British English for all natural language: responses, documentation, and code comments.
- Use American English exclusively for identifiers: variable and function names (e.g. `color`, `initialize`, `center`), configuration keys, API parameters, and anything that forms part of code syntax.

## Markdown generation

Apply these conventions when generating Markdown documentation:

- Use `->` instead of Unicode arrows, `...` instead of the ellipsis character, and `--` instead of em-dashes.
- Use `+`, `|`, `-` for diagrams instead of box-drawing characters.
- Prefer lists to Markdown tables for better LLM parsing.

## Documentation authoring

Applies to project context documents (`.docs/**`) and any durable description of the system:

- Describe the current state in the present tense. Do not narrate change history -- no "replaced", "migrated from", "previously", "now uses", "used to", or comparisons to prior implementations. Treat the implementation being documented as the only one that has ever existed.
- Migration context, decision history, and rationale belong in commits, PR descriptions, and GitHub issues. Documentation files describe how the system works today; they do not double as changelogs.
