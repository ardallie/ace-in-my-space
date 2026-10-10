# Codex orchestration

Tool mechanics of this skill's direct-subagent route; what the run must secure stays in `SKILL.md`.

- Spawn each agent with its own `collaboration.spawn_agent` call: a unique `task_name`, its assignment in `message`, `fork_turns: "none"`, and the `model` and `reasoning_effort` that `../detect-harness/SKILL.md`'s consumer contract gives for its tier or override, omitting any override the contract says to omit. Issue independent spawns before waiting.
- Steer a running agent with `collaboration.send_message`; it starts no turn on an idle agent. Give an existing agent another turn on its own assignment (a clarification, a gap, a fix) with `collaboration.followup_task`. Neither takes a `model` or `reasoning_effort`: spawn fresh for a different tier, and for independent verification, challenge or review.
- Results arrive as completion notifications, also while you are doing other work. `collaboration.wait_agent` returns on the next mailbox update from any agent or on its timeout, and is no barrier for all agents; do not wait for a notification already collected. `collaboration.list_agents` shows only each agent's latest result. Neither is a ledger: record each result the run relies on in the run's state as it arrives.
- Every agent works in the one shared checkout, under the parent's sandbox and approvals; this route offers no per-agent isolation and no file lock.
- A command run through `exec_command` can yield before it exits: keep its handle and collect the exit status through that tool's continuation. A yield or a timed-out wait is neither a failure nor a pass, and no reason to start the command again.
- Where `request_user_input` is unavailable (Default mode), ask through `request_user_input_async` where it is exposed, before plain text. It returns at once and the answer arrives later as a new user message; only work that depends on the answer waits for it.
