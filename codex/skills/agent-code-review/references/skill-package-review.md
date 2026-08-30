# Skill-package review

Consumed by SKILL.md Phases 3 and 5 -- read when (and only when) the reviewed scope
contains skill-package files. The load condition is mechanical, evaluated against the
Phase 2 changed-file list (the gathered file set for a `directory` source): any file in
scope sits under `.claude/skills/**`, `.claude/agents/**`, `.claude/commands/**`,
`.claude/rules/**`, or `scripts/**` (the packs' script planes -- class F below is written
for exactly those files), or is a path enumerated in an H2 list under the
`# Skill packages` section of `.docs/workflows/commands.md`, or is that registry file
itself. A mixed diff loads this module and applies it to the package subset only; the
ordinary reviewer instructions govern the rest of the scope. This condition is an aligned
copy of the one `SKILL.md` Phase 3 states; the two are edited together.

Reviewers never read SKILL.md, so the parent pushes this module to them: pass its path in
the Phase 3 package handoff alongside the package path. A reviewer receiving it applies
the checklist below to the package subset of its scope, in addition to -- not instead of
-- the standard reviewer instructions.

**Host-conditional citations.** Every `.claude/...`, `.docs/...`, and `scripts/...` path
below names a *host* surface, not a file this suite ships: the reviewed repository's own
skills tree, registries, rules index, and script plane. Specific file paths carry a
`[host]` marker at the citing line; the scope globs in the load condition, the registry
names beside them, and the tree names in `## File budget` are host surfaces by
construction and go unmarked. Where the host carries the named surface, read it and apply the class as
written; where it does not, the class statement here stands alone and the citation is a
pointer to the canonical wording rather than a required read -- no finding follows from
the absence. Paths written relative to the active skill (`../...` or `../../...`) are suite-internal and always
resolve. This distinction is what keeps the module usable in a repository that carries
neither the skill-optimiser pack nor a skills-package checker.

## Why this scope class reads differently

No compiler reads these files and no test exercises them. Where the repository gates this
tree at all, the gate is the mechanical checker below, whose reach is the invariants it
covers and no further -- classes C, E, and G, and most of D, ship ungated.
The reviewed artefacts are executable instructions: skills, subagent definitions, rules
files, registries, and the scripts beside them. Their failure mode is silent -- a session
follows a citation to a file that is not there and improvises. The subject of the review
is therefore the citation graph and the invocation chains, not the diff hunks alone.

**Mechanical gate.** Where the repository defines a mechanical skills-package checker
(`scripts/skills/skills.mjs` -- run `node scripts/skills/skills.mjs check all` -- [host],
the shape the suite's home repository uses), it is the shared battery's gate for this
scope class. Where the host defines no such checker, this gate does not run and the
battery proceeds without it. It runs under the tiers that run a battery, and never overrides the
`--checks` flag:

- Under `--checks full` and `cheap` the parent runs it once whenever this module loads --
  under the no-compile-surface fallback it is the battery, and on a mixed diff whose
  battery ran the compile surface instead the parent still runs it here: it is read-only
  and completes in seconds. Record it in the battery record and push the results with the
  package; reviewers then treat them as established facts and do not re-run it.
- Under `--checks skip` the parent runs no battery at all, this gate included --
  `--checks` is the owner's explicit control and this module does not override it
  (`../agent-shared/verification-checks.md`, `skip`). The package handoff
  states that no mechanical checker results are available, and reviewers run their own
  probes accordingly. The record stays `skipped by flag`, which carries no command clause.

It mechanises parts of classes A, B, and D below. Map its subcommands onto the classes to
derive the residual manual set -- in this repository `frontmatter` covers class A's `name`
grammar and `description` presence, `chains` class A's `disable-model-invocation` rule,
`paths` class B's first bullet, and `registry` the listed-path and unregistered-file arms
of class D's first bullet (never its warrant clause) plus catalogue coverage (the
presence of a one-liner, never its agreement with the frontmatter `description`); the
unregistered-file and catalogue arms are warn-level, so a green run does not establish
them. Everything else in those classes, and all of C, E, F, and G, is a manual probe.
Where no checker exists, every probe below is manual.

## The invariant checklist

Seven invariant classes. For each: what must hold, how to establish it, and what a
violation looks like. Where a `skill-optimiser` check module is cited, it is the
canonical statement -- cite it in findings rather than restating it; where that pack is
absent (it replicates separately from this one), the class statements here stand alone.

### A. Frontmatter and invocability

- `name` matches its directory and the standard's grammar (lowercase alphanumerics and
  hyphens, no leading/trailing/consecutive hyphens).
- `description` is present, third-person, and carries the triggers the skill should fire
  on.
- `argument-hint` is honest in both directions: every flag it names is parsed by the
  body, and every flag the body parses appears in it. Probe by reading the body's flag
  pre-pass against the hint, both ways.
- `disable-model-invocation` respects the chained-skills rule (`.docs/workflows/`
  `commands.md`, Architecture): a skill reached by `/{name}` from another skill must stay
  `false`. Before accepting any `true`, sweep the tree for inbound `/{name}` invocation
  sites -- separating invocation sites ("run `/x`", "via `/x`") from mere mentions.
- The Model-invocation paragraph in `commands.md` enumerates exactly the skills that
  carry `true`; its enumeration must agree with the tree.

### B. Citation and path integrity

- Every path a file cites resolves on disk.
- Zero citations survive to any path the change vacated, confirmed by a **full-path sweep
  and a bare-filename grep** -- the two catch different residues (a repointed directory
  leaves full-path hits; a renamed file leaves bare-name hits in prose).
- Every by-reference execution site -- "read the block from X", "run the procedure in Y",
  "follow the steps in Z" -- names the current location. These are the highest-risk
  sites: they are executed, not read as documentation, so a stale one breaks every
  invocation that traverses it.
- Every citation of a phase, stage, or step number resolves in **both** directions: the
  vacated number is absent, *and* each surviving citation still names what the citing
  sentence describes. A reorder creates the second defect while leaving the first clean.
  The canonical statement is `.claude/skills/skill-optimiser/checks/coherence.md` pass 2
  [host].

### C. Aligned copies and single-definition surfaces

- Every declared aligned copy still agrees with its canonical, and every declared
  exclusion still states its different warrant.
- A surface barred from inlining stays un-inlined -- the `report-publish` title pipeline
  is the standing example, barred outright in `commands.md`: its producers execute it by
  reading the one definition, so a second copy would be the drift it exists to prevent.
- A repair whose warrant is generic reaches **every** site carrying the surface, not the
  subset a reviewer happened to open (`checks/coherence.md` pass 1): three sites repaired
  out of five leaves the other two reading as deliberate divergence. Enumerate the
  surface's sites from the tree, then diff repaired against untouched.

### D. Registry and catalogue truth

- Every path in an H2 list under the `# Skill packages` section exists on disk, and every
  package file on disk appears in at least one of those lists -- an unregistered file is
  invisible to `/skill-optimiser` and to sibling-repository replication. A deliberate
  absence must be recorded in the registry preamble, in a paragraph carrying the phrase
  "deliberately absent", with each absent unit named as a backticked token and the
  warrant for its exclusion stated -- that phrase is what a mechanical checker matches to
  tell a sanctioned absence from an unregistered file; an absence neither listed nor
  recorded that way is the finding.
- Subset packages that enumerate a file must all be updated together:
  `agent-code-review`'s own files appear in `relay-workflow` **and**
  `multi-agent-workflow`, so a file added to this skill joins both lists in the same
  change.
- Borrow lists name existing paths, and are complete in both directions: a shared file
  whose own consumer registry names a bundle member as an aligned copy or consumer must
  appear in that bundle's borrow list. Establish completeness by enumerating the members'
  outbound citations and the shared files' consumer registries, not by reading the borrow
  list alone.
- A member that gains or drops a rules-file citation (`.claude/rules/*` [host], or
  `../../rules/*` in a plugin-shipped pack) updates its pack's
  travelling rules set in the same change -- unless the citation is a host-local data
  source or example rather than a contract counterparty, in which case the exclusion is
  stated.
- Catalogue one-liners exist for every skill and do not contradict the frontmatter
  description.
- The rules-file registries are part of this class: the in-scope lists in
  `.claude/skills/queue-shared/team-queue-protocol.md` [host] and
  `../agent-shared/sibling-exchange-protocol.md`, and the
  `## Index` in `.claude/rules/documentation.md` [host].

### E. Progressive disclosure and context economy

- A `references/` file must be genuinely conditional; one that every invocation reads is
  pure overhead on every invocation path. A review of a package change reports **bytes
  per invocation path, before and after**, rather than asserting that a file is small.
- `SKILL.md` stays within the standard's 500-line guidance -- with the caveat that line
  count alone is uninformative at high byte density; report bytes beside lines.
- What belongs in metadata, in the body, or behind on-demand loading is
  `.claude/skills/skill-optimiser/checks/layering.md` [host], operationalising rule 3 of
  `.claude/skills/skill-optimiser/references/rubric.md` [host] -- cite them rather than
  duplicating the rubric.

### F. The script plane

Package changes routinely include `.mjs` files, and unlike the markdown they have a real
executable surface -- review them as code and probe them:

- `node --check` on every changed script; `node --test` on its fixture spec; read-only or
  `--dry-run` subcommands against real artefacts.
- The script's subcommands, flags, exit codes, and output shapes match what the invoking
  skill or rules text claims they are, **in both directions**: a subcommand the text
  invokes and the script does not implement, and a script surface no text names.
- The zero-dependency rule holds: Node built-ins plus the `gh` CLI only.
- A script never mutates an agent-authored file except where its own documented contract
  licenses a deterministic projection -- in the suite's home repository the one sanctioned
  exception is recorded in `.claude/skills/wpak-shared/wpak-publishing.md` [host] (a
  host-local citation, not a pack contract).
- Operator alias entries in the root `package.json` (and any host-profile alias record)
  are part of the change: a new subcommand without its alias, or an alias naming a
  subcommand that does not exist, is a finding.

### G. The trace-walk

One representative invocation per producer-consumer chain touched by the diff, followed
end to end through the changed text as if executing it: the argument parses, the artefact
lands where the next file looks for it, the marker the consumer matches is the spelling
the producer emits, the branch the next file takes exists. Grep proves a token still
exists; only the walk proves the path still runs (`checks/coherence.md` pass 4). At least
one walk per review is mandatory, and the report names the chain walked.

## Severity re-anchoring

Do not down-rate. A broken citation in this scope class is not a documentation nit: it is
a broken execution path, and every invocation that traverses it fails in a way the
mechanical gate does not detect. Map findings onto the Phase 5 scale with these anchors --
calibration examples, not an exhaustive table:

- **Critical** -- a by-reference execution site naming a path that does not exist; a
  chained skill set `disable-model-invocation: true`; a registry slug resolving to an
  empty file set; a subcommand the skill text invokes and the script does not implement;
  a `node --check` failure.
- **High** -- a surviving phase/step citation that now names the wrong thing; an aligned
  copy diverged from its canonical; a generic repair applied to a subset of its sites; a
  package file missing from a registry that enumerates its siblings.
- **Moderate** -- catalogue drift; an always-read `references/` file; a description that
  omits its triggers.
- **Minor** -- wording and ordering.

## Specialisation axes

For the default `--reviewers 3` (the sceptic is unchanged and additional), the parent
takes its specialisations from these axes -- Phase 3's "specialisations chosen by the
system" wording still governs:

1. **Citation-graph and registry integrity** -- classes B and D.
2. **Contract coherence** -- classes A, C, and G: frontmatter, aligned copies,
   single-definition surfaces, and the trace-walk.
3. **Script plane and context economy** -- classes E and F.

Under `--reviewers 2`, fold axis 3: class F joins axis 2 (script-versus-text contract
checking) and class E joins axis 1 (both are tree-level accounting) -- no class is
dropped.

## File budget

The read cap binds early here: verifying a citation graph means opening files across the
whole skills tree plus `.claude/rules/**`, `.claude/agents/**`, and `commands.md` -- the
graph, not the diff, is the subject, so a change touching five files can require opening
forty to verify. SKILL.md Phase 3 states the raised figure for this scope class and is the
single definition of it; this module does not restate it. Reviewers say when they hit the
cap, and consumption is disclosed in `## Coverage notes` per the existing Phase 5 rule.
