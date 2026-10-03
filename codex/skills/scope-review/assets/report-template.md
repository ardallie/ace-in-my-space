# Scope review

Title: {concise; no trailing full stop; no issue, package or stage numbers; no references to other issues}
Type: scope-review
Date: {yyyy-MM-dd}
Workstream: .ace/ws/{name}
Source: {each given input, comma-separated: inputs.md key form where one exists, else the literal ref (branch, commit range, ws report file)}
Prior: {file | none (declined: {file})}
Grounded at: {short hash}, {clean tree | dirty ({n} modified files)}[; HEAD moved to {hash} during the run]
Decisions: {D ids this run added | none | pending}
Mode: {closing review | discovery sweep}
Baseline: {report-scope-envelope.md, decisions.md | scope document paths | none}
Delivered: {PRs, branch or commit range; how found | none (discovery sweep)}
Checks: {one value in the verification-checks record grammar}

[Bracketed paragraphs like this one are guidance: follow them, then delete them. Inside a line form, `[...]` marks an optional part, except tags: where a form shows `[blocking|deferrable]` or `[high|low]`, write exactly one of the two (`[blocking]`, ...); `[Resolved]` and `[Routed]` are written as shown. Unbracketed prose, such as the Stages paragraph, is kept verbatim. H1 is the first line; no line in the first 25 starts with `Stage`. One bare `Field: value` per line at column 0, no bullets or bold. Omit `Prior:` when no earlier report of this kind exists. `Exchange:` (envelope only): one line per counterpart, written when this run routes or consumes a round and carried forward while that exchange stays open, omitted otherwise. `pending` only between save and append, never in the final report. `Decisions:` carries ids only.]

## Summary
Conformance: {n} landed, {n} reinterpreted, {n} diverged, {n} deferred, {n} silently-deferred, {n} premise-void, {n} unverified.
[The Conformance line appears in a closing review only and counts every row under `## Conformance`. Three to six sentences: what was reviewed against which baseline; the verdict (closing) or the state of the area (sweep); the shape of the remediation; what remains open.]

## Scope
[What was reviewed, against which baseline, any framing the user set, the remediation boundary; a sweep lists every area swept so far. A binding choice is a D: cite it.]
### Outside the stages
Backlog:
- {finding id} -- D{n}
Envelope:
- {finding id}
Out of scope:
- {finding id} -- {reason}
[Every C, R and O and every conformance gap appears in a stage's Covers or on exactly one line here. Envelope only in a sweep. Omit an empty group. An area not examined: "- {area} -- not examined: {reason}".]

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

[With nothing to remediate: "None." after the paragraph. In a sweep: the heading, then "Not applicable: discovery sweep -- its findings seed $ace:scope-envelope in this workstream."; paragraph and entries omitted.]

## File-collision matrix
- {repo-relative path} -- {S ids}
[Every file more than one stage is expected to change, checked against the code at Grounded at; "None." when no file is shared; omitted in a sweep.]

## Open items

### Open questions

Q{n} [blocking|deferrable] -- {question, with the context needed to answer it} Owner: {owner}.
Q{n} [blocking|deferrable] [Routed] -- {question} Owner: sibling ({role}).
Q{n} [blocking|deferrable] [Resolved] -- {question} -> D{m}
Q{n} [blocking|deferrable] [Resolved] -- {question} -> D{m} (moot)
Routed: {8hex}, round {k}; {N} questions await consultant answers.
Interview: {declined | cancelled | failed}; {N} questions unresolved.

[One physical line per question, blocking first; nothing else in the block. A saved line never moves: resolution or routing changes only its marker and ending. Owners: `user`, `S{k}` (that stage's Owns lists it), `sibling ({role})`, `third party ({role})`, `closing review` (envelope only); never "later", "the implementer", "a probe" or "backlog". `[blocking]`: the work cannot be planned credibly without it; `[deferrable]`: its owner settles it during the work. `[Routed]` lines and `Routed:` (envelope only): one `Routed:` per exchange, only while its `[Routed]` lines remain; a scope review writes a sibling-owned question in the plain form with `Owner: sibling ({role})`. `Interview:` only after a declined, cancelled or failed interview. With no Q line at all, the H3 is omitted and `None.` stands in its place (an envelope keeps its `Open assumptions:` line above it).]

## Premise challenge

- {challenge: premise, framing, simpler alternative, unstated assumption, gold-plating} -- {adopted: {ids it changed} | not adopted: {reason}}

[Every sceptic challenge appears; if the sceptic could not finish, say so.]

## Conformance
[Closing review; in a sweep: "Not applicable: discovery sweep."]
### Goals
- {file}#G{n} -- {verdict} -- {fact | assessment}: {evidence}[ -> {finding id}]
### Gate clauses
- {file}#S{k}.{m} -- ...
### Decisions
- D{n} -- ...
### Baseline open items
- {file}#{Q or A id} -- ...
### Input items
- {file}, {input item} -- ...
[Verdicts: landed; reinterpreted ({D{n}} | {record}); diverged; deferred ({D{n}} | {X{n}} | {record}); silently-deferred; premise-void; unverified ({why}; settled by: {what would settle it}; owner: {owner}). A baseline without numbered gate clauses is cited by stage plus a short quote. A carried verdict says so. Transcripts stay in workings/.]

## Findings
### Correction
C{n} [high|low] -- {what was claimed} is wrong; {what is true}. Evidence: {anchors | probe: {workings path}}
### Risk
R{n} [high|low] -- {risk and where it bites}. Evidence: {...}
### Insight
I{n} [high|low] -- {...}. Evidence: {...}
### Opportunity
O{n} [high|low] -- {...}. Evidence: {...}
### Confirmed
V{n} -- {what was verified and why it needs no change}. Evidence: {...}
[[high]: changes what the remediation must do or how the architecture holds; [low]: observational. A finding with no anchor reads "Assessment: {basis}" in place of "Evidence:". Questions live only under Open items. Omit an empty category.]

## Changes from prior

Carried unchanged: {ids | none}
- {id} -- {narrowed: {what remains} | resolved -> {D{n} | A{n} | V{n}} | retired: {reason}} -- {evidence}

[Only when `Prior:` names a file. Accounts for every id of the prior and nothing else: a closing review accounts for its baseline in Conformance, a scope envelope for its consumed reports in Input coverage. An incremental sweep adds `Not re-examined (outside this area): {ids}`.]

## Run record

Route: {orchestration facility | direct subagents}[, in {n} waves]
Override: {the user's override verbatim | none}
Team:
- {role and what it owned} -- Tier-{n} -- {resolved model} -- effort {level | inherited | default}
Rationale: {one line}
Revision pass: {n} findings, {m} applied; draft and findings in {workings path}
Not verified: {what could not run, and the ids it leaves open or marked (unverified) | none}
External state: {none | one entry per resource: {resource} -- {authorised use} -- residue {what remains | none}}
Workings: {path}

[Always the last section.]
