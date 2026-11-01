# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0]

### Added -- triage and numbered steps in a workstream

- `/ace:scope-report-triage --ws {ws}`: remediates a workstream's current code review (report
  mode), or the review of a pull request tied to its delivery (PR mode, `pr <number|URL>`),
  inline, with no subagents. It requires `--ws`, resolves the workstream with the find-only
  variant and takes one input per run. It verifies each finding against HEAD, reads the scope,
  the decision log and the code review's held findings and Confirmed guards as settled, and
  takes to the owner any change to the scope, a goal, a gate clause or an accepted decision, and
  any setting aside of an unheld `[high]` Correction or Risk. Each actionable finding gets one
  outcome from a closed list, with its pointer. Before each commit (after it, in a disposable
  worktree, where the owner lets it proceed over a dirty checkout) it runs
  `verification-checks.md`'s `cheap` tier and each applied finding's `Check:`; it commits its
  own paths with `git commit --only`, so a change the owner staged stays out, pushes once, never
  forced, and never amends, merges or commits workstream records. Report mode works on the
  delivery branch, by scope-implement's base rules, and never checks out, fast-forwards or pushes
  the default branch; PR mode on the pull request's head branch (same repository, open), tied to
  the delivery by content as the code review ties its subject. Either mode stops on a branch name
  it would put in a command that holds a character outside `A-Z a-z 0-9 . _ / -` or begins with
  `-`, since quoting does not stop command substitution. PR mode then answers the review by
  running `/ace:pr-response` and reading the posts back, which needs `gh`. Its artefact, the
  triage record, is a delivery record, rewritten after each commit,
  after the push, at its outcome table, before and after its posts and at its close, and it says
  what `Posted:` records if posts fail part-way or the read-back fails. It is user-invocable only
  (`disable-model-invocation: true`), as `/ace:scope-implement` is; on Codex, where it stays
  implicitly invocable, it confirms once, naming each effect, before its first commit, push or
  GitHub post when not explicitly requested.
- Numbered steps: each run of a scope skill in a workstream takes a step -- a folder
  `workings/{nn}-{skill}/` holding its `state.md` and records, beside one root artefact
  `{nn}-{skill}.md`, numbered from `01` in the order runs open their steps -- in place of
  `report-{skill}.md` (`-2`, `-3`) and fixed folders such as `workings/implementation/`. A run
  claims its number by creating the folder; only a run, at its step's open, writes a name of
  that form. A run that stops at a read-only exit, before its open, takes no step and writes
  nothing. A run that finds an earlier step of its own skill still open asks the owner whether
  to proceed, wait or stop. Current, prior and delivered work are found from the numbers and the
  artefacts' headers, each of which now carries `Date:`, its input line, `Mode:` where the skill
  has modes, its status field and `Next:`, in one field order. Only scope-implement resumes a
  step.
- `index.md`, the workstream index: a derived view, regenerated whole from the step folders and
  the artefacts' headers by each run that takes a step (ws-create writes the first), never a
  record and never edited in part; where it disagrees with them, they win. A non-empty root
  `index.md` not opening `# Workstream index` is the owner's, never overwritten, and while it
  stands no run writes an index in that workstream; an empty one is rebuilt.
- `prompts/`: a new workstream's folder for owner- or agent-written prompts and briefs. No skill
  writes, moves or deletes anything in it, it is never indexed, and a brief there is named as a
  step's input (`prompts/brief.md`), never listed in `inputs.md`.
- One hand-off loop, stated once in the conventions, from envelope through implementation,
  closing review, code review, triage and the owner's pull request to merge: every next step a
  Close or read-only exit prints is one of its edges, in one form, and none is run. A covering
  `ready` code review no longer declares the work complete: the delivery is complete once its
  content also reaches the default branch, and one merged by fast-forward or merge commit before
  such a review cannot reach that terminal.
- One vocabulary and citation form: run, step, artefact, report (envelope, scope review and code
  review only), handoff, triage record and delivery record are each defined once. An id in
  another file is cited `{file}#{id}`, `{file}` being the path from the workstream root for a
  file inside it (`01-scope-envelope.md`, `prompts/brief.md`), else repo-relative. Handoffs and
  triage records mint no report ids of their own, and are cited by path.
- GitHub writes: a workstream still makes none but one -- in PR mode the triage's
  `/ace:pr-response` run posts a summary comment and threaded replies on the pull request it
  triaged, and the triage record keeps what was posted.
- Proof: the owner ran the numbered layout and a report-mode triage on the Claude edition in a
  scratch repository (envelope, implementation, code review, triage); the closing review rests
  on reader traces. PR mode ships without a live run before this release; its first live run is
  planned on this release's own pull request, once that has a review.
- Codex edition: the triage runs inline and carries no orchestration sentence, so it takes the
  generic conversion, with no generated-only file, outside the build's orchestration rewrite and
  wording guard. The edition is validated as packaging only: it builds and passes its check.
  Its runtime behaviour is unverified, and nothing claims it matches the Claude edition's.

#### Old-layout workstreams

A workstream begun before this release (`report-scope-{kind}.md`, `workings/implementation/`
and the like) is read in place: nothing in it is renamed, rewritten or back-filled (the decision
log aside: its entries are still appended, and its header may be replaced, below), and every
citation of its names stays valid. Its first numbered step is `01`, and its index begins there.
An unfinished old-layout run is never resumed: the next run reads its records as evidence and
opens a numbered step, saying so at its open. Once a workstream holds a numbered step, run no
earlier plugin version there: those versions write the old names, and no skill detects a breach.

### Changed

- `workstream-conventions.md` states the rules above, and `orchestration.md` names as its
  consumers the four scope skills that run agents; the caller check requires neither
  `index.md` nor `prompts/`.
- `/ace:ws-create`: a new workstream also gets an empty `prompts/` and a first `index.md`; a
  found one gains neither. An input inside a workstream matches it by location and is never
  listed in `inputs.md`; the inputs template says so.
- The decision template: its example cites numbered artefacts, its rules no longer say
  "interview step", its opening addresses every run in the workstream and any other work done
  there, and its `Seed:` is 0.9.0, `check-codex`'s pin updated to match. Where a workstream's
  header differs from the template's and its `Seed:` is absent or lower, the next 0.9.0
  `/ace:scope-implement` run there replaces it when its first decision entry is due, keeping a
  copy of the replaced text in its step folder: the one rewrite of an existing workstream file.
  The triage never replaces a header.
- `/ace:scope-implement`'s handoff moves from its folder's `handoff.md`
  (`workings/implementation/`, `workings/remediation/` and their `-2`, `-3`) to the workstream
  root as its step artefact, `{nn}-scope-implement.md`, gaining `Date:`, `Mode:` and
  `Workings:`; `state.md` and `gates.md` stay in its step folder, and the state record, no
  longer the handoff, says whether the decision-log header was kept or replaced. Its base,
  remediation and drift read the delivery-record set, triage records included. Its `Commits:`,
  which the triage record shares, lists every commit the run made, electives included, by hash,
  oldest first, never as a range, or reads `none -- commits withheld` when they are withheld,
  and `none -- pending` before the first commit; `Checks:` reads `pending` before the first
  checkpoint.
- `/ace:scope-code-review`: a `not ready` verdict routes to
  `/ace:scope-report-triage --ws {ws}`, then the repeat review, where it named
  `/ace:report-triage`, whose edits stayed uncommitted; a `ready` one covering the delivery
  prints, where the report leaves something to triage, an optional triage, then the owner's
  pull request and a PR-mode triage once that has a review (that the delivery is complete,
  instead, where it has already reached the default branch). Its plan record moves to its step
  folder, and its report gains `Next:` and names leads in its Scope, not on `Source:`. Its
  template no longer calls a `[low]` Correction or Risk elective: it is remediated by default,
  like every Correction and Risk, and need not change before merge.
- `/ace:scope-envelope` and `/ace:scope-review` save their reports as step artefacts and print
  their next steps from the loop; the report templates gain `Next:`.
- README lists the triage, the new layout and three skills Claude cannot invoke implicitly;
  `check-codex` expects 27 skills; the build's code-review reference names the step folder.
- `/ace:pr-response` gains one line: it stops before its push-state gate fetches the head when
  the head-branch name holds a character outside `A-Z a-z 0-9 . _ / -` or begins with `-`.
  `/ace:report-triage`, the other `/ace:pr-*` skills and `verification-checks.md` are unchanged.

## [0.8.0]

### Added -- code review in a workstream

- `/ace:scope-code-review --ws {ws}`: reviews a workstream's delivery at code level before its
  pull request -- correctness, robustness, security, tests, maintainability, the seams between
  stages and skill text -- reading the envelope, the closing review, `decisions.md` and the
  delivery records as settled instead of re-arguing them. It requires `--ws` and resolves the
  workstream with the find-only variant. The subject -- the current branch by default, or a
  named `branch`, `commit` or `folder` -- is pinned by SHA and read as git objects, never the
  working tree; the default subject is tied to the delivery records by content (the delivered
  tree or the combined diff's patch-id), the branch name only corroborating, and a mismatch
  gets one routing question. It changes nothing in the user's checkout, branch, index or refs,
  except a fetch the owner allows.
- Selection applies `/ace:branch`'s role classifier, read in place; every subject file gets a
  plan-record row, selected or set aside with its reason, and instruction files in the selected
  set are detected and reviewed through a skill-text lens. Load is measured diff-first against
  a per-slice limit (12,000 lines, provisional); beyond it the run adds slices or asks, and
  nothing is truncated. The team is sized by ownership, not by a count: every selected file has
  one owner, every stage seam is a named duty, and every risk signal gets depth. A Tier-1
  sceptic challenges in two families: coverage, before any reviewer starts, and calibration,
  over the findings index. The `--checks` battery (default `cheap`) and a test run over the
  tests the selected set touches run once, before the reviewers, and their results go to every
  reviewer and verifier. Verification follows weight: every `[high]`, contested or
  sceptic-flagged finding gets an adversarial outcome, by executed refutation for `[high]`;
  every `[low]` and new Confirmed finding gets a scripted anchor check.
- The report, `report-scope-code-review.md` at the workstream root, grades Correction, Risk,
  Insight, Opportunity and Confirmed findings, the first four `[high]` or `[low]`, and derives
  its verdict mechanically: `ready` when no `[high]` Correction or Risk is left unheld by a logged
  entry and no blocking question is open, else `not ready`, bound to the checks tier that ran
  and the review set. A repeat review covers the files changed since its prior and those its
  findings cite, and accounts for every prior id. The skill is advisory: it changes no product
  code, publishes nothing, and appends to `decisions.md` only owner answers, `Defer:` entries
  for its own findings and its own direction-level choices about them. Close hands a
  `not ready` report to `/ace:report-triage` on the delivery branch, then to a repeat
  `/ace:scope-code-review --ws {ws}`.
- Cost: the Claude edition's trial measured about 4x current practice's cost
  (`/ace:branch review`, then `/ace:agent-code-review`, on the same tree) and about 4.5x its
  active time, on one delivery and on the text as trialled, before its last revisions, which
  add agent work.
- Codex edition: the skill takes the scope skills' direct-subagent replacement and a
  generated-only `orchestration-codex.md` of its own, covering result collection, follow-ups
  and fresh spawns, yielded commands, asynchronous questions and isolated writing probes;
  `check-codex` allow-lists it, and the build's wording guard covers the skill. The edition is
  validated as packaging only: it builds and passes its check. Its runtime behaviour is
  unverified, and nothing claims it matches the Claude edition's capability or cost.

### Changed

- `/ace:scope-implement`'s Close names `/ace:scope-code-review --ws {ws}` (adding
  `branch {branch}` when the checkout is not on the delivery's branch) where it named
  `/ace:agent-code-review origin/{branch}`; its condition is unchanged.
- `workstream-conventions.md`'s find-only variant names `scope-code-review`, and
  `verification-checks.md` lists it as a consumer: it takes the flag (default `cheap`), uses
  Tiers and Degradation, runs the battery once before the reviewers on the pinned state, and
  opts out of the `--prior` clauses.
- `/ace:agent-code-review` and `/ace:branch` are unchanged; the former remains the pre-PR
  review outside a workstream.
- `check-codex` expects 26 skills.

## [0.7.1]

### Changed -- a tier's effort is a baseline

- `/ace:detect-harness`'s consumer contract carries the suite's effort policy, its single
  source. Every tiered spawn passes an effort. The orchestrator selects it for each
  assignment, starting from the tier's baseline, and may pass any level the model supports.
  Raising or lowering the baseline is an expected outcome. Agents whose outputs are compared
  directly get equal efforts. A change of effort takes a fresh spawn, never a continuation.
  An explicit effort instruction binds. Where the workflow has a settings surface, the
  effort requested is recorded, and a departure from the baseline carries its reason; an
  override or cap is noted only where it is known, since the orchestrator cannot see it.
  The plan pipeline has no settings surface and records nothing. A `Tier-N` value is
  described as the tier's model and baseline effort; the block's format is unchanged. A
  cached block carries only baselines, so a spawn site reads the policy before spawning
  when the policy is not already in context. The invalid-arguments example now names an
  unsupported non-baseline effort only for a harness that rejects one.
- `--model`: a requested effort binds; an explicit model without one keeps the default-effort
  rule. A spawn that needs full-history inheritance omits both overrides, and it does not
  count as applying a tier. In the shared Codex clause, tiered spawns pass
  `fork_turns: "none"`; the positive-integer-string option is gone.
- `models.md`:
  - Tier-1 is defined by its work and its place in the order. It makes no capability claim
    and places no restriction on its effort, and each tier's effort is described as its
    baseline.
  - The Claude mapping moves Tier-1 from `fable` `medium` to `opus` `xhigh`.
  - The Claude section is re-verified on Claude Code 2.1.312. 0.7.0 stamped it 2.1.120,
    which predates the Agent tool's per-call `effort` (2.1.292), so that route cannot have
    been verified there. It records:
    - each mapped alias's effort levels, and the fallback for an unsupported level;
    - `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`;
    - that `SendMessage` takes no model or effort;
    - the Workflow tool's per-agent effort;
    - that agent-team teammates take no documented per-spawn effort, so tiered spawns pass
      no `name`. The shared spawn sentence says so too: member names are report labels.

    Claims taken from the documentation rather than observed are stamped as documented,
    and one is stamped as inferred.
- `ws-shared/orchestration.md`:
  - Relative cost guidance replaces the fixed Tier-1-to-Tier-2 cost ratio.
  - The Tier-1 ceiling counts roles by their settings, not their tier label. A role counts
    when any of its agents runs Tier-1's model at Tier-1's baseline effort or higher;
    without tier resolution, the roles assigned Tier-1 count. `--model` still beats the
    ceiling.
  - The ceiling caps the effort policy's raises. A raise that would make a fourth role
    count toward the Tier-1 ceiling either stays at the baseline or is recorded as an
    override.
  - Efforts compare in the order `models.md` lists them, and an inherited or default
    effort counts at the tier's baseline.
  - A follow-up continues an agent only while its effort suits the work.
  - The allocation record carries each departure's reason, and any override or cap where
    it is known. A role whose assignments differ lists each level, comma-separated.
- Every tiered spawn site names both settings: the shared team spawn and the consultant's
  spawn, the agent-* skills' spawn instructions, plan-start Phases 5, 7 and 9,
  plan-validate Phase 2 and plan-update step 6. The validator and the revisor are tiered
  spawns too, and the validator's settings still do not follow `--model`.
- Report surfaces record effort:
  - the agent-* analyst, reviewer, panel and researcher lists, with a slot for the reason
    behind a departure and for an `inherited` or `default` effort;
  - their `Models:` lines;
  - the scope templates' `## Run record` team lines, which gain a departure-reason slot.
- The agent-* tier rationales no longer assume a cost ratio or a heavier tier:
  - the sceptic's Tier-2 default rests on the depth its work needs;
  - `/ace:agent-scope`'s mixture rule speaks of the tier order.
- `scripts/build-codex.mjs`: conversion anchors follow the reworded shared passages. A
  string anchor must now match exactly once. That change converts plan-start's second
  `patch hunks` mention in the Codex edition. The `### Claude` strip refuses a span that
  holds another heading.
- Codex team and consultant spawns derive each `task_name` from the member's report label
  with hyphens replaced by underscores; the runtime rejects hyphenated task names.
- `scripts/check-codex.mjs` forbids `CLAUDE_CODE_`, `maxEffortLevel` and `SendMessage` in
  the Codex edition.
- Codex Tier-3 moves from `gpt-6-luna` at `max` to `gpt-6.1-terra` at `high`.
  The Codex section is re-verified on the session's codex-cli 0.165.0 runtime:
  all three mapped models support `low`, `medium`, `high`, `xhigh`, `max` and `ultra`;
  tier overrides require `fork_turns: "none"` and explicit user, project or skill
  instructions; omitted or `"all"` forks inherit both settings. Continuation tools
  take no model or effort, so changing either requires a fresh spawn, even within a
  tier. The section also records default-setting precedence and the distinction
  between message payloads and selectable custom-agent definitions.
- Codex build replacements apply the shared effort policy across scope, team,
  consultant and plan spawns, preserve explicit-model default effort and unknown-tier
  fallbacks, and remove the unsupported positive-integer fork option. The generated
  mapping and output prose describe effort as a baseline.

## [0.7.0]

### Added -- implementation and remediation in a workstream

- `/ace:scope-implement --ws {ws}`: delivers the workstream's current scope report -- its
  envelope (implementation) or its closing review's remediation stages (remediation), the mode
  read from the workstream's state -- through design, implementation, integration and
  verification as a multi-agent run. It verifies every gate clause as behaviour on the delivered
  tree, its executed output kept whole in its step folder, appends its decisions to
  `decisions.md` at its header's timing, appending pending entries before any stop (when its
  first entry is due, replacing a header whose `Seed:` is absent or lower than the current
  seed's, a copy of the old header kept, and keeping and reporting any other differing
  header), commits and pushes checkpoints on a feature branch, runs and records a
  completeness check before each checkpoint and the handoff, keeps `state.md` and `gates.md`
  in its step folder, and writes a pointer-only `handoff.md` that names its brief and records
  the harness and orchestrator model of each session. Its agents stop and return any change
  that would alter the scope, a gate clause, a goal or an accepted decision. It resumes its own
  runs, reads other runs' records as evidence, and names the next step. It is user-invocable
  only (`disable-model-invocation: true`), as `/ace:branch` is; on Codex, where it stays
  implicitly invocable, it confirms before its first commit when not explicitly requested.

### Changed

- `skills/ws-shared/`: a find-only resolution variant (no ws-create); pushing a branch is not a
  GitHub write; the ground rules let an agent write what its assignment names; a shared
  `## Probes and external state` section in `orchestration.md`; substantive owner questions
  asked outside an interview keep run-interview's keep-current option; the decisions template
  gains a `Seed:` line.
- `verification-checks.md` lists `scope-implement` as a consumer (Tiers and Degradation, no
  flag), and its record grammar gains a `(full: no gate resolved)` suffix for a `full` run
  that falls back to `cheap`'s battery.
- `/ace:detect-harness` and `models.md`: on Claude, a tier's effort is passed as the Agent
  tool's per-call `effort`, where it was previously described as applying only through a
  definition's `effort:` frontmatter; `CLAUDE_CODE_EFFORT_LEVEL` and `maxEffortLevel` govern
  the per-call value too, and reports state the effort they leave. The shared team spawn and
  the consultant's spawn list `effort` beside `model`.
- `/ace:scope-envelope` E9 and `/ace:scope-review` R10 name `/ace:scope-implement`; scope-review
  R2 finds delivered work through a step handoff; scope-review's removal and external-state
  bullets and scope-envelope's E3 point to the shared section.
- `/ace:plan-implement`'s description points to `/ace:scope-implement` for a workstream's
  scope report.
- `sibling-exchange-protocol.md`: the registry exclusion also covers a skill that finds a
  response envelope at the protocol's save path.
- `/ace:scope-review`'s report template: the Summary no longer sets a sentence count, as the
  envelope template's already does not.
- Codex edition: spawns no longer pass `agent_type` (absent from the spawn schema verified on
  codex-cli 0.162.1); the scope skills' follow-ups use `collaboration.followup_task` and
  `collaboration.send_message` instead of a fresh spawn each time; `scope-implement` gets its own
  orchestration text and a generated-only `orchestration-codex.md`; `check-codex` compares
  source and Codex paths with an allow-list of generated-only files, fails on any top-level
  `codex/` entry other than `skills` and `agents` and reports a missing one, and forbids
  `agent_type` and Claude-only `On Claude` passages; `models.md` records the verified spawn
  surface.
- `check-codex` pins the decisions template's `Seed:` beside a hash of its header text, and
  fails when the header changes without a `Seed:` bump.
- `check-codex` expects 25 skills.

## [0.6.0]

### Added -- the branch skill

- `/ace:branch review|pr|rebase` rewrites the current feature branch for one purpose -- two
  review commits (material a reviewer can skip, then the code under review), logical
  pull-request commits, or a replay onto the latest default branch or a `--base` branch --
  then force-pushes it under a pinned `--force-with-lease`, keeping a local backup ref, an
  in-progress marker, and printed restore commands. It is the first skill with
  `disable-model-invocation: true`; on Codex it stays implicitly invocable, and its Consent
  rule confirms before changing a branch it was not explicitly asked to rewrite. Needs git
  2.25.1 or later.

### Changed

- `verification-checks.md` lists rebase mode's project-checks gate as a consumer.
- `check-codex` expects 24 skills and matches retired `ace-` identifiers as whole words.

## [0.5.1]

### Changed -- run feedback on the scope skills

- The `decisions.md` seed header is the workstream's lifecycle channel: every step reads the
  log first and records its at-bar decisions as it takes them; `Defer:` admits any source-form
  record; direction-level entries are replaced by effect; consultation answers and settlements
  have a recorded form; a bare report id inside an entry has one defined reading.
- `/ace:scope-envelope`: E9 always prints the downstream pointer to the report and the log, with
  a route for deferrable routed sets; the sibling never-read rule travels with Guarantee 8; E6
  reconciles each stage's `Detail:` with its gate; the Summary drops its sentence count.
- `/ace:scope-review`: one owner may hold both core lenses, and the conformance owner merges
  rows and rules on contested ones; R4 rows take a reviewing owner, a baseline anchor and
  observed evidence, and walk delivery-written direction entries as claims; a file-writing gate
  battery runs as an isolated writing probe with removal confirmed where it wrote; R2 reads the
  consultant answers of an open exchange; R10 points remediation at the report and the whole log;
  baseline ids carry their file.
- `skills/ws-shared/`: one folder per step, reached by pointer; the revision reviewer gets the
  option-list rules and checks proposed entries against owner answers.

## [0.5.0]

### Added -- workstreams and the scope skills

- `/ace:scope-envelope` opens a workstream for a large or loosely specified ambition: a
  multi-agent deliberation, sceptic always included, producing a scope envelope (direction,
  goals, assumptions, suggested stages with observable gates) beside the workstream's
  decision log.
- `/ace:scope-review` closes a workstream by reviewing delivered work against its envelope and
  decision log, or against scope documents: did goals land, were decisions honoured, was
  anything silently deferred, what remediation follows. Opt-in `--sweep` reviews an existing
  area.
- `/ace:ws-create` finds or creates a workstream, reusing the one its inputs already belong to,
  and prints its path.
- A workstream is `.ace/ws/{yyyyMMdd}-{slug}/`: `inputs.md`, an append-only `decisions.md`,
  `report-{skill}.md` (`-2`, `-3` for later runs), and `workings/`. The shared conventions,
  orchestration rules and seeds live in `skills/ws-shared/`.
- The legacy `/ace:agent-scope`, `/ace:agent-arch-review` and `/ace:agent-pre-planner` are
  unchanged.

### Changed

- `/ace:report-publish` publishes a scope-review report with the `[SCOPE REVIEW] ` prefix and
  refuses its skeleton `Scope review` H1.
- `/ace:agent-consultant` accepts a scope-review report as a pack report with open questions.
- `skills/detect-harness/models.md` notes that the `Workflow` tool takes a per-agent model and
  effort.
- The Codex build converts the scope skills' orchestration-tool sentence into direct subagent
  spawns.

## [0.4.2]

### Changed -- harness tier mappings

- Codex Tier-1 now uses `gpt-6-astra` at `high` effort instead of `medium`.
- Codex Tier-2 now uses `gpt-6.1-sol`; effort stays `high`.

## [0.4.1]

### Changed -- harness tier mappings

- Claude Tier-3 now references `claude-sonnet-5-5`; the spawn alias stays `sonnet`.

## [0.4.0]

### Changed -- `--publish` defaults to `no` for the analysis producers

`/ace:agent-arch-review`, `/ace:agent-pre-planner`, and `/ace:agent-scope` no longer publish
their saved report as a GitHub issue by default. The final summary prints the saved report path
and the ready-to-run `/ace:report-publish {report path}` line instead; pass `--publish yes` to
restore the previous behaviour. Every report producer now defaults to `--publish no`, so the
`/ace:agent-code-review` and `/ace:agent-consultant` rationales no longer describe their default
as a divergence. `/ace:plan-start` still publishes by default.

### Changed -- harness tier mappings

- Claude Tier-2 now references `claude-opus-5-5`; the spawn alias stays `opus`.
- Codex Tier-2 and Tier-3 move to `gpt-6-sol` and `gpt-6-luna`; efforts are unchanged.
- Rewrite `skills/detect-harness/models.md` for clarity. The Claude section now states the
  accepted `model` override values, the subagent model resolution order (including
  `CLAUDE_CODE_SUBAGENT_MODEL`), that a per-call override does not change a pinned definition's
  effort, and how to report model and effort sources. The Codex section now states the
  `fork_turns` values that accept overrides and the valid reasoning efforts per model.
- `detect-harness` now describes the `fork_turns` override value as a positive integer string.

### Changed -- Codex derivation

`scripts/build-codex.mjs` follows the revised `models.md` wording and drops a conversion rule
that the new text no longer needs.

## [0.3.1]

### Changed

- Refresh the harness tier mappings for the current Claude and Codex model lineup, including
  `gpt-6-astra` at Codex Tier-1 and `gpt-5.6-luna` at Tier-3.
- Clarify detect-harness resolution, caching, validation, explicit-model, and spawn contracts.
- Record explicit effort settings for the Claude planning agent definitions.

## [0.3.0]

### Removed -- BREAKING: the rules layer

The plugin no longer ships `rules/environment.md`, `rules/output-style.md`, or
`rules/principles.md`, nor their generated `codex/rules/` twins. The files carried host-project
preferences (language, greenfield, infrastructure, and documentation conventions) that belong in
the host repository's own rules, not in a project-agnostic toolkit. Host repositories supply their
own rules; no suite behaviour depends on them.

The option-list rules every interview surface follows now live in `skills/run-interview/SKILL.md`
as the canonical statement, and every citing skill and agent payload points there. POSIX path-form
instructions remain inline at each site that uses them.

### Changed -- Codex derivation

`scripts/build-codex.mjs` no longer copies or converts a rules tree. The Codex-specific interview
guidance it previously injected into `codex/rules/principles.md` is injected into
`codex/skills/run-interview/SKILL.md` instead. `scripts/check-codex.mjs` no longer counts or
inventories rules files.

## [0.2.0]

### Changed -- BREAKING: every skill and agent identifier loses its `ace-` prefix

The `ace` plugin namespace already supplies uniqueness, so repeating it inside each component
name was redundant. Every skill and plugin-agent name drops the `ace-` prefix. The plugin name,
the `ace-in-my-space` repository and marketplace name, the "Ace in my space" suite name, the
generated `.ace/` artefact root, and the `agent-shared/`, `plan-shared/`, and `rules/` shared
directories are all unchanged.

No compatibility aliases are provided. This is a pre-1.0 cleanup, and duplicate aliases would
pollute discovery and preserve the very convention this release removes.

#### Migrating an invocation

Claude Code:

```
/ace-plan-start        ->  /ace:plan-start
/ace:ace-plan-start    ->  /ace:plan-start
```

Codex CLI:

```
$ace:ace-plan-start    ->  $ace:plan-start
```

Claude plugin-agent addresses follow the same rule -- drop the inner prefix, keep the namespace:

```
ace:ace-plan-drafter   ->  ace:plan-drafter
ace:ace-plan-revisor   ->  ace:plan-revisor
ace:ace-plan-validate  ->  ace:plan-validate
```

Apply the same rule to any skill: strip the leading `ace-` from the name and keep the
plugin-qualified form. The full renamed set is:

| Old name                | New name              |
| ----------------------- | --------------------- |
| `ace-agent-arch-review` | `agent-arch-review`   |
| `ace-agent-code-review` | `agent-code-review`   |
| `ace-agent-consultant`  | `agent-consultant`    |
| `ace-agent-pre-planner` | `agent-pre-planner`   |
| `ace-agent-scope`       | `agent-scope`         |
| `ace-detect-harness`    | `detect-harness`      |
| `ace-plan-handoff`      | `plan-handoff`        |
| `ace-plan-implement`    | `plan-implement`      |
| `ace-plan-read`         | `plan-read`           |
| `ace-plan-route`        | `plan-route`          |
| `ace-plan-start`        | `plan-start`          |
| `ace-plan-update`       | `plan-update`         |
| `ace-plan-validate`     | `plan-validate`       |
| `ace-pr-create`         | `pr-create`           |
| `ace-pr-read`           | `pr-read`             |
| `ace-pr-response`       | `pr-response`         |
| `ace-report-publish`    | `report-publish`      |
| `ace-report-triage`     | `report-triage`       |
| `ace-run-interview`     | `run-interview`       |
| `ace-run-retro`         | `run-retro`           |
| `ace-plan-drafter`      | `plan-drafter`        |
| `ace-plan-revisor`      | `plan-revisor`        |
| `ace-plan-validate`     | `plan-validate`       |

`plan-validate` names both a skill and an agent payload; they remain distinct components under
the same inner name, addressed as `/ace:plan-validate` and `ace:plan-validate` respectively.

The bare, unqualified forms (`/ace-plan-start` and the like) no longer resolve and are not
documented. Always use the plugin-qualified form.

### Changed -- artefact filenames

Generated report, plan, scope, review, staged-file, and retrospective filenames drop the `ace-`
producer token; the `.ace/` root already identifies the suite. For example,
`.ace/reports/{yyyyMMdd}-{HHmm}-ace-agent-code-review-{suffix}.md` becomes
`.ace/reports/{yyyyMMdd}-{HHmm}-agent-code-review-{suffix}.md`. Artefacts already written under
`.ace/` are historical records and are not renamed.

### Changed -- Codex derivation

`scripts/build-codex.mjs` no longer assumes a brand prefix on an inner skill name. It derives the
skill inventory from `skills/*/SKILL.md`, converts a Claude `/ace:{skill}` reference to a Codex
`$ace:{skill}` reference by sigil alone, and rewrites payload-relative skill paths from that
inventory instead of a `../ace-*` prefix rule.

### Fixed -- silent conversion anchors in the Codex build

Content anchors in `scripts/build-codex.mjs` now fail the build when they stop matching, instead
of silently leaving Claude text in the generated Codex edition. Eight anchors that had already
stopped matching were removed; seven were superseded by an earlier pass producing equivalent
output, and one -- the `disable-model-invocation` review criterion in
`skills/agent-code-review/references/skill-package-review.md` -- never matched because of a line
wrap, so the Codex edition of that reference still names only the Claude-only frontmatter key and
not the Codex `policy.allow_implicit_invocation: false` counterpart. That content gap is
unchanged by this release.

### Changed -- checker coverage

`scripts/check-codex.mjs` now also asserts that all four version fields agree
(`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, and both `metadata.version` and
`plugins[0].version` in `.claude-plugin/marketplace.json`), that no retired identifier or
double-prefixed invocation form survives in either tree, that no Claude `/ace:` invocation or
`ace:{agent}` address leaks into the Codex output, and that every Claude `/ace:{skill}` chain
edge, `ace:{agent}` address, and `${CLAUDE_PLUGIN_ROOT}` path in the source of truth resolves.

## [0.1.0]

Initial release: twenty skills, three subagent payloads, three rules files, and a generated
Codex edition, shipped as the `ace` plugin from the `ace-in-my-space` marketplace.
