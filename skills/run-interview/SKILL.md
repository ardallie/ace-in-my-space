---
name: run-interview
description: 'Presents open questions to the user interactively via AskUserQuestion; every option list includes "keep current behaviour" and marks exactly one option recommended.'
disable-model-invocation: false
---

Present open questions to the user interactively via the `AskUserQuestion` tool.

Every option list must follow these rules. This skill is the canonical statement of the option-list rules; they apply to every interview surface -- `AskUserQuestion`, ad-hoc prompts in commands, skills, and subagents -- not only to flows that route through `/ace:run-interview`:

- Include "keep current behaviour" as a first-class option.
- Mark exactly one option `(recommended)`, or state explicitly that no recommendation is given.
- Lead the recommendation's justification with the concrete payoff, not with architectural symmetry. "Concrete payoff" is not restricted to end-user features — maintainability, clarity, and tech-debt reduction count.
