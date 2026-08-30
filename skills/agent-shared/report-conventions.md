# Report conventions

Shared reporting conventions for the multi-agent skill suite: the standard header fields,
the save procedure, and the publish phase. Consumers: the four suite skills; per-skill
deltas (the `Type:` value, the `Stage:` field, the `--publish` default, extra publication
notes) live in each SKILL.md.

## Standard header fields

`Title:`, `Type:`, `Date:`, and — when applicable — `Stage:` open `## Summary`.
`/ace:report-publish` composes the issue title from `Title:`, `Type:`, and `Stage:` via
`grep -m1` line matches over the first 25 lines of the file, so those three must sit
inside that window; `Date:` is not read by the publish pipeline.
`Title:` is concise, human-readable, suitable as a GitHub issue title, with no trailing
full stop and no references to other issues or sources (no "follow-on to #234", no
`Brief N` / `WP #NNN` prefixes). Emit `Stage: {n}/{m}` only when the run covers a numbered
stage/phase/track; omit the line otherwise. Each SKILL.md states its `Type:` value and any
`Stage:` divergence.

Three further fields are shared, and each template carries only its per-skill delta on top
of the grammar below.

`Source:` is an enumerated, comma-separated list of the exact inputs — each item a
repo-relative file path or `issue #N`, and `conversation context` when there are no file or
issue inputs. It records only what the input phase parsed as input: artefacts fetched during
exploration (issues or PRs beyond the brief, `gh` reads by team members) are never `Source:`
items.

`Grounded at:` is the repository-state anchor and is always emitted: HEAD short-hash plus
tree state — e.g. `ff6df1d, clean tree` or `ff6df1d, dirty (3 modified files)`. Each SKILL.md
names the consumer that reads it, and a skill that pins its reviewed state through a
different field states that divergence instead.

`Prior:` is the path passed to `--prior`; omit the line entirely unless `--prior` was
supplied. A skill with no `--prior` flag never emits it.

**Path lists.** Any enumerated path list in a report — `Source:`, `## Context files`, and any
other — carries one path per entry: no wildcards, no glob abbreviations, no comma-grouped
multi-file rows, and no prose annotations on an item.

## Save report

Write the report to the skill's save path —
`{directory}/{yyyyMMdd}-{HHmm}-{skill-slug}-{suffix}.md`, where `{yyyyMMdd}` and `{HHmm}`
are local machine time (`date +%Y%m%d` and `date +%H%M`) and `{suffix}` is the run's hex
suffix.

The write mechanism governs every artefact a suite skill writes, not only reports: create
the directory if it does not exist; if the write fails, retry once; if it still fails, output
the artefact in full so the user can save it manually. Each site names its own fallback
deliverable — the report in full, the updated report in full, the printed request-envelope
copy.

## Publish

Runs in every path that saved a report — after the save phase when there is no interview,
and after the interview phase regardless of the interview outcome (answered, declined,
cancelled, or tool failure); the file on disk at this point (including any unresolved
marker) is what gets published.

- **`--publish no`** — do not create an issue. The final summary prints the saved report
  path plus the ready-to-run line `/ace:report-publish {report path}`.
- **`--publish yes`** — publish the saved report per the `## Producer publish phase`
  section in `${CLAUDE_PLUGIN_ROOT}/skills/report-publish/SKILL.md`.

The report's `**Tip:**` next-step line stays in `## Summary` under both branches.

The saved report is the deliverable; the publish phase is a mechanical post of that file,
and the command ends after it.

After issue creation the pipeline appends a `## Publication` block (`- Issue: <url>`) to
the saved report file — the durable report -> issue linkage and the on-disk
duplicate-publish signal.

If the publish step's `gh issue create` call fails, report the error verbatim and print
the ready-to-run `/ace:report-publish {report path}` line — the saved report stands
regardless.
