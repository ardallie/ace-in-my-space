# Pre-planner transform and sceptic-veto gate

Executed from `/ace-plan-start` (`${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-start/SKILL.md`): the transform below is
Phase 2's brief-assembly arm for a detected pre-planner report; the sceptic-veto gate is
Phase 2.5 in full; the write-back section at the end is executed from Phase 3.

## Phase 2 transform — build the payload

Transform the report into a slim brief that points the drafter at the report file rather than re-emitting it. The orchestrator emits items 1, 2, and 3 below (Header, Open questions, Workload-split selector); the report's body sections — `## Enhanced brief`, `### Confirmed`, `[Resolved]` open-questions, `### Workload split`, and `## Context files` — are read by the drafter directly per its own agent prompt at `${CLAUDE_PLUGIN_ROOT}/agents/ace-plan-drafter.md` step 1. Build the payload as follows:

1. **Header.** Three lines (four on the issue route — the `Issue:` line is emitted only then):

   ```
   Input class: pre-planner report
   Source: <repo-relative report path>
   Issue: <issue URL>
   Original sources: <values from the report's own `Source:` field, comma-separated>
   ```

   On the issue route, `Source:` names the staged copy and `Issue:` names the fetched issue; on the local route the `Issue:` line is omitted (route exclusivity — no lookup of a published twin).

2. **Open questions.** Reproduce every `[blocking]` open-question from the report's `### Open questions` block verbatim, each with a `[Question]` prefix (Phase 3's gate consumes them). Emit every `[deferrable]` open-question instead as a drafter-directed constraint line — `Resolve in the plan (no user input needed): <question text>` — with no `[Question]` prefix, so Phase 3 does not surface it. This honours the pre-planner's `[deferrable]` semantics ("can be resolved during or after planning") and the drafter resolves such forks in-plan. `[Resolved]` questions are excluded from this section — they are constraints read from the report directly.
3. **Workload-split selector.** If the report's `### Workload split` body names more than one unconditional unit (plan / PR / phase), append a synthesised question. A conditional fallback unit — e.g. a spike-failure follow-on plan gated on an earlier unit's outcome — does not count toward the total:

   ```
   [Question] The pre-plan analysis names N workload units. Which to plan now?
   Options:
     1. <unit 1 title>
     2. <unit 2 title>
     ...
   ```

   Phase 3 promotes this to an `AskUserQuestion` with each unit as a labelled option. Mark unit 1 `(Recommended)` mechanically — there is no on-disk signal for "uncompleted units" and a `gh` lookup is out of scope. When `--skip-interview` is set, default to unit 1.

   **Pre-answered selector.** When the run's additional instructions already name a workload unit — by its split title or by the report's own unit identifier (e.g. `Plan 3a`, `Plan 2`, `unit 1`) — that naming *is* the selection: do not synthesise the selector question; emit the selection into the brief as a `[Resolved]` workload-unit selection line with an `Answer:` naming the unit (the same form Phase 3 produces when resolving the menu — `${CLAUDE_PLUGIN_ROOT}/agents/ace-plan-drafter.md` step 1 keys its unit scoping on that line), and proceed as if the selector had resolved to that unit. An explicit user choice is never re-asked as a menu. When the naming matches no unit in the split, or ambiguously matches more than one, it is not a selection: fall back to synthesising the selector question with the user's text quoted in it. Whenever the report names more than one unit and the selected unit is not the first — whether selected here or via the Phase 3 menu (Phase 3 applies this rule when recording such a menu answer) — append one instruction line to the drafter brief: `Earlier units of this report may already be implemented — verify the current tree state and do not re-specify landed work.` (A multi-plan report is written before any unit lands, so its description of earlier units' surfaces goes stale as they ship.)

**Zero-applicable case.** When the report carries no `[blocking]` open questions, no unresolved `[deferrable]` questions, and a single-unit workload split, items 2 and 3 emit nothing: the payload is the header block plus the single sentence `No interview selector applies — draft directly.`

**Failure modes** (defensive parsing — the transform must degrade gracefully):
- Missing `### Workload split` — skip the sceptic-veto pre-check (Phase 2.5) and the workload-split selector.
- Workload split is multi-unit but the list is unparseable — omit the selector question; the drafter reads the report's `### Workload split` body itself and judges by hand.
- Missing `## Enhanced brief` — the only essential section; if it is missing, report `Pre-planner report at <path> has no '## Enhanced brief' body — cannot transform` and stop.

## Phase 2.5 — Sceptic-veto pre-check (pre-planner report only)

Runs only when input was detected as a pre-planner report and the report has a parseable `### Workload split` section. Some reports explicitly recommend not producing a plan; this gate gives the user a chance to honour that recommendation rather than silently overriding it.

The firing condition is restated in the calling `ace-plan-start/SKILL.md` Phase 2.5 heading block so the gate survives a skimmed reference — an aligned copy; an amendment lands in both sites in one change.

Match the marker line first: the pre-planner skeleton ends `### Workload split` with a mandatory `Recommendation:` line. `Recommendation: no plan` fires the question below; `Recommendation: {N} plan(s)` passes the gate silently. Only when no `Recommendation:` line exists (a hand-written report) fall back to matching the split body against the regex `/warrants no plan|drop both|ship nothing|absorb into another brief|fold into brief|does not warrant a standalone plan/i`. If either match fires, run one `AskUserQuestion`:

```
The pre-plan analysis recommends not producing a plan
(quote: "<matched sentence>"). How would you like to proceed?
Options:
  1. (Recommended) Abort — surface the recommendation and exit cleanly
  2. Plan anyway — proceed with full /ace-plan-start
```

When `--skip-interview` is set, default to option 2 (the user opted out of prompts; defaulting to abort would surprise them).

Behaviour by option:
- **Option 1 (Abort)** — print the matched recommendation sentence and stop. **Halt immediately — do not fall through to Phase 3 or any later phase.**
- **Option 2 (Plan anyway)** — proceed to Phase 3.

The regex intentionally excludes the looser term `single small PR`. That phrase can occur in legitimate reports describing a valid single-PR plan, and the six alternatives above are sufficient to catch the canonical sceptic-veto and absorption sentences ("warrants no plan", "drop both", "absorb into another brief", "does not warrant a standalone plan", etc.) without false positives. A future report whose abort recommendation matches neither the `Recommendation:` line nor the regex proceeds to planning without the question — an accepted false negative: the recommendation is still in the report the user supplied, and the cost is a plan the user can discard.

This is the only pre-flight question justified outside Phase 3.

## Phase 3 write-back

Executed from `/ace-plan-start` Phase 3 for a synthesised line that originated as a `[blocking]` open question in a pre-planner report: **write the resolution back into the report file** — match the finding by the `Q{n}` identifier the open-question line carries, including its trailing space — the anchor is `Q{n} `, not the bare token, so `Q1 ` never prefix-matches `Q10` (the transform reproduces the line verbatim, so the identifier is the deterministic write-back anchor; when a line carries no `Q{n}` identifier — a report predating the identifier contract — match by the question text instead) and Edit the corresponding `### Question` finding in place — prepend `[Resolved]` to its description and append an `Answer: <resolution>` line — mirroring the Phase 8 validation-report write-back and the pre-planner's own interview mutation. The report's post-pre-planner immutability is deliberately given up here so the artefact never misreports an answered question. On the issue route the report file is the staged copy — apply the same `Q{n}`-anchored Edit there so the drafter reads the resolutions, and additionally post the resolutions to the issue as a single comment (`gh issue comment <n>`), one line per question in the form `Q{n} [Resolved] — Answer: <resolution>`: the published body is immutable, and without the comment the issue would permanently misreport an answered question as blocking-unresolved. One comment per run regardless of how many questions resolved; if the post fails, warn and continue — the staged-copy write-back already feeds the drafter.
