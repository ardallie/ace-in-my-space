# Identifier conventions

Shared identifier rules for the plan-workflow skill suite: the two title-slug rules and
the 8-hex suffix snippet. Each rule is single-sourced here; consumers cite this file
instead of re-spelling the rule. Consumers:

- `../plan-start/SKILL.md` -- issue-title slug rule and report-title slug rule
  (Phase 4), hex snippet (Phase 4)
- `../plan-start/references/issue-route.md` -- hex snippet (staging step)
- `../plan-validate/SKILL.md` -- report-title fallback slug derivations and hex
  snippet (Phase 1, non-convention plan-file and no-arguments branches)
- `../plan-validate/references/issue-staging.md` -- issue-title slug rule and
  hex snippet (no-footer branch)
- `../plan-update/SKILL.md` -- issue-title slug rule and hex snippet
  (Phase 2A step 2 non-convention branch; Phase 2B step 3 executes that branch by
  reference)
- `../../agents/plan-drafter.md` -- report-title slug rule (step 4)

## Issue-title slug rule

Derive the slug from a GitHub issue title: strip a leading bracketed label (any `[...] `
prefix, e.g. `[PLAN] `, `[pkg-NN.M] `) and any trailing ` ({n}/{m})` stage suffix, then
kebab-case and truncate to 3 keywords (hyphen-delimited tokens). Issues published by this
pipeline are titled `[PLAN] <plan H1>` (optionally with a stage suffix, per
`$ace:report-publish`) and may be retitled `[pkg-NN.M] ...` by the host's work-packaging
conventions; without the strip every issue-derived slug leads with the label's keywords.

## Report-title slug rule

Derive the slug from a report or plan title: strip a leading reference label (`Brief N`,
`WP #NNN`, ticket-style prefixes), kebab-case the title splitting on every non-alphanumeric
character (internal hyphens, slashes, and ampersands are all token boundaries), drop
stop-words (`the`, `and`, `--`), and truncate to 3 keywords (hyphen-delimited tokens) from
the start. Example: `ETag/If-Match Optimistic Concurrency -- Phase 1 Foundation` ->
`etag-if-match` -- exactly 3 tokens (`etag`, `if`, `match`; the `/` and internal hyphen are
token boundaries). Label example: `Brief 2 -- CLI diagnostics & exit-code / JSON contract`
-> strip `Brief 2` -> `cli-diagnostics-exit`.

## 8-hex suffix snippet

Compute the suffix; test output non-emptiness, not exit status -- a pipeline whose last
stage is `head` exits 0 even when an earlier stage is missing:

```bash
s=$(openssl rand -hex 4 2>/dev/null); [ -n "$s" ] || s=$(date +%s%N | sha256sum 2>/dev/null | head -c 8); [ -n "$s" ] || s=$(date +%s%N | shasum -a 256 | head -c 8)
```

The agent-suite copy of this snippet lives in
`../agent-shared/team-mechanics.md` -- an aligned copy across the two shared
directories, kept separate so each suite's shared directory stays self-contained; an
amendment lands in both files in one change.
