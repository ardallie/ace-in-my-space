# Sibling exchange protocol

Shared conventions for the cross-repository request-response cycle: a session in one
repository (the requester) routes a question set to a complementary sibling repository,
where a consultant session researches its own codebase and returns a self-contained
answers report. The protocol is reusable anywhere the pack travels -- it names no project,
stack, or domain; anything repository-specific belongs in the individual skill files as
a delta. Each skill in scope states only its deltas; everything below applies uniformly
unless a skill documents an exception in its own file.

## Skills in scope

The registry of skills that participate in the exchange. Adding or retiring one means
editing this list only -- the surrounding prose never names skills beyond it.

- `${CLAUDE_PLUGIN_ROOT}/skills/agent-consultant/SKILL.md` -- consultant side, fully wired: accepts a
  request envelope (or any compatible question set), researches its own repository, and
  produces the response envelope.
- `${CLAUDE_PLUGIN_ROOT}/skills/agent-scope/SKILL.md` -- requester side, fully wired: its interview phase
  opens with a routing gate that classifies open questions and emits the request envelope.
- `${CLAUDE_PLUGIN_ROOT}/skills/report-publish/SKILL.md` -- guard-only: its degenerate-title guard is the
  mechanism that enforces the transport-only rule below, refusing the request envelope's H1
  so a request can never be published as an issue. It participates in no round.

A skill that only receives a response envelope does not consume this file and stays out of the
registry: the envelope re-enters as an ordinary input file, which such a skill already accepts
unchanged, so it needs no reference to the protocol and its absence here is not a gap.

## Premise and roles

Two repositories are developed side by side as halves of one system -- for example a
service and its client -- and each holds a replica of this pack. Whether a sibling exists
is inferred at runtime from the session's own grounding (a boundary seam in the system
specification, or a sibling reference in the inputs); in a repository without such
evidence the exchange simply never triggers.

Roles are per-exchange, not per-repository: either repository may act as **requester**
(the session that emits a request envelope) or **consultant** (the session that researches
its own repository and answers). The same skill pair works in both directions.

Envelopes describe each repository by role, never by name -- e.g. "the web client of this
system's service API". The role carries everything a zero-context counterpart session can
act on; a repository name adds nothing to the research and would bind the envelope's
worked examples to a host project.

## Transport assumption

A human carries every message across by hand -- pasted text or a copied file. There is no
shared filesystem and no cross-repository git, CLI, or network access, ever. No skill in
scope may attempt to read, fetch, or modify anything in the counterpart repository; the
printed or saved envelope is the entire interface, and a published issue in one repository
is invisible to the other.

## Self-containment (the reliability rule)

Every message must be readable and actionable with zero counterpart context:

- A request carries its own context recap -- a short orientation sufficient for a session
  that knows nothing of the requesting session. When the requester also hands over its
  source report, the report is supplementary grounding; the envelope must not depend on
  it.
- A response restates each question verbatim before answering it, so the answers file
  stands alone on the requester's side even when the request is no longer at hand.
- No path in either repository is assumed to resolve on the other side. Paths appear only
  as labelled evidence citations inside prose ("this repository's `<module>` under
  `<path>` does X"), never as links or inputs the counterpart is expected to open.
- Every round restates its context in full -- no round depends on a prior round's
  artefacts being present on the other side.
- The consultant enforces the rule: a question unintelligible without counterpart context
  the recap does not supply is answered `cannot-settle`, with "request not self-contained"
  as the stated missing thing -- never guessed at. The push-back is what keeps recaps
  honest across rounds.

## Correlation and rounds

- Every exchange carries an **exchange id** -- an 8-character hex in the pack's suffix
  idiom -- on an `Exchange: {8hex}, round {k}` line in both envelopes. The requester mints
  the id (a requester skill reuses its own run suffix at round 1, so the id also
  correlates with the source artefact's filename); the response echoes it verbatim. When a
  request arrives without one (a hand-written question list), the consultant mints the id
  and appends `(minted on response)` to the line.
- One exchange id per counterpart: a run that emits envelopes to more than one consultant
  repository mints a distinct id for each -- an id names exactly one requester-consultant
  pairing across its rounds.
- Rounds number from 1. A follow-up request reuses the exchange id and increments the
  round; the response to round `{k}` answers round `{k}`'s questions only. Neither side
  needs a `--prior` mechanism: self-containment makes each round independently actionable,
  and prior-round files may ride along as ordinary grounding inputs.
- Question identifiers are preserved end to end: a routed `Q{n}` keeps the identifier its
  source artefact assigned, through the request and the response, so the round trip is
  auditable against the artefact that raised it. A question with no upstream `Q{n}` is
  numbered by the first party to write it down, and the response records that the
  identifiers were minted rather than carried. An identifier is never rebound to a
  different question within an exchange.

## Request envelope

```
# Consultation request

Exchange: {8hex}, round {k}
Requester: {role description of the requesting repository}
Consultant: {role description of the repository expected to answer}
Source: {the artefact the questions come from, in requester-side terms --
e.g. "scope envelope {8hex} -- {title}"}
Date: {yyyy-MM-dd}

## Context recap

[Self-contained orientation for a zero-context session: the ambition, the chosen
direction, the state of play -- sized to what the questions need, not a duplicate of
the source report.]

## Questions

Q{n} [blocking|deferrable] -- {question}
  Why it matters: {one or two lines -- what each plausible answer changes on the
  requester side}
```

Priority tags travel verbatim so the consultant knows what gates the requester. The
`Consultant:` line is the addressee guard: a consultant session whose own repository
plainly does not match the addressed role stops and reports the mis-delivery instead of
answering.

The request envelope is transport-only, never a publishable report: it carries no
`Title:`/`Type:` header by design -- the requester's own published artefact already
records the routing (its routed markers and the exchange id) -- and the pack publisher's
degenerate-title guard refuses its H1. Requester skills that save the envelope write it
to `.ace/reports/{yyyyMMdd}-{HHmm}-consult-request-r{k}-{8hex}.md` -- the round in the
slug distinguishes an exchange's requests without opening them, and from round 2 the
`{8hex}` is the inherited exchange id, not the emitting run's suffix. Printing the
envelope paste-ready in the conversation is equally valid transport.

## Response envelope

The consultant skill's report skeleton is the canonical full shape; the contract every
response must satisfy:

- The standard header fields per `${CLAUDE_PLUGIN_ROOT}/skills/agent-shared/report-conventions.md`
  `## Standard header fields`, with `Type: consult`, plus the `Exchange:` echo.
- A `Grounded at:` line -- the consultant repository's HEAD short-hash plus tree state --
  dating the answers: the staleness anchor for re-entry and for any later round.
- One entry per question, in request order, restating the question verbatim, each with
  `Status: answered | answered-in-part | cannot-settle`.
- Facts and assessments split and labelled per the pack idiom: a fact is verified by a
  read or an executed probe in the consultant repository and carries its anchor as a
  prose citation; a documentation read grounds a fact about the documented contract only
  -- a claim about behaviour anchors to source or an executed probe, with documentation
  as corroboration; an assessment is analytical judgement and says so.
- `cannot-settle` is a first-class outcome: the entry states what is missing and who can
  settle it (the requester's own owner, a third party, evidence that does not exist in
  the consultant repository, or a request that was not self-contained), and never
  speculates to fill the gap.
- Complementary proposals -- consultant-side moves that would ease the requester's
  implementation -- are advisory only: a response commits the consultant repository to
  nothing, and a proposal becomes work only through that repository's own planning
  workflow.

The consultant saves the response as
`.ace/reports/{yyyyMMdd}-{HHmm}-agent-consultant-{8hex}.md`, with the echoed exchange
id as the suffix, keeping correlation at filename level on both sides.

## Answers re-entry

The response re-enters the requester's flow as an ordinary input file to the next run
there -- a re-scope, or the owning stage's pre-planner run -- passed beside the artefact
that raised the questions. There is no fold-in machinery: the answers are grounding for
that run, and the matching `Exchange:` ids in the two files are the audit link. A
requester skill that marks routed questions in its saved artefact (e.g. `[Routed]`)
leaves them unresolved on disk until a later run consumes the answers. When more than one
response exists for a round (a consultant re-run, an older file carried by mistake), the
latest `Date:` wins; on a tie the courier decides, with each file's `Grounded at:` anchor
identifying the consultant state it answered against.
