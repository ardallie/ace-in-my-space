---
name: ace-pr-read
description: "Reads one or more pull requests (bare number or full URL) into the session: metadata, description, and all three comment surfaces (conversation comments, inline review comments, review bodies); --comments no skips the comment surfaces; read-only."
argument-hint: "[<pr> ...] [--comments no]"
disable-model-invocation: false
---

# Read a GitHub pull request

## Usage

- `/ace-pr-read` — uses the PR number from conversation context
- `/ace-pr-read <pr> [<pr> ...]` — reads one or more pull requests, each a bare number (e.g. `834`) or a full URL (e.g. `https://github.com/<owner>/<repo>/pull/834`)
- `/ace-pr-read <pr> --comments no` — metadata and description only, skipping every comment surface; defaults to `--comments yes`; the flag applies to all PRs in the invocation

## Context

A PR carries comments on three API surfaces and no single `gh` call returns them all: `gh pr view` returns conversation comments and review bodies, but inline review comments come only from the REST API. In particular, `gh issue view` on a PR number succeeds (GitHub shares one number space) but returns only conversation comments — inline review feedback is silently missed. Commands that need PR content run this skill by reference instead of restating the fetch recipe.

## Task

1. Parse flags first: `--comments yes|no`, default `yes`. Any other value -> report it and stop.
2. Classify each remaining token — first match wins:
   - Full URL containing `/pull/` -> extract owner, repo, and number via `https://github.com/([^/]+)/([^/]+)/pull/(\d+)`; fetch with `--repo <owner>/<repo>`
   - Bare integer -> PR number in the repository resolved from the current working directory
   - Anything else -> report the unrecognised token and stop

   With no PR tokens, search the conversation for a PR URL or number, taking the most recent when the conversation carries more than one; if none can be found, report usage and stop.
3. For each PR, fetch metadata, description, conversation comments, and review bodies in one call:

   ```bash
   gh pr view <number> [--repo <owner>/<repo>] --json number,title,state,author,baseRefName,headRefName,url,body,comments,reviews
   ```

   Each review carries a `state` (`APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`); drop review entries whose body is empty and whose state is `COMMENTED` — they exist only to carry inline comments. With `--comments no`, drop `comments,reviews` from the field list and skip step 4.
4. Fetch the one surface `gh pr view` does not return — inline review comments. Resolve `<owner>/<repo>` via `gh repo view --json owner,name` when the PR was given as a bare number. The endpoint path carries no leading slash — MINGW rewrites `/repos/...` into a filesystem path:

   ```bash
   gh api --paginate repos/<owner>/<repo>/pulls/<number>/comments
   ```

   `--paginate` is required: the endpoint returns 30 items per page by default, so a heavily-reviewed PR would otherwise silently truncate — the exact incompleteness this skill exists to prevent.

   Keep each inline comment's `id`, `path`, `line`, and `in_reply_to_id` — consumers that post threaded replies need the ids, and consumers that triage findings pair comments with their responses via `in_reply_to_id`.
5. Present each PR in argument order under its own heading:
   - Title, state, author, `head -> base` branches, URL
   - The description (body)
   - All comments in chronological order across the three surfaces, each with author, timestamp, and surface; review bodies additionally with their state, inline review comments with `path:line`, comment id, and `in_reply_to_id` where non-null

## Requirements

- Read-only — never post, edit, close, or resolve anything on the PR
- A single bad PR fails the run — never silently read the remainder

## Error handling

- No PR token and none derivable from the conversation -> report usage and stop
- A number or URL that does not resolve to a pull request (e.g. an issue number) -> report the error and stop; when the number resolves to an issue, name the issue and point at `/ace-plan-read <n>` as the issue-loading counterpart
- Unrecognised token or `--comments` value -> report it and stop
- If there are permission issues with GitHub, report them
