---
name: scope-implement
description: "Delivers a workstream's current scope report -- implements its scope envelope, or remediates its closing review's stages -- carrying every stage through design, implementation, integration and verification as a multi-agent run that commits and pushes a feature branch and leaves a handoff beside the decision log. Requires --ws. Not for a plan published as a GitHub issue (/ace:plan-implement)."
argument-hint: "--ws <path | name | slug> [--model <name or instruction>] [<consultation answers file> ...] [instructions]"
disable-model-invocation: false
---
# Scope implement

Act as the orchestrator that delivers a workstream's current scope report -- its envelope (implementation) or its closing review's remediation stages (remediation) -- through design, implementation, integration and verification to verified, committed and pushed work.

Use the `Workflow` tool to run the agents where it is available; otherwise spawn subagents directly.

Read first; this file states only its deltas:

- `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/workstream-conventions.md` -- this skill uses the **find-only** resolution variant.
- The ws's `decisions.md`, once the ws is resolved: the header, then every entry, confirming the read reached the last.
- `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/orchestration.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/detect-harness/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/verification-checks.md`

## Usage

- `--ws` is required; without it, say so and stop. `--model` per orchestration.md. Input files are consultation answers.
- Trailing text steers the run: the owner's preferences, withheld commits or pushes, or a requested live pass, which authorises the use it names. How to build, test and reach a running system comes from the repository's agent instructions and development docs and from the trailing text; each assignment carries what its agent needs.
- Invoking this skill authorises its commits and pushes, overriding a repository's default rule against committing, unless the trailing text withholds them.

## Workstream and mode

- M1 **Workstream.** Once the spawn confirmation in orchestration.md's `## Route` passes, resolve `--ws` (find-only). Read `inputs.md`, `decisions.md` and the current reports.
- M2 **Mode** (current per the conventions' `## Reports over time`): a current closing review is the brief, for remediation -- with no remediation stages, there is nothing to deliver; otherwise a current envelope is the brief, for implementation. A discovery sweep alone, or neither, is no brief: say so and point to `/ace:scope-envelope --ws {ws}`. Ask when the state is ambiguous.
- M3 **Earlier work.** Look in the step folders (`workings/implementation*`, `workings/remediation*`), then search the rest of `workings/`, outside the folders of the steps that wrote reports, for the brief's filename, reading hits that cite its stages (as `{brief file}#S{k}`, or in a record naming the brief). Earlier runs kept records flat or elsewhere, so a missing folder or handoff proves nothing.
  - **Done:** a step handoff (`handoff.md` in a delivery step's folder or flat in `workings/`, from any run) naming the brief, not `Status: partial`, that accounts for every gate clause as met, unverified with an owner, or held by an accepted `Defer:`. Say so and name the next step per Close; nothing is re-run. It outranks any state record.
  - **Resume:** this skill's own unfinished `state.md` for the brief (its `Run:` line names this skill) is continued.
  - **Other records** -- another run's state, notes, partial handoffs, delivery claims -- are evidence, re-verified at the current state before anything leans on them; this run keeps its own records beside them.
  - A newer brief (an envelope's `-2`, a repeat closing review) starts a new run of the step.
- M4 Mode, done and no-brief exits ask nothing after resolution and write nothing.
- M5 **Step folder:** `workings/implementation/` or `workings/remediation/`; when another run's records occupy it, the next free `-2`, `-3` beside it.

## The brief

- Each stage reaches its agents as the stage packet the brief's Stages paragraph defines, which also sets the bar; merge, split, reorder or parallelise stages as the work warrants. Agents get the resolved ws path, not a report's `Workstream:` line.
- A pre-check of the gate clauses against the starting state decides only what needs building. Gate evidence is taken on the delivered tree: a clause met before building, `(holds today)` included, is verified again after the last change that could affect it.
- Open items: a still-open `[blocking]` question holds the stage that owns it -- ask the owner (the conventions' questions outside the interview) or wait for a sibling's answers, working on independent stages meanwhile; never deliver against a guess. Under an open `[deferrable]` question, text marked `(follows Q{n})` stands and the handoff names it. A stage settles the questions it owns, unless an answer would change the scope, a goal or an accepted decision, or the report says the stage escalates it: then it is the owner's.
- Implementation: `## Input coverage` and the out-of-scope `X{n}` bound the deliverable with the goals. Consultation answers are given as input or found by an open `Exchange:` id of the envelope, in the ws or at the sibling-exchange protocol's save path (`.ace/reports/*-agent-consultant-{8hex}.md`); the latest `Date:` wins. A fact is evidence for its dependent stage (the state record names the facts each stage relied on); a choice goes to the log with Source `{answers file}, direction`, its Context naming the exchange id and each `{report file}#Q{n}` answered; a preference goes to the owner.
- Remediation: the remediation stages are the deliverable; backlog stays deferred, and a take-up is a log entry flipping its `Defer:` (one the owner chose, only on the owner's answer); Conformance and the file-collision matrix inform the work and its file ownership. All of `decisions.md` binds, not only the review's `Decisions:` line. The delivered set is the review's `Delivered:`, located by content, since squash merges and rewrites defeat ancestry; an implementation handoff for the baseline adds its branch and open items.
- Drift: before the handoff, look for changes since the brief's `Grounded at:` to the files this ws delivered, made outside its runs; another workstream's change is drift only where it contradicts an accepted entry or a gate clause. Drift is remediated only where it makes a gate clause fail, a clause relative to existing behaviour being judged against the state the run starts from. Other drift goes to the run's records and the handoff's open items, with any `Defer:` whose trigger has fired, for the next closing review: no log entry, no question.

## Decisions

- Only the orchestrator appends, at the header's timing (with no interview step here, the current seed's is as each is taken), re-reading the highest number first; each entry states its evidence in Context. Owned questions and assumptions the run settles are recorded in `gates.md`, with a log entry only where the header's bar puts one. Below-bar choices and reasoning stay in the step folder; no other record holds decisions.
- When the first entry is due and the ws's header (the text above `## Decisions`, line endings aside) differs from `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/decisions-template.md`'s, ask once: replace it with the current seed (recommended: entries go in as taken), or keep it. The header is not an entry, so append-only holds; keep the file's line endings. Record the choice in the state record and the handoff; a resumed run does not ask again. A kept header governs as written; if it appends in one go, the state record holds pending entries until the run appends them before it stops.
- Evidence against an owner's answer: ask the owner in session when reachable; otherwise follow the answer and record the held change as a `Defer:`. Never deliver against an owner's answer.

## Delivery

orchestration.md applies, with these deltas:

- No report: no revision pass, `Grounded at:` or `Not verified:` line (the handoff discloses what could not be verified); the state record holds the allocation record; the brief's Stages paragraph replaces the template in team planning. Each assignment names the files it may write and the check outputs it may produce.
- Writers, fix loops and verifiers are not analysts; the analyst soft cap does not bind them. Tier defaults: sceptic Tier-1; designers Tier-2, or Tier-1 where judgement matters most; writers, fix loops and behaviour verifiers Tier-2; mechanical checks Tier-3.
- Sceptic angle: does each change meet its gate as behaviour, not in letter; is there a simpler change; is anything gold-plated or quietly dropped; does a fix regress another stage. The state record notes each challenge as adopted or not.
- Ownership: no two writers change one file at once, counting what their commands write (a generator, a formatter, a mutating verifier); regeneration and checkpoints are serialised; ownership transfers explicitly. Where the route offers per-agent isolation, a writer may work isolated; its changes join the feature branch before the checkpoint.
- Verification: each gate clause is verified as behaviour by executed evidence kept in, or pointed to from, the step folder -- a test exercising it, a probe or an observation; for file content or generated output, the command and its exact result; for how a reader acts on text, a fresh-context reader's trace, the reader given the text and its situation but never the gate or the intended outcome. Load-bearing claims get adversarial checks before a checkpoint. Difficulties are resolved within the initiative, not quietly deferred.
- Checkpoints: run by the orchestrator alone, writers paused, committing the tree its checks passed on, with the run's paths staged first where a check compares the tree with the index, and committed first where it compares with HEAD (pushed only once it passes); a writer fixes only what it owns and reports the rest. The battery is verification-checks.md's `cheap` tier at each checkpoint and `full` at final integration, derived over the run's changes and run on the integrated tree in the checkout, each result in the state record in its record grammar; where `full` resolves no gate, it runs `cheap`'s battery. A run that changes nothing has no checkpoint. A gate that fails only on files the run did not create and may not remove is recorded with that reason, never fixed by removing them. The completeness check before each checkpoint and before the handoff tests this file's gate, coverage, log, ownership and scratch rules.
- Scratch the run creates (probe copies, mutation scratch, captures, ad-hoc builds and logs) goes outside the checkout, or where the repository's instructions fix a tool's output; the project's checks run where the project runs them, and their usual ignored outputs are not residue. Removal and shared external state: orchestration.md's `## Probes and external state`.

## Live verification

- Planned only when a gate clause needs a running system's observed behaviour as evidence, or the trailing text asks for a pass; a check that drives an interface without a running system is a check, not a live pass.
- It waits until the implementation it observes is complete and the checks pass. The owner starts or authorises the running system; the run never starts or stops services on its own. With no instructions in the repository or trailing text, ask how to reach it; declined or unreachable, those claims stay unverified, owned by the owner, in the handoff.
- A requested pass adds evidence and never replaces a check; its defects go back through fixes and a further checkpoint.

## Git

- Settle the base before the pre-check: the branch carrying this ws's delivery while no default-branch commit carries that content -- a commit with the branch tip's tree, or with the patch-id of its combined diff from the merge-base, since squash merges and rewrites defeat ancestry; else the checkout's non-default branch if it carries nothing beyond the default branch and its name (some or all of the ws's slug words, abbreviated or not), upstream or the trailing text ties it to this ws; else the default branch's tip. If the brief relies on content its `Grounded at:` commit carries and the default branch lacks, ask the owner for the base. Check the base out from a clean tree before the pre-check, or with the owner's say-so. Never stash, discard or rewrite changes the run did not make.
- Commits go on the base in its first two cases; from the default branch's tip, a new branch is created at the first commit, named per the repository's conventions, else after the ws's slug. Commits never land on a branch carrying other work. Stage only run-owned paths, never bypass hooks, push each checkpoint. No force-push, merge, pull request or GitHub issue: follow-ups go to the handoff, and to a `Defer:` where direction-level.
- Workstream records are never committed, even where `.ace/` is not ignored; product and repository documentation is part of the delivery.

## Records

- `state.md`, current as the run progresses: it opens with `Brief: {report file}` and one `Run:` line per session (this skill; the harness detect-harness identified; the orchestrator's model id as the session's configuration reports it, else `unknown`; the date), then the base, starting commit and branch, assignments and ownership, accepted results, pending commands and entries, check results, evidence paths, next actions, and a pointer to `decisions.md`'s header for its rules, never an id range.
- `gates.md`: each gate clause `met -- {evidence path}`, `deferred -- D{n}` or `unverified -- {why}; owner: {owner}`, and each owned question or assumption with its settlement.
- `handoff.md`, on completion, or `Status: partial` when the run stops with work left; pointers only, no decision content:

```
Brief: {report file}
Status: complete | partial -- {what remains}
Run: {per session: harness, orchestrator model id, date}
Branch: {name}, pushed to {remote} | {name}, unchanged | none
Commits: {hashes or range} | none -- {commit where the gates were verified; the delivering commit, where found}
Gates: {n} met, {n} deferred, {n} unverified -- gates.md[; unverified: {S{k}.{m}} owner {owner}, ...]
Checks: {final result in verification-checks.md's record grammar} | none -- no change
Relied on: {(follows Q{n}) texts; consultation facts per stage; answers that only confirmed a fallback} | none
Decisions: {D ids this run appended; the header choice} | none
Open: {Defer D ids this run appended or whose trigger has fired; drift for the next closing review; residue} | none
Next: {command}
```

## Close

- Print the handoff path and status, each stage's outcome, the D ids appended, the remaining limitations (unverified clauses and owners, open items, residue), the branch and pushed commits (or none and why), and the next step.
- Next step: after a partial stop, `/ace:scope-implement --ws {ws}` resumes it. After implementation, `/ace:scope-review --ws {ws}`. After remediation, or with nothing to deliver: if a gate clause is left unverified (a deferred one is not), or the open items hold drift or a `Defer:` whose trigger has fired, the repeat closing review `/ace:scope-review --ws {ws}`; then, if the delivery's branch, at its current remote tip, carries content no default-branch commit carries (Git's tree or patch-id test; a branch gone from the remote carries nothing), `/ace:agent-code-review origin/{branch}`; with neither, the workstream's scope work is complete. On a done or nothing-to-deliver exit the delivery's branch and open items come from the found handoff, else the review's `Delivered:`, each condition judged read-only at the current state, and no handoff path is printed.
