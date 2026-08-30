# Analysis conventions

Shared analysis conventions for the suite's two analysis skills: the context-package
exploration checklist, the analyst instructions, the sceptic's remit, the findings
consolidation rules, and the enhanced-brief regeneration rules. Consumers:

- `../agent-arch-review/SKILL.md` -- full; its SKILL.md appends the
  arch-review-local analyst rules 9 and 10 (runtime-behaviour corrective instruments;
  `--prior` classification), its local consolidation rules (prior findings,
  contradictory findings, mappings, continue-above-max numbering), and its local
  enhanced-brief rules (the post-implementation restructuring licence and its two
  sub-bullets, the source-verified-instrument bullet, the `--prior` `[Resolved]`
  carry-forward bullet)
- `../agent-pre-planner/SKILL.md` -- full; its SKILL.md appends its local
  consolidation rules (derived-brief numbering, the before-planning question test) and its
  local enhanced-brief rules (the `Scope:`-directive restriction, the derived-brief
  synthesis sentence, the informal-prose-citation bullet)

Two aligned copies diverge deliberately and do not consume this file: `$ace:agent-consultant`
compresses the context-package checklist to a question-scoped read and restates the
analyst instructions as its own researcher rules; `$ace:agent-scope` replaces the checklist
with a knowledge-first posture on a smaller read budget, and carries its own panel
instructions. `$ace:agent-code-review` is not a consumer either, and carries no aligned copy:
its reviewer instructions and severity-graded consolidation are its own, as its
`## Shared conventions` section states.

## Context package

Perform targeted exploration driven by the brief. Build a context package:

- Repository overview (top-level listing, key config files)
- Relevant files mentioned or implied by the brief (read in full)
- Related patterns (existing implementations similar to what the brief describes)
- Dependency map (modules adjacent to or affected by the proposed change)

Read all files explicitly referenced in the brief — reference lists, documentation lists,
file paths mentioned inline, slash commands, and context files in the target repository.
These have no cap. Cap additional exploratory reads (files discovered by the parent but
not mentioned in the brief) at 40; if the cap is reached, note this in the Context files
section and list the areas skipped.

Record which files were read — the report includes them in the Context files section as a
numbered list.

If the repository is empty or no relevant files are found, report this and stop.

## Analyst instructions

Each analyst must:

1. Explore the codebase independently to verify claims and discover context beyond the
   parent's package. Cap exploratory reads at 40 per analyst; the context package and
   brief-referenced files are exempt. If the cap is reached, note it in the findings
2. Report findings using exactly these categories: Insight, Correction, Risk, Opportunity,
   Question, Confirmed — do not use other categories such as Clarity, Accuracy,
   Completeness, or Feasibility. Return findings unnumbered, grouped by category — the
   parent assigns identifiers during consolidation
3. Resolve ambiguities using codebase evidence where possible — only escalate to Question
   when the codebase cannot answer it
4. Describe constraints and decision points, not implementation algorithms. Write "the
   planner will need to decide how to handle X given Y" rather than "use algorithm Z to do
   X." Leave design space for the planner.
5. Reference specific files and line numbers
6. Distinguish facts (verified in codebase) from assessments (analytical judgement):
   - Claims of the form "X will compile", "these sites need no churn", or "Y imports
     cleanly" must name their verification method: only an executed probe (compile, test,
     or script run) makes such a claim a fact — a claim verified only by inspection is an
     assessment and must be tagged as one.
   - The same standard applies to scope-defining enumerations (site counts, call-path or
     verb-reach claims) and compiler-diagnostic identifiers: state the exact command run
     and its exact result, and never report an approximation (e.g. `~10x`) under a FACT
     tag — an unverified or approximate count is an assessment.
   - A finding that proposes converging N wording variants of one rule must verify the
     variants are semantically one rule, not merely similar phrasing — variants expressing
     different contracts are separate findings, and the claimed shared semantics must be
     stated.
   - Probes that mutate files are sanctioned but constrained: analysts run concurrently in
     one shared checkout, so mutate only in a git worktree or a scratchpad copy, or revert
     the mutation within the same tool sequence that made it — never leave the shared
     working tree dirty across tool calls.
   - Do not report findings observed on another analyst's in-flight probe state; if the
     tree looks unexpectedly modified, re-verify once it settles
7. Report aspects of the brief that are well-founded as Confirmed findings (category
   prefix `V`), stating what was verified, the evidence (file:line), and why it needs no
   changes
8. List any files read beyond the context package, so they can be merged into the report's
   context file list

## Sceptic remit

One analyst is the **sceptic** — it challenges the premise, proposes simpler alternatives,
identifies unstated assumptions, checks whether the problem is correctly framed, and flags
scope risks. Its failure handling is separate, in
`../agent-shared/team-mechanics.md` `## Member failure and the sceptic`.

## Consolidation rules

Consolidate all analyst findings into a single list, grouped by category.

- Deduplicate findings across analysts (prefer the most specific formulation)
- No per-analyst attribution
- Every bold finding reference in the enhanced brief (e.g. **see C2**) must resolve to an
  identifier present in the consolidated findings list. Analysts return findings unnumbered
  (rule 2); where one numbers them anyway (e.g. `R4-codegen`), remap them to their
  consolidated equivalents during consolidation; if an analyst-local finding has no
  consolidated equivalent, drop the reference or promote the finding into the list before
  citing it. Never carry an analyst-namespaced identifier into the enhanced brief.
- No findings summary or recommendation line
- Each finding has a category-prefixed identifier (C1 [high], C2 [low] for Correction;
  R1 [high], R2 [low] for Risk; Q1 [blocking], Q2 [deferrable] for Question; I1 [high],
  I2 [low] for Insight; O1 [high], O2 [low] for Opportunity; V1, V2 for Confirmed),
  description, and file:line references where applicable
- Number findings contiguously within each category (C1, C2, C3 ... with no gaps),
  renumbering after deduplication, in ascending order; each SKILL.md governs numbering
  against a prior or derived input's identifier namespace. In all cases assign exactly one
  identifier per finding — never combine two findings under a shared bullet
- Findings that assert type-level feasibility, a no-change inventory, a scope-defining
  enumeration, or a compiler-diagnostic identifier carry their verification method inline,
  tagged per analyst rule 6 — the canonical probe-versus-assessment definition
- Each finding carries a severity tag: `[high]` (materially affects the skill's downstream
  product — for the pre-planner the plan, for the arch-review the architecture: wrong
  assumption, architectural or structural risk, blocking dependency) or `[low]`
  (observational, informational, nice-to-know). The severity vocabulary is exactly these
  two levels — never emit `[medium]` or any other tier
- Each question carries a priority tag instead of a severity tag: `[blocking]` (must be
  resolved before planning) or `[deferrable]` (can be resolved during or after planning)
- Confirmed findings carry no severity tag
- Omit categories that have no findings

## Enhanced brief

The report has two primary content sections. The findings list consolidates every discrete
correction, risk, question, insight, opportunity, and confirmation produced by the analysts.
The enhanced brief is the original user input regenerated at the same level of detail, with
all findings applied.

Build the findings list first, then use it as the basis for the enhanced brief. In the
report, the enhanced brief appears first — it is the primary content for the planning agent.
The findings list follows as supporting detail.

Regenerate the original user input as a progressively enhanced version. This is not a
summary — it reproduces the brief at the same level of detail as the original, with findings
applied throughout.

Walk through the original brief's structure and content. Reconstruct it element by element:

- Preserve the user's original intent, goals, and level of detail — enhance the brief, do
  not condense it
- Exception — premise overturned: when a Correction invalidates the brief's framing, the
  enhanced brief may restructure rather than follow the original element by element; state
  explicitly that the structure was reorganised and cite the Correction that licensed it
- Where the input brief is already a detailed analysis (a thorough human brief, a prior
  report, or an upstream review), carry its prose forward and apply corrections in place
  rather than rewriting it from scratch
- Do not reproduce near-byte-identical text under a new heading; preserve the substantive
  prose and weave findings in where they apply
- Omit context-gathering directives that the analysis has fulfilled — instructions to fetch
  or read artefacts (e.g., "run $ace:plan-read X", "inspect touched files") have been addressed
  during analysis; exclude them. Preserve directives that express constraints, goals, or
  design questions for the planner.
- Where the original content is accurate and well-founded, preserve it unchanged
- Reproduce diagnostic artefacts verbatim — error messages, stack traces, query expressions,
  code snippets, API requests, and response codes are primary evidence; include them in
  full, not paraphrased or referenced. If an artefact is misleading, correct it in place and
  cite the evidence.
- Where a finding corrects a factual error or invalid assumption, replace the incorrect
  content with the correction and cite the evidence (file:line). Reference the finding number
  in bold (e.g., **see C2**) so corrections are visually distinct from other inline
  references.
- Where a finding identifies a risk, note it inline at the relevant point in the narrative
- Where a finding adds architectural insight, fold it into the narrative where it is most
  relevant
- Where a finding presents an opportunity or alternative, include it alongside the original
  approach

The result reads as if the user had written the brief with full knowledge of the codebase.
Incorrect preliminary information is corrected in place. The planning agent can consume the
enhanced brief directly as primary context.
