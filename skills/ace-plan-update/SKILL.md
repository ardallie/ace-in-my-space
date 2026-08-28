---
name: ace-plan-update
description: Replaces a GitHub issue's body with revised plan content from the conversation; --from-report <path> delegates revision to the ace-plan-revisor subagent directly from the saved report, skipping the interview. Use when a published plan needs revising -- typically after /ace-plan-validate surfaces gaps or inaccuracies. Do not use to record session progress (that is /ace-plan-handoff), to publish a new plan (/ace-plan-start), or against a pre-plan analysis report, which it rejects.
argument-hint: "[<issue>] [--from-report <report-path>]"
disable-model-invocation: false
---

# Update a GitHub issue with revised plan

## Usage

- `/ace-plan-update` — Uses the issue number from conversation context
- `/ace-plan-update <issue>` — Updates the specified issue (e.g., `85`)
- `/ace-plan-update <issue> --from-report <report-path>` — Applies a saved validation report to the issue via the `ace-plan-revisor` subagent (no manual synthesis, no new interview). The flag may appear before or after the issue number — the Phase 1 pre-pass strips it wherever it sits.

## Context

Use this after `/ace-plan-validate` when validation reveals significant gaps or inaccuracies that require plan revision. The GitHub issue remains the single source of truth — this skill pushes conversation refinements (or, with `--from-report`, a saved validation report) back to the issue.

## Task

### Phase 1 — Parse arguments

Pre-pass: strip the `--from-report <path>` flag and its value. The remaining tokens are the issue number (or nothing, if the issue must be resolved from conversation context).

Identify the issue number from the remaining argument or search the conversation for a GitHub issue URL or number, taking the most recent when the conversation carries more than one. If not found, report this and stop. Aligned copy of the issue-number-resolution rule canonical at `/ace-plan-read` step 1, which enumerates the full copy set; amend every site together.

If `--from-report <path>` was set, branch to **Phase 2A**. Otherwise branch to **Phase 2B**.

### Phase 2A — Apply a validation report (`--from-report` branch)

1. **Reject pre-planner reports.** If the file matches the pre-planner two-rule detection in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/pre-planner-detection.md` — read it now; it carries both arms and their precedence — stop with: `<path> is a pre-plan analysis, not a validation report. Run /ace-plan-start <path> to generate a plan from it.` The per-bullet `## Findings` parser below would otherwise map the report's analysis findings to `applied` and fold them into the issue body as revisions.

   Read the report file at `<path>`. Trim the content and check its length; if empty, stop with the same empty-body message used in `/ace-plan-read`.

2. Stage the current issue body to an intermediate file under `.ace/plans/`. Compute the intermediate-file path as follows:
   - **Report filename matches `{yyyyMMdd}-{HHmm}-val-v{m}-{slug}-{8hex}.md`** — extract `{slug}` and `{8hex}`. Use `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v{m-1}-{slug}-{8hex}-staged.md`, where `{yyyyMMdd}-{HHmm}` is the report filename's own timestamp prefix, reused verbatim. This mirrors the prior plan revision that the report validated against (when the report is `val-v1`, `{m-1}` is `0`), with a `-staged` suffix so the path cannot collide with the local draft — when the report shares the plan's timestamp prefix, the unsuffixed path **is** the existing draft, and redirecting onto it would destroy it.
   - **Report filename does not match the convention** — generate a fresh 8-hex per the snippet in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` (test output non-emptiness, not exit status). Fetch the issue title so the slug can be derived from it: `TITLE=$(gh issue view <issue> --json title --jq .title)`. Derive `{slug}` from `$TITLE` per the issue-title slug rule in the same file (single-sourced there; this skill's Phase 2B step 3 executes this branch by reference). Use `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v0-{slug}-{8hex}-staged.md`, where `{yyyyMMdd}-{HHmm}` is current local time (`date +%Y%m%d`, `date +%H%M`), computed once and reused by step 4. Phase 2B step 3, which executes this branch by reference, already holds the title from its own step 1 fetch and skips this fetch.

   Before the redirect, refuse to overwrite an existing file: if `[ -e <intermediate-file path> ]` succeeds, append `-2`, `-3`, ... to the `-staged` suffix until a free name is found. This is an aligned copy of the collision-increment idiom canonical at `/ace-plan-start` Phase 4; the increment target here is the `-staged` suffix, deliberately unaligned with that site's slug.

   Write the body directly via Bash redirection — the `ace-plan-revisor` subagent reads files, not raw strings:
   ```bash
   gh issue view <issue> --json body --jq .body > <intermediate-file path>
   ```

   On Windows MINGW64, `<intermediate-file path>` must be in POSIX form (`/c/...`) per `${CLAUDE_PLUGIN_ROOT}/rules/environment.md`.

3. Run two cross-checks against the staged body, then parse the findings.

   - **Linkage check.** The report's `Plan:` line (under its H1; mandatory — the `ace-plan-validate` subagent writes it, and hand-written reports must include it) names the plan file the report validated. Extract the `{slug}-{8hex}` id from that path and compare it with the id in the staged body's audit-footer `Validation report:` path. On a mismatch, stop: the report does not belong to this issue's plan, and folding it would silently rewrite the issue body with unrelated findings. If the report has no `Plan:` line, stop and ask for it to be added; if the staged body has no audit footer, emit a one-line warning that the check could not run and continue.
   - **Already-folded guard.** If the staged body's audit-footer `Validation report:` path equals the `--from-report` path (compare repo-relative forms), the report has already been folded into this issue (e.g. by the chained `/ace-plan-start` run that published it); stop and report this rather than re-folding it into a needless revision.

   Parse the report's findings using the per-bullet rule from `${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-start/SKILL.md` Phase 8. Map each finding's inline marker directly to a revisor state, with no new interview: `[Resolved]` -> resolved-by-interview, `[Question]` -> unresolved, `[Advisory]` -> advisory, unprefixed -> applied. Aligned copy of the marker-to-state map canonical at `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/resolution-markers.md`; amend both together. The map is embedded rather than loaded because this step is unconditional on the `--from-report` path — every run would otherwise pay a file read for four lines.

4. Compute the target output path: `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v{n}-{slug}-{8hex}.md` where `{n}` is the plan revision number after this update (typically `{m}` when the input report is `val-v{m}`). The `{yyyyMMdd}-{HHmm}` prefix reuses the same timestamp as the step-2 staged path (the report's own prefix in the convention branch; the fresh step-2 timestamp otherwise). If the target exists, increment `{n}` until a free path is found, mirroring `${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-start/SKILL.md` Phase 9. (A collision-incremented `plan-v{n}` may then pair with a lower `val-v{m}`; the footer's `Validation report:` path remains the authoritative linkage.)

5. Pre-seed the v1 file at the target output path by executing the canonical pre-seed block from `${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-start/SKILL.md` Phase 9 ("Pre-seed v1") — read that three-step block from the file and run it unchanged (copy, strip any existing `## Validation audit` block, append the audit footer); it is the single definition of the footer structure `/ace-plan-implement` step 2 parses. This run's inputs: copy source = the intermediate draft path, target = the target output path, footer report path = the repo-relative `--from-report` path, timestamp = `date -Iseconds`, unresolved count = the number of `[Question]` findings. The strip is load-bearing on this path: the staged issue body already carries the footer `/ace-plan-start` Phase 10 published, and without it each round trip accretes a duplicate.

6. Conditional revisor spawn: execute the conditional-revisor-spawn block from `${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-start/SKILL.md` Phase 9 by reference — read it from that file, from its bold lead-in through the post-spawn-checks paragraph it names as its own extent, and run it unchanged with this run's inputs (the target output path, the report path, the mapped findings) and two deltas: this branch's state set excludes `resolved-from-context` (no autonomous resolution occurs here), and flow control stays here — on the skip path continue to step 7, and ignore the block's Phase 10 hand-off and output-banner sentence. Its skip rule, spawn parameters, result-block parse, `applied_count` comparison, and mismatch warning all apply as written. The block's `model: {Tier-3}` prescription is a tier reference: resolve it per the consumer contract in `${CLAUDE_PLUGIN_ROOT}/skills/ace-detect-harness/SKILL.md`, against the `Harness:` block already in context, invoking `/ace-detect-harness` first if none is present; where the ace-detect-harness package is absent, resolve the tier against the harness's own model catalogue.

7. Update the issue from the v1 file. Run the size pre-flight first — the same guard as the `/ace-report-publish` pipeline (bytes as a conservative proxy for GitHub's character limit); without it a v1 body grown past the limit by folded findings fails at the edit, after the revisor spawn:
   ```bash
   BYTES=$(wc -c < <v1_path>)
   if [ "$BYTES" -gt 65536 ]; then
     echo "File <v1_path> is $BYTES bytes — over GitHub's 65,536-character issue-body limit. Trim or split before updating." >&2
     exit 1
   fi
   gh issue edit <issue> --body-file <v1_path>
   ```

   Then persist the linkage, mirroring the `/ace-report-publish` pipeline's linkage-persistence convention (this skill publishes via `gh issue edit`, outside that pipeline, so it appends for itself): append `- Issue: <issue URL>` as a final bullet to the v1 file's audit footer (`echo "- Issue: <url>" >> <v1_path>`, POSIX path form) — without this, nothing on disk records which issue the revision was published to. The published issue body predates the append and lacks this one bullet; the divergence is accepted.

8. Confirm the update with the issue URL.

### Phase 2B — Manual synthesis (no flag)

1. Fetch the current issue:
   ```bash
   gh issue view <issue> --json title,body
   ```

2. Synthesise the revised plan from the conversation's validation feedback and revision decisions, preserving unchanged sections of the original structure.

3. Stage the revised body to a file: derive `{slug}` from the issue title and generate a fresh 8-hex by executing Phase 2A step 2's non-convention branch by reference — its slug rule and hex snippet resolve to the single-sourced copies in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` — and Write the revised plan to `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v0-{slug}-{8hex}-staged.md` (current local time). Refuse to overwrite an existing file: append `-2`, `-3`, ... to the `-staged` suffix until a free name is found, as in Phase 2A step 2.

   When the revised body preserves a `## Validation audit` footer, append a `- Manually revised on: <ISO 8601 timestamp from `date -Iseconds`>` bullet to that footer in the staged file. The footer's `Validation report:`/`Validated on:` bullets vouch for the prior revision, not the manual synthesis; this bullet truthfully scopes what the report validated.

4. Present the revised plan to the user for approval before updating — show the staged file's content (or a diff against the fetched body). The staged file, not conversation memory, is what will be published.

5. Once approved, update the issue from the staged file. Run the size pre-flight first by reference — execute the Phase 2A step 7 guard unchanged with `<staged path>` as the file — then update:
   ```bash
   gh issue edit <issue> --body-file <staged path>
   ```

   On Windows MINGW64, `<staged path>` must be in POSIX form (`/c/...`) per `${CLAUDE_PLUGIN_ROOT}/rules/environment.md`. Using `--body-file` avoids re-emitting the plan through an inline heredoc — the content is already on disk, so publishing from the file halves the model emission.

   This states a different rule from the pack-wide `--body-file` warrant canonical at `${CLAUDE_PLUGIN_ROOT}/skills/ace-pr-create/SKILL.md` step 6 (shell-quoting hazards in generated prose): here the content is already on disk, not a quoting-hazard avoidance — a later sync pass must not fold this note into that alignment set.

   Then persist the linkage: when the staged body ends with a `## Validation audit` footer, append `- Issue: <issue URL>` as that footer's final bullet (`echo "- Issue: <url>" >> <staged path>`, POSIX path form); when the synthesis produced no footer, append a `## Publication` block instead (blank line, H2, blank line, `- Issue: <url>` bullet) — mirroring Phase 2A step 7 and the `/ace-report-publish` pipeline's linkage-persistence convention for footerless artefacts.

6. Confirm the update with the issue URL.

## Requirements

- **Phase 2A** (`--from-report`): no user approval gate — findings already carry their resolution state (set during the prior `/ace-plan-validate` interview or left unresolved).
- **Phase 2B** (manual): requires user approval before updating — always show the diff or full revised content first.
- Do not change the issue title unless explicitly discussed.

## Error handling

- If issue number cannot be determined, report this clearly and stop
- If the report file is a pre-plan analysis (Phase 2A step 1's pre-planner-rejection check), report and stop with the `/ace-plan-start` redirect message
- If `--from-report` is set but the report file does not exist or is empty, report and stop
- If the report's `Plan:` line is missing, or its `{slug}-{8hex}` id mismatches the staged body's audit footer (Phase 2A step 3 linkage check), report and stop
- If the staged body's audit footer already names the supplied report (Phase 2A step 3 already-folded guard), report and stop
- If the revisor subagent fails or the v1 file does not exist after it returns, report and stop (the intermediate draft and the report are preserved on disk)
- If the body file exceeds GitHub's 65,536-character issue-body limit (the byte pre-flight in Phase 2A step 7 / Phase 2B step 5), report the byte count and stop before `gh issue edit` — the file is intact on disk and re-runnable once trimmed or split; rationale in `/ace-report-publish`'s error handling, whose pipeline is this guard's canonical copy
- If no revisions were discussed in the conversation (Phase 2B), report this and stop
- If issue does not exist, report the error
- If there are permission issues, report them
