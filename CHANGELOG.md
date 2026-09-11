# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1]

### Changed

- Refresh the harness tier mappings for the current Claude and Codex model lineup, including
  `gpt-6-astra` at Codex Tier-1 and `gpt-5.6-luna` at Tier-3.
- Clarify detect-harness resolution, caching, validation, explicit-model, and spawn contracts.
- Record explicit effort settings for the Claude planning agent definitions.

## [0.3.0]

### Removed -- BREAKING: the rules layer

The plugin no longer ships `rules/environment.md`, `rules/output-style.md`, or
`rules/principles.md`, nor their generated `codex/rules/` twins. The files carried host-project
preferences (language, greenfield, infrastructure, and documentation conventions) that belong in
the host repository's own rules, not in a project-agnostic toolkit. Host repositories supply their
own rules; no suite behaviour depends on them.

The option-list rules every interview surface follows now live in `skills/run-interview/SKILL.md`
as the canonical statement, and every citing skill and agent payload points there. POSIX path-form
instructions remain inline at each site that uses them.

### Changed -- Codex derivation

`scripts/build-codex.mjs` no longer copies or converts a rules tree. The Codex-specific interview
guidance it previously injected into `codex/rules/principles.md` is injected into
`codex/skills/run-interview/SKILL.md` instead. `scripts/check-codex.mjs` no longer counts or
inventories rules files.

## [0.2.0]

### Changed -- BREAKING: every skill and agent identifier loses its `ace-` prefix

The `ace` plugin namespace already supplies uniqueness, so repeating it inside each component
name was redundant. Every skill and plugin-agent name drops the `ace-` prefix. The plugin name,
the `ace-in-my-space` repository and marketplace name, the "Ace in my space" suite name, the
generated `.ace/` artefact root, and the `agent-shared/`, `plan-shared/`, and `rules/` shared
directories are all unchanged.

No compatibility aliases are provided. This is a pre-1.0 cleanup, and duplicate aliases would
pollute discovery and preserve the very convention this release removes.

#### Migrating an invocation

Claude Code:

```
/ace-plan-start        ->  /ace:plan-start
/ace:ace-plan-start    ->  /ace:plan-start
```

Codex CLI:

```
$ace:ace-plan-start    ->  $ace:plan-start
```

Claude plugin-agent addresses follow the same rule -- drop the inner prefix, keep the namespace:

```
ace:ace-plan-drafter   ->  ace:plan-drafter
ace:ace-plan-revisor   ->  ace:plan-revisor
ace:ace-plan-validate  ->  ace:plan-validate
```

Apply the same rule to any skill: strip the leading `ace-` from the name and keep the
plugin-qualified form. The full renamed set is:

| Old name                | New name              |
| ----------------------- | --------------------- |
| `ace-agent-arch-review` | `agent-arch-review`   |
| `ace-agent-code-review` | `agent-code-review`   |
| `ace-agent-consultant`  | `agent-consultant`    |
| `ace-agent-pre-planner` | `agent-pre-planner`   |
| `ace-agent-scope`       | `agent-scope`         |
| `ace-detect-harness`    | `detect-harness`      |
| `ace-plan-handoff`      | `plan-handoff`        |
| `ace-plan-implement`    | `plan-implement`      |
| `ace-plan-read`         | `plan-read`           |
| `ace-plan-route`        | `plan-route`          |
| `ace-plan-start`        | `plan-start`          |
| `ace-plan-update`       | `plan-update`         |
| `ace-plan-validate`     | `plan-validate`       |
| `ace-pr-create`         | `pr-create`           |
| `ace-pr-read`           | `pr-read`             |
| `ace-pr-response`       | `pr-response`         |
| `ace-report-publish`    | `report-publish`      |
| `ace-report-triage`     | `report-triage`       |
| `ace-run-interview`     | `run-interview`       |
| `ace-run-retro`         | `run-retro`           |
| `ace-plan-drafter`      | `plan-drafter`        |
| `ace-plan-revisor`      | `plan-revisor`        |
| `ace-plan-validate`     | `plan-validate`       |

`plan-validate` names both a skill and an agent payload; they remain distinct components under
the same inner name, addressed as `/ace:plan-validate` and `ace:plan-validate` respectively.

The bare, unqualified forms (`/ace-plan-start` and the like) no longer resolve and are not
documented. Always use the plugin-qualified form.

### Changed -- artefact filenames

Generated report, plan, scope, review, staged-file, and retrospective filenames drop the `ace-`
producer token; the `.ace/` root already identifies the suite. For example,
`.ace/reports/{yyyyMMdd}-{HHmm}-ace-agent-code-review-{suffix}.md` becomes
`.ace/reports/{yyyyMMdd}-{HHmm}-agent-code-review-{suffix}.md`. Artefacts already written under
`.ace/` are historical records and are not renamed.

### Changed -- Codex derivation

`scripts/build-codex.mjs` no longer assumes a brand prefix on an inner skill name. It derives the
skill inventory from `skills/*/SKILL.md`, converts a Claude `/ace:{skill}` reference to a Codex
`$ace:{skill}` reference by sigil alone, and rewrites payload-relative skill paths from that
inventory instead of a `../ace-*` prefix rule.

### Fixed -- silent conversion anchors in the Codex build

Content anchors in `scripts/build-codex.mjs` now fail the build when they stop matching, instead
of silently leaving Claude text in the generated Codex edition. Eight anchors that had already
stopped matching were removed; seven were superseded by an earlier pass producing equivalent
output, and one -- the `disable-model-invocation` review criterion in
`skills/agent-code-review/references/skill-package-review.md` -- never matched because of a line
wrap, so the Codex edition of that reference still names only the Claude-only frontmatter key and
not the Codex `policy.allow_implicit_invocation: false` counterpart. That content gap is
unchanged by this release.

### Changed -- checker coverage

`scripts/check-codex.mjs` now also asserts that all four version fields agree
(`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, and both `metadata.version` and
`plugins[0].version` in `.claude-plugin/marketplace.json`), that no retired identifier or
double-prefixed invocation form survives in either tree, that no Claude `/ace:` invocation or
`ace:{agent}` address leaks into the Codex output, and that every Claude `/ace:{skill}` chain
edge, `ace:{agent}` address, and `${CLAUDE_PLUGIN_ROOT}` path in the source of truth resolves.

## [0.1.0]

Initial release: twenty skills, three subagent payloads, three rules files, and a generated
Codex edition, shipped as the `ace` plugin from the `ace-in-my-space` marketplace.
