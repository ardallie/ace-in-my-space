# Budget overflow

Consumed by SKILL.md Phase 2 — read when (and only when) a counted total exceeds the
30,000-line budget. The package order it truncates against is the fixed order stated in
Phase 2.

## Truncation

When a truncated review is chosen, truncation is line-prefix: keep the first 30,000 lines
of the package in the Phase 2 package order and discard the tail — the boundary file is
included partially up to the cut; note the cut point for reviewers. (A consequence of the
fixed order: full files are lost first, last-to-first, then the commit log, then the diff.)

## Options

Use `request_user_input` when it is available in Plan mode, otherwise ask the same concise
plain-text questions. Present the line count in both paths. The structured surface permits at most
three options, so use two stages rather than dropping a behaviour:

1. First ask how to handle the over-budget review:
   - Narrow the scope and stop this run.
   - Continue with full files over budget (keep current behaviour).
   - Continue with a bounded review.
2. Only after "bounded review", ask which bounded shape to use:
   - Continue with diff only (the diff plus the commit log, skipping full file reads) --
     diff-based sources only, and only when diff + commit-log lines fit within budget; the
     `commit` and `directory` packages do not offer this option.
   - Continue with the first 30,000 lines (truncated review).
   - Return to full files over budget (keep current behaviour).

Put exactly one `(Recommended)` option first in each presented list, chosen against the counted
overage and source shape, per the option-list rules in `../run-interview/SKILL.md`. In the plain-text fallback, preserve
the same option order and marker and invite a free-form alternative.

Include source-specific advice: for directory sources, suggest narrowing the directory
path; for commit sources, suggest reviewing a smaller commit; for diff sources, suggest
isolating generated files in a separate commit or reviewing a single commit.

## Outcomes

If the user chooses to stop, end the task. If the user chooses diff only, proceed with the
diff and commit log and note for reviewers that full file context was not included. If the
user chooses to continue truncated, keep the first 30,000 lines per the Phase 2 package order,
discard the rest, and note the truncation for reviewers. If the user instead approves the
full-file overage via a free-text response, proceed with full files and record the budget
outcome as `full files (over budget; user-approved)`.

Return to Phase 2 to record the line counts and the budget outcome that applied.
