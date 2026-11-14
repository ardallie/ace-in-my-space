# Scope consultant

Title: {concise; no trailing full stop; no issue, package or stage numbers; no references to other issues}
Date: {yyyy-MM-dd}
Workstream: .ace/ws/{name}
Source: {raising report file, ws-relative | question file key | conversation}
Target: {profile name | unlisted} -- {absolute path, forward slashes} -- branch {name | detached}
Grounded at: {target short hash}, {clean tree | dirty ({n} modified files)}[; HEAD moved to {hash} during the round]
Status: complete
Next: {the next step(s) Close printed, as printed, in print order}

[guidance, deleted in the record. The body below the header is the response record from its `## Summary` to the line before its completion line, copied by a file operation and never retyped. The requester's lines go under its `## Run record`. Bare ids are the Source report's; a round with no Source report numbers its questions as its own: as its question file numbers them, else `Q1..`. `Grounded at:` is the target's state in the before-capture, not the requesting checkout's: `dirty` counts its status lines other than ignored (`!!`) ones; what the after-capture shows differently is on `Target state:`, a moved HEAD here. The record is written once, at Close; only the state record's `Artefact:` line and the index follow it; a round that stops writes none, so `Status:` is always `complete`.]

## Summary
...                                    <- copied, through the response's ## Run record lines
Requester: {claude | codex}, orchestrator {model id}; elapsed {m} min; tokens {n | not exposed to the run}
Consultant: {claude | codex} {launcher version}; session {model | default}, effort {level | default}; elapsed {m} min; {USD {x} | {in}/{out} tokens | not reported by the harness} -- from {the harness field read | the raw output, which held none}
Ran: {start}-{end} local; {exited {code} | stopped at the hard deadline | stopped on request}; stopped after the end: {none | {each: pid, name, why}}; left running: {none | unknown | {each: pid, name, why}, those of unknown owner as {n} of unknown owner, listed in raw/meta.json}[; sandbox users: {names}][; owner lookups failed: {n}][; owner lookup error: {message}][; orphans not tied to the round: {n}][; sweep not completed: {error}] -- from workings/{nn}-scope-consultant/raw/meta.json
User settings: {~/.claude/settings.json unchanged | ~/.claude/settings.json changed during the round, sha256 {before} to {after}; the user's file, not restored | not hashed: a Codex consultant}
Started by: {named by ...}; profile {well-formed | malformed: {defect}, not relied on | absent}; instruction file {name} {present, {bytes} bytes[, over the start's limit: loads in part] | missing}; requester permission {permitted | prompted, allowed | not shown before the start}; settings {as pinned | departs: {each}}, as copied in workings/{nn}-scope-consultant/assignment.md
Target state: {no difference | {n} differences, reported, none reverted}; attribution: no write outside the writable set in {sources read}, the listing of `consultant/` clean[; {n} refused attempts outside it, each a denial or marked error][; child writes not exposed by {harness}]
- {each difference, one line}
Scratch root: {none | granted, removed[; residue {what}]}
Skills and sessions seen: {none in the raw output | {what}}
Form: {as the response form | departs: {each}}
Other siblings' questions: {ids -- {entry}, a further round printed | none}
Workings: workings/{nn}-scope-consultant/
