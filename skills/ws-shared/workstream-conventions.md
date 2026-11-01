# Workstream conventions

Consumed by every skill that works in a workstream (ws). A skill cites this file, states which resolution variant it uses, and restates none of it; a step skill also states what `## Steps` leaves to it.

## Workstream

- A ws is a directory directly under `.ace/ws/` named `{yyyyMMdd}-{slug}` (lowercase letters, digits, single hyphens, no dots); anything else there is not a ws and is never reused, renamed or deleted.
- Layout: `{ws}/index.md`, `{ws}/inputs.md`, `{ws}/decisions.md`, `{ws}/prompts/`, one artefact `{ws}/{nn}-{skill}.md` per step, and `{ws}/workings/`, holding one folder `workings/{nn}-{skill}/` per step. A ws begun before this layout holds other names instead, read in place (`## Old-layout workstreams`).
- The ws is the system of record: no skill in a ws writes to GitHub (issues, pull requests, comments; pushing a branch is git, not such a write), with one exception: scope-report-triage, in PR mode only, runs `/ace:pr-response` once its own push, where it has commits to push, has put its fixes on the pull request's head and pr-response's push-state gate passes; pr-response then posts its summary comment and threaded replies on the pull request triaged, and the triage record keeps what was posted; the exception covers nothing else -- no pull request created or edited, no label, no review resolved, no issue, no other comment. A report is shared by hand with `/ace:report-publish`; issues and PRs may be read as inputs.
- Only `/ace:ws-create` creates a ws or writes `inputs.md`: run it as a skill, or read and follow `${CLAUDE_PLUGIN_ROOT}/skills/ws-create/SKILL.md`.

## Terms

Each term is defined here only, and used in this sense only.

- Run: one invocation of a skill, together with every later invocation that resumes its step (`## Steps`). Session: one of those invocations; a resumed run has several.
- Step: the numbered record set -- its numbered folder and, once written, its artefact -- that one run of a scope-* skill opens in a resolved ws, from its open point to its close, its resumed sessions included (`## Steps`). "Step" never names an action within a run.
- Artefact: the root file a step produces, `{nn}-{skill}.md`. An old-layout report or handoff, which no step produced, is read as the artefact of its kind (`## Old-layout workstreams`).
- Report: an artefact of the envelope, scope review or code review kind (scope-envelope's; scope-review's, closing review or discovery sweep; scope-code-review's). Only reports carry report ids and `Prior:`, and only a report's `Decisions:` line is set by its interview.
- Handoff: scope-implement's artefact. Triage record: scope-report-triage's artefact. Delivery records: the handoffs and the triage records.
- A step's records: its folder's contents under `workings/`.
- Read-only exit: a stop of a run, named by its skill or by these conventions (`## Steps`), that writes nothing.
- The workstream index: the root `index.md` whose first line is `# Workstream index` (`## Workstream index`). Any other `index.md` belongs to the folder that holds it.
- The next step: one line a run prints at its Close, a read-only exit names or ws-create's `## Output` prints, in `## Hand-off loop`'s form -- a command, or in plain words an owner's action or the terminal; a Close may print several, in order (its next steps).

## Inputs

- Forms: one or more files; an issue or PR by number or URL, read with its comments; files plus an issue or PR; none, meaning the latest actionable request in the conversation. A skill may add forms.
- Trailing text steers the run.
- Subject inputs state what the work is (the package, the prose ambition, the issue, the review subject); everything else is supporting (items a package lists, specifications, baselines, consultant answers, delivered work) and is never recorded or matched. The calling skill classifies them by judgement (if unclear, the first input is the subject) and passes ws-create only the subject inputs. A run with no subject input records nothing; its slug words come from what the work it was given says it does.
- `inputs.md` line: `` - `{key}` -- {what it asks for, one line} (added {yyyy-MM-dd}) ``. Keys: repo-relative path with forward slashes (outside the repo, absolute with forward slashes); `#{n}` or `{owner}/{repo}#{n}` for an issue or PR; for conversation context, the key of the file or issue it plainly names, else `conversation`. A path inside any ws is never listed: a subject input inside the run's own ws (a brief under `prompts/`, an earlier step's artefact) is matched by its location and named ws-relative (`prompts/brief.md`, `05-scope-code-review.md`). Lines are appended, never changed or removed.
- A step's input is its artefact's input line (`Source:`, or `Brief:` for a handoff) once the artefact exists, else the same line opening its state record (`## Steps`); the workstream index copies it, and no other place states it.
- `prompts/` holds owner- or agent-written prompts and briefs and the material that prepares them. ws-create makes it with a new ws; no skill adds it to an existing one. It is no record: never indexed (the index names a prompt only as a step's input), and no skill writes, moves or deletes anything in it.

## Naming

- `{yyyyMMdd}` is the local creation date (or the date a full `--ws` name gives), never re-derived.
- `{slug}` is 2-4 kebab-case words naming the subject as the inputs state it; never copied mechanically from a filename, never a path, extension, container word (`brief`, `notes`) or skill name; a short descriptive filename may give the same words; a source identifier (package or issue number) may be one word. Invented examples: `.ace/wpak/packages/04-billing-export.md` -> `04-billing-export`; an item file `checkout--usability--card-retry-gives-no-feedback-after-a-declined-charge.md` -> `card-retry-feedback`; a `brief.md` asking for offline drafts -> `offline-drafts`.
- Whoever derives a slug checks it against every existing ws first: it is taken when a ws's slug (the part after its `{yyyyMMdd}-`) equals it, whatever the date. A ws that takes it and whose `inputs.md` asks for the same thing under another key is a candidate; either way a new ws takes other words that still name the subject, so a "create new" choice passed to ws-create by name never turns into a reuse.
- A `--ws` value may be a path, a ws name or a bare slug: match the exact name first, then any ws whose slug equals the value, whatever its date; a ws whose slug merely ends with the value never matches. With no match, a full name is created as given and a bare slug gets today's date.

## Resolving a ws

- Resolve once the inputs are known to be actionable (a read-only lookup of `--ws` may come first) and before any agent work other than the spawn confirmation in orchestration.md's `## Route`, in the orchestrator's own loop.
- Every path ends in ws-create, "use it" included, so a new subject input lying inside no ws is appended to a reused ws's `inputs.md` by the single writer; find-only, which takes no subject input and creates nothing, excepted.
- Without `--ws`, never by re-deriving a slug: a ws matches when one of the run's inputs lies inside it, or one of the run's subject inputs is recorded (same key) in the ws's `inputs.md` and still asks for what its latest line for that key says; if that is doubtful (the input still concerns the recorded ask but narrows, widens or partly replaces it), the ws is a candidate, unless another ws matches on that key. Shared supporting material and similar slugs never match.
- Variants (each skill states its own):

| Case | find-or-create (scope-envelope) | find-or-ask (scope-review) | find-only (scope-implement, scope-code-review, scope-report-triage) |
|---|---|---|---|
| `--ws`: one ws | use it | use it | use it |
| `--ws`: several | ask: one of them, or stop | ask: one of them, or stop | ask: one of them, or stop |
| `--ws`: none | create under that name | ask: create under that name, a ws matching the inputs, or stop | say so and stop |
| no `--ws`: one match, no candidate | use it | ask: use it (recommended), create new, or stop | say `--ws` is required and stop |
| no `--ws`: several matches, or any candidate | ask: one of them, or create new | ask: one of them, create new, or stop | say `--ws` is required and stop |
| no `--ws`: nothing | create with a derived slug | ask: create `{derived name}`, or stop | say `--ws` is required and stop |

- Offer each ws with its name; its first `inputs.md` entry, else its first step's input; its steps as its workstream index lists them, else its numbered artefacts in the root; and, for a ws holding old-layout records, what `## Old-layout workstreams` adds. A "create new" option shows the name it will use; a declined choice stops the run.
- find-or-create passes ws-create the `--ws` value (if any) and the subject inputs (a subject stated only in conversation as `conversation: {what it asks for}`), and ws-create matches; find-or-ask matches and asks itself, then passes ws-create `--ws {chosen name}` and the subject inputs in the same form; find-only matches and asks itself and runs no ws-create.
- Caller check: continue only if the printed `Workstream:` path (find-only: the chosen ws, as nothing is printed) holds `decisions.md`, `inputs.md` and `workings/`, and `inputs.md` lists every subject input of this run except one lying inside the ws (find-only: `decisions.md` alone); otherwise stop and tell the user why, writing nothing elsewhere. A subject input inside another ws can have no line, so it stops the run here: the stop message names the ws holding it and prints the run's own command against that ws, `/ace:{skill} --ws {that ws}[ {input}]`, `{input}` named relative to that ws (`## Inputs`), in `## Hand-off loop`'s form, and the input is never reclassed as supporting to pass. The check never requires `index.md` or `prompts/`.
- Once the ws is resolved, a run uses its resolved path in its records, its artefact and every assignment, never a report's `Workstream:` line.

## Steps

- Which runs take a step: only runs of the scope-* skills -- `scope-envelope`, `scope-implement`, `scope-review`, `scope-code-review` and `scope-report-triage` -- in a resolved ws; not ws-create, another skill's run, or the owner's own work. Work that serves a step (agents' records, trials, live passes, kept evidence) stays in its folder; brief preparation goes in `prompts/`; another skill's output stays where its own convention puts it, and the consuming step's input names it.
- Name grammar: a name that is exactly two or more digits, a hyphen and one of the five skill names above, then nothing for a folder directly under `workings/`, or `.md` for a file in the root; nothing comes before the digits. Only a step's own open writes such a name. A folder or root file outside the grammar is no step and counts for no number and no currency; a name that merely starts with digits, a timestamped file among them, is outside it. A new step skill joins the list above.
- Number: the highest number among the names the grammar matches in a fresh listing of `workings/` and the root (never the workstream index), plus one (`1` when none matches), compared as integers, never as text. `{nn}` is that number zero-padded to two digits, unpadded from 100, so `100-{skill}` follows `99-{skill}`. Nothing is inserted between existing steps; gaps stay.
- Claim: the run creates `workings/{nn}-{skill}/` with a creation that fails if the name exists, before writing any file into it, then re-lists `workings/`. The claim collides when that creation fails or the re-list shows another folder carrying its number.
  - On a first collision the run yields once: it removes the folder it created, if any -- only while that folder is still empty, by a removal that fails on a non-empty folder, never a recursive one -- then recomputes the number from a fresh listing and claims again.
  - On a second collision it removes the folder it created, if any, in the same way, stops and tells the user: the run takes no step.
  - A file write that creates its parent folder implicitly is no claim. The claim's safety assumes a local filesystem whose directory operations are ordered; two sessions resuming one step at once are not guarded.
- Open: a run opens its step once its ws is resolved, its caller check has passed, and its read-only exits and any questions that precede its first `workings/` write are behind it, before that write; a skill that resumes steps opens one only once it has decided not to resume. Opening is the claim, then the state record's opening lines. A run that stops before its open point -- at a read-only exit, a declined question, or a second collision -- takes no step and writes nothing.
- State record: `state.md` at the top of the step's folder. It opens with the step's input line (`Source: {input}`, or `Brief: {report file}` for scope-implement) and one `Run:` line per session of the run -- `Run: /ace:{skill}; harness {harness}; orchestrator {model id | unknown}; {yyyy-MM-dd}` -- and holds after them what its skill puts there.
- Stops after the open, by what they leave (`Stopped:` is never written beside an artefact, whose status then governs):
  - nothing to continue: `Stopped: {yyyy-MM-dd} -- {why}` in the state record and no artefact; the step is neither open nor resumable; a step whose skill never resumes and that made no external effect always stops this way, whatever work remains;
  - work left, or an external effect made (a commit, a push, a post): the artefact at `Status: partial -- {what remains}` and no `Stopped:` line; only a delivery record stops this way, and the step is resumable by its own skill where its resume rule picks it (Resume, below), otherwise evidence for the next run;
  - a crash: neither, and the step reads as open.
- Artefact writes: a report is first saved at `Decisions: pending`, from which save it is an artefact, and is finalised at its step's close; a delivery record may be written before close and is rewritten by its own step, across its sessions, until close, at `Status: complete | partial -- {what remains}`.
- Resume: a resumed run continues its step -- same number, folder and artefact name -- claims nothing, and adds a `Run:` line. Only a skill whose resume rule picks the step to continue resumes; every other run opens a new step, leaving an unfinished one as it is. A step's records belong to its run across all its sessions.
- Close: the artefact's final write.
- Every artefact's header carries `Date:`, the day of the artefact's latest write; its input line (`Source:`, or `Brief:` for a handoff); `Mode:`, where its skill has modes; its status field (`Decisions:` for a report, `Status:` for a delivery record); and `Next:`, the next steps its Close printed, recorded as `## Hand-off loop`'s form says (`pending` on a write before its Close). Every field two artefact forms share keeps this order by name, wherever a form has it: `Title:`, `Type:`, `Date:`, `Workstream:`, the input line, `Mode:`, `Prior:`, `Grounded at:`, `Status:`, `Decisions:`, `Next:`, then `Baseline:`, `Delivered:`, `Branch:`, `Commits:`, `Checks:`, `Open:`; each form puts its own fields where it states. A field two forms share keeps one name and one value grammar, except where this bullet or the form's own guidance says why. The input line names each kind's own input (`## Inputs`): a report's given inputs, a code review's subject, a delivery record's brief or triaged input. `Checks:` reads `none -- no change` only on a delivery record, whose run has no checkpoint when it changes nothing. A step's kind is its skill, read from its name, and its `Mode:`; `Type:` is never read for a kind.
- A run never changes another step's artefact or records. In a ws these names supersede any save path or publish rule another convention prescribes.
- Each step skill states only: its open point; its read-only exits beyond the shared ones; its resume rule, or that it never resumes; and its artefact (its kind, input line, `Mode:` values and status field). The shared read-only exits, which no skill restates: a failed spawn confirmation, in a skill that spawns agents (orchestration.md's `## Route`); a `--ws` that matches nothing, under find-only, a declined ws choice and a failed caller check (`## Resolving a ws`); and the overlap question's wait or stop (`## Discovery and currency`).

## Workstream index

- `index.md` is a view of the ws, regenerated whole from the step folders and the artefacts' headers, never a record: it holds nothing they do not, and where it disagrees with them, they win. A missing or stale index is rebuilt, never edited in part or reconciled; an owner's root `index.md` (below) is neither.
- Every run and downstream reader reads it first, for orientation. A rule that decides -- the next number, current, prior, resume, the delivery-record set, the overlap question -- reads the folder listing and the headers, never the index alone.
- Writers: a run that takes a step regenerates it after its open, after writing a `Stopped:` line, and after each write of its artefact; ws-create writes the first one on Created. A reader that takes no step derives what it needs and writes nothing. It is fresh when it lists exactly the steps the grammar finds, each at the status its headers give now: a delivery record moving from partial to complete changes a status, not a name.
- It lists numbered steps only. In a ws holding old-layout records it adds the one pointer line below and never lists those records, so it begins at the first numbered step. It never lists `prompts/` or its files; a step's input may name one.
- Its first line, `# Workstream index`, marks it. A root `index.md` that opens otherwise is an owner's file, never overwritten or removed: while it stands, no run writes an index in that ws, and each run that would regenerate one says so to the user.
- Form, in this order; `[...]` marks a line written only where it applies; the form's own `## Steps` heading holds one line per step, in number order, or the bare line `none`:

```
# Workstream index

Workstream: .ace/ws/{name}
Derived: {date of this regeneration} from the step folders and the artefacts' headers; regenerated whole, never edited; where it disagrees with them, they win
Latest: {nn}-{skill} -- {status} | none
Next: {the Next: of the highest-numbered complete step | none}

## Records

- `inputs.md` -- what this workstream is for
- `decisions.md` -- the decision log
[- Old-layout records precede every step below; read them through the workstream conventions' `## Old-layout workstreams`]

## Steps

- `{nn}-{skill}` -- {mode | none} -- {status} -- input: {input | none} -- `workings/{nn}-{skill}/` -- `{nn}-{skill}.md` | no artefact -- {date | none}
[none]
```

- Fields: `Latest:` the highest-numbered step, with its status; `Next:` copied as recorded from the highest-numbered complete step, an open step numbered above it being left to the overlap rule (`## Discovery and currency`); the skill from the name; the mode from the artefact's `Mode:`; the input per `## Inputs`; the date from the artefact's `Date:`, else the state record's first `Run:` line; a folder holding no state record yet gives `none` for its input and date. Status:
  - `open`: no artefact, no `Stopped:` line;
  - `stopped -- {why}`: no artefact, a `Stopped:` line;
  - `pending`: a report at `Decisions: pending`;
  - `partial -- {what remains}`: a delivery record at `Status: partial`;
  - `complete`: any other artefact.

## Discovery and currency

- Every rule that finds a step or an artefact reads the step set: the steps the grammar finds, each with its number, its skill (from its name), whether its artefact exists, and from that artefact's header its `Mode:`, status field, input line and, for a closing review, the envelope its `Baseline:` names. No rule outside `## Old-layout workstreams` finds a step or an artefact by a fixed file or folder name.
- Current: the current artefact of a skill, and of a mode where the skill has modes, is the highest-numbered step of that skill (and `Mode:`) whose artefact exists; an artefact with no `Mode:` line has no mode, and is matched only with artefacts that have none. A step with no artefact is never current and never a prior. A closing review also stops being current once an envelope artefact exists at a step above the one its `Baseline:` names, and a retired closing review makes no lower one current. The current report is self-contained: no reader needs an earlier one. `decisions.md` overrides any report text an entry supersedes.
- Prior: a report's prior is the current report of its own skill and mode when its run opens, so its own step is never its own prior; the user may name another report of its own skill and mode, or decline one, in the trailing text, and a named report of another skill or mode is refused, the user told why; `Prior:` records it.
- Rules about a report's own entries -- which entries are claims for the closing review, which entries a code review may supersede as its own prior runs' -- name the report kinds, never a file pattern or "any artefact". A delivery record is no report: entries its `Decisions:` line lists stay claims.
- The delivery-record set, which every reader of delivered work reads: the baseline envelope's implementation handoff, then every delivery record (handoff or triage record) after it, in step order.
  - The baseline envelope is the one the reading skill takes as its baseline. Its implementation handoff is the artefact of the highest-numbered scope-implement step with `Mode: implementation` whose `Brief:` names it; where none does and the envelope is old-layout, the old-layout one (`## Old-layout workstreams`). With neither, no delivery is recorded.
  - Step order puts old-layout records first, in their own order, then numbered steps by number: every numbered delivery record follows an old-layout handoff.
  - A triage record carries the handoff's delivery fields (`Branch:`, `Commits:`, `Checks:`, `Decisions:`, `Open:`, `Next:`) in the same forms.
- Overlap: before its claim, a run that has decided not to resume and finds an earlier step of its own skill, whatever its mode, with no artefact and no `Stopped:` line, numbered above that skill's highest artefact, or with none, at any number, asks the owner one routing question (`## Questions outside the interview`): proceed, which opens its step; wait or stop, each ending the run with no step taken and nothing written, wait meaning it is re-run once the other run ends.

## Hand-off loop

- The loop is the edges below, each with its condition; its main path: envelope, implementation, closing review, [remediation, closing review]*, code review, [report-mode triage, code review]*, the owner's pull request, [PR-mode triage after each review of the pull request]*, merged. Every next step a Close prints is one of those edges, and so is every next step a read-only exit names. A Close cites this section, judges only the conditions its own skill states, and prints in the form below; it runs none of its next steps, on either harness: each is printed for the owner, `/ace:scope-report-triage` included.
- Form. Each next step is one printed line, in the order the owner takes them:
  - a command: `/ace:{skill} --ws {ws}[ {input}][ {trailing text}]` for a scope-* skill, another skill's command as that skill takes it. In a printed line `{ws}` is the ws's name, `{yyyyMMdd}-{slug}`, which `--ws` matches exactly (`## Naming`); every other `{...}` is filled by the printing run, and a value only the owner can supply later is printed `<...>`, as in `pr <number|URL>`;
  - or, where the next step is no command -- an owner's action (opening the pull request, pushing a branch, answering a named question) or the terminal -- a few plain words naming it;
  - either optionally followed by ` -- {clause}`, one clause with no semicolon giving its condition, place, owner, or what it entails; an alternative to the line above says so in that clause (`-- in place of the line above, ...`), and a second clause a rule adds joins the first with `, and `. Text a skill gives to describe a run, or why a step follows, is not printed.
  - `Next:` (`## Steps`) holds the printed lines, each as printed, in print order, joined by `; `; a list printed after the next steps (a review's sibling-owned questions) stays off it.
- The delivery branch: the branch the delivery-record set names (`## Discovery and currency`), else the closing review's `Delivered:`; with neither, the branch the current code review reviewed, and the first next step printed for that branch ends with `completion needs a delivery record`, as its clause or joined to its clause by `, and `.
- The default-branch test: a default-branch commit carries a branch's content when it has the branch tip's tree, or the patch-id of the tip's combined diff from the merge-base; never ancestry, which squash merges and rewrites defeat.
- Cover: a code review covers the delivery while it is the current code review, its verdict is `ready`, its subject was a branch carrying the delivery, and the delivery tip (the reviewed branch's, where it carries the delivery) is its reviewed commit or the commits since change no file. A named commit or folder never covers it. A later commit that changes content, a triage's in either mode included, ends the cover until a repeat review; commits that change no file leave it standing.
- Terminal: the delivery is complete when a current `ready` code review covers it and its content reaches the default branch (the default-branch test). Nothing else is called the delivery's completion. Its printed line: `the delivery is complete`.
- Limit, disclosed: a delivery that reaches the default branch by ancestry (a fast-forward or a merge commit) before a `ready` code review covers it cannot reach the terminal. The code-review line sent for it stops at scope-code-review's merged tip (its `## Subject`), which prints the terminal only where a current `ready` code review covers the delivery and otherwise names no next step; a named commit never covers. No edge closes this.
- The code-review line: every printed `/ace:scope-code-review --ws {ws}` adds `branch {branch}` when the checkout is not on the delivery branch, and `full review` as trailing text when the current code review's subject, where there is one, was not the delivery branch (a named commit or folder, or another branch), so that the review covers the whole delivery. The repeat review is this line where a current code review exists.
- Edges, by the step that prints them; each condition is that step's to judge:
  - Into the loop: ws-create, run by the user, prints `/ace:scope-envelope --ws {ws} {subject inputs}` or `/ace:scope-review --ws {ws} {subject inputs}` (its `## Output`); a discovery sweep, and scope-implement finding no brief, print `/ace:scope-envelope --ws {ws}`.
  - Envelope: `/ace:scope-implement --ws {ws}`, then `/ace:scope-review --ws {ws} -- after the implementing run`. Where it routed questions to a sibling, before them the consultation round: `/ace:agent-consultant {request path} -- in {repository}, the request copied there`, then `/ace:scope-envelope --ws {ws} <answers path> -- here, once the answers are back`, and, where scope-envelope's E9 allows the alternative, `/ace:scope-implement --ws {ws} <answers path> -- in place of the line above`.
  - Implementation: `/ace:scope-review --ws {ws}`.
  - Partial: a delivery record at `Status: partial` names its skill again -- `/ace:scope-implement --ws {ws}`, which resumes the step, or `/ace:scope-report-triage --ws {ws}[ pr {number}]`, a new step reading it as evidence, then, after a triage that pushed content, the repeat review, its clause `-- before merge`.
  - Closing review: with remediation stages, `/ace:scope-implement --ws {ws}`; with none, the closing-review rule below, so it prints what a remediation run with nothing to deliver would.
  - A review whose questions a sibling owns: `/ace:agent-consultant -- in {repository}, the questions below pasted`, after the review's other next steps; the questions, as scope-review's R10 names them, printed after the next steps; the answers return as input to a later run here.
  - The closing-review rule, after a remediation run or for a closing review with no remediation stages: each that applies, in this order, each condition judged read-only at the current state from the delivery's records -- a remediation run's own handoff; otherwise the delivery-record set (`## Discovery and currency`), else the closing review's `Delivered:`:
    - the repeat closing review, `/ace:scope-review --ws {ws}`, if a delivery record the current closing review does not already account for leaves a gate clause unverified (a deferred one is not), or the open items hold drift or a `Defer:` whose trigger has fired;
    - then the code-review line, if the delivery branch, at its current remote tip, carries content no default-branch commit carries (the default-branch test; a branch gone from the remote carries nothing);
    - with neither: the terminal where a code review covers the delivery and the default-branch test holds for it; else the code-review line.
  - Code review, by its verdict:
    - `ready`, covering the delivery: `/ace:scope-report-triage --ws {ws} -- optional, before the pull request, and a content change it commits needs the repeat review`, printed only where the report leaves something to triage (a C, R or O outside its exceptions, an I carrying `Fix:`, or an open Q line); then `the pull request for {branch} -- opened by the owner where none is open`; then `/ace:scope-report-triage --ws {ws} pr <number|URL> -- once the pull request has a review`. Where the delivery has already reached the default branch (the default-branch test), the terminal in their place.
    - `ready`, not covering it: the repeat review, as completion waits for it.
    - `not ready`: `/ace:scope-report-triage --ws {ws}`, then the repeat review.
  - Report-mode triage: with commits, made or withheld, the repeat review, after `commit and push the fixes to {branch}` where it withheld the commits, or `push {branch}` where it withheld only the push. With none: the repeat review where the `decisions.md` entries it appended hold a finding or settle a question of the code review (any of its findings or Q lines, `[low]` findings included); else, where the code review still covers the delivery, the `ready` edge's lines, judged at the current state, without the optional triage; else, where the verdict is `ready`, the repeat review; else each finding or question still holding it `not ready`, as `settle {id} -- owner {owner}`, then `/ace:scope-report-triage --ws {ws} -- once answered`.
  - PR-mode triage, replies posted: `the pull request's re-review -- outside the ws`, then `/ace:scope-report-triage --ws {ws} pr {number} -- once it comments again`; where it pushed content, then the repeat review, its clause `-- before merge`, since that content ends the cover. Pushing nothing leaves the cover as it stood.
  - PR-mode triage, posts withheld (by its trailing text, or by a withheld commit or push): `commit and push the fixes to {branch}` where it withheld a commit, or `push {branch}` where it withheld only the push; then `/ace:scope-report-triage --ws {ws} pr {number}`; then, where it pushed content or left content for that push, the repeat review, its clause `-- before merge`. With nothing to push, the re-run alone.
  - Any other effect a triage withheld, or one that failed, puts the owner's action it leaves before the edge, printed as the action in plain words; that skill's Close names the action.
  - Read-only exits name the edge into the step their condition lacks, in the same form, as each exit states it (its skill's, or `## Resolving a ws`'s caller check); scope-code-review's merged tip prints the terminal where a current `ready` code review covers the delivery, else no next step (the limit above).

## Old-layout workstreams

A ws begun before the numbered layout is read in place: nothing in it is renamed, rewritten or back-filled (the decision log's own append and header rules aside), and every citation of its names stays valid. This clause is the only place that names its records; skills cite it.

- Old-layout reports, each read as a report of its kind: `report-scope-{kind}.md` and `report-scope-{kind}-{digits}.md` in the root, `{kind}` exactly one of `envelope`, `review`, `code-review`. No other old-layout root file is read as a report or a step: an owner-renamed form (`-trial-1`), a `report-` file of no scope skill, a timestamped `{yyyyMMdd}-{HHmm}-...` file, `RESUME-PROMPT.md`.
- Old-layout handoffs, each read as a handoff and so as a delivery record: `handoff.md` in `workings/implementation*/` (mode implementation), in `workings/remediation*/` (mode remediation), or flat in `workings/` (mode by its `Brief:`), read by judgement: formats vary, and a missing folder or handoff proves nothing. In a ws holding one old-layout envelope, an old-layout implementation handoff is that envelope's whatever its `Brief:` says; where several such handoffs exist, which one is its implementation handoff is judged from their records. An old-layout remediation handoff is attributed to the closing review its `Brief:` names, read by judgement. Other `workings/` folders (`scope-envelope/`, `scope-code-review/`, `brief/`, `trial/`) are no steps.
- Among old-layout records the old rules hold: a kind's current report is its highest suffix (none, then `-2`, `-3`), for scope-review per `Mode:`; a closing review stops being current once an envelope newer than the one its `Baseline:` names exists; the old-layout delivery-record set is the baseline envelope's implementation handoff, then every remediation handoff (with one old-layout envelope, all of them; with several, those judged from their records to follow it), by folder suffix (none, then `-2`, `-3`).
- Every old-layout record precedes every numbered step. An old-layout report is current only while no numbered step of its skill (and mode) has an artefact; any numbered envelope artefact retires an old-layout closing review.
- Old-layout names never match the step grammar, so a ws's first numbered step is `01`; its workstream index begins there and carries the pointer line to this clause.
- A ws that holds a numbered step gets no new old-layout file: no run of a plugin version before the numbered layout writes there. No skill can detect a breach.
- An unfinished old-layout run is never resumed: a run of a delivered skill reads its records as evidence, re-verified at the current state before anything leans on them, and opens a numbered step. A partial old-layout handoff for a brief that a numbered handoff also names is such evidence, and no member of the delivery-record set (`## Discovery and currency`). A run whose open takes the first numbered step in a ws holding old-layout records switches that ws to the numbered layout; it says so to the user at its open, stating that an unfinished old-layout run is never resumed and that a ws holding a numbered step gets no new old-layout file.
- For a ws holding old-layout records, an offer or a spawn-confirmation listing (`## Resolving a ws`) adds its root `report-*` files.

## Reports over time

- A run accounts for every id of its prior in `## Changes from prior`: carried with the same meaning; narrowed (same id, stating what remains); resolved (pointing to the `D{n}`, or to the `A{n}` or `V{n}` recording the fact); or retired with a reason.
- Inherited content is a proposal: anchors are re-verified at this run's `Grounded at:` before anything leans on them.
- A run never silently contradicts an accepted entry: it may supersede a direction-level choice, stating the evidence; evidence against an owner's answer becomes a new question to the owner.

## Identifiers

- Report ids: `G`, `A`, `X`, `Q`, `C`, `R`, `I`, `O`, `V`, stages `S{k}` and gate clauses `S{k}.{m}`. Within a report each is unique and never rebound; a carried id keeps its number; new ids continue above the prior's highest of that kind.
- A bare id is the citing report's own; in a delivery record, the report its input line names (a PR-mode triage record's ids are the pull request's comment ids); in a `decisions.md` entry, the Source report's (with no report as Source, every report id takes its file); another document's id is cited `{file}#{id}`, `{file}` being the path relative to the ws root for a file inside the ws (`01-scope-envelope.md#G3`, `prompts/brief.md#P3`), else repo-relative; resolve against the ws root first; this ws's `D{n}` is always bare and ws-wide. Names are never renamed, so citations never dangle and old-layout names stay valid citations. A handoff or triage record mints no report ids: cite it by path, or `path:line`.
- A step is identified by its name, `{nn}-{skill}`. Run identifier: none, except the sibling-exchange id (8 hex), minted per exchange and carried in `Exchange:`.

## workings/

- Shared by every skill and downstream run in the ws. Each step keeps its records in its own folder, `workings/{nn}-{skill}/` (`## Steps`), organised as its orchestrator decides; others reach its material by pointer (artefact fields, `Detail:`, an entry's Source).
- Resumability: write state down as the run progresses, so another session could pick up where it left off; a principle, not a gate.
- Retained, never deleted; the one exception is the empty folder a run removes on a collision of its claim (`## Steps`), which is no record, so no record is lost.
- Exceptions: protocol-fixed files stay where their protocol puts them (the consultation request under `.ace/reports/`), and the report records their path; a probe's isolated location may sit outside the ws.

## Decision log

- Rules for `decisions.md` -- what is recorded, entry format, statuses, single writer, appending, citing -- are stated once, in its header, seeded from `${CLAUDE_PLUGIN_ROOT}/skills/ws-shared/decisions-template.md`. A ws's own header governs that ws's log; a report's line forms are its template's.
- Read the log once the ws is resolved, before any work leans on it: the header, then every entry, confirming the read reached the last. Accepted entries are established constraints, passed to the agents whose work they bear on.

## Interview in a ws

- Run `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/interview.md`; its `## Run the interview tool`, `## Collect answers` and `## Unresolved marker` apply. Its `## Update the report` and `## Save updated report` are replaced by the rules below (no `Answer:` lines, no removed questions, no woven restatement, no publish phase).
- Present only `user`-owned open questions, blocking and deferrable; fold a question that depends on another into it while the combined options stay within the per-question limit, else ask it in a later call once that answer is known, so the per-call limits drop nothing.
- A question made moot by another answer is resolved without asking: its line ends `-> D{m} (moot)`, pointing to the entry that mooted it; it gets no entry of its own.
- Only actual answers become entries; declined, cancelled and failed questions stay open. The `Interview:` marker counts unresolved presented questions only.
- Until the append, the report cites each proposed entry by a provisional `D{n}`, numbered on from the log's highest at drafting; the report update replaces them all in one pass with the numbers their entries receive.
- After the interview -- whatever its outcome, and also when no question was presented (this supersedes `## Collect answers`' "the report remains as saved") -- append this run's entries in one go (the proposed direction-level choices and `Defer:` entries in their provisional order, then the answers, each answer's `Options:` carrying every option its question weighed, those not offered included, with why it won or lost), then update the report once: answered lines keep their place, reduced to their pointer; findings recorded in `workings/` that depend on an answer are re-disposed wherever their disposition is recorded; every statement an answer invalidates is revised; and `Decisions:` lists the added ids.

## Questions outside the interview

- Every question a run asks outside its interview -- choosing a ws, confirming or naming a missing input (baseline, delivered work), routing consent, authorisation for live access -- is asked in the orchestrator's own loop.
- At most three options per question; split larger sets into successive questions without dropping any.
- Ask with `AskUserQuestion`; where it is unavailable, ask in plain text and wait for the answer.
- These are routing choices, not interview questions: this supersedes run-interview's keep-current rule for them -- offer only real alternatives, recommending one where the evidence favours it. A substantive owner question a run asks outside its interview -- a still-open blocking question it must settle, a settlement escalated to the owner, evidence against an owner's answer -- is no routing choice: it keeps run-interview's keep-current option, which takes one of the three option slots.
