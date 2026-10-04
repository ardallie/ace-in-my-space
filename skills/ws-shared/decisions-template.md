# Decision log

This file records the decisions made in this workstream, one entry per decision. Read it before working here: an accepted entry is a binding constraint, and it overrides any report text it supersedes.

## How to use this log

**What is recorded.** An owner's actual answer to a question, and a direction-level choice a report or a later run commits to, including putting a finding on the backlog (head such an entry `### D{n} -- Defer: {report file}#{id} -- {short description}`; its Consequences name the revisit trigger, and it stays in force until a later entry that takes up or drops the finding supersedes it). A question that was declined or never answered is not a decision: it stays open where it was asked; one that another answer made moot is resolved by that answer's entry and gets none of its own.

**Entry format.** Each entry is an H3 block under `## Decisions`:

```
### D{n} -- {short title}
Status: accepted
Date: {yyyy-MM-dd}
Source: {one of the source forms below}
Context: {the situation and the question or choice, readable without the report}
Options: {each option weighed, with why it won or lost; the recommended one marked} | none
Decision: {what was decided, concretely}
Consequences: {what it binds or rules out, and what follows from it}
Stages affected: {report file}#S{k}, ... | none
```

**Source forms.**
- `{report file}#Q{n}, owner answer` -- the owner chose the recommended option, or no option was recommended
- `{report file}#Q{n}, owner override (recommended: {option})` -- the owner rejected the recommended option
- `{report file}#{id}, direction` or `{report file}, section {section}, direction` -- a choice the report commits to
- `{record where it was decided: a plan, a workings/ file, an issue or PR, another workstream's decisions.md#D{m}}, {owner answer | owner override (recommended: {option}) | direction}` -- a decision made outside a report

**Statuses.** `accepted`, or `superseded by D{m}`.

**Rules.**
- Append only. Never change or remove an entry. The one allowed change: when a new entry reverses or replaces an earlier one (a `Defer:` entry included), flip the earlier entry's `Status:` to `superseded by D{m}`; the new entry names what it supersedes in its Context. A run may supersede a direction-level choice, stating its evidence; only the owner's own later answer supersedes an owner's answer, so evidence against one becomes a question to the owner.
- Numbering: the next entry is the highest `D{n}` under `## Decisions` plus one. The log starts empty, so the first entry is D1. Numbers are never reused.
- One writer: during a run only its orchestrator appends, in one go, after re-reading the highest number. Other agents propose entries to it.
- Cite an entry as `D{n}` instead of restating it, and check its current status here. Only the run that wrote a report marks its questions resolved (`Q{n} [blocking|deferrable] [Resolved] -> D{m}`, its tag unchanged; a question another answer made moot keeps its text: `Q{n} [blocking|deferrable] [Resolved] -- {question} -> D{m} (moot)`); anyone else leaves the report untouched: the entry's Source names the question, and this log overrides the report.

**Example** (an illustration, not an entry):

```
### D{n} -- Keep drafts on the device until the first sync
Status: accepted
Date: 2026-01-15
Source: report-scope-envelope.md#Q4, owner answer
Context: Q4 asked where unsent drafts live before their first successful sync.
Options: on the device (recommended) -- works offline; on the server -- every edit needs a connection.
Decision: Drafts stay on the device until their first successful sync; the server never holds a partial draft.
Consequences: A draft on a lost device is lost; the sync stage owns conflict handling.
Stages affected: report-scope-envelope.md#S3
```

## Decisions
