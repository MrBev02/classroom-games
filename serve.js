/* =====================================================
   CLASSROOM GAMES: LOCAL SERVER
   =====================================================

   This program does two things:

     1. It serves the files in this folder, in the same way as
        "python -m http.server". Every game operates with either program.

     2. It adds a small API for the Roulette live roster. The teacher can
        then see each student who joined, and can stop the activity on
        every device.

   The live roster is optional. The games are static files and they do not
   need this program. If you do not run it, the Roulette session code
   continues to operate in the usual way.

   Start it with:

       node serve.js

   The program has no dependencies. There is no package.json and there is
   no install step.

   LIMITS OF THE LIVE ROSTER

   The API has no authentication. Any person on the same network can join
   with any name, including the name of another student. This is a
   classroom tool on a network you trust. It is not a security boundary.

   The roster is in memory only. This program never writes it to a disk.
   When you stop the program, the roster is gone.
   ===================================================== */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = __dirname;

/* The token for the teacher. It is printed one time, in this terminal.
   A student cannot send a command without it. */
const TEACHER_TOKEN = crypto.randomBytes(4).toString("hex");

/* The roster. It is in memory and this program never writes it to a disk. */
const students = new Map();          // id -> {id, name, lastSeen, module, spins, chips, paused}
const commands = new Map();          // id -> [command]
const GONE_AFTER_MS = 20000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".ico": "image/x-icon",
  ".md": "text/plain; charset=utf-8",
};

function send(res, code, body, type) {
  res.writeHead(code, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendJson(res, code, obj) {
  send(res, code, JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 100000) { data = ""; req.destroy(); }   // Refuse a large body.
    });
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); } catch (_) { resolve({}); }
    });
  });
}

/** Remove a name that a student typed. Keep it short and plain. */
function cleanName(s) {
  return String(s || "").replace(/[^\p{L}\p{N} '.-]/gu, "").trim().slice(0, 24) || "Student";
}

function queueCommand(id, cmd, text) {
  if (!commands.has(id)) commands.set(id, []);
  commands.get(id).push({ cmd: cmd, text: text || null, at: Date.now() });
}

/* ---------------------------------------------------------------
   The API
   --------------------------------------------------------------- */
async function handleApi(req, res, route) {
  if (route === "join" && req.method === "POST") {
    const body = await readBody(req);
    const id = crypto.randomBytes(6).toString("hex");
    students.set(id, {
      id: id, name: cleanName(body.name), joinedAt: Date.now(), lastSeen: Date.now(),
      module: null, spins: 0, chips: null, paused: false,
    });
    return sendJson(res, 200, { studentId: id });
  }

  if (route === "ping" && req.method === "POST") {
    const body = await readBody(req);
    const s = students.get(body.studentId);
    // An unknown id means the server restarted. Tell the page to join again.
    if (!s) return sendJson(res, 200, { rejoin: true, commands: [] });
    s.lastSeen = Date.now();
    if (body.status) {
      s.module = body.status.module || null;
      s.spins = body.status.spins || 0;
      s.chips = body.status.chips == null ? null : body.status.chips;
    }
    const queued = commands.get(s.id) || [];
    commands.set(s.id, []);
    return sendJson(res, 200, { commands: queued });
  }

  if (route === "roster" && req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    if (url.searchParams.get("token") !== TEACHER_TOKEN) {
      return sendJson(res, 403, { error: "bad token" });
    }
    const now = Date.now();
    const list = Array.from(students.values())
      .filter((s) => now - s.lastSeen < 10 * 60000)   // Forget a student after 10 minutes.
      .sort((a, b) => a.name.localeCompare(b.name));
    return sendJson(res, 200, { students: list, goneAfterMs: GONE_AFTER_MS });
  }

  if (route === "command" && req.method === "POST") {
    const body = await readBody(req);
    if (body.token !== TEACHER_TOKEN) return sendJson(res, 403, { error: "bad token" });
    const allowed = ["pause", "resume", "end", "kick", "message"];
    if (allowed.indexOf(body.cmd) === -1) return sendJson(res, 400, { error: "unknown command" });

    const targets = body.target === "all"
      ? Array.from(students.keys())
      : (students.has(body.target) ? [body.target] : []);
    targets.forEach((id) => {
      queueCommand(id, body.cmd, body.text);
      const s = students.get(id);
      if (body.cmd === "pause") s.paused = true;
      if (body.cmd === "resume") s.paused = false;
    });
    return sendJson(res, 200, { sent: targets.length });
  }

  return sendJson(res, 404, { error: "no such route" });
}

/* ---------------------------------------------------------------
   Static files
   --------------------------------------------------------------- */
function serveFile(req, res) {
  const url = new URL(req.url, "http://localhost");
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";

  const full = path.join(ROOT, rel);
  // Refuse a path that goes outside this folder.
  if (!full.startsWith(ROOT)) return send(res, 403, "Forbidden", "text/plain");

  fs.readFile(full, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, data, MIME[path.extname(full).toLowerCase()] || "application/octet-stream");
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const api = url.pathname.match(/^\/roulette\/api\/([a-z]+)$/);
  if (api) return handleApi(req, res, api[1]).catch(() => sendJson(res, 500, { error: "server" }));
  serveFile(req, res);
});

/** The addresses of this machine on the local network. */
function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach((name) => {
    (nets[name] || []).forEach((net) => {
      if (net.family === "IPv4" && !net.internal) out.push(net.address);
    });
  });
  return out;
}

server.listen(PORT, () => {
  const addresses = lanAddresses();
  console.log("");
  console.log("Classroom Games");
  console.log("");
  addresses.forEach((a) => {
    console.log("    Students:  http://" + a + ":" + PORT + "/roulette/");
  });
  if (!addresses.length) {
    console.log("    No network address found. Students cannot reach this machine.");
  }
  console.log("    You:       http://localhost:" + PORT + "/roulette/host.html");
  console.log("");
  console.log("    Teacher token: " + TEACHER_TOKEN);
  console.log("    Paste the token into the Live roster panel. Keep it in this window.");
  console.log("");
  console.log("    Press Control and C to stop. The roster is then gone.");
  console.log("");
});
