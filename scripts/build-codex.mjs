import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(repositoryRoot, "codex");

// Files held equal to their sources in the Codex edition; check-codex.mjs keeps the same lists.
// - verbatimFiles: the start references and the start runner name a harness's own commands and
//   variables, so the build copies them without conversion, and check-codex holds them equal to
//   their sources and exempts only them from its forbidden-form scan.
// - invariantFiles and invariantSections: the consultant-side reference, the assignment and
//   request templates whose fixed text the consultant reads, and orchestration.md's ground rules,
//   which a consultation round copies into its assignment, are converted like every file and must
//   come out unchanged.
const verbatimFiles = ["skills/scope-consultant/references/start-claude.md", "skills/scope-consultant/references/start-codex.md", "skills/scope-consultant/scripts/start-consultant.mjs"];
const invariantFiles = ["skills/scope-consultant/references/consultant.md", "skills/scope-consultant/assets/assignment-template.md", "skills/scope-consultant/assets/request-template.md"];
const invariantSections = [["skills/ws-shared/orchestration.md", "## Ground rules"]];

const assertInsideRepository = (candidate) => {
  const rel = relative(repositoryRoot, candidate);
  if (!rel || rel.startsWith(`..${sep}`) || rel === "..") {
    throw new Error(`Refusing to replace unsafe output path: ${candidate}`);
  }
};

const assertConversionSource = (text, before, label) => {
  const found = before instanceof RegExp
    ? new RegExp(before.source, before.flags.replace("g", "")).test(text)
    : text.includes(before);
  if (!found) {
    throw new Error(`Expected conversion source was not found (${label}).`);
  }
};

// Guarded counterparts of String.prototype.replace / replaceAll. A conversion anchor that no
// longer matches its source must fail the build, not silently leave the Claude text in place.
const replaceRequired = (text, before, after, label) => {
  assertConversionSource(text, before, label);
  // replace() rewrites only the first match, so a string anchor that recurs would leave its
  // later copies in Claude form; it must match exactly once.
  if (typeof before === "string") {
    const count = text.split(before).length - 1;
    if (count !== 1) {
      throw new Error(`Expected conversion source to match exactly once, found ${count} (${label}).`);
    }
  }
  return text.replace(before, after);
};

const replaceAllRequired = (text, before, after, label) => {
  assertConversionSource(text, before, label);
  return text.replaceAll(before, after);
};

const decodeYamlScalar = (value) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const convertFrontmatter = (text) => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    throw new Error("Skill has no YAML frontmatter.");
  }

  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z-]+):\s*(.*)$/);
    if (field) fields.set(field[1], field[2]);
  }

  const name = fields.get("name");
  const description = fields.get("description");
  if (!name || !description) {
    throw new Error("Skill frontmatter must contain name and description.");
  }

  let body = text.slice(match[0].length);
  const argumentHint = fields.get("argument-hint");
  if (argumentHint) {
    const hint = decodeYamlScalar(argumentHint);
    const heading = body.match(/^# .+\r?\n/);
    const invocationLine = `\n**Invocation input:** \`${hint}\`\n`;
    body = heading
      ? `${heading[0]}${invocationLine}${body.slice(heading[0].length)}`
      : `**Invocation input:** \`${hint}\`\n\n${body}`;
  }

  return `---\nname: ${name}\ndescription: ${description}\n---\n${body}`;
};

// Skill identities come from the directories that own a SKILL.md. Nothing in this generator
// may assume a brand prefix on an inner name: the `ace` plugin namespace supplies uniqueness.
const assertSkillInventory = (skillsRoot) => {
  const names = readdirSync(skillsRoot)
    .filter((entry) => existsSync(join(skillsRoot, entry, "SKILL.md")))
    .sort();
  if (!names.length) throw new Error("No skills discovered under skills/.");
  const prefixed = names.filter((name) => name.startsWith("ace-"));
  if (prefixed.length) {
    throw new Error(`Skill names must not repeat the plugin namespace: ${prefixed.join(", ")}`);
  }
};

assertSkillInventory(join(repositoryRoot, "skills"));

const convertCommandsAndPaths = (text) => {
  // Claude invokes a plugin skill as `/ace:{skill}`; Codex mentions the same skill as
  // `$ace:{skill}`. Only the sigil differs, so the conversion is structural -- it never needs
  // to know an inner skill name.
  let converted = text.replace(/\r\n/g, "\n").replaceAll("/ace:", "$ace:");

  converted = converted
    .replaceAll("${CLAUDE_PLUGIN_ROOT}/skills/", "../")
    .replaceAll("AskUserQuestion", "request_user_input")
    .replaceAll("`Agent` tool", "`collaboration.spawn_agent`")
    .replaceAll("`Agent`", "`collaboration.spawn_agent`")
    .replaceAll("Agent tool", "`collaboration.spawn_agent`")
    .replaceAll("subagent_type", "agent_type")
    .replaceAll("via the Write tool", "with `apply_patch`")
    .replaceAll("via the Read tool", "with `exec_command` file inspection")
    .replaceAll("Read tool", "`exec_command` file inspection")
    .replaceAll("Write tool", "`apply_patch`")
    .replaceAll("Read/Write/Edit", "exec_command/apply_patch")
    .replaceAll("Read/Glob/Grep", "exec_command/rg")
    .replaceAll("Read, Glob, Grep, and read-only Bash", "`exec_command` with `rg --files`, `rg`, and read-only shell commands")
    .replaceAll("Read, Edit, Glob, Grep, Bash", "`exec_command`, `rg`, and `apply_patch`")
    .replaceAll("Read, Glob, Grep, Bash, Write", "`exec_command`, `rg`, and `apply_patch`");

  return converted;
};

const convertQuestions = (text) => text
  .replaceAll(
    "Use the `request_user_input` tool",
    "Use `request_user_input` when it is available in Plan mode; otherwise ask the same question in concise plain text",
  )
  .replaceAll(
    "use the `request_user_input` tool",
    "use `request_user_input` when it is available in Plan mode, otherwise ask the same question in concise plain text",
  )
  .replaceAll(
    "via `request_user_input`",
    "through `request_user_input` when it is available in Plan mode, otherwise through the same concise plain-text question",
  )
  .replaceAll(
    "run one `request_user_input`",
    "present one question through `request_user_input` when it is available in Plan mode, otherwise as the same concise plain-text question",
  )
  .replaceAll(
    "run a `request_user_input` interview",
    "run an interview through `request_user_input` when it is available in Plan mode, otherwise through the same concise plain-text questions",
  )
  .replaceAll(
    "use `request_user_input` to clarify",
    "use `request_user_input` when it is available in Plan mode, otherwise ask the same concise plain-text question, to clarify",
  )
  .replaceAll(
    "Use `request_user_input` before proceeding",
    "Use `request_user_input` when it is available in Plan mode, otherwise ask the same concise plain-text question, before proceeding",
  )
  .replaceAll(
    "via the `request_user_input` tool",
    "through `request_user_input` when it is available in Plan mode, otherwise through the same concise plain-text question",
  )
  .replaceAll(
    "the `request_user_input` tool itself fails",
    "an available `request_user_input` call and its plain-text fallback both fail",
  )
  .replaceAll(
    "the gate's `request_user_input` fails as a tool",
    "the gate's available `request_user_input` call and plain-text fallback both fail",
  )
  .replaceAll(
    "the Phase 8 `request_user_input` fails as a tool",
    "the Phase 8 available `request_user_input` call and plain-text fallback both fail",
  )
  .replaceAll(
    "an `request_user_input`",
    "a `request_user_input`",
  );

const convertToolLanguage = (text) => text
  .replaceAll("apply Edit calls", "apply `apply_patch` edits")
  .replaceAll("Each Edit's `old_string`", "Each patch's old text")
  .replaceAll("a single Edit", "a single patch hunk")
  .replaceAll("multiple Edit calls", "multiple patch hunks")
  .replaceAll("Apply Edits", "Apply patch hunks")
  .replaceAll("post-Edit state", "post-patch state")
  .replaceAll("Edit calls", "patch hunks")
  .replaceAll("Edit call", "patch application")
  .replaceAll("the Edit error", "the patch error")
  .replaceAll("Edits apply incrementally", "patch hunks apply incrementally")
  .replaceAll("perform no Edit calls", "apply no patch hunks")
  .replaceAll("does not call Write", "does not replace the file wholesale")
  .replaceAll("Do not call Write.", "Do not replace the file wholesale.")
  .replaceAll("Use Read once on v1, then Edit", "Inspect v1 once, then use `apply_patch`")
  .replaceAll("Use Read once on `report_path`", "Inspect `report_path` once")
  .replaceAll("subsequent updates use Edit only", "subsequent updates use `apply_patch` only")
  .replaceAll("Write-once fallback", "single whole-file-write fallback")
  .replaceAll("Edit-in-place", "`apply_patch`-in-place")
  .replaceAll("no Edit", "no patch")
  .replaceAll("applies Edits", "applies patch hunks")
  .replaceAll("Edit failure", "patch failure")
  .replaceAll("Edit-failure", "patch-failure")
  .replaceAll("one additional Read", "one additional file inspection")
  .replaceAll("Use Read, Edit,", "Use `exec_command`, `apply_patch`,")
  .replaceAll("For each finding resolved from context or by interview, Edit the report file in place", "For each finding resolved from context or by interview, use `apply_patch` to edit the report file in place")
  .replaceAll("via a second Edit", "via a second patch hunk")
  .replaceAll("anchored Edit", "anchored `apply_patch` edit")
  .replaceAll("and Edit the corresponding", "and use `apply_patch` to edit the corresponding")
  .replaceAll("in-place Edits", "in-place `apply_patch` edits")
  .replaceAll("multiple Edits", "multiple patch hunks")
  .replaceAll("Edit only the body", "Use `apply_patch` only on the body")
  .replaceAll("foreground Bash timeout", "foreground command timeout")
  .replaceAll("an offset Read", "a bounded inspection")
  .replaceAll("in Bash", "through `exec_command`")
  .replaceAll("`acceptEdits` permission mode does not enforce a per-path restriction at the platform level", "The built-in Codex agent role does not enforce a per-path write restriction")
  .replaceAll("`acceptEdits` does not enforce a per-path restriction at the platform level", "The built-in Codex agent role does not enforce a per-path write restriction")
  .replaceAll("`acceptEdits`", "the built-in Codex agent role")
  .replaceAll("The The built-in Codex", "The built-in Codex")
  .replaceAll("an patch failure", "a patch failure")
  .replaceAll("Write once", "replace the file once")
  .replaceAll("Glob, Grep", "`rg --files`, `rg`")
  .replaceAll("read-only Bash", "read-only shell commands through `exec_command`")
  .replaceAll("via Bash", "through `exec_command`");

const convertText = (text) => convertToolLanguage(convertQuestions(convertCommandsAndPaths(text)));

const walkFiles = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files;
};

assertInsideRepository(outputRoot);
if (existsSync(outputRoot)) rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

cpSync(join(repositoryRoot, "skills"), join(outputRoot, "skills"), { recursive: true });

for (const path of walkFiles(join(outputRoot, "skills"))) {
  const rel = relative(outputRoot, path).split(sep).join("/");
  // Already copied byte for byte above.
  if (verbatimFiles.includes(rel)) continue;
  let text = readFileSync(path, "utf8");
  if (path.endsWith(`${sep}SKILL.md`)) text = convertFrontmatter(text);
  text = convertText(text);
  writeFileSync(path, text, "utf8");
}

// One wording for what a follow-up covers, shared by the scope skills' replacement and
// scope-implement's and scope-code-review's references.
const followupScope = "a clarification, a gap or a correction";
// One wording for asking in Default mode, shared by scope-implement's and scope-code-review's references.
const defaultModeQuestion = "- Where `request_user_input` is unavailable (Default mode), ask through `request_user_input_async` where it is exposed, before plain text. It returns at once and the answer arrives later as a new user message; only work that depends on the answer waits for it.";
const orchestrationSentence = "Use the `Workflow` tool to run the agents where it is available; otherwise spawn subagents directly.";
const orchestrationNeutral = "Spawn the agents directly as subagents (route: direct subagents): fan out independent assignments, send load-bearing claims to adversarial verification, collect every result, and synthesise. Spawn each agent with its own `collaboration.spawn_agent` call -- a unique `task_name`, its assignment in `message`, `fork_turns: \"none\"`, and the `model` and `reasoning_effort` selected as `../detect-harness/SKILL.md` directs for its tier or explicit override, omitting any override that file says to omit -- issuing independent calls before waiting; each result arrives through the collaboration completion notification. Share findings through later assignments: a later agent's `message` carries the collected results it must build on or challenge (long records by path, per orchestration.md's `## Route`). Steer a running agent with `collaboration.send_message`, which starts no turn on an idle agent, and give an agent a follow-up on its own assignment (" + followupScope + ") with `collaboration.followup_task`; spawn fresh for independent verification, challenge or review, and whenever its model or effort must change, even within one tier, since neither continuation tool takes a `model` or `reasoning_effort`.";
for (const skill of ["scope-envelope", "scope-review"]) {
  const path = join(outputRoot, "skills", skill, "SKILL.md");
  writeFileSync(path, replaceRequired(readFileSync(path, "utf8"), orchestrationSentence, orchestrationNeutral, `${skill} orchestration-tool sentence`), "utf8");
}
// scope-implement delivers rather than analyses, so it takes its own replacement, and the Codex
// mechanics it needs live in a generated-only reference beside it (check-codex allow-lists it).
const implementOrchestration = "As the orchestrator, spawn the agents directly as subagents (route: direct subagents) and use them dynamically through design, implementation, integration and verification. Before the first spawn, read `../scope-implement/orchestration-codex.md` for this route's mechanics.";
const implementReference = [
  "# Codex orchestration",
  "",
  "Tool mechanics of this skill's direct-subagent route; what the run must secure stays in `SKILL.md`.",
  "",
  "- Spawn each agent with its own `collaboration.spawn_agent` call: a unique `task_name`, its assignment in `message`, `fork_turns: \"none\"`, and the `model` and `reasoning_effort` selected as `../detect-harness/SKILL.md` directs for its tier or explicit override, omitting any override that file says to omit. Issue independent spawns before waiting.",
  "- Steer a running agent with `collaboration.send_message`; it starts no turn on an idle agent. Give an existing agent another turn on its own assignment (" + followupScope + ") with `collaboration.followup_task`. Neither takes a `model` or `reasoning_effort`: spawn fresh whenever its model or effort must change, even within one tier, and for independent verification, challenge or review.",
  "- Results arrive as completion notifications, also while you are doing other work. `collaboration.wait_agent` returns on the next mailbox update from any agent or on its timeout, and is no barrier for all agents; do not wait for a notification already collected. `collaboration.list_agents` shows only each agent's latest result. Neither is a ledger: record each result the run relies on in `state.md` as it arrives.",
  "- Every agent works in the one shared checkout, under the parent's sandbox and approvals; this route offers no per-agent isolation and no file lock.",
  "- A command run through `exec_command` can yield before it exits: keep its handle and collect the exit status through that tool's continuation. A yield or a timed-out wait is neither a failure nor a pass, and no reason to start the command again.",
  defaultModeQuestion,
].join("\n") + "\n";
const implementDir = join(outputRoot, "skills", "scope-implement");
writeFileSync(join(implementDir, "SKILL.md"), replaceRequired(readFileSync(join(implementDir, "SKILL.md"), "utf8"), orchestrationSentence, implementOrchestration, "scope-implement orchestration-tool sentence"), "utf8");
writeFileSync(join(implementDir, "orchestration-codex.md"), implementReference, "utf8");
// scope-code-review analyses like the scope baselines, so it takes their replacement, but the
// mechanics that replacement leaves unstated live in a generated-only reference of its own
// (check-codex allow-lists it). The other scope skills' generated text stays as it was.
const codeReviewOrchestration = orchestrationNeutral + " Before the first spawn, read `../scope-code-review/orchestration-codex.md` for this route's mechanics.";
const codeReviewReference = [
  "# Codex orchestration",
  "",
  "Tool mechanics of this skill's direct-subagent route; what the run must secure stays in `SKILL.md`.",
  "",
  "- Results arrive as completion notifications, also while you are doing other work. `collaboration.wait_agent` returns on the next mailbox update from any agent or on its timeout, and is no barrier for the team; do not wait for a notification already collected. `collaboration.list_agents` shows only each agent's latest result. Neither is a record: collect each result into the run's records under `workings/{nn}-scope-code-review/` (the plan record and the per-agent records) as it arrives, before anything relies on it.",
  "- Steer a running agent with `collaboration.send_message`; it starts no turn on an idle agent. Give an existing agent another turn on its own assignment (" + followupScope + ") with `collaboration.followup_task`. Neither takes a `model` or `reasoning_effort`: spawn fresh for independent verification, challenge or review, the revision reviewer included, and whenever an agent's model or effort must change, even within one tier.",
  "- A command run through `exec_command` can yield before it exits, the battery and the shared test run among them: keep its handle and collect the exit status through that tool's continuation until it exits. A yield or a timed-out wait is neither a failure nor a pass, and no reason to run the command again. The orchestrator gives this bullet to the test-run role in its assignment.",
  defaultModeQuestion,
  "- Every agent works in the one shared checkout, under the parent's sandbox and approvals; this route offers no per-agent isolation and no file lock, so every probe that writes files takes the disposable-copy branch of the isolation rule in `SKILL.md`.",
].join("\n") + "\n";
const codeReviewDir = join(outputRoot, "skills", "scope-code-review");
writeFileSync(join(codeReviewDir, "SKILL.md"), replaceRequired(readFileSync(join(codeReviewDir, "SKILL.md"), "utf8"), orchestrationSentence, codeReviewOrchestration, "scope-code-review orchestration-tool sentence"), "utf8");
writeFileSync(join(codeReviewDir, "orchestration-codex.md"), codeReviewReference, "utf8");
for (const dir of ["scope-code-review", "scope-consultant", "scope-envelope", "scope-implement", "scope-review", "ws-create", "ws-shared"]) {
  for (const path of walkFiles(join(outputRoot, "skills", dir))) {
    if (/workflow/i.test(readFileSync(path, "utf8"))) {
      throw new Error(`Orchestration-tool wording survived conversion: ${relative(repositoryRoot, path)}`);
    }
  }
}

const interviewSkillPath = join(outputRoot, "skills", "run-interview", "SKILL.md");
let interviewSkill = readFileSync(interviewSkillPath, "utf8");
interviewSkill = replaceRequired(
  interviewSkill,
  /^description:.*$/m,
  "description: 'Presents open questions interactively through the Codex question surface; every option list includes keep-current behaviour and marks exactly one option Recommended.'",
  "run-interview description",
);
interviewSkill = replaceRequired(
  interviewSkill,
  "Every option list must follow these rules. This skill is the canonical statement of the option-list rules; they apply to every interview surface -- `request_user_input`, ad-hoc prompts in commands, skills, and subagents -- not only to flows that route through `$ace:run-interview`:",
  "Use `request_user_input` when it is exposed in Plan mode. It accepts at most three questions per call and two or three mutually exclusive options per question; put the single `(Recommended)` option first and include keep-current behaviour as one of the options. When the tool is unavailable in Default mode, ask the same question in concise plain text with the same ordered options, the same `(Recommended)` marker, and an explicit invitation for a free-form alternative. Tool availability changes presentation only, never the decision shape.\n\nEvery option list must follow these rules. This skill is the canonical statement of the option-list rules; they apply to every Codex interview surface -- `request_user_input`, its plain-text fallback, and ad-hoc prompts in skills and subagents -- not only to flows that route through `$ace:run-interview`:",
  "run-interview option-list rules pointer",
);
interviewSkill = replaceRequired(
  interviewSkill,
  "- Mark exactly one option `(recommended)`, or state explicitly that no recommendation is given.",
  "- Put the single option labelled `(Recommended)` first, or state explicitly that no recommendation is given.",
  "run-interview recommended-option ordering",
);
writeFileSync(interviewSkillPath, interviewSkill, "utf8");

const sharedInterviewPath = join(outputRoot, "skills", "ws-shared", "interview.md");
let sharedInterview = readFileSync(sharedInterviewPath, "utf8");
sharedInterview = replaceRequired(
  sharedInterview,
  "Use `request_user_input` when it is available in Plan mode; otherwise ask the same question in concise plain text to present open questions interactively.",
  "Use `request_user_input` when it is available in Plan mode; otherwise ask the same questions in concise plain text.",
  "shared interview question surface",
);
sharedInterview = replaceRequired(
  sharedInterview,
  "provide 2-4\nanswer options",
  "provide 2-3\nanswer options",
  "shared interview option count",
);
sharedInterview = replaceRequired(
  sharedInterview,
  "If there are more questions than the tool supports per call",
  "If there are more than three questions",
  "shared interview batching threshold",
);
writeFileSync(sharedInterviewPath, sharedInterview, "utf8");

const consultantPath = join(outputRoot, "skills", "agent-consultant", "SKILL.md");
let consultant = readFileSync(consultantPath, "utf8");
consultant = replaceAllRequired(
  consultant,
  "Spawn all members via the `collaboration.spawn_agent` (`agent_type: \"general-purpose\"`, per member its tier's `model` and a selected `effort`, but no `name`, since member names are report labels) in a single message so they run concurrently.",
  "Issue one `collaboration.spawn_agent` call per member with a unique run-suffixed `task_name` (the member's report label with hyphens replaced by underscores, since the runtime rejects hyphens), the member brief in `message`, `fork_turns: \"none\"`, and its tier's `model` and a selected `reasoning_effort`. Issue every call before waiting so the members run concurrently.",
  "consultant spawn pattern",
);
consultant = replaceRequired(
  consultant,
  "Spawn any researcher expected to run file-creating execution probes with `isolation: \"worktree\"`, so probe artefacts never exist in the shared tree the other members are reading.",
  "The Codex spawn surface has no per-call worktree-isolation field. A researcher that needs a file-creating probe must use a verified child directory under the operating system's temporary directory, remove only that directory after the probe, and leave the shared repository tree untouched.",
  "consultant worktree-isolation adaptation",
);
consultant = replaceRequired(
  consultant,
  "Each member's final message is returned as its `collaboration.spawn_agent` result.",
  "Each member's final message arrives through the collaboration completion notification.",
  "consultant member-result delivery",
);
writeFileSync(consultantPath, consultant, "utf8");

const detectPath = join(outputRoot, "skills", "detect-harness", "SKILL.md");
let detect = readFileSync(detectPath, "utf8");
for (const [before, after, label] of [
  [/^description:.*$/m, "description: \"Prints the Codex agent model and reasoning-effort mapping for the suite's three capability tiers, read from models.md beside this skill. Invoke before spawning tiered agents when no valid cached resolution is present; see the cache check for reuse and invalidation rules.\"", "detect-harness description"],
  [/On Claude:\n\n```\n[\s\S]*?```\n\n(?=On Codex:)/, "", "detect-harness Claude output block strip"],
  ["tier: its model and baseline effort, space-separated, applied per the consumer contract\nbelow ", "tier: a space-separated model and baseline reasoning effort, applied per the consumer\ncontract below ", "detect-harness tier-value shape"],
  ["report the settings as inherited; do not claim", "report both settings as inherited; do not claim", "detect-harness inherited-model wording"],
  ["substitutes for the reference; split it into its model\n  and baseline effort, and select the effort to pass under the effort policy below.\n  - On Claude, pass the alias, verbatim, as the `collaboration.spawn_agent`'s `model` override and the\n    selected effort as its per-call `effort` (`models.md`, `### Claude`); a fork takes\n    neither.\n  - On Codex, pass the model and the selected effort through the spawn tool's separate\n    `model` and `reasoning_effort` fields, and observe the spawn constraints in\n    `models.md` (`### Codex`) -- overrides are rejected on full-history (`\"all\"`)\n    forks, so a tiered spawn passes `fork_turns: \"none\"` with a self-contained brief.", "substitutes for the reference; split it into its model\n  and baseline reasoning effort, and select the effort to pass under the effort policy\n  below. Pass the model and selected effort through the spawn tool's separate `model`\n  and `reasoning_effort` fields, observing `models.md` (`### Codex`): tiered overrides\n  require `fork_turns: \"none\"` with a self-contained brief. Omitted or `\"all\"` forks\n  inherit both settings and reject overrides.", "detect-harness tier-value consumer note"],
  ["- Report surfaces record the resolved model and the effort requested for each\n  assignment, per the effort policy's Record rule. On Claude the effort is the per-call\n  value passed, else the spawned definition's `effort:` value, or else inherited; the\n  overrides in `models.md` can change the level that applies. When using default\n  selection, report that overrides were omitted; do not invent a model or effort or use\n  agent self-description as verification.", "- Report surfaces record the resolved model and the reasoning effort requested for\n  each assignment, per the effort policy's Record rule. When using default selection,\n  report that overrides were omitted; do not invent a model or effort or use agent\n  self-description as verification.", "detect-harness report effort note"],
  ["Match Claude Code to `### Claude` and Codex to `### Codex`.", "Match Codex to `### Codex`.", "detect-harness Claude section match strip"],
  ["Each Claude entry must provide one non-empty spawn\n   alias and one non-empty effort value; parenthesized reference IDs are not spawn\n   values. Each Codex entry", "Each entry", "detect-harness Claude entry rule strip"],
  ["\n  On Claude, pass any effort the caller specified as the per-call `effort`; otherwise\n  the spawned definition's `effort:` or the session effort applies, and is reported as\n  that value or as inherited, subject to the overrides in `models.md`.", "", "detect-harness --model Claude effort note strip"],
]) {
  detect = replaceRequired(detect, before, after, label);
}
writeFileSync(detectPath, detect, "utf8");

const modelsPath = join(outputRoot, "skills", "detect-harness", "models.md");
let models = readFileSync(modelsPath, "utf8");
// The strip below removes everything from `### Claude` to `### Codex`; a section inserted
// between them would vanish silently, so refuse any further heading inside that span.
const claudeBlock = models.match(/\n### Claude\n([\s\S]*?)(?=\n### Codex\n)/);
if (claudeBlock && /^#{1,3} /m.test(claudeBlock[1])) {
  throw new Error("Expected `### Claude` to sit directly before `### Codex`, with no heading between them (models Claude tier block strip).");
}
for (const [before, after, label] of [
  ["Data file for `$ace:detect-harness` (`../detect-harness/SKILL.md`),", "Data file for `$ace:detect-harness` (`SKILL.md`),", "models data-file self reference"],
  ["\nOn each harness a tier maps to a model and a baseline effort: on Claude a model alias and an\neffort level, on Codex a model and a reasoning effort.", " Each\ntier maps to a model and a baseline reasoning effort.", "models per-harness tier preamble"],
  [/\n### Claude\n[\s\S]*?(?=\n### Codex\n)/, "", "models Claude tier block strip"],
]) {
  models = replaceRequired(models, before, after, label);
}
writeFileSync(modelsPath, models, "utf8");

// Every file held equal must reach the edition equal to its source. Line endings aside: the
// conversion normalises CRLF, so on an LF checkout this is byte equality.
const sameText = (a, b) => a.replace(/\r\n/g, "\n") === b.replace(/\r\n/g, "\n");
// The lines after the one line equal to `heading`, up to the next line starting `## `.
const sectionOf = (text, heading) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const starts = lines.flatMap((line, index) => (line === heading ? [index] : []));
  if (starts.length !== 1) throw new Error(`Expected exactly one ${heading} heading, found ${starts.length}.`);
  const rest = lines.slice(starts[0] + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
};
const heldDiffers = (label) => new Error(`Codex edition differs from its source in a file held equal to it: ${label}`);
for (const rel of [...verbatimFiles, ...invariantFiles]) {
  const source = join(repositoryRoot, ...rel.split("/"));
  if (!existsSync(source)) throw new Error(`Held-equal source missing: ${rel}`);
  if (!sameText(readFileSync(source, "utf8"), readFileSync(join(outputRoot, ...rel.split("/")), "utf8"))) throw heldDiffers(rel);
}
for (const [rel, heading] of invariantSections) {
  const source = readFileSync(join(repositoryRoot, ...rel.split("/")), "utf8");
  const edition = readFileSync(join(outputRoot, ...rel.split("/")), "utf8");
  if (sectionOf(source, heading) !== sectionOf(edition, heading)) throw heldDiffers(`${rel} ${heading}`);
}

const generatedFiles = walkFiles(outputRoot).length;
console.log(`Generated ${generatedFiles} Codex edition files under ${outputRoot}.`);
