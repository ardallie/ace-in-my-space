# Pre-plan analysis

## Summary

Title: {concise title suitable for GitHub}
Type: pre-planner
Date: {yyyy-MM-dd, local date}
[Emit `Stage:` only when the analysis covers a numbered stage/phase/track of a larger sweep; omit the line entirely otherwise.]
Stage: {n}/{m}
Source: {per `## Standard header fields` in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md`}
Analysts: {N} non-sceptic + 1 sceptic. Models: {the split -- e.g. `4 x Tier-3 + a Tier-2 sceptic`, or with a load-bearing promotion `3 x Tier-3 + a Tier-2 {concern} + a Tier-2 sceptic`, or `all {model} via --model` -- recorded as the resolved model names}. Sizing: {auto-sized from scope | set via --agents {N}}. Rationale: {one line: the band the scope size selected, the dominant scope signals, and any concern grouping applied to fit the budget}.
Grounded at: [per the shared grammar -- read by this skill's own git-state staleness check
when the report is passed back as a positional input]

[Why the shared `Source:` path-list rule is load-bearing here: `/ace-plan-start`'s pre-planner
transform (`${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-start/references/pre-planner-transform.md`) copies the
field's value verbatim into the drafter brief's `Original sources:` line, and the drafter
resolves each file item as a path.]

[1-2 paragraphs: what the brief is about, which areas of the codebase are affected, and key constraints or goals]

**Tip:** start a new conversation and pass this report to `/ace-plan-start` (or a planning agent).

## Analysts

[Numbered list of `N + 1` entries: the `N` non-sceptic specialists, each as
`[name] -- [specialisation] -- [model]`, followed by the sceptic as the final entry
`[name] -- [sceptic description] -- [model]`. Names follow the Phase 4 convention
`{role}-{suffix}`.]

## Enhanced brief

[The original user input regenerated at the same level of detail, with findings applied
throughout. Corrections replace incorrect content in place with file:line evidence and
reference the finding number in bold (e.g., **see C2**). Risks, insights, and opportunities
are woven into the narrative at the points they apply. Accurate content is preserved unchanged.
The result is the user's brief as it would read with full knowledge of the codebase.]

### Open questions [omit if empty]

Q{n} [blocking] {question}

[One line per question, ordered blocking first then deferrable. Each line carries its
`Q{n}` identifier -- matching the `### Question` finding -- with the single trailing space
that is part of the downstream anchor, then the priority tag `[blocking]` or `[deferrable]`
verbatim. Downstream tooling matches both literally: prose group labels substitute for
neither. Full context goes in the matching `### Question` finding, not here.]

### Workload split

[Scope assessment: brief justification for splitting or not. When splitting, list each
plan with title, tasks, dependency on prior plans, and validation gate; when the split's
shape depends on an open question, emit it as a placeholder naming that question and the
shapes each answer produces. When not splitting, state that a single plan is sufficient.
Close with the mandatory final line below -- or exactly `Recommendation: no plan` when the
analysis argues against producing a plan.]

Recommendation: {N} plan(s)

## Findings

[Per the `## Consolidation rules` in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/analysis-conventions.md`,
with the category prefixes `C` Correction, `R` Risk, `Q` Question, `I` Insight,
`O` Opportunity, `V` Confirmed, and severity tags `[high]`/`[low]`. A Correction additionally
states what was wrong and what is correct; a Confirmed states what was verified and why it
needs no changes.]

### Correction [omit if empty]

### Risk [omit if empty]

### Question [omit if empty]

Q{n} [blocking] {ambiguity the codebase could not resolve}

[A Question carries a priority tag `[blocking]` or `[deferrable]` in place of a severity
tag. `[Resolved]` and its `Answer:` line are Phase 8 interview mutations -- never emitted
here at Phase 6.]

### Insight [omit if empty]

### Opportunity [omit if empty]

### Confirmed [omit if empty]

## Context files

[Single deduplicated numbered list of all files read during analysis -- by the
parent agent during exploration and by analysts. One file per entry -- no wildcards,
globs, or comma-grouped multi-file rows. No grouping by source, no analyst
attribution. Omit files listed in the brief but not found or not readable --
note these separately.]
