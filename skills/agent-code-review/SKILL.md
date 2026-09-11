---
name: agent-code-review
description: Runs a multi-agent pre-PR code review (two or three specialists plus a sceptic) over the current branch, a PR, a remote or local branch, a commit, or a directory. Produces a severity-graded findings report (Critical/High/Moderate/Minor) consumed via /ace:report-triage. Use for non-trivial changes before opening a PR -- not for trivial fixes, and not for architectural review, which is /ace:agent-arch-review. Advisory only -- does not implement changes.
argument-hint: "[--model <name or instruction>] [--prior <report-path>] [--reviewers 2|3] [--checks full|cheap|skip] [--publish yes|no] [pr <number|URL>|origin/<branch>|branch <name>|commit <sha>|directory <path>]"
disable-model-invocation: false
---
# Run a pre-PR agent code review

## Usage

- `/ace:agent-code-review` — current branch vs default branch
- `/ace:agent-code-review pr <number|URL>` — PR by number (current repo) or full URL
- `/ace:agent-code-review origin/<branch>` — remote branch vs default branch
- `/ace:agent-code-review branch <name>` — local branch vs default branch
- `/ace:agent-code-review commit <sha>` — single commit diff (SHA must be at least 7 characters)
- `/ace:agent-code-review directory <path>` — all files in the specified directory
- `/ace:agent-code-review [--model <name or instruction>] [--prior <report-path>] [--reviewers 2|3] [--checks full|cheap|skip] [--publish yes|no] <scope ...>` — flags first (in any order), positional second
- `--model` directs model selection for every reviewer — a model name or a prose instruction (a tier, a mix, a reference), resolved against the models the harness offers. Omit `--model` to use the default assignment: the sceptic on Tier-2, the specialists on Tier-3.
- `--prior P` — path to a previous code-review report for the same source; reviewers verify its findings against the current state (re-review). Prior reports are pushed only when passed explicitly — there is no auto-detection. The prior report also carries forward interview decisions (its Clarifications section) — pass it for any repeat review of the same scope, not only to verify remediation.
- `--reviewers N` — specialist count, `2` or `3` (default `3`); the sceptic is always spawned in addition, so the team is N+1. Intended for re-reviews and small scopes; keep the default for first reviews.
- `--checks full|cheap|skip` — how much of the Phase 3 shared verification battery runs before reviewers spawn; tier definitions in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/verification-checks.md`. Default `cheap` — the typical review runs the cheap battery, so its verdict speaks only for the gates that tier ran (Phase 5 binds the verdict line to the tier). Reach for `full` when the reviewed state has not been through CI, when the diff touches generated output or build configuration, or when the merge decision will rest on this review's verdict alone. `full` (the whole CI gate set) and `skip` (no shared battery; the report and the material pushed to reviewers record that) are per-run opt-ins.
- `--publish yes|no` — publish the saved report as a GitHub issue (Phase 8, after the final save). Default `no`, diverging from the `yes` default of `/ace:agent-arch-review` and `/ace:agent-pre-planner`: those produce durable artefacts meant to be tracked and acted on across sessions, whereas a code review is a pre-PR advisory gate usually consumed in the session that ran it. Publish on demand when a review does warrant tracking.
- Text after the scope parameters is passed as additional instructions

## Shared conventions

This skill consumes the suite's shared convention files under `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/`; each phase names the file it applies. Read a shared file at the phase that first applies it:

- `input-conventions.md` — flag pre-pass and residual-token warnings only (Phase 1); the positional scope grammar below is local, so the shared positional-parsing rules do not apply
- `verification-checks.md` — the `--checks` flag grammar, the shared-battery tier definitions, and the record grammar for what ran (Phase 3; the Usage and Phase 1 flag bullets restate the grammar)
- `team-mechanics.md` — run suffix, spawning, package handoff, collect, sceptic re-spawn (Phases 3-4); the pre-spawn capture and tree-hygiene check are deliberately not consumed (divergence stated in Phase 4)
- `report-conventions.md` — standard header fields, save procedure, publish phase (Phases 5-8)
- `interview.md` — the canonical interview procedure (Phase 7)

The shared `analysis-conventions.md` is not consumed: this skill's reviewer instructions and severity-graded consolidation are its own.

## Context

Use before creating a pull request, or to review any branch, commit, PR, or directory.
The `directory` source pushes full file contents to all reviewers, so its cost scales with the directory size rather than a change set — scope directories narrowly.

## Task

Eight phases executed in order.

### Phase 1 — Resolve scope

Pre-pass: strip leading `--model {value}`, `--prior {path}`, `--reviewers {value}`, `--checks {value}`, and `--publish {value}` flags per the flag pre-pass in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/input-conventions.md` — read that file now; it carries the `--model` grammar, the `--publish` grammar, and the residual-token warnings applied after parsing.

Local deltas on the shared conventions:

- If no model guidance is supplied (via `--model` or the additional instructions), Phase 3 assigns models. Supplied guidance is honoured as a Phase 3 per-reviewer assignment and recorded alongside the reviewer list.
- `--prior` value is a path to a previous code-review report. If the value is missing or does not resolve to a readable file, report the error and stop. Read the file — it is pushed to reviewers in Phase 3.
- `--reviewers` value, when supplied, sets the specialist count; accepted values `2` and `3`. If parsing fails (missing value or any other value), report the valid values and stop. If omitted, Phase 3 spawns three specialists.
- `--checks` value, when supplied, selects the shared-verification tier defined in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/verification-checks.md`; accepted values `full`, `cheap`, and `skip`. If parsing fails (missing value or any other value), report the valid values and stop. If omitted, `cheap`. Drives Phase 3.
- `--publish` defaults to `no`. Drives Phase 8.

Parse the first remaining parameter to determine the review source. Evaluate rules in the order listed; first match wins.

- **Empty** — current branch; `git diff <default>...HEAD`
- **`pr`** — second token is either a PR number or a full URL. If numeric, fetch with `gh pr diff <number>`. If URL, extract owner, repo, and number via regex `https://github.com/([^/]+)/([^/]+)/pull/(\d+)` and fetch with `gh pr diff <number> --repo <owner>/<repo>`.
- **Starts with `origin/`** — treat as remote ref; run `git fetch origin` then `git diff <default>...<value>`
- **`branch`** — second token is the local branch name; `git diff <default>...<branch>`
- **`commit`** — second token is the SHA. If it is shorter than 7 characters, report the expected format and stop. Fetch with `git show <sha>`.
- **`directory`** — second token is the directory path; read all files in that directory recursively
- **Other string** — use `AskUserQuestion` to clarify the intended scope. Present the input value and suggest the available keyword forms (`pr`, `branch`, `commit`, `directory`, `origin/`). The user's response may be one or more tokens; together they replace the original first token only and are re-parsed through the rules above; all subsequent original tokens remain additional instructions. If the response still matches no rule, report the unrecognised scope and stop — do not ask again.

Keyword sources (`pr`, `branch`, `commit`, `directory`) consume two tokens; remaining tokens are additional instructions.
All other sources consume one token or none; remaining tokens are additional instructions.

`pr`, `branch`, `commit`, and `directory` are reserved — to review a branch named "commit", use `branch commit`.

After parsing, apply the shared residual-token warnings to the remaining tokens.

**Default branch** — resolve lazily, only for the source classes that diff against it (empty, `origin/`, `branch`). Try git first; empty output, not exit status, is the failure signal — the `sed` stage exits 0 even when `git symbolic-ref` fails. If git produces empty output, fall back to `gh`; if both produce empty output, fall back to a local `main`/`master` branch — accepted only when exactly one of the two exists; if all three fallbacks produce nothing, report the error and stop:

```bash
db=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
[ -n "$db" ] || db=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null)
[ -n "$db" ] || { locals=$(git for-each-ref --format='%(refname:short)' refs/heads/main refs/heads/master); [ "$(printf '%s\n' "$locals" | grep -c .)" -eq 1 ] && db=$locals; }
[ -n "$db" ] || { echo "default-branch resolution failed" >&2; exit 1; }
```

The `pr`, `commit`, and `directory` sources never use the default branch; they must work without a remote or `gh` auth (except `pr`, which requires `gh`).

**Pin the reviewed state** — record the SHAs the `Reviewed state:` line in Phase 5 requires:

- Head SHA: `git rev-parse` on the resolved ref (for `pr`, `gh pr view <number> --json headRefOid`, with `--repo <owner>/<repo>` when the PR was given as a URL; for `commit`, `git rev-parse` on the given SHA — normalising to the full OID doubles as an existence check; for `directory`, `git rev-parse HEAD`).
- Base SHA: for `pr`, `gh pr view <number> --json baseRefOid`, with `--repo <owner>/<repo>` when the PR was given as a URL — a PR's base is its target branch, not necessarily the default; for the other diff sources, `git merge-base <default> <ref>` — the three-dot diff is taken from the merge-base, so pinning the default-branch tip would not reproduce the reviewed diff once the default branch advances. Omit for `commit` and `directory`.
- For a `directory` source, additionally check `git status --porcelain -- <path>`; if non-empty, record an "uncommitted working tree" marker with a timestamp alongside the HEAD SHA.

Use the resolved ref for all git commands in subsequent phases (e.g., `origin/feature-branch` for remote branches).

### Phase 2 — Collect metadata

Apply a combined line budget of **30,000 lines** across all pushed source material. The budget covers everything assembled into the reviewer package: the diff, the commit log, and full file contents. The prior report (when `--prior` was supplied), the shared verification results, and the additional instructions are pushed in addition to the package and do not count against the budget.

**`commit` source** — all diff and file data comes from `git show <sha>`. Count the output lines via `wc -l`. If the total exceeds 30,000 lines, trigger the budget warning. Skip the branch-based commands below.

**`directory` source** — gather all text files in the specified directory (skip binaries). There is no diff — pass the full contents of each file to reviewers. If the directory does not exist or contains no reviewable text files, report the error and stop. Count total lines across all gathered files. If the total exceeds 30,000 lines, trigger the budget warning. Skip the branch-based commands below.

**All other sources** — gather:

- Changed file list: `git diff <default>...<branch> --name-only` (or `gh pr diff <number> --name-only` for PRs)
- Commit messages: `git log -10 <default>..<branch>` (or `gh pr view <number> --json commits` for PRs)

If the diff is empty, report "No changes detected" and stop.

Count diff lines via `wc -l` on the diff output. If the diff alone exceeds 30,000 lines, trigger the budget warning immediately.

If the diff fits within budget, compute the file-line total mechanically at the pinned head — the working tree is generally not at the reviewed state: sum `git show <head SHA>:<path> | wc -l` over each changed file from the `--name-only` list (skip deleted and binary files). Then:

- If diff lines + commit-log lines + file lines ≤ 30,000, read all changed files in full at the pinned head (`git show <head SHA>:<path>`), never from the working tree. Otherwise trigger the budget warning.
- On Windows MINGW64 the `rev:path` argument form is rewritten by MSYS — disable the conversion for that call with `MSYS_NO_PATHCONV=1 git show <sha>:<path>` wherever this command uses `git show <sha>:<path>`.
- For the `pr` source, fetch the head first (`git fetch origin pull/<number>/head`); when the head is not fetchable (e.g. a cross-repo PR), fall back to diff only and note for reviewers that full file context was not included.

**Package order** — the reviewer package is assembled in a fixed order: the diff first, then the commit log, then full files in `--name-only` order. For the `directory` source the package is the gathered files in sorted repo-relative path order; for the `commit` source it is the `git show <sha>` output alone.

**Budget warning** — when any count above exceeds the budget, apply `references/budget-overflow.md`; read it only at that point. It carries the truncation rule, the `AskUserQuestion` options and their per-source availability, the source-specific narrowing advice, and the handling of each outcome.

Record the line counts (diff, commit log, files) and which budget outcome applied (full files, full files (over budget; user-approved), diff only, or truncated) — the report's `Materials:` line in Phase 5 carries them.

### Phase 3 — Spawn reviewers

Generate the run's hex suffix for the report filename per `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/team-mechanics.md` (run suffix). Name each reviewer `review-{specialisation-slug}-{suffix}` (e.g. `review-api-contracts-a3f9b2c1`, `review-sceptic-a3f9b2c1`) and use these names in the report's `## Reviewers` list. Spawn the reviewers — the specialists (three, or the `--reviewers` count) plus the sceptic — in a single message per the shared spawning rule. When model guidance was supplied (Phase 1), honour it per reviewer. Otherwise the sceptic runs on Tier-2 — its premise-challenging judgement is where the heavier tier pays off — and the specialists run on Tier-3.

**Skill-package scope** — when any file in scope sits under `.claude/skills/**`, `.claude/agents/**`, `.claude/commands/**`, `.claude/rules/**`, or `scripts/**`, or is a path enumerated in an H2 list under the `# Skill packages` section of `.docs/workflows/commands.md`, or is that registry file itself, read `references/skill-package-review.md` now and pass its path to every reviewer in the package handoff — it carries the invariant checklist, severity re-anchoring, and specialisation axes for that scope class. This condition is an aligned copy of the one that module's own load-condition paragraph states; the two are edited together. Resolve this before the shared verification below: the module names the mechanical checker that qualifies as this scope class's gate, so the battery cannot be resolved without it.

**Shared verification** — before spawning, apply the selected `--checks` tier once, per the tier definitions in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/verification-checks.md` — read that file now. Local bindings:

- **Path filters** (`full` tier) — evaluate each CI definition's path-scoping rules (GitHub Actions `paths`/`paths-ignore`, or the equivalent) against the reviewed diff — for a `directory` source, against the gathered file set, which has no diff; a gate whose filters exclude the entire scope is out of scope — record it as "no CI gate covers this diff" rather than running it against unchanged code. This composes with the no-compile-surface fallback rather than competing with it, per `verification-checks.md` (`Path filters compose with this fallback`): record the out-of-scope gates *and* run the scope's own executable surfaces.
- **Run at the reviewed state** — when the working tree is not at the pinned head, run the battery in a temporary worktree or detached checkout at the head SHA, with mandatory cleanup.
- **Record and proceed** — summarise the results and record the tier and a one-line summary of the executed commands on the report's `Materials:` line in the shared record grammar (`verification-checks.md`, Degradation), so a reader can see what was and was not run; where the run executed no gates — `skip` by flag, or a tier that resolved to an empty gate set — record the mode in place of a command list, per the shared degradation rules. A failing gate does not stop the review: proceed and push the failure to reviewers as an established fact, and expect it back as a finding — a broken gate at the reviewed state is typically Critical under `full`, where the gate set is CI-enumerated; under `cheap` the battery is not CI-enumerated, so classify a failing gate against the Phase 5 severity boundaries rather than assuming the CI-gate prior. That established-fact rule covers only gates actually run; where no gate ran, the material pushed to reviewers states that no shared battery ran.

**Package handoff** — per the shared handoff rule in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/team-mechanics.md`, passing the package path to each reviewer together with the pinned head SHA.

Each reviewer receives the package (diff or file contents, file list, commit context where applicable), the shared verification results, the prior report when `--prior` was supplied, and any additional instructions.

The specialists receive specialisations chosen by the system based on the code under review. The additional reviewer is the **sceptic** — it challenges assumptions, questions necessity, identifies what the other reviewers missed, and suggests simpler alternatives.

Reviewer instructions, pushed to every reviewer:

- **Beyond the pushed package** — reviewers may read repository files beyond the package to verify claims and gather context, capped at 40 files per reviewer — 80 where the skill-package scope condition above loaded `references/skill-package-review.md`, since the citation graph rather than the diff is the subject there. Note in the findings when the cap is reached.
- **Execution probes** — reviewers may run execution probes (the project's compile or typecheck command, test runs, scripts, generators) provided the probe leaves no residual working-tree diff — `git status` clean afterwards. Any probe that mutates a tracked file — including a same-state mutation test or regenerating a committed artefact — runs in a temporary worktree or detached checkout, never in the shared working tree: reviewers run concurrently against one checkout, so an in-place mutation is a race with sibling reviewers by construction. Cross-state probes use the same vehicle. Cleanup is mandatory in every case. Probe only the claims your own findings or approvals rest on — the shared verification results are already pushed with the package; do not re-run gates the shared battery already ran. Every probe relied on must be named in the finding or approval that rests on it.
- **Boundary-input probing** — when the diff introduces or modifies validation, parsing, or input-handling logic, probe it with hostile and boundary inputs (overflow-scale literals, empty and end-of-file placements, malformed forms), not only realistic fixtures.
- **Squashed-commit seams** — when the scope is a squashed commit collapsing several separately planned units, the highest-value defects often sit at the seams between units that were each validated only against their own gate; review those seams explicitly.
- **Probe versus inspection** — claims of the form "X compiles", "the fix suffices for all call sites", or "Y reproduces" must name their verification method: only an executed probe makes such a claim a fact — a claim verified only by inspection is an assessment and must be labelled as one.
- **Fix suggestions are illustrative** — a suggested fix containing shell syntax or other environment-dependent commands must be marked illustrative, stating the assumptions it depends on (platform, tool versions).
- **Prior report** (when `--prior` was supplied) — verify each prior finding against the current state and classify it: remediated, still open, or superseded. The parent consolidates the reviewers' classifications in Phase 5.

Each reviewer returns its findings as its final message, with severity (Critical/High/Moderate/Minor), file and line reference, description, and suggested fix. They must also explicitly note areas they reviewed and found correct, stating what they checked and why it needs no changes. Prefix findings that require user input with `[Question]` within their severity group. These drive the interview phase.

Tag as `[Question]` when the finding depends on information not present in the codebase — business requirements, deployment constraints, or intentional design trade-offs. Do not tag findings with clear, codebase-derivable fixes.

- `[Question]` — "The error handler silently swallows exceptions. Is this intentional for this endpoint?" (requires domain knowledge unavailable in the codebase)
- Not `[Question]` — "The error handler silently swallows exceptions. Add logging and re-throw." (actionable without user input)

### Phase 4 — Collect reviews

Collect the reviewers' final messages per `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/team-mechanics.md` (collect). Once all spawned reviewers have returned, proceed. No parent-side tree-hygiene capture-and-compare runs here, diverging deliberately from the suite's other three commands, which all run it: the review subject is a state pinned by SHA, cross-state probes run in temporary worktrees or detached checkouts, and each probe individually carries the clean-`git status` obligation (Phase 3) — the working tree is not the review substrate. Apply the shared member-failure and sceptic re-spawn rules (team-mechanics.md, member failure and the sceptic); here the sceptic's absence matters because it is the command's only challenge layer.

### Phase 5 — Generate report

Consolidate all reviewer findings into a single severity-grouped report. Apply these rules:

- Deduplicate: if multiple reviewers flagged the same issue, merge into one finding. When merging, use the highest severity.
- Preserve `[Question]` prefixes during deduplication and consolidation. A merged finding retains the prefix if any constituent finding had it.
- Number findings contiguously across the whole report (1, 2, 3 ... continuing across severity sections with no per-section restart), renumbering after deduplication.
- Line numbers in a finding's file:line reference refer to source files at the reviewed state — never to line offsets within the captured diff.
- Reference check: before saving, verify that each cited file:line resolves at the pinned head (`git show <head SHA>:<path>` and inspect the cited line); re-anchor any citation that does not resolve — including reviewer-returned diff offsets and stale pre-fix line numbers.
- Severity boundaries:
  - **Critical** — breaks the build, a CI gate, or core behaviour for all users; blocks merge.
  - **High** — likely incorrect behaviour or data loss in realistic use, or a gate or behaviour broken for a subset of environments, browsers, tenants, or routes.
  - **Moderate** — a real defect or debt with bounded impact or a straightforward workaround.
  - **Minor** — cosmetic, stylistic, or low-impact improvement.
  - The four-tier scale is code-review-specific: findings here gate a merge decision, so they need finer impact resolution than the two-tier `[high]`/`[low]` severity vocabulary the analysis commands (`agent-pre-planner`, `agent-arch-review`) use to weight planning.
  - Where Phase 3 loaded `references/skill-package-review.md`, grade findings on the package subset against its severity re-anchoring; the boundaries above govern the rest of the scope.
- Prior findings (when `--prior` was supplied): the parent owns the consolidation of the reviewers' classifications. On disagreement, still open wins unless a remediated or superseded classification cites file:line or probe evidence. Still-open prior findings live only in the Prior findings section — never re-listed as fresh numbered findings.
- Fresh findings, on disagreement: an executed probe outranks an inspection-only assessment. When one reviewer's probe disproves a claim another reviewer approved on static inspection, narrow the conflicting approval to the claim its evidence actually supports rather than dropping it.
- Coverage disclosure — file-budget consumption, probe incidents, and areas no reviewer examined — belongs in the optional `## Coverage notes` section, not dropped: it is load-bearing disclosure, not meta-commentary, and suppressing it makes the review read as more complete than it is.
- No per-reviewer attribution. The developer does not need to know which agent found what. One exception: the sceptic role (never a specialist) may be named in the Approved without changes section, where it certifies the challenge layer ran.
- Omit sections that have no findings, including "Approved without changes".
- The Summary carries a mandatory one-line merge-impact verdict (the `**Verdict:**` line in the skeleton), bound to the applied `--checks` tier per the skeleton's guidance for that line. Beyond that line, no findings summary or recommendation prose anywhere in the report — the findings list speaks for itself.
- The report ends after the last skeleton section — no trailing meta-commentary or closing remarks.

**Standard header fields.** Per `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md` `## Standard header fields`, with `Type: code-review` and no `Stage:` divergence.

Output the report per the skeleton in `assets/report-template.md` — read it before generating; bracketed text is guidance, not literal output.

### Phase 6 — Save report

Write the report to `.ace/reports/{yyyyMMdd}-{HHmm}-agent-code-review-{suffix}.md` per the save procedure in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md` `## Save report` (`{suffix}` is the Phase 3 hex suffix).

If the report contains `[Question]`-prefixed findings, proceed to the interview phase. Otherwise skip to Phase 8.

### Phase 7 — Interview

Follow the canonical interview procedure in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/interview.md` — read it now; it carries the run/collect/save mechanics and the unresolved-marker grammar. Two stated divergences: findings here carry no `[blocking]`/`[deferrable]` priority tags (that vocabulary belongs to the analysis reports — pre-planner, arch-review, scope), so present questions in report order (severity groups, most severe first), with any question that gates other findings first, batching gating and highest-severity questions in the first batch; and the unresolved marker is appended to `## Clarifications` (create it if needed) rather than to an `### Open questions` subsection.

**Update the report** — this block replaces the shared procedure's `## Update the report` rules (this report has no enhanced brief or open-questions subsection). For each answered question:

- **Findings**: replace the `[Question]` prefix with `[Resolved]` — exactly once, in the position `[Question]` occupied. Preserve the original question text verbatim; do not delete or rewrite it. Append the user's answer as the final line of the finding body, prefixed with `Answer:`. Do not delete the finding — it serves as audit trail.
- **Clarifications section**: add the answered question and the user's response. If the section did not exist, create it.
- Skipped questions: no changes.

**Save updated report** — per the shared procedure; the changed sections to output are the resolved findings, the Clarifications entries, and any unresolved marker. Proceed to Phase 8.

### Phase 8 — Publish

Follow the publish phase in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md` `## Publish`; the default here is `--publish no`.

## Constraints

- Do not proceed to implementation unless the user explicitly approves — the review is advisory only
- The command ends after Phase 8 (publication, or the printed `/ace:report-publish` line under the default `--publish no`).

## Error handling

- If `--prior` does not resolve to a readable file, `--reviewers` has a missing value or one other than `2` or `3`, or `--checks` has a missing value or one outside `full`/`cheap`/`skip`, report the error and stop
- If a keyword (`pr`, `branch`, `commit`, `directory`) is given without a second token, report the expected syntax and stop
- If the `pr` second token is not a valid number or URL, report the expected format and stop
- If the `commit` SHA is shorter than 7 characters, report the expected format and stop
- If the PR, branch, or commit is not found, report the error and stop
- If the directory does not exist or contains no reviewable text files, report the error and stop
- If the diff is empty, report "No changes detected" and stop
- If default-branch resolution fails (the git command and the `gh` fallback produce empty output, and no unique local `main`/`master` exists) for a source class that requires it, report the error and stop
- If a `gh` or `git` command fails outside Phase 8's publish step and no fallback stated in that phase covers it, report the error and stop
- If there are permission issues, report the error and stop
