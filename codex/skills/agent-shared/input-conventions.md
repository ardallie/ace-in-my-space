# Input conventions

Shared input-handling conventions for the multi-agent skill suite: the flag pre-pass, the
positional parsing rules, the residual-token warnings, and the read posture for
adjacent-toolchain inputs. Consumers:

- `../ace-agent-pre-planner/SKILL.md` -- full
- `../ace-agent-arch-review/SKILL.md` -- full, with its stated Phase 1 divergences
- `../ace-agent-scope/SKILL.md` -- full, with its stated Phase 1 divergences
- `../ace-agent-code-review/SKILL.md` -- flag pre-pass and residual-token warnings
  only; its positional scope grammar is local to its SKILL.md
- `../ace-agent-consultant/SKILL.md` -- carries its own aligned copy of the flag rules,
  the positional rules, and the residual-token warnings; the `--model` rule below is shared
  with its Phase 1
- `../ace-plan-route/SKILL.md` -- adapted local copies of the positional branches (its
  no-arguments rule takes the message as the scope, not as a verbatim brief), reading this file
  on an ambiguous token and, unconditionally, for the `## Positional parsing` issue-number fetch
  grammar its own issue bullet cites; it takes no flags, so the flag pre-pass and the
  residual-token warnings do not apply

Each of the four suite SKILL.mds states its own divergences and flag defaults. Where this file says
"brief", read that consumer's own input noun (the ambition, the artefact); where it says
"team members", read theirs (analysts, panel members, reviewers).

## Flag pre-pass

Strip leading flags. They may appear in any order, before the positional arguments.
Per-skill flags (`--agents`, `--prior`, `--reviewers`, `--checks`) are defined in each
SKILL.md; the two flags below are common to every flag-taking consumer.

- `--model` value, when supplied, directs model selection for the spawned team members
  (sceptic included). The value is prose carrying model information — a model name, a tier,
  a mix, a reasoning-effort hint, or a reference to such information (e.g. `--model Tier-3`,
  `--model strongest available`, `--model mix of Tier-1 and Tier-3`). There is no
  accepted-values list and no unknown-value parse error: the skill's spawn phase reads the
  value as an instruction and resolves it against the models available in the current
  harness — a bare model name is simply the shortest possible instruction. The value
  boundary is judged, not parsed: unquoted multi-word values are well-formed, and the
  executing agent judges where the model directive ends and the positional arguments begin,
  exactly as it judges any other prose instruction; quoting can disambiguate a genuinely
  ambiguous boundary but is never required. A missing value (nothing after `--model`
  readable as model guidance) is a parse error: report it and stop. When `--model` is
  omitted, the skill's spawn phase assigns models per its own stated default.
- Model guidance may equally arrive in the additional instructions (e.g. "a mixture of
  Tier-1 and Tier-3") rather than via `--model`: the spawn phase honours both the same way,
  as a per-member assignment. The rule is shared across the consumers above and
  `$ace:ace-agent-consultant` Phase 1; each command records the resulting assignment in its own
  report's analyst surface — a deliberate per-skeleton divergence, not drift.
- `--publish` value; accepted values `yes|no` (the default is per skill, stated in its
  Usage section). If the value is missing or unknown, report the valid values and stop.
  Drives the publish phase.

## Positional parsing

Main pass: apply the rules below to the remaining tokens in order; first match wins.

- **File paths provided** — test each whitespace-delimited token as a file path in order.
  The first token that does not exist as a file ends the file list — that token and
  everything after it is passed to all team members as additional instructions. A token
  that exists but is not readable is an error: report it and stop (do not fold it into
  additional instructions). Read each valid file and concatenate their contents as the
  brief.
- **Issue number** — if the first token is not a valid file path but is numeric, treat it
  as a GitHub issue number. Fetch via:

  ```bash
  gh issue view <number> --json title,body,state,comments
  ```

  If the issue does not exist, report the error and stop.

  Parse JSON output: present title, body, and comments chronologically with author and
  timestamp. The issue title and body form the brief. Comments provide additional context
  (handoff notes, revised decisions, discussion). Tokens after the issue number are
  handled by the mixed issue-plus-files form below.

  **Mixed issue-plus-files form.** Tokens after the issue number are tested as file paths
  exactly as in the file-path branch above. Each file that resolves is an additional brief
  source, listed in the report's `Source:` field alongside `issue #N`.

  Only one issue number is supported per invocation. Subsequent numeric tokens are passed
  as additional instructions, not as issue numbers.
- **No arguments** — identify the most recent user message in conversation context that
  describes an intention, suggestion, technical query, or implementation plan. Quote it
  verbatim as the brief.
- **Prose invocation** — the first token does not exist as a file and is not a numeric
  issue number. Check conversation context: when an actionable message exists, treat it as
  the brief per the no-arguments rule and pass the entire argument text to all team members
  as additional instructions — a prose invocation is a scope refinement over the
  conversation-context brief, not an error. When no actionable context exists, the terminal
  rule below applies.

If no brief is found (no arguments and no actionable message in context), report this and
stop.

## Residual-token warnings

After the main pass, warn when any residual token matches `^--` (e.g. `--model` typed
after a positional token) — a misplaced flag would otherwise fold silently into the
additional instructions. Also warn when a residual token looks like a path (contains `/`
or ends in `.md`) — a mistyped file path would otherwise fold in the same way. Warn only,
do not stop: additional instructions may legitimately contain paths.

## Adjacent-toolchain inputs

Some consumers read an optional artefact tree produced by an adjacent toolchain — a mapping
set, a system specification. Such a tree is ambient grounding, never a subject of the run:

- **Existence-guarded** — read it where it is present, proceed without it where it is not.
- **Read-only** — never flag it as stale or out of date, never regenerate it or re-run the
  command that produced it, never edit it, and never make it a review subject, deliverable,
  or workload item.
- **Source is authoritative on conflict** — where the artefact contradicts source, source
  wins: surface the discrepancy as a correction to the brief, with file:line evidence, and
  frame it as a statement about the source ("source does X"), never as "the artefact is
  stale — regenerate it".

A consumer with no adjacent-toolchain input inherits nothing here. Each consumer that has
one names its own artefact tree and keeps its traversal rules local.
