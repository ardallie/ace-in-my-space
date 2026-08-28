# Issue staging — fetch, derive identifiers, stage the body

Executed from `/ace-plan-validate` Phase 1 (`${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-validate/SKILL.md`) when the
input resolves to a GitHub issue number — typed as the argument or found in conversation
context. Before composing the temp-file path, probe the issue body for the
`## Validation audit` footer this pipeline publishes:

```bash
RAW_BODY=$(gh issue view <number> --json body --jq .body) || exit 1
FOOTER_REPORT=$(printf '%s\n' "$RAW_BODY" | grep -m1 '^- Validation report: ' | sed 's/^- Validation report: //')
```

Every `gh` call in this reference carries the same arm: if the fetch fails as a command
(auth, network, `gh` unavailable) or the issue does not exist, report the `gh` error and stop
— the same stance as `/ace-plan-start`'s issue route step 1. Without it a failed staging fetch
redirects empty output into the temp file and the empty-body guard stops with
`Issue #<number> has an empty body`, diagnosing missing plan content instead of a broken
fetch. The probe captures the body before piping because a `gh | grep | sed` pipeline carries
`sed`'s exit status, leaving a failed fetch indistinguishable from the legitimate no-footer
case; `pipefail` is not the alternative, since `grep -m1` exits non-zero on every unpublished
issue. The capture is deliberately scoped to this probe — folding the file's three fetches
into one shared capture is a separate change, since it also touches the clobber guard's body
comparison and the no-footer branch's title fetch.

**Footer present** (`$FOOTER_REPORT` non-empty and its **basename** matching `{yyyyMMdd}-{HHmm}-val-v{m}-{slug}-{8hex}.md` — the producers write the bullet repo-relative, e.g. `.ace/plans/…`, so match on the basename, never the full string) — reuse the identity: extract `{slug}`, `{8hex}`, and `{m}` from the footer path; the staged temp file is `plan-v{m}` (the body already is revision `{m}`, not an unvalidated `v0`) and the report version `{n}` is `{m}+1`. Reuse keeps the report foldable by `/ace-plan-update --from-report` (its Phase 2A linkage check compares the report's id against this footer).

**No footer** (the issue was not published by this pipeline) — mint fresh identifiers. Fetch the issue title so the temp-file slug can be derived from it:

```bash
TITLE=$(gh issue view <number> --json title --jq .title)
```

Derive the slug from `$TITLE` per the issue-title slug rule in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` (strip the leading bracketed label and trailing stage suffix, kebab-case, ≤3 keywords — single-sourced there); mint a fresh 8-hex per the snippet in `${CLAUDE_PLUGIN_ROOT}/skills/plan-shared/identifiers.md` (test output non-emptiness, not exit status); the temp version is `plan-v0`, and `{n}` is set to `1`.

Compose the temp-file path as `.ace/plans/{yyyyMMdd}-{HHmm}-plan-v{m}-{slug}-{8hex}.md` (with `{m}` as derived above, `0` in the no-footer case). Before the redirection, guard against clobbering a real local plan file: if the composed path already exists and its content differs from the fetched body, stop and report the collision — footer reuse plus a same-minute timestamp can compose exactly the path of the plan revision this issue was published from, and the redirect would erase its `- Issue:` bullet; direct the user to re-run as `/ace-plan-validate <that path>` (file input). An existing file with identical content is the accepted same-minute re-run overwrite: the staged content derives from the same issue body, so no distinct artefact is lost. Then stage the body via Bash redirection:

```bash
gh issue view <number> --json body --jq .body > <temp-file path>
```

Apply the empty-body guard immediately on the file:

```bash
if [ ! -s <temp-file path> ] || [ -z "$(tr -d '[:space:]' < <temp-file path>)" ]; then
  # Empty-body message from /ace-plan-read
  echo "Issue #<number> has an empty body. The plan content is missing." >&2
  exit 1
fi
```

On Windows MINGW64, `<temp-file path>` must be in POSIX form (`/c/...`) per `${CLAUDE_PLUGIN_ROOT}/rules/environment.md`. The staged path is what Phase 2 hands to the validator subagent. Comments are deliberately not fetched — the validator does not use them. This staged file is not cleaned up: it stays in `.ace/plans/` as the run's input record. Revisit only if `.ace/plans/` clutter becomes a real problem.
