---
name: ace-agent-consultant
description: Answers a cross-repository consultation request as the consultant side of the sibling-exchange protocol -- spawns one to four researchers plus a sceptic to research this repository's capabilities, contracts, and intent, and produces a self-contained answers report the user carries back to the requesting repository by hand. Use when a request envelope, a pack report carrying routed open questions, or a question set from a sibling repository needs answering.
argument-hint: "[--model <name or instruction>] [--agents 1-4] [--publish yes|no] <request-file|issue-number> [grounding-files ...] [instructions]"
disable-model-invocation: false
---
# Answer a cross-repository consultation request

## Usage

- `/ace-agent-consultant` -- uses the most recent request envelope or actionable question set pasted in conversation context
- `/ace-agent-consultant <file1> <file2> ...` -- reads files as the request: a request envelope, any pack report carrying open questions, or a hand-written question list; further files are grounding context
- `/ace-agent-consultant <issue>` -- uses the specified issue number (e.g., `85`) as the request
- `/ace-agent-consultant [--model <name or instruction>] [--agents 1-4] [--publish yes|no] <inputs ...>` -- flags first (in any order), positional second
- `--model` directs model selection for every researcher (sceptic included) -- a model name or a prose instruction (a tier, a mix, a reference), resolved against the models the harness offers. Omit `--model` to let Phase 4 assign per agent: the sceptic on Tier-2, researchers on Tier-3, plus at most one Tier-2 promotion for a direction-setting question.
- `--agents N` sets the number of **non-sceptic** researchers (`1-4`). The sceptic is always added on top. Omit `--agents` to auto-size from the question set.
- `--publish yes|no` -- publish the saved report as a GitHub issue (Phase 9, after the final save). Default `no`, diverging from the `yes` default of `/ace-agent-arch-review` and `/ace-agent-pre-planner`: the report's consumer sits in the requesting repository and receives it by hand-carry per `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/sibling-exchange-protocol.md`, so an issue minted here is invisible where the answers are needed. Publish on demand when this repository wants its own durable record -- e.g. complementary proposals worth tracking locally.
- Text after the last valid file path or issue number is passed to all researchers as additional instructions; it may direct a per-member model mixture in prose (e.g. `use a mixture of Tier-1 and Tier-2`; Phase 4).

## Context

The consultant side of the cross-repository exchange defined in `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/sibling-exchange-protocol.md`. A session in a sibling repository has routed questions here because their answers depend on this repository's actual capabilities, contracts, or intent -- this repository is the best-positioned party to settle them. The skill researches this repository and produces a self-contained answers report the user carries back by hand; the transport assumption (no shared filesystem, no cross-repository access, ever) and the self-containment rule are the protocol's, and they bind every phase below.

Every answer serves one of two goals, and says which:

1. **Establish the implementation fact** -- targeted code research in this repository: what exists, what its shape and contract are, with anchors (paths, modules, seams) as evidence. Facts name their verification per the pack's probe-versus-inspection standard.
2. **Advise from knowledge** -- reason from what is known about systems of this shape: when a question weighs development directions that hinge on this repository's choices, state which choice this side favours and what it would take, labelled as assessment with the trade-off stated.

A question this repository cannot settle is a first-class outcome, not a failure: the answer says so, states what is missing, and routes it back rather than speculating. A question resting on a false premise about this repository is answered by correcting the premise first -- the corrected answer is worth more than a literal one.

Like `/ace-agent-scope` and `/ace-agent-pre-planner`, this skill takes no `--prior` flag: the protocol's self-containment rule makes each round independently actionable, so a follow-up round arrives as a fresh request envelope and any prior-round files ride along as ordinary grounding inputs.

## Task

Nine phases executed in order.

### Phase 1 -- Extract the request

Pre-pass: strip leading `--model {value}`, `--agents {value}`, and `--publish {value}` flags. They may appear in any order, before the positional arguments.

- `--model` value, when supplied, directs model selection for every researcher (sceptic included). The value is prose carrying model information -- a model name, a tier, a mix, a reasoning-effort hint, or a reference to such information (e.g. `--model Tier-3`, `--model use a mixture of Tier-1 and Tier-3`). There is no accepted-values list and no unknown-value parse error: Phase 4 reads the value as an instruction and resolves it against the models available in the current harness. The value boundary is judged, not parsed: unquoted multi-word values are well-formed, and the executing agent judges where the model directive ends and the positional arguments begin, exactly as it judges any other prose instruction; quoting can disambiguate a genuinely ambiguous boundary but is never required. A missing value (nothing after `--model` readable as model guidance) is a parse error: report it and stop. If `--model` is omitted, Phase 4 assigns each researcher's model. Model guidance may equally arrive in the additional instructions (e.g. "a mixture of Tier-1 and Tier-3"): Phase 4 honours both the same way, as a per-researcher assignment recorded in the report's researcher surface. (The rule is shared with `/ace-agent-pre-planner`, `/ace-agent-arch-review`, `/ace-agent-code-review`, and `/ace-agent-scope` Phase 1; each command records the assignment in its own report's analyst surface -- a deliberate per-skeleton divergence, not drift.)
- `--agents` value is an integer `1-4` and sets the number of non-sceptic researchers. If `--agents` is present but its value is missing, non-integer, or outside `1-4`, report the valid range (`1-4`) and stop. If omitted, Phase 4 auto-sizes from the question set.
- `--publish` value defaults to `no`; accepted values `yes|no`. If the value is missing or unknown, report the valid values and stop. Drives Phase 9.

Main pass: apply the argument rules below to the remaining tokens.

- **File paths provided** -- test each whitespace-delimited token as a file path in order. The first token that does not exist as a file ends the file list -- that token and everything after it is passed to all researchers as additional instructions. A token that exists but is not readable is an error: report it and stop (do not fold it into additional instructions). Read each valid file in full; Phase 2 classifies them.
- **Issue number** -- if the first token is not a valid file path but is numeric, treat it as a GitHub issue number. Fetch via:

  ```bash
  gh issue view <number> --json title,body,state,comments
  ```

  Parse JSON output: present title, body, and comments chronologically with author and timestamp. The issue body forms the request; comments provide additional context. Tokens after the issue number are tested as file paths exactly as in the file-path branch (each readable file is an additional input, listed in the report's `Source:` field alongside `issue #N`; the first non-file token ends the list and becomes additional instructions; an unreadable file is an error). Only one issue number is supported per invocation; subsequent numeric tokens are passed as additional instructions.
- **No arguments** -- identify the most recent request in conversation context: a pasted `# Consultation request` block, a `Q{n}`-grammar question list, or an actionable message asking what this repository can do. Quote it verbatim as the request.

After the main pass, warn when any residual token matches `^--` (a misplaced flag would otherwise fold silently into the additional instructions), and when a residual token looks like a path (contains `/` or ends in `.md`). Warn only, do not stop: additional instructions may legitimately contain paths.

If the first token does not exist as a file and is not numeric, check conversation context: when a request exists there, treat it as the request per the no-arguments rule and pass the entire argument text as additional instructions. When no request exists in context either, report this and stop.

### Phase 2 -- Resolve the question set

Classify the inputs, most specific first:

1. **Request envelope** -- an input whose first non-blank line is `# Consultation request`, or whose first 25 lines carry an `Exchange:` line without a `Type:` header. (A response envelope also carries `Exchange:` -- its `# Consultation answers` H1 and `Type: consult` header distinguish it; a prior-round answers report is always grounding, never a work order.) The envelope is the work order: parse `Exchange:`, `Requester:`, `Consultant:`, `Source:`, the `## Context recap`, and the `## Questions` block (`Q{n} [blocking|deferrable] -- {question}` lines with indented continuation lines). Every other input is grounding context, read in full and uncapped -- when the requester also supplied its source report, the report grounds the research but the envelope's question set remains the work order.
2. **Pack report with open questions** -- a scope envelope, pre-planner report, or arch-review report (first non-blank line `# Scope envelope`, `# Pre-plan analysis`, or `# Architectural review`, or a matching `Type:` line in the first 25 lines): extract the unresolved lines from its `### Open questions` block, skipping `[Resolved]` lines and the `Interview:` marker line. When any line carries `[Routed]`, the routed lines alone are the question set -- they are what the requester sent here; otherwise every unresolved line is. A code-review report (`# Agent code review report` / `Type: code-review`) contributes its unresolved `[Question]`-prefixed findings instead.
3. **Hand-written or pasted question list** -- degrade gracefully: extract `Q{n} [tag]`-grammar lines when present; otherwise enumerate the question-like statements in order. Never require the source to be a pack artefact.

Identifier rule (protocol): preserve upstream `Q{n}` identifiers verbatim; where none exist, number the questions contiguously in input order and record in the report that the identifiers were minted by this run. Priority tags travel verbatim when present; a question without one stays untagged. Resolve the exchange id and round: from the envelope's `Exchange:` line, echoing its round; else from a `Routed: {8hex}, round {k};` line in a pack-report input (round 1 when the line names none); else mint the id in Phase 4 at round 1 and mark the report's `Exchange:` line `(minted on response)`.

**Jurisdiction.** Classify each question: **answerable here** (this repository's code, contracts, capabilities, or plans can bear on it) or **not answerable here** (it concerns the requester's own internals, a third system, or a preference call on the requester's side). Not-answerable questions skip the research and land in the report as `cannot-settle` entries with a one-line reason -- a first-class outcome. A question unintelligible without counterpart context the recap does not supply is likewise `cannot-settle`, with "request not self-contained" as the stated missing thing -- never guessed at; the push-back is the protocol's enforcement hook and is what keeps recaps honest across rounds. When no question is answerable here, skip Phases 4-5: the orchestrator writes the short report directly (every entry `cannot-settle` with its reason) -- "this repository cannot help, and why" must still survive transport as a saved report.

If no questions can be extracted from any input, name the input, say why, and stop.

### Phase 3 -- Ground and explore

**Grounding paths (adjust per repository -- the only project-tuned lines in this file).** The convention is replicated across projects; a port adjusts this block only:

- Preferred: `.ace/specification/sys-reports-collated/system-specification-collated.md`
- Fallback: `.ace/specification/sys-reports-project/system-specification-project.md`

1. **Resolve the grounding source.** Use the preferred file when it exists, else the fallback, else none. Never read both. The specification is orientation (the whole-system picture, boundary seams included), not a substitute for code verification -- answers rest on reads and probes, and specification-only claims are labelled as such. When the resolved file exists but is unreadable, warn, continue ungrounded, and record the incident in `## Summary`. When neither path exists, proceed ungrounded and note the absence in `## Summary` -- expected in a repository where the adjacent toolchain has never run; not an incident.
2. **Read the inputs.** The request, its recap, and every grounding file the inputs carry are read in full (uncapped -- they are the brief, not exploration).
3. **Repository anchor.** Record `git rev-parse --short HEAD` and the tree state (`git status --porcelain`, summarised) for the report's `Grounded at:` line, and derive this repository's role description (for the `Consultant:` line) from the grounding's system characterisation -- or from the request's own framing when grounding is absent.
4. **Addressee guard.** When the request carries a `Consultant:` role that plainly does not describe this repository (judged against the role derived in step 3), report the mis-delivery and stop -- the envelope was carried to the wrong repository. An explicit additional instruction to answer anyway overrides.
5. **Explore.** Perform targeted exploration driven by the questions: repository overview, the modules and contracts each question implicates, related patterns. Cap exploratory reads at 40; if the cap is reached, note it in the Context files section and list the areas skipped.
6. **Cheap gates.** When a question turns on an executable surface (a build gate, generated output, a test), run the project's cheap verification once and record the command and its exact result in the context package as established facts researchers must not re-run.

### Phase 4 -- Assemble the research team

**Suffix.** When Phase 2 resolved an exchange id from the request, adopt it as this run's suffix -- the suffix's job here is correlation across repositories, a deliberate divergence from the sibling skills' always-fresh suffix. Otherwise generate one; test output non-emptiness, not exit status -- a pipeline whose last stage is `head` exits 0 even when an earlier stage is missing: `s=$(openssl rand -hex 4 2>/dev/null); [ -n "$s" ] || s=$(date +%s%N | sha256sum 2>/dev/null | head -c 8); [ -n "$s" ] || s=$(date +%s%N | shasum -a 256 | head -c 8)`. A minted suffix becomes the exchange id, marked `(minted on response)`.

Capture the working-tree state (`git status --porcelain`) and the current commit (`git rev-parse HEAD`) before spawning -- Phase 5's tree-hygiene check compares against both.

**Team shape.** Group the answerable-here questions by the repository area they implicate into **one to four researchers** -- questions sharing modules, contracts, or reasoning share a researcher. Choose the fewest researchers that give every question an owner; never pad -- two questions about one seam take one researcher. When `--agents N` was supplied, honour it exactly. The **sceptic** is always spawned on top.

**Model assignment.** When model guidance was supplied (Phase 1), honour it per researcher. Otherwise the sceptic runs on Tier-2 -- its premise-challenging judgement is where the heavier tier pays off -- and researchers run on Tier-3, adequate for scoped verification lenses. When one question is direction-setting (its answer commits or forecloses a development direction on either side), promote its owner to Tier-2; at most one promotion, and none if no question clearly stands out. Record the assignment in the `Researchers:` rationale.

**Naming.** Name each researcher `consult-{lens-slug}-{suffix}` (e.g. `consult-write-contracts-a3f9b2c1`); the sceptic is `consult-sceptic-{suffix}`. These names fill the report's `## Researchers` list.

Spawn all members via the `Agent` tool (`subagent_type: "general-purpose"`, per-member `model` as assigned) in a single message so they run concurrently. Spawn-model prescriptions here are tier references (`Tier-1`-`Tier-3`); resolve them at spawn time per the consumer contract in `${CLAUDE_PLUGIN_ROOT}/skills/ace-detect-harness/SKILL.md` -- against the `Harness:` block already in context, invoking `/ace-detect-harness` first if none is present. Where the ace-detect-harness package is absent, resolve tiers against the harness's own model catalogue. Spawn any researcher expected to run file-creating execution probes with `isolation: "worktree"`, so probe artefacts never exist in the shared tree the other members are reading.

**Package handoff** -- assemble the context package into a temporary file and pass its path to each member; the content is fixed at assembly time, so determinism is preserved. The package carries: the request verbatim (recap included); the member's owned questions; the Phase 3 exploration notes and recorded gate results (established facts -- do not re-run); the grounding file's path (consultable, exempt from the read cap); and any additional instructions.

Each researcher must:

1. Research this repository to establish, per owned question, what exists and what its shape and contract are, with file:line or module anchors as evidence. Cap exploratory reads (files beyond the package and the request's grounding files) at 40; if the cap is reached, note it in the returned analysis.
2. Label every claim: **FACT** (verified by a read or an executed probe -- probes name the exact command run and its exact result) or **ASSESSMENT** (analytical judgement). Claims of the form "X compiles", "this repository enforces Y", or scope-defining counts are facts only when probe-verified; a claim verified only by inspection is an assessment and must be tagged as one. Never report an approximation under a FACT label. A documentation read grounds a fact about the documented contract only -- a claim about behaviour anchors to source or an executed probe, with documentation as corroboration.
3. Execution probes are sanctioned but constrained: mutate only in a git worktree or a scratchpad copy, or revert the mutation within the same tool sequence that made it -- never leave the shared working tree dirty across tool calls. File-creating probes (test files, fixtures) belong in the worktree or scratchpad even when they would be reverted in-sequence -- other researchers read the shared tree concurrently and would see the intermediate state. Do not report findings observed on another researcher's in-flight probe state; if the tree looks unexpectedly modified, re-verify once it settles.
4. Answer the question the requester needs answered, not only its literal words: when a question rests on a false premise about this repository, surface the premise, correct it, and answer the corrected question alongside.
5. Advise where the question asks for direction: state which choice this side favours, what it would take, and the trade-off -- labelled as assessment.
6. Propose complementary moves where the evidence supports them: changes in this repository that would materially ease the requester's implementation, each with an effort band and what it unlocks.
7. Treat cannot-settle as a first-class outcome: state what is missing and who can settle it; never speculate to fill an evidence gap.
8. Draft answers self-contained for transport: restate assumptions in place and cite anchors inside the prose; never write a sentence whose meaning depends on the requester opening a file in this repository.
9. List any files read beyond the package, so they merge into the report's context file list, and leave the working tree as found.

The sceptic additionally: challenges each question's premise against this repository's reality (a surfaced false premise is worth more than a literal answer); independently verifies the request recap's load-bearing claims about this repository; and forms an independent view of which complementary move, if any, is worth proposing -- flagging where the requester's implied direction would over-build on this side. Its analysis feeds Phase 6's pruning of the proposals.

### Phase 5 -- Collect analyses

Each member's final message is returned as its `Agent` tool result. Do not poll or schedule wakeups while waiting. Once all have returned, proceed.

Before report generation, run a tree-hygiene check against both Phase 4 captures. Working tree: compare `git status --porcelain` -- probes must have left the tree as they found it; revert stray modifications that are clearly probe-derived and record the incident in `## Summary`. Changes that are neither probe-derived nor a moved HEAD -- ambient third-party writes appearing mid-run, e.g. external tooling touching dotfiles or its own directories -- are left in place and reported in `## Summary`, like a moved HEAD: report, never act. HEAD: compare `git rev-parse HEAD` -- **if HEAD moved, do not reset, revert, or amend anything**. The user manages git commits and may have committed at the terminal while the researchers ran; a moved HEAD -- including a tree now *cleaner* than the capture, the signal that inverts the working-tree check -- is reported in `## Summary` and, when the next step depends on it, asked about. It is never a licence to act on git state. Record any read-cap overage a member reported (member, count, reason) alongside.

If a researcher fails or returns empty output, proceed with the available analyses; its owned questions are answered from the orchestrator's own Phase 3 evidence where possible and marked `cannot-settle` (researcher failure noted) where not. The sceptic is not a uniform member: if it fails or returns empty output, re-spawn it once; if it fails again, proceed but state the sceptic's absence in `## Summary` -- the premise-challenge layer is what keeps a plausible-but-wrong request from being answered literally.

### Phase 6 -- Generate the answers report

The orchestrator owns the final report. Consolidation rules:

- **Headline verification first.** Identify the single claim the report's headline conclusion hangs on; if no researcher verified it by an executed probe or by reading the implementing code path end to end, verify it yourself before consolidating -- an unverified headline makes a plausible report, not a report.
- One entry per question, in request order, restating the question verbatim with its preserved identifier and priority tag. Merge researcher findings per entry; deduplicate; no per-member attribution.
- Set each entry's `Status:` -- `answered`, `answered-in-part` (state exactly what remains open), or `cannot-settle` (state what is missing and who can settle it) -- and roll the final statuses up into the header's `Coverage:` line.
- Preserve the FACT/ASSESSMENT labels; every FACT carries its anchor as a prose citation ("this repository's `{module}` at `{path}` does X"). A premise correction, when one applies, opens the entry. A direction question closes with a `Recommendation:` line and the trade-off.
- Consolidate complementary proposals as `P{n}` entries, deduplicated and pruned against the sceptic's over-build view; each carries an effort band, what it unlocks for the requester, and the evidence it rests on.
- An answer or proposal that hinges on this repository's owner's willingness (would this side accept the change? which of its options does this side prefer?) is drafted as assessment with an explicit `Owner decision pending:` note -- Phase 8 interviews exactly these. Write the closing line as the literal `Owner decision pending: {the decision needed}` and nothing more: never draft the decision, its rationale, or its caveats here -- Phase 8 supplies them, and a pre-drafted decision is fabricated owner consent.

**Standard header fields.** The `Title:`, `Type:`, and `Date:` lines open `## Summary` and must sit within the first 25 lines of the file -- `/ace-report-publish` composes the issue title from them via `grep -m1` line matches. `Title:` is concise, human-readable, suitable as a GitHub issue title, with no trailing full stop and no references to other issues or sources. Never emit `Stage:` -- a consultation is not a stage of anything.

Output the report:

```
# Consultation answers

## Summary

Title: {concise title suitable for GitHub}
Type: consult
Date: {yyyy-MM-dd, local date}
Exchange: {8hex}, round {k} [append `(minted on response)` when the request carried no id]
Source: [enumerated, comma-separated list of the exact inputs -- each item a repo-relative
file path or `issue #N`; `conversation context` when there are no file or issue inputs]
Requester: {role description carried from the request; `unstated` for a bare question list}
Consultant: {role description of this repository, from Phase 3}
Grounded at: [HEAD short-hash plus tree state -- e.g. `ff6df1d, clean tree`]
Coverage: {n} answered, {m} in part, {p} cannot-settle [human-read roll-up: the courier
judges whether another round is needed without opening the body]
Researchers: {N} + 1 sceptic. Models: {the split, or `all {model} via --model` -- recorded as the resolved model names}.
Rationale: {one line: the question grouping applied, any promotion, and whether
identifiers were minted}.

[1-2 paragraphs: what was asked, what the research established, and the headline answers]

**Tip:** carry this file back to the requesting repository by hand and pass it as an input
to the next run there (a re-scope or the owning stage's pre-planner run), beside the
artefact that raised the questions -- the matching `Exchange:` ids are the audit link. The
report is self-contained; no path in it resolves outside this repository.

## Researchers

[Numbered list, one entry per member: `[name] -- [questions owned] -- [model]`, the
sceptic last as `[name] -- Sceptic -- [model]`. Names follow the Phase 4 convention.]

## Answers

### Q{n} [blocking|deferrable] -- {question restated verbatim}

Status: answered | answered-in-part | cannot-settle

[The answer. FACT paragraphs carry anchors in prose; ASSESSMENT paragraphs say so and
state their reasoning. A premise correction opens the entry when one applies. A direction
question closes with `Recommendation:` and the trade-off. A cannot-settle entry states
what is missing and who can settle it. An entry awaiting this repository's owner carries
`Owner decision pending:` until Phase 8 records the decision.]

## Complementary proposals [omit if empty]

Proposals are advisory: this report commits this repository to nothing, and a proposal
becomes work only through this repository's own planning workflow. [This preamble is
mandatory and emitted verbatim.]

[P{n} -- {proposal}: what it would take (effort band), what it unlocks for the requester,
and the evidence it rests on.]

## Context files

[Single deduplicated numbered list of all files read -- orchestrator and researchers
merged, no attribution. One file per entry -- no wildcards, globs, or comma-grouped
multi-file rows (a swept set is listed file by file). All paths are this repository's:
evidence citations, not links the requester can follow.]
```

### Phase 7 -- Save report

1. **Self-containment sweep** (binding, per the protocol): re-read the draft as the requester will read it -- with zero context of this repository beyond the report itself. Fix any sentence that leans on unstated context, cites a path as if the reader could open it, or presumes the request is still at hand. The sweep precedes every save of this file, the Phase 8 overwrite included.
2. Write the report to `.ace/reports/{yyyyMMdd}-{HHmm}-ace-agent-consultant-{suffix}.md`, where `{yyyyMMdd}` and `{HHmm}` are local machine time (`date +%Y%m%d` and `date +%H%M`) and `{suffix}` is the Phase 4 suffix (the exchange id). Create the `.ace/reports/` directory if it does not exist. If the write fails, retry once; if it still fails, output the report in full so the user can save it manually.

If the report contains any `Owner decision pending:` entries, proceed to Phase 8. Otherwise skip to Phase 9.

### Phase 8 -- Owner gate

This phase collects decisions from the user present at this session -- this repository's owner or their proxy -- and overwrites the saved report. It interviews only the `Owner decision pending:` entries; researched answers are never re-opened here.

Use the `AskUserQuestion` tool following `${CLAUDE_PLUGIN_ROOT}/skills/ace-run-interview/SKILL.md`, with options drawn from the researched evidence. Batch across calls if needed. `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/interview.md` is the reference copy of this interview procedure; this file diverges as an owner gate that interviews only `Owner decision pending:` entries, with its unresolved-outcome marker appended to `## Answers` rather than to an `### Open questions` subsection.

For each recorded decision, update the entry in place: replace the `Owner decision pending:` note with `Owner decision: {decision}` and weave the consequence into the answer or proposal -- a decision can flip an assessment into a commitment-backed answer, or withdraw a proposal. A declined question leaves the entry advisory with its pending note intact. Whenever the gate ends with pending entries (declined, cancelled, or tool failure), append a one-line marker as the final line of `## Answers`: `Interview: [declined | cancelled | failed]; N questions unresolved.` When outcomes mix, the status records the most severe: failed > cancelled > declined. If the tool itself fails, apply any decisions already collected and leave the rest pending.

Overwrite the same file path used in Phase 7, re-applying the Phase 7 self-containment sweep to the changed entries first. If the overwrite fails, retry once; if it still fails, output the updated report in full so the user can save it manually. On a successful save, output the saved path plus only the changed entries. Proceed to Phase 9.

### Phase 9 -- Publish

Runs in every path that saved a report -- after Phase 7 when there is no owner gate, and after Phase 8 regardless of its outcome; the file on disk at this point is what gets published.

- **`--publish no` (default)** -- do not create an issue. The final summary prints the saved report path, the hand-carry tip, and the ready-to-run line `/ace-report-publish {report path}` for the on-demand local record.
- **`--publish yes`** -- publish the saved report per `## Producer publish phase` in `${CLAUDE_PLUGIN_ROOT}/skills/ace-report-publish/SKILL.md`. Two divergences hold here: this report never carries a `Stage:` field (Phase 6 -- a consultation is not a stage of anything), so the title composes from `Title:`/`Type:` alone; and the additive issue URL sits beside the hand-carry tip rather than a next-step tip, because the issue lives in this repository and the requester cannot see it.

**Consultant-discovered local defects.** When the research surfaced a defect in this repository itself (e.g. a contract mis-declaration the consultation exposed), the final summary lists each one explicitly and names this repository's own route for filing it -- publishing the answers report locally (`--publish yes`, or the printed `/ace-report-publish` line) or capturing it per the repository's backlog conventions. The advisory boundary holds: the consultant files nothing itself.

## Constraints

- **Self-containment is binding** (protocol): the saved report must be actionable with zero context of this repository beyond its own prose -- anchors are cited as evidence inside the text, never as links the requester is expected to follow; the Phase 7 sweep is mandatory before every save, the Phase 8 overwrite included.
- **Never touch the counterpart repository**: no reads, fetches, or writes across the boundary, and no assumption beyond the request's own content -- the transport is a human carrying files (protocol).
- The consultant commits this repository to nothing: complementary proposals are advisory, and only a Phase 8 owner decision recorded at the gate upgrades one -- and even then it becomes work only through this repository's own planning workflow.
- Question identifiers are preserved verbatim and never rebound; minted identifiers are declared as minted (protocol).
- Answers distinguish FACT from ASSESSMENT, and facts name their verification -- an executed probe or a read, never inspection presented as proof.
- Researchers are read-only outside sanctioned probes; the constraint is prompt-level, not platform-enforced (no permission wall stops a stray `git commit`), which is why the Phase 5 tree-hygiene check is mandatory -- and why a moved HEAD is reported, never acted on.
- The system specification is read-only ambient grounding produced by an adjacent toolchain: never regenerate, edit, or flag it as stale; its absence degrades grounding, never the run.
- Interview is orchestrator-owned (Phase 8) and scoped to owner-pending entries; researchers never run one.
- The saved report is the deliverable; publication (Phase 9) is a mechanical post of that file -- the skill ends after Phase 9.

## Error handling

- If `--model` has a missing value, `--publish` has a missing or unknown value, or `--agents` has a missing, non-integer, or out-of-range value, report the valid values (the `1-4` range for `--agents`) and stop
- If no request is found (no arguments and no request in conversation context), report this and stop
- If a file path resolves but is not readable, report the error and stop
- If the issue does not exist, report the error and stop; if `gh` commands fail outside Phase 9's publish step, report the error and stop -- the Phase 9 publish failure is covered by its own bullet below
- If no questions can be extracted from the inputs, name the input, say why, and stop
- If the request's `Consultant:` role plainly does not describe this repository, report the mis-delivery and stop (Phase 3 addressee guard); an explicit additional instruction to answer anyway overrides
- If no question is answerable here, skip the team and save the short all-`cannot-settle` report (Phase 2) -- a valid outcome, not an error
- If the resolved grounding file exists but is unreadable, warn, continue ungrounded, and record the incident in `## Summary`; if neither grounding path exists, proceed ungrounded and note the absence in `## Summary` (not an incident)
- If HEAD moved during the run, never reset, revert, or amend -- report the change in `## Summary` and ask when the next step depends on it (Phase 5)
- If a researcher fails or returns empty output, proceed per Phase 5; the sceptic specifically is re-spawned once, and its final absence is recorded in `## Summary`
- If the Phase 8 `AskUserQuestion` fails as a tool, apply collected decisions, leave the rest pending with the marker, and proceed to Phase 9
- If the report write or overwrite fails, retry once; if it still fails, output the report in full so the user can save it manually
- If issue creation fails in Phase 9, report the `gh` error verbatim and print the ready-to-run `/ace-report-publish {report path}` line
