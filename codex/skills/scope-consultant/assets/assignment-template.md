# Consultation assignment

Consultant assignment: {ws name}/{nn}-scope-consultant
Date: {yyyy-MM-dd}
Request: {absolute path}/request.md
Workstream: {absolute path of the requesting workstream} -- yours to read; nothing in it is yours to change but the subfolder
Subfolder: {absolute path}/consultant/ -- writable: your record, your agents' records and the response record
Response record: {absolute path}/consultant/response.md
Scratch root: {absolute path, no trailing separator} -- writable, for an export of the target and the checks run in it | none
Checks allowed: {each command, in backticks, comma-separated, exactly as allowed | none}
Target: {absolute path} -- {profile name | unlisted}; instruction file {CLAUDE.md | AGENTS.md}[ (missing)]
Target role: {the role this round addresses | unstated}
Owner's text: {the requester's trailing text, verbatim | none}
Size: {short | standard | large}[ with an executed check] -- {the requester's reason}
Team limit: {n} agents[ at once, {m} in all, waves allowed]
Session: {model | default}, effort {level | default}
Tiers: Tier-1 {model} {effort}; Tier-2 {model} {effort}; Tier-3 {model} {effort} | default
Roles: sceptic Tier-1 effort {level}; analyst Tier-2 effort {level}; researchers Tier-3 effort {level}; revision reviewer Tier-2 effort {level} | default
Model instruction: {verbatim | none}
Soft deadline: {yyyy-MM-dd HH:mm, local time and offset} -- the response record is written by then
Hard deadline: {yyyy-MM-dd HH:mm, local time and offset} -- then you and every process you started are stopped
Completion line: Completion: {nn}-scope-consultant, {k} entries
Stop line: Stopped by the consultant: {reason}
Id prefix: CA

The parts below are copied unchanged from the suite, in this order: the ground rules, the consultant-side reference, and the start reference for {Claude Code | Codex}. Where a value above and the text below differ, the value above governs.

## Ground rules
