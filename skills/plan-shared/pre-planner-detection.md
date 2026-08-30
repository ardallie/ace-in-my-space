# Pre-planner report detection

The plan-workflow suite's two-rule detection for classifying an input file as a
pre-planner report. The detection is single-sourced here; each consumer states its own
action on a match in its own file. Consumers:

- `${CLAUDE_PLUGIN_ROOT}/skills/plan-start/SKILL.md` -- Phase 2 detection (a match makes the report the
  transform driver)
- `${CLAUDE_PLUGIN_ROOT}/skills/plan-validate/SKILL.md` -- Phase 1 rejection guard (a match stops with a
  `/ace:plan-start` redirect)
- `${CLAUDE_PLUGIN_ROOT}/skills/plan-update/SKILL.md` -- Phase 2A step 1 rejection guard (a match stops
  with a `/ace:plan-start` redirect)

## The two-rule detection

A file is a **pre-planner report** if its filename matches `*-agent-pre-planner-*.md` OR
its first non-blank line is `# Pre-plan analysis`. Filename match is primary; the H1 sniff
is the fallback so renamed reports are still recognised.
