---
name: ace-run-interview
description: 'Presents open questions to the user interactively via AskUserQuestion; every option list includes "keep current behaviour" and marks exactly one option recommended (see ${CLAUDE_PLUGIN_ROOT}/rules/principles.md).'
disable-model-invocation: false
---

Present open questions to the user interactively via the `AskUserQuestion` tool.

Every option list must follow the format rules in `${CLAUDE_PLUGIN_ROOT}/rules/principles.md` under "Presenting design options":

- Include "keep current behaviour" as a first-class option.
- Mark exactly one option `(recommended)`, or state explicitly that no recommendation is given.
- Lead the recommendation's justification with the concrete payoff, not with architectural symmetry. "Concrete payoff" is not restricted to end-user features — maintainability, clarity, and tech-debt reduction count, on the terms `principles.md` sets out.
