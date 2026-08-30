# Resolution markers and write-back

Shared marker vocabulary and report write-back procedure for the plan-workflow suite.
Each rule is single-sourced here; consumers cite this file instead of re-spelling it,
except the two declared embedded copies below. Consumers:

- `${CLAUDE_PLUGIN_ROOT}/skills/plan-start/SKILL.md` -- Phase 8 (chained write-back)
- `${CLAUDE_PLUGIN_ROOT}/skills/plan-validate/SKILL.md` -- Phase 4 (standalone interview write-back)

Two sites carry their own embedded copy instead of loading this file, with this file as
the named reference copy for both -- amend them together with this one:

- `${CLAUDE_PLUGIN_ROOT}/agents/plan-drafter.md` step 1 -- the marker semantics a subagent payload must
  state for itself to stay self-contained.
- `${CLAUDE_PLUGIN_ROOT}/skills/plan-update/SKILL.md` Phase 2A step 3 -- the marker-to-state map, which
  is unconditional on the `--from-report` path, so a file load would cost every run.

## Marker vocabulary

- `[Question]` -- a finding that requires user input.
- `[Advisory]` -- an observation folded into the plan as a note, never interviewed;
  never also carries `[Question]`.
- `[Resolved]` -- an answered question; the appended `Answer:` line records the
  resolution. Do not delete the finding -- it is the audit trail.
- Unprefixed finding -- a correction applied in full.

## Resolution states and the marker-to-state map

Five states: applied, advisory, resolved-from-context, resolved-by-interview,
unresolved. `/ace:plan-update --from-report` maps report markers directly to revisor
states, with no new interview: `[Resolved]` -> resolved-by-interview, `[Question]` ->
unresolved, `[Advisory]` -> advisory, unprefixed -> applied.

## Write-back procedure

For each finding resolved from context or by interview, Edit the report file in place:
replace `[Question]` with `[Resolved]` in the bullet's leading text, and append an
`Answer: <resolution>` line after the bullet's last continuation line, via a second Edit
anchored on the bullet's tail. Do not append a separate summary section: the
`[Resolved]`/`Answer:` markers are the complete post-interview record, and an unresolved
finding's `[Question]` prefix is itself the durable record `/ace:plan-update --from-report`
maps to the `unresolved` state.

## Edit-failure fallback

If an Edit call fails (non-unique anchor, anchor not found), assemble the updated
report content in-context and call Write once on the report path.
