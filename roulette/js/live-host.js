/* =====================================================
   ROULETTE: LIVE ROSTER, TEACHER SIDE
   =====================================================

   This file talks to the optional server in serve.js. It shows each
   student who joined, and it sends commands to them.

   The live layer is an addition. If the server is not there, this file
   writes one line on the console and stops. Nothing else on the page
   changes, and the session code continues to work in the usual way.
   ===================================================== */

const LiveHost = (function () {
  let token = null;
  let timer = null;
  let roster = [];
  let connected = false;

  function api(path, body) {
    return fetch(path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))));
  }

  function start() {
    // The token is printed in the terminal that runs serve.js. The
    // teacher pastes it here. A student cannot send a command without it.
    token = Store.get("roulette-teacher-token", "") || "";
    draw();
    poll();
    timer = setInterval(poll, 5000);
  }

  function poll() {
    if (!token) return;
    api("api/roster?token=" + encodeURIComponent(token))
      .then((data) => { connected = true; roster = data.students || []; draw(); })
      .catch(() => { connected = false; draw(); });
  }

  function command(target, cmd, text) {
    return api("api/command", { token: token, target: target, cmd: cmd, text: text })
      .then(poll)
      .catch(() => { connected = false; draw(); });
  }

  function draw() {
    const status = document.getElementById("live-status");
    const body = document.getElementById("live-body");
    if (!status || !body) return;

    if (!token) {
      status.textContent = "Paste the teacher token from the terminal that runs serve.js.";
      const input = el("input", { class: "num", type: "text", placeholder: "teacher token" });
      fill(body, el("div", { class: "btn-row" }, input,
        el("button", { class: "btn", type: "button", text: "Connect",
          onclick: () => {
            token = input.value.trim();
            Store.set("roulette-teacher-token", token);
            draw(); poll();
          } })));
      return;
    }

    if (!connected) {
      status.textContent = "Not connected. Run node serve.js, then reload this page.";
      fill(body, el("div", { class: "btn-row" },
        el("button", { class: "btn ghost", type: "button", text: "Forget the token",
          onclick: () => { token = null; Store.remove("roulette-teacher-token"); draw(); } })));
      return;
    }

    const now = Date.now();
    status.textContent = roster.length
      ? roster.length + " students joined."
      : "Connected. No students have joined yet.";

    const rows = roster.map((s) => {
      const gone = now - s.lastSeen > 20000;
      const net = (s.chips == null ? null : s.chips - ROULETTE_CONFIG.startingChips);
      return el("tr", { class: gone ? "is-gone" : "" },
        el("td", null, el("span", { class: "live-dot" + (gone ? " is-off" : "") }), s.name),
        el("td", { text: s.module || "choosing" }),
        el("td", { text: s.spins == null ? "-" : String(s.spins) }),
        el("td", { class: net != null && net < 0 ? "is-down" : "",
                   text: net == null ? "-" : (net > 0 ? "+" : "") + net }),
        el("td", null,
          el("button", { class: "btn ghost", type: "button", text: "Pause",
            onclick: () => command(s.id, "pause") }),
          el("button", { class: "btn ghost", type: "button", text: "End",
            onclick: () => command(s.id, "end") })));
    });

    const table = el("table", { class: "roster" },
      el("thead", null, el("tr", null,
        el("th", { text: "Student" }), el("th", { text: "Activity" }),
        el("th", { text: "Spins" }), el("th", { text: "Net chips" }), el("th", { text: "" }))),
      el("tbody", null, ...rows));

    fill(body,
      el("div", { class: "btn-row" },
        el("button", { class: "btn", type: "button", text: "Pause everyone",
          onclick: () => command("all", "pause") }),
        el("button", { class: "btn", type: "button", text: "Let everyone continue",
          onclick: () => command("all", "resume") }),
        el("button", { class: "btn", type: "button", text: "End for everyone",
          onclick: () => {
            if (confirm("End the session on every student device?")) command("all", "end");
          } })),
      table,
      el("p", { class: "hint-line",
        text: "A command reaches a device within about 5 seconds. Names are typed by students and are kept only while the server runs." }));
  }

  function stop() { if (timer) clearInterval(timer); }

  return { start: start, stop: stop };
})();
