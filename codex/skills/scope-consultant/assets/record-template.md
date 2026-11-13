# Scope consultant

Title: {concise; no trailing full stop; no issue, package or stage numbers; no references to other issues}
Date: {yyyy-MM-dd}
Workstream: .ace/ws/{name}
Source: {raising report file, ws-relative | question file key | conversation}
Target: {profile name | unlisted} -- {absolute path, forward slashes} -- branch {name | detached}
Grounded at: {target short hash}, {clean tree | dirty ({n} modified files)}[; HEAD moved to {hash} during the round]
Status: complete
Next: {the next step(s) Close printed, as printed, in print order}

[guidance, deleted in the record. The body below the header is the response record from its `## Summary` to the line before its completion line, copied by a file operation and never retyped. The requester's lines go under its `## Run record`. Bare ids are the Source report's; a round with no Source report numbers its questions as its own: as its question file numbers them, else `Q1..`. `Grounded at:` is the target's state, captured before and after the round, not the requesting checkout's. The record is written once, at Close, as the step's final write; a round that stops writes none, so `Status:` is always `complete`.]

## Summary
...                                    <- copied, through the response's ## Run record lines
Requester: {claude | codex}, orchestrator {model id}; elapsed {m} min; tokens {n | not exposed to the run}
Consultant: {claude | codex} {launcher version}; session {model | default}, effort {level | default}; elapsed {m} min; {USD {x} | {in}/{out} tokens} -- from {the harness field read}
Ran: {start}-{end} local; {exited {code} | stopped at the hard deadline | stopped on request}; processes left: {none | {each, by pid and command}}[; recorded, not stopped: {each}] -- from workings/{nn}-scope-consultant/raw/meta.json
User settings: {~/.claude/settings.json unchanged | ~/.claude/settings.json changed during the round, sha256 {before} to {after}; the user's file, not restored | not hashed: a Codex consultant}
Started by: {named by ...}; requester permission {permitted | prompted, allowed | not shown before the start}; settings as copied in workings/{nn}-scope-consultant/assignment.md
Target state: {no difference | {n} differences, reported, none reverted}; attribution: no write record outside the writable set in {sources read}[; child writes not exposed by {harness}]
- {each difference, one line}
Scratch root: {none | granted, removed[; residue {what}]}
Skills and sessions seen: {none in the raw output | {what}}
Other siblings' questions: {ids -- {entry}, a further round printed | none}
Workings: workings/{nn}-scope-consultant/
