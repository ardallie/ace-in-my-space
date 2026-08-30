# Scope envelope

## Summary

Title: {concise title suitable for GitHub}
Type: scope
Date: {yyyy-MM-dd, local date}
Source: [per `## Standard header fields` in
`${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md`. No wildcards or prose descriptions.]
Grounding: [collated specification ({repo-relative path}) | project specification
({repo-relative path}) | none]
Grounded at: [per the shared grammar -- read by the consuming pre-planner's git-state
staleness check]
Panel: {N} lenses + 1 sceptic. Models: {the split, or `all {model} via --model` --
recorded as the resolved model names}.
Rationale: {one line: the implicated axes, the grouping applied, and whether a
sibling-seam probe was assigned}.

[1-2 paragraphs: the ambition, the chosen direction, and the envelope's reach]

**Tip:** work the staged split top-down: start a fresh conversation per stage and run its
printed `/ace:agent-pre-planner` invocation (the saved path and the published issue number are
equally valid). Do not pass this envelope to `/ace:plan-start` -- it is not a plan brief; each
stage's pre-planner run produces one.

## Panel

[Numbered list, one entry per member: `[name] -- [axes owned] -- [model]`, the sceptic
last as `[name] -- Sceptic -- [model]`.]

## Envelope

### Direction

[The chosen direction and its grounding in architecture practice for systems of this
shape; what the direction deliberately is not. Envelope altitude throughout: named
modules, seams, and contracts -- no edit sites, no task lists.]

### Goals

[G1..Gn -- each achievable within the current system as grounded: one line of intent,
the envelope-level requirements bounding it (one to three bullets), and the anchor(s)
it builds on.]

### Consequences and limitations

[What committing to the direction costs and forecloses: risks accepted, alternatives
closed off, prerequisites assumed, constraints inherited.]

### Opportunities

[What the direction opens beyond the goals: follow-on capabilities, reusable seams,
options kept alive.]

## Concern sweep

[One entry per axis -- data model; contracts and boundaries; auth; state and lifecycle;
migration and compatibility; operability; testing. An implicated axis records the
envelope's treatment and feeds the goals and inventory; a non-implicated axis records
one line saying why not. No axis is omitted.]

## Assumption inventory

[A1..An -- one line each: the premise, then its status -- `verified ({anchor})`,
`settled (Q{n})`, `open (Q{n})`, `open (Stage {k})`, or -- after Phase 8 only --
`moot (Q{n})`. Every load-bearing premise appears; every open entry names its owner.]

### Open questions [omit if empty]

Q{n} [blocking] {question}

[One per line, blocking first, with the priority tag `[blocking]` or `[deferrable]`
reproduced verbatim. Blocking: the direction or staging is not credible until
answered. Deferrable: the owning stage's pre-planner run can carry it. Phase 8
rewrites answered lines (`[Resolved]`, `Answer:`) and routed lines (`[Routed]`, closed
by a `Routed: {8hex}, round {k}; ...` correlation line) in place, in the exact forms
its update block and `${CLAUDE_PLUGIN_ROOT}/skills/agent-scope/references/sibling-routing.md`
specify -- none of those tags is emitted here. Every statement elsewhere in the report
whose content depends on an open question carries a bold **see Q{n}** marker; Phase 8's
update pass locates the dependent statements by these markers.]

## Staged split

[The framing paragraph below is mandatory and emitted verbatim.]

The split is advisory and downstream-correctable: stage boundaries were drawn
knowledge-first with light grounding; each stage's `/ace:agent-pre-planner` run re-derives
and corrects its own stage, and no later planning session may treat a boundary as
binding.

Stage {k} -- {title}: goals covered ({G ids}); depends on ({prior stages or none});
validation gate ({observable behaviour or the project's standard verification}); owns
({the A/Q ids routed to it})
Pre-planner invocation: `/ace:agent-pre-planner {report path} Scope: Stage {k} -- {title} ({goal ids}) only`

[One entry per stage, in dependency order. Optionally one paragraph before them: how the
split was cut -- where the panel or the interview moved a boundary, and why. The
`Pre-planner invocation` line stays on one physical line -- the trailing ` only`
terminates the scope directive the consuming pre-planner parses.]

Recommendation: scope envelope | direct to pre-planner
[On `direct to pre-planner`, the split above collapses to a single stage and the next
line is the ready-to-run unscoped invocation.]

## Context files

[Single deduplicated numbered list of all files read -- grounding, orchestrator anchor
reads, and panel reads merged, per the path-list rule in
`${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md` `## Standard header fields`. No
grouping by source, no member attribution. Omit files listed in the ambition but not
found or not readable -- note these separately.]
