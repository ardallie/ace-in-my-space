---
name: ace-plan-route
description: Chooses the planning workflow -- scope (whole packages), pre-planner, plan-direct, or implement-direct -- for a work-packaging artefact (a package, subpackage, or item, including any file under `.ace/wpak/`) or a GitHub issue carrying one, then prints the ready-to-run entry point and ends the turn without running it. Use when the user directs work on such an artefact without naming a workflow themselves ("handle phase 1", "do subpackage 2", "take this on"), including when they direct a phase or subpackage of an artefact already loaded in the conversation, e.g. after `$ace:ace-plan-read`. Do not use when the user names the route ("implement directly", "skip the pre-planner"), and do not use for ordinary edits, bugfixes, or tasks unconnected to the work-packaging chain.
---
**Invocation input:** `[<artefact path> ... | <issue>]`


# Route a planning artefact

How to choose the planning workflow when asked to act on a planning artefact without a
workflow being named. The skill is advisory: it recommends a route and prints its entry
point, and never runs the route itself.

## Usage

`$ace:ace-plan-route [<artefact path> ... | <issue>]`

No flags. Resolve the scope from the arguments, first match wins, following the positional
rules in `../agent-shared/input-conventions.md` -- read that file only when a
token's form is ambiguous:

- **Artefact paths** -- one or more paths to a package, subpackage, or item file. Read each;
  together they are the artefact under assessment.
- **Issue number** -- a numeric token is a GitHub issue; fetch it per the **Issue number**
  branch of `## Positional parsing` in `../agent-shared/input-conventions.md` and
  treat its title, body, and comments as the artefact.
- **No arguments** -- take the most recent actionable user message as the scope. Where that
  message names a phase or subpackage of an artefact already loaded in the conversation, that
  phase or subpackage is the scope.

## Trigger

When the user loads an issue with `$ace:ace-plan-read <issue>` and directs a phase or subpackage
conversationally (e.g. `$ace:ace-plan-read 957` followed by "handle phase 1"), treat that direction
as an implicit directive to run this protocol as part of the final summary step --
present the route recommendation and end the turn with the runnable invocation for the user to
run, rather than asking an open "how to proceed?" question.

## Protocol

1. Read the artefact (and its phase/subpackage scope) against the current source code.
2. Choose exactly one route. A **whole package** (an L1 wpak package file or its issue) routes
   to **scope**: print `node scripts/wpak/wpak.mjs entry pkg-NN --route scope` (or the `pnpm
   wpak:entry` alias) and its printed `$ace:ace-agent-scope` invocation as the entry point --
   `$ace:ace-agent-scope`'s own off-ramp handles a pre-planner-sized package with one confirmation
   question, so the size judgement is not re-made here. For a subpackage, item, or any other
   artefact, choose **pre-planner**, **plan-direct**, or **implement-direct**.
   Default to the artefact's `Routing:` field -- it is a considered call made when the artefact
   was packaged. Apply the rubric below to check that call against the code, not to re-derive the
   route from scratch. An artefact carrying no `Routing:` field -- every `.ace/wpak/**` package,
   subpackage, and item -- has no prior to check: apply the rubric fresh, and read the
   development-time seam in `.claude/skills/wpak-shared/wpak-publishing.md` for that family's
   entry-point assembly. Steps 3 and 4 then have no prior and no suggested invocation to revise.
   The `.ace/wpak/**` artefact family, `scripts/wpak/wpak.mjs`, and `wpak-publishing.md` are
   host surfaces this suite does not ship. Where the host carries no work-packaging pack, no
   artefact of that family exists to route: this skill's other inputs -- GitHub issues and
   ordinary files -- are unaffected, and the package/scope arm above simply never fires.
3. Deviate from the `Routing:` prior only when code inspection gives a stated reason: the field
   is stale (the code moved on since the artefact was packaged) or the artefact is under-routed
   (the code reveals a load-bearing design decision or cross-package boundary the field missed).
4. Re-evaluate the entry point. The artefact's suggested invocation was written before the code
   existed -- check whether it still fits the current state (e.g. a phase already landed, scope
   narrowed, a dependency resolved) and revise if needed. For implement-direct there is no
   invocation -- the entry point is the target file and scope.
5. Classify every open question in the artefact before reporting (see Open questions below).
6. Report the choice: one line of rationale, plus a one-line dismissal of each rejected route.
7. Print the entry point as the final line of the response, then end the turn -- do not run the
   route. For scope, pre-planner, and plan-direct this is the ready-to-run `$ace:ace-agent-scope`,
   `$ace:ace-agent-pre-planner`, or `$ace:ace-plan-start` command (for a wpak artefact, assembled via
   `wpak.mjs entry`); the user can tweak `--model` (and `--agents` for the pre-planner)
   before running, and is encouraged to run it in a fresh conversation. For implement-direct
   there is no command -- print the target file and scope, flag that this route writes to the
   working tree with no downstream review gate, and stop. The protocol never executes the route
   itself.

## Route rubric

- **scope** (`$ace:ace-agent-scope`, whole packages only) -- the artefact is a complete wpak package:
  the envelope enters scoping whole, and the scope panel draws the staged split and routes
  each stage into its own pre-planner cycle. Never chosen for a subpackage or item.
- **pre-planner** (`$ace:ace-agent-pre-planner`) -- multiple sequential phases, an unresolved or
  load-bearing design decision, a cross-package boundary, or wide blast radius. Output is an
  analysis, not code. The team auto-sizes to scope (down to one analyst plus the sceptic for a
  narrow surface), so this route is not heavyweight by default -- do not reject it on cost.
- **plan-direct** (`$ace:ace-plan-start`) -- one plannable surface, low/medium risk, no unresolved
  blocking question, but enough substance that a written plan plus validation adds value.
  Output is a plan.
- **implement-direct** -- localised, low-risk, an obvious validation gate, no design decisions
  to make. Output is code.

## Open questions

Artefacts often carry open questions. Classify each before reporting:

- **Answerable from code** -- resolve through inspection and state the resolution in the
  recommendation. No user input needed. **Exception -- the scope route:** a wpak envelope's
  `## Open questions` are deliberately carried unanswered, because `$ace:ace-agent-scope`'s elicitation
  machinery is their resolver and the envelope asserts no source truth. Classify them, report
  the classification, and pass them to `$ace:ace-agent-scope` unresolved -- a resolution stated here
  lands in this conversation, not in the envelope, and is gone by the time the printed
  invocation runs in a fresh one.
- **Deferrable** -- does not block the route or entry point; note it as deferred (to the plan
  or pre-planner) in the recommendation. Do not surface to the user.
- **Load-bearing** -- changes the route choice or the entry point and cannot be resolved from
  code alone. Run `$ace:ace-run-interview` to surface it before presenting the recommendation.

A question is load-bearing when different answers would produce a different route or a different
entry point command. When uncertain, prefer surfacing over silently resolving.

## Handoff rule

The printed invocation (or, for implement-direct, the target file and scope) is the last thing
in the response, ready for the user to copy, adjust, and run. Implement-direct carries the
additional working-tree warning above because, once the user runs it, it reaches the working
tree with no further review gate -- make that risk explicit in the rationale when choosing it.

## Override

If the user names a route or says "implement directly" / "skip the pre-planner", honour it
rather than choosing one -- an explicit instruction always wins, and is recorded as the reason.
What honouring it means depends on the channel. On the model-invocation channel the override is
a non-trigger: a message that names its own route is not an invocation condition, so do not
enter the skill at all. On an explicit `$ace:ace-plan-route` that also names a route, the user has
asked for the entry point rather than for the choice -- confirm the named route against the
rubric in one line, then print its entry point per the Handoff rule.
Reached from a call site -- invoked by `$ace:ace-plan-read` step 5, or read by reference from the wpak
development-time seam -- with a route already named in the directing message, treat it as the
explicit case above.

After the protocol has printed its recommendation, "proceed", "yes", "go ahead", "run it", or
similar from the user is an instruction to run the already-selected route -- the session may then
invoke it directly. These are not route overrides and not a licence to skip the routing
assessment or bypass the rubric on the next artefact.
