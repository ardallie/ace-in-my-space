---
name: plan-handoff
description: Posts a technical handoff comment to a GitHub issue, synthesised from the conversation, documenting what the session actually did. Run after implementation work; /ace:plan-implement invokes it as its final step.
argument-hint: "[<issue>]"
disable-model-invocation: false
---

# Post a technical handoff comment to a GitHub issue

## Usage

- `/ace:plan-handoff` - Uses the issue number from conversation context
- `/ace:plan-handoff <issue>` - Posts to the specified issue (e.g., `85`)

## Context

The handoff responds to the plan. The plan defines "what we will do"; the handoff documents "what we actually did". Future sessions use `/ace:plan-read` to load this context.

## Task

1. Identify the issue number from the argument or search the conversation for a GitHub issue URL or number, taking the most recent when the conversation carries more than one. If not found, report this and stop. Aligned copy of the issue-number-resolution rule canonical at `/ace:plan-read` step 1, which enumerates the full copy set; amend every site together.
2. Synthesise implementation details from the conversation
3. Format and post the handoff comment: write the body to a temporary file and run `gh issue comment <issue> --body-file <file>`. Never pass the synthesised body inline via `--body "..."` — handoff bodies routinely quote runnable commands, so backticks, quotes, and `$` are the norm, and backticks inside a double-quoted bash argument are command substitution. On Windows MINGW64, `<file>` must be in POSIX form (`/c/...`). `${CLAUDE_PLUGIN_ROOT}/skills/pr-create/SKILL.md` step 6 is this rule's canonical copy; `${CLAUDE_PLUGIN_ROOT}/skills/pr-response/SKILL.md` step 7 carries the other aligned copy, so an amendment lands at every site in one change.
4. Return the comment URL to confirm completion. Read the URL from the `gh` output; if the returned URL is missing or the command errored, report it and stop rather than claiming completion

## Handoff content

Focus on technical specifics not obvious from the code:

1. **Implementation notes** - Deviations from plan, technical decisions, patterns used
2. **Gotchas** - Import paths, type quirks, environment setup, test mocks required
3. **Verification** - Commands to run tests and lint checks with correct filters
4. **Limitations** - Known constraints, edge cases, incomplete aspects

## Requirements

- Keep it concise - avoid repeating what's in the plan or PR description

## Error handling

- If issue does not exist, report the error
- If there are permission issues, report them
