import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputRoot = resolve(repositoryRoot, "codex");

const assertInsideRepository = (candidate) => {
  const rel = relative(repositoryRoot, candidate);
  if (!rel || rel.startsWith(`..${sep}`) || rel === "..") {
    throw new Error(`Refusing to replace unsafe output path: ${candidate}`);
  }
};

const replaceRequired = (text, before, after, label) => {
  if (!text.includes(before)) {
    throw new Error(`Expected conversion source was not found (${label}).`);
  }
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

const convertCommandsAndPaths = (text) => {
  let converted = text.replace(/\r\n/g, "\n").replace(
    /(?<![A-Za-z0-9_.${}-])\/ace-([a-z0-9]+(?:-[a-z0-9]+)*)/g,
    (_match, name) => `$ace:ace-${name}`,
  );

  converted = converted
    .replaceAll("$ace:ace-agent-pre-planner-plus-plan", "$ace:ace-agent-pre-planner plus plan")
    .replaceAll("${CLAUDE_PLUGIN_ROOT}/skills/", "../")
    .replaceAll("${CLAUDE_PLUGIN_ROOT}/agents/", "../../agents/")
    .replaceAll("${CLAUDE_PLUGIN_ROOT}/rules/", "../../rules/")
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

const convertPayload = (text) => {
  const withoutFrontmatter = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  if (withoutFrontmatter === text) {
    throw new Error("Agent payload has no Claude frontmatter to remove.");
  }
  return convertText(withoutFrontmatter)
    .replaceAll("../ace-", "../skills/ace-")
    .replaceAll("../agent-shared/", "../skills/agent-shared/")
    .replaceAll("../plan-shared/", "../skills/plan-shared/")
    .replaceAll("../../rules/", "../rules/");
};

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
cpSync(join(repositoryRoot, "rules"), join(outputRoot, "rules"), { recursive: true });
cpSync(join(repositoryRoot, "agents"), join(outputRoot, "agents"), { recursive: true });

for (const path of walkFiles(join(outputRoot, "skills"))) {
  let text = readFileSync(path, "utf8");
  if (path.endsWith(`${sep}SKILL.md`)) text = convertFrontmatter(text);
  text = convertText(text);
  writeFileSync(path, text, "utf8");
}

for (const path of walkFiles(join(outputRoot, "rules"))) {
  const text = convertText(readFileSync(path, "utf8"));
  writeFileSync(path, text, "utf8");
}

for (const path of walkFiles(join(outputRoot, "agents"))) {
  const text = convertPayload(readFileSync(path, "utf8"));
  writeFileSync(path, text, "utf8");
}

const principlesPath = join(outputRoot, "rules", "principles.md");
let principles = readFileSync(principlesPath, "utf8");
principles = replaceRequired(
  principles,
  "## Presenting design options\n",
  `## Codex interview surface\n+\n+Use \`request_user_input\` when it is exposed in Plan mode. It accepts at most three questions per\n+call and two or three mutually exclusive options per question; put the single \`(Recommended)\`\n+option first and include keep-current behaviour as one of the options. When the tool is unavailable\n+in Default mode, ask the same question in concise plain text with the same ordered options, the same\n+\`(Recommended)\` marker, and an explicit invitation for a free-form alternative. Tool availability\n+changes presentation only, never the decision shape.\n+\n+## Presenting design options\n`,
  "principles Codex interview section",
);
principles = principles
  .replaceAll("\n+", "\n")
  .replaceAll("`(recommended)`", "`(Recommended)`")
  .replaceAll("exactly one option `(recommended)`", "exactly one option `(Recommended)`")
  .replaceAll("request_user_input`, the `ace-run-interview` skill", "Codex interview surface, the `ace-run-interview` skill")
  .replace(
    /^These rules apply to every interview surface .*$/m,
    "These rules apply to every Codex interview surface -- `request_user_input`, its plain-text fallback, the `ace-run-interview` skill, and ad-hoc prompts in skills and subagents -- not only to flows that route through `$ace:ace-run-interview`.",
  );
writeFileSync(principlesPath, principles, "utf8");

const environmentPath = join(outputRoot, "rules", "environment.md");
let environment = readFileSync(environmentPath, "utf8");
environment = replaceRequired(
  environment,
  "# Environment\n",
  `# Environment\n+\n+## Codex tool mechanics\n+\n+- Inspect files and run shell commands through \`exec_command\`; prefer \`rg\` and \`rg --files\` for\n+  text and file discovery.\n+- Apply targeted file edits with \`apply_patch\`. Bulk deterministic generation may use the script\n+  or formatter that owns the generated output.\n+- Spawn subagents through \`collaboration.spawn_agent\`. When model and reasoning overrides are\n+  supplied, pass \`fork_turns: "none"\` or a positive turn count; full-history forks reject overrides.\n+- Collect subagent completion through notifications or \`wait_agent\`; do not poll on a timer.\n+\n+Claude tool names do not apply in this Codex edition. References to host \`.claude/**\` paths are\n+inspection targets in a repository being reviewed, not Codex discovery paths.\n`,
  "environment Codex mechanics section",
);
environment = environment.replaceAll("\n+", "\n");
writeFileSync(environmentPath, environment, "utf8");

const interviewSkillPath = join(outputRoot, "skills", "ace-run-interview", "SKILL.md");
let interviewSkill = readFileSync(interviewSkillPath, "utf8");
interviewSkill = interviewSkill
  .replace(
    /^description:.*$/m,
    "description: 'Presents open questions interactively through the Codex question surface; every option list includes keep-current behaviour and marks exactly one option Recommended.'",
  )
  .replace(
    "Present open questions to the user interactively via the `request_user_input` tool.",
    "Present open questions through `request_user_input` when it is available in Plan mode; in Default mode, ask the same questions in concise plain text.",
  )
  .replace(
    "Every option list must follow the format rules in `../../rules/principles.md` under \"Presenting design options\":",
    "Every option list must follow `../../rules/principles.md` under \"Codex interview surface\" and \"Presenting design options\":",
  )
  .replace(
    "- Mark exactly one option `(recommended)`, or state explicitly that no recommendation is given.",
    "- Put the single option labelled `(Recommended)` first, or state explicitly that no recommendation is given.",
  );
writeFileSync(interviewSkillPath, interviewSkill, "utf8");

const sharedInterviewPath = join(outputRoot, "skills", "agent-shared", "interview.md");
let sharedInterview = readFileSync(sharedInterviewPath, "utf8");
sharedInterview = sharedInterview
  .replace(
    "Use `request_user_input` when it is available in Plan mode; otherwise ask the same question in concise plain text to present open questions interactively.",
    "Use `request_user_input` when it is available in Plan mode; otherwise ask the same questions in concise plain text.",
  )
  .replace("provide 2-4\nanswer options", "provide 2-3\nanswer options")
  .replace("If there are more questions than the tool supports per call", "If there are more than three questions")
  .replace(
    "If the `request_user_input` tool itself fails",
    "If an available `request_user_input` call itself fails, fall back to the same plain-text question. If that fallback also fails",
  );
writeFileSync(sharedInterviewPath, sharedInterview, "utf8");

const skillPackageReviewPath = join(outputRoot, "skills", "ace-agent-code-review", "references", "skill-package-review.md");
let skillPackageReview = readFileSync(skillPackageReviewPath, "utf8");
skillPackageReview = skillPackageReview
  .replace(
    "Paths written `${CLAUDE_PLUGIN_ROOT}/...` are suite-internal and always\nresolve.",
    "Paths written relative to the active skill (`../...` or `../../...`) are suite-internal and always\nresolve.",
  )
  .replace(
    "a chained skill set `disable-model-invocation: true`",
    "a chained Claude skill set with the Claude-only `disable-model-invocation: true`, or a chained Codex skill set with `policy.allow_implicit_invocation: false`",
  );
writeFileSync(skillPackageReviewPath, skillPackageReview, "utf8");

const budgetOverflowPath = join(outputRoot, "skills", "ace-agent-code-review", "references", "budget-overflow.md");
let budgetOverflow = readFileSync(budgetOverflowPath, "utf8");
budgetOverflow = budgetOverflow.replace(
  /## Options\n[\s\S]*?(?=\n## Outcomes)/,
  `## Options\n\nUse \`request_user_input\` when it is available in Plan mode, otherwise ask the same concise\nplain-text questions. Present the line count in both paths. The structured surface permits at most\nthree options, so use two stages rather than dropping a behaviour:\n\n1. First ask how to handle the over-budget review:\n   - Narrow the scope and stop this run.\n   - Continue with full files over budget (keep current behaviour).\n   - Continue with a bounded review.\n2. Only after \"bounded review\", ask which bounded shape to use:\n   - Continue with diff only (the diff plus the commit log, skipping full file reads) --\n     diff-based sources only, and only when diff + commit-log lines fit within budget; the\n     \`commit\` and \`directory\` packages do not offer this option.\n   - Continue with the first 30,000 lines (truncated review).\n   - Return to full files over budget (keep current behaviour).\n\nPut exactly one \`(Recommended)\` option first in each presented list, chosen against the counted\noverage and source shape, per \`../../rules/principles.md\`. In the plain-text fallback, preserve\nthe same option order and marker and invite a free-form alternative.\n\nInclude source-specific advice: for directory sources, suggest narrowing the directory\npath; for commit sources, suggest reviewing a smaller commit; for diff sources, suggest\nisolating generated files in a separate commit or reviewing a single commit.\n`,
);
writeFileSync(budgetOverflowPath, budgetOverflow, "utf8");

const teamMechanicsPath = join(outputRoot, "skills", "agent-shared", "team-mechanics.md");
let teamMechanics = readFileSync(teamMechanicsPath, "utf8");
teamMechanics = replaceRequired(
  teamMechanics,
  "Spawn all members via the `collaboration.spawn_agent` (`agent_type: \"general-purpose\"`, per-member\n`model` as assigned) in a single message so they run concurrently.",
  "Issue one `collaboration.spawn_agent` call per member with a unique run-suffixed `task_name`, the member brief in `message`, `agent_type: \"default\"`, `fork_turns: \"none\"`, and the resolved per-member `model` and `reasoning_effort`. Issue every call before waiting so the members run concurrently.",
  "shared team spawn pattern",
);
writeFileSync(teamMechanicsPath, teamMechanics, "utf8");

const consultantPath = join(outputRoot, "skills", "ace-agent-consultant", "SKILL.md");
let consultant = readFileSync(consultantPath, "utf8");
consultant = replaceRequired(
  consultant,
  "Spawn all members via the `collaboration.spawn_agent` (`agent_type: \"general-purpose\"`, per-member `model` as assigned) in a single message so they run concurrently.",
  "Issue one `collaboration.spawn_agent` call per member with a unique run-suffixed `task_name`, the member brief in `message`, `agent_type: \"default\"`, `fork_turns: \"none\"`, and the resolved per-member `model` and `reasoning_effort`. Issue every call before waiting so the members run concurrently.",
  "consultant spawn pattern",
);
consultant = consultant
  .replace(
    "Spawn any researcher expected to run file-creating execution probes with `isolation: \"worktree\"`, so probe artefacts never exist in the shared tree the other members are reading.",
    "The Codex spawn surface has no per-call worktree-isolation field. A researcher that needs a file-creating probe must use a verified child directory under the operating system's temporary directory, remove only that directory after the probe, and leave the shared repository tree untouched.",
  )
  .replace(
    "Each member's final message is returned as its `collaboration.spawn_agent` result.",
    "Each member's final message arrives through the collaboration completion notification.",
  );
writeFileSync(consultantPath, consultant, "utf8");

const planStartPath = join(outputRoot, "skills", "ace-plan-start", "SKILL.md");
let planStart = readFileSync(planStartPath, "utf8");
planStart = planStart
  .replace("Runs outside Claude Code's plan mode.", "Runs in either Codex collaboration mode and does not depend on Plan mode.")
  .replace("The `ace-plan-drafter` subagent receives Read, `rg --files`, `rg`, Bash, and Write — the set declared in its `tools:` frontmatter (Bash is constrained to read-only use by the agent prompt).", "The `ace-plan-drafter` supporting payload uses `exec_command`, `rg --files`, `rg`, and `apply_patch`, and is passed through `collaboration.spawn_agent.message`.")
  .replace("Spawn a single subagent via `collaboration.spawn_agent`:\n- `agent_type`: `ace:ace-plan-drafter`", "Read `../../agents/ace-plan-drafter.md` in full, then spawn one subagent through `collaboration.spawn_agent`:\n- `task_name`: `ace_plan_drafter_{8hex}`\n- `agent_type`: `\"default\"`\n- `fork_turns`: `\"none\"`\n- `message`: the complete payload file followed by the run-specific brief and target-path inputs")
  .replace("Spawn a fresh subagent via `collaboration.spawn_agent` to validate the draft plan against the codebase:\n\n- `agent_type`: `ace:ace-plan-validate`", "Read `../../agents/ace-plan-validate.md` in full, then spawn a fresh validation subagent through `collaboration.spawn_agent`:\n\n- `task_name`: `ace_plan_validate_{8hex}`\n- `agent_type`: `\"default\"`\n- `fork_turns`: `\"none\"`\n- `message`: the complete payload file followed by the draft path, report target path, and exploratory-read cap")
  .replace("- Otherwise, spawn the `ace-plan-revisor` subagent via `collaboration.spawn_agent`:\n\n  - `agent_type`: `ace:ace-plan-revisor`", "- Otherwise, read `../../agents/ace-plan-revisor.md` in full and spawn the revisor through `collaboration.spawn_agent`:\n\n  - `task_name`: `ace_plan_revisor_{8hex}`\n  - `agent_type`: `\"default\"`\n  - `fork_turns`: `\"none\"`\n  - `message`: the complete payload file followed by the v1 path, report path, and parsed findings")
  .replace("- `model`: value from Phase 1 (default `{Tier-2}`)", "- `model` and `reasoning_effort`: the pair resolved from Phase 1 (default `{Tier-2}`)")
  .replace("- `model`: **always** `{Tier-3}`.", "- `model` and `reasoning_effort`: **always** the `{Tier-3}` pair.")
  .replace("  - `model`: `{Tier-3}`", "  - `model` and `reasoning_effort`: the `{Tier-3}` pair")
  .replace("a bounded codebase look-up (Read/Glob/Grep)", "a bounded codebase look-up through `exec_command` and `rg`")
  .replace("applies patch hunks", "applies `apply_patch` hunks");
planStart = planStart.replace(
  /- Do not invoke `EnterPlanMode` or `ExitPlanMode`[^\n]*/,
  "- Do not require or attempt to change Codex collaboration mode. Run in the current mode and use the documented plain-text question fallback when `request_user_input` is unavailable.",
);
writeFileSync(planStartPath, planStart, "utf8");

const planValidatePath = join(outputRoot, "skills", "ace-plan-validate", "SKILL.md");
let planValidate = readFileSync(planValidatePath, "utf8");
planValidate = replaceRequired(
  planValidate,
  "Spawn the `ace-plan-validate` subagent via `collaboration.spawn_agent` with `agent_type: ace:ace-plan-validate` and `model: {Tier-3}`",
  "Read `../../agents/ace-plan-validate.md` in full, then spawn a validation subagent through `collaboration.spawn_agent` with a run-suffixed `task_name`, `agent_type: \"default\"`, `fork_turns: \"none\"`, `message` set to the complete payload followed by the run inputs, and the Tier-3 `model` plus `reasoning_effort`",
  "standalone validator spawn pattern",
);
planValidate = planValidate.replace("the agent file's frontmatter `model:` is the fallback for direct invocation", "the parent session's default model is the fallback when tier resolution is unavailable");
planValidate = planValidate.replace("and Write the conversation-held plan text", "and use `apply_patch` to write the conversation-held plan text");
writeFileSync(planValidatePath, planValidate, "utf8");

const planUpdatePath = join(outputRoot, "skills", "ace-plan-update", "SKILL.md");
let planUpdate = readFileSync(planUpdatePath, "utf8");
planUpdate = planUpdate
  .replace("Write the body directly through `exec_command` redirection", "Write the body directly with `apply_patch`")
  .replace("and Write the revised plan", "and use `apply_patch` to write the revised plan");
writeFileSync(planUpdatePath, planUpdate, "utf8");

const issueRoutePath = join(outputRoot, "skills", "ace-plan-start", "references", "issue-route.md");
let issueRoute = readFileSync(issueRoutePath, "utf8");
issueRoute = issueRoute.replace(
  "Write the body field verbatim to",
  "Use `apply_patch` to write the body field verbatim to",
).replace(
  ", POSIX path form for the redirection per `../../rules/environment.md`",
  "",
);
writeFileSync(issueRoutePath, issueRoute, "utf8");

const detectPath = join(outputRoot, "skills", "ace-detect-harness", "SKILL.md");
let detect = readFileSync(detectPath, "utf8");
detect = detect
  .replace(
    /^description:.*$/m,
    "description: \"Prints the Codex agent model and reasoning-effort mapping for the suite's three capability tiers, read from models.md beside this skill. Invoke before spawning tiered agents when no cached Harness: block is present.\"",
  )
  .replace("(Claude Code or Codex CLI)", "(Codex CLI)")
  .replace("On Claude:\n\n```\nHarness: claude  (ace-detect-harness, session cache)\nTier-1: fable\nTier-2: opus\nTier-3: sonnet\n```\n\n", "")
  .replace("on Claude a model alias passed verbatim; on Codex a space-separated model and\neffort", "a space-separated model and effort")
  .replace("On Claude it is a single\n  model alias, passed verbatim as the `collaboration.spawn_agent`'s `model` override. On Codex it is a\n  space-separated pair", "It is a space-separated pair");
writeFileSync(detectPath, detect, "utf8");

const modelsPath = join(outputRoot, "skills", "ace-detect-harness", "models.md");
let models = readFileSync(modelsPath, "utf8");
models = models
  .replace("Data file for `$ace:ace-detect-harness` (`../ace-detect-harness/SKILL.md`).", "Data file for `$ace:ace-detect-harness` (`SKILL.md`).")
  .replace("Each tier\ncarries, per harness, the settings a consumer resolves at spawn time -- on Claude a\nmodel alias, on Codex two separately passed values: model and reasoning effort.", "Each tier carries the two settings a Codex consumer resolves at spawn time: model and reasoning effort.")
  .replace(/\n### Claude\n[\s\S]*?(?=\n### Codex\n)/, "\n")
  .replace("### Codex", "### Codex spawn settings")
  .replaceAll("the spawn tool's separate", "`collaboration.spawn_agent`'s separate")
  .replace("Tier-1 is defined above as the\n  default-strength frontier model -- the peer of Claude's `fable`, which is the frontier\n  model at default strength, not a maximum-cost configuration. `ultra`, the top of the\n  `gpt-5.6-sol` reasoning ladder, would redefine Tier-1 as \"absolute strongest\n  regardless of cost\".", "Tier-1 is the default-strength frontier tier, not a maximum-cost configuration. `ultra`, the top of the `gpt-5.6-sol` reasoning ladder, would redefine it as absolute strongest regardless of cost.")
  .replace(/\n- \*\*No `\[1m\]` context-window variants\.\*\*[\s\S]*$/, "\n")
  .replace("the `collaboration.spawn_agent`'s `model` override accepts", "the `collaboration.spawn_agent` `model` field accepts");
writeFileSync(modelsPath, models, "utf8");

for (const payloadName of ["ace-plan-drafter.md", "ace-plan-revisor.md", "ace-plan-validate.md"]) {
  const path = join(outputRoot, "agents", payloadName);
  let payload = readFileSync(path, "utf8");
  payload = `<!-- Supporting payload for collaboration.spawn_agent.message; not a discoverable custom-agent definition. -->\n\n${payload}`;
  payload = payload
    .replace("using Read, Glob, Grep, and read-only Bash", "through `exec_command`, using `rg --files`, `rg`, and read-only shell commands")
    .replace("read or globbed", "inspected or matched with `rg --files`")
    .replace("Use Read once on v1, then Edit", "Inspect v1 once, then use `apply_patch`")
    .replace("Use Read, Edit, Glob, Grep, and read-only Bash", "Use `exec_command`, `rg`, and `apply_patch`")
    .replace("Use Read, Glob, Grep, and read-only Bash", "Use `exec_command` and `rg`")
    .replace("via the Write tool", "with `apply_patch`");
  writeFileSync(path, payload, "utf8");
}

const generatedFiles = walkFiles(outputRoot).length;
console.log(`Generated ${generatedFiles} Codex edition files under ${outputRoot}.`);
