---
name: run-interview
description: 'Presents open questions interactively through the Codex question surface; every option list includes keep-current behaviour and marks exactly one option Recommended.'
---

Present open questions to the user interactively through `request_user_input` when it is available in Plan mode, otherwise through the same concise plain-text question.

Use `request_user_input` when it is exposed in Plan mode. It accepts at most three questions per call and two or three mutually exclusive options per question; put the single `(Recommended)` option first and include keep-current behaviour as one of the options. When the tool is unavailable in Default mode, ask the same question in concise plain text with the same ordered options, the same `(Recommended)` marker, and an explicit invitation for a free-form alternative. Tool availability changes presentation only, never the decision shape.

Every option list must follow these rules. This skill is the canonical statement of the option-list rules; they apply to every Codex interview surface -- `request_user_input`, its plain-text fallback, and ad-hoc prompts in skills and subagents -- not only to flows that route through `$ace:run-interview`:

- Include "keep current behaviour" as a first-class option.
- Put the single option labelled `(Recommended)` first, or state explicitly that no recommendation is given.
- Lead the recommendation's justification with the concrete payoff, not with architectural symmetry. "Concrete payoff" is not restricted to end-user features — maintainability, clarity, and tech-debt reduction count.
