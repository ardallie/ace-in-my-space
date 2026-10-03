# Scope envelope

Title: {concise; no trailing full stop; no issue, package or stage numbers; no references to other issues}
Type: scope
Date: {yyyy-MM-dd}
Workstream: .ace/ws/{name}
Source: {each given input, comma-separated: inputs.md key form where one exists, else the literal ref (branch, commit range, ws report file)}
Prior: {file | none (declined: {file})}
Grounded at: {short hash}, {clean tree | dirty ({n} modified files)}[; HEAD moved to {hash} during the run]
Exchange: {8hex} -- {counterpart repository} -- round {k}; request {path}[; answers {path}]
Decisions: added {D ids | none | pending}
Grounding: {specification file read | none}

[H1 is the first line; no line in the first 25 starts with `Stage`. One bare `Field: value` per line at column 0, no bullets or bold. Omit `Prior:` when no earlier report of this kind exists. `Exchange:` (envelope only): one line per counterpart, written when this run routes or consumes a round and carried forward while that exchange stays open, omitted otherwise. `pending` only between save and append, never in the final report. `Decisions:` carries ids only.]

## Summary
[Three to six sentences: the ambition; the direction in one sentence; the shape of the stages; every blocking question and load-bearing (unverified) claim. States nothing the body does not; cites D, never restates. Ends: "When delivered, $ace:scope-review in this workstream closes it."]

## Scope
### Direction
[Envelope altitude: modules, seams, contracts. What it deliberately is not. A direction-level choice is a D: cite it. A claim here or under Consequences that cites no anchor (A id, path) is marked (assessment).]
### Consequences and limitations
- {cost, closed alternative, prerequisite or inherited constraint} ({A or D ids} | (assessment))
### Out of scope
- X{n} -- {work not delivered} -- {reason}[; revisit when {trigger}]
["None." when nothing is excluded.]

## Goals
### G{n} -- {title}
{One line of intent.}
- {one to three bounding requirements}
Anchors: {A ids; modules, seams, contracts}

## Stages

These stages are a suggested sequence, not a contract: the downstream orchestrator may merge, split, reorder or parallelise them. Everything they cover is the deliverable; only what this report lists as out of scope, each with its reason, is excluded. A stage's gate cannot pass while an item it owns is open, and changing what a gate requires is a decision for decisions.md. To hand a stage to an agent, give it the header, `## Scope`, this paragraph, the stage entry, the defining block of every id it cites, and decisions.md. Bare ids are this report's own; `{file}#{id}` names another report's; D{n} are decisions.md entries, whose current status governs. Ids are record keys: keep them out of code.

### S{k} -- {title}

Outcome: {what exists or behaves differently once done}
Covers: {ids delivered; a split item names its part in each stage, e.g. G4 (status half)}
Depends on: {S ids | none}[; external: {what, from whom}]
Relies on: {D ids; verified A or V ids; {file}#{id}; envelope: modules and seams}
Owns: {open Q and A ids this stage settles before its gate | none}
Gate:
- S{k}.{m} {observable behaviour} ({ids it evidences})[ (holds today) | (unverified: {why}; owner: {owner})]

[Dependency order: S{k} depends only on earlier stages. Every Covers id is evidenced by at least one clause. A clause names no toolchain command ("the project's standard verification passes" is allowed). Each clause is satisfiable: not already true at `Grounded at:` (except `(holds today)` on an explicit regression guard), reachable once its dependencies are done, and consistent with relied-on decisions and verified facts.]

## Open items

Open assumptions: {A ids | none} (owners in Assumption inventory)

### Open questions

Q{n} [blocking|deferrable] -- {question, with the context needed to answer it} Owner: {owner}.
Q{n} [blocking|deferrable] [Routed] -- {question} Owner: sibling ({role}).
Q{n} [blocking|deferrable] [Resolved] -- {question} -> D{m}
Q{n} [blocking|deferrable] [Resolved] -- {question} -> D{m} (moot)
Routed: {8hex}, round {k}; {N} questions await consultant answers.
Interview: {declined | cancelled | failed}; {N} questions unresolved.

[One physical line per question, blocking first; nothing else in the block. A saved line never moves: resolution or routing changes only its marker and ending. Owners: `user`, `S{k}` (that stage's Owns lists it), `sibling ({role})`, `third party ({role})`, `closing review` (envelope only); never "later", "the implementer", "a probe" or "backlog". `[blocking]`: the work cannot be planned credibly without it; `[deferrable]`: its owner settles it during the work. `Routed:` (envelope only): one per exchange, only while its `[Routed]` lines remain. `Interview:` only after a declined, cancelled or failed interview. With no Q line at all, the section reads `None.` and the H3 is omitted.]

## Premise challenge

- {challenge: premise, framing, simpler alternative, unstated assumption, gold-plating} -- {adopted: {ids it changed} | not adopted: {reason}}

[Every sceptic challenge appears; if the sceptic could not finish, say so.]

## Assumption inventory
- A{n} -- {premise} -- {verified ({anchor}) | verified (live observation) | settled (D{m}) | refuted ({evidence}) | open (owner: {owner}) | open (Q{n})}
[An unverified premise is open, with its owner.]

## Concern sweep
- data model -- {implicated: {ids carrying the treatment} | not implicated: {why}}
- contracts and boundaries -- ...
- auth -- ...
- state and lifecycle -- ...
- migration and compatibility -- ...
- operability -- ...
- testing -- ...
[Axes may be added; none of the seven is dropped. A carried verdict says so.]

## Input coverage
- {input item or {file}#{id}} -- {covered: G ids | reframed as G{n}: how | out of scope: X{n} | struck: reason (anchor or D)}
[Every actionable id of a consumed sweep or closing review has a line. "Not applicable: the inputs enumerate no items." when they do not.]

## Changes from prior

Carried unchanged: {ids | none}
- {id} -- {narrowed: {what remains} | resolved -> {D{n} | A{n} | V{n}} | retired: {reason}} -- {evidence}

[Only when `Prior:` names a file. Accounts for every id of the prior and nothing else: a baseline is accounted for in Conformance, a consumed report in Input coverage. An incremental sweep adds `Not re-examined (outside this area): {ids}`.]

## Run record

Route: {orchestration facility | direct subagents}[, in {n} waves]
Override: {the user's override verbatim | none}
Team:
- {role and what it owned} -- Tier-{n} -- {resolved model} -- effort {level | inherited | default}
Rationale: {one line}
Revision pass: {n} findings, {m} applied; draft and findings in {workings path}
Not verified: {what could not run, and the ids it leaves open or marked (unverified) | none}
Workings: {path}

[Always the last section.]
