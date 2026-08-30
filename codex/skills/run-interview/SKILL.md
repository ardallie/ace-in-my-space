---
name: run-interview
description: 'Presents open questions interactively through the Codex question surface; every option list includes keep-current behaviour and marks exactly one option Recommended.'
---

Present open questions to the user interactively through `request_user_input` when it is available in Plan mode, otherwise through the same concise plain-text question.

Every option list must follow `../../rules/principles.md` under "Codex interview surface" and "Presenting design options":

- Include "keep current behaviour" as a first-class option.
- Put the single option labelled `(Recommended)` first, or state explicitly that no recommendation is given.
- Lead the recommendation's justification with the concrete payoff, not with architectural symmetry. "Concrete payoff" is not restricted to end-user features — maintainability, clarity, and tech-debt reduction count, on the terms `principles.md` sets out.
