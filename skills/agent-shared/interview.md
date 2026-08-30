# Interview procedure

The suite's canonical interview procedure. Consumers: the four suite skills, each stating
its own divergences from this procedure in its own file (e.g. section names, tag
vocabularies, where the unresolved marker is appended, whether resolved questions are
removed or kept in place). `/ace:agent-consultant` carries a self-contained aligned copy of
the unresolved-marker grammar and its severity order rather than reading this file, and
declares its owner-gate divergence from its own side — edit the two together.

The interview phase collects user answers and overwrites the saved report file with
updated content. The file save is mandatory — without it, the report lacks interview
answers.

## Run the interview tool

Use the `AskUserQuestion` tool to present open questions interactively. Group questions by
priority — blocking questions first, then deferrable. For each question, provide 2-4
answer options that help the user make an informed choice rather than composing an answer
from scratch.

Every option list follows `${CLAUDE_PLUGIN_ROOT}/rules/principles.md` under "Presenting design options".

If there are more questions than the tool supports per call, batch them across multiple
calls — blocking questions in the first batch.

## Collect answers

The user may also provide free-text via the built-in "Other" option. The two unresolved
outcomes short of a tool failure differ in what the call returns. **Declined** — the call
returns, but a question carries no usable answer: leave that question unresolved and
present the remaining batches. **Cancelled** — the user dismisses the prompt without
answering any of it: leave that batch's questions and every unpresented batch unresolved,
record the outcome as `cancelled`, and end the interview. If all questions are unresolved,
end the interview — the report remains as saved, apart from the unresolved marker below.

If the `AskUserQuestion` tool itself fails (a tool error, not a user decline), end the
interview: apply any answers already collected per the update rules, and leave the rest
unresolved. If no answers were collected, the report stands as saved, apart from the
unresolved marker below.

## Update the report

For each answered question:

- **Enhanced brief**: weave the answer into the narrative at the relevant point, written
  as a statement of fact or design decision. Reference the finding number in bold (e.g.,
  **see Q2**).
- **Open questions subsection**: remove the answered question. If all resolved, remove the
  entire subsection.
- **Question finding**: prepend `[Resolved]` to the description and append the user's
  answer on a new line prefixed with `Answer:`. Do not delete the finding — it serves as
  audit trail. Keep the tags canonical and in canonical order — the identifier, then the
  priority tag `[blocking]` or `[deferrable]` verbatim, then `[Resolved]`, then the
  description (e.g. `Q1 [blocking] [Resolved] ...`); any qualification goes in prose after
  the tags, never inside them.
- **Summary and assessment sections**: re-read `## Summary` and the report's assessment
  section (each consuming SKILL.md names it) and revise any statement the answers
  invalidate. A blocking answer that inverts the report's posture may legitimately require
  rewriting the assessment wholesale; these edits are licensed parts of the mandatory
  overwrite, not deviations.
- **Moot questions**: a question rendered moot by another question's answer may be
  orchestrator-resolved without interviewing it — prepend `[Resolved]` and append
  `Answer: moot under Q{n} — <one-line reason>`. This is the only licensed non-user
  resolution.
- Skipped questions: no changes.

## Unresolved marker

Whenever the interview ends with unresolved questions (declined, cancelled, or tool
failure), append a one-line marker to the end of the `### Open questions` subsection,
which persists while unresolved questions remain:
`Interview: [declined | cancelled | failed]; N questions unresolved.` When outcomes mix,
the status records the most severe: failed > cancelled > declined.

## Save updated report

Overwrite the same file path used in the save-report phase. If the overwrite fails, retry
once; if it still fails, output the updated report in full so the user can save it
manually. On a successful save, output the saved file path plus only the changed sections
— do not re-output the full report to the conversation. Proceed to the publish phase.
