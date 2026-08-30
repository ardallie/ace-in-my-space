---
name: run-retro
description: "Writes a retrospective report on a finished run to .ace/retro/ -- a run is any unit of work completed in this session: a slash command or skill invocation, a multi-agent orchestration, or an ad-hoc task. The report exists to improve the process that ran -- the command or skill instructions, sequencing, and tooling -- not to summarise the work the run produced. Without an argument, retrospects the most recently finished run."
---
**Invocation input:** `[command name | issue number | task description]`


# Run retrospective

## Scope

An optional argument names the run to retrospect (a command name, issue number, or task
description). Without an argument, retrospect the most recently finished run in this session.
Sequential invocations that form one piece of work (e.g. `$ace:plan-read` followed by
`$ace:plan-implement`) count as a single run. If nothing has run in this session and no argument
identifies a run, say so and stop -- do not reconstruct a retrospective from artefacts alone.

## Instructions

Write the report to `.ace/retro/{yyyyMMdd}-{HHmm}-{run-slug}.md`, where the date and time
come from local machine time (`date +%Y%m%d` and `date +%H%M`); slug derived from the command,
skill, or task name, e.g. `plan-implement-883`. Never overwrite an existing report -- on a
path collision, append `-2` (then `-3`, etc.) to the run slug. The timestamp idiom and
collision-increment convention are canonical at `$ace:plan-start` Phase 4
(`../plan-start/SKILL.md`); this file's increment
target -- the run slug -- is deliberately unaligned with the pack's other targets, and must
not be synced to match them.

Write for the maintainer who will revise the command or skill that ran. Be candid: an honest
account of friction is worth more than a polished summary. Ground every point in the run
itself: cite the instruction, file, or error concerned, and skip generic advice that would
apply to any run. "Nothing to report" is a valid finding -- if a mandatory section has nothing
worth reporting, say so in one line rather than padding it.

## Report structure

Open the report with an H1 naming the run (e.g. `# Run retrospective -- $ace:plan-implement 883`)
and, where applicable, the exact invocation on the next line. Then these sections, in this
order. The first four are mandatory; omit "Open questions" when there are none.

```markdown
## Run summary

Two or three sentences: what ran, what it was asked to do, and the outcome
(completed, completed with warnings, partial, blocked).

## What went well

Aspects of the process that helped -- clear instructions, good defaults, well-placed
checks, tooling that worked. Name them specifically so future revisions preserve them.

## Challenges

Where you struggled, hesitated, or had to guess. For each one: what happened, what the
instructions said (or failed to say), and how you got past it. Cover ambiguous or
contradictory instructions, missing context, steps in the wrong order, redundant work, and
tooling that failed or fought you.

## Proposed improvements

Concrete changes to the command, skill, or supporting docs, one per bullet: what to change,
where, and why. Tie each proposal to a challenge above or to effort it would save on future
runs. Prefer small, specific edits over sweeping redesigns.

## Open questions

Anything you could not resolve yourself that the maintainer should decide.
```
