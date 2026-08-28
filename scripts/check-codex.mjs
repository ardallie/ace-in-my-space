import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const codexRoot = join(root, "codex");
const errors = [];

const walkFiles = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files;
};

const sourceSkillFiles = walkFiles(join(root, "skills"));
const codexSkillFiles = walkFiles(join(codexRoot, "skills"));
const sourceAgentFiles = walkFiles(join(root, "agents"));
const codexAgentFiles = walkFiles(join(codexRoot, "agents"));
const sourceRuleFiles = walkFiles(join(root, "rules"));
const codexRuleFiles = walkFiles(join(codexRoot, "rules"));
const codexFiles = [...codexSkillFiles, ...codexAgentFiles, ...codexRuleFiles];

for (const [label, sourceFiles, convertedFiles] of [
  ["skills", sourceSkillFiles, codexSkillFiles],
  ["agent payloads", sourceAgentFiles, codexAgentFiles],
  ["rules", sourceRuleFiles, codexRuleFiles],
]) {
  if (sourceFiles.length !== convertedFiles.length) {
    errors.push(`${label}: source has ${sourceFiles.length} files; Codex has ${convertedFiles.length}`);
  }
}

const skillPaths = codexSkillFiles.filter((path) => path.endsWith(`${sep}SKILL.md`));
if (skillPaths.length !== 20) errors.push(`expected 20 Codex skills, found ${skillPaths.length}`);

const skillNames = new Set();
for (const skillPath of skillPaths) {
  const text = readFileSync(skillPath, "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) {
    errors.push(`${relative(root, skillPath)}: missing frontmatter`);
    continue;
  }
  const keys = [...frontmatter[1].matchAll(/^([a-z-]+):/gm)].map((match) => match[1]);
  if (keys.join(",") !== "name,description") {
    errors.push(`${relative(root, skillPath)}: frontmatter keys are ${keys.join(", ")}`);
  }
  const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1];
  const directoryName = skillPath.split(sep).at(-2);
  if (name !== directoryName) errors.push(`${relative(root, skillPath)}: name ${name} != ${directoryName}`);
  if (skillNames.has(name)) errors.push(`duplicate skill name: ${name}`);
  skillNames.add(name);
}

const forbidden = [
  ["uppercase .Codex path", ".Codex/"],
  ["Claude skill variable", "${CLAUDE_SKILL_DIR}"],
  ["Claude plugin variable", "${CLAUDE_PLUGIN_ROOT}"],
  ["plugin hook variable in skill content", "${PLUGIN_ROOT}"],
  ["Claude AskUserQuestion surface", "AskUserQuestion"],
  ["Claude Agent tool", "`Agent`"],
  ["Claude subagent_type field", "subagent_type"],
  ["Claude argument-hint frontmatter", "argument-hint:"],
];

for (const path of codexFiles) {
  const text = readFileSync(path, "utf8");
  for (const [label, token] of forbidden) {
    if (text.includes(token)) errors.push(`${relative(root, path)}: contains ${label}`);
  }
  const commandPattern = /(?<![A-Za-z0-9_.${}-])\/ace-[a-z0-9]+(?:-[a-z0-9]+)*/g;
  if (commandPattern.test(text)) errors.push(`${relative(root, path)}: contains Claude slash invocation`);

  for (const match of text.matchAll(/\$ace:(ace-[a-z0-9]+(?:-[a-z0-9]+)*)/g)) {
    if (!skillNames.has(match[1])) errors.push(`${relative(root, path)}: unknown chain target ${match[1]}`);
  }
}

for (const payloadPath of codexAgentFiles) {
  const text = readFileSync(payloadPath, "utf8");
  if (!text.startsWith("<!-- Supporting payload for collaboration.spawn_agent.message")) {
    errors.push(`${relative(root, payloadPath)}: missing supporting-payload marker`);
  }
  if (text.startsWith("---\n")) errors.push(`${relative(root, payloadPath)}: retained Claude agent frontmatter`);
}

for (const path of [...codexSkillFiles, ...codexAgentFiles]) {
  const text = readFileSync(path, "utf8");
  const rel = relative(codexRoot, path).split(sep);
  const base = rel[0] === "skills" ? join(codexRoot, "skills", rel[1]) : dirname(path);
  for (const match of text.matchAll(/`((?:\.\.\/)+(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._*-]+)`/g)) {
    const reference = match[1];
    if (reference.includes("*") || reference.includes("{") || reference.includes("...")) continue;
    const target = resolve(base, ...reference.split("/"));
    if (!existsSync(target)) {
      errors.push(`${relative(root, path)}: unresolved relative reference ${reference}`);
    }
  }
}

const claudeManifest = JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"));
const codexManifest = JSON.parse(readFileSync(join(root, ".codex-plugin", "plugin.json"), "utf8"));
if (codexManifest.name !== "ace") errors.push("Codex manifest name must be ace");
if (codexManifest.version !== claudeManifest.version) errors.push("Claude and Codex manifest versions differ");
if (codexManifest.skills !== "./codex/skills/") errors.push("Codex manifest skills path is not ./codex/skills/");

const marketplace = JSON.parse(readFileSync(join(root, ".agents", "plugins", "marketplace.json"), "utf8"));
const entry = marketplace.plugins?.find((plugin) => plugin.name === "ace");
if (marketplace.name !== "ace-in-my-space") errors.push("Codex marketplace name must be ace-in-my-space");
if (!entry) errors.push("Codex marketplace has no ace entry");
if (entry?.source !== "./") errors.push("Codex marketplace ace source must be ./");
if (entry?.policy?.installation !== "AVAILABLE") errors.push("Codex marketplace installation policy must be AVAILABLE");
if (entry?.policy?.authentication !== "ON_INSTALL") errors.push("Codex marketplace authentication policy must be ON_INSTALL");
if (!entry?.category) errors.push("Codex marketplace ace entry needs a category");

if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}

console.log(`OK: ${skillPaths.length} skills, ${codexAgentFiles.length} payloads, ${codexRuleFiles.length} rules, ${codexFiles.length} derived files`);
