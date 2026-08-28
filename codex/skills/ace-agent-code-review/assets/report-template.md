# Agent code review report

## Summary

Title: [concise title suitable for GitHub]
Type: code-review
Date: [yyyy-MM-dd, local date]
[Emit `Stage:` only when the review covers a numbered stage/phase/track of a larger sweep; omit the line entirely otherwise.]
Stage: {n}/{m}
Source: [pinned per class — current branch <name> | pr #N | origin/<branch> | branch <name> | commit <sha> | directory <path>]
[`Reviewed state:` head is the resolved head SHA, with "uncommitted working tree" and a timestamp appended when a directory source has local changes; omit the whole `; base ...` clause, semicolon included, for commit and directory sources.]
Reviewed state: head {head SHA}; base {base SHA}
Materials: [diff/file/commit-log line counts pushed; budget outcome: full files | full files (over budget; user-approved) | diff only | truncated; verification: the shared-battery record in the record grammar of `../agent-shared/verification-checks.md` — the --checks tier plus a one-line summary of the executed shared-verification commands, or the mode where no gate ran (`skipped by flag`, `cheap -- no gate resolved`)]
Prior: {path passed to --prior}

[1-2 paragraphs: what the changes do, which areas of the codebase they affect, and key design decisions]

**Verdict:** [one line — merge impact, bound to the applied tier, e.g. "nothing blocks the merge", or "nothing blocks the merge on the cheap battery; tests, lint, format, and the build were not run" where the tier left gate classes unrun — under `cheap` or `skip`, or wherever the tier resolved to an empty gate set]

**Tip:** start a new conversation and act on this report with `$ace:ace-report-triage` (pass the report path or its published issue number) — it verifies the findings against HEAD and applies them.

## Reviewers

1. review-{specialisation-slug}-{suffix} — [role description] — [model]
2. review-{specialisation-slug}-{suffix} — [role description] — [model]
3. review-{specialisation-slug}-{suffix} — [role description] — [model] [omit under --reviewers 2]
4. review-sceptic-{suffix} — Sceptic — [model] [numbered after the last specialist]

## Findings

### Critical [omit if empty]

[consolidated findings — each with number and title, a dedicated file:line reference line, description, recommended fix; a finding awaiting user input carries `[Question]` between its number and its title]

### High [omit if empty]

[findings]

### Moderate [omit if empty]

[findings]

### Minor [omit if empty]

[findings]

### Prior findings [omit unless --prior was supplied]

[one line per prior-report finding, cited by its identifier in the prior report:
remediated | still open | superseded — with evidence (file:line or probe) for
remediated and superseded classifications]

### Approved without changes [omit if empty]

[areas/aspects reviewed by one or more reviewers and found correct — aggregate all positive assessments]

## Coverage notes [omit if empty]

[Load-bearing disclosure only: file-budget consumption, probe incidents, and areas no reviewer examined.]

## Clarifications [omit if no interview]

[User responses from interview; a declined, cancelled, or failed interview lands its unresolved marker here instead]
