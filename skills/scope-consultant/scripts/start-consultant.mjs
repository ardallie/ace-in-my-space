// start-consultant.mjs -- starts, waits on and stops the consultant agent of one consultation round.
// One dependency-free Node file, copied unchanged into both editions.
//
//   node start-consultant.mjs probe <launcher> [<script>]   runs "<launcher> [<script>] --version"; writes nothing
//   node start-consultant.mjs start <spec.json>            starts a detached keeper, prints pid.json once it is
//                                                          written, and returns once meta.json is written
//   node start-consultant.mjs stop <spec.json>             asks the keeper to stop the consultant now, and returns
//                                                          once meta.json is written
//   node start-consultant.mjs keep <spec.json>             the keeper itself, started by "start"
//
// spec.json, written by the requester:
//   launcher          absolute path of the program to start
//   args              its arguments, one string per element, never shell-quoted
//   cwd               the target: the consultant's working directory
//   outDir            the step's raw/ folder; it must not hold pid.json or meta.json yet
//   deadlineSec       the hard deadline, in seconds after the start
//   marker            the step folder's path: a process created since the start whose command line
//                     holds it belongs to the round
//   sweepOwnerPrefix  optional; for a Codex consultant "CodexSandbox", the sandbox user's name prefix
//   removeEnv         optional; names to remove from the environment beyond the fixed list below
//   snapEverySec      optional; seconds between process-tree snapshots, 10 by default
//
// The keeper writes into outDir: command.json (what was started, the names removed from the
// environment), stream.jsonl and stderr.txt (the consultant's raw output), pid.json, ptree.jsonl
// (process-tree snapshots) and meta.json (the end, the stop, and every process found and stopped);
// "start" adds keeper-stderr.txt, and "stop" a stop-request file.
//
// Stopping is safe by construction. At the deadline or on a stop request, the consultant's process
// tree goes. After the end, only these go, each by process id and listed in meta.json: processes seen
// in that tree (compared by process id and creation time), processes created since the start that
// hold the marker or belong to the sandbox user and whose parent is gone, and their descendants. Any
// other match is recorded in meta.json, never stopped.
//
// The Windows path (taskkill, the CIM process list, the owner query) was shown on Windows. The
// POSIX path (the consultant leads its own process group; the group is signalled; ps lists
// processes) is written but was not run.

import { spawn, spawnSync, execFileSync } from "node:child_process";
import { appendFileSync, closeSync, existsSync, openSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const WIN = process.platform === "win32";

function fail(message) {
  process.stderr.write("start-consultant: " + message + "\n");
  process.exit(2);
}
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const ms = (iso) => Date.parse(iso);
const norm = (s) => String(s || "").replace(/\\/g, "/").toLowerCase();
function writeJson(file, value) {
  writeFileSync(file + ".tmp", JSON.stringify(value, null, 2) + "\n");
  renameSync(file + ".tmp", file);
}

function readSpec(file) {
  let spec;
  try { spec = JSON.parse(readFileSync(file, "utf8")); } catch (e) { fail("cannot read the spec " + file + ": " + e.message); }
  const bad = [];
  if (typeof spec.launcher !== "string" || !spec.launcher) bad.push("launcher");
  if (!Array.isArray(spec.args) || !spec.args.every((a) => typeof a === "string")) bad.push("args");
  if (typeof spec.cwd !== "string" || !isDir(spec.cwd)) bad.push("cwd");
  if (typeof spec.outDir !== "string" || !isDir(spec.outDir)) bad.push("outDir");
  if (!(Number.isFinite(spec.deadlineSec) && spec.deadlineSec > 0)) bad.push("deadlineSec");
  if (typeof spec.marker !== "string" || spec.marker.length < 8) bad.push("marker");
  if (spec.removeEnv !== undefined && !(Array.isArray(spec.removeEnv) && spec.removeEnv.every((a) => typeof a === "string"))) bad.push("removeEnv");
  if (spec.sweepOwnerPrefix !== undefined && typeof spec.sweepOwnerPrefix !== "string") bad.push("sweepOwnerPrefix");
  if (bad.length) fail("the spec " + file + " has a missing or invalid " + bad.join(", "));
  spec.out = (name) => path.join(spec.outDir, name);
  return spec;
}

// The requester's session variables never reach the consultant: they carry its identity, a message
// channel back to it and its effort. CODEX_HOME stays: it locates the Codex configuration and sign-in.
function cleanEnv(extra) {
  const env = Object.assign({}, process.env);
  const removed = [];
  const more = new Set(extra.map((n) => n.toUpperCase()));
  for (const name of Object.keys(env)) {
    const u = name.toUpperCase();
    if (u === "CLAUDECODE" || u.startsWith("CLAUDE_CODE_") || u === "CLAUDE_EFFORT" || u === "CLAUDE_PID"
      || (u.startsWith("CODEX_") && u !== "CODEX_HOME") || more.has(u)) {
      removed.push(name);
      delete env[name];
    }
  }
  return { env, removed };
}

// Every external call is bounded, so a stalled process query can never hold off the deadline.
const LIST_MS = 60000, OWNER_MS = 180000, KILL_MS = 30000;

// Every process: { pid, ppid, name, created (ISO), cmd }.
function procs() {
  if (WIN) {
    const ps = "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,"
      + "@{n='Created';e={if ($_.CreationDate) { $_.CreationDate.ToString('o') }}},CommandLine | ConvertTo-Json -Compress";
    const text = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, windowsHide: true, timeout: LIST_MS });
    return [].concat(JSON.parse(text)).map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, name: p.Name, created: p.Created || "", cmd: p.CommandLine || "" }));
  }
  const text = execFileSync("ps", ["-A", "-o", "pid=", "-o", "ppid=", "-o", "lstart=", "-o", "args="], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: LIST_MS });
  return text.split("\n").map((line) => line.trim().match(/^(\d+)\s+(\d+)\s+(\w+\s+\w+\s+\d+\s+[\d:]+\s+\d+)\s+(.*)$/)).filter(Boolean)
    .map((m) => ({ pid: Number(m[1]), ppid: Number(m[2]), name: path.basename(m[4].split(" ")[0]), created: new Date(m[3]).toISOString(), cmd: m[4] }));
}

// Owner user names, Windows only, for the few processes asked about; a failed lookup reads "".
// Each lookup costs about a fifth of a second, so only processes the sweep could tie are asked about.
function owners(pids) {
  if (!WIN || !pids.length) return {};
  const ps = "$r = @{}; foreach ($id in @(" + pids.join(",") + ")) { $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $id); "
    + "if ($p) { $o = Invoke-CimMethod -InputObject $p -MethodName GetOwner -ErrorAction SilentlyContinue; $r[[string]$id] = [string]$o.User } }; "
    + "$r | ConvertTo-Json -Compress";
  const text = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", windowsHide: true, timeout: OWNER_MS }).trim();
  return text ? JSON.parse(text) : {};
}

function run(exe, args) {
  const r = spawnSync(exe, args, { encoding: "utf8", windowsHide: true, timeout: KILL_MS });
  return ((r.stdout || "") + (r.stderr || "")).trim() + " (exit " + r.status + (r.error ? ", " + r.error.message : "") + ")";
}
// The deadline stop: the consultant and its whole tree.
function stopTree(pid) {
  if (WIN) return run("taskkill.exe", ["/PID", String(pid), "/T", "/F"]);
  try { process.kill(-pid, "SIGTERM"); return "SIGTERM to group " + pid; } catch (e) { return "SIGTERM to group " + pid + ": " + e.code; }
}
// After the end: one listed process only, so every process stopped is one meta.json names.
function stopOne(pid) {
  if (WIN) return run("taskkill.exe", ["/PID", String(pid), "/F"]);
  try { process.kill(pid, "SIGKILL"); return "SIGKILL"; } catch (e) { return "SIGKILL: " + e.code; }
}

function probe(launcher, script) {
  if (!launcher) fail("usage: probe <launcher> [<script>]");
  const r = spawnSync(launcher, script ? [script, "--version"] : ["--version"], { encoding: "utf8", windowsHide: true, timeout: 60000, env: cleanEnv([]).env, stdio: ["ignore", "pipe", "pipe"] });
  if (r.error) fail("cannot run " + launcher + ": " + r.error.message);
  process.stdout.write((r.stdout || "") + (r.stderr || "") + "exit " + r.status + "\n");
  process.exit(r.status === 0 ? 0 : 1);
}

function keep(specFile) {
  const spec = readSpec(specFile);
  const out = spec.out;
  if (existsSync(out("pid.json")) || existsSync(out("meta.json"))) fail("outDir already holds pid.json or meta.json: a round starts once");
  const { env, removed } = cleanEnv(spec.removeEnv || []);
  const started = new Date();
  const t0 = started.getTime();
  writeJson(out("command.json"), {
    launcher: spec.launcher, args: spec.args, cwd: spec.cwd, removedEnv: removed, stdin: "closed",
    deadlineSec: spec.deadlineSec, marker: spec.marker, sweepOwnerPrefix: spec.sweepOwnerPrefix || null,
    keeperPid: process.pid, started: started.toISOString(), node: process.version, platform: process.platform,
  });
  const so = openSync(out("stream.jsonl"), "w");
  const se = openSync(out("stderr.txt"), "w");
  // Windows: a plain child, so it also dies with the keeper. POSIX: its own process group, stopped as one.
  const child = spawn(spec.launcher, spec.args, { cwd: spec.cwd, env, stdio: ["ignore", so, se], windowsHide: true, detached: !WIN });
  closeSync(so);
  closeSync(se);
  if (child.pid) writeJson(out("pid.json"), { keeperPid: process.pid, pid: child.pid, started: started.toISOString() });

  const seen = new Map(); // pid -> the process as first seen in the consultant's tree, with goneBy once found gone
  let ended = false, finishing = false, exit = null, spawnError = null, stoppedBy = null, stopResult = null;
  let lastSnap = 0;
  const spawnedAt = Date.now();
  const brief = (p) => ({ pid: p.pid, ppid: p.ppid, name: p.name, created: p.created, cmd: p.cmd.slice(0, 400) });
  const isRoot = (p) => p.pid === child.pid && ms(p.created) >= t0 - 1000 && ms(p.created) <= spawnedAt + 1000;
  const liveParent = (p, byPid) => { const l = byPid.get(p.ppid); return l && ms(l.created) <= ms(p.created) ? l : null; };
  // A parent that no longer runs but was seen in the tree: older than p, and not yet found gone when p
  // was created (a later child of that pid is another process's).
  const deadSeenParent = (p) => {
    const s = seen.get(p.ppid);
    return s && ms(s.created) <= ms(p.created) && !(s.goneBy && ms(p.created) > s.goneBy) ? s : null;
  };

  // The consultant and its descendants, a process whose parent is gone included where that parent was
  // in the tree; every link is checked by creation time against pid reuse.
  function treeOf(all) {
    const byPid = new Map(all.map((p) => [p.pid, p]));
    const tree = new Map();
    for (const p of all) if (isRoot(p) || (seen.has(p.pid) && seen.get(p.pid).created === p.created)) tree.set(p.pid, p);
    for (let grew = true; grew;) {
      grew = false;
      for (const p of all) {
        if (tree.has(p.pid) || p.pid === p.ppid) continue;
        const live = liveParent(p, byPid);
        if (live ? tree.has(live.pid) : deadSeenParent(p)) { tree.set(p.pid, p); grew = true; }
      }
    }
    return [...tree.values()];
  }
  function snap(label) {
    lastSnap = Date.now();
    let all;
    try { all = procs(); } catch (e) {
      appendFileSync(out("ptree.jsonl"), JSON.stringify({ t: new Date().toISOString(), label, error: e.message }) + "\n");
      return;
    }
    const listed = Date.now();
    const keys = new Set(all.map((p) => p.pid + "|" + p.created));
    for (const s of seen.values()) if (!s.goneBy && !keys.has(s.pid + "|" + s.created)) s.goneBy = listed;
    const tree = treeOf(all);
    for (const p of tree) if (!seen.has(p.pid)) seen.set(p.pid, brief(p));
    appendFileSync(out("ptree.jsonl"), JSON.stringify({ t: new Date().toISOString(), label, procs: tree.map(brief) }) + "\n");
  }

  function stopNow(reason) {
    if (ended || stoppedBy) return;
    stoppedBy = reason;
    snap("before the stop");
    stopResult = stopTree(child.pid);
    setTimeout(() => finish("no exit event within 30 s of the stop"), 30000);
  }

  // After the end: stop what is left of the tree, then sweep what the round can be tied to.
  function sweep(meta) {
    if (!WIN && child.pid) {
      // The consultant's process group holds only the round's processes; whatever is left in it goes.
      try { process.kill(-child.pid, "SIGKILL"); meta.groupKilled = true; } catch { meta.groupKilled = false; }
    }
    const all = procs();
    const byPid = new Map(all.map((p) => [p.pid, p]));
    const survivors = treeOf(all).filter((p) => p.pid !== process.pid);
    meta.survivors = survivors.map((p) => Object.assign(brief(p), { result: stopOne(p.pid) }));
    const done = new Set(survivors.map((p) => p.pid));
    const marker = norm(spec.marker);
    const self = norm(SELF);
    // Candidates: created since the start, and none of the keeper, its parent, its helpers or a runner call.
    const fresh = all.filter((p) => ms(p.created) >= t0 && !done.has(p.pid) && p.pid !== process.pid && p.pid !== process.ppid
      && p.ppid !== process.pid && !norm(p.cmd).includes(self));
    // Only a process whose parent is gone can be tied by marker or owner, so only those are asked about.
    const orphans = fresh.filter((p) => !liveParent(p, byPid));
    let own = {};
    if (spec.sweepOwnerPrefix && WIN) {
      const ask = orphans.filter((p) => !norm(p.cmd).includes(marker)).map((p) => p.pid);
      own = owners(ask);
      meta.ownerLookups = ask.length;
      meta.ownerLookupsFailed = ask.filter((pid) => !own[String(pid)]).length;
    }
    const why = (p) => norm(p.cmd).includes(marker) ? "holds the marker"
      : spec.sweepOwnerPrefix && String(own[String(p.pid)] || "").startsWith(spec.sweepOwnerPrefix) ? "owned by " + own[String(p.pid)] : null;
    // Tied: a matching process whose parent is gone, and every descendant of a tied process.
    const tied = new Map();
    for (const p of orphans) {
      const w = why(p);
      if (w) tied.set(p.pid, Object.assign(brief(p), { why: w + (deadSeenParent(p) ? ", parent was in the tree" : ", parent gone") }));
    }
    for (let grew = true; grew;) {
      grew = false;
      for (const p of fresh) {
        const live = liveParent(p, byPid);
        if (!tied.has(p.pid) && live && tied.has(live.pid)) { tied.set(p.pid, Object.assign(brief(p), { why: "child of " + live.pid })); grew = true; }
      }
    }
    meta.swept = [...tied.values()].map((p) => Object.assign(p, { result: stopOne(p.pid) }));
    meta.notStopped = fresh.filter((p) => !tied.has(p.pid) && why(p))
      .map((p) => Object.assign(brief(p), { why: why(p) + ", parent " + p.ppid + " still runs outside the tree" }));
    const stopped = [...meta.survivors, ...meta.swept];
    const after = stopped.length ? procs() : [];
    meta.left = after.filter((p) => stopped.some((q) => q.pid === p.pid && q.created === p.created)).map(brief);
  }

  function finish(note) {
    if (finishing) return;
    finishing = true;
    clearTimeout(deadline);
    clearInterval(poll);
    const end = new Date();
    const meta = {
      pid: child.pid || null, keeperPid: process.pid, started: started.toISOString(), ended: end.toISOString(),
      elapsedSec: (end.getTime() - t0) / 1000, exit, spawnError, deadlineSec: spec.deadlineSec,
      killedAtDeadline: stoppedBy === "the hard deadline", stoppedBy, stopResult, note: note || null,
      seen: [...seen.values()],
    };
    try { sweep(meta); } catch (e) { meta.checkError = e.message; }
    writeJson(out("meta.json"), meta);
    process.exit(0);
  }

  child.on("error", (e) => { spawnError = e.message; ended = true; finish(); });
  child.on("exit", (code, signal) => { ended = true; exit = { code, signal }; setTimeout(() => finish(), 5000); });
  const deadline = setTimeout(() => stopNow("the hard deadline"), spec.deadlineSec * 1000);
  const snapEvery = 1000 * (spec.snapEverySec || 10);
  const poll = setInterval(() => {
    if (ended || finishing) return;
    if (existsSync(out("stop-request"))) stopNow("a stop request");
    else if (Date.now() - lastSnap >= snapEvery) snap("periodic");
  }, 1000);
  setTimeout(() => { if (!ended) snap("start"); }, 2000);
  lastSnap = Date.now();
}

// Waits for meta.json, printing pid.json once; fails where the keeper is gone without one.
function waitForMeta(spec, keeperPid, giveUpAt) {
  const out = spec.out;
  let pidShown = false;
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
  const tick = setInterval(() => {
    if (!pidShown && existsSync(out("pid.json"))) { process.stdout.write("pid.json " + readFileSync(out("pid.json"), "utf8")); pidShown = true; }
    if (existsSync(out("meta.json"))) {
      clearInterval(tick);
      const m = JSON.parse(readFileSync(out("meta.json"), "utf8"));
      process.stdout.write("meta.json " + JSON.stringify({
        exit: m.exit, spawnError: m.spawnError, stoppedBy: m.stoppedBy, elapsedSec: m.elapsedSec,
        survivors: (m.survivors || []).length, swept: (m.swept || []).length, notStopped: (m.notStopped || []).length,
        left: (m.left || []).length, checkError: m.checkError || null,
      }) + "\n");
      process.exit(0);
    }
    if (!alive(keeperPid) && !existsSync(out("meta.json"))) { clearInterval(tick); fail("the keeper " + keeperPid + " ended without writing meta.json"); }
    if (Date.now() > giveUpAt) { clearInterval(tick); fail("no meta.json in time; the keeper " + keeperPid + " still runs"); }
  }, 1000);
}

function start(specFile) {
  const spec = readSpec(specFile);
  if (existsSync(spec.out("pid.json")) || existsSync(spec.out("meta.json"))) fail("outDir already holds pid.json or meta.json: a round starts once");
  // Detached, so the keeper and the deadline it holds outlive a lost requester.
  const errors = openSync(spec.out("keeper-stderr.txt"), "a");
  const keeper = spawn(process.execPath, [SELF, "keep", path.resolve(specFile)], { detached: true, stdio: ["ignore", "ignore", errors], windowsHide: true });
  closeSync(errors);
  keeper.unref();
  waitForMeta(spec, keeper.pid, Date.now() + (spec.deadlineSec + 600) * 1000);
}

function stop(specFile) {
  const spec = readSpec(specFile);
  if (existsSync(spec.out("meta.json"))) { process.stdout.write("meta.json already written: the consultant has ended\n"); process.exit(0); }
  if (!existsSync(spec.out("pid.json"))) fail("no pid.json in " + spec.outDir + ": nothing was started there");
  const { keeperPid } = JSON.parse(readFileSync(spec.out("pid.json"), "utf8"));
  writeFileSync(spec.out("stop-request"), new Date().toISOString() + "\n");
  waitForMeta(spec, keeperPid, Date.now() + 600 * 1000);
}

const [command, a, b] = process.argv.slice(2);
if (command === "probe") probe(a, b);
else if (command === "start" && a) start(a);
else if (command === "stop" && a) stop(a);
else if (command === "keep" && a) keep(a);
else fail("usage: probe <launcher> [<script>] | start <spec.json> | stop <spec.json>");
