# Scope code review

Title: {concise; no trailing full stop; no issue, package or stage numbers; no references to other issues}
Type: scope-code-review
Date: {yyyy-MM-dd}
Workstream: .ace/ws/{name}
Source: {{current branch {name} | branch {name} | commit {sha}}, {base}..{head} | folder {path} at {head}}[; leads: {earlier review paths named in the trailing text}]
Prior: {file | none (declined: {file})}
Grounded at: {short hash of the pinned reviewed head}, clean tree[; checkout dirty ({n} modified files, not reviewed)][; HEAD moved to {hash} during the run]
Decisions: {D ids this run added | none | pending}
Baseline: {the current envelope, the current closing review, decisions.md -- those that exist}
Delivered: {delivered set: branches and commits | no delivery recorded (no handoff and no closing review's `Delivered:`)}; {how found: the handoffs or closing-review line read | what was searched}; {relation: tied by containment at {sha}[, {n} commits beyond the records reviewed: {shas}] | {within | partly within | outside} the delivered set | no delivery recorded}[; already merged at {sha}]; default branch {ref} at {sha}, {current | local ref; staleness cannot change the base | local ref; offline | local ref; fetch declined, staleness may change the base | fetched with the owner's consent}
Checks: {one value in the verification-checks record grammar}

[Bracketed paragraphs like this one are guidance: follow them, then delete them. Inside a line form, `[...]` marks an optional part and `{a | b}` a choice of one, except tags: where a form shows `[blocking|deferrable]` or `[high|low]`, write exactly one of the two (`[blocking]`, ...); `[Resolved]` and `(not re-examined)` are written as shown. Unbracketed prose, such as the Scope preamble, is kept verbatim. H1 is the first line; no line in the first 25 starts with `Stage`. One bare `Field: value` per line at column 0, no bullets or bold. Omit `Prior:` when no earlier report of this kind exists. `Grounded at:` is the pinned head: the reviewed state is read as git objects, so it is always a clean tree, and uncommitted changes in the checkout are disclosed, never reviewed. `{base}` is the merge-base with the default branch's tip for a branch, the first parent for a commit (the empty tree for a root commit); a folder has none. `pending` only between save and append, never in the final report. `Decisions:` carries ids only. The body prints no hand-off or next command: Close does.]

## Summary
Verdict: {ready | not ready -- {ids}} -- checks {tier as recorded on Checks:}[ (not run: {what the tier leaves out})]; test run {ran | not run: {reason}}; review set {n} of {m} subject files, {k} set aside[; repeat review since {prior's Grounded at}]
Findings: {n} C, {n} R, {n} I, {n} O, {n} V; [high]: {ids | none}
[The Verdict line is derived mechanically, never judged: `ready` when every `[high]` C and R is held and no `[blocking]` question is open; otherwise `not ready`, listing each unheld `[high]` C or R and each open `[blocking]` Q. Held means a `Backlog:` line, or an `Out of scope:` line citing an accepted `D{n}`; an `Awaiting answer:` line holds nothing. Carried findings count like new ones. `(not run: ...)` names the gates the repository has that the tier left out, and is omitted when it left out none. The verdict speaks only for the checks tier that ran, the test run as stated and the review set; it never speaks for gates not run or files set aside. Then, in prose: what was reviewed against which baseline; the shape of the remediation; what remains open. The prose keeps the two axes apart: `[high]` on a C or R decides the merge, while every C and R, `[low]` included, is remediated by default unless listed under Outside the remediation, and an O is elective. States nothing the body does not; cites D, never restates.]

## Scope

Bare ids are this report's own; `{file}#{id}` names another report's; D{n} are decisions.md entries, whose current status governs. Ids are record keys: keep them out of code. Every Correction and Risk is remediated by default and every Opportunity is elective, except the findings listed under Outside the remediation. On a Correction or Risk, `[high]` must change before merge unless an accepted entry holds it, and `[low]` is elective; an Opportunity is elective whatever its weight; weight on an Insight is observational. Insights and Confirmed findings need no disposition; a Confirmed finding is a regression guard: keep what it confirms.

[What was reviewed: the subject, the review set, any framing or selection change the user set in the trailing text. The baseline is read as settled, not re-adjudicated. A binding choice is a D: cite it.]
### Outside the remediation
Backlog:
- {finding id} -- D{n}
Out of scope:
- {finding id} -- {reason}[ (D{n})]
Awaiting answer:
- {finding id} -- Q{n}
[One line per exception, each C, R or O at most once here; omit an empty group. `Backlog:` cites the `Defer:` entry holding the finding: an existing one it matches, or one this run appended, whose heading cites `{this report's filename}#{id}`. A `[high]` C or R goes under `Out of scope:` only with the accepted `D{n}` that sets it aside (a ratifying answer, for one); a bare reason serves only a `[low]` one or an O. `Awaiting answer:` names the open question the finding waits on.]

## Open items

### Open questions

Q{n} [blocking|deferrable] -- {question, with the context needed to answer it, every sub-question kept; the findings it bears on; the decision it depends on, restated; any options, the recommended one marked with why} Owner: {owner}.
Q{n} [blocking|deferrable] [Resolved] -> D{m}
Q{n} [blocking|deferrable] [Resolved] -- {question} -> D{m} (moot)
Interview: {declined | cancelled | failed}; {N} questions unresolved.

[One physical line per question, blocking first; nothing else in the block. Questions live only here: a finding never carries one, and cites it with `Follows: Q{n}`. A saved line never moves: an answer reduces it to its pointer; a moot line keeps only its question and pointer. No `Answer:` lines and no Clarifications section. Owners: `user`, `sibling ({role})` (written in this plain form), `third party ({role})`; never "later", "the implementer", "a probe" or "backlog". `[blocking]`: a `[high]` finding's fix, or whether it is a defect at all, turns on the answer; `[deferrable]`: remediation may follow the recommended option. Typical questions: ratify or restore, where code departs from an accepted entry and the departure may be intended; evidence against an owner's answer, or against a direction entry this kind of review did not write; and, while `[high]` C or R findings are unheld, one `[deferrable]` `user` question naming them: fix them before merge (recommended), or defer or ratify named ones, each with its reason and, for a deferral, a revisit trigger (the findings it names stay in the remediation, with no `Awaiting answer:` or `Follows:` line for it; an answer appends one owner-answer entry, the question line's pointer, recording which named findings it defers or ratifies (none, for a fix answer), plus one `Defer:` entry per deferred finding). `Interview:` only after a declined, cancelled or failed interview. With no Q line at all, the H3 is omitted and `None.` stands in its place.]

## Premise challenge

- {coverage: a set-aside file that needs review, or a seam or risk signal no owner held | calibration: preference stated as a defect, weight inflation, a finding reopening a settled matter, an over-built fix, a suspected false positive, records that disagree on a claim, a weight or kind that would move a finding across the merge bar} -- {adopted: {ids or plan rows it changed} | not adopted: {reason}}

[Every sceptic challenge appears; if the sceptic could not finish, say so.]

## Findings
### Correction
C{n} [high|low][ (not re-examined)] -- {what the code, test or document does or claims} is wrong; {what holds instead}. Evidence ({probe[ in {environments}] | chain | inspection}): {anchors}[; probe: {workings path}]
- Where: {path:line[-line]}[, ...]
- Bears on: {D{n} | {file}#{id}} -- {the decision or requirement, restated in a clause}
- Fix: {illustrative change, bounded to the defect; the assumptions it rests on}
- Check: {how a fixer confirms the fix: a test, a re-run probe, a command and its expected result}
- Follows: Q{n}
### Risk
R{n} [high|low][ (not re-examined)] -- {hazard in realistic use, and where it bites}. Evidence ({...}): {...}
### Insight
I{n} [high|low][ (not re-examined)] -- {...}. Evidence ({...}): {...}
### Opportunity
O{n} [high|low][ (not re-examined)] -- {...}. Evidence ({...}): {...}
### Confirmed
V{n} -- {what was verified and why it needs no change}. Evidence ({...}): {...}
[The first line of every finding is id-led and self-contained, its Evidence clause on it, a bulleted finding's included; its other clauses follow as bullets. Ids are unique, never rebound, numbered per kind and continued above the prior's highest. Weights, for this kind:
- C and R: `[high]` must change before merge unless an accepted entry holds it. It spans critical-class (the delivery fails its purpose, or data, security or integrity is exposed), high-class (incorrect behaviour or data loss in realistic use) and moderate-class findings (a real defect, or drift that misleads, with bounded impact). A failing battery gate or subject gate at the reviewed state is a `[high]` C. So is a test the shared test run reports failing at the reviewed state that fails again when rerun alone; one that passes alone is weighted by its owner from what makes it fail, never left unweighted. `[low]` is elective: minor-class (cosmetic, stylistic, low impact).
- I: observational; `[high]` changes how the delivery should be read.
- O: always elective; `[high]` marks a large payoff.
- V: unweighted.
Evidence classes, strongest first: `probe` (an executed command with its exact result kept at the cited workings path; a behaviour claim holds only for the environments its probe ran in, and where the project supports others its id-led line reads `Evidence (probe in {environments})`, a merge keeping the narrowest scope), `chain` (a file:line chain at `Grounded at:`), `inspection` (a reading whose anchor was checked at `Grounded at:`). A finding with no anchor reads "Assessment: {basis}" in place of "Evidence (...):". `Where:` anchors resolve at `Grounded at:`, except on a `(not re-examined)` finding, whose anchors are its prior's; required on C and R, optional elsewhere (on V it marks what the guard protects). C and R carry `Fix:` and `Check:`; an O or I proposing a change carries both too, and every `Fix:` has its `Check:`. `Bears on:` restates the decision or requirement in the finding itself, since a reader may hold only this report; code departing from an accepted entry is a C or R bearing on it. `Follows:` only where the fix waits on a question. Another report's ids, and a record's in `workings/`, are cited `{file}#{id}`. Probe narrative stays in `workings/`, cited by path. No finding is attributed to a reviewer. `(not re-examined)` marks a finding carried from the prior without re-examination -- outside this run's review set, or carried unchanged because no file in its evidence chain changed: it keeps its prior status, weight and anchors and is never read as verified at this `Grounded at:`. Omit an empty category.]

## Coverage
Review set: {n} of {m} subject files selected, {k} set aside[; repeat review: files changed since {prior's Grounded at} plus files the prior's findings cite | ; full review, as asked | ; full review: the prior's commit {sha} cannot be read]
Selection: classifier rules read in place; git {version}; attributes from {the pinned tree | none: {why}, no attributes resolved per path, attribute-based exclusions not applied[; every set-aside kept in, flagged: {trigger}]}; overrides: {owner additions and removals | none}[; added by adopted coverage challenge: {challenge id} -- {paths}[, ...]]; plan record: {workings path}
Load: {total} lines across {n} slices against a per-slice limit of {limit} (diff-first; disclosed, not capped)
- {slice} -- {owner role} -- {n} files, {lines} lines -- depth {diff first | whole: {why}}[ -- read in parts]
Set aside:
- {path} -- {family}: {evidence}
Flagged:
- {path} -- kept: {reason}
Instruction text: {paths routed to the skill-text lens, each with how it was detected: seed | package | closure | residual: {why} | none found}
Not examined:
- {area, selected path, environment or lead} -- {reason}
Beyond slices:
- {owner role} -- {paths read beyond its slice}
Dropped:
- {claim} -- {refuting evidence}

[Mandatory, every line present; a group with nothing to list reads `none` on its label's line. `Set aside:` lists every set-aside path on its own line with its reason; set-aside files may have been read as edge targets, never reviewed. `Flagged:` lists files kept in with a classifier flag or warning. `Not examined:` names anything in the review set no owner read, every supported environment left unprobed with no mechanism shown, and every lead landed there, each with why. `Dropped:` lists every claim verification refuted and every lead refuting evidence closed. Load is measured diff-first, per file section of the diff, headers included: an added file counts whole, a modified file its patch lines; reads beyond a slice are disclosed, not budgeted. The full per-file table stays in the plan record.]

## Changes from prior

Carried unchanged: {ids | none}
Not re-examined (outside this review set): {ids | none}
- {id} -- {re-verified: its evidence chain changed; it holds as stated | narrowed: {what remains} | resolved -> {D{n} | V{n}} | retired: {reason}} -- {evidence}

[Only when `Prior:` names a file. Accounts for every id of the prior and nothing else. Carried unchanged: a prior finding inside the review set is carried unchanged only when no file in its evidence chain changed since the prior's `Grounded at:`. One whose chain changed is re-verified at this `Grounded at:` and gets a bullet as it now stands; `re-verified` carries it with the same meaning and its anchors updated. Not re-examined: prior ids outside this run's review set (another subject, or outside a repeat review's set), carried at their prior status. Both groups are marked `(not re-examined)` on their finding lines. A fixed finding resolves `-> V{n}`, the Confirmed entry recording the fix's evidence; one superseded by a `D{n}`, a later finding or a scope change is retired; carried wins unless the other side cites evidence. Problems the remediation introduced are new findings. Earlier reviews of other kinds named in the trailing text are leads, never ids accounted for here.]

## Run record

Route: {orchestration facility | direct subagents}[, in {n} waves]
Override: {the user's override verbatim | none}
Team:
- {role and what it owned} -- Tier-{n} -- {resolved model} -- effort {level | inherited | default}[ -- {why it departs from the tier's baseline, or the override or cap that changed it}]
Rationale: {one line}; sizing in the plan record
Test run: {{command summary} in {isolated copy}, {result}; basis {selected test files | selected test files plus tests mapped to the selected source by {the instructions | the runner's map | the runner's related-test mode}}[; widened by adopted coverage challenge {ids}: {tests added}, {result}] | not run: {--checks skip | redundant under full | no test the selected set touches}}
Verification: {n} adversarial outcomes ({n} upheld, {n} narrowed, {n} refuted); {n} anchor checks at {Grounded at} over {the anchor forms checked}; outcome lines in {workings path}
Revision pass: {n} findings, {m} applied; draft and findings in {workings path}
Not verified: {what could not run, and the ids it leaves open or marked (unverified) | none}
External state: {none | one entry per resource: {resource} -- {authorised use} -- residue {what remains | none}}
Workings: {path}

[Always the last section.]
