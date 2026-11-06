---
name: pr-create
description: "Creates a GitHub pull request from current branch commits: analyses all commits since branching and generates a PR description following the repository template."
---

# Create a GitHub pull request

## Usage

- `$ace:pr-create` - Creates a PR from the current branch to the default branch

## Task

1. Resolve the default branch and verify the current branch is a feature branch. Empty output, not exit status, is the failure signal — the `sed` stage exits 0 even when `git symbolic-ref` fails:

   ```bash
   db=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
   [ -n "$db" ] || db=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null)
   [ -n "$db" ] || { locals=$(git for-each-ref --format='%(refname:short)' refs/heads/main refs/heads/master); [ "$(printf '%s\n' "$locals" | grep -c .)" -eq 1 ] && db=$locals; }
   [ -n "$db" ] || { echo "default-branch resolution failed" >&2; exit 1; }
   ```

2. Review all commits: `git log <default>..HEAD`
3. Review all changes: `git diff <default>...HEAD` — the three-dot (merge-base) form, matching the diff GitHub displays on the PR; the two-dot form includes inverse upstream changes once the default branch has advanced past the merge-base, so the description could describe changes the PR does not make
4. Read the PR template from `.github/pull_request_template.md`; if the repository has no template, derive the description structure from the commits instead (summary, changes, rationale)
5. Generate the PR description following the template structure (or the derived structure when no template exists)
6. Create the PR: write the description to a temporary file and run `gh pr create --draft --title "..." --body-file <file>`. Never pass the generated multi-section description inline via `--body "..."` — generated descriptions routinely quote code and commands, so backticks, quotes, and `$` are the norm, and backticks inside a double-quoted bash argument are command substitution. On Windows MINGW64, `<file>` must be in POSIX form (`/c/...`). This is the pack's canonical statement of the `--body-file` rule; its aligned copy is `../pr-response/SKILL.md` step 7. One copy is deliberately out of this alignment set, stating a different rule from a different warrant: `../report-publish/SKILL.md`'s (its warrant is that skill's no-read rule, not the shell-quoting hazard)
7. Return the PR URL to confirm completion. If the returned URL is missing or the command errored, report it rather than claiming completion

## Requirements

- Do not push code — the user must push commits before running this skill
- Exclude "Test plan" section from the PR description
- Exclude "Generated with Claude Code" footer

## Error handling

- If default-branch resolution fails (all three fallbacks produce empty output), report this and stop
- If on the default branch (not a feature branch), report this clearly and stop
- If PR creation fails, report the error
