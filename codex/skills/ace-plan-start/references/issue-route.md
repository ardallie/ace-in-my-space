# Issue route — fetch, classify, stage

Executed from `$ace:ace-plan-start` Phase 1 (`../ace-plan-start/SKILL.md`) when the
resolved input is a GitHub issue.

1. **Single fetch.** `gh issue view <n> --json title,body,state,comments` (the `$ace:ace-plan-read` field set), captured once — e.g. redirected to a scratch file — with body, title, and comments all served from that one response; nothing downstream re-fetches. If the fetch fails or the issue does not exist, report the `gh` error and stop. If the trimmed body is empty, stop and report that issue #{n} has an empty body — the content is missing and must be restored on the issue before the run can continue (the same stance as `$ace:ace-plan-read`'s empty-body guard). If the state is `CLOSED`, emit a one-line note and continue.
2. **Classify.** Test the issue against four classification sets in order; the first matching set wins.
   - **Pre-planner report** — any of:
     - (a) the body's first 25 lines contain a `Type: pre-planner` line;
     - (b) the body's first non-blank line is `# Pre-plan analysis`;
     - (c) the title starts with `[PRE-PLANNER] `.
     - Disposition: continue — step 3 stages it under the pre-planner filename.
   - **Published plan** — any of:
     - (a) the body's first 25 lines contain a `Type: plan` line;
     - (b) the body contains a `## Validation audit` H2;
     - (c) the title starts with `[PLAN] `.
     - Disposition: stop with the redirect — `Issue #{n} is a published plan, not a brief. Use $ace:ace-plan-read <n> to load it, $ace:ace-plan-validate <n> to validate it, or $ace:ace-plan-implement <n> to implement it.`
     - Rationale: drafting a brand-new plan whose brief is an existing plan is always a mistyped command. This three-arm published-plan test is canonical here; `../ace-pr-create/SKILL.md` step 5 carries an aligned copy for its `Closes #<n>` gate, and an amendment to either arm-set lands in both files.
   - **Review report** — any of:
     - (a) the body's first 25 lines contain a `Type: arch-review` or `Type: code-review` line;
     - (b) the body's first non-blank line is `# Architectural review` or `# Agent code review report` (the producers' skeleton H1 constants — a legacy report predating the `Type:` header contract publishes with neither header nor title prefix and would otherwise classify as a plain brief);
     - (c) the title starts with `[ARCH REVIEW] ` or `[CODE REVIEW] `.
     - Disposition: stop with the redirect — `Issue #{n} is a review report, not a brief. Run $ace:ace-report-triage <n> to act on its findings, or $ace:ace-agent-pre-planner <n> to derive a plan brief from it.`
     - Rationale: a review report staged as free text loses its structured severity findings and triage routing.
   - **Scope envelope** — any of:
     - (a) the body's first 25 lines contain a `Type: scope` line;
     - (b) the body's first non-blank line is `# Scope envelope`;
     - (c) the title starts with `[SCOPE] `.
     - Disposition: stop with the redirect — `Issue #{n} is a scope envelope, not a plan brief. Run $ace:ace-agent-pre-planner <n> (scoped per stage via the envelope's printed Scope: directives) to derive a plan brief from it.`
     - Rationale: an envelope's staged split is advisory by contract, and staging it as free text would hand the drafter that split as if it were a plan spec, skipping the pre-planner boundary the envelope itself declares.
   - Cross-set rules:
     - Body checks lead in all four sets because published bodies are immutable while titles are legitimately renamed (e.g. a work-packaging retitle); the Type-header and title-prefix arms cannot jointly miss a pipeline-produced report.
     - The plan set's content arm (a `## Validation audit` H2 anywhere in the body) is the one loose match: a review report whose body quotes that heading classifies as a plan first and stops with the plan redirect — a deliberate, recoverable edge (both branches stop the run; the cost is one misdirected redirect message).
     - No match on any set — the issue is a **plain brief**.
3. **Stage.** Use `apply_patch` to write the body field verbatim to `.ace/plans/{yyyyMMdd}-{HHmm}-ace-agent-pre-planner-issue{n}-{8hex}-staged.md` (pre-planner) or `.ace/plans/{yyyyMMdd}-{HHmm}-issue{n}-{8hex}-staged.md` (plain brief) — current local time, a fresh 8-hex per the snippet in `../plan-shared/identifiers.md`. If the write fails, report and stop — do not proceed against a partial staged file. Refuse to overwrite: if the path exists, append `-2`, `-3`, ... to the `-staged` suffix until a free name is found, mirroring `$ace:ace-plan-update`. When the issue has comments, append them to the staged file after the body: a blank line, `---`, a blank line, an `## Issue comments` H2, then one `### {author} — {timestamp}` subsection per comment in chronological order, each body verbatim. The staged file is a transport artefact serving the drafter's by-reference `Source:` contract — not a second source of truth; it stays on disk after the run as the input record.
4. **Hand off.** The staged path is the resolved input for all later phases and carries its classification (the pre-planner staged filename matches the `*-agent-pre-planner-*` detection glob by construction). Hold the issue URL — the Phase 2 header, the Phase 3 write-back, and the Phase 10 reverse link all use it.
