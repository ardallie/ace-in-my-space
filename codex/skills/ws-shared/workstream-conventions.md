# Workstream conventions

Consumed by every skill that works in a workstream (ws). A skill cites this file, states which resolution variant it uses, and restates none of it.

## Workstream

- A ws is a directory directly under `.ace/ws/` named `{yyyyMMdd}-{slug}` (lowercase letters, digits, single hyphens, no dots); anything else there is not a ws and is never reused, renamed or deleted.
- Layout: `{ws}/inputs.md`, `{ws}/decisions.md`, `{ws}/report-{skill}.md` (and `-2`, `-3`), `{ws}/workings/`.
- The ws is the system of record: no skill in a ws writes to GitHub; a report is shared by hand with `$ace:report-publish`; issues and PRs may be read as inputs.
- Only `$ace:ws-create` creates a ws or writes `inputs.md`. Run it as a skill (`../ws-create/SKILL.md`); where skills cannot be invoked, read and follow that file.

## Inputs

- Forms: one or more files; an issue or PR by number or URL, read with its comments; files plus an issue or PR; none, meaning the latest actionable request in the conversation. A skill may add forms.
- Trailing text steers the run, including allocation instructions.
- Subject inputs state what the work is (the package, the prose ambition, the issue, the review subject); everything else is supporting (items a package lists, specifications, baselines, consultant answers, delivered work) and is never recorded or matched. The calling skill classifies them by judgement (if unclear, the first input is the subject) and passes ws-create only the subject inputs. A run with no subject input records nothing; its slug words come from what the work it was given says it does.
- `inputs.md` line: `` - `{key}` -- {what it asks for, one line} (added {yyyy-MM-dd}) ``. Keys: repo-relative path with forward slashes (outside the repo, absolute with forward slashes); `#{n}` or `{owner}/{repo}#{n}` for an issue or PR; for conversation context, the key of the file or issue it plainly names, else `conversation`. Paths inside a ws are never listed. Lines are appended, never changed or removed.

## Naming

- `{yyyyMMdd}` is the local creation date, never re-derived.
- `{slug}` is 2-4 kebab-case words naming the subject as the inputs state it; never copied mechanically from a filename, never a path, extension, container word (`brief`, `notes`) or skill name; a short descriptive filename may give the same words; a source identifier (package or issue number) may be one word. Invented examples: `.ace/wpak/packages/04-billing-export.md` -> `04-billing-export`; an item file `checkout--usability--card-retry-gives-no-feedback-after-a-declined-charge.md` -> `card-retry-feedback`; a `brief.md` asking for offline drafts -> `offline-drafts`.
- Whoever derives a slug checks it against every existing ws first and, if it is taken, chooses other words that still name the subject; so a "create new" choice passed to ws-create by name never turns into a reuse.
- A `--ws` value may be a path, a ws name or a bare slug: match the exact name first, then `*-{slug}`. With no match, a full name is created as given and a bare slug gets today's date.

## Resolving a ws

- Resolve once the inputs are known to be actionable (a read-only lookup of `--ws` may come first) and before any agent work, in the orchestrator's own loop.
- Every path ends in ws-create, "use it" included, so a new subject input in a reused ws is appended by the single writer.
- Without `--ws`, never by re-deriving a slug: a ws matches when one of the run's inputs lies inside it, or one of its subject inputs is recorded in its `inputs.md` and still asks for the same thing; if that is doubtful, the ws is a candidate. Shared supporting material and similar slugs never match.
- Variants (each skill states its own):

| Case | find-or-create (scope-envelope) | find-or-ask (scope-review) |
|---|---|---|
| `--ws`: one ws | use it | use it |
| `--ws`: several | ask | ask |
| `--ws`: none | create under that name | ask: create under that name, a ws matching the inputs, or stop |
| no `--ws`: one match, no candidate | use it | ask: use it (recommended), create new, or stop |
| no `--ws`: several matches, or any candidate | ask: one of them, or create new | ask: one of them, create new, or stop |
| no `--ws`: nothing | create with a derived slug | ask: create `{derived name}`, or stop |

- Offer each ws with its name, its first `inputs.md` entry and the reports it holds; a "create new" option shows the name it will use; a declined choice stops the run.
- find-or-create passes ws-create the `--ws` value (if any) and the subject inputs, and ws-create matches; find-or-ask matches and asks itself, then passes ws-create `--ws {chosen name}` and the subject inputs.
- Caller check: continue only if the printed `Workstream:` path holds `decisions.md`, `inputs.md` and `workings/`, and `inputs.md` lists this run's subject inputs; otherwise stop and report, writing nothing elsewhere.

## Reports over time

- A report is `{ws}/report-{skill}.md`; if taken, the next free `-2`, `-3`. The `report-` prefix is reserved for reports. Reports and `decisions.md` sit in the ws root, never in `workings/`. In a ws these names supersede any save path or publish step another convention prescribes.
- Current: the highest suffix of each kind (for scope-review, of each `Mode:`); a closing review stops being current once an envelope newer than the one its `Baseline:` names exists. The current report is complete: no reader needs an earlier one. `decisions.md` overrides any report text an entry supersedes.
- A run never changes another run's report or its records under `workings/`.
- Prior: the current report of the run's own kind (and mode) in the ws, if any; the user may name another, or decline one, in the trailing text; `Prior:` records it. A prior is never inferred from an input's role.
- A run accounts for every id of its prior in `## Changes from prior`: carried with the same meaning; narrowed (same id, stating what remains); resolved (pointing to the `D{n}`, or to the `A{n}` or `V{n}` recording the fact); or retired with a reason. Other ws reports a run consumes are accounted for where its template says, never in Changes from prior.
- Inherited content is a proposal: anchors are re-verified at this run's `Grounded at:` before anything leans on them; accepted `D{n}` still bind.
- A run never silently contradicts an accepted entry: it may supersede a direction-level choice, stating the evidence; evidence against an owner's answer becomes a new question to the owner.

## Identifiers

- Report ids: `G`, `A`, `X`, `Q`, `C`, `R`, `I`, `O`, `V`, stages `S{k}` and gate clauses `S{k}.{m}`. Within a report each is unique and never rebound; a carried id keeps its number; new ids continue above the prior's highest of that kind.
- A bare id is the citing report's own; another document's id is cited `{file}#{id}` (`{file}` is the ws filename, e.g. `report-scope-envelope.md#G3`, or a repo-relative path outside the ws); `D{n}` is always bare and ws-wide.
- Run identifier: none, except the sibling-exchange id (8 hex), minted per exchange and carried in `Exchange:`.

## workings/

- Shared by every skill and downstream run in the ws; its organisation is the orchestrator's call (e.g. `workings/scope-envelope/` for skill-internal material, the top level for what others may use).
- Resumability: write state down as the run progresses, so another session could pick up where it left off; a principle, not a gate.
- Retained, never deleted.
- Exceptions: protocol-fixed artefacts stay where their protocol puts them (the consultation request under `.ace/reports/`), and the report records their path; a probe's isolated location may sit outside the ws.

## Decision log

- Rules for `decisions.md` -- what is recorded, entry format, statuses, single writer, appending, citing -- are stated once, in its header, seeded from `../ws-shared/decisions-template.md`. A ws's own header governs that ws.
- Read the log at run start; accepted entries are established constraints, passed to the agents whose work they bear on (the whole log, not an excerpt, goes with any stage hand-off).

## Interview in a ws

Both scope skills diverge from the shared interview procedure in the same way; this section is the only statement of it.

- Run `../agent-shared/interview.md`; its `## Run the interview tool`, `## Collect answers` and `## Unresolved marker` apply. Its `## Update the report` and `## Save updated report` are replaced by the rules below (no `Answer:` lines, no removed questions, no woven restatement, no publish phase).
- Present only `user`-owned open questions, blocking and deferrable; fold a question that depends on another into it, so the per-call limits drop nothing.
- A question made moot by another answer is resolved without asking: its line ends `-> D{m} (moot)`, pointing to the entry that mooted it; it gets no entry of its own.
- Only actual answers become entries; declined, cancelled and failed questions stay open. The `Interview:` marker counts unresolved presented questions only.
- An answer rejecting a recommended option takes the owner-override source form; a question asked with no recommended option never does.
- After the interview, append this run's entries in one go (answers, direction-level choices, `Defer:` entries), then update the report once: resolved lines keep their place with `[Resolved] -> D{n}`, every statement an answer invalidates is revised, and `Decisions:` lists the added ids. Draft and reviewer findings stay in `workings/`.

## Questions outside the interview

- Choosing a ws, routing consent, authorisation for live access: asked in the orchestrator's own loop.
- At most three options per question; split larger sets into successive questions without dropping any.
- Ask with `request_user_input`; where it is unavailable, ask in plain text and wait for the answer.
- These are routing choices, not interview questions: this supersedes run-interview's keep-current rule for them -- offer only real alternatives, recommending one where the evidence favours it.
