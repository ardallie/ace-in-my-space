// Files held equal to their sources in the Codex edition, defined once here and imported by
// build-codex.mjs and check-codex.mjs, so the two scripts cannot drift apart. No side effects.
// - verbatimFiles: the start references and the start runner name a harness's own commands and
//   variables, so the build copies them without conversion, and check-codex holds them equal to
//   their sources and exempts only them from its forbidden-form scan.
// - invariantFiles and invariantSections: the consultant-side reference, the assignment and
//   request templates whose fixed text the consultant reads, and orchestration.md's ground rules,
//   which a consultation round copies into its assignment, are converted like every file and must
//   come out unchanged.
export const verbatimFiles = ["skills/scope-consultant/references/start-claude.md", "skills/scope-consultant/references/start-codex.md", "skills/scope-consultant/scripts/start-consultant.mjs"];
export const invariantFiles = ["skills/scope-consultant/references/consultant.md", "skills/scope-consultant/assets/assignment-template.md", "skills/scope-consultant/assets/request-template.md"];
export const invariantSections = [["skills/ws-shared/orchestration.md", "## Ground rules"]];
