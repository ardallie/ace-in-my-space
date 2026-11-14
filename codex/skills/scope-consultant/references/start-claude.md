# Start reference: Claude Code consultant

The requester reads this file whole and copies it unchanged into each assignment for a Claude Code consultant. The consultant agent uses only `## Agent route`. Every other section speaks to the requester.

Slots, each filled by the requester:

- `{target}` -- the target's root, which is also the consultant's working directory.
- `{step}` -- the round's step folder, `workings/{nn}-scope-consultant/`, with forward slashes.
- `{sub}` -- the consultant's subfolder, `{step}/consultant`.
- `{scratch}` -- the scratch root: never filled here, since this start grants none (`## Grant`, **Executed checks**).
- `{plugin root}` -- the requester's own plugin root, written as a value, never as a variable.
- `{T}`, `{S}` -- `{target}` and `{sub}` in this harness's permission-rule form: `//`, then the drive letter in lower case, then the rest of the path with forward slashes. `C:\Work\api` becomes `//c/Work/api`.
- `{launcher}` -- the Claude Code executable (`## Launcher`).
- `{runner}` -- the start runner, `scripts/start-consultant.mjs` under the requester's skill root. It is the only way the requester starts, waits on and stops the consultant (`## Waiting and stopping`).

Each path is absolute. These settings were shown in effect on Windows, on Claude Code builds 2.1.120 and 2.1.323. The later build was checked for the instruction load and the target write denials only. The deny rules for instruction files under `{S}` were shown on 2.1.325 only (`## Grant`). On any other build or system, record the build and treat the settings as unproven there.

## Launcher

- The launcher is the requester's own current build, never an older one the shell finds first:
  - From a Claude Code requester: the executable its own session runs, which that harness names in `CLAUDE_CODE_EXECPATH`. Read it in the requester's own shell; the runner removes it only from the consultant's environment.
  - From a Codex requester, or where that variable is unset: each `claude` the requester's shell resolves (`Get-Command claude -All` in PowerShell, `which -a claude` in a POSIX shell), taking the highest version.
  - Why: one machine can hold two builds, and the shell can find the older one first. A model alias resolves differently per build, the denial record differs per build (`## Raw output and signals`), and an older build rewrote the user's settings file (below).
- Version: `node "{runner}" probe "{launcher}"` prints the launcher's `--version` output, like `2.1.323 (Claude Code)`, and its exit status. Record the launcher's absolute path and its version. This call is also the requester's permission probe (`## Requester permission`).
- **The user's settings file.** Build 2.1.120 rewrote the user's own `~/.claude/settings.json` at the start of a consultant, dropping its `"model"` key and reordering the rest, under `--setting-sources ""` as under the default sources. Build 2.1.325 left the same file unchanged in one probe under `--setting-sources ""`.
  - So the requester takes the file's SHA-256 just before the start and again after the end.
  - A change is reported on the artefact. It is the user's file: the run never restores it on its own.
  - The owner's own sessions may write the file meanwhile, so a change is reported as seen during the round, not as the consultant's.
- Never pass `--bare`, which drops the sign-in.

## Start command

The requester writes two files into `{step}/raw/` and launches nothing itself: the runner starts the consultant from them (`## Waiting and stopping`).

1. The settings file `{step}/raw/start-settings.json`. It lies inside the step folder but outside `{sub}`, where the consultant cannot change it:

   ```json
   {
     "permissions": {
       "defaultMode": "dontAsk",
       "allow": [
         "Edit({S}/**)"
       ],
       "deny": [
         "Edit({T}/**)",
         "Edit({S}/**/CLAUDE.md)", "Edit({S}/**/CLAUDE.local.md)",
         "Edit({S}/**/AGENTS.md)", "Edit({S}/**/.claude/**)",
         "Bash(claude:*)", "Bash(claude.exe:*)",
         "Bash(codex:*)", "Bash(codex.cmd:*)", "Bash(codex.ps1:*)",
         "Bash(powershell:*)", "Bash(powershell.exe:*)", "Bash(pwsh:*)",
         "Bash(cmd:*)", "Bash(cmd.exe:*)",
         "Bash(node:*)", "Bash(npx:*)", "Bash(npm:*)",
         "Skill", "WebFetch", "WebSearch"
       ]
     },
     "env": {
       "GIT_OPTIONAL_LOCKS": "0",
       "CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD": "1"
     },
     "disableAllHooks": true
   }
   ```

2. The runner's spec `{step}/raw/start.json`:

   ```json
   {
     "launcher": "{launcher}",
     "args": [
       "-p", "{prompt}",
       "--output-format", "stream-json", "--verbose",
       "--model", "{model}", "--effort", "{effort}",
       "--setting-sources", "",
       "--settings", "{step}/raw/start-settings.json",
       "--permission-mode", "dontAsk",
       "--strict-mcp-config", "--mcp-config", "{\"mcpServers\":{}}",
       "--tools", "Read,Grep,Glob,Edit,Write,Bash,Task",
       "--disable-slash-commands",
       "--add-dir", "{target}",
       "--add-dir", "{step}",
       "--plugin-dir", "{plugin root}"
     ],
     "cwd": "{target}",
     "outDir": "{step}/raw",
     "deadlineSec": 1800,
     "marker": "{step}",
     "keepEnv": ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"]
   }
   ```

   - `args` holds one argument per element. The runner passes them to the launcher as an argument list, never through a shell, so no value is quoted for one. Fill each slot as a JSON string: a backslash is written `\\` and a double quote `\"`.
   - `{prompt}` is the round's one-line prompt naming `{step}/assignment.md`.
   - `deadlineSec` is the hard deadline in seconds after the start; 1800 stands for it here.
   - `marker` is `{step}`: a process created during the round whose command line holds it belongs to the round.
   - Where the values block's `Session:` reads `default`, drop the `--model` and `--effort` pairs (`## Model and effort`).
   - Where the requester found no plugin root, drop the `--plugin-dir` pair and record that. With the option present, its copy is the only one of that plugin in the session: the installed copy is not enabled, because no user settings load.
   - `--setting-sources ""` stays: the default sources would load the user's and the target's settings (`## Grant`). Keep the session record: never pass `--no-session-persistence`.

3. The environment the runner gives the consultant: the requester's minus the variables a Claude Code requester's session passes to its children, which carry that session's identity, a message channel back to it, and its effort:
   - `CLAUDECODE`;
   - every name beginning `CLAUDE_CODE_`, including `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN` and `CLAUDE_CODE_SESSION_ID`;
   - `CLAUDE_EFFORT` and `CLAUDE_PID`;
   - every other name holding `TOKEN`, `KEY`, `SECRET` or `PASSWORD`, matched ignoring case, but those the spec's `keepEnv` names, `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN`, which this launcher signs in with: otherwise the owner's own secrets in the environment reach the consultant's commands, which a target's text could steer. A launcher that signs in through another such name, a cloud provider's, loses it and fails at sign-in: record it.
   - from a Codex requester, every name beginning `CODEX_` but `CODEX_HOME`, which locates that harness's configuration and sign-in. That half was not exercised.

   The runner records the names it removed, never their values, in `{step}/raw/command.json`. A spec may name further variables to remove in a `removeEnv` list. `GIT_OPTIONAL_LOCKS` comes from the settings file, not from the start environment. The runner closes stdin and writes stdout to `{step}/raw/stream.jsonl` and stderr to `{step}/raw/stderr.txt`.

4. No round of a Claude Code consultant is granted a scratch root or an executed check (`## Grant`, **Executed checks**): `args`, `allow` and `deny` stay as above.

## Grant

- **Writable**: `{sub}` only, through `allow Edit({S}/**)`.
  - The rule matched both path spellings the model uses, `C:/...` and `/c/...`.
  - Everything not allowed is denied without a prompt under `dontAsk`, and the session carries on.
  - The target is denied by its own rule, `Edit({T}/**)`. That rule refuses the file tools anywhere under the target, including paths the target's own settings widen. It also refuses a shell redirect into the target.
  - Inside `{sub}`, the deny rules `Edit({S}/**/CLAUDE.md)`, `Edit({S}/**/CLAUDE.local.md)`, `Edit({S}/**/AGENTS.md)` and `Edit({S}/**/.claude/**)` refuse an instruction file (`CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`) and a `.claude/` folder at any depth, since such a file there would load into a later session that reads the folder; a deny overrides the allow.
  - On 2.1.325 they refused both the Write tool and a plain shell redirect (`echo ... > {path}`), at `{sub}`'s root and one level down, while an ordinary file there stayed writable; a lower-case `claude.md` and the `/c/...` spelling were refused too, each tried with the Write tool on `CLAUDE.md` only. Without them, that build wrote each of the three instruction files there by either route; a `.claude/` folder there it refused on its own.
  - Not shown: other shell write forms (`cp`, `mv`, `tee`, `sed -i`, `git -C`), a write by an agent the consultant spawns, any other build, and whether such a file written during the round loads into the running session. The requester's listing check after the round (the skill's N13) is the backstop, and the only guard for a file named `AGENTS.override.md` or a folder named `.codex` or `.agents`, which no rule here refuses.
- **Readable**: the start adds `{target}` and `{step}` as working directories. A read elsewhere, the request's `## By path` files at the workstream's root included, was not shown under `dontAsk`: a denial there is disclosed like any other.
  - `{step}` is readable, not writable: no allow covers it, and an edit of `{step}/request.md` was refused.
  - The requester puts no `CLAUDE.md` and no `.claude/` in `{step}`: a `CLAUDE.md` there loads into the consultant. One in an ancestor of `{step}` did not load.
- **Shell**: there is no OS sandbox under this start on Windows. Shell confinement is the allow and deny rules plus the harness's built-in read-only classifier.
  - Run under the classifier with no rule: `git status`, `git log`, `git diff --stat`, `ls`, `cat`, and `find` without write actions.
  - Refused: write forms such as `find -fprint` and `git log --output=`, `printenv`, `echo "$VAR"`, a standalone or chained long `sleep`, `gh` and `dotnet`. Some plain git reads were refused too, for example `git diff-tree`.
  - Every git read sees `GIT_OPTIONAL_LOCKS=0` from the settings file, agents included.
- **Excluded**:
  - `--setting-sources ""` loads no user, project or local settings file. That removes the target's hooks, its allow rules, its additional directories and its approved tool servers. It also removes the user's own default mode, plugins, model and instruction file.
  - `--strict-mcp-config` with an empty server list starts no tool server at all: not the target's, the user's, or the account's connectors.
  - `disableAllHooks` is present, but its own effect was not isolated: the setting sources had already removed every hook.
  - A project-scoped plugin is not loaded, since no project settings load.
  - The target's own allow rules written `Bash(x :*)` did not match even when loaded. That is a fact of the proven builds, not a lever.
- **Tools**: `--tools` gives exactly `Task, Bash, Edit, Glob, Grep, Read, Write`. There is no PowerShell tool, no web tool and no tool-server tool.
- **Skills disabled**: `--disable-slash-commands`, `deny Skill`, and no `Skill` in the tool set.
  - The init event still lists the plugin's skill names, but none can load.
  - A skill asked for by name through the agent tool was refused by the harness: "Agent type '...' not found".
  - Started without these settings, the same request loaded the skill.
- **Launcher denial**: the `deny` list refuses `claude`, `codex`, `powershell`, `pwsh`, `cmd`, `node`, `npx` and `npm` by their command names. A launcher called by absolute path is not matched by `Bash(claude:*)`, but `dontAsk` refuses it.
- **Network**: `WebFetch` and `WebSearch` are denied and absent. No network sandbox exists: a shell command that reaches the network runs only where a rule or the classifier passes it, and `gh` was refused.
- **Executed checks**: none. A check runs with the consultant's working directory, `{target}`, and its own writes are not confined by the harness once its command runs, so a relative write would land in the target; no start setting was shown to run a check with an export as its working directory. So no executed check is granted to a Claude Code consultant: the skill's N8 sizes such a question without one, and the consultant answers it `cannot-settle -- needs an executed check: {the check}`. A Codex consultant, whose sandbox refuses a write outside its writable set, can be granted it in a further round.

## Instruction file and configuration surfaces

- The instruction file is `CLAUDE.md` at the target root. The `.claude/rules/*.md` files load beside it as instructions.
  - `--add-dir "{target}"`, with `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` in the settings file's `env`, loads them under `--setting-sources ""`.
  - The variable works from the settings file, with nothing added to the start environment.
  - `--setting-sources ""` without it drops the instruction file.
- Surfaces to hash, each file present at the target root, and every file under each folder present, sorted by path:
  - `CLAUDE.md`, `.claude/settings.json`, `.claude/settings.local.json`, `.mcp.json`;
  - `.claude/rules/`, `.claude/agents/`, `.claude/skills/`.

  The start excludes all of them except the instruction file and the rules. Hashing them makes a change during the round visible.
- Each hash read is the requester's own file read in the target. None runs git.

## Model and effort

- `--model "{model}" --effort "{effort}"`, from the values block's `Session:` line.
- `{model}` is the full model id of the session's tier, not its alias. An alias resolves per build: on 2.1.120, `opus` started an older model than on the later build.
- `{effort}` is one of `low`, `medium`, `high`, `xhigh` or `max`. The flag was accepted; its effect was not measured.
- Where `Session:` reads `default`, pass neither flag. The session then runs the build's default model, which is recorded as `default`.
- The agents' models and efforts are not start flags. The consultant passes them per spawn (`## Agent route`).
- Spend backstop: `--max-budget-usd {amount}` stops a session between turns, with `subtype: "error_max_budget_usd"`, `is_error: true` and exit 1. It overshot slightly. Whether it counts agents was not shown, and it is not part of the start.

## Raw output and signals

- **Files**, all written on the requester's side, by the runner:
  - `{step}/raw/stream.jsonl`, the stream-json events;
  - `{step}/raw/stderr.txt`;
  - `{step}/raw/command.json`, `pid.json`, `ptree.jsonl` and `meta.json`: what was started, the process ids, the process tree, and the exit, the times, the stop and the processes found (`## Waiting and stopping`).
- **The init event**, the first `system` event with `subtype: "init"`. Check that it shows:
  - `permissionMode: "dontAsk"`;
  - `tools` exactly the seven above;
  - `mcp_servers: []`;
  - `slash_commands: []`;
  - `plugins` holding only the plugin root's copy, `source` ending `@inline`, or none;
  - `agents` holding the built-in types only.

  Record `claude_code_version` and `model`.
- **The result event** (`type: "result"`):
  - `subtype`, `is_error`, `terminal_reason`, `num_turns`, `duration_ms`, `session_id`;
  - `total_cost_usd`, the money cost;
  - `usage` and `modelUsage`, tokens and cost per model;
  - `permission_denials`.

  This harness reports money, so the round records cost.
- **Denials**. Exit status was 0 and `is_error` false in every run that carried denials, so read the stream, never the exit status alone.
  - A shell refusal is listed in `permission_denials` and appears as a `tool_result` with `is_error: true`.
  - Under the target's deny rule, a shell redirect into the target reads "Permission to use Bash with command ... has been denied."
  - Any other refusal under `dontAsk` reads "Permission to use {tool} has been denied because Claude Code is running in don't ask mode." It is followed by text inviting a workaround, which the assignment's bounds forbid.
  - A file-tool refusal by a deny rule is a `tool_result` with `is_error: true` and the text "File is in a directory that is denied by your permission settings."
    - On 2.1.120 it is **absent** from `permission_denials`.
    - On 2.1.323 it is listed there as well.
    - So the denial check reads every `tool_result` in the stream, the session's and the agents'.
  - The consultant's own account of its denials is not evidence: one consultant reported none while the stream held one.
- **Write and file-change records** for attribution:
  - every `tool_use` named `Write` or `Edit`, with its `file_path`;
  - every `Bash` command that redirects or writes, by its command text;
  - each of these from the session, and from its agents, whose calls carry `parent_tool_use_id`. The stream holds the agents' calls too.

  The requester's own files never appear in the stream.
- **Skills and sessions**: a `Skill` tool use; an agent call whose `subagent_type` names anything but a built-in type; a `Bash` command naming a launcher; and each refusal of one.
- **The harness's own record**:
  - The session transcript is `~/.claude/projects/{the working directory as a folder name}/{session_id}.jsonl`. It lands in the target's project folder, among the owner's own sessions for that repository, and is left in place.
  - A start also rewrites `~/.claude.json`, and an older build rewrote the user's `~/.claude/settings.json` (`## Launcher`).
  - The plugin registry files can change near a start. Their automatic update also runs from the owner's sessions, so attribution is uncertain. Record what changed; restore nothing.

## Waiting and stopping

The runner, `{runner}`, is the only way the requester starts, waits on and stops the consultant. The requester never launches the consultant or stops a process itself.

- **Start**: `node "{runner}" start "{step}/raw/start.json"`, through the requester's shell tool.
  - From a Claude Code requester, run it with the shell tool's background option. The harness notifies the requester when it exits, and a requester run waits for its background task before ending. Never wait on a long `sleep`: it is refused.
  - From a Codex requester, run it as an escalated command (`## Requester permission`). Waiting past that harness's command yield was not shown: a yielded wait is neither a pass nor a failure, and the requester waits again with `wait`, then reads `pid.json` and `meta.json`.
  - `start` refuses a spec missing a value, and a `raw/` that already holds `pid.json` or `meta.json`: a round starts once.
- **What the runner does**:
  1. It starts a keeper detached from the requester, prints `{step}/raw/pid.json` once the keeper writes it, and returns once the keeper has written `{step}/raw/meta.json`, printing its summary. So the requester's background task ends with the round, and a lost requester leaves the keeper, and the deadline, in place.
  2. The keeper starts the launcher as its own child, from the argument list, with the cleaned environment (`## Start command`), `{target}` as working directory, stdin closed and its output in `raw/`. It writes `command.json`, then `pid.json`: the keeper's process id, the consultant's, and the start time. Every 10 seconds it records the consultant's process tree in `ptree.jsonl`.
  3. At `deadlineSec` it runs `taskkill /PID {pid} /T /F` on the consultant's process id. That stops the session and its agents, which run inside the same process, along with every command either started.
  4. After the end or the stop, it stops every process of the consultant's tree that still runs: each one seen in it, compared by process id and creation time, and each descendant of one. It then sweeps the processes created since the start whose command line holds `{step}`: it stops each one whose parent no longer runs, and its descendants, and records any other without stopping it, with every descendant of it, never stopped through it; their whys begin neither `child of` nor `descendant of`, since none lies under a stopped process. It counts the other processes created since the start whose parent no longer runs (`untiedOrphans`), not their descendants. Just before stopping them, it lists the processes again and stops only those whose process id and creation time still match. Each is stopped by its own process id and listed in `meta.json`. Last, it lists the processes once more: it confirms that no process it stopped still runs, and moves each one it recorded without stopping that no longer runs to `goneBeforeStop`, so a gone process is never left running. Every process query and stop it makes has a time limit: a listing in flight when the deadline falls due can make the stop up to 60 s late, and no query holds it off longer.
  5. It writes `meta.json`: the exit, the times, `stoppedBy` (`the hard deadline`, `a stop request`, or none), the processes seen in the tree, and those it stopped (`survivors`, `swept`), did not stop (`notStopped`), found gone before their stop, or recorded and gone by the last listing (`goneBeforeStop`), or found still running (`left`), each with why `still running after its stop`, the failed owner lookups (`ownerLookupsFailed`, `treeOwnerLookupsFailed`), the orphans it neither stopped nor listed (`untiedOrphans`), and `checkError` where the sweep did not complete.
- **Why a keeper**:
  - Started through a shell `exec`, the launcher's parent is a shell that has already exited. The consultant is then outside the requester's process tree, and only its own process id reaches it.
  - A plain, non-detached child of a Node process dies with that process. That is a loss, not a bound.
  - A consultant started detached outlives a requester that is killed, and runs to its own end: this harness has no time limit. Only a keeper started detached, holding the deadline itself, bounds it.
- **Stopping early**: `node "{runner}" stop "{step}/raw/start.json"` asks the keeper to stop the consultant now, exactly as at the deadline, and returns once `meta.json` is written.
- **Waiting again**: `node "{runner}" wait "{step}/raw/start.json"` waits on the same keeper after a wait that yielded or timed out, and returns once `meta.json` is written. It starts and stops nothing.
- **Confirming the stop**: `meta.json`'s `left` and `notStopped` are empty and it holds no `checkError`. Every process in `survivors`, `swept`, `notStopped` and `left` is recorded on the step's record with its pid, name and why, its command line staying in `raw/meta.json`, and the Close shows them. A process left running -- still running after its stop, or recorded without a stop -- or a sweep that did not complete, leaves the stop unconfirmed: the record says so, the Close names for a stop by hand only those the record ties to the round, and the requester still stops no process itself.
- The runner's stop and sweep use Windows process tools, and were shown on Windows. On another system, the runner starts the consultant as its own process group and signals the group; that path was not run.

## Requester permission

- **What the start needs**: permission to run `node` with the runner through the requester's shell tool. The runner itself runs the launcher, the process query and `taskkill`.
- **The probe**: `node "{runner}" probe "{launcher}"`, the version call of `## Launcher`, made through the same tool as the start. The probe and the start share their command prefix, `node "{runner}"`.
  - A rule that allows one command may not cover the other. A start denied after a permitted probe is a stop after the open, naming the permission.
  - Where `node` itself is missing, the probe fails, and the round cannot start.
- **From a Claude Code requester**:
  - In a mode that asks, the call prompts, and the owner answers in the requester's loop.
  - Under `dontAsk`, which may be the machine's default, a call with no allow rule is **denied without a prompt**. A headless requester under that default was denied this way. The tool result reads "Permission to use Bash has been denied because Claude Code is running in don't ask mode.", and the call is listed in that requester's `permission_denials`. Stop, naming the permission: an allow rule for the exact command, or a mode that asks.
  - With an allow rule for the command, or in a bypass mode, the start is permitted.
- **From a Codex requester**:
  - Inside that requester's sandbox, `claude` launches but reaches no network, so the session cannot start its model. The start needs execution outside the sandbox, which is an escalation.
  - The version call needs no network, so it can pass inside the sandbox while the start is still refused. Record that the probe could not show the start's decision first.
  - With `approval_policy` `never`, the escalation is **denied without a prompt**: "approval policy is Never; reject command".
  - Where that requester's own configuration sets an automatic reviewer, the reviewer approves or refuses with no person. Record it as such, never as the owner's answer.

## Agent route

For the consultant agent.

- **Spawn** each agent with the agent tool. The tool set lists it as `Task`; the stream shows its calls as `Agent`. Pass `subagent_type: "general-purpose"`.
  - Only the built-in types are loaded: `claude`, `Explore`, `general-purpose`, `Plan`, `statusline-setup`. No target or user agent definition is available, and a skill name is refused as a type.
- **Model and effort**: per call, `model` takes the alias from `Tiers:` and `Roles:` (one of `fable`, `opus`, `sonnet`, `haiku`) and `effort` takes the level (`low`, `medium`, `high`, `xhigh`, `max`). The assignment's values are the instruction to set them.
  - `Model instruction:`, where it is not `none`, overrides them.
  - Where they read `default`, pass neither field, and record the agent's model and effort as `default`, as the response's `Team:` line takes them.
  - Never spawn a fork for a tiered role: a fork ignores both fields.
- **Collect**: each agent's final reply returns to you.
  - `run_in_background: true` is accepted for agents that run while you work.
  - Each agent writes its own record into `Subfolder:` with the file tools, by absolute path. Both the `C:/...` and the `/c/...` spellings match the grant.
- **Waiting**: wait on agent results, never on `sleep`. A long `sleep`, alone or chained, is refused.
- **Commands**:
  - Use exact, simple forms, since the read-only classifier passes plain reads only.
  - `printenv`, `echo` of a variable, and write forms such as `git log --output=` are refused.
  - `powershell`, `cmd`, `node`, `npx`, `npm`, `claude` and `codex` are denied.
- **Not offered**:
  - no cap on agents at once: the start sets none, so you keep to `Team limit:` yourself;
  - no per-agent isolation: every agent runs inside this one process, in the same working directory, under the same grant and the same deny rules;
  - no orchestration facility, no skill, no nested session and no network tool;
  - no tool that continues an agent. A follow-up, or a changed model or effort, takes a fresh spawn, given the earlier record by path.
