# Start reference: Codex consultant

The requester reads this file whole and copies it unchanged into each assignment for a Codex consultant. The consultant agent uses only `## Agent route`, plus, in a round granted a scratch root, the executed-check notes under `## Grant`. Every other section speaks to the requester.

Slots, each filled by the requester:

- `{target}` -- the target's root, which is also the consultant's working directory. In `-C` and in the skill paths it is written with backslashes, `C:\Work\api`.
- `{step}` -- the round's step folder, `workings/{nn}-scope-consultant/`, with forward slashes.
- `{sub}` -- the consultant's subfolder, `{step}/consultant`, with forward slashes. A `filesystem` key takes this form.
- `{scratch}` -- the scratch root, with forward slashes, only in a round granted one.
- `{node}` and `{codex.js}` -- the launcher (`## Launcher`).
- `{n}` -- the values block's team limit: the number of agents at once.
- `{runner}` -- the start runner, `scripts/start-consultant.mjs` under the requester's skill root. It is the only way the requester starts, waits on and stops the consultant (`## Waiting and stopping`).

Each path is absolute. These settings were shown in effect on Windows, on codex-cli 0.167.2, with the Windows sandbox `elevated`. On any other version or system, record the version and treat the settings as unproven there.

## Launcher

- The launcher is `node` running the package's `codex.js` directly: `"{node}" "{codex.js}"`.
  - Never use the `codex.cmd` or `codex.ps1` shim. A shim goes through `cmd.exe` or PowerShell, and the start's values contain double quotes, which those hosts mangle.
- Resolution:
  - Find the `codex` shim the requester's shell resolves: `Get-Command codex -All` in PowerShell, `which -a codex` in a POSIX shell. A POSIX shell may find none.
  - `{codex.js}` is `node_modules/@openai/codex/bin/codex.js` under the folder that holds the shim.
  - `{node}` is the `node` the requester's shell resolves.
- Version: `node "{runner}" probe "{node}" "{codex.js}"` prints `codex-cli {version}` and the exit status. Record both paths and the version. This call is also the requester's permission probe (`## Requester permission`).

## Start command

The requester writes the runner's spec into `{step}/raw/` and launches nothing itself: the runner starts the consultant from it (`## Waiting and stopping`).

1. List the target's repository skills: each `{target}\.agents\skills\{dir}\SKILL.md` that exists. This is a directory listing only; no skill file is read. Each one becomes an entry `{path='{target}\.agents\skills\{dir}\SKILL.md',enabled=false}` in `skills.config`.
   - Without the entry, a `$name` mention in the session injects the target's skill, and the model follows it.
   - Where the target has none, drop the `skills.config` pair.

2. The runner's spec `{step}/raw/start.json`:

   ```json
   {
     "launcher": "{node}",
     "args": [
       "{codex.js}", "exec",
       "--json",
       "-o", "{step}/raw/last-message.txt",
       "-C", "{target}",
       "--ignore-user-config",
       "-c", "windows.sandbox=\"elevated\"",
       "-c", "projects={}",
       "--ignore-rules",
       "-c", "approval_policy=\"never\"",
       "-c", "approvals_reviewer=\"user\"",
       "-c", "default_permissions=\"consultant\"",
       "-c", "permissions={consultant={extends=\":read-only\", filesystem={\"{sub}\"=\"write\"}}}",
       "--add-dir", "{sub}",
       "-c", "features.hooks=false",
       "--disable", "apps", "--disable", "computer_use", "--disable", "browser_use",
       "--disable", "browser_use_external", "--disable", "in_app_browser", "--disable", "image_generation",
       "-c", "web_search=\"disabled\"",
       "-c", "skills.config=[{path='{target}\\.agents\\skills\\{dir}\\SKILL.md',enabled=false}]",
       "-c", "skills.bundled.enabled=false",
       "-c", "skills.include_instructions=false",
       "-c", "shell_environment_policy.set.GIT_OPTIONAL_LOCKS=\"0\"",
       "-c", "shell_environment_policy.ignore_default_excludes=false",
       "-c", "project_doc_max_bytes=262144",
       "-c", "agents.max_concurrent_threads_per_session={n}",
       "-m", "{model}", "-c", "model_reasoning_effort=\"{effort}\"",
       "{prompt} Read it with a shell command."
     ],
     "cwd": "{target}",
     "outDir": "{step}/raw",
     "deadlineSec": 1800,
     "marker": "{step}",
     "keepEnv": ["OPENAI_API_KEY"],
     "sandboxUserPrefix": "CodexSandbox"
   }
   ```

   - `args` holds one argument per element, `{codex.js}` first. The runner passes them to `{node}` as an argument list, never through a shell, so each `-c` value reaches the harness exactly as written. Fill each slot as a JSON string: a backslash is written `\\` and a double quote `\"`, so `C:\Work\api` is written `C:\\Work\\api`.
   - The `skills.config` value holds every entry of item 1, comma-separated, inside the one pair of brackets.
   - `{prompt}` is the round's one-line prompt naming `{step}/assignment.md`. The closing sentence ran in every proven start.
   - `deadlineSec` is the hard deadline in seconds after the start; 1800 stands for it here.
   - `marker` is `{step}`. `sandboxUserPrefix` picks the round's sandbox users: an owner of a process seen in the consultant's tree whose user name begins so, other than the requester's own user. Both tie a process left behind to the round (`## Waiting and stopping`).
   - Where the values block's `Session:` reads `default`, drop the `-m` pair and the `model_reasoning_effort` pair (`## Model and effort`).

3. The environment the runner gives the consultant: the requester's minus the variables a Claude Code requester's session passes to its children -- `CLAUDECODE`, every name beginning `CLAUDE_CODE_` (including `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN` and `CLAUDE_CODE_SESSION_ID`), `CLAUDE_EFFORT` and `CLAUDE_PID` -- and, from a Codex requester, every name beginning `CODEX_` but `CODEX_HOME`, which locates the configuration and the sign-in the start still uses. That half was not exercised. The runner also removes every other name holding `TOKEN`, `KEY`, `SECRET` or `PASSWORD`, matched ignoring case, but `OPENAI_API_KEY`, which the spec's `keepEnv` names for this launcher's sign-in.
   - Without the cleaning, the consultant's shell saw the requester's message token, and also the owner's own secrets held in the environment.
   - `shell_environment_policy.ignore_default_excludes=false`, above, drops names holding `TOKEN`, `KEY` or `SECRET` from the consultant's commands. It leaves the other session variables in place, which is why the cleaning is also needed.
   - The runner records the names it removed, never their values, in `{step}/raw/command.json`. A spec may name further variables to remove in a `removeEnv` list. The runner closes stdin and writes stdout to `{step}/raw/stream.jsonl` and stderr to `{step}/raw/stderr.txt`.

4. A round sized for an executed check:
   - replaces the `permissions` value with `permissions={consultant={extends=\":read-only\", filesystem={\"{sub}\"=\"write\", \"{scratch}\"=\"write\"}}}`, as written in the spec;
   - adds `"--add-dir", "{scratch}"`, `"-c", "shell_environment_policy.set.TEMP=\"{scratch}/tmp\""` and `"-c", "shell_environment_policy.set.TMP=\"{scratch}/tmp\""` to `args`;
   - has the requester create `{scratch}/tmp/` and `{scratch}/export/` before the start.

5. Never pass any of these:
   - `-s` or a loaded `sandbox_mode`: either switches to the older sandbox and silently drops the permission profile;
   - a root `-a never`: `exec` ignored it, and with the user's configuration loaded an escalation was approved with no person;
   - `trust_level="untrusted"`: it drops `AGENTS.md`;
   - `--dangerously-*`, `--approve-for-me`, `--ephemeral` (it loses the session record), `--worktree` (it writes the target) or `--profile`;
   - a dotted `-c` key holding a path, such as `permissions.consultant.filesystem."{path}"`: the parser splits inside the quoted segment at the `.` of `.ace`, and the start fails. Use the inline tables above.

## Grant

The harness records the settings in effect for every start, in its session record's `turn_context` and `thread_settings_applied` (`## Raw output and signals`). Read them there:
- `approval_policy: never`;
- `approvals_reviewer: user`;
- `active_permission_profile` `consultant`, extending `:read-only`;
- the file system restricted: read everywhere, write in `{sub}` only (and `{scratch}`);
- `network: restricted`;
- workspace roots `{target}` and `{sub}` only.

The model is told that it may edit its working directory. That text is wrong: writes there are denied. A session's account of its own permissions is no evidence.

- **Writable**: `{sub}`, plus `{scratch}` in a round granted one.
  - The edit tool writes there by absolute path, and shell commands write there as the sandbox user.
  - A write into the target, one level above `{sub}`, or into a directory the target's own configuration names writable was denied, for the session and for its agents alike.
  - No per-path rule refuses a name inside `{sub}`: an instruction file or an agent-configuration folder written there is caught only by the requester's listing check after the round (the skill's N13).
- **Readable**: everything the sandbox user can read, by each folder's access list: the start grants no read. The proving rounds' requester workstreams sat under `%TEMP%`, readable through an inherited `CodexSandboxUsers` entry; reflex-api carried an explicit `CodexSandboxUsers:(OI)(CI)(M)` entry from the owner's own sessions; a folder under the user profile with neither, `AppData\Roaming\nvm`, was unreadable. A requester repository the owner never opened with this harness may be unreadable to the consultant: the round then fails at its first read, a stop after the open. The requester reads the root's access list first (the skill's N5).
- **Shell**: commands run in PowerShell as the sandbox user (`CodexSandboxOffline` on the proving machine). They see `GIT_OPTIONAL_LOCKS=0`, the session's and each agent's alike.
- **Excluded**:
  - `--ignore-user-config` drops the user's configuration file. That removes its automatic reviewer, its notify program, its tool servers, its enabled plugins, its hook trust and its project trust entries.
  - `-c projects={}` leaves the target with **no trust entry**. With no entry, `AGENTS.md` loads and the project's `.codex/` layer does not: its configuration, hooks, rules, agent roles and tool servers all stay out. It also overrides any trust entry supplied earlier with `-c`.
  - `--ignore-rules` drops user and project rule files.
  - `features.hooks=false` turns off lifecycle hooks a second time.
  - The `--disable` set and `web_search="disabled"` remove the tools that act outside the command sandbox.
  - A target's Claude Code files are not read by this harness.
- **Skills disabled**:
  - Each repository skill is disabled by path (item 1 of `## Start command`).
  - `skills.bundled.enabled=false` and `skills.include_instructions=false` remove the bundled skills and the skills catalogue.
  - Under `--ignore-user-config`, no plugin skill is provided.
  - The model can still read a skill file as text. That is reading, not invoking, and the assignment bounds it.
- **Launcher denial and network**: this harness has no per-start rule that denies a launcher. The sandbox's network denial is the lever.
  - A nested `codex` was not on the sandbox's path. Started through a runtime the sandbox could read, it launched but was refused service (`os error 10013`).
  - A nested `claude` launched but reached no service ("Unable to connect").
  - Neither ran a model turn. Both came into being as processes, so the stop sweeps for them (`## Waiting and stopping`).
- **Target write grants**: a target the owner works in with this harness may already carry explicit write grants for the sandbox identities of the owner's own sessions.
  - A round's session gets its own identity. In a probe, a shell write into a folder holding such grants was still refused.
  - No write into a real target was attempted. Where the target's grants are in doubt, the requester may read its access list, which is metadata only.
- **Executed checks** (a round granted `{scratch}`):
  - `TEMP` and `TMP` point into `{scratch}/tmp`, so a check's temporary files stay in the writable set.
  - Plain `node` may be unreadable to the sandbox user: on the proving machine, only the harness's own bundled runtime was readable. A check that needs a runtime the sandbox user cannot read is answered `cannot-settle`, naming the check.
  - A check that needs the network, such as a package restore, cannot run.
  - Commands run in PowerShell. Write an export to a file (`git archive --format=tar -o {scratch}/export.tar HEAD`, then `tar -x -f {scratch}/export.tar -C {scratch}/export`) rather than piping it. That form was not run on this harness.

## Instruction file and configuration surfaces

- The instruction file is `AGENTS.md` at the target root.
  - It loads when the target has no trust entry, which is what `-c projects={}` with `--ignore-user-config` gives.
  - By default only its first 32 KiB load. `project_doc_max_bytes=262144` loads a larger file whole.
- Surfaces to hash, each file present at the target root, and every file under each folder present, sorted by path:
  - `AGENTS.md`;
  - `.codex/`, which holds the configuration, hooks, rules and agent roles;
  - `.agents/`, which holds the repository skills.

  The start excludes all of them except the instruction file. Hashing them makes a change during the round visible. Each hash read is the requester's own file read in the target; none runs git.
- The target's agent roles (`.codex/agents/*.toml`) can set `workspace-write` for a spawned agent. They load only with the project layer, which the start excludes; the spawn tool then offers no role field.

## Model and effort

- `-m "{model}" -c 'model_reasoning_effort="{effort}"'`, from the values block's `Session:` line. The user configuration's model and effort do not load.
- Where `Session:` reads `default`, pass neither. The session then runs the harness's default selection, which is recorded as `default`.
- This harness has no whole-session time or money limit. The deadline is the requester's (`## Waiting and stopping`).
- The agents' models and efforts are not start flags. The consultant passes them per spawn (`## Agent route`). `agents.max_concurrent_threads_per_session={n}` caps the agents at once; the spawn tool then reports `{n}` + 1 slots, the session included.

## Raw output and signals

- **Files**, all written on the requester's side, by the runner:
  - `{step}/raw/stream.jsonl`, the `--json` events;
  - `{step}/raw/stderr.txt`. It prints "Reading additional input from stdin..." and does not wait.
  - `{step}/raw/last-message.txt`, the `-o` last message;
  - `{step}/raw/command.json`, `pid.json`, `ptree.jsonl` and `meta.json`: what was started, the process ids, the process tree, and the exit, the times, the stop and the processes found (`## Waiting and stopping`).
- **The events**:
  - `thread.started`, whose `thread_id` names the session;
  - `item.started` and `item.completed`, with `command_execution` items (`command`, `aggregated_output`, `exit_code`) and `agent_message` items;
  - `turn.completed`, with `usage`: `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`;
  - `turn.failed`.

  This harness reports tokens, not money, so the round records tokens.
- **The session records**:
  - `~/.codex/sessions/{yyyy}/{MM}/{dd}/rollout-{time}-{thread_id}.jsonl`, under `CODEX_HOME` where that is set, is the harness's own record of the session.
  - Each agent the session spawned has its own record file, whose first line (`session_meta`) carries `parent_thread_id` equal to the session's `thread_id`.
  - After the end, the requester copies the session's record and its agents' into `{step}/raw/rollouts/`. It finds them by reading only the first line (`session_meta`) of the record files in the day folders the round's start and end fall in, modified at or after the start: the session's is the file whose name carries its `thread_id`; an agent's is one whose `parent_thread_id` is the session's `thread_id` or that of an agent already found, followed until no new one is found. It records the names of the files it read, and reads no other file of the owner's sessions.
  - The `--json` stream holds no agent's transcript and no edit-tool call, so these records are the complete account.
- **Denials**. Exit status was 0 in every run that carried denials, so read the records, never the exit status alone.
  - A shell write refusal reads "Access to the path '...' is denied" (an `UnauthorizedAccessException`, exit 1), in the command's output, in both the stream and the session record.
  - An edit-tool refusal reads "patch rejected: writing outside of the project; rejected by user approval settings". It appears **only** in the session record: every tool call is wrapped in a code-mode `exec` call, and the stream does not show the nested edit tool.
  - A refused escalation reads "approval policy is Never; reject command".
  - A network refusal reads `os error 10013`, or "Unable to connect".
- **Write and file-change records** for attribution:
  - in the session records, each `exec` call whose input calls `tools.apply_patch`, read by its `*** Add File:`, `*** Update File:` and `*** Delete File:` paths. A relative path is relative to `{target}`.
  - each shell command that writes, by its command text;
  - each of these from the session's record and from each agent's.

  The requester's own files never appear in them.
- **Skills and sessions**: a `<skill>` item injected into a session record, a command naming a launcher, and each refusal of one.
- **The harness's own writes**:
  - A start writes its session records.
  - It also writes the sandbox's identity and access state under `~/.codex/`.
  - It rewrote the plugin cache's install files, despite `--ignore-user-config`. Record these; restore nothing.

## Waiting and stopping

The runner, `{runner}`, is the only way the requester starts, waits on and stops the consultant. The requester never launches the consultant or stops a process itself.

- **The tree**: the `node` launcher, then `codex.exe`, then its code-mode host and one command runner per running command, owned by the sandbox user, then each command's shell. The agents run inside `codex.exe`, and their commands are its children too. `exec` used no shared server: the desktop app's server processes were in no session's tree.
- **Start**: `node "{runner}" start "{step}/raw/start.json"`, through the requester's shell tool.
  - From a Claude Code requester, run it with the shell tool's background option: the harness notifies the requester at the end, and the requester never waits on a long `sleep`.
  - From a Codex requester, run it as an escalated command (`## Requester permission`). Waiting past that harness's command yield was not shown: a yielded wait is neither a pass nor a failure, and the requester waits again with `wait`, then reads `pid.json` and `meta.json`.
  - `start` refuses a spec missing a value, and a `raw/` that already holds `pid.json` or `meta.json`: a round starts once.
- **What the runner does**:
  1. It starts a keeper detached from the requester, prints `{step}/raw/pid.json` once the keeper writes it, and returns once the keeper has written `{step}/raw/meta.json`, printing its summary. So the requester's wait ends with the round, and a lost requester leaves the keeper, and the deadline, in place.
  2. The keeper starts `{node}` as its own child, from the argument list, with the cleaned environment (`## Start command`), `{target}` as working directory, stdin closed and its output in `raw/`. It writes `command.json`, then `pid.json`: the keeper's process id, the launcher's, and the start time. Every 10 seconds it records the launcher's process tree in `ptree.jsonl`. Where the spec names `sandboxUserPrefix`, each snapshot also looks up the owner of each process new to the tree, at most 16 per snapshot, bounded at 15 s, so the deadline stop can come up to 75 s late in the worst case: a stalled listing and a stalled lookup in one snapshot.
  3. At `deadlineSec` it runs `taskkill /PID {pid of the node launcher} /T /F`. That stopped the launcher, the session, its agents' commands and their consoles, with none left.
  4. After the end or the stop, it stops every process of the tree that still runs: each one seen in it, compared by process id and creation time, and each descendant of one. It then sweeps the processes created since the keeper started whose parent no longer runs. It stops each one whose command line holds `{step}`, or whose owner is exactly a sandbox user of the round -- one seen owning a process of the consultant's tree, `Domain\User`, compared ignoring case -- and their descendants; a name-prefix match alone never stops one. It lists without stopping each other process created since the start that holds `{step}`, and each other one whose parent no longer runs and whose owner's name begins `CodexSandbox`, since another session of the owner's may own it. It looks up owners only for processes whose parent no longer runs, and counts the lookups that failed. Just before stopping them, it lists the processes again and stops only those whose process id and creation time still match. Each process is stopped by its own process id and listed in `meta.json`. Last, it confirms that no process it stopped still runs. Every process query and stop it makes has a time limit, so a stalled query cannot hold off the deadline.
  5. It writes `meta.json`: the exit, the times, `stoppedBy` (`the hard deadline`, `a stop request`, or none), the processes seen in the tree, and those it stopped (`survivors`, `swept`), did not stop (`notStopped`), found gone before their stop (`goneBeforeStop`) or found still running (`left`), the sandbox users it tied processes to (`sandboxUsers`), and the failed owner lookups (`ownerLookupsFailed`, `treeOwnerLookupsFailed`).
- **Why a keeper and a sweep**:
  - A plain, non-detached child of a Node process dies with that process. That is a loss, not a bound.
  - A consultant started detached outlives a requester that is killed, and runs to its own end, bounded by nothing else. A keeper started detached, holding the deadline itself, bounds it; that shape was shown with the other harness only.
  - A command can detach a grandchild and exit. The grandchild is then outside the launcher's tree, and the session's own end does not stop it: a nested start left three processes running after the session ended. A `taskkill` from inside the sandbox got "Access denied". Only the requester's sweep, by owner and creation time, reached them.
  - The owner's own Codex sessions may run commands as the same sandbox user. One of their processes created during the round whose parent is gone cannot be told from the round's, and the sweep stops it too: the round's start line says so, and the Close and the consultation record list every process stopped after the end and every one left running.
- **Stopping early**: `node "{runner}" stop "{step}/raw/start.json"` asks the keeper to stop the consultant now, exactly as at the deadline, and returns once `meta.json` is written.
- **Waiting again**: `node "{runner}" wait "{step}/raw/start.json"` waits on the same keeper after a wait that yielded or timed out, and returns once `meta.json` is written. It starts and stops nothing.
- **Confirming the stop**: `meta.json`'s `left` is empty; every process in `survivors`, `swept` and `notStopped` is recorded with its command line and why on the step's record, and the Close shows them.
- The runner's stop and sweep use Windows process tools, and were shown on Windows. On another system, the runner starts the consultant as its own process group and signals the group; that path was not run.

## Requester permission

- **What the start needs**:
  - permission to run `node` with the runner through the requester's shell tool; the runner itself runs the launcher, the process query and `taskkill`;
  - the model service over the network.
- **The probe**: `node "{runner}" probe "{node}" "{codex.js}"`, the version call of `## Launcher`, made through the same tool as the start. The probe and the start share their command prefix, `node "{runner}"`.
  - A rule that allows one command may not cover the other. A start denied after a permitted probe is a stop after the open, naming the permission.
- **From a Claude Code requester**:
  - In a mode that asks, the call prompts, and the owner answers in the requester's loop.
  - Under `dontAsk`, which may be the machine's default, a call with no allow rule is **denied without a prompt**. The tool result reads "Permission to use Bash has been denied because Claude Code is running in don't ask mode." Stop, naming the permission: an allow rule for the exact command, or a mode that asks.
  - With an allow rule for the command, or in a bypass mode, the start is permitted.
- **From a Codex requester**: the start needs execution **outside** that requester's sandbox.
  - Inside it, the node runtime and the launcher are unreadable to the sandbox user ("Access is denied"), and `codex` is not on the path.
  - The service also needs network, which the sandbox denies.
  - So the probe already needs the escalation, and shows the decision before the start:
    - with `approval_policy` `never`, it is **denied without a prompt**: first "Access is denied", then "approval policy is Never; reject command";
    - where that requester's own configuration sets an automatic reviewer, the reviewer approved the escalation with no person, so record it as the reviewer's, never as the owner's answer;
    - where the owner reviews, the escalation prompts in the requester's loop.

## Agent route

For the consultant agent.

- **Spawn** each agent with its own `collaboration.spawn_agent` call, made as a direct tool call. The collaboration tools are not reachable from inside the code-mode `exec` tool. Pass:
  - `task_name`: lowercase letters, digits and underscores only. An upper-case name was rejected.
  - `message`: a self-contained brief, the agent's whole assignment, with long material by path;
  - `fork_turns: "none"`;
  - `model` and `reasoning_effort`, the values from `Tiers:` and `Roles:`, with `Model instruction:` overriding them where it is not `none`. The assignment's values are the explicit instruction these overrides need. Where they read `default`, omit both and record the agent's model and effort as `default`.

  A spawn with `fork_turns` omitted or `"all"` inherits your model and effort and refuses the overrides.
- **No agent type**: the spawn tool takes no type field, and the target's agent roles are not loaded. Every agent is a default agent under your permissions.
- **Collect**: issue independent spawns before waiting.
  - Wait with `collaboration.wait_agent`, in long waits (`timeout_ms` up to 3600000). Each agent's final answer arrives as its completion.
  - `collaboration.send_message` steers a running agent, and `collaboration.followup_task` gives an idle one a follow-up. Neither takes a model or an effort, so a changed model or effort takes a fresh spawn.
  - `collaboration.list_agents` and `collaboration.interrupt_agent` list and stop agents.
- **At once**: at most the team limit, as the start caps it.
- **Records**: each agent inherits your permission profile: read everywhere, write only in `Subfolder:` and, where granted, `Scratch root:`, no network. It writes its record into `Subfolder:` with the edit tool, by absolute path.
- **Commands**:
  - They run in PowerShell. Quote any argument holding a space: an unquoted `--format=%h %s` failed as a parse error.
  - Never wait on a long `sleep`.
  - Plain `node` may be unreadable here.
  - A nested session cannot reach its service. Starting one is outside your bounds in any case.
- **Not offered**:
  - no per-agent isolation: all agents share your working directory and file system, and one agent's edits are at once visible to the others;
  - no orchestration facility, no skill, no custom agent role, no network, and no nested session.
