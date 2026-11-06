# Report conventions

The standard header fields a report carries where its contract cites this file. Consumers:
the response-envelope contract in
`../agent-shared/sibling-exchange-protocol.md`, which
`$ace:agent-consultant`'s answers report satisfies; per-skill deltas (the `Type:` value, the
`Stage:` field) live in that skill's SKILL.md.

## Standard header fields

`Title:`, `Type:`, `Date:`, and — when applicable — `Stage:` open `## Summary`.
`$ace:report-publish` composes the issue title from `Title:`, `Type:`, and `Stage:` via
`grep -m1` line matches over the first 25 lines of the file, so those three must sit
inside that window; `Date:` is not read by the publish pipeline.
`Title:` is concise, human-readable, suitable as a GitHub issue title, with no trailing
full stop and no references to other issues or sources (no "follow-on to #234", no
`Brief N` / `WP #NNN` prefixes). Emit `Stage: {n}/{m}` only when the run covers a numbered
stage/phase/track; omit the line otherwise. Each SKILL.md states its `Type:` value and any
`Stage:` divergence.

Two further fields are shared, and each template carries only its per-skill delta on top
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

**Path lists.** Any enumerated path list in a report — `Source:`, `## Context files`, and any
other — carries one path per entry: no wildcards, no glob abbreviations, no comma-grouped
multi-file rows, and no prose annotations on an item.
