# Consultation request

Round: {nn}-scope-consultant
Date: {yyyy-MM-dd}
Workstream: {absolute path of the requesting workstream, forward slashes}
Source: {raising report, workstream-relative | question file key | conversation}
Requester: {role of the requesting repository, one line}
Target role: {the role this round addresses | unstated}
Ids: {carried from {Source} | minted by this round: Q1..Q{k}}

[Bracketed paragraphs like this one are guidance: follow them, then delete them. Inside a line form, `[...]` marks an optional part and `{a | b}` a choice of one, except the tag: where a question carries one, write exactly `[blocking]` or `[deferrable]`. One bare `Field: value` per line at column 0. The request restates only what the consultant agent cannot open in the requesting workstream: each question once, the premises it must check, and requester facts outside the workstream; everything inside the workstream goes by path. `Requester:` is the requesting repository's role; `Target role:` is the role the round addresses, which the consultant agent checks the target against before any research. `Ids:` reads `carried from {Source}` where the questions keep the ids their source gave them, and `minted by this round` where the round numbered them. A short prompt round's request can be as small as its question, the two roles and `decisions.md` by path.]

## Questions

Q{n}[ [blocking|deferrable]] -- {question verbatim, every sub-question kept}
  Why it matters: {what each plausible answer changes on the requester's side}

[One entry per question, in the question set's order, each once. The tag only where the question carries one; a prompt's question and many question-file lines carry none.]

## Premises

- {A{n} | D{n} | Q{n}} -- {one checkable claim about the target that the requester's direction rests on}

[Each line names the Source report's assumption or the decision it comes from; in a round with no Source report, the question it serves. Only claims about the target go here, never the requester's own direction, which the paths below carry. Where the requester's direction rests on no claim about the target, the section holds the single line `None.`]

## By path

- {path, relative to Workstream} -- {ids or sections} -- {why}

[The Source report, with the ids and sections the questions rest on; `decisions.md`, with the decision ids; every earlier round the run passes to be re-verified, as the skill's request step says. At least `decisions.md`.]

## Requester facts

- {a fact about the requesting repository outside its workstream that a question needs} | None.

## Output contract

Answer every question above in the response form your assignment carries under `## Response record`, premise verdicts first, one entry per question; write it to the response record your assignment names, ending with its completion line.
