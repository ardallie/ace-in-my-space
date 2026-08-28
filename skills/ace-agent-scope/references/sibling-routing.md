# Sibling routing gate

Consumed by SKILL.md Phase 8 — read when (and only when) the run's grounding evidences a
sibling repository (the same evidence Phase 4 uses to assign the seam probe). Runs before
any interview, per `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/sibling-exchange-protocol.md`.

Classify each open question: **sibling-answerable** (the answer is settled, or materially
informed, by facts about the sibling repository's current behaviour, capabilities, or
contracts — the sibling-side analogue of the answerable-from-code class in
`${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-route/SKILL.md`) or **owner-only** (a preference or priority call only
the user can make — never routed, even when it concerns the sibling's surface). When no
question classifies sibling-answerable, skip the gate silently and interview as before.

When sibling-answerable questions exist, run one `AskUserQuestion` for the whole routable
set — classification is per question, the decision is whole-set, and the user may narrow
the set via free text — following the option-list rules in `${CLAUDE_PLUGIN_ROOT}/rules/principles.md`
under "Presenting design options":

1. **Formulate a consultant request (Recommended)** — the routed questions get
   evidence-backed answers from the repository that owns them, instead of the user's best
   guess; owner-only questions still interview now.
2. **Interview everything now** — the keep-current-behaviour option: all open questions go
   to the user in this run.

On option 2 — or if the gate's `AskUserQuestion` fails as a tool (record the unanswered
gate in `## Summary`) — proceed to the interview over all open questions. On option 1:

- **Mark each routed line in place**: `Q{n} [blocking|deferrable] [Routed] — {question}` —
  tags canonical: identifier, priority tag verbatim, then `[Routed]`; the question text is
  preserved. Routed questions stay unresolved: dependent statements keep their
  **see Q{n}** markers, and assumption entries stay `open (Q{n})`.
- **Append a correlation line** at the end of the `### Open questions` subsection:
  `Routed: {8hex}, round {k}; {N} questions await consultant answers.`
- **Compose the request envelope** by reproducing the skeleton in
  `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/sibling-exchange-protocol.md` `## Request envelope` in
  full — the `# Consultation request` H1, `Exchange:`, `Requester:`, `Consultant:`,
  `Source:`, `Date:`, `## Context recap`, and `## Questions` with its indented
  `Why it matters:` lines. That file owns the field set; only the values below are this
  run's to derive. Exchange id and round: when an input artefact already carries an
  exchange id for these questions (a prior `Routed:` line, or a consultant answers report
  among the inputs), reuse that id and increment the round — a follow-up, not a new
  exchange; otherwise the id is this run's Phase 4 suffix and the round is 1, giving
  `Exchange: {8hex}, round {k}`. One id per counterpart: routing to a second sibling
  repository mints a distinct id per the protocol. `Requester:` is a role description of
  this repository (never its name), derived from the grounding's system characterisation
  or, absent grounding, from the ambition; `Consultant:` is a role description of the
  sibling repository expected to answer, from the same grounding; `Source:` names this
  scope envelope. The context recap is a short, self-contained orientation for a session
  with zero context of this one — the ambition, the chosen direction, and why each routed
  question matters, not a duplicate of this report; the questions block carries the routed
  questions only, verbatim. Save it to
  `.ace/reports/{yyyyMMdd}-{HHmm}-consult-request-r{k}-{8hex}.md` (from round 2 the
  `{8hex}` is the inherited exchange id, not this run's suffix; the write mechanism is the
  one in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md` `## Save report`, and this
  artefact's fallback deliverable is the printed copy) and print it in full — the user
  carries the printed text or the saved file across by hand, ideally together with this
  report file.
- **Interview the remaining owner-only questions** per the interview procedure; the update
  rules apply to them unchanged. When routing leaves no question to interview, skip the
  interview tool — the routed markers and correlation line are still applied through the
  interview phase's save step, which becomes mandatory whenever the gate routed anything.
- **Print the hand-off instructions** in the final summary: run
  `/ace-agent-consultant {request file} {this report file}` in the sibling repository; carry
  its answers report back and pass it as an input to the next run here — a re-scope
  (`/ace-agent-scope {this report path} {answers path}`) or the owning stage's pre-planner run
  with the answers file appended. No other fold-in machinery exists; the matching
  `Exchange:` ids are the audit link.
