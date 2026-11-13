---
name: scope-implement
description: "Delivers a workstream's current scope report -- implements its scope envelope, or remediates its closing review's stages -- carrying every stage through design, implementation, integration and verification as a multi-agent run that commits and pushes a feature branch and leaves a handoff beside the decision log. Requires --ws."
---
# Scope implement

**Invocation input:** `--ws <path | name | slug> [--model <name or instruction>] [<consultation answers file> ...] [instructions]`

Act as the orchestrator that delivers a workstream's current scope report -- its envelope (implementation) or its closing review's remediation stages (remediation) -- through design, implementation, integration and verification to verified, committed and pushed work.

As the orchestrator, spawn the agents directly as subagents (route: direct subagents) and use them dynamically through design, implementation, integration and verification. Before the first spawn, read `../scope-implement/orchestration-codex.md` for this route's mechanics.

Read first, after Usage's `--ws` check where Usage has one; this file states only its deltas:

- `../ws-shared/workstream-conventions.md` -- this skill uses the **find-only** resolution variant.
- The ws's `index.md`, once the ws is resolved, for orientation only (the conventions' `## Workstream index`).
- The ws's `decisions.md`, once the ws is resolved, read as the conventions' `## Decision log` says.
- `../ws-shared/orchestration.md`
- `../detect-harness/SKILL.md`

Copies this file shares with `../scope-report-triage/SKILL.md`, kept aligned and edited together, this file's copies canonical, each worded for its own skill: the three cases that settle the base -- the delivery branch while it carries content no default-branch commit carries, a tied non-default branch at the default branch's tip with the owner question where it is behind, and the default branch's tip; and how a check that needs a running system's observed behaviour waits for what it observes and the other checks, who starts or authorises that system, and what stays unverified.

## Usage

- `--ws` is required; without it, say so and stop. `--model` per orchestration.md. Input files are consultation answers.
- Trailing text steers the run: the owner's preferences, withheld commits or pushes, or a requested live pass, which authorises the use it names. How to build, test and reach a running system comes from the repository's agent instructions and development docs and from the trailing text; each assignment carries what its agent needs.
- An explicit request for this skill authorises its commits and pushes, overriding a repository's default rule against committing, unless the trailing text withholds them. Where the skill was chosen by inference from a looser request -- possible only where the harness allows implicit invocation -- confirm before the first commit.

## Step

What the conventions' `## Steps` leaves to this skill: open point, M5; read-only exits, M4; resume, M3's Resume; artefact: the handoff (`## Records`), input line `Brief:`, `Mode: implementation | remediation`, status field `Status:`.

## Workstream and mode

- M1 **Workstream.** Once the spawn confirmation in orchestration.md's `## Route` passes, resolve `--ws` (find-only). Read `inputs.md` and the current reports (the conventions' `## Discovery and currency`); `decisions.md` per the read-first list.
- M2 **Mode** (current per the conventions' `## Discovery and currency`): a current closing review is the brief, for remediation -- with no remediation stages, there is nothing to deliver; with no current closing review, a current envelope is the brief, for implementation. A discovery sweep alone, or neither, is no brief: say so and point to `$ace:scope-envelope --ws {ws}`. Ask when the state is ambiguous.
- M3 **Earlier work.** Read the step set (the conventions' `## Discovery and currency`) and any old-layout records, as the conventions' `## Old-layout workstreams` reads them; then search the rest of `workings/`, outside the folders holding a report's records, for the brief's filename, reading hits that cite its stages (as `{brief file}#S{k}`, or in a record naming the brief).
  - **Done:** a handoff for the brief -- the artefact of a scope-implement step whose `Brief:` names it, or an old-layout handoff that clause attributes to it -- not at `Status: partial`, that accounts for every gate clause as met, unverified with an owner, or held by an accepted `Defer:`. Say so and name the next steps per Close; nothing is re-run. It outranks any state record.
  - **Resume:** the highest-numbered scope-implement step whose state record names the brief, carries no `Stopped:` line, and whose artefact is absent or at `Status: partial` is continued (the conventions' `## Steps`). An unfinished old-layout run is never resumed (`## Old-layout workstreams`).
  - **Other records** -- another step's state, notes, partial handoffs, delivery claims, and old-layout records as that clause has them -- are evidence, re-verified at the current state before anything leans on them; this run keeps its own records in its own step folder.
  - A run for a newer brief (a later envelope, a repeat closing review) that opens takes a new step.
- M4 **Read-only exits**, beyond the conventions' shared ones (`## Steps`): no brief, nothing to deliver, done, a declined M2 question, and a declined or stop answer to a base question (M5). Apart from M2's question on an ambiguous state, which comes before every other exit, and the base questions, asked after them, they ask nothing after resolution; each takes no step and writes nothing (the conventions' `## Steps`).
- M5 **Open:** a run M3 does not resume opens its step, `workings/{nn}-scope-implement/` (the conventions' `## Steps`), once M3 has decided not to resume, `## Git`'s base questions -- case 2's proper-ancestor question, the question for the base where the brief relies on content the default branch lacks, and the owner's say-so for a tree that is not clean -- are answered, and the overlap question (`## Discovery and currency`), if asked, is answered proceed. The base is settled before the open and checked out, or fast-forwarded, after it, before the pre-check; the state record writes the base already settled. A resumed run keeps its step.

## The brief

- Each stage reaches its agents as the stage packet the brief's Stages paragraph defines; that paragraph's gate rules bind, and stages may be merged, split, reordered or parallelised as the work warrants.
- A pre-check of the gate clauses against the starting state decides only what needs building. Gate evidence is taken on the delivered tree: a clause met before building, `(holds today)` included, is verified again after the last change that could affect it.
- Open items: a still-open `[blocking]` question holds the stage that owns it -- ask the owner (the conventions' questions outside the interview) or wait for a sibling's answers, working on independent stages meanwhile; never deliver against a guess. Under an open `[deferrable]` question, text marked `(follows Q{n})` stands and the handoff names it. A stage settles the questions and assumptions it owns. A settlement that would change the scope, a goal, an accepted decision or a gate clause an owner's answer set, or that the report says the stage escalates, is the owner's; one that would change only what any other gate clause requires is a direction entry in the log.
- Implementation: `## Input coverage` and the out-of-scope `X{n}` bound the deliverable with the goals. Consultation answers are given as input or found by an open `Exchange:` id of the envelope, in the ws or at the sibling-exchange protocol's save path (`.ace/reports/*-agent-consultant-{8hex}.md`); where several answer one exchange, the latest `Date:` wins, and on a tie the owner decides. A fact is evidence for its dependent stage (the state record names the facts each stage relied on); a choice goes to the log in the header's form for consultation answers; a preference goes to the owner. An answer that only confirms a fallback the brief already names is no choice: it gets no log entry, and the handoff's `Relied on:` names it.
- Remediation: the remediation stages are the deliverable; backlog stays deferred, and a take-up is a log entry superseding its `Defer:`; Conformance and the file-collision matrix inform the work and its file ownership. All of `decisions.md` binds, not only the review's `Decisions:` line. The delivered set is the review's `Delivered:`, located by content; the delivery-record set (the conventions' `## Discovery and currency`) adds its records' branches and open items.
- Drift: before the handoff, compare the files this ws delivered as they stand now with the brief's `Grounded at:` tree, by content, not ancestry; a difference no artefact or step's records of this ws account for is drift, later commits on the delivery's own branch included. The delivery-record set's commits, a triage record's included, are recorded delivery, its baseline envelope being the brief (implementation) or the envelope the brief's `Baseline:` names (remediation), while another workstream's change is drift only where it contradicts an accepted entry or a gate clause. Drift is remediated only where it makes a gate clause fail, a clause relative to existing behaviour being judged against the state the run starts from. Other drift goes to the run's records and the handoff's open items, with any `Defer:` whose trigger has fired, for the next closing review: no log entry, no question.

## Decisions

- Entries follow the header's rules, timing and bar -- the current seed's where the next bullet replaces the header; the orchestrator is the one writer, pending entries are appended before any stop, and each entry states its evidence in Context. Owned questions and assumptions the run settles are recorded in `gates.md`, with a log entry only where the header's bar puts one. Below-bar choices and reasoning stay in the step folder; no other record holds decisions.
- When `decisions.md` is first read, compare the ws's header (the text above the `## Decisions` heading line, its `Seed:` line, blank lines and line endings aside) with `../ws-shared/decisions-template.md`'s. Versions compare as semantic versions, component by component; a `Seed:` line without one counts as absent. Where they differ and the ws's `Seed:` version is absent or lower than the template's, the current seed governs the run, and it replaces the header when the first entry is due, keeping the file's line endings and a copy of the replaced text in the step folder. Where they differ otherwise -- an equal `Seed:` (an owner's edit) or a higher one (a stale plugin) -- keep the header and follow it. Once the run keeps a state record, say which there. The header is not an entry, so append-only holds; replacing an older-seeded one supersedes the conventions' rule that a ws's own header governs its log.
- Evidence against an owner's answer: ask the owner in session when reachable; otherwise follow the answer and record the held change as a `Defer:`. Never deliver against an owner's answer.

## Delivery

orchestration.md applies, with these deltas:

- No report: no interview, revision pass, `Grounded at:` or `Not verified:` line (the handoff discloses what could not be verified); the state record holds the allocation record; the brief's Stages paragraph replaces the template in team planning. Each assignment names the files it may write and the check outputs it may produce, and has its agent stop and return, building nothing meanwhile, where a change would alter the scope, a gate clause, a goal or an accepted decision; the orchestrator settles a returned change as the Open items bullet says.
- Writers, fix loops and verifiers are not analysts; the analyst soft cap does not bind them. Tier defaults: sceptic Tier-1; designers Tier-2, or Tier-1 where judgement matters most; writers, fix loops and behaviour verifiers Tier-2; mechanical checks Tier-3.
- Sceptic angle: does each change meet its gate as behaviour, not in letter; is there a simpler change; is anything gold-plated or quietly dropped; does a fix regress another stage. The state record notes each challenge as adopted or not.
- Ownership: no two writers change one file at once, counting what their commands write (a generator, a formatter, a mutating verifier); regeneration and checkpoints are serialised; ownership transfers explicitly. A writer fixes only what it owns and reports the rest. Where the route offers per-agent isolation, a writer may work isolated; its changes join the feature branch before the checkpoint.
- Verification: each gate clause is verified as behaviour by executed evidence, its output kept whole in the step folder (or pointed to where the repository's instructions place it) -- a test exercising it, a probe or an observation; for file content or generated output, the command and its exact result; for how a reader acts on text, a fresh-context reader's trace, the reader given the text and its situation but never the gate or the intended outcome. Load-bearing claims get adversarial checks before a checkpoint. Difficulties are resolved within the initiative, not quietly deferred.
- Checkpoints: run by the orchestrator alone, writers paused. A run that changes nothing has no checkpoint.
  - Battery: `../shared/verification-checks.md`'s (read before this session's first checkpoint) `cheap` tier at each checkpoint and `full` at final integration, derived over the run's changes and run on the integrated tree in the checkout, each result in the state record in that file's record grammar, its output beside it; where `full` resolves no gate, it runs `cheap`'s battery, recorded with the `(full: no gate resolved)` suffix.
  - Commit: the tree the checks passed on, with the run's paths staged first where a check compares the tree with the index, and committed first where it compares with HEAD, pushed only once it passes. A check that fails after such a commit is fixed in a further commit; a commit is never amended.
  - A gate that fails only on files the run did not create and may not remove is recorded with that reason, never fixed by removing them.
- Completeness: before each checkpoint and before the handoff is written, a completeness check tests this file's gate, coverage, log, drift, ownership and scratch rules, its result in the state record.
- Scratch the run creates (probe copies, mutation scratch, ad-hoc builds; never the evidence output kept in the step folder) goes outside the checkout, or where the repository's instructions fix a tool's output; the project's checks run where the project runs them, and their usual ignored outputs are not residue. Removal and shared external state: orchestration.md's `## Probes and external state`.

## Live verification

- Planned only when a gate clause needs a running system's observed behaviour as evidence, or the trailing text asks for a pass; a check that drives an interface without a running system is a check, not a live pass.
- It waits until the implementation it observes is complete and the checks pass. The owner starts or authorises the running system; the run never starts or stops services on its own. With no instructions in the repository or trailing text, ask how to reach it; declined or unreachable, those claims stay unverified, owned by the owner, in the handoff.
- A requested pass adds evidence and never replaces a check; its defects go back through fixes and a further checkpoint.

## Git

- Settle the base before the pre-check, taking the first case that applies:
  1. The branch carrying this ws's delivery (the delivery branch (the conventions' `## Hand-off loop`), or named by this ws's state records or by the review's `Delivered:`), while it carries content no default-branch commit carries (the conventions' default-branch test, `## Hand-off loop`).
  2. The checkout's non-default branch, when its tip is the default branch's tip and its name (some or all of the ws's slug words, abbreviated or not), upstream or the trailing text ties it to this ws. A tied branch whose tip is a proper ancestor of the default branch's tip is a question to the owner: fast-forward it (it is then this case), or start from the tip on a new branch (case 3). Any other tied branch whose content a default-branch commit already carries is left as it is.
  3. The default branch's tip.
- If the brief relies on content its `Grounded at:` commit carries and the default branch lacks, ask the owner for the base. Check the base out from a clean tree (an uncommitted change under the workstream records, `.ace/ws/`, which no run commits, aside) before the pre-check, or with the owner's say-so. Never stash, discard or rewrite changes the run did not make.
- Commits go on the base in cases 1 and 2; in case 3, a new branch is created at the first commit, named per the repository's conventions, else after the ws's slug, suffixed `-2`, `-3` where that name is taken. Commits never land on a branch carrying other work. Stage only run-owned paths, never bypass hooks, push each checkpoint. No force-push or merge, and no GitHub write (the conventions' `## Workstream`): follow-ups go to the handoff, and to a `Defer:` where direction-level.
- Workstream records are never committed, even where `.ace/` is not ignored; product and repository documentation is part of the delivery.

## Records

- `workings/{nn}-scope-implement/state.md`, the state record (the conventions' `## Steps`), current as the run progresses: after its opening lines (`Brief: {report file}`, then the `Run:` lines), the base, starting commit and branch, assignments and ownership, accepted results, pending commands and entries, check results, evidence paths, next actions, and a pointer to `decisions.md`'s header for its rules, never an id range.
- `workings/{nn}-scope-implement/gates.md`: each gate clause `met -- {evidence path}`, `deferred -- D{n}` or `unverified -- {why}; owner: {owner}`, and each owned question or assumption with its settlement.
- The handoff, `{nn}-scope-implement.md` in the ws root, is the step's artefact (the conventions' `## Steps`), of mode implementation or remediation (M2); it is written on completion, or at `Status: partial` when the run stops with work left; pointers only, no decision content. Its shared fields keep the conventions' header order (`## Steps`), whose header bullet says why its input line is `Brief:` and when `Checks:` reads `none -- no change`:

```
# Scope implement

Date: {yyyy-MM-dd}
Brief: {report file}
Mode: implementation | remediation
Status: complete | partial -- {what remains}
Decisions: {D ids this run appended | none}
Next: {the next step(s) Close printed, as printed, in print order | pending}
Run: {per session: harness, orchestrator model id, date}
Workings: workings/{nn}-scope-implement/ -- state.md, gates.md
Branch: {name}, pushed to {remote} | {name}, not pushed -- {why} | {name}, unchanged | none
Commits: {each commit the run made, electives included, by hash, oldest first, comma-separated, never a range, as git's A..B omits A | none} -- {the commit the last checkpoint passed on | no change | commits withheld | pending}[; electives: {hashes, oldest first, comma-separated}]
Gates: {n} met, {n} deferred, {n} unverified -- workings/{nn}-scope-implement/gates.md[; unverified: {S{k}.{m}} owner {owner}, ...]
Checks: {final result in verification-checks.md's record grammar} | none -- no change | pending
Relied on: {(follows Q{n}) texts; consultation facts per stage; answers that only confirmed a fallback} | none
Open: {Defer D ids this run appended or whose trigger has fired; drift for the next closing review; residue} | none
```

`Commits:` reads `none -- pending` on a write before the run's first commit, and `Checks:` reads `pending` on a write before its first checkpoint.

## Close

- After a delivering run, print the handoff path and status, each stage's outcome, the D ids appended, the remaining limitations (unverified clauses and owners, open items, residue), the branch and pushed commits (or none and why), and the next steps.
- Next steps: the conventions' `## Hand-off loop` edges for the case that applies, in that section's form, written on the handoff's `Next:` as printed. This run judges the case:
  - after a partial stop: the partial edge, which resumes this step;
  - after implementation: the implementation edge;
  - after remediation, or with nothing to deliver: the closing-review rule, which names the records it reads.
- On the done and nothing-to-deliver exits, print why the run stopped and the next steps only. On a done exit the case is the found handoff's mode, and the closing-review rule reads that handoff as the remediation run's own.
