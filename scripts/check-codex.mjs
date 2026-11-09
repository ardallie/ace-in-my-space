import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

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

// The Codex edition holds skills only; any other top-level entry is a stray the comparison
// below never sees. Checked before the walks, so a missing directory is reported rather than
// thrown.
const codexEntries = readdirSync(codexRoot);
for (const entry of codexEntries) {
  if (entry !== "skills") errors.push(`codex/${entry}: unexpected top-level entry`);
}
if (!codexEntries.includes("skills")) errors.push("codex/skills: missing");
if (errors.length > 0) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}

const sourceSkillFiles = walkFiles(join(root, "skills"));
const codexFiles = walkFiles(join(codexRoot, "skills"));
// README documents both editions, so a `$ace:` mention is legitimate there and nowhere else
// in the Claude source of truth.
const sourceFiles = [...sourceSkillFiles, join(root, "README.md")];

// Every Codex file maps to a source file at the same relative path, except the generated-only
// files the build writes from its own text; each of those exists in the Codex edition only.
const generatedOnly = ["skills/scope-implement/orchestration-codex.md", "skills/scope-code-review/orchestration-codex.md"];
for (const rel of generatedOnly) {
  if (!existsSync(join(codexRoot, ...rel.split("/")))) errors.push(`generated-only file missing: codex/${rel}`);
  if (existsSync(join(root, ...rel.split("/")))) errors.push(`generated-only file has a source copy: ${rel}`);
}

const relativePaths = (base, files) => new Set(files.map((path) => relative(base, path).split(sep).join("/")));
const sourcePaths = relativePaths(root, sourceSkillFiles);
const codexPaths = relativePaths(codexRoot, codexFiles);
for (const rel of sourcePaths) {
  if (!codexPaths.has(rel)) errors.push(`skills: ${rel} has no Codex counterpart`);
}
for (const rel of codexPaths) {
  if (!sourcePaths.has(rel) && !generatedOnly.includes(rel)) errors.push(`skills: codex/${rel} has no source counterpart`);
}

// -- Inventories -------------------------------------------------------------------------
// The `ace` plugin namespace supplies uniqueness, so an inner name must never repeat it.

const skillDirectories = (skillsRoot) => readdirSync(skillsRoot)
  .filter((entry) => existsSync(join(skillsRoot, entry, "SKILL.md")))
  .sort();

const sourceSkillNames = skillDirectories(join(root, "skills"));

if (sourceSkillNames.length !== 15) errors.push(`expected 15 Claude skills, found ${sourceSkillNames.length}`);

const skillPaths = codexFiles.filter((path) => path.endsWith(`${sep}SKILL.md`));
if (skillPaths.length !== 15) errors.push(`expected 15 Codex skills, found ${skillPaths.length}`);

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

// The prefixed form of every live skill name: `ace-` plus the name. The plugin namespace already
// qualifies each name, so no file may carry its prefixed form. Matched as a whole word, so
// `workspace-git-branch` is no hit.
const retiredIdentifiers = sourceSkillNames
  .map((name) => `${NS}-${name}`)
  .sort()
  .map((identifier) => [identifier, new RegExp(String.raw`(?<![A-Za-z0-9_-])${identifier}(?![A-Za-z0-9_])`)]);

// -- Codex edition -----------------------------------------------------------------------

const forbidden = [
  ["uppercase .Codex path", ".Codex/"],
  ["Claude skill variable", "${CLAUDE_SKILL_DIR}"],
  ["Claude plugin variable", "${CLAUDE_PLUGIN_ROOT}"],
  ["plugin hook variable in skill content", "${PLUGIN_ROOT}"],
  ["Claude AskUserQuestion surface", "AskUserQuestion"],
  ["Claude Agent tool", "`Agent`"],
  ["Claude subagent_type field", "subagent_type"],
  ["Codex agent_type field (absent from the spawn schema)", "agent_type"],
  ["Claude argument-hint frontmatter", "argument-hint:"],
  ["Claude-only passage", "On Claude"],
  ["Claude Code environment variable", "CLAUDE_CODE_"],
  ["Claude maxEffortLevel setting", "maxEffortLevel"],
  ["Claude SendMessage tool", "SendMessage"],
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
  for (const [identifier, pattern] of retiredIdentifiers) {
    if (pattern.test(text)) errors.push(`${relative(root, path)}: contains retired identifier ${identifier}`);
  }

  const commandPattern = /(?<![A-Za-z0-9_.${}-])\/ace-[a-z0-9]+(?:-[a-z0-9]+)*/g;
  if (commandPattern.test(text)) errors.push(`${relative(root, path)}: contains Claude slash invocation`);

  // A Claude plugin-agent address has no counterpart in Codex, and the suite defines no
  // plugin agents, so any `ace:{name}` address dangles.
  for (const match of text.matchAll(/(?<![$A-Za-z0-9_/-])ace:([a-z0-9][a-z0-9*-]*)/g)) {
    errors.push(`${relative(root, path)}: contains Claude plugin-agent address ace:${match[1]}`);
  }

  for (const match of text.matchAll(/\$ace:([a-z0-9][a-z0-9*-]*)/g)) {
    if (match[1].includes("*")) continue;
    if (!skillNames.has(match[1])) errors.push(`${relative(root, path)}: unknown chain target ${match[1]}`);
  }
}

for (const path of codexFiles) {
  const text = readFileSync(path, "utf8");
  const base = join(codexRoot, "skills", relative(join(codexRoot, "skills"), path).split(sep)[0]);
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
  for (const [identifier, pattern] of retiredIdentifiers) {
    if (pattern.test(text)) errors.push(`${relative(root, path)}: contains retired identifier ${identifier}`);
  }
  for (const [label, token] of [
    ["double-prefixed Claude invocation", `/${NS}:${NS}-`],
    ["double-prefixed agent address", `${NS}:${NS}-`],
  ]) {
    if (text.includes(token)) errors.push(`${relative(root, path)}: contains ${label}`);
  }
  if (sourceSkillFiles.includes(path) && text.includes("$ace:")) {
    errors.push(`${relative(root, path)}: contains a Codex mention in the Claude source`);
  }

  const barePattern = /(?<![A-Za-z0-9_.${}-])\/ace-[a-z0-9]+(?:-[a-z0-9]+)*/g;
  if (barePattern.test(text)) errors.push(`${relative(root, path)}: contains unqualified /ace- invocation`);

  // Chain edges must be plugin-qualified and must resolve.
  // A `*` marks a documentation wildcard over skill names, never a real chain edge.
  for (const match of text.matchAll(/\/ace:([a-z0-9][a-z0-9*-]*)/g)) {
    if (match[1].includes("*")) continue;
    if (!sourceSkillNames.includes(match[1])) errors.push(`${relative(root, path)}: unknown skill target /ace:${match[1]}`);
  }
  // The suite defines no plugin agents, so any `ace:{name}` agent address dangles.
  for (const match of text.matchAll(/(?<![$A-Za-z0-9_/-])ace:([a-z0-9][a-z0-9*-]*)/g)) {
    errors.push(`${relative(root, path)}: unknown agent address ace:${match[1]}`);
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

// The decisions template's `Seed:` names the release that last changed its header text, and
// scope-implement replaces only an older-seeded header, so a text change without a bump
// would silently keep stale headers. The pin holds the seed and a hash of the header as
// scope-implement compares it (above `## Decisions`, `Seed:` and blank lines and line endings
// aside). A header change sets `Seed:` to the releasing version and updates both pin values.
const DECISIONS_SEED = { seed: "0.9.0", sha256: "390cb8593d420e85ec2b8e82f91e57a13e8f8876452688e281ef277056aef006" };
const templateLines = readFileSync(join(root, "skills", "ws-shared", "decisions-template.md"), "utf8").split(/\r?\n/);
const decisionsHeading = templateLines.indexOf("## Decisions");
const seedLines = templateLines.filter((line) => line.startsWith("Seed:"));
if (decisionsHeading < 0) errors.push("decisions template has no ## Decisions heading");
else if (seedLines.length !== 1) errors.push(`decisions template carries ${seedLines.length} Seed: lines, expected 1`);
else {
  const seed = seedLines[0].slice("Seed:".length).trim();
  const header = templateLines.slice(0, decisionsHeading)
    .filter((line) => line.trim() !== "" && !line.startsWith("Seed:"))
    .join("\n");
  const sha256 = createHash("sha256").update(header).digest("hex");
  if (sha256 !== DECISIONS_SEED.sha256 && seed === DECISIONS_SEED.seed) {
    errors.push(`decisions template header changed but Seed: is still ${seed}; set it to the releasing version and update DECISIONS_SEED`);
  } else if (sha256 !== DECISIONS_SEED.sha256 || seed !== DECISIONS_SEED.seed) {
    errors.push(`decisions template Seed: ${seed} or header hash ${sha256} does not match DECISIONS_SEED`);
  }
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

console.log(`OK: ${skillPaths.length} skills, ${codexFiles.length} derived files`);
