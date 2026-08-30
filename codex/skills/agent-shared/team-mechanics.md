# Team mechanics

Shared team-lifecycle conventions for the multi-agent skill suite: team sizing, run suffix,
pre-spawn capture, spawning, package handoff, collection, tree hygiene, and member failure.
Consumers: the four suite skills. Each SKILL.md states its own divergences — notably
`agent-code-review`, which runs no pre-spawn capture and no tree-hygiene check (its review
subject is a SHA-pinned state, not the working tree). `$ace:agent-consultant` does not consume
this file: it carries its own aligned copy of every section below, with two deliberate
differences — its Phase 4 suffix correlates with the exchange id rather than being freshly
minted, and its collect step keeps the no-poll sentence this file no longer states. Where
this file says "member", each consumer reads its own noun (analyst, reviewer, panel member
/ lens).

## Team sizing

Choose the fewest members that give every genuinely independent concern an owner; group
concerns that share files, data, or reasoning rather than giving each its own member. Never
pad the team with cross-cutting filler slots to reach a band's upper bound. A skill that
sizes its team by flag rather than by concern applies no part of this rule.

## Run suffix

Generate a random 8-character hex suffix (e.g., `a3f9b2c1`) using a shell command; test
output non-emptiness, not exit status — a pipeline whose last stage is `head` exits 0 even
when an earlier stage is missing:
`s=$(openssl rand -hex 4 2>/dev/null); [ -n "$s" ] || s=$(date +%s%N | sha256sum 2>/dev/null | head -c 8); [ -n "$s" ] || s=$(date +%s%N | shasum -a 256 | head -c 8)`.
The suffix names the run's members and the report filename. This snippet is maintained as
aligned copies; an amendment lands in every aligned copy in one change. This file's declared
counterpart is `../plan-shared/identifiers.md`. The copies are kept separate so
each suite's shared directory stays self-contained.

## Pre-spawn capture

Capture the working-tree state (`git status --porcelain`) and the current commit
(`git rev-parse HEAD`) before spawning — the collect phase's tree-hygiene check compares
against both.

## Spawning

Issue one `collaboration.spawn_agent` call per member with a unique run-suffixed `task_name`, the member brief in `message`, `agent_type: "default"`, `fork_turns: "none"`, and the resolved per-member `model` and `reasoning_effort`. Issue every call before waiting so the members run concurrently. Spawn-model
prescriptions here are tier references (`Tier-1`-`Tier-3`); resolve them at spawn time per
the consumer contract in `../detect-harness/SKILL.md` — against the
`Harness:` block already in context, invoking `$ace:detect-harness` first if none is present.
Where the detect-harness package is absent, resolve tiers against the harness's own model
catalogue.

## Package handoff

Assemble the context package into a temporary file and pass its path to each member; the
content is fixed at assembly time, so determinism is preserved. Embedding the package
directly in the spawn prompts is acceptable only when the package is small.

## Collect

Once all members have returned, proceed.

## Tree-hygiene check

Before report generation, compare `git status --porcelain` and `git rev-parse HEAD` against
the pre-spawn capture — member probes must have left the working tree as they found it.

- **Probe-derived modifications** — revert stray modifications that are clearly
  probe-derived, and record any hygiene incident (what was found, what was reverted) in the
  report's `## Summary`.
- **Moved HEAD** — the user manages git commits and may have committed at the terminal
  mid-run. Never reset, revert, or amend the commit. Report the move in `## Summary`,
  including the case where the tree is now cleaner than the capture, and ask the user about
  it when the next step depends on it.
- **Ambient third-party writes** — changes that are neither probe-derived nor a consequence
  of a moved HEAD (e.g. external tooling touching dotfiles or its own directories, appearing
  mid-run) are left in place and reported in `## Summary`, on the moved-HEAD terms above.

## Member failure and the sceptic

If a member fails or returns empty output, proceed with the available analyses and note
the missing member in the report. The sceptic is not a uniform member: if the sceptic
fails or returns empty output, re-spawn it once. If it fails again, proceed but state the
sceptic's absence in the report's `## Summary` (not only as a context-files footnote) —
the premise-challenge layer is the report's differentiating guarantee; each SKILL.md
states what additionally depends on it.
