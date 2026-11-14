// start-consultant.mjs -- starts, waits on and stops the consultant agent of one consultation round.
// One dependency-free Node file, copied unchanged into both editions.
//
//   node start-consultant.mjs probe <launcher> [<script>]   runs "<launcher> [<script>] --version"; writes nothing
//   node start-consultant.mjs start <spec.json>            starts a detached keeper, prints pid.json once it is
//                                                          written, and returns once meta.json is written
//   node start-consultant.mjs stop <spec.json>             asks the keeper to stop the consultant now, and returns
//                                                          once meta.json is written
//   node start-consultant.mjs wait <spec.json>             waits again on the keeper, after a yielded wait, and
//                                                          returns once meta.json is written; starts and stops nothing
//   node start-consultant.mjs keep <spec.json>             the keeper itself, started by "start"
//
// spec.json, written by the requester:
//   launcher          absolute path of the program to start; on Windows, a POSIX shell's "/c/..." form of it,
//                     of cwd, outDir, marker or a whole args element is taken as "C:/..." (nativePath)
//   args              its arguments, one string per element, never shell-quoted
//   cwd               the target: the consultant's working directory
//   outDir            the step's raw/ folder; it must not hold pid.json or meta.json yet
//   deadlineSec       the hard deadline, in seconds after the start
//   marker            the step folder's path: a process created since the start whose command line
//                     holds it may be the round's; how the sweep treats one is decideSweep's (below)
//   sandboxUserPrefix optional; for a Codex consultant "CodexSandbox": an owner of a process seen in the
//                     consultant's tree whose user name begins so, other than the keeper's own user, is a
//                     sandbox user of the round
//   keepEnv           optional; secret-named variables the launcher signs in with, kept
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
// in that tree (compared by process id and creation time); processes created since the keeper started
// whose parent is gone and, on Codex, whose owner is exactly a sandbox user of the round, never a
// name-prefix match, with each descendant whose owner is too; on Claude Code, those that hold the
// marker, and their descendants. Each swept process is checked again by process id and creation time
// just before its stop. Any other process created since the start that holds the marker, or whose
// parent is gone and whose owner's name begins with the prefix, is recorded in meta.json as not
// stopped, as is each child of a stopped process that its owner does not tie and each orphan whose
// owner lookup failed; so is every descendant of a process recorded so, never stopped through it.
// A process recorded so and gone by the last listing moves to goneBeforeStop. The rest of the orphans
// it neither stops nor records are counted.
//
// The Windows path (taskkill, the CIM process list, the owner query) was shown on Windows. The
// POSIX path (the consultant leads its own process group; the group is signalled; ps lists
// processes) is written but was not run.

import { spawn, spawnSync, execFileSync } from "node:child_process";
import { appendFileSync, closeSync, existsSync, openSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
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
// A path's spellings to look for in a command line, normalised: as given, and, for a drive path, its POSIX
// shell form too ("c:/a" and "/c/a"), since a process started from Git Bash may carry either.
export const spellings = (s) => { const n = norm(s); const m = /^([a-z]):\/(.*)$/s.exec(n); return m ? [n, "/" + m[1] + "/" + m[2]] : [n]; };
// On Windows, a POSIX shell's drive path ("/c/Users/...", as Git Bash's which prints it), which a
// Windows program cannot open, in the drive form it can ("C:/Users/..."); any other value unchanged. Only a
// whole value with a slash after the letter converts, so "//c/..." rule strings and "/T" switches stay.
export const nativePath = (p, win = WIN) => {
  if (!win || typeof p !== "string") return p;
  const m = /^\/([a-zA-Z])\/(.*)$/s.exec(p);
  return m ? m[1].toUpperCase() + ":/" + m[2] : p;
};
const brief = (p) => ({ pid: p.pid, ppid: p.ppid, name: p.name, created: p.created, cmd: String(p.cmd || "").slice(0, 400) });
// The process now holding p's parent id, where it was created no later than p (a later one reuses the id).
const liveParent = (p, byPid) => { const l = byPid.get(p.ppid); return l && ms(l.created) <= ms(p.created) ? l : null; };
function writeJson(file, value) {
  writeFileSync(file + ".tmp", JSON.stringify(value, null, 2) + "\n");
  renameSync(file + ".tmp", file);
}

function readSpec(file) {
  let spec;
  try { spec = JSON.parse(readFileSync(file, "utf8")); } catch (e) { fail("cannot read the spec " + file + ": " + e.message); }
  // Paths a POSIX shell wrote in its drive form are converted once, here, and each conversion recorded.
  spec.converted = [];
  const conv = (v, at) => { const n = nativePath(v); if (n !== v) spec.converted.push({ at, from: v, to: n }); return n; };
  for (const k of ["launcher", "cwd", "outDir", "marker"]) spec[k] = conv(spec[k], k);
  if (Array.isArray(spec.args)) spec.args = spec.args.map((a, i) => conv(a, "args[" + i + "]"));
  const bad = [];
  if (typeof spec.launcher !== "string" || !spec.launcher) bad.push("launcher");
  if (!Array.isArray(spec.args) || !spec.args.every((a) => typeof a === "string")) bad.push("args");
  if (typeof spec.cwd !== "string" || !isDir(spec.cwd)) bad.push("cwd");
  if (typeof spec.outDir !== "string" || !isDir(spec.outDir)) bad.push("outDir");
  if (!(Number.isFinite(spec.deadlineSec) && spec.deadlineSec > 0)) bad.push("deadlineSec");
  if (typeof spec.marker !== "string" || spec.marker.length < 8) bad.push("marker");
  if (spec.removeEnv !== undefined && !(Array.isArray(spec.removeEnv) && spec.removeEnv.every((a) => typeof a === "string"))) bad.push("removeEnv");
  if (spec.keepEnv !== undefined && !(Array.isArray(spec.keepEnv) && spec.keepEnv.every((a) => typeof a === "string"))) bad.push("keepEnv");
  if (spec.sandboxUserPrefix !== undefined && typeof spec.sandboxUserPrefix !== "string") bad.push("sandboxUserPrefix");
  if (spec.sweepOwnerPrefix !== undefined) bad.push("sweepOwnerPrefix (now sandboxUserPrefix)");
  if (bad.length) fail("the spec " + file + " has a missing or invalid " + bad.join(", "));
  spec.out = (name) => path.join(spec.outDir, name);
  return spec;
}

// A secret-named variable, by its upper-cased name u, that the kept set does not hold.
export const secretName = (u, keep) => /TOKEN|KEY|SECRET|PASSWORD/.test(u) && !keep.has(u);

// The requester's session variables never reach the consultant: they carry its identity, a message
// channel back to it and its effort. CODEX_HOME stays: it locates the Codex configuration and sign-in.
// Names holding TOKEN, KEY, SECRET or PASSWORD go too, but the ones the spec's keepEnv names for its
// own launcher's sign-in, so the owner's secrets never reach the consultant's commands.
function cleanEnv(extra, keepEnv = []) {
  const env = Object.assign({}, process.env);
  const removed = [];
  const more = new Set(extra.map((n) => n.toUpperCase()));
  const keep = new Set(keepEnv.map((n) => n.toUpperCase()));
  for (const name of Object.keys(env)) {
    const u = name.toUpperCase();
    if (u === "CLAUDECODE" || u.startsWith("CLAUDE_CODE_") || u === "CLAUDE_EFFORT" || u === "CLAUDE_PID"
      || (u.startsWith("CODEX_") && u !== "CODEX_HOME") || more.has(u) || secretName(u, keep)) {
      removed.push(name);
      delete env[name];
    }
  }
  return { env, removed };
}

// Every external call is bounded, so a stalled process query delays the deadline stop by at most one snapshot.
const LIST_MS = 60000, OWNER_MS = 180000, KILL_MS = 30000;
// A snapshot's owner lookup is bounded tighter and asks about few processes, since it can delay the deadline stop.
const SNAP_OWNER_MS = 15000, SNAP_OWNER_MAX = 16;

// Every process: { pid, ppid, name, created (ISO), cmd }.
export function procs() {
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

// The owners kept from a lookup: found holds, per pid, the owner (o) and the creation time (c) of the
// process that held that pid at the lookup; an owner is kept only where c equals the listed process's
// creation time, else "" (the pid was reused, or the process was not found).
export function ownersMatched(found, list) {
  const kept = {};
  for (const p of list) {
    const f = found && found[String(p.pid)];
    kept[String(p.pid)] = f && f.c === p.created ? String(f.o || "") : "";
  }
  return kept;
}

// Owner names as Domain\User, Windows only, for the few processes asked about, each given as { pid, created };
// a failed lookup reads "". Each lookup costs about a fifth of a second, so only the tree's new processes and
// the processes the sweep could tie are asked about.
export function owners(list, timeoutMs = OWNER_MS) {
  if (!WIN || !list.length) return {};
  const ps = "$r = @{}; foreach ($id in @(" + list.map((p) => Number(p.pid)).join(",") + ")) { $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $id); "
    + "if ($p) { $o = Invoke-CimMethod -InputObject $p -MethodName GetOwner -ErrorAction SilentlyContinue; "
    + "$r[[string]$id] = @{ o = $(if ($o.User) { if ($o.Domain) { [string]$o.Domain + '\\' + [string]$o.User } else { [string]$o.User } } else { '' }); "
    + "c = $(if ($p.CreationDate) { $p.CreationDate.ToString('o') } else { '' }) } } }; "
    + "$r | ConvertTo-Json -Compress -Depth 3";
  const text = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8", windowsHide: true, timeout: timeoutMs }).trim();
  return ownersMatched(text ? JSON.parse(text) : {}, list);
}

// An owner in the one form compared: Domain\User, lower-cased.
export const ownerKey = (o) => String(o || "").toLowerCase();
// The user part of an owner, lower-cased: the text after its last backslash.
export const userPart = (o) => ownerKey(o).split(String.fromCharCode(92)).pop();

// The round's sandbox users: owners seen on its tree whose user part begins with the prefix, the keeper's own user excluded.
export function sandboxUsersOf(ownersSeen, prefix, selfUser) {
  if (!prefix) return [];
  const pre = prefix.toLowerCase(), me = String(selfUser).toLowerCase();
  const keys = ownersSeen.filter((o) => o).map(ownerKey).filter((k) => userPart(k).startsWith(pre) && userPart(k) !== me);
  return [...new Set(keys)].sort();
}

// What the sweep stops (tied) and lists without stopping (notStopped), from the processes created since the
// start, and how many orphans it does neither with (untied).
export function decideSweep({ fresh, all, marker, owners, sandboxUsers, prefix, parentWasInTree = () => false }) {
  const byPid = new Map(all.map((p) => [p.pid, p]));
  const marks = spellings(marker);
  const pre = prefix ? prefix.toLowerCase() : "";
  const ownerOf = (p) => owners[String(p.pid)] || "";
  const entry = (p, why) => { const o = ownerOf(p); return Object.assign(brief(p), { why }, o ? { owner: o } : {}); };
  const orphans = fresh.filter((p) => !liveParent(p, byPid));
  const holds = (p) => { const c = norm(p.cmd); return marks.some((m) => c.includes(m)); };
  const sandboxOwned = (p) => !!ownerOf(p) && sandboxUsers.includes(ownerKey(ownerOf(p)));
  const sandboxWhy = (p) => "owned by " + ownerOf(p) + ", a sandbox user of the round's tree";
  const tail = (p) => parentWasInTree(p) ? ", parent was in the tree" : ", parent gone";
  // Tied: on Codex (a prefix set), an orphan owned exactly by a sandbox user of the round, and each descendant
  // of a tied process owned so too; on Claude Code, an orphan holding the marker, and every descendant of a tied process.
  const tied = new Map();
  const listed = new Map(); // pid -> entry, each process listed once
  // Every listed process seeds belowListed, so each of its descendants is listed too, never tied through it.
  // The line it heads gives its descendants' why: "round" below a child of a tied process (the round's own,
  // why "descendant of ..."), "unknown" below an orphan whose owner lookup failed (why "owner unknown: ...",
  // counted on the record), and "other" below any other listed process, not known to be the round's.
  const belowListed = new Map(); // pid -> { line, head }
  const list = (p, why, line) => {
    if (listed.has(p.pid)) return false;
    listed.set(p.pid, entry(p, why)); belowListed.set(p.pid, { line, head: p.pid }); return true;
  };
  for (const p of orphans) {
    if (!pre) {
      if (holds(p)) tied.set(p.pid, entry(p, "holds the marker" + tail(p)));
    } else if (sandboxOwned(p)) {
      tied.set(p.pid, entry(p, (holds(p) ? "holds the marker, " : "") + sandboxWhy(p) + tail(p)));
    } else if (!ownerOf(p)) {
      list(p, "owner unknown: its lookup failed", "unknown");
    } else if (holds(p)) {
      list(p, "holds the marker, owned by " + ownerOf(p) + ": not a sandbox user of the round", "other");
    } else if (userPart(ownerOf(p)).startsWith(pre)) {
      list(p, "owned by " + ownerOf(p) + ", a sandbox user not seen on the round's tree", "other");
    }
  }
  const belowWhy = (p, live, { line, head }) => line === "round"
    ? "descendant of " + live.pid + ", below " + head + ", a child of a stopped process, not stopped"
    : line === "unknown"
      ? (ownerOf(p) ? "owned by " + ownerOf(p) + ", not known to be the round's: descendant of " + live.pid + ", below orphan " + head + ", whose owner lookup failed, not stopped"
        : "owner unknown: descendant of " + live.pid + ", below orphan " + head + ", whose owner lookup failed, not stopped")
      : "below " + head + ", listed not stopped and not known to be the round's: descendant of " + live.pid + ", not stopped";
  const spread = () => {
    for (let grew = true; grew;) {
      grew = false;
      for (const p of fresh) {
        if (tied.has(p.pid) || listed.has(p.pid)) continue;
        const live = liveParent(p, byPid);
        if (!live) continue;
        const above = belowListed.get(live.pid);
        if (above) {
          // Below a listed process: never tied through it, but listed, so no process below it goes unreported.
          listed.set(p.pid, entry(p, belowWhy(p, live, above))); belowListed.set(p.pid, above); grew = true;
          continue;
        }
        if (!tied.has(live.pid)) continue;
        if (!pre) { tied.set(p.pid, entry(p, "child of " + live.pid)); grew = true; }
        else if (sandboxOwned(p)) { tied.set(p.pid, entry(p, "child of " + live.pid + ", " + sandboxWhy(p))); grew = true; }
        // Not tied, so its own children are not tied through it; they are listed below it.
        else { list(p, "child of " + live.pid + ", owned by " + (ownerOf(p) || "an unknown owner") + ": not a sandbox user of the round, not stopped", "round"); grew = true; }
      }
    }
  };
  spread();
  let more = false;
  for (const p of fresh) {
    if (!tied.has(p.pid) && liveParent(p, byPid) && holds(p)) more = list(p, "holds the marker, parent " + p.ppid + " still runs outside the tree", "other") || more;
  }
  if (more) spread();
  const untied = orphans.filter((p) => !tied.has(p.pid) && !listed.has(p.pid)).length;
  return { tied: [...tied.values()], notStopped: [...listed.values()], untied };
}

// The round's own among the listed: a child of a tied process and each process below one, by why.
export const roundsOwn = (entry) => /^(child of|descendant of) /.test(String(entry.why || ""));

// Settled against the last listing (final): each listed process gone from it moves to gone, left holds
// each stopped process still in it, with why "still running after its stop", and each process below a
// stopped one that the sweep's own listing (seen) did not hold -- started after it -- is listed, never stopped.
export function settleLeft({ notStopped, stopped, final, seen = [] }) {
  const still = stillSame(notStopped, final);
  const keys = new Set(still.map((p) => p.pid + "|" + p.created));
  const gone = notStopped.filter((p) => !keys.has(p.pid + "|" + p.created))
    .map((p) => Object.assign({}, p, { result: "listed not stopped, gone by the last listing: not left running" }));
  const left = stillSame(final, stopped).map((p) => Object.assign(brief(p), { why: "still running after its stop" }));
  const known = new Set([...seen, ...stopped, ...notStopped].map((p) => p.pid + "|" + p.created));
  const above = new Map(stopped.map((p) => [p.pid, p]));
  const late = [];
  for (let grew = true; grew;) {
    grew = false;
    for (const p of final) {
      const k = p.pid + "|" + p.created;
      const parent = above.get(p.ppid);
      if (known.has(k) || !parent || ms(parent.created) > ms(p.created)) continue;
      known.add(k); above.set(p.pid, p); grew = true;
      late.push(Object.assign(brief(p), { why: "child of " + p.ppid + ", created after the sweep's listing, not stopped" }));
    }
  }
  return { notStopped: still.concat(late), gone, left };
}

// The listed processes still running as listed: the same process id and creation time in current.
export function stillSame(listed, current) {
  const keys = new Set(current.map((p) => p.pid + "|" + p.created));
  return listed.filter((p) => keys.has(p.pid + "|" + p.created));
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
  launcher = nativePath(launcher);
  script = nativePath(script);
  const r = spawnSync(launcher, script ? [script, "--version"] : ["--version"], { encoding: "utf8", windowsHide: true, timeout: 60000, env: cleanEnv([]).env, stdio: ["ignore", "pipe", "pipe"] });
  if (r.error) fail("cannot run " + launcher + ": " + r.error.message);
  process.stdout.write((r.stdout || "") + (r.stderr || "") + "exit " + r.status + "\n");
  process.exit(r.status === 0 ? 0 : 1);
}

function keep(specFile) {
  const spec = readSpec(specFile);
  const out = spec.out;
  if (existsSync(out("pid.json")) || existsSync(out("meta.json"))) fail("outDir already holds pid.json or meta.json: a round starts once");
  const { env, removed } = cleanEnv(spec.removeEnv || [], spec.keepEnv || []);
  const started = new Date();
  const t0 = started.getTime();
  writeJson(out("command.json"), {
    launcher: spec.launcher, args: spec.args, cwd: spec.cwd, pathsConverted: spec.converted, removedEnv: removed, keepEnv: spec.keepEnv || [], stdin: "closed",
    deadlineSec: spec.deadlineSec, marker: spec.marker, sandboxUserPrefix: spec.sandboxUserPrefix || null,
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
  // lastSnap: when the last snapshot began; lastSnapDone: when the last one returned, a failed one included.
  let lastSnap = 0, lastSnapDone = 0, treeOwnerLookupsFailed = 0;
  const snapEvery = 1000 * (spec.snapEverySec || 10);
  const spawnedAt = Date.now();
  const isRoot = (p) => p.pid === child.pid && ms(p.created) >= t0 - 1000 && ms(p.created) <= spawnedAt + 1000;
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
  // A snapshot; its owner lookup runs only where lookups is true.
  function snap(label, lookups = true) {
    lastSnap = Date.now();
    try { takeSnap(label, lookups); } finally { lastSnapDone = Date.now(); }
  }
  function takeSnap(label, lookups) {
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
    const seenAs = (p) => { const s = seen.get(p.pid); return s && s.created === p.created ? s : null; };
    let ownerError = null;
    // The owners of the tree's processes, each looked up once, are what the sweep reads the round's sandbox users from.
    if (lookups && spec.sandboxUserPrefix && WIN) {
      const ask = tree.filter((p) => { const s = seenAs(p); return s && !("owner" in s); }).slice(0, SNAP_OWNER_MAX);
      if (ask.length) {
        let found = {};
        try { found = owners(ask, SNAP_OWNER_MS); } catch (e) { ownerError = e.message; }
        for (const { pid } of ask) {
          const s = seen.get(pid);
          s.owner = ownerError ? "" : found[String(pid)] || "";
          if (!s.owner) treeOwnerLookupsFailed++;
        }
      }
    }
    const line = { t: new Date().toISOString(), label, procs: tree.map((p) => {
      const s = seenAs(p);
      return s && s.owner ? Object.assign(brief(p), { owner: s.owner }) : brief(p);
    }) };
    if (ownerError) line.ownerError = ownerError;
    appendFileSync(out("ptree.jsonl"), JSON.stringify(line) + "\n");
  }

  function stopNow(reason) {
    if (ended || stoppedBy) return;
    stoppedBy = reason;
    // No owner lookup here, and none at all where a snapshot returned within the last snapEvery, so the
    // stop waits on little more than a snapshot already in flight.
    if (Date.now() - lastSnapDone >= snapEvery) snap("before the stop", false);
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
    const selves = spellings(SELF);
    // Candidates: created since the start, and none of the keeper, its parent, its helpers or a runner call.
    const fresh = all.filter((p) => ms(p.created) >= t0 && !done.has(p.pid) && p.pid !== process.pid && p.pid !== process.ppid
      && p.ppid !== process.pid && !selves.some((s) => norm(p.cmd).includes(s)));
    // Only a process whose parent is gone, or a descendant of one, can be tied, so only those are asked about:
    // every orphan, marker holders included, and each fresh process whose chain of live parents within fresh
    // reaches an orphan.
    let own = {};
    if (spec.sandboxUserPrefix && WIN) {
      const closure = new Set(fresh.filter((p) => !liveParent(p, byPid)).map((p) => p.pid));
      for (let grew = true; grew;) {
        grew = false;
        for (const p of fresh) {
          const live = liveParent(p, byPid);
          if (!closure.has(p.pid) && live && closure.has(live.pid)) { closure.add(p.pid); grew = true; }
        }
      }
      const ask = fresh.filter((p) => closure.has(p.pid));
      // A lookup that fails as a whole is recorded, and the marker test, the decision and the listing still run.
      try { own = owners(ask); } catch (e) { own = {}; meta.ownerLookupError = e.message; }
      meta.ownerLookups = ask.length;
      meta.ownerLookupsFailed = ask.filter((p) => !own[String(p.pid)]).length;
    }
    // The round's sandbox users, from the owners the snapshots recorded only: the survivors are stopped
    // by now, so a lookup on them would fail.
    let selfUser = "";
    try { selfUser = os.userInfo().username; } catch { selfUser = ""; }
    meta.sandboxUsers = sandboxUsersOf([...seen.values()].map((s) => s.owner), spec.sandboxUserPrefix, selfUser);
    const { tied, notStopped, untied } = decideSweep({
      fresh, all, marker: spec.marker, owners: own, sandboxUsers: meta.sandboxUsers, prefix: spec.sandboxUserPrefix,
      parentWasInTree: (p) => !!deadSeenParent(p),
    });
    // Listed again just before the stop: a process gone, or its pid reused, since the listing is not stopped.
    const current = tied.length ? procs() : [];
    const toStop = stillSame(tied, current);
    const kept = new Set(toStop.map((p) => p.pid + "|" + p.created));
    meta.swept = toStop.map((p) => Object.assign(p, { result: stopOne(p.pid) }));
    meta.goneBeforeStop = tied.filter((p) => !kept.has(p.pid + "|" + p.created))
      .map((p) => Object.assign(p, { result: "gone, or its pid reused, before its stop: not stopped" }));
    // Written unsettled first, so a last listing that fails leaves every listed process recorded.
    meta.notStopped = notStopped;
    meta.untiedOrphans = untied;
    const stopped = [...meta.survivors, ...meta.swept];
    // The last listing: left is what it shows still running of the stopped, and a listed process gone from it
    // is no longer left running.
    if (stopped.length || notStopped.length) {
      const settled = settleLeft({ notStopped, stopped, final: procs(), seen: all });
      meta.notStopped = settled.notStopped;
      meta.goneBeforeStop = meta.goneBeforeStop.concat(settled.gone);
      meta.left = settled.left;
    } else meta.left = [];
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
      seen: [...seen.values()], treeOwnerLookupsFailed,
    };
    try { sweep(meta); } catch (e) { meta.checkError = e.message; }
    writeJson(out("meta.json"), meta);
    process.exit(0);
  }

  child.on("error", (e) => { spawnError = e.message; ended = true; finish(); });
  child.on("exit", (code, signal) => { ended = true; exit = { code, signal }; setTimeout(() => finish(), 5000); });
  const deadline = setTimeout(() => stopNow("the hard deadline"), spec.deadlineSec * 1000);
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
        left: (m.left || []).length, goneBeforeStop: (m.goneBeforeStop || []).length, sandboxUsers: m.sandboxUsers || [],
        ownerLookupsFailed: m.ownerLookupsFailed || 0, treeOwnerLookupsFailed: m.treeOwnerLookupsFailed || 0,
        untiedOrphans: m.untiedOrphans || 0, ownerLookupError: m.ownerLookupError || null,
        checkError: m.checkError || null,
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

// Waits again on the keeper of a started round, after a wait that yielded or timed out; starts and stops nothing.
function waitOnly(specFile) {
  const spec = readSpec(specFile);
  // meta.json first, as stop does: a launcher that failed to spawn leaves meta.json and no pid.json.
  if (existsSync(spec.out("meta.json"))) { waitForMeta(spec, process.pid, Date.now() + 60 * 1000); return; }
  if (!existsSync(spec.out("pid.json"))) fail("no pid.json in " + spec.outDir + ": nothing was started there");
  const { keeperPid, started } = JSON.parse(readFileSync(spec.out("pid.json"), "utf8"));
  waitForMeta(spec, keeperPid, ms(started) + (spec.deadlineSec + 600) * 1000);
}

// Only as the entry script, so an import runs nothing; a path reached through a link or junction still matches.
const isEntry = () => { try { return !!process.argv[1] && norm(realpathSync(process.argv[1])) === norm(realpathSync(SELF)); } catch { return false; } };
if (isEntry()) {
  const [command, a0, b] = process.argv.slice(2);
  const a = command === "probe" ? a0 : nativePath(a0);
  if (command === "probe") probe(a, b);
  else if (command === "start" && a) start(a);
  else if (command === "stop" && a) stop(a);
  else if (command === "wait" && a) waitOnly(a);
  else if (command === "keep" && a) keep(a);
  else fail("usage: probe <launcher> [<script>] | start <spec.json> | stop <spec.json> | wait <spec.json>");
}
