---
name: report-triage
description: "Reads one or more prior reports (local paths, GitHub issues, and/or pull-request review threads, the latter fetched via /ace:pr-read), collates and de-duplicates their findings, verifies each against HEAD, prints a prioritised action plan in the session, and proceeds directly into the apply pass; stops for user input only on relatively equal alternatives or blocking decisions."
argument-hint: "[<issue>|<pr>|<path> ...]"
disable-model-invocation: false
---

# Triage report findings and apply them

## Usage

- `/ace:report-triage` — derives the source from the conversation (a report path, issue, or PR reference mentioned earlier)
- `/ace:report-triage <issue>` — a GitHub issue by bare number (e.g. `123`) or full URL (e.g. `https://github.com/<owner>/<repo>/issues/123`)
- `/ace:report-triage <pr>` — a GitHub pull request by full URL (e.g. `https://github.com/<owner>/<repo>/pull/123`) or bare number (disambiguated from issues after fetching)
- `/ace:report-triage <path>` — a local report file (e.g. `reports/2026-review.md`)
- `/ace:report-triage <issue> <path> <pr>` — any mix of the above, in any order; all sources collate into a single triage

## Context

Reports are produced in one session and acted on in another: the producing session's context is gone, and the findings may be stale against the current code.

Triage output is printed to the conversation and saved nowhere else — no file, no issue. The apply pass consumes it directly, so a persisted artefact would be write-once read-once overhead.

A source report's own consumption or routing advice — a tip to route through another command, a pre-planner recommendation, a stated stopping rule — is advisory context, not a gate: the user's `/ace:report-triage` invocation is the controlling route choice. Honour the triage, and note the alternative route or process directive in the closing summary rather than stopping.

Run inline (no subagents). Stop for user input only when something genuinely blocks: relatively equal alternative paths, or a decision the code cannot answer.

## Task

### Phase 1 — Resolve sources

Classify each argument token — first match wins:

- Full GitHub URL containing `/pull/` -> pull request. This rule matches before the issue rule below: both are URLs, and the `/pull/` segment decides.
- Bare integer, or a full GitHub issue URL -> GitHub issue in the repository resolved from the current working directory. This rule matches before the path rule below: an issue URL contains path separators but is not a local path. GitHub issues and pull requests share one number space, so a bare integer is probed after fetching: when the returned `url` contains `/pull/`, reclassify the token as a pull request and refetch via the PR recipe — `gh issue view` succeeds on a PR number but silently omits inline review comments. A `gh` version that instead errors stating the number is a pull request reclassifies the same way, not via the cannot-be-fetched error path.
- Contains a path separator or ends in `.md` -> local file path
- Anything else -> report the unrecognised token and stop

With no arguments, derive the source from the most recent actionable user message in the conversation — a report path, an issue, or a PR number/URL mentioned earlier. If none can be found, report usage and stop.

Read each local file in full. Fetch each issue in a single call, including comments — comments may amend, resolve, or supersede findings in the body — and `url` for the bare-integer probe above:

```bash
gh issue view <issue> --json title,body,state,comments,url
```

Fetch each pull request by running `/ace:pr-read <pr>` (`${CLAUDE_PLUGIN_ROOT}/skills/pr-read/SKILL.md`) with comments on — never `--comments no`. The PR's findings are the union of its description and all three comment surfaces (conversation comments, inline review comments, review bodies): no single surface is the complete report, and any individual comment may carry a finding stated nowhere else. The substantive findings routinely sit in the inline review comments, which no issue-oriented fetch returns.

A single bad source fails the run — never silently triage the remainder. Bad sources: a path that does not exist or is empty; an issue that cannot be fetched or whose body is empty or whitespace-only; a pull request that cannot be fetched, or whose description and comment surfaces are all empty; a source from which no findings can be extracted (name the source and say why).

### Phase 2 — Extract and collate

Accept any report shape — code review, architectural review, pre-plan analysis, evaluation report. Scopes and altitudes differ and there is no fixed findings schema: locate and extract the findings list from whatever layout each report uses.

With multiple sources, collate into one triage: de-duplicate findings that describe the same defect across reports, and record every merge in a dedupe register (which source items merged, and why they are the same finding). Findings may duplicate within a single source as well as across sources — a pull request often carries the same finding once in a review summary comment and again as an inline review comment; merge and register those the same way. The converse also holds: a finding present in only one surface — a lone inline comment, a point made only in the summary or the description — is still a finding, so extract from every surface before de-duplicating; duplication is common, never guaranteed.

Pull requests are the only source type whose findings can arrive with paired responses: an inline review comment may carry threaded replies (paired via `in_reply_to_id`, which `/ace:pr-read` surfaces), and a summary comment may mark items resolved. Responses posted by `/ace:pr-response` carry a literal marker vocabulary — `[x]` (resolved) / `[i]` (not resolved) — so a `[x]`-prefixed reply or summary item is a mechanical resolution claim. Pair each PR finding with its responses during extraction — a response claiming the fix is not a separate finding; it feeds the already-resolved check in Phase 3.

### Phase 3 — Verify against HEAD

The report predates this session; the code may have moved. For every finding:

- Confirm the cited file and line anchors still resolve at HEAD. Findings the code has already fixed or obsoleted take the already-resolved disposition — list them in the triage under that disposition, but exclude them from the ordered work items. For a PR finding whose paired response claims the fix, verify the claim rather than trusting it — confirm the cited commit exists and the change is present at HEAD; a reply is evidence for already-resolved, not proof.
- Check the recommendation against the surrounding contracts, not only the cited evidence. A recommendation can be correct for the lines it cites yet over-reach onto neighbouring rules the report never mentions — ask "what does this change imply for the rules around it?" before accepting.
- Treat "safe to apply" framing with scepticism. Safe describes intent, not wording ready to paste; verify the proposed wording fits the target before adopting it verbatim.
- Assess severity, effort, and a disposition: apply now, elective, defer (with the revisit trigger), reject (with the reason), or already resolved.
- A finding that names a gap without prescribing the remedy requires design, not mechanical application: apply it minimally and mark it applied-with-design-note in the Phase 5 summary — disclosing the semantics the apply pass invented — or defer it when the design is more than minimal or the source offers a design route.
- **Elective** covers a finding that is real but optional — the source itself marks it as requiring no action, or the governing rule is already technically satisfied. Apply an elective only when the fix is cheap, and flag it as elective in the Phase 5 summary so the user can revert it freely. When the source report itself carries a systemic finding that applying electives would feed (monotonic growth, churn, duplication), name that interaction in the Phase 5 summary alongside the elective flag.

Classify each open question the reports carry, per the vocabulary in `${CLAUDE_PLUGIN_ROOT}/skills/plan-route/SKILL.md`:

- **Answerable from code** -> resolve by inspection and record the resolution in the triage
- **Deferrable** -> note it as deferred; it does not block
- **Load-bearing** (a different answer changes the plan or the route) -> surface it via the `AskUserQuestion` tool before printing the triage results

### Phase 4 — Print the triage

Print an executable work order to the conversation:

- An ordered item list (by priority and dependency), each item naming its owner file(s) and line anchors verified at HEAD
- Shared-surface items merged: one item naming every owner file beats several one-sided items
- The dedupe register, when any findings were merged — across sources or within one
- Per item, a flag when the fix requires restructuring or reordering a procedure rather than a local edit — do not compress that nuance away
- For items that add a marker or state to an existing state machine: enumerate the state-listing sites to update, or append an explicit "after applying, grep the state vocabulary and update every enumeration" instruction
- A closing verification line naming the mechanical checks for the apply pass — stale-phrase greps, cross-file marker counts, fence parity, build/test commands as applicable. Derive these from the triage content itself; never assume a toolchain.

Close with a route decision — the gate between triage and apply:

- **Stop and ask** only when relatively equal alternative paths exist, or a blocking decision needs user input that Phase 3's load-bearing questions did not already resolve. Test whether alternatives are relatively equal against the local-vs-structural cost rubric in `${CLAUDE_PLUGIN_ROOT}/rules/principles.md`: alternatives whose costs sit an order of magnitude apart, or one of which breaks a documented contract, are not equal — resolve them from code and proceed. When genuinely equal, present the options per `${CLAUDE_PLUGIN_ROOT}/rules/principles.md` ("Presenting design options", which governs in full) and end the turn. The apply pass then runs on the user's "fix" / "apply" or option choice.
- **Otherwise proceed**: when one route is clearly best and nothing blocks, state the recommendation and continue directly into Phase 5 in the same turn, without asking.

When the route decision is proceed, the printed triage may be condensed to the ordered item list, the dedupe register, and the verification line — full per-item dispositions then appear once, in the Phase 5 closing summary, which is the message the user reads. Print the full dispositions in the triage only when stopping to ask, since the summary that would otherwise carry them does not run until after the user answers.

### Phase 5 — Apply pass

Consume the triage output directly:

- Batch edits per owner file — open each file once — rather than walking per-priority order. Cross-item dependencies the triage flagged must still be honoured across batches.
- Bulk identical replacements across many owner files may use one scripted substitution (`sed`/`perl`) with a post-hoc occurrence-count check, instead of per-file edits. When one target string contains another as a prefix or substring, order the substitutions superset-first so the shorter pattern cannot corrupt the longer sites.
- Edits that insert between paragraphs, or into ordered first-match-wins lists, must anchor across both neighbours and state the match precedence in the inserted text — position alone does not carry the semantics.
- Immediately after the last edit, run the mechanical sweep the triage's verification line named — not as a later user-prompted pass.
- Then re-read each edited file and check every new rule against its neighbours: ordering rules, vocabulary contracts, cross-references. This re-read is unconditional — edits that look correct in isolation can break the surrounding contract. Read each edited file in full by default; an anchored-region re-read (each edit plus its surrounding section) is sufficient only when every edit in that file is a single-line or single-clause substitution and the mechanical sweep passed.
- Leave the changelist uncommitted for user review; never commit or push unless the user instructs it.

Close with a summary: per-item outcome (applied / applied as elective / applied with design note / deferred / rejected / already resolved), the files that carry elective edits (named per file, so selective revert is mechanical), the verification results, and any item that deviated from its triage entry at apply time. When a triaged source was a pull request, add a next-step tip: once the applied fixes are pushed to the PR head branch, `/ace:pr-response <pr>` posts the review replies.

## Error handling

- Any source-resolution failure defined in Phase 1 (an unrecognised token, no resolvable source, or a bad source) -> stop with the reason given there
- If there are permission issues with GitHub, report them
