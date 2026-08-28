# Environment

## Codex tool mechanics

- Inspect files and run shell commands through `exec_command`; prefer `rg` and `rg --files` for
  text and file discovery.
- Apply targeted file edits with `apply_patch`. Bulk deterministic generation may use the script
  or formatter that owns the generated output.
- Spawn subagents through `collaboration.spawn_agent`. When model and reasoning overrides are
  supplied, pass `fork_turns: "none"` or a positive turn count; full-history forks reject overrides.
- Collect subagent completion through notifications or `wait_agent`; do not poll on a timer.

Claude tool names do not apply in this Codex edition. References to host `.claude/**` paths are
inspection targets in a repository being reviewed, not Codex discovery paths.

General layer -- keep byte-identical across sibling repositories.

Development runs on three platforms, all equally supported:

- Windows 11 -- bash commands execute under MINGW64 Git Bash (Windows Terminal), not cmd, PowerShell, or WSL2
- Linux (Ubuntu)
- macOS

The environment is Linux-like everywhere: a POSIX shell, GNU-style core utilities, `git`, and `gh`. Write commands as for Linux. On Linux and macOS no divergences apply; on Windows the MINGW64 layer introduces the bounded set below -- safeguard against these and nothing else.

## MINGW64 divergences (Windows only)

### Path forms

- File-operation tools (exec_command/apply_patch): Windows absolute paths with backslashes -- `C:\Projects\solution\file.txt`
- Bash commands (ls, find, cat, cd, grep, redirections): POSIX paths with forward slashes -- `/c/Projects/solution/file.txt`

Conversion: drive letter `C:` -> `/c/`, backslashes `\` -> `/`. Convert every path argument to POSIX form before running a bash command.

Pitfalls:

- Windows paths (`C:\...`) in bash commands fail silently or produce confusing errors
- Mixing Windows and POSIX paths in the same command causes path collapsing
- Glob patterns and loops in bash require POSIX paths to work reliably

### MSYS path rewriting

MINGW64 rewrites arguments that look like POSIX paths into Windows paths before the program sees them:

- The `rev:path` form (`git show origin/main:docs/file.md`) is rewritten -- the colon and slashes become a Windows path. Prefer `git diff <rev> -- <path>` (or `git show <rev> -- <path>`), or disable conversion for a single call with `MSYS_NO_PATHCONV=1 git show <rev>:<path>`.
- `gh api` endpoint paths with a leading slash are rewritten into filesystem paths (`gh api /repos/owner/repo/...` fails with `invalid API endpoint: "C:/Program Files/Git/repos/..."`). Omit the leading slash: `gh api repos/owner/repo/pulls/123/comments`. The `gh` CLI accepts both forms, so the slash-free form is safe on every platform.

## GitHub CLI method semantics (all platforms)

`gh api` defaults to the GET method. Unlike curl's `-d`, the `-f`/`-F` field flags do not switch it to POST, so create operations without `-X POST` fail with HTTP 404 (the GET endpoint does not exist). Always pass `-X POST` when creating resources:

```bash
gh api repos/owner/repo/issues/123/comments -X POST -f body="Comment text"
gh api repos/owner/repo/pulls/123/comments/456/replies -X POST -f body="Reply text"
```

Prefer `gh issue comment` / `gh pr comment` for simple comments.

## Shell glob quoting (all platforms)

Quote glob-carrying flag values in bash commands: `grep -rn --include='*.ts' ...`, never `--include=*.ts`. Under zsh an unquoted glob that matches nothing in the current directory aborts the whole command (`no matches found`), while bash passes it through untouched — the quoted form behaves identically everywhere.
