import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const codexRoot = join(root, "codex");
const errors = [];

// The plugin namespace. Composed rather than written out where a retired form is being
// rejected, so this checker does not itself contain the strings it forbids.
const NS = "ace";
const MARKETPLACE = "ace-in-my-space";

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
// README documents both editions, so a `$ace:` mention is legitimate there and nowhere else
// in the Claude source of truth.
const sourceContractFiles = [...sourceSkillFiles, ...sourceAgentFiles, ...sourceRuleFiles];
const sourceFiles = [...sourceContractFiles, join(root, "README.md")];

for (const [label, files, convertedFiles] of [
  ["skills", sourceSkillFiles, codexSkillFiles],
  ["agent payloads", sourceAgentFiles, codexAgentFiles],
  ["rules", sourceRuleFiles, codexRuleFiles],
]) {
  if (files.length !== convertedFiles.length) {
    errors.push(`${label}: source has ${files.length} files; Codex has ${convertedFiles.length}`);
  }
}

// -- Inventories -------------------------------------------------------------------------
// The `ace` plugin namespace supplies uniqueness, so an inner name must never repeat it.

const skillDirectories = (skillsRoot) => readdirSync(skillsRoot)
  .filter((entry) => existsSync(join(skillsRoot, entry, "SKILL.md")))
  .sort();

const sourceSkillNames = skillDirectories(join(root, "skills"));
const sourceAgentNames = sourceAgentFiles.map((path) => path.split(sep).at(-1).replace(/\.md$/, "")).sort();

if (sourceSkillNames.length !== 20) errors.push(`expected 20 Claude skills, found ${sourceSkillNames.length}`);
if (sourceAgentNames.length !== 3) errors.push(`expected 3 Claude agents, found ${sourceAgentNames.length}`);

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
  if (name?.startsWith("ace-")) errors.push(`${relative(root, skillPath)}: skill name ${name} repeats the plugin namespace`);
  skillNames.add(name);
}

for (const name of sourceSkillNames) {
  if (!skillNames.has(name)) errors.push(`Claude skill ${name} has no derived Codex skill`);
}

// Every source skill's own frontmatter name must equal its directory too -- the Codex check
// above only proves the derived copy is self-consistent.
for (const name of sourceSkillNames) {
  const text = readFileSync(join(root, "skills", name, "SKILL.md"), "utf8");
  const declared = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)?.[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (declared !== name) errors.push(`skills/${name}/SKILL.md: frontmatter name ${declared} != ${name}`);
}

for (const path of sourceAgentFiles) {
  const stem = path.split(sep).at(-1).replace(/\.md$/, "");
  const declared = readFileSync(path, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)?.[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (declared !== stem) errors.push(`${relative(root, path)}: frontmatter name ${declared} != ${stem}`);
  if (stem.startsWith("ace-")) errors.push(`${relative(root, path)}: agent name ${stem} repeats the plugin namespace`);
}

// The exact identifiers this rename retired: `ace-` plus every live skill and agent name.
// `plan-validate` names both a skill and an agent, so the 23 map entries dedupe to 22 strings.
const retiredIdentifiers = [...new Set([...sourceSkillNames, ...sourceAgentNames])]
  .map((name) => `${NS}-${name}`)
  .sort();

// -- Codex edition -----------------------------------------------------------------------

const forbidden = [
  ["uppercase .Codex path", ".Codex/"],
  ["Claude skill variable", "${CLAUDE_SKILL_DIR}"],
  ["Claude plugin variable", "${CLAUDE_PLUGIN_ROOT}"],
  ["plugin hook variable in skill content", "${PLUGIN_ROOT}"],
  ["Claude AskUserQuestion surface", "AskUserQuestion"],
  ["Claude Agent tool", "`Agent`"],
  ["Claude subagent_type field", "subagent_type"],
  ["Claude argument-hint frontmatter", "argument-hint:"],
  ["Claude plugin-qualified slash invocation", `/${NS}:`],
  ["double-prefixed Codex mention", `$${NS}:${NS}-`],
  ["double-prefixed Claude invocation", `/${NS}:${NS}-`],
  ["double-prefixed agent address", `${NS}:${NS}-`],
];

for (const path of codexFiles) {
  const text = readFileSync(path, "utf8");
  for (const [label, token] of forbidden) {
    if (text.includes(token)) errors.push(`${relative(root, path)}: contains ${label}`);
  }
  for (const identifier of retiredIdentifiers) {
    if (text.includes(identifier)) errors.push(`${relative(root, path)}: contains retired identifier ${identifier}`);
  }

  const commandPattern = /(?<![A-Za-z0-9_.${}-])\/ace-[a-z0-9]+(?:-[a-z0-9]+)*/g;
  if (commandPattern.test(text)) errors.push(`${relative(root, path)}: contains Claude slash invocation`);

  // A Claude plugin-agent address has no counterpart in Codex; the payload spawn blocks must
  // have been rewritten to `agent_type: "default"`.
  for (const match of text.matchAll(/(?<![$A-Za-z0-9_/-])ace:([a-z0-9][a-z0-9*-]*)/g)) {
    errors.push(`${relative(root, path)}: contains Claude plugin-agent address ace:${match[1]}`);
  }

  for (const match of text.matchAll(/\$ace:([a-z0-9][a-z0-9*-]*)/g)) {
    if (match[1].includes("*")) continue;
    if (!skillNames.has(match[1])) errors.push(`${relative(root, path)}: unknown chain target ${match[1]}`);
  }
}

for (const payloadPath of codexAgentFiles) {
  const text = readFileSync(payloadPath, "utf8");
  const stem = payloadPath.split(sep).at(-1).replace(/\.md$/, "");
  if (!sourceAgentNames.includes(stem)) errors.push(`${relative(root, payloadPath)}: unexpected payload name ${stem}`);
  if (!text.startsWith("<!-- Supporting payload for collaboration.spawn_agent.message")) {
    errors.push(`${relative(root, payloadPath)}: missing supporting-payload marker`);
  }
  if (text.startsWith("---\n")) errors.push(`${relative(root, payloadPath)}: retained Claude agent frontmatter`);
}
for (const name of sourceAgentNames) {
  if (!existsSync(join(codexRoot, "agents", `${name}.md`))) errors.push(`Claude agent ${name} has no derived Codex payload`);
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

// -- Claude source of truth --------------------------------------------------------------

for (const path of sourceFiles) {
  const text = readFileSync(path, "utf8");
  for (const identifier of retiredIdentifiers) {
    if (text.includes(identifier)) errors.push(`${relative(root, path)}: contains retired identifier ${identifier}`);
  }
  for (const [label, token] of [
    ["double-prefixed Claude invocation", `/${NS}:${NS}-`],
    ["double-prefixed agent address", `${NS}:${NS}-`],
  ]) {
    if (text.includes(token)) errors.push(`${relative(root, path)}: contains ${label}`);
  }
  if (sourceContractFiles.includes(path) && text.includes("$ace:")) {
    errors.push(`${relative(root, path)}: contains a Codex mention in the Claude source`);
  }

  const barePattern = /(?<![A-Za-z0-9_.${}-])\/ace-[a-z0-9]+(?:-[a-z0-9]+)*/g;
  if (barePattern.test(text)) errors.push(`${relative(root, path)}: contains unqualified /ace- invocation`);

  // Chain edges must be plugin-qualified and must resolve.
  // A `*` marks a documentation wildcard such as `/ace:pr-*`, never a real chain edge.
  for (const match of text.matchAll(/\/ace:([a-z0-9][a-z0-9*-]*)/g)) {
    if (match[1].includes("*")) continue;
    if (!sourceSkillNames.includes(match[1])) errors.push(`${relative(root, path)}: unknown skill target /ace:${match[1]}`);
  }
  for (const match of text.matchAll(/(?<![$A-Za-z0-9_/-])ace:([a-z0-9][a-z0-9*-]*)/g)) {
    if (match[1].includes("*")) continue;
    if (!sourceAgentNames.includes(match[1])) errors.push(`${relative(root, path)}: unknown agent address ace:${match[1]}`);
  }

  // Suite-internal plugin-root paths must resolve against this checkout.
  for (const match of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([A-Za-z0-9._/-]+)/g)) {
    const reference = match[1];
    if (reference.includes("*") || reference.includes("...") || reference.endsWith("/")) continue;
    if (!existsSync(join(root, ...reference.split("/")))) {
      errors.push(`${relative(root, path)}: unresolved plugin-root reference \${CLAUDE_PLUGIN_ROOT}/${reference}`);
    }
  }
}

// -- Manifests ---------------------------------------------------------------------------

const claudeManifest = JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"));
const codexManifest = JSON.parse(readFileSync(join(root, ".codex-plugin", "plugin.json"), "utf8"));
if (claudeManifest.name !== NS) errors.push(`Claude manifest name must be ${NS}`);
if (codexManifest.name !== NS) errors.push(`Codex manifest name must be ${NS}`);
if (codexManifest.version !== claudeManifest.version) errors.push("Claude and Codex manifest versions differ");
if (codexManifest.skills !== "./codex/skills/") errors.push("Codex manifest skills path is not ./codex/skills/");

// A stale marketplace listing must not ship alongside a bumped plugin: all four version
// fields carry the same value or the build fails.
const claudeMarketplace = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
const claudeEntry = claudeMarketplace.plugins?.find((plugin) => plugin.name === "ace");
if (claudeMarketplace.name !== MARKETPLACE) errors.push(`Claude marketplace name must be ${MARKETPLACE}`);
if (!claudeEntry) errors.push("Claude marketplace has no ace entry");
if (claudeEntry?.source !== "./") errors.push("Claude marketplace ace source must be ./");
if (claudeMarketplace.metadata?.version !== claudeManifest.version) {
  errors.push(`marketplace metadata.version ${claudeMarketplace.metadata?.version} != plugin version ${claudeManifest.version}`);
}
if (claudeEntry?.version !== claudeManifest.version) {
  errors.push(`marketplace ace entry version ${claudeEntry?.version} != plugin version ${claudeManifest.version}`);
}

const marketplace = JSON.parse(readFileSync(join(root, ".agents", "plugins", "marketplace.json"), "utf8"));
const entry = marketplace.plugins?.find((plugin) => plugin.name === "ace");
if (marketplace.name !== MARKETPLACE) errors.push(`Codex marketplace name must be ${MARKETPLACE}`);
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
