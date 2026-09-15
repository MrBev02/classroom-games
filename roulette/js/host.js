/* =====================================================
   ROULETTE: TEACHER CONSOLE
   =====================================================

   The teacher console owns the state of the projector. It sends the full
   state after each change. The projector draws what it receives and holds
   no state of its own. This is the same method as the Jeopardy host.

   There are two messages. STATE goes from here to the projector. HELLO
   goes from the projector to here when it opens, thus a projector that
   opens late still receives the current state.

   The state must stay small. A run of 10,000 spins goes into the state as
   37 counts and a short series. It does not go in as 10,000 results.
   ===================================================== */

const SAVE_KEY = "roulette-host-v1";
const channel = new GameChannel();

let state = loadState();
let hostRng = new SpinRNG(ROULETTE_CONFIG.seed);
let countdown = null;

const $ = (sel) => document.querySelector(sel);

function loadState() {
  const saved = Store.get(SAVE_KEY);
  if (saved && saved.version === 1) return saved;
  return {
    version: 1,
    phase: "idle",
    wheel: ROULETTE_CONFIG.defaultWheel,
    currencyMode: ROULETTE_CONFIG.currencyMode,
    seed: null,
    moduleIds: MODULE_ORDER.slice(),
    key: null,
    joinUrl: "",
    showCode: false,
    demoModule: null,
    betId: "red",
    arg: null,
    ball: null,
    sim: null,
    martingale: null,
  };
}

/** Save the state, send it to the projector, then draw this screen again. */
function update() {
  Store.set(SAVE_KEY, state);
  channel.send("STATE", publicState());
  render();
}

/** The projector never needs the stop code, so it never receives it. */
function publicState() {
  return {
    phase: state.phase,
    wheel: state.wheel,
    currencyMode: state.currencyMode,
    showCode: state.showCode,
    code: state.showCode && state.key ? state.key.code : null,
    joinUrl: state.showCode ? (state.joinUrl || defaultJoinUrl()) : "",
    expiresAt: state.key ? state.key.expiresAt : null,
    demoModule: state.demoModule,
    betId: state.betId,
    arg: state.arg,
    ball: state.ball,
    sim: state.sim,
    martingale: state.martingale,
  };
}

channel.on("HELLO", () => { projectorSeen = Date.now(); channel.send("STATE", publicState()); });
channel.on("PONG", () => { projectorSeen = Date.now(); });

let projectorSeen = 0;

/* Ask the projector whether it is still there. A teacher who has not
   opened it should be told, rather than pressing controls that appear to
   do nothing. */
function watchProjector() {
  setInterval(() => {
    channel.send("PING");
    const open = Date.now() - projectorSeen < 6000;
    const badge = $("#proj-status");
    if (!badge) return;
    badge.textContent = open ? "Projector open" : "Projector not open";
    badge.classList.toggle("is-off", !open);
  }, 2000);
}

/* ---------------------------------------------------------------
   The session code
   --------------------------------------------------------------- */
function generateKey() {
  const durationMin = parseInt($("#duration").value, 10);
  const expiryHours = parseInt($("#expiry").value, 10);
  const expiresAt = Date.now() + expiryHours * 3600000;
  const code = RouletteKey.encode({
    expiresAt: expiresAt,
    durationMin: durationMin,
    moduleIds: state.moduleIds,
  });
  const decoded = RouletteKey.decode(code);
  state.key = {
    code: code,
    canonical: decoded.canonical,
    stopCode: RouletteKey.stopCode(decoded.canonical),
    expiresAt: decoded.expiresAt,
    durationMin: decoded.durationMin,
    moduleIds: decoded.moduleIds,
  };
  update();
}

function keyCard() {
  if (!state.key) {
    return el("p", { class: "hint-line", text: "Pick the activities, then make a code." });
  }
  const k = state.key;
  const expires = new Date(k.expiresAt);
  const durationText = k.durationMin ? k.durationMin + " minutes" : "no limit";

  const countdownBox = el("span", { class: "keycard__countdown", id: "key-countdown" });
  const stopBox = el("span", { class: "keycard__stop", text: "hidden" });
  let stopShown = false;

  return el("div", { class: "keycard" },
    el("div", { class: "keycard__code", text: k.code }),
    el("div", { class: "keycard__meta" },
      "Opens " + k.moduleIds.length + " activities. " +
      "Each device gets " + durationText + ". Code dies at " +
      expires.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ". "),
    el("div", { class: "keycard__meta" }, "Valid for ", countdownBox),
    el("div", { class: "btn-row", style: "justify-content:center" },
      el("button", { class: "btn", type: "button", text: "Copy",
        onclick: (e) => {
          navigator.clipboard.writeText(k.code);
          e.target.textContent = "Copied";
          setTimeout(() => { e.target.textContent = "Copy"; }, 1500);
        } }),
      el("button", { class: "btn", type: "button", text: "Show on projector",
        onclick: () => { state.showCode = true; state.phase = "code"; update(); } }),
      el("button", { class: "btn ghost", type: "button", text: "New code", onclick: generateKey })),
    el("div", { class: "keycard__meta" },
      el("strong", { text: "End code: " }), stopBox, " ",
      el("button", { class: "btn ghost", type: "button", text: "Reveal",
        onclick: (e) => {
          stopShown = !stopShown;
          stopBox.textContent = stopShown ? RouletteKey.formatStopCode(k.stopCode) : "hidden";
          e.target.textContent = stopShown ? "Hide" : "Reveal";
        } })),
    el("p", { class: "hint-line",
      text: "Read out the end code to lock every student's page. Keep it off the board until then." }));
}

function tickCountdown() {
  const box = $("#key-countdown");
  if (!box || !state.key) return;
  const left = state.key.expiresAt - Date.now();
  box.textContent = left <= 0 ? "expired" : fmtDuration(left);
  box.classList.toggle("warn", left <= 0);
}

/* ---------------------------------------------------------------
   The activity list
   --------------------------------------------------------------- */
const PRESETS = {
  all: MODULE_ORDER.slice(),
  none: [],
  basics: ["sample-space", "equally-likely", "simple-probability", "sum-to-one"],
  complement: ["complement", "complement-sums"],
  edge: ["free-play", "house-edge", "betting-systems", "debrief"],
};

function moduleList() {
  const holder = el("div", { class: "modlist" });
  MODULE_DEFS.forEach((m) => {
    const box = el("input", { type: "checkbox", checked: state.moduleIds.indexOf(m.id) !== -1 });
    box.addEventListener("change", () => {
      const at = state.moduleIds.indexOf(m.id);
      if (box.checked && at === -1) state.moduleIds.push(m.id);
      if (!box.checked && at !== -1) state.moduleIds.splice(at, 1);
      update();
    });
    holder.appendChild(el("label", { class: "modrow" + (m.where.student ? "" : " is-projector") },
      box,
      el("span", null,
        el("span", { class: "modrow__title", text: m.title }),
        el("span", { class: "modrow__meta" },
          " " + m.minutes + " min. Dot points " + (m.dotpoints.join(", ") || "none") + "."))));
  });
  return holder;
}

function coverageDots() {
  const covered = dotpointsCovered(state.moduleIds);
  const holder = el("div", { class: "coverage" });
  for (let d = 1; d <= 11; d++) {
    holder.appendChild(el("span", {
      class: "dot" + (covered.indexOf(d) !== -1 ? " is-on" : ""),
      title: DOTPOINT_LABELS[d], text: String(d),
    }));
  }
  return holder;
}

const DOTPOINT_LABELS = {
  1: "List the sample space", 2: "P(event) as a fraction", 3: "Probabilities run 0 to 1",
  4: "All probabilities total 1", 5: "Theoretical probability", 6: "Observed probability",
  7: "Random number generator", 8: "Describe the complement", 9: "P(A) + P(A') = 1",
  10: "Problems with complements", 11: "Complements in several forms",
};

/* ---------------------------------------------------------------
   The projector controls
   --------------------------------------------------------------- */
function demoControls() {
  const wrap = el("div");
  const mod = state.demoModule ? moduleById(state.demoModule) : null;
  if (!mod) {
    wrap.appendChild(el("p", { class: "hint-line",
      text: "Choose an activity above to run it on the projector." }));
    return wrap;
  }
  const wheel = wheelById(state.wheel);

  if (mod.id === "betting-systems") {
    wrap.appendChild(el("div", { class: "btn-row" },
      el("button", { class: "btn primary", type: "button", text: "Run the martingale",
        onclick: runMartingale }),
      el("button", { class: "btn ghost", type: "button", text: "Clear",
        onclick: () => { state.martingale = null; update(); } })));
    return wrap;
  }

  if (mod.id === "house-edge" || mod.id === "debrief" || mod.id === "sample-space") {
    wrap.appendChild(el("p", { class: "hint-line",
      text: "This activity needs no controls. It is on the projector now." }));
    if (mod.id === "sample-space") {
      wrap.appendChild(el("div", { class: "btn-row" },
        el("button", { class: "btn", type: "button", text: "Spin once",
          onclick: () => runSpins(1) })));
    }
    return wrap;
  }

  // Everything else runs spins, so the teacher picks the bet to follow.
  const picker = el("div", { class: "demo-bet" });
  picker.appendChild(el("p", { class: "demo-bet__hint",
    text: "Select the bet the class is following. The projector highlights it." }));
  picker.appendChild(el("div", { class: "board-scroll" }, bettingBoard(wheel, {
    selected: { betId: state.betId, arg: state.arg },
    highlight: betOutcomes(state.betId, state.arg, wheel),
    onPick: (id, a) => {
      if (!isWager(id)) return;
      state.betId = id; state.arg = a;
      state.sim = null;                 // The counts followed the old bet.
      hostRng.reset();
      update();
    },
  })));
  wrap.appendChild(picker);

  const row = el("div", { class: "btn-row" });
  [1, 10, 100, 1000, 10000].forEach((n) => {
    row.appendChild(el("button", { class: "btn", type: "button",
      text: n === 1 ? "Spin once" : "Spin " + n.toLocaleString(),
      onclick: () => runSpins(n) }));
  });
  row.appendChild(el("button", { class: "btn ghost", type: "button", text: "Clear the spins",
    onclick: () => { state.sim = null; state.ball = null; hostRng.reset(); update(); } }));
  wrap.appendChild(row);

  if (state.sim) {
    const winners = betOutcomes(state.betId, state.arg, wheel);
    const theory = probability(winners, wheel);
    const hits = winners.reduce((a, p) => a + (state.sim.counts[p] || 0), 0);
    wrap.appendChild(el("p", { class: "hint-line",
      text: state.sim.n.toLocaleString() + " spins. A bet that " +
            betDescription(state.betId, state.arg) +
            " won " + hits.toLocaleString() + " times, which is " +
            fmtPercent(hits / state.sim.n) + ". Theory says " + fmtPercent(theory.decimal) + "." }));
  }
  return wrap;
}

function runMartingale() {
  const wheel = wheelById(state.wheel);
  const plan = { startingChips: 200, stake: 1, tableLimit: ROULETTE_CONFIG.tableLimit,
                 betId: "red", arg: null };
  const r = martingaleRun(new SpinRNG(state.seed == null ? undefined : state.seed),
                          wheel, 2000, plan);
  state.martingale = {
    series: r.series, finalChips: r.finalChips, staked: r.staked,
    spinsSurvived: r.spinsSurvived, longestLosingRun: r.longestLosingRun,
    hitLimit: r.hitLimit, startingChips: plan.startingChips,
  };
  state.phase = "module";
  state.showCode = false;
  update();
}

function runSpins(n) {
  const wheel = wheelById(state.wheel);
  const winners = betOutcomes(state.betId, state.arg, wheel);
  // One spin shows the pocket on the wheel. A group of spins does not.
  if (n === 1) state.ball = hostRng.spin(wheel);
  const res = n === 1
    ? (function () {
        const counts = {};
        sampleSpace(wheel).forEach((p) => { counts[p] = 0; });
        counts[state.ball] = 1;
        return { counts: counts, n: 1, series: [{ n: 1, rf: winners.indexOf(state.ball) !== -1 ? 1 : 0 }] };
      })()
    : hostRng.spinMany(wheel, n, winners);
  if (n !== 1) state.ball = null;
  if (!state.sim) state.sim = { counts: {}, n: 0, series: [] };
  Object.keys(res.counts).forEach((p) => {
    state.sim.counts[p] = (state.sim.counts[p] || 0) + res.counts[p];
  });
  const base = state.sim.n;
  const priorHits = state.sim.series.length
    ? state.sim.series[state.sim.series.length - 1].rf * base : 0;
  (res.series || []).forEach((pt) => {
    state.sim.series.push({ n: base + pt.n, rf: (priorHits + pt.rf * pt.n) / (base + pt.n) });
  });
  state.sim.n += n;
  // Keep the state small enough to send after every change.
  state.sim.series = downsample(state.sim.series);
  state.phase = "module";
  state.showCode = false;
  update();
}

/* ---------------------------------------------------------------
   Draw the screen
   --------------------------------------------------------------- */
function render() {
  const list = moduleList();
  $("#modlist").replaceWith(list);
  list.id = "modlist";

  const cov = coverageDots();
  $("#coverage").replaceWith(cov);
  cov.id = "coverage";

  fill($("#keycard-holder"), keyCard());
  tickCountdown();

  const dc = demoControls();
  $("#demo-controls").replaceWith(dc);
  dc.id = "demo-controls";

  // The same functions that draw the projector. Thus the copy on this
  // screen and the screen on the wall cannot become different.
  fill($("#preview"), projectorView(publicState(), { small: true }));

  $("#wheel").value = state.wheel;
  $("#currency").value = state.currencyMode;
  $("#join-url").value = state.joinUrl;
  $("#join-url").placeholder = defaultJoinUrl() || "http://10.1.24.87:8080/roulette/";
}

function buildDemoSelect() {
  const sel = $("#demo-module");
  sel.appendChild(el("option", { value: "" }, "None"));
  MODULE_DEFS.filter((m) => m.where.projector).forEach((m) => {
    sel.appendChild(el("option", { value: m.id }, m.title));
  });
  sel.value = state.demoModule || "";
  sel.addEventListener("change", () => {
    state.demoModule = sel.value || null;
    state.phase = sel.value ? "module" : "idle";
    if (sel.value) state.showCode = false;
    update();
  });
}

/* ---------------------------------------------------------------
   The projector window
   --------------------------------------------------------------- */

/**
 * The address for students, when the teacher did not type one.
 *
 * The student page is index.html, beside this file. Thus the address is
 * the address of this page without the file name. A page opened from a
 * file gives no address that a student can type. The function then
 * gives an empty string, and the projector shows only the code.
 */
function defaultJoinUrl() {
  if (location.protocol === "file:") return "";
  return location.href.split(/[?#]/)[0].replace(/[^/]*$/, "");
}

/**
 * Open the projector, or move to it when it is already open.
 *
 * The window has a name, and this file keeps the reference. Thus a
 * second press moves to the window that is open. It does not make a
 * second window. A browser can stop a new window. The teacher then gets
 * a message, because a button that does nothing looks like a fault.
 */
let projectorWin = null;
function openProjector() {
  const warn = $("#projector-warn");
  if (projectorWin && !projectorWin.closed) {
    projectorWin.focus();
    channel.send("STATE", publicState());
    return;
  }
  projectorWin = window.open("display.html", "roulette-projector");
  if (!projectorWin) {
    if (warn) {
      warn.textContent = "The browser stopped the projector window. Permit pop-ups for this page, then select Open projector again.";
      warn.hidden = false;
    }
    return;
  }
  if (warn) { warn.textContent = ""; warn.hidden = true; }
  projectorWin.focus();
  setTimeout(() => channel.send("STATE", publicState()), 400);
}

/* ---------------------------------------------------------------
   Wire up the page
   --------------------------------------------------------------- */
function wire() {
  $("#generate").addEventListener("click", generateKey);
  $("#open-display").addEventListener("click", openProjector);
  $("#show-code").addEventListener("click", () => {
    if (!state.key) generateKey();
    state.showCode = true; state.phase = "code"; update();
  });
  $("#show-idle").addEventListener("click", () => {
    state.showCode = false; state.phase = "idle"; update();
  });
  document.querySelectorAll(".preset").forEach((b) => {
    b.addEventListener("click", () => {
      state.moduleIds = PRESETS[b.dataset.preset].slice();
      update();
    });
  });
  $("#wheel").addEventListener("change", (e) => {
    state.wheel = e.target.value;
    state.sim = null;              // The counts belong to the old wheel.
    update();
  });
  $("#currency").addEventListener("change", (e) => {
    state.currencyMode = e.target.value;
    ROULETTE_CONFIG.currencyMode = state.currencyMode;
    update();
  });
  $("#join-url").addEventListener("change", (e) => { state.joinUrl = e.target.value.trim(); update(); });
  $("#seed").addEventListener("change", (e) => {
    const v = parseInt(e.target.value, 10);
    state.seed = isFinite(v) ? v : null;
    hostRng = new SpinRNG(state.seed);
    state.sim = null;
    update();
  });

  $("#print-card").addEventListener("click", () => {
    if (!state.key) { generateKey(); }
    const k = state.key;
    printCodeCard({
      key: k.code,
      stopCode: RouletteKey.formatStopCode(k.stopCode),
      joinUrl: state.joinUrl || defaultJoinUrl(),
      expiresText: new Date(k.expiresAt).toLocaleString(),
      durationText: k.durationMin ? k.durationMin + " minutes" : "no time limit",
    });
  });
  $("#print-worksheet").addEventListener("click", () =>
    printWorksheet(state.moduleIds, wheelById(state.wheel)));
  $("#print-key").addEventListener("click", () =>
    printAnswerKey(state.moduleIds, wheelById(state.wheel)));
  $("#print-tally").addEventListener("click", () => printTallySheet(wheelById(state.wheel)));

  buildDemoSelect();
  render();
  channel.send("STATE", publicState());
  countdown = setInterval(tickCountdown, 1000);
  watchProjector();
  if (typeof LiveHost !== "undefined") LiveHost.start();
}

document.addEventListener("DOMContentLoaded", wire);
