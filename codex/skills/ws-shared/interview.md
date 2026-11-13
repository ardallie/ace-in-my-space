# Interview procedure

The suite's canonical interview procedure. Consumers:
`../scope-envelope/SKILL.md`,
`../scope-review/SKILL.md` and
`../scope-code-review/SKILL.md`, each through the workstream
conventions' `## Interview in a ws` (`../ws-shared/workstream-conventions.md`),
which states how answers update the report and the decision log.
`../agent-consultant/SKILL.md` names this file as the reference
copy of its owner gate's procedure but does not read it: it carries a self-contained aligned
copy of the unresolved-marker grammar and its severity order, and declares its owner-gate
divergence from its own side — edit the two together.

The interview phase collects user answers to the open questions of a saved report.

## Run the interview tool

Use `request_user_input` when it is available in Plan mode; otherwise ask the same questions in concise plain text. Group questions by
priority — blocking questions first, then deferrable. For each question, provide 2-3
answer options that help the user make an informed choice rather than composing an answer
from scratch.

Every option list follows the option-list rules in `../run-interview/SKILL.md`.

If there are more than three questions, batch them across multiple
calls — blocking questions in the first batch.

## Collect answers

The user may also provide free-text via the built-in "Other" option. The two unresolved
outcomes short of a tool failure differ in what the call returns. **Declined** — the call
returns, but a question carries no usable answer: leave that question unresolved and
present the remaining batches. **Cancelled** — the user dismisses the prompt without
answering any of it: leave that batch's questions and every unpresented batch unresolved,
record the outcome as `cancelled`, and end the interview. If all questions are unresolved,
end the interview — the report remains as saved, apart from the unresolved marker below.

If an available `request_user_input` call and its plain-text fallback both fail (a tool error, not a user decline), end the
interview: apply any answers already collected per the consumer's update rules, and leave
the rest unresolved. If no answers were collected, the report stands as saved, apart from
the unresolved marker below.

## Unresolved marker

Whenever the interview ends with unresolved questions (declined, cancelled, or tool
failure), append a one-line marker to the end of the `### Open questions` subsection,
which persists while unresolved questions remain:
`Interview: [declined | cancelled | failed]; N questions unresolved.` When outcomes mix,
the status records the most severe: failed > cancelled > declined.
