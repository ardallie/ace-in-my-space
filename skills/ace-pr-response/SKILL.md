---
name: ace-pr-response
description: "Responds to PR review comments based on work done in the conversation: reads the PR via /ace-pr-read, gates on the fixes being pushed to the PR head branch, then posts a summary comment and threaded replies."
argument-hint: "[<pr>]"
disable-model-invocation: false
---

# Respond to PR review comments

## Usage

- `/ace-pr-response` - Uses the PR number from conversation context
- `/ace-pr-response {PR_NUM}` - Responds to comments on the specified PR

## Context

This skill responds to PR review feedback — comments left by an automated review workflow or by human reviewers.

## Task

1. Identify the PR number from {PR_NUM} argument, or search the conversation for a PR URL or number, taking the most recent when the conversation carries more than one. If not found, report this and stop.
2. Fetch repository info: `gh repo view --json owner,name`
3. Read the PR and every comment surface by running `/ace-pr-read {PR_NUM}` (`${CLAUDE_PLUGIN_ROOT}/skills/ace-pr-read/SKILL.md`) — it returns conversation comments, review bodies, and the inline review comments whose `id` values the replies API below needs. Run it afresh even when an earlier command in this session already fetched the PR — the surfaces move between commands (new comments, force-pushes), and the address-every-comment requirement below needs the current set; never reuse a same-session fetch
4. Push-state gate: confirm the fixes are actually on the PR head branch before claiming resolution. Fetch the head ref (`git fetch origin <head-branch>`, where `<head-branch>` is the `headRefName` from step 3's output), then diff the touched files against it (`git diff origin/<head-branch> -- <files>` — expected empty). The empty diff proves local matches remote, not that the fix is present — a reverted working tree also passes it — so additionally confirm each fix commit is on the remote head: `git merge-base --is-ancestor <sha> origin/<head-branch>` for each fix-commit SHA the `[x]` replies will cite (the Requirements section obliges citing them; SHA and ref arguments only, so no MINGW path-conversion exposure). If the fixes exist only in the local working tree or on unpushed commits, stop and report the divergence instead of posting replies; a `[x]` that points reviewers at a change not on the branch is untruthful.
5. Analyse each comment against what was implemented in the conversation
6. Post a summary comment: write the body to a temporary file and run `gh pr comment {PR_NUM} --body-file <file>` (same rationale as step 7's `-F body=@<file>`)
7. Post threaded replies to each inline comment: write each reply body to a temporary file and run `gh api repos/{OWNER}/{REPO}/pulls/{PR_NUM}/comments/{COMMENT_ID}/replies -X POST -F body=@<file>` (the explicit `-X POST` guards against the endpoint being called as a GET, which returns 404; `-F body=@<file>` reads the body from the file, avoiding the shell-quoting hazards of inline `-f body="..."` — reply bodies routinely quote code, so backticks, quotes, and `$` are the norm, and backticks inside a double-quoted bash argument are command substitution). On Windows MINGW64, every temp-file path in steps 6-7 must be in POSIX form (`/c/...`) per `${CLAUDE_PLUGIN_ROOT}/rules/environment.md`. `${CLAUDE_PLUGIN_ROOT}/skills/ace-pr-create/SKILL.md` step 6 is this rule's canonical copy; `${CLAUDE_PLUGIN_ROOT}/skills/ace-plan-handoff/SKILL.md` step 3 carries the other aligned copy, so an amendment lands at every site in one change
8. Return confirmation that all responses were posted

## Response format

Prefix each item with `[x]` (resolved) or `[i]` (not resolved).

**Summary comment structure:**

For resolved issues:
- `[x]` **Brief title** - One-line summary
- **Modified:** Affected files
- **Change:** What was changed and why

For unresolved issues:
- `[i]` **Brief title** - One-line summary
- **Reason:** Why the suggestion was not implemented

**Threaded reply structure:**

- `[x]` Resolved - explain how, reference specific files and lines
- `[i]` Not resolved - explain current status and rationale

## Requirements

- Address EVERY review comment, not just resolved ones
- Be truthful and accurate about what was done
- Cite the commit SHA that carries each fix in `[x]` replies. When the PR head was amended or force-pushed since the review, the reviewed SHA no longer exists on the branch: cite the SHA now carrying the fix (locate it via `git log origin/<head-branch> -- <files>`) and state that the head was rewritten, so reviewers do not chase the orphaned SHA
- Use the replies API for threaded responses, not standalone inline comments

## Error handling

- If PR number cannot be determined, report this clearly and stop
- If the fixes are not on the PR head branch, report the divergence and stop before posting
- If API calls fail, report the error
