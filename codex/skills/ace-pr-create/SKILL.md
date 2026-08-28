---
name: ace-pr-create
description: "Creates a GitHub pull request from current branch commits: analyses all commits since branching and generates a PR description following the repository template."
---

# Create a GitHub pull request

## Usage

- `$ace:ace-pr-create` - Creates a PR from the current branch to the default branch

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
5. Generate the PR description following the template structure (or the derived structure when no template exists). When the conversation carries the plan issue this branch implements — search the conversation for a GitHub issue URL or number, taking the most recent when the conversation carries more than one — confirm the candidate is plan-shaped before emitting the line: fetch `gh issue view <n> --json title,body` and require a `Type: plan` line in the body's first 25 lines, a `## Validation audit` H2 in the body, or a title starting with `[PLAN] ` (the plan-set arms `$ace:ace-plan-start`'s issue route classifies by). Include a `Closes #<n>` line only for a qualifying issue, so merging closes the plan issue mechanically — a wrong match would auto-close an unrelated issue on merge; human closing per the repository's conventions remains the fallback when no issue is identifiable or the candidate fails the check. This plan-shaped check is the aligned copy of the canonical three-arm published-plan test at `../ace-plan-start/references/issue-route.md` step 2 (the `$ace:ace-plan-start` issue route); an amendment to either arm-set lands in both files. The cost of a false positive is not symmetric: here it is not recoverable — a wrong `Closes #<n>` auto-closes an unrelated issue on merge — whereas at `ace-plan-start` it costs one misdirected redirect message, and both branches there stop the run
6. Create the PR: write the description to a temporary file and run `gh pr create --draft --title "..." --body-file <file>`. Never pass the generated multi-section description inline via `--body "..."` — generated descriptions routinely quote code and commands, so backticks, quotes, and `$` are the norm, and backticks inside a double-quoted bash argument are command substitution. On Windows MINGW64, `<file>` must be in POSIX form (`/c/...`) per `../../rules/environment.md`. This is the pack's canonical statement of the `--body-file` rule; aligned copies are `../ace-plan-handoff/SKILL.md` step 3 and `../ace-pr-response/SKILL.md` step 7. Two copies are deliberately out of this alignment set, each stating a different rule from a different warrant: `../ace-plan-update/SKILL.md`'s (its content is already on disk; it is not a quoting-hazard avoidance) and `../ace-report-publish/SKILL.md`'s (its warrant is that skill's no-read rule, not the shell-quoting hazard)
7. Return the PR URL to confirm completion. If the returned URL is missing or the command errored, report it rather than claiming completion

## Requirements

- Do not push code — the user must push commits before running this skill
- Exclude "Test plan" section from the PR description
- Exclude "Generated with Claude Code" footer

## Error handling

- If default-branch resolution fails (all three fallbacks produce empty output), report this and stop
- If on the default branch (not a feature branch), report this clearly and stop
- If PR creation fails, report the error
