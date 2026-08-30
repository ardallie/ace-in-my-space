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

Use `AskUserQuestion` before proceeding. Present the line count and offer:

1. Continue with diff only (the diff plus the commit log, skipping full file reads) —
   diff-based sources only, and only when diff + commit-log lines fit within budget; the
   `commit` and `directory` packages have no separate diff or commit log, so those sources
   get options 2 and 3 only
2. Continue with the first 30,000 lines (truncated review)
3. Stop and narrow the scope

Mark exactly one option `(recommended)` in the presented list, chosen against the counted
overage, per `${CLAUDE_PLUGIN_ROOT}/rules/principles.md` under "Presenting design options".

The keep-current-behaviour path — full files over budget — is not among the offered options;
it stays reachable through a free-text response (see Outcomes). Divergence from rule 1 of
`${CLAUDE_PLUGIN_ROOT}/rules/principles.md`, "Presenting design options".

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
