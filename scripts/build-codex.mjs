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
const readSkillInventory = (skillsRoot) => {
  const names = readdirSync(skillsRoot)
    .filter((entry) => existsSync(join(skillsRoot, entry, "SKILL.md")))
    .sort();
  if (!names.length) throw new Error("No skills discovered under skills/.");
  const prefixed = names.filter((name) => name.startsWith("ace-"));
  if (prefixed.length) {
    throw new Error(`Skill names must not repeat the plugin namespace: ${prefixed.join(", ")}`);
  }
  return names;
};

const skillInventory = readSkillInventory(join(repositoryRoot, "skills"));

const convertCommandsAndPaths = (text) => {
  // Claude invokes a plugin skill as `/ace:{skill}`; Codex mentions the same skill as
  // `$ace:{skill}`. Only the sigil differs, so the conversion is structural -- it never needs
  // to know an inner skill name.
  let converted = text.replace(/\r\n/g, "\n").replaceAll("/ace:", "$ace:");

  converted = converted
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
  let converted = convertText(withoutFrontmatter);

  // A payload sits at codex/agents/*.md while skill packages sit at codex/skills/{name}/, so a
  // payload's skill reference gains a `skills/` segment. Drive this from the discovered
  // inventory (plus the two shared directories, which own no SKILL.md) rather than a blind
  // `../{name}/` rule: `../../rules/` contains `../rules/` at offset 3, so a generalised rule
  // over an inventory that included `rules` would rewrite the payload's own rules path.
  for (const name of [...skillInventory, "agent-shared", "plan-shared"]) {
    converted = converted.replace(new RegExp(String.raw`(?<!\.\./)\.\./${name}/`, "g"), `../skills/${name}/`);
  }
  converted = converted.replaceAll("../../rules/", "../rules/");

  if (converted.includes("../skills/rules/") || converted.includes("../../skills/")) {
    throw new Error("Agent payload path rewrite corrupted a suite-relative reference.");
  }
  return converted;
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
principles = replaceAllRequired(
  principles,
  "## Presenting design options\n",
  `## Codex interview surface\n+\n+Use \`request_user_input\` when it is exposed in Plan mode. It accepts at most three questions per\n+call and two or three mutually exclusive options per question; put the single \`(Recommended)\`\n+option first and include keep-current behaviour as one of the options. When the tool is unavailable\n+in Default mode, ask the same question in concise plain text with the same ordered options, the same\n+\`(Recommended)\` marker, and an explicit invitation for a free-form alternative. Tool availability\n+changes presentation only, never the decision shape.\n+\n+## Presenting design options\n`,
  "principles Codex interview section",
);
principles = replaceAllRequired(principles, "\n+", "\n", "principles injected-block de-escape");
principles = replaceAllRequired(
  principles,
  "`(recommended)`",
  "`(Recommended)`",
  "principles recommendation-marker casing",
);
principles = replaceAllRequired(
  principles,
  "request_user_input`, the `run-interview` skill",
  "Codex interview surface, the `run-interview` skill",
  "principles interview-surface skill mention",
);
principles = replaceRequired(
  principles,
  /^These rules apply to every interview surface .*$/m,
  "These rules apply to every Codex interview surface -- `request_user_input`, its plain-text fallback, the `run-interview` skill, and ad-hoc prompts in skills and subagents -- not only to flows that route through `$ace:run-interview`.",
  "principles interview-surface scope sentence",
);
writeFileSync(principlesPath, principles, "utf8");

const environmentPath = join(outputRoot, "rules", "environment.md");
let environment = readFileSync(environmentPath, "utf8");
environment = replaceAllRequired(
  environment,
  "# Environment\n",
  `# Environment\n+\n+## Codex tool mechanics\n+\n+- Inspect files and run shell commands through \`exec_command\`; prefer \`rg\` and \`rg --files\` for\n+  text and file discovery.\n+- Apply targeted file edits with \`apply_patch\`. Bulk deterministic generation may use the script\n+  or formatter that owns the generated output.\n+- Spawn subagents through \`collaboration.spawn_agent\`. When model and reasoning overrides are\n+  supplied, pass \`fork_turns: "none"\` or a positive turn count; full-history forks reject overrides.\n+- Collect subagent completion through notifications or \`wait_agent\`; do not poll on a timer.\n+\n+Claude tool names do not apply in this Codex edition. References to host \`.claude/**\` paths are\n+inspection targets in a repository being reviewed, not Codex discovery paths.\n`,
  "environment Codex mechanics section",
);
environment = replaceAllRequired(environment, "\n+", "\n", "environment injected-block de-escape");
writeFileSync(environmentPath, environment, "utf8");

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
  "Every option list must follow the format rules in `../../rules/principles.md` under \"Presenting design options\":",
  "Every option list must follow `../../rules/principles.md` under \"Codex interview surface\" and \"Presenting design options\":",
  "run-interview option-list rules pointer",
);
interviewSkill = replaceRequired(
  interviewSkill,
  "- Mark exactly one option `(recommended)`, or state explicitly that no recommendation is given.",
  "- Put the single option labelled `(Recommended)` first, or state explicitly that no recommendation is given.",
  "run-interview recommended-option ordering",
);
writeFileSync(interviewSkillPath, interviewSkill, "utf8");

const sharedInterviewPath = join(outputRoot, "skills", "agent-shared", "interview.md");
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

const skillPackageReviewPath = join(outputRoot, "skills", "agent-code-review", "references", "skill-package-review.md");
let skillPackageReview = readFileSync(skillPackageReviewPath, "utf8");
skillPackageReview = replaceRequired(
  skillPackageReview,
  "Paths written `${CLAUDE_PLUGIN_ROOT}/...` are suite-internal and always\nresolve.",
  "Paths written relative to the active skill (`../...` or `../../...`) are suite-internal and always\nresolve.",
  "skill-package review suite-internal path form",
);
writeFileSync(skillPackageReviewPath, skillPackageReview, "utf8");

const budgetOverflowPath = join(outputRoot, "skills", "agent-code-review", "references", "budget-overflow.md");
let budgetOverflow = readFileSync(budgetOverflowPath, "utf8");
budgetOverflow = replaceRequired(
  budgetOverflow,
  /## Options\n[\s\S]*?(?=\n## Outcomes)/,
  `## Options\n\nUse \`request_user_input\` when it is available in Plan mode, otherwise ask the same concise\nplain-text questions. Present the line count in both paths. The structured surface permits at most\nthree options, so use two stages rather than dropping a behaviour:\n\n1. First ask how to handle the over-budget review:\n   - Narrow the scope and stop this run.\n   - Continue with full files over budget (keep current behaviour).\n   - Continue with a bounded review.\n2. Only after \"bounded review\", ask which bounded shape to use:\n   - Continue with diff only (the diff plus the commit log, skipping full file reads) --\n     diff-based sources only, and only when diff + commit-log lines fit within budget; the\n     \`commit\` and \`directory\` packages do not offer this option.\n   - Continue with the first 30,000 lines (truncated review).\n   - Return to full files over budget (keep current behaviour).\n\nPut exactly one \`(Recommended)\` option first in each presented list, chosen against the counted\noverage and source shape, per \`../../rules/principles.md\`. In the plain-text fallback, preserve\nthe same option order and marker and invite a free-form alternative.\n\nInclude source-specific advice: for directory sources, suggest narrowing the directory\npath; for commit sources, suggest reviewing a smaller commit; for diff sources, suggest\nisolating generated files in a separate commit or reviewing a single commit.\n`,
  "budget-overflow options block",
);
writeFileSync(budgetOverflowPath, budgetOverflow, "utf8");

const teamMechanicsPath = join(outputRoot, "skills", "agent-shared", "team-mechanics.md");
let teamMechanics = readFileSync(teamMechanicsPath, "utf8");
teamMechanics = replaceAllRequired(
  teamMechanics,
  "Spawn all members via the `collaboration.spawn_agent` (`agent_type: \"general-purpose\"`, per-member\n`model` as assigned) in a single message so they run concurrently.",
  "Issue one `collaboration.spawn_agent` call per member with a unique run-suffixed `task_name`, the member brief in `message`, `agent_type: \"default\"`, `fork_turns: \"none\"`, and the resolved per-member `model` and `reasoning_effort`. Issue every call before waiting so the members run concurrently.",
  "shared team spawn pattern",
);
writeFileSync(teamMechanicsPath, teamMechanics, "utf8");

const consultantPath = join(outputRoot, "skills", "agent-consultant", "SKILL.md");
let consultant = readFileSync(consultantPath, "utf8");
consultant = replaceAllRequired(
  consultant,
  "Spawn all members via the `collaboration.spawn_agent` (`agent_type: \"general-purpose\"`, per-member `model` as assigned) in a single message so they run concurrently.",
  "Issue one `collaboration.spawn_agent` call per member with a unique run-suffixed `task_name`, the member brief in `message`, `agent_type: \"default\"`, `fork_turns: \"none\"`, and the resolved per-member `model` and `reasoning_effort`. Issue every call before waiting so the members run concurrently.",
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

const planStartPath = join(outputRoot, "skills", "plan-start", "SKILL.md");
let planStart = readFileSync(planStartPath, "utf8");
for (const [before, after, label] of [
  ["Runs outside Claude Code's plan mode.", "Runs in either Codex collaboration mode and does not depend on Plan mode.", "plan-start plan-mode note"],
  ["The `plan-drafter` subagent receives Read, `rg --files`, `rg`, Bash, and Write — the set declared in its `tools:` frontmatter (Bash is constrained to read-only use by the agent prompt).", "The `plan-drafter` supporting payload uses `exec_command`, `rg --files`, `rg`, and `apply_patch`, and is passed through `collaboration.spawn_agent.message`.", "plan-start drafter tool set"],
  ["Spawn a single subagent via `collaboration.spawn_agent`:\n- `agent_type`: `ace:plan-drafter`", "Read `../../agents/plan-drafter.md` in full, then spawn one subagent through `collaboration.spawn_agent`:\n- `task_name`: `ace_plan_drafter_{8hex}`\n- `agent_type`: `\"default\"`\n- `fork_turns`: `\"none\"`\n- `message`: the complete payload file followed by the run-specific brief and target-path inputs", "plan-start drafter spawn block"],
  ["Spawn a fresh subagent via `collaboration.spawn_agent` to validate the draft plan against the codebase:\n\n- `agent_type`: `ace:plan-validate`", "Read `../../agents/plan-validate.md` in full, then spawn a fresh validation subagent through `collaboration.spawn_agent`:\n\n- `task_name`: `ace_plan_validate_{8hex}`\n- `agent_type`: `\"default\"`\n- `fork_turns`: `\"none\"`\n- `message`: the complete payload file followed by the draft path, report target path, and exploratory-read cap", "plan-start validator spawn block"],
  ["- Otherwise, spawn the `plan-revisor` subagent via `collaboration.spawn_agent`:\n\n  - `agent_type`: `ace:plan-revisor`", "- Otherwise, read `../../agents/plan-revisor.md` in full and spawn the revisor through `collaboration.spawn_agent`:\n\n  - `task_name`: `ace_plan_revisor_{8hex}`\n  - `agent_type`: `\"default\"`\n  - `fork_turns`: `\"none\"`\n  - `message`: the complete payload file followed by the v1 path, report path, and parsed findings", "plan-start revisor spawn block"],
  ["- `model`: value from Phase 1 (default `{Tier-2}`)", "- `model` and `reasoning_effort`: the pair resolved from Phase 1 (default `{Tier-2}`)", "plan-start drafter model pair"],
  ["- `model`: **always** `{Tier-3}`.", "- `model` and `reasoning_effort`: **always** the `{Tier-3}` pair.", "plan-start validator model pair"],
  ["  - `model`: `{Tier-3}`", "  - `model` and `reasoning_effort`: the `{Tier-3}` pair", "plan-start revisor model pair"],
  ["applies patch hunks", "applies `apply_patch` hunks", "plan-start patch-hunk phrasing"],
  [/- Do not invoke `EnterPlanMode` or `ExitPlanMode`[^\n]*/, "- Do not require or attempt to change Codex collaboration mode. Run in the current mode and use the documented plain-text question fallback when `request_user_input` is unavailable.", "plan-start plan-mode tool ban"],
]) {
  planStart = replaceRequired(planStart, before, after, label);
}
writeFileSync(planStartPath, planStart, "utf8");

const planValidatePath = join(outputRoot, "skills", "plan-validate", "SKILL.md");
let planValidate = readFileSync(planValidatePath, "utf8");
planValidate = replaceRequired(
  planValidate,
  "Spawn the `plan-validate` subagent via `collaboration.spawn_agent` with `agent_type: ace:plan-validate` and `model: {Tier-3}`",
  "Read `../../agents/plan-validate.md` in full, then spawn a validation subagent through `collaboration.spawn_agent` with a run-suffixed `task_name`, `agent_type: \"default\"`, `fork_turns: \"none\"`, `message` set to the complete payload followed by the run inputs, and the Tier-3 `model` plus `reasoning_effort`",
  "standalone validator spawn pattern",
);
planValidate = replaceRequired(
  planValidate,
  "the agent file's frontmatter `model:` is the fallback for direct invocation",
  "the parent session's default model is the fallback when tier resolution is unavailable",
  "plan-validate model fallback",
);
planValidate = replaceRequired(
  planValidate,
  "and Write the conversation-held plan text",
  "and use `apply_patch` to write the conversation-held plan text",
  "plan-validate conversation-held staging",
);
writeFileSync(planValidatePath, planValidate, "utf8");

const planUpdatePath = join(outputRoot, "skills", "plan-update", "SKILL.md");
let planUpdate = readFileSync(planUpdatePath, "utf8");
planUpdate = replaceRequired(
  planUpdate,
  "Write the body directly through `exec_command` redirection",
  "Write the body directly with `apply_patch`",
  "plan-update direct body write",
);
planUpdate = replaceRequired(
  planUpdate,
  "and Write the revised plan",
  "and use `apply_patch` to write the revised plan",
  "plan-update revised-plan write",
);
writeFileSync(planUpdatePath, planUpdate, "utf8");

const issueRoutePath = join(outputRoot, "skills", "plan-start", "references", "issue-route.md");
let issueRoute = readFileSync(issueRoutePath, "utf8");
issueRoute = replaceRequired(
  issueRoute,
  "Write the body field verbatim to",
  "Use `apply_patch` to write the body field verbatim to",
  "issue-route body write",
);
issueRoute = replaceRequired(
  issueRoute,
  ", POSIX path form for the redirection per `../../rules/environment.md`",
  "",
  "issue-route redirection path-form clause",
);
writeFileSync(issueRoutePath, issueRoute, "utf8");

const detectPath = join(outputRoot, "skills", "detect-harness", "SKILL.md");
let detect = readFileSync(detectPath, "utf8");
for (const [before, after, label] of [
  [/^description:.*$/m, "description: \"Prints the Codex agent model and reasoning-effort mapping for the suite's three capability tiers, read from models.md beside this skill. Invoke before spawning tiered agents when no cached Harness: block is present.\"", "detect-harness description"],
  ["On Claude:\n\n```\nHarness: claude  (detect-harness, session cache)\nTier-1: fable\nTier-2: opus\nTier-3: sonnet\n```\n\n", "", "detect-harness Claude output block strip"],
  ["on Claude a model alias passed verbatim; on Codex a space-separated model and\neffort", "a space-separated model and effort", "detect-harness tier-value shape"],
  ["On Claude it is a single\n  model alias, passed verbatim as the `collaboration.spawn_agent`'s `model` override. On Codex it is a\n  space-separated pair", "It is a space-separated pair", "detect-harness tier-value consumer note"],
]) {
  detect = replaceRequired(detect, before, after, label);
}
writeFileSync(detectPath, detect, "utf8");

const modelsPath = join(outputRoot, "skills", "detect-harness", "models.md");
let models = readFileSync(modelsPath, "utf8");
for (const [before, after, label, mode] of [
  ["Data file for `$ace:detect-harness` (`../detect-harness/SKILL.md`).", "Data file for `$ace:detect-harness` (`SKILL.md`).", "models data-file self reference"],
  ["Each tier\ncarries, per harness, the settings a consumer resolves at spawn time -- on Claude a\nmodel alias, on Codex two separately passed values: model and reasoning effort.", "Each tier carries the two settings a Codex consumer resolves at spawn time: model and reasoning effort.", "models per-harness tier preamble"],
  [/\n### Claude\n[\s\S]*?(?=\n### Codex\n)/, "\n", "models Claude tier block strip"],
  ["### Codex", "### Codex spawn settings", "models Codex tier heading"],
  ["the spawn tool's separate", "`collaboration.spawn_agent`'s separate", "models spawn-tool field naming", "all"],
  ["Tier-1 is defined above as the\n  default-strength frontier model -- the peer of Claude's `fable`, which is the frontier\n  model at default strength, not a maximum-cost configuration. `ultra`, the top of the\n  `gpt-5.6-sol` reasoning ladder, would redefine Tier-1 as \"absolute strongest\n  regardless of cost\".", "Tier-1 is the default-strength frontier tier, not a maximum-cost configuration. `ultra`, the top of the `gpt-5.6-sol` reasoning ladder, would redefine it as absolute strongest regardless of cost.", "models Tier-1 rationale"],
  [/\n- \*\*No `\[1m\]` context-window variants\.\*\*[\s\S]*$/, "\n", "models Claude-only context-variant note strip"],
]) {
  models = mode === "all"
    ? replaceAllRequired(models, before, after, label)
    : replaceRequired(models, before, after, label);
}
writeFileSync(modelsPath, models, "utf8");

// Payload-only adaptations. Anything the shared convertText passes already handle belongs
// there, not here: a duplicate anchor here can never fire and silently rots.
const payloadAdaptations = [
  ["read or globbed", "inspected or matched with `rg --files`"],
];
const payloadAdaptationHits = new Set();

for (const payloadName of ["plan-drafter.md", "plan-revisor.md", "plan-validate.md"]) {
  const path = join(outputRoot, "agents", payloadName);
  let payload = readFileSync(path, "utf8");
  payload = `<!-- Supporting payload for collaboration.spawn_agent.message; not a discoverable custom-agent definition. -->\n\n${payload}`;
  for (const [before, after] of payloadAdaptations) {
    if (!payload.includes(before)) continue;
    payload = payload.replace(before, after);
    payloadAdaptationHits.add(before);
  }
  writeFileSync(path, payload, "utf8");
}

// Each payload adaptation is optional per file but required across the payload set: a stale
// anchor would otherwise degrade a payload silently, exactly as a missed replaceRequired would.
const missedPayloadAdaptations = payloadAdaptations
  .map(([before]) => before)
  .filter((before) => !payloadAdaptationHits.has(before));
if (missedPayloadAdaptations.length) {
  throw new Error(
    `Expected conversion sources were not found (agent payload adaptations):\n${missedPayloadAdaptations.map((before) => `  - ${before}`).join("\n")}`,
  );
}

const generatedFiles = walkFiles(outputRoot).length;
console.log(`Generated ${generatedFiles} Codex edition files under ${outputRoot}.`);
