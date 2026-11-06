---
name: report-publish
description: "Publishes any report markdown file (scope envelope, scope review, scope code review, consultation answers) as a new GitHub issue; the title composes from the artefact's Title:/Type:/Stage: header fields with the H1 as fallback; path argument is required."
---
**Invocation input:** `<path>`


# Publish a report to a GitHub issue

## Usage

- `$ace:report-publish <path>` — creates a GitHub issue whose body is the markdown artefact at `<path>`

## Context

Generic publisher for report artefacts: scope envelopes, scope reviews, scope code reviews, and consultation answers. The issue body is the file content verbatim. The issue title is composed from the standard header fields (`Title:`, `Type:`, `Stage:`) that the producing commands write within the first 25 lines of the file, with the first `# ` H1 as the title fallback for files without a `Title:` field.

This is a mechanical "post a file to GitHub" operation. Never read the artefact in full and never echo its content into the conversation: header-field access is `grep -m1` over the first 25 lines only, plus two content-free probes — a tail-scoped `- Issue:` pre-publish probe for a prior publication and a `grep -q` probe for an existing `## Publication` header when persisting the linkage — and the body ships via `gh issue create --body-file <path>` — the content never passes through the model. This `--body-file` use sits outside the pack's `--body-file` alignment set (canonical `../pr-create/SKILL.md` step 6): its warrant is the no-read rule stated here, not the shell-quoting hazard of an inline generated body. No subagents; run inline.

After issue creation the pipeline records the created URL back into the artefact (the linkage-persistence block in the Task pipeline below). This is the single definition of local -> issue linkage; every producer that runs the pipeline verbatim inherits it.

## Task

The path argument is mandatory. If it is missing, report `Usage: $ace:report-publish <path>` and stop.

**Pre-publish duplicate probe.** Before running the pipeline, probe for a prior publication: `tail -n 10 <path> | grep -m1 '^- Issue: '`. The probe is content-free: it surfaces only the linkage line the pipeline itself appends, and the tail scope confines the match to the append region at end-of-file — every published artefact carries its linkage on its final lines, and 10 lines covers a `## Publication` block plus accreted `- Issue:` lines. A body that merely quotes the bullet at line start — plausible for reports about this pack — false-positives only when the quote sits within the final 10 lines; the scope narrows that window rather than eliminating it, and a false positive costs one confirmation question. This probe is the reader for the duplicate-publish signal described under linkage-persistence below; it lives outside the bash pipeline, so producers executing the pipeline verbatim against freshly written artefacts (which carry no `- Issue:` line) are unaffected. The probe has four outcomes:

- **Probe command fails** (`tail` or `grep` cannot execute) — treat the result as inconclusive, never a no-hit: re-probe with the same tail scope by other means (absolute-path `/usr/bin/tail`, or a bounded inspection of only the final 10 lines — never the body, preserving the no-read rule). A tool failure must never pass as no-duplicate.
- **Matched bullet is empty** (`- Issue: ` with no URL) — corruption left by an earlier aborted publish, not a publication record: strip the empty bullet(s) with a targeted edit and continue as a no-hit.
- **Genuine hit** — the file has already been published: report the existing issue URL and ask through `request_user_input` when it is available in Plan mode, otherwise through the same concise plain-text question how to proceed — "Stop — already published as <url> (Recommended)" or "Republish — mint a new issue (the file accretes a second `- Issue:` line)".
- **No hit** — proceed to the pipeline below.

Run inline (no subagent):

```bash
if [ ! -s <path> ]; then
  echo "File <path> is missing or empty." >&2
  exit 1
fi
BYTES=$(wc -c < <path>)
if [ "$BYTES" -gt 65536 ]; then
  echo "File <path> is $BYTES bytes — over GitHub's 65,536-character issue-body limit. Trim or split the artefact before publishing." >&2
  exit 1
fi
TITLE=$(head -n 25 <path> | grep -m1 '^Title: ' | sed 's/^Title: //')
FROM_H1=''
if [ -z "$TITLE" ]; then
  TITLE=$(head -n 25 <path> | grep -m1 '^# ' | sed 's/^# //')
  FROM_H1=1
fi
if [ -z "$TITLE" ]; then
  echo "File <path> has no Title: field and no H1 — cannot compose the issue title." >&2
  exit 1
fi
if [ -n "$FROM_H1" ]; then
  case "$TITLE" in
    'Scope envelope'|'Consultation answers'|'Consultation request'|'Scope review')
      echo "File <path> has no Title: field and its H1 is the skeleton title '$TITLE' — add a Title: header (or use a headered artefact) before publishing." >&2
      exit 1 ;;
  esac
fi
TYPE=$(head -n 25 <path> | grep -m1 '^Type: ' | sed 's/^Type: //')
case "$TYPE" in
  scope)       PREFIX='[SCOPE] ' ;;
  scope-review) PREFIX='[SCOPE REVIEW] ' ;;
  consult)     PREFIX='[CONSULT] ' ;;
  *)           PREFIX='' ;;
esac
STAGE=$(head -n 25 <path> | grep -m1 '^Stage: ' | sed 's/^Stage: //')
SUFFIX=''
[ -n "$STAGE" ] && SUFFIX=" ($STAGE)"
URL=$(gh issue create --title "${PREFIX}${TITLE}${SUFFIX}" --body-file <path>)
if [ -z "$URL" ]; then
  echo "gh issue create produced no URL — issue not created; <path> left unmodified." >&2
  exit 1
fi
if grep -q '^## Publication$' <path>; then
  echo "- Issue: $URL" >> <path>
else
  printf '\n## Publication\n\n- Issue: %s\n' "$URL" >> <path>
fi
echo "$URL"
```

Title composition rules (this pipeline is the single definition — the producer publish phase (`## Producer publish phase` below) executes it by reading it from this file and running it unchanged, so there is no second copy to drift and titles can never diverge across paths):

- The title body is the `Title:` field, falling back to the first `# ` H1 when the field is absent. The H1 fallback carries a degenerate-title guard: when the fallback resolves to a known skeleton H1 (the four strings enumerated in the pipeline's `case` block above) the run stops — those H1s are report-template constants, not titles, and a file whose `Title:` line is missing would otherwise mint an issue titled with the template constant, such as "Scope envelope". The scope, scope-review and consult skeletons always emit `Title:`, so their arms fire only on a hand-stripped header. The `Consultation request` arm guards the transport-only request envelope, which carries no header fields by design and is never published (`../agent-shared/sibling-exchange-protocol.md`).
- The `Type:` field maps to a bracketed content-type prefix; the `case` block above is the definition, including each prefix's trailing space and the no-prefix fallback for an unknown or absent `Type:`. Prefix, not suffix: GitHub truncates long titles from the right in list views, so a prefix stays visible, groups visually, and greps at line start.
- A `Stage: {n}/{m}` field, when present, appends as ` ({n}/{m})`, per the `SUFFIX` computation in the pipeline above.
- Example: `[SCOPE] Consolidate request validation and error mapping in the API layer`

Linkage-persistence rules (the post-create append in the pipeline — also a single definition, inherited by every producer that runs the pipeline verbatim):

- The artefact receives an appended `## Publication` block (blank line, H2, blank line, `- Issue: <url>`) — or only the bullet when a `## Publication` header already exists from a prior publish, so republication accretes visible `- Issue:` lines rather than duplicate headers.
- The append is the durable local -> issue record: a later session holding only the file resolves the issue mechanically, and an existing `- Issue:` line is the on-disk duplicate-publish signal — read by this skill's pre-publish duplicate probe, which gates re-publication behind confirmation.
- The published issue body predates the append and lacks it; the divergence is accepted.

The empty-`$TITLE` guard stops the run before `gh issue create` — without it a file with neither a `Title:` field nor a `# ` H1 mints an issue with an empty title. The empty-`$URL` guard stops the run before the linkage append — without it a failed `gh issue create` (auth expiry, network, an unresolvable `git` subprocess) writes a bare `- Issue: ` bullet into the artefact, and a later successful `--body-file` create ships that corruption in the published body. On Windows MINGW64, `<path>` must be in POSIX form (`/c/...`) for the `head`/`grep`, redirection, and `--body-file` arguments. The `gh` command requires the current working directory to be within a git repository.

The pipeline assumes GNU coreutils reachable as bare names and a `PATH` from which `gh` can resolve `git`. On a degraded shell where bare names intermittently fail (`command not found` despite the binaries existing on `PATH`), the fallback is: absolute binary paths (`/usr/bin/head`, `/usr/bin/gh`, ...), header fields read with the `exec_command` file inspection when `head`/`grep` cannot run, and an explicit `--repo <owner>/<repo>` flag supplied on `gh issue create` (repo autodetection needs a resolvable `git` subprocess; the explicit flag does not). Never let a failed attempt append to the artefact — the empty-`$URL` guard enforces this in the scripted path; an adapted manual path must honour the same rule.

Capture `$URL` and report it.

## Producer publish phase

- Covers the `--publish yes` arm only. Each producer's `--publish no` arm, its `--publish` default marker, and its own `Tip:` line stay local to that command.
- One producer references this section: `agent-consultant` Phase 9.
- Execute this file's bash pipeline verbatim against the saved report path: read the pipeline from this file's `## Task` section and run it unchanged.
- The title composes from the report's `Title:`/`Type:`/`Stage:` header fields; the body ships via `gh issue create --body-file`.
- On publish failure each producer continues rather than stopping — the saved report stands regardless.
- Report the issue URL in the producer's final summary alongside the saved report path — the URL is additive, and the producer's own next-step `Tip:` line stays.
- On issue-creation failure, report the `gh` error verbatim and print the ready-to-run `$ace:report-publish {report path}` line — the failure does not invalidate the saved report.

## Error handling

The no-read rule holds on every error path: never open the artefact to diagnose a failure. Diagnosis, when needed, is `head -n 25 <path>` through `exec_command` — the header window only, never the body.

- If the path argument is missing, report `Usage: $ace:report-publish <path>` and stop
- If the file at the given path does not exist or is empty, report the error and stop
- If the file exceeds GitHub's 65,536-character issue-body limit, report the byte count and stop before `gh issue create` — the failure would otherwise land after the expensive producing run; the file is intact and re-runnable once trimmed or split. The guard compares bytes (`wc -c`) against the character limit as a deliberate conservative proxy: UTF-8 bytes ≥ characters, so it can only over-reject, never under-reject
- If the pre-publish duplicate probe finds an existing `- Issue:` line and the user chooses stop, end without creating an issue — not an error path
- If the derived title is empty (no `Title:` field and no `# ` H1 in the first 25 lines), report the error and stop — do not create the issue
- If the title resolved only via the H1 fallback and equals one of the skeleton H1s in the pipeline's degenerate-title `case` block, report the degenerate-title guard's message and stop — do not create the issue
- If issue creation fails, report the `gh` error verbatim — the empty-`$URL` guard exits before the linkage append, so the artefact is unmodified and the run is safely re-invokable
- If the linkage append fails after issue creation, report the URL anyway and warn — the issue exists; only the local record is missing
- If there are permission issues with GitHub, report them
