# Architectural review

## Summary

Title: {concise title suitable for GitHub}
Type: arch-review
Date: {yyyy-MM-dd, local date}
[Emit `Stage:` only when the review covers a numbered stage/phase/track of a larger sweep; omit the line entirely otherwise.]
Stage: {n}/{m}
Source: [per `## Standard header fields` in
`../agent-shared/report-conventions.md`. Local addition: the
`conversation context` item alone may carry exactly one parenthesised reference naming
what the context is about -- `conversation context ({issue or package reference})`, a
defined form, not free prose; a later `--prior`-only re-review seeds its scope from it]
Analysts: {count} total, the sceptic counted inside it. Models: {the split -- e.g. `5 x Tier-3 + a Tier-2 sceptic`, or with a promotion `4 x Tier-3 + a Tier-2 {concern} + a Tier-2 sceptic`, or `all {model} via --model` -- recorded as the resolved model names}. Sizing: {work-package scope (six) | narrow scope (three-to-five) | re-review (--prior, reduced band)}. Rationale: {one line: the scope signals behind the size and the flexible-slot specialisations chosen}.
Checks: [the report-level record of what the shared battery did or did not run, emitted as
one line in the record grammar of `../agent-shared/verification-checks.md`: the
applied --checks tier or mode (full | cheap | skipped by flag), then a one-line summary of
the commands that ran or the `no gate resolved` marker where none did, then
`(+ --prior pre-build)` where that step ran]
Prior: {path passed to --prior}
Grounded at: [per the shared grammar -- read by the consuming pre-planner's git-state
staleness check]

[1-2 paragraphs: what the brief is about, which areas of the codebase are affected, and key constraints or goals]

**Tip:** start a new conversation and pass this report to `$ace:agent-pre-planner` or a planning agent. If the Workload assessment splits the scope into multiple briefs, start one conversation per brief and run that brief's printed `Pre-planner invocation:` line. Do not pass this report directly to `$ace:plan-start` -- it is not a pre-planner report, and its open questions would not surface there.

## Analysts

[Numbered list -- one entry per spawned analyst, using the Phase 3 `arch-{specialisation-slug}-{suffix}`
names, each as `[name] -- [specialisation] -- [model]`, the sceptic last. This list is for the
human reader; no downstream tooling parses it.]

## Enhanced brief

[The original user input regenerated at the same level of detail, with findings applied
throughout. Corrections replace incorrect content in place with file:line evidence and
reference the finding number in bold (e.g., **see C2**). Risks, insights, and opportunities
are woven into the narrative at the points they apply. Accurate content is preserved unchanged.
The result is the user's brief as it would read with full knowledge of the codebase.]

### Open questions [omit if empty -- never emit the heading with a "None." body]

[Questions that require user input before planning -- one per line, each line beginning
with its `Q{n}` identifier and priority tag `[blocking]` or `[deferrable]` verbatim,
grouped by priority (blocking first, then deferrable). Full context in § Question below.]

### Workload assessment

[One paragraph of scope assessment -- whether a single pre-planning brief absorbs the
findings or they split into several -- per Phase 5's workload-assessment rules. Then one
entry per suggested brief in the form below, the single-brief case included.]

- Brief {N} -- {title} — covers {ids; mark foldable extras `(optional)`}; depends on {prior briefs or none}
  Stamp: flags [{set flags as `|`-separated tokens from the four defined names, or `none` — no prose}]; Pre-planner: RECOMMENDED | SKIP (advisory)
  Rationale: {optional single line linking the set flags to the covered findings; omit or emit consistently across every brief in the report}
  Pre-planner invocation: `$ace:agent-pre-planner {report path} Scope: Brief {N} -- {title} ({ids}) only`
[Emit the `Pre-planner invocation` line in the multi-brief case only; its `{ids}` are the
brief's covers list minus resolved questions, so the two lines never disagree. The `Stamp:`
line's outer square brackets are part of the emitted line.]

Shared-file matrix [omit if single brief; emit with a single `(no shared files)` row when no files collide]:
- {path} — Brief {N}, Brief {N}, ...
(Covers only the briefs listed above; out-of-band briefs discovered during execution are not represented.)

Backlog candidates [omit if empty]:
- {finding id} — {one-line reason it falls outside the suggested briefs}
(Listed for manual capture; no backlog files are written.)

Out of scope / down-ranked [optional; omit if empty]:
- {finding id} — {reason for exclusion or down-ranking}

## Findings

[Per the `## Consolidation rules` in `../agent-shared/analysis-conventions.md`,
with the category prefixes `C` Correction, `R` Risk, `Q` Question, `I` Insight,
`O` Opportunity, `V` Confirmed, and severity tags `[high]`/`[low]`. A Correction additionally
states what was wrong and what is correct; a Confirmed states what was verified and why it
needs no changes.]

### Correction [omit if empty]

### Risk [omit if empty]

### Question [omit if empty]

Q{n} [blocking] {ambiguity the codebase could not resolve}

[A Question carries a priority tag `[blocking]` or `[deferrable]` in place of a severity
tag. Tag order is canonical: the identifier, then the priority tag verbatim, then the
description. Phase 7 mutates a resolved question in place -- `Q{n} [blocking] [Resolved]
...` with an `Answer:` line appended -- so `[Resolved]` is never emitted here at Phase 5.]

### Insight [omit if empty]

### Opportunity [omit if empty]

### Confirmed [omit if empty]

### Prior findings [omit unless --prior was supplied]

[one line per prior-report finding (backlog candidates included), cited with the `prior:`
prefix (e.g. `prior:R2`): remediated | still open | superseded -- with evidence (file:line or
probe) for remediated and superseded classifications. Never renumbered as fresh findings.
Findings sharing an identical classification and evidence may be grouped into one range line
(e.g. `prior:V1-V9: remediated ...`).]

## Context files

[Deduplicated numbered list of all files read during analysis -- by the parent agent
during exploration and by analysts. One file per entry -- no wildcards, globs, or
comma-grouped multi-file rows. No grouping by source, no analyst attribution. Omit
files listed in the brief but not found or not readable -- note these separately.
Single flat list in the single-brief case. When the Workload assessment splits scope
into multiple briefs, group entries under one sub-heading per suggested brief plus a
final `Shared / general` group, numbering continuous across groups -- a pre-planner
run scoped to one brief then reads its group plus the shared group rather than the
whole list.]
