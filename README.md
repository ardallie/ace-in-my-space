# Ace in my space

A suite of agent skills for scoping, delivering, and reviewing work in a workstream, with
pull-request work, cross-repository consultation, report publication, and harness
detection. It ships as a single plugin named `ace`, distributed from the
`ace-in-my-space` marketplace (this repository).

Fifteen skills. The skills invoke one another by name, so they are packaged and versioned
together rather than split per workflow.

## Installation

### Claude Code

```
/plugin marketplace add ardallie/ace-in-my-space
/plugin install ace@ace-in-my-space
```

The same two steps from a shell:

```
claude plugin marketplace add ardallie/ace-in-my-space
claude plugin install ace@ace-in-my-space
```

`claude plugin install` takes `--scope user` (default), `project`, or `local`. For local
development, point the marketplace at a checkout instead of the GitHub slug:

```
claude plugin marketplace add /path/to/ace-in-my-space
```

Every skill registers under `/ace:{name}` -- for example `/ace:scope-envelope`. The `ace`
plugin namespace supplies uniqueness, so the inner names carry no suite prefix of their
own. Always use the plugin-qualified form; the suite's own chains do.

### Codex CLI

The Codex edition ships from this repository as a native Codex plugin. Add the Git
marketplace, then install `ace`:

```
codex plugin marketplace add ardallie/ace-in-my-space
codex plugin add ace@ace-in-my-space
```

Skills are then invoked as `$ace:scope-envelope`, since Codex uses `$` mentions rather
than slash commands.

For local development, point the marketplace at a checkout and install from the same
marketplace name:

```
codex plugin marketplace add /path/to/ace-in-my-space
codex plugin add ace@ace-in-my-space
```

## Commands

The command list below uses the Claude edition's slash form. Under Codex, replace the
leading `/` with `$`: `/ace:scope-envelope` becomes `$ace:scope-envelope`, `/ace:pr-read`
becomes `$ace:pr-read`, and so on. The skill name after the namespace is the same in both
editions.

### Multi-agent analysis and delivery

- `/ace:scope-envelope` -- opens a workstream with a scope envelope (direction, goals,
  stages) and its decision log
- `/ace:scope-review` -- closes a workstream by reviewing delivered work against its scope
  (opt-in `--sweep` for an existing area)
- `/ace:scope-implement` -- delivers a workstream's scope envelope, or its closing review's
  remediation stages, as a multi-agent run that commits and pushes a feature branch and
  leaves its handoff, `{nn}-scope-implement.md`, in the workstream root
- `/ace:scope-code-review` -- reviews a workstream's delivery at code level before its pull
  request, reading the scope and decision log as settled and the delivery records for what
  was delivered (requires `--ws`); advisory, ending in a merge verdict, a `not ready`
  verdict routing to `/ace:scope-report-triage` and then, as the Cover rule in the
  conventions' `## Hand-off loop` decides, a repeat review -- a closure review of what
  changed and what the prior left open -- or a targeted re-check of what a triage's record
  does not carry, or no review where owner answers settle every blocking item and the triage
  commits nothing but its owner exit's fix answers, carried on its record and kept on the
  delivery tip; its cycle is
  bounded by a round budget, then by the owner exit: from the delivery's third round by
  default (the owner can set another budget), a review still holding an unheld `[high]`
  Correction or Risk asks the owner to fix, defer or ratify each one, and only an owner
  answer lets a delivery with a blocking item complete; not the closing review
- `/ace:scope-report-triage` -- remediates a workstream's current code review, or a pull
  request's review tied to its delivery, in a scope-report-triage run in that workstream,
  inline: verifies each finding against HEAD, commits and pushes the fixes to the delivery
  branch or the pull request's head, and in PR mode answers the review through
  `/ace:pr-response` (requires `--ws`; explicit-only on Claude); not for a review outside
  a workstream
- `/ace:agent-consultant` -- answers a cross-repository consultation request as the
  consultant side of the sibling-exchange protocol

### Pull requests

- `/ace:git-branch` -- rewrites the current branch for a pull request or a rebase onto the
  default branch, then force-pushes it under a pinned lease, keeping a local backup
- `/ace:pr-create` -- creates a pull request from the branch's commits
- `/ace:pr-read` -- reads pull requests and all three of their comment surfaces into the
  session
- `/ace:pr-response` -- responds to PR review comments with a summary and threaded replies

### Reports

- `/ace:report-publish` -- publishes a report markdown file as a GitHub issue

### Utilities

- `/ace:detect-harness` -- detects the agent harness and prints the capability-tier
  mapping (each tier's model and baseline effort) the other skills resolve spawn settings
  against, and states the effort policy for tiered spawns
- `/ace:run-interview` -- presents open questions interactively under the option-list
  rules
- `/ace:run-retro` -- writes a retrospective report on a finished run
- `/ace:ws-create` -- finds or creates a workstream directory

## Rules

The plugin ships no rules files and adopts none of the host's as its own. Host repositories
supply their own rules -- language, style, and design conventions -- and no suite behaviour
depends on them. The one cross-cutting behavioural rule the suite carries, the option-list
rules every interview surface follows, lives in `skills/run-interview/SKILL.md`.

## Codex derivation

The Claude tree (`skills/`) is the source of truth. Regenerate and check the
committed Codex edition after changing it:

```
node scripts/build-codex.mjs
node scripts/check-codex.mjs
```

The conversion reduces skill frontmatter to `name` and `description`, moves argument
hints into the body, qualifies internal skill mentions, converts plugin-root paths to
relative references, and adapts questions and subagent spawns. It also writes two files
with no source counterpart:
`codex/skills/scope-implement/orchestration-codex.md`, the Codex spawn and coordination
mechanics that skill points to, and `codex/skills/scope-code-review/orchestration-codex.md`,
the Codex mechanics that skill points to -- collecting results into its records, follow-ups
and fresh spawns, yielded commands, asynchronous questions and isolated writing probes;
`check-codex` allow-lists both.

`check-codex` checks the edition's structure and forbidden forms, and the Claude source's
retired identifiers, `/ace:` targets and plugin-root paths -- not the edition's content
against a fresh build: a direct edit under `codex/` that keeps its structure and adds no
forbidden form passes it, and the next build silently reverts it.
Freshness is checked by rebuilding: `git status --porcelain codex` then shows only the changes
the source edit explains.

## Harness differences

- Claude invokes skills with slash commands; Codex invokes installed skills as
  `$ace:{name}`. Codex chains are model-mediated instructions that name both the
  qualified skill and its sibling `SKILL.md`; Claude chains use the slash-command
  surface.
- Claude's per-spawn worktree isolation field has no Codex collaboration equivalent.
  The Codex consultant confines file-creating probes to a verified operating-system
  temporary directory and leaves the shared repository tree untouched.
- Claude uses `AskUserQuestion`. Codex uses `request_user_input` when Plan mode exposes
  it and asks the same ordered options in plain text in Default mode. The structured
  Codex surface accepts at most three questions and two or three options per question,
  so larger interviews are batched; both paths retain keep-current behaviour and one
  first-position `(Recommended)` option. The Codex references of `scope-implement` and
  `scope-code-review` ask through `request_user_input_async` in Default mode where it is
  exposed.
- Claude substitutes `${CLAUDE_PLUGIN_ROOT}` in skill content. Codex resolves supporting
  files relative to the active `SKILL.md`; `${PLUGIN_ROOT}` is not used because it is a
  hook-command variable only.
- Claude frontmatter carries `argument-hint` and `disable-model-invocation`. Codex folds
  the hint into the skill body and relies on the default
  `policy.allow_implicit_invocation: true`, so no `agents/openai.yaml` is emitted. For
  `git-branch`, `scope-implement` and `scope-report-triage`, the three skills Claude cannot
  invoke implicitly, this differs: all three stay implicitly invocable on Codex.
  `$ace:git-branch` is held back by its description and its Consent rule, which confirms before
  changing any branch when the skill was not explicitly requested; `$ace:scope-implement` by
  its description, its required `--ws`, and a consent rule that confirms before the first
  commit when the skill was not explicitly requested; `$ace:scope-report-triage` by its
  description, its required `--ws`, and a rule that confirms once, naming each effect,
  before its first commit, push or GitHub post when the skill was not explicitly requested.
- The Codex harness detector publishes only the Codex `(model, reasoning_effort)` tier
  mapping. The Claude edition retains its Claude-model mapping.

## Host requirements

The suite assumes the host session provides:

- an authenticated `gh` CLI -- the PR and report skills create GitHub issues, pull
  requests, and comments through it, and a skill given an issue or pull request as input
  reads it with `gh`
- `git` -- branch, diff, and commit resolution
- a POSIX shell -- the skills' embedded command snippets are written for one (Git Bash on
  Windows)

These are hard requirements, not optional integrations: `/ace:report-publish` and every
`/ace:pr-*` skill stop without them; `/ace:scope-report-triage` needs `gh` in PR mode.
`/ace:git-branch` also needs git 2.25.1 or later; for it `gh` is optional.

## Artefacts

The suite writes its reports into an `.ace/` tree at the root of whatever repository it
runs in:

- `.ace/reports/` -- consultation requests and consultation answers
- `.ace/retro/` -- retrospectives
- `.ace/ws/{yyyyMMdd}-{slug}/` -- a workstream. A new one holds in its root `inputs.md`,
  `decisions.md` (the decision log), `index.md` (the workstream index: a derived view,
  regenerated whole and never a record, that every reader reads first; the step folders and
  artefacts' headers win over it), `prompts/` (owner- or agent-written prompts and briefs,
  never indexed, nothing in it written by a skill), and one artefact `{nn}-{skill}.md` per
  step (`{nn}` is the step number, at least two digits from `01`, in launch order); and
  under `workings/` one folder `workings/{nn}-{skill}/` per step, holding its `state.md`
  and other records. A workstream holding old-layout records (an old-layout report
  `report-scope-{kind}.md` or `report-scope-{kind}-{digits}.md`, an old-layout `handoff.md`,
  or a `workings/` folder `implementation*/`, `remediation*/`, `scope-envelope/`,
  `scope-code-review/` or `scope-review/`) is read in place, never renamed or back-filled.
  The rules are `skills/ws-shared/workstream-conventions.md`'s.

Filenames outside `.ace/ws/` are `{yyyyMMdd}-{HHmm}-{kind}-{suffix}.md`. The `.ace/` root
is a convention, not a configuration surface; add it to the host repository's `.gitignore`
if the artefacts should not be committed.

## Updating

Claude Code:

```
claude plugin marketplace update ace-in-my-space
claude plugin update ace
```

Codex CLI has no plugin-update command, so the update path is a marketplace upgrade
followed by a remove and add:

```
codex plugin marketplace upgrade ace-in-my-space
codex plugin remove ace@ace-in-my-space
codex plugin add ace@ace-in-my-space
```

For a local checkout, bump the SemVer value in `.codex-plugin/plugin.json` (a build
metadata cachebuster is sufficient), then reinstall without a marketplace upgrade:

```
codex plugin remove ace@ace-in-my-space
codex plugin add ace@ace-in-my-space
```

## Versioning

Semantic versioning from `0.1.0`. The Claude and Codex manifests carry the same version
from the same repository release, and `.claude-plugin/marketplace.json` carries it in both
its `metadata.version` and its plugin entry -- `node scripts/check-codex.mjs` fails if the
four disagree.

`skills/ws-shared/decisions-template.md` carries a `Seed:` line naming the version whose
release last changed its header text. A release that changes that text sets the line to its
own version; `node scripts/check-codex.mjs` pins the line beside a hash of the header text
and fails when either changes without the other being updated. `/ace:scope-implement`
replaces a workstream's differing header only when the workstream's `Seed:` is absent or
lower, compared as semantic versions; a workstream seeded before the line existed counts as
older, so its differing header, owner-edited or not, is replaced (a copy kept) when its
first entry is due.

See `CHANGELOG.md` for release notes, including the `0.2.0` invocation migration and the
`0.11.0` skill removals.

## Licence

MIT. See `LICENSE`.
