/* =====================================================
   ROULETTE: STUDENT PAGE CONTROLLER
   =====================================================

   This file controls the page that a student uses.

   It does not load js/channel.js. The page does not use BroadcastChannel
   and it does not need the teacher console. Thus the page operates from a
   web address, from a local server, or from a file on a USB device.

   The function commit() has the same purpose as update() in the Jeopardy
   host. It saves the data and then draws the screen again. It has no
   send() operation, because this page has no channel.
   ===================================================== */

let progress = Progress.load();
let rng = new SpinRNG(ROULETTE_CONFIG.seed);
let view = { name: "boot", moduleId: null, data: {} };
let timerHandle = null;
let lastState = null;
let paused = false;
let teacherMessage = null;
let liveAvailable = false;

const $ = (sel) => document.querySelector(sel);

function commit() {
  Progress.save(progress);
  render();
}

/* ---------------------------------------------------------------
   Boot
   --------------------------------------------------------------- */
function boot() {
  // A teacher can send a link that carries the code, for example
  // index.html?key=ABCDE-FGHJK-MNPQR. This also works from a file.
  const fromLink = new URLSearchParams(location.search).get("key");
  if (fromLink && Session.check().state !== "open") {
    const r = Session.unlock(fromLink);
    if (r.ok) history.replaceState(null, "", location.pathname);
  }
  const st = Session.check();
  if (st.state === "open") Session.startHeartbeat(() => render());
  view = { name: st.state === "open" ? "menu" : "gate", moduleId: null, data: {} };
  render();
  startTimer();
  startLive();
}

/**
 * Connect to the teacher, if a teacher is there.
 *
 * This runs after the first screen is drawn. If there is no server, the
 * function stops and the page does not change.
 */
function startLive() {
  if (typeof Live === "undefined") return;
  Live.probe().then((there) => {
    if (!there) return;
    liveAvailable = true;
    const name = Progress.prefs().studentLabel;
    if (name) joinClassList(name);
    else render();
  });
}

function joinClassList(name) {
  Progress.setPref("studentLabel", name);
  Live.join(name).then((r) => {
    if (!r.ok) return;
    Live.start({
      getStatus: function () {
        const play = view.data && view.data.play;
        return {
          module: view.moduleId ? moduleById(view.moduleId).title : null,
          spins: progress.totals.spins,
          chips: play ? play.chips : null,
        };
      },
      onCommand: function (c) {
        if (c.cmd === "pause") { paused = true; render(); }
        else if (c.cmd === "resume") { paused = false; teacherMessage = null; render(); }
        else if (c.cmd === "end" || c.cmd === "kick") { Session.burn("STOPPED"); render(); }
        else if (c.cmd === "message") { teacherMessage = c.text; render(); }
      },
    });
    render();
  });
}

/** The state in one string. The clock compares this with the last tick. */
function stateSig(st) {
  return st.state + ":" + (st.reason || "");
}

function startTimer() {
  if (timerHandle) clearInterval(timerHandle);
  lastState = stateSig(Session.check());
  timerHandle = setInterval(() => {
    const st = Session.check();
    if (st.state !== "open") {
      // Draw again only when the state changed. The clock runs every
      // second, and a redraw every second would interrupt typing.
      const sig = stateSig(st);
      if (sig !== lastState) { lastState = sig; render(); }
      return;
    }
    lastState = stateSig(st);
    const box = $("#timer");
    if (box) {
      box.textContent = fmtDuration(st.remainingMs);
      box.classList.toggle("is-low", st.remainingMs < 5 * 60000);
    }
  }, 1000);
}

/* ---------------------------------------------------------------
   Render
   --------------------------------------------------------------- */
function render() {
  const st = Session.check();
  const root = $("#app");
  const timerBox = $("#timer");

  if (st.state === "locked") {
    if (!$(".lock")) fill(root, lockPanel(st));
    if (timerBox) timerBox.hidden = true;
    return;
  }
  if (st.state === "none") {
    // Keep the code box that is already on the screen. A redraw would
    // take away both the text and the focus while a student types.
    if (!$(".gate")) fill(root, gatePanel(null));
    if (timerBox) timerBox.hidden = true;
    return;
  }

  if (timerBox) {
    timerBox.hidden = !isFinite(st.remainingMs);
    timerBox.textContent = fmtDuration(st.remainingMs);
  }
  if (view.name === "gate" || view.name === "boot") view.name = "menu";

  // The teacher paused the class. Nothing else is reachable until they
  // let the class continue.
  if (paused) { fill(root, pausePanel()); return; }

  const banner = teacherMessage
    ? el("div", { class: "feedback is-right" }, el("p", { class: "tight", text: teacherMessage }))
    : null;
  const panel = view.name === "menu" ? menuPanel(st) : modulePanel(st);
  fill(root, banner, panel);
}

/* ---------------------------------------------------------------
   The code gate
   --------------------------------------------------------------- */
function gatePanel(error) {
  const input = el("input", {
    class: "gate__code", id: "code", type: "text", autocomplete: "off",
    spellcheck: "false", "aria-label": "Class code", placeholder: "ABCDE-FGHJK-MNPQR",
    maxlength: 21,
  });
  input.addEventListener("input", () => {
    const caretAtEnd = input.selectionStart === input.value.length;
    const formatted = RouletteKey.format(input.value);
    if (formatted !== input.value) {
      input.value = formatted;
      if (caretAtEnd) input.setSelectionRange(formatted.length, formatted.length);
    }
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

  function submit() {
    const r = Session.unlock(input.value);
    if (r.ok) {
      Session.startHeartbeat(() => render());
      view = { name: "menu", moduleId: null, data: {} };
      render();
    } else {
      fill($("#app"), gatePanel(Session.explain(r.reason)));
      const again = $("#code");
      if (again) { again.value = input.value; again.focus(); }
    }
  }

  return el("section", { class: "gate" },
    el("h1", { text: "Roulette and probability" }),
    el("p", { class: "muted", text: "Type the code your teacher gave you." }),
    input,
    error ? el("p", { class: "gate__error", role: "alert", text: error }) : null,
    el("div", { class: "btn-row" },
      el("button", { class: "btn btn--primary", onclick: submit, text: "Start" })));
}

function lockPanel(st) {
  return el("section", { class: "lock" },
    el("h1", { class: "lock__title", text: "Session finished" }),
    el("p", { class: "lock__body", text: Session.explain(st.reason) }),
    el("p", { class: "muted", text: "Your work is saved on this device." }),
    el("div", { class: "btn-row" },
      el("button", {
        class: "btn", text: "Enter a new code",
        onclick: () => { Session.dismissLock(); render(); },
      })));
}

function pausePanel() {
  return el("section", { class: "lock" },
    el("h1", { class: "lock__title", text: "Paused" }),
    el("p", { class: "lock__body", text: teacherMessage || "Your teacher has paused the class." }),
    el("p", { class: "muted", text: "Your work is saved. This screen returns on its own." }));
}

/** Ask for a first name, only when a teacher is actually listening. */
function joinRow() {
  if (!liveAvailable || Live.joined) return null;
  const input = el("input", { class: "frac__in", type: "text", size: 14,
    "aria-label": "Your first name", placeholder: "First name" });
  return el("div", { class: "panel" },
    el("p", { class: "tight", text: "Your teacher can see who is working. Add your first name to the list." }),
    el("div", { class: "answer-row" }, input,
      el("button", { class: "btn", text: "Add my name",
        onclick: () => { if (input.value.trim()) joinClassList(input.value.trim()); } })),
    el("p", { class: "muted tight",
      text: "Your name stays on your teacher's laptop while the lesson runs. Nothing else is sent." }));
}

/* ---------------------------------------------------------------
   The module menu
   --------------------------------------------------------------- */
function menuPanel(st) {
  const mods = studentModules(st.moduleIds);
  if (!mods.length) {
    return el("section", null,
      el("h1", { text: "Nothing to open" }),
      el("p", { text: "That code does not open any activities on this device. Ask your teacher." }));
  }

  const cards = mods.map((m) => {
    const sum = Progress.summary(progress, m.id);
    const status = sum ? sum.status : "not-started";
    return el("button", {
      class: "menu__card",
      onclick: () => { view = { name: "module", moduleId: m.id, data: {} }; render(); },
    },
      el("span", { class: "menu__title", text: m.title }),
      el("span", { class: "menu__blurb", text: m.blurb }),
      el("span", { class: "menu__meta" },
        el("span", { class: "chip" + (status === "complete" ? " is-done" : status === "in-progress" ? " is-progress" : ""),
          text: status === "complete" ? "Finished"
              : status === "in-progress" ? "Step " + (sum.stepIndex + 1) + " of " + m.steps.length
              : "Not started" }),
        el("span", { text: "About " + m.minutes + " min" })));
  });

  return el("section", null,
    el("h1", { text: "Choose an activity" }),
    joinRow(),
    el("div", { class: "menu" }, ...cards),
    endSessionRow());
}

/** The student types the code that the teacher reads out. */
function endSessionRow() {
  const input = el("input", {
    class: "frac__in", type: "text", inputmode: "numeric", size: 8,
    "aria-label": "End session code", placeholder: "000-000",
  });
  const msg = el("span", { class: "muted" });
  return el("details", { class: "panel" },
    el("summary", { text: "End this session" }),
    el("p", { class: "muted tight", text: "If your teacher reads out an end code, type it here." }),
    el("div", { class: "answer-row" }, input,
      el("button", {
        class: "btn", text: "End session",
        onclick: () => {
          if (Session.applyStopCode(input.value)) render();
          else msg.textContent = "That code does not match.";
        },
      }), msg));
}

/* ---------------------------------------------------------------
   A module
   --------------------------------------------------------------- */
function modulePanel(st) {
  const mod = moduleById(view.moduleId);
  if (!mod) { view = { name: "menu" }; return menuPanel(st); }

  const state = Progress.moduleState(progress, mod.id);
  const index = Math.min(state.stepIndex, mod.steps.length - 1);
  const step = mod.steps[index];

  const dots = el("div", { class: "steps" }, ...mod.steps.map((s, i) =>
    el("div", { class: "steps__dot" + (i < index ? " is-done" : i === index ? " is-now" : "") })));

  const body = renderStep(mod, step, index);

  const nav = el("div", { class: "btn-row" },
    el("button", { class: "btn btn--quiet", text: "Back to activities",
      onclick: () => { view = { name: "menu" }; render(); } }),
    el("span", { class: "btn-row__spacer" }),
    index > 0 ? el("button", { class: "btn", text: "Previous",
      onclick: () => { Progress.setStep(progress, mod.id, index - 1); view.data = {}; commit(); } }) : null,
    index < mod.steps.length - 1
      ? el("button", { class: "btn btn--primary", text: "Next",
          onclick: () => { Progress.setStep(progress, mod.id, index + 1); view.data = {}; commit(); } })
      : el("button", { class: "btn btn--primary", text: "Finish",
          onclick: () => { Progress.complete(progress, mod.id); view = { name: "menu" }; commit(); } }));

  return el("section", null,
    el("h1", { text: mod.title }),
    dots,
    body,
    nav);
}

function renderStep(mod, step, index) {
  switch (step.kind) {
    case "read": return readStep(step);
    case "questions": return questionsStep(mod, step);
    case "tour": return tourStep(mod, step);
    case "explore": return exploreStep(mod, step);
    case "partition": return partitionStep(mod, step);
    case "sim": return simStep(mod, step);
    case "forms": return formsStep(mod, step);
    case "play": return playStep(mod, step);
    case "edge": return edgeStep(mod, step);
    case "systems": return systemsStep(mod, step);
    case "summary": return summaryStep(mod);
    default: return el("div", { class: "panel", text: "This step is not available." });
  }
}

/* ---------- read ---------- */
function readStep(step) {
  return el("div", { class: "panel" },
    el("h2", { text: step.title }),
    ...step.body.map((b) => prose(b)));
}

/* ---------- questions ---------- */
function questionsStep(mod, step) {
  const pool = moduleQuestions(mod.id);
  const state = Progress.moduleState(progress, mod.id);
  const panel = el("div", { class: "panel" }, el("h2", { text: step.title }));
  pool.forEach((q) => panel.appendChild(questionBlock(mod, q, state)));
  return panel;
}

function questionBlock(mod, q, state) {
  const wrap = el("div", { class: "question" });
  const wheel = q.wheel ? wheelById(q.wheel) : currentWheel();
  const saved = state.answers[q.id];

  wrap.appendChild(prose(q.prompt, "question__prompt"));

  const feedbackBox = el("div");
  const hintBox = el("div");
  let response = saved ? saved.response : null;

  function mark() {
    const res = checkAnswer(q, response, { wheel: wheel });
    Progress.recordAnswer(progress, mod.id, q.id, { response: response, correct: res.correct });
    Progress.save(progress);
    fill(feedbackBox, feedbackFor(q, res));
    if (q.type === "mc") paintChoices(res.correct);
  }

  let paintChoices = () => {};

  if (q.type === "mc") {
    const buttons = q.choices.map((c, i) =>
      el("button", {
        class: "choice" + (response === i ? " is-picked" : ""),
        onclick: () => { response = i; mark(); },
      }, c.text));
    paintChoices = (correct) => {
      buttons.forEach((b, i) => {
        b.classList.toggle("is-picked", response === i);
        b.classList.toggle("is-right", response === i && correct);
        b.classList.toggle("is-wrong", response === i && !correct);
      });
    };
    wrap.appendChild(el("div", { class: "choices" }, ...buttons));

  } else if (q.type === "fraction") {
    const f = fracInput({ onEnter: () => { response = f.read(); mark(); } });
    if (saved && saved.response) { /* the boxes start empty on each visit */ }
    wrap.appendChild(el("div", { class: "answer-row" }, f,
      el("button", { class: "btn", text: "Check", onclick: () => { response = f.read(); mark(); } })));

  } else if (q.type === "numeric") {
    const input = el("input", { class: "frac__in", type: "text", inputmode: "decimal",
      size: 8, "aria-label": "Your answer" });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { response = input.value; mark(); } });
    wrap.appendChild(el("div", { class: "answer-row" }, input,
      q.unit === "percent" ? el("span", { class: "muted", text: "%" }) : null,
      el("button", { class: "btn", text: "Check", onclick: () => { response = input.value; mark(); } })));

  } else if (q.type === "pockets") {
    const picked = new Set(saved && Array.isArray(saved.response) ? saved.response : []);
    const holder = el("div");
    const count = el("p", { class: "muted tight" });
    function drawWheel() {
      count.textContent = picked.size + " of " + pocketCount(wheel) + " pockets selected";
      fill(holder, wheelSVG(wheel, {
        selected: Array.from(picked), size: 300,
        onPick: (p) => { if (picked.has(p)) picked.delete(p); else picked.add(p); drawWheel(); },
      }));
    }
    drawWheel();
    wrap.appendChild(holder);
    wrap.appendChild(count);
    wrap.appendChild(el("div", { class: "btn-row" },
      el("button", { class: "btn", text: "Check", onclick: () => { response = Array.from(picked); mark(); } }),
      el("button", { class: "btn btn--quiet", text: "Clear", onclick: () => { picked.clear(); drawWheel(); } })));

  } else if (q.type === "text") {
    const area = el("textarea", { class: "text-answer", "aria-label": "Your answer" });
    if (saved && typeof saved.response === "string") area.value = saved.response;
    wrap.appendChild(area);
    wrap.appendChild(el("div", { class: "btn-row" },
      el("button", { class: "btn", text: "Check", onclick: () => { response = area.value; mark(); } })));
  }

  if (q.hint) {
    wrap.appendChild(el("div", { class: "btn-row" },
      el("button", { class: "btn btn--quiet", text: "Show a hint",
        onclick: (e) => { fill(hintBox, el("p", { class: "hint", text: q.hint })); e.target.disabled = true; } })));
  }
  wrap.appendChild(hintBox);
  wrap.appendChild(feedbackBox);
  return wrap;
}

function feedbackFor(q, res) {
  const box = el("div", { class: "feedback " + (res.correct ? "is-right" : "is-wrong") });
  box.appendChild(prose(res.correct ? q.feedback.correct : q.feedback.wrong));
  if (!res.correct && res.message) box.appendChild(el("p", { class: "muted tight", text: res.message }));
  if (q.type === "text") {
    box.appendChild(el("p", { class: "muted tight", text: "One way to say it: " + res.expected }));
  }
  return box;
}

/* ---------- tour: build the sample space ---------- */
function tourStep(mod, step) {
  const wheel = currentWheel();
  const found = new Set(view.data.found || []);
  const holder = el("div");
  const list = el("p", { class: "muted" });
  const counts = el("div", { class: "stats" });

  function draw() {
    view.data.found = Array.from(found);
    fill(holder, wheelSVG(wheel, {
      selected: Array.from(found), size: 320,
      onPick: (p) => { found.add(p); draw(); },
    }));
    const ordered = sampleSpace(wheel).filter((p) => found.has(p));
    list.textContent = ordered.length ? "{ " + ordered.join(", ") + " }" : "Click a pocket to start your list.";
    const reds = ordered.filter((p) => pocketColour(wheel, p) === "red").length;
    const blacks = ordered.filter((p) => pocketColour(wheel, p) === "black").length;
    const greens = ordered.filter((p) => pocketColour(wheel, p) === "green").length;
    fill(counts,
      stat("Found", found.size + " of " + pocketCount(wheel)),
      stat("Red", String(reds)), stat("Black", String(blacks)), stat("Green", String(greens)));
  }
  draw();

  return el("div", { class: "panel" },
    el("h2", { text: step.title }),
    prose("Click each pocket to add it to your sample space."),
    el("div", { class: "two-col" }, holder, el("div", null, counts, list)),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", text: "Add them all",
        onclick: () => { sampleSpace(wheel).forEach((p) => found.add(p)); draw(); } }),
      el("button", { class: "btn btn--quiet", text: "Start again",
        onclick: () => { found.clear(); draw(); } })));
}

/* ---------- explore: pick an event, see the count ---------- */
function exploreStep(mod, step) {
  const wheel = currentWheel();
  const holder = el("div");
  const boardHolder = el("div", { class: "board-scroll" });
  const readout = el("div");
  let betId = view.data.betId || "red";
  let arg = view.data.arg == null ? defaultArgFor(betId) : view.data.arg;

  function draw() {
    view.data = { betId: betId, arg: arg };
    const winners = betOutcomes(betId, arg, wheel);
    const p = probability(winners, wheel);

    fill(holder, wheelSVG(wheel, { highlight: winners, size: 300 }));
    fill(boardHolder, bettingBoard(wheel, {
      highlight: winners,
      selected: { betId: betId, arg: arg },
      onPick: (id, a) => { betId = id; arg = a; draw(); },
    }));
    fill(readout,
      el("p", { class: "tight" }, "You picked: " + betDescription(betId, arg) + "."),
      el("div", { class: "stats" },
        stat("Winning pockets", String(p.num)),
        stat("All pockets", String(p.den))),
      el("p", null, "P(event) = ", fracDisplay(p.num, p.den, { big: true })),
      el("p", { class: "muted" },
        "As a decimal: " + p.decimal.toFixed(3) + ". As a percentage: " + fmtPercent(p.decimal) + "."),
      el("p", { class: "muted" }, "This event is " + describeLikelihood(p.decimal) + "."));
  }
  draw();

  return el("div", { class: "panel" },
    el("h2", { text: step.title }),
    prose("Select a bet on the board. The wheel lights up the pockets that win it."),
    el("div", { class: "two-col" }, holder, readout),
    boardHolder);
}

/** The starting value for a bet that needs a group number. */
function defaultArgFor(id) {
  const b = betById(id);
  return b && b.arg && b.arg.kind === "index" ? 1 : null;
}

/* ---------- partition: do the parts add to 1? ---------- */
function partitionStep(mod, step) {
  const wheel = currentWheel();
  let chosen = view.data.split == null ? 0 : view.data.split;
  const out = el("div");

  function parse(spec) {
    const bits = spec.split(":");
    return { bet: bits[0], arg: bits[1] ? parseInt(bits[1], 10) : null };
  }

  function draw() {
    view.data.split = chosen;
    const split = step.splits[chosen];
    const sets = split.bets.map((spec) => {
      const b = parse(spec);
      return { label: betById(b.bet).label + (b.arg ? " " + b.arg : ""),
               outcomes: betOutcomes(b.bet, b.arg, wheel), colourKey: b.bet };
    });
    const result = verifySumToOne(sets, wheel);

    const rows = result.parts.map((p, i) => [
      p.label, String(p.count), fracDisplay(p.probability.num, p.probability.den),
      fmtPercent(p.probability.decimal),
    ]);
    rows.push(["Total", String(result.sum.num),
               fracDisplay(result.sum.num, result.sum.den), fmtPercent(result.sum.decimal)]);

    const parts = sets.map((s) => ({
      label: s.label, value: s.outcomes.length,
      colour: ["red", "black", "green"].indexOf(s.colourKey) !== -1 ? s.colourKey : null,
    }));

    const notes = [];
    if (result.isOne) {
      notes.push(prose("Every pocket is in exactly one group, so the probabilities add to 1."));
    } else {
      if (result.overlaps.length) {
        const list = result.overlaps.slice(0, 8).map((o) => o.pocket).join(", ");
        notes.push(prose("Some pockets are in more than one group, so they get counted twice: " + list +
          (result.overlaps.length > 8 ? ", and others." : ".")));
      }
      if (result.missing.length) {
        notes.push(prose("These pockets are in no group at all: " + result.missing.join(", ") + "."));
      }
      notes.push(prose("A set of events only adds to 1 when it covers every pocket exactly once."));
    }

    fill(out,
      stackedBar(parts, pocketCount(wheel), { caption: split.label }),
      tableFrom(["Group", "Pockets", "Probability", "Percentage"], rows, { rowHeaders: true }),
      ...notes);
  }

  const picker = el("div", { class: "btn-row" }, ...step.splits.map((s, i) =>
    el("button", { class: "btn" + (i === chosen ? " btn--primary" : ""), text: s.label,
      onclick: () => { chosen = i; draw(); render(); } })));
  draw();

  return el("div", { class: "panel" }, el("h2", { text: step.title }), picker, out);
}

/* ---------- sim: run spins ---------- */
function simStep(mod, step) {
  const wheel = currentWheel();
  const out = el("div");
  const state = view.data.sim || (view.data.sim = {
    tally: newTally(wheel), series: [], betId: step.bet, arg: null,
  });
  if (!state.betId && step.mode !== "uniform") state.betId = "red";

  function run(n) {
    const track = state.betId ? betOutcomes(state.betId, state.arg, wheel) : null;
    const res = rng.spinMany(wheel, n, track);
    tallyMerge(state.tally, res);
    if (res.series) {
      const base = state.series.length ? state.series[state.series.length - 1].n : 0;
      const priorHits = state.series.length ? state.series[state.series.length - 1].rf * base : 0;
      res.series.forEach((pt) => {
        state.series.push({ n: base + pt.n, rf: (priorHits + pt.rf * pt.n) / (base + pt.n) });
      });
      state.series = downsample(state.series);
    }
    Progress.addSpins(progress, n, 0, 0);
    Progress.save(progress);
    draw();
  }

  function draw() {
    const kids = [];
    if (step.note) kids.push(el("p", { class: "muted", text: step.note }));

    kids.push(el("div", { class: "stats" },
      stat("Spins so far", state.tally.n.toLocaleString())));

    if (state.betId) {
      const winners = betOutcomes(state.betId, state.arg, wheel);
      const theory = probability(winners, wheel);
      const obs = relativeFrequency(state.tally, winners);
      kids.push(el("div", { class: "stats" },
        stat("Theoretical", theory.fractionText + " = " + fmtPercent(theory.decimal)),
        stat("Observed", state.tally.n ? obs.hits + "/" + obs.n + " = " + fmtPercent(obs.decimal) : "no spins yet"),
        stat("Difference", state.tally.n ? fmtPercent(Math.abs(obs.decimal - theory.decimal), 2) : "-")));

      const plot = state.series.filter((p) => p.n >= CHART_MIN_SPINS);
      if (plot.length > 1) {
        kids.push(lineChart({
          title: "Observed probability of " + betById(state.betId).label.toLowerCase() + ", as the spins add up",
          series: [{ label: "Observed", role: "observed", points: plot.map((p) => ({ x: p.n, y: p.rf })) }],
          reference: { value: theory.decimal, label: "Theory" },
          xLabel: "Number of spins", percent: true,
        }));
        kids.push(chartLegend([
          { role: "observed", label: "Observed, from the spins you ran" },
          { role: "theory", label: "Theoretical, from counting pockets" },
        ]));
      }
    }

    if (step.mode === "uniform" && state.tally.n) {
      kids.push(barChart({
        title: "How many times each pocket came up",
        rows: sampleSpace(wheel).map((p) => ({ label: p, value: state.tally.counts[p] })),
        reference: { value: state.tally.n / pocketCount(wheel), label: "Expected" },
      }));
    }

    if (step.showGenerator && rng.lastDraw) {
      const d = rng.lastDraw;
      kids.push(el("p", { class: "result__draw" },
        "The generator produced " + d.random.toFixed(6) + ". That gives pocket " +
        (d.index + 1) + " of " + d.of + ", which is " + d.pocket + "."));
    }

    if (state.tally.n) {
      const rows = frequencyTable(state.tally, wheel)
        .filter((r) => r.count > 0)
        .map((r) => [r.pocket, String(r.count), (r.observed * 100).toFixed(2) + "%",
                     (r.theoretical * 100).toFixed(2) + "%"]);
      kids.push(el("details", null,
        el("summary", { text: "Show the results table" }),
        tableFrom(["Pocket", "Times", "Observed", "Theoretical"], rows, { rowHeaders: true })));
    }

    const buttons = (step.presets || [10, 100, 1000]).map((n) =>
      el("button", { class: "btn", text: "Spin " + n.toLocaleString(),
        onclick: () => run(n) }));
    kids.push(el("div", { class: "btn-row" }, ...buttons,
      el("button", { class: "btn btn--quiet", text: "Start again",
        onclick: () => { state.tally = newTally(wheel); state.series = []; rng.reset(); draw(); } })));

    fill(out, ...kids);
  }
  draw();
  return el("div", { class: "panel" }, el("h2", { text: step.title }), out);
}

/* ---------- forms: one complement, four ways ---------- */
function formsStep(mod, step) {
  const wheel = wheelById("european");
  const A = betOutcomes(step.bet, null, wheel);
  const Ac = complementSet(A, wheel);
  const pA = probability(A, wheel), pAc = probability(Ac, wheel);
  const label = betById(step.bet).label.toLowerCase();

  return el("div", { class: "panel" },
    el("h2", { text: step.title }),
    prose("A is the event 'the ball lands on " + label + "'."),

    el("h3", { text: "In words" }),
    prose("A' is the event 'the ball does not land on " + label + "'."),

    el("h3", { text: "As a list" }),
    el("p", { class: "muted" }, "A' = { " + Ac.join(", ") + " }"),

    el("h3", { text: "On the wheel" }),
    wheelSVG(wheel, { highlight: Ac, size: 280 }),

    el("h3", { text: "As a bar" }),
    stackedBar([
      { label: "A (" + pA.fractionText + ")", value: A.length, colour: step.bet === "red" ? "red" : null },
      { label: "A' (" + pAc.fractionText + ")", value: Ac.length },
    ], pocketCount(wheel), { caption: "The two parts fill the bar exactly, so the probabilities add to 1." }),

    el("p", null, "P(A) = ", fracDisplay(pA.num, pA.den), "  and  P(A') = ", fracDisplay(pAc.num, pAc.den),
      "  so P(A) + P(A') = ", fracDisplay(pA.num + pAc.num, pA.den), " = 1"));
}

/* ---------- play: the free-play simulator ---------- */
function playStep(mod, step) {
  const wheel = currentWheel();
  const s = view.data.play || (view.data.play = {
    chips: ROULETTE_CONFIG.startingChips, staked: 0, spins: 0,
    stake: ROULETTE_CONFIG.defaultStake, betId: "red", arg: null, last: null,
  });

  // The wheel keeps its own container. A redraw of the numbers must not
  // replace the wheel while the ball is moving.
  const wheelHolder = el("div");
  const boardHolder = el("div", { class: "board-scroll" });
  const panelBody = el("div");
  let spinning = false;

  function drawWheel() {
    fill(wheelHolder, wheelSVG(wheel, {
      size: 280,
      highlight: betOutcomes(s.betId, s.arg, wheel),
      ball: s.last ? s.last.pocket : null,
    }));
  }

  function drawBoard() {
    fill(boardHolder, bettingBoard(wheel, {
      selected: { betId: s.betId, arg: s.arg },
      ball: s.last ? s.last.pocket : null,
      highlight: betOutcomes(s.betId, s.arg, wheel),
      onPick: spinning ? null : (id, a) => {
        if (!isWager(id)) return;
        s.betId = id; s.arg = a; drawWheel(); drawBoard(); draw();
      },
    }));
  }

  /** One spin. The ball moves, then the numbers change. */
  function spin(animate) {
    if (spinning || s.chips < s.stake) return;
    const pocket = rng.spin(wheel);
    const winners = betOutcomes(s.betId, s.arg, wheel);
    const won = winners.indexOf(pocket) !== -1;
    const payout = betById(s.betId).payout;

    function settle() {
      s.staked += s.stake;
      s.spins++;
      s.chips += won ? s.stake * payout : -s.stake;
      s.last = { pocket: pocket, won: won, returned: won ? s.stake * payout : 0 };
      Progress.addSpins(progress, 1, s.stake, won ? s.stake * (payout + 1) : 0);
      Progress.save(progress);
      spinning = false;
      drawWheel(); drawBoard(); draw();
    }

    if (animate === false) { settle(); return; }
    spinning = true;
    draw();
    const svg = wheelHolder.querySelector(".wheel");
    const ball = svg && svg.querySelector(".wheel__ball");
    if (ball) ball.setAttribute("opacity", "1");
    animateBall(svg, wheel, pocket, settle);
  }

  function draw() {
    const net = s.chips - ROULETTE_CONFIG.startingChips;
    const kids = [];

    // The counter is on the screen at all times. It shows the total
    // staked beside the current position.
    kids.push(el("div", { class: "stats" },
      stat("Chips", fmtChips(s.chips)),
      stat("Staked", fmtChips(s.staked)),
      stat("Net", (net > 0 ? "+" : "") + fmtChips(net), { class: net < 0 ? "is-down" : "" }),
      stat("Spins", String(s.spins))));

    if (spinning) {
      kids.push(el("div", { class: "result" },
        el("div", { class: "result__pocket is-waiting", text: "?" }),
        el("div", null, el("div", { class: "result__text", text: "The wheel is turning." }))));
    } else if (s.last) {
      const c = pocketColour(wheel, s.last.pocket);
      kids.push(el("div", { class: "result" },
        el("div", { class: "result__pocket is-" + c, text: s.last.pocket }),
        el("div", null,
          el("div", { class: "result__text",
            text: "The ball landed on " + s.last.pocket + " (" + c + "). This bet paid " +
                  fmtChips(s.last.returned) + "." }),
          el("div", { class: "result__draw",
            text: "Stake " + fmtChips(s.stake) + ". You have staked " + fmtChips(s.staked) +
                  " in total across " + s.spins + " spins." }))));
    } else {
      kids.push(el("div", { class: "result" },
        el("div", { class: "result__pocket is-waiting", text: "-" }),
        el("div", null, el("div", { class: "result__text",
          text: "Select a bet on the board, then spin." }))));
    }

    const stakeInput = el("input", { class: "frac__in", type: "text", inputmode: "numeric",
      size: 4, value: String(s.stake), "aria-label": "Stake" });
    stakeInput.addEventListener("change", () => {
      const v = parseInt(stakeInput.value, 10);
      s.stake = isFinite(v) && v > 0 ? v : 1;
      draw();
    });

    kids.push(el("div", { class: "answer-row" },
      el("span", { text: "Your bet:" }),
      el("strong", { text: betDescription(s.betId, s.arg) }),
      el("span", { class: "muted", text: "pays " + betById(s.betId).payout + " to 1" })));
    kids.push(el("div", { class: "answer-row" },
      el("span", { text: "Stake" }), stakeInput, el("span", { text: "chips each spin" })));

    if (s.chips < s.stake) {
      // There is no automatic refill. The student must choose to start again.
      kids.push(el("p", { class: "feedback is-wrong",
        text: "You have run out of chips. You staked " + fmtChips(s.staked) +
              " over " + s.spins + " spins." }));
      kids.push(el("div", { class: "btn-row" },
        el("button", { class: "btn", text: "Start again with " + fmtChips(ROULETTE_CONFIG.startingChips),
          onclick: () => {
            s.chips = ROULETTE_CONFIG.startingChips; s.staked = 0; s.spins = 0; s.last = null;
            drawWheel(); drawBoard(); draw();
          } })));
    } else {
      kids.push(el("div", { class: "btn-row" },
        el("button", { class: "btn btn--primary", text: spinning ? "Spinning" : "Spin",
          disabled: spinning, onclick: () => spin(true) }),
        el("button", { class: "btn", text: "Spin 25 times", disabled: spinning,
          onclick: () => { for (let i = 0; i < 25 && s.chips >= s.stake; i++) spin(false); } })));
    }
    fill(panelBody, ...kids);
  }

  drawWheel(); drawBoard(); draw();
  return el("div", { class: "panel" },
    el("h2", { text: step.title }),
    prose("Select a bet on the board below, set your stake, then spin."),
    el("div", { class: "two-col" }, wheelHolder, panelBody),
    boardHolder);
}

/* ---------- edge: payout against true odds ---------- */
function edgeStep(mod, step) {
  const wheel = currentWheel();
  const rows = [];
  wagersForWheel(wheel).forEach((b) => {
    const arg = b.arg && b.arg.kind === "pocket" ? "17"
              : b.arg && b.arg.kind === "index" ? 1
              : b.arg && b.arg.kind === "set" ? (b.id === "split" ? ["1", "2"] : ["1", "2", "4", "5"])
              : null;
    const odds = trueOdds(b.id, arg, wheel);
    const edge = houseEdge(b.id, arg, wheel);
    const p = probabilityOfBet(b.id, arg, wheel);
    rows.push([b.label, String(p.num), b.payout + " to 1", odds.text, fmtPercent(edge, 2)]);
  });

  return el("div", { class: "panel" },
    el("h2", { text: step.title }),
    prose("This table is for the " + wheel.label + "."),
    tableFrom(["Bet", "Winning pockets", "Casino pays", "True odds", "House edge"], rows, { rowHeaders: true }),
    prose("Read down the last column."),
    el("div", { class: "btn-row" },
      el("button", { class: "btn", text: "Show the other wheel",
        onclick: () => {
          Progress.setPref("wheel", wheel.id === "european" ? "american" : "european");
          render();
        } })));
}

/* ---------- systems: the martingale ---------- */
function systemsStep(mod, step) {
  const wheel = currentWheel();
  const out = el("div");
  const plan = { startingChips: 200, stake: 1, tableLimit: ROULETTE_CONFIG.tableLimit,
                 betId: "red", arg: null };

  function run() {
    const r = martingaleRun(new SpinRNG(), wheel, 2000, plan);
    const flat = bankrollSeries(new SpinRNG(), wheel, r.spinsSurvived || 200, plan);
    fill(out,
      el("div", { class: "stats" },
        stat("Spins before it stopped", String(r.spinsSurvived)),
        stat("Longest run of losses", String(r.longestLosingRun)),
        stat("Chips left", fmtChips(r.finalChips), { class: r.net < 0 ? "is-down" : "" }),
        stat("Total staked", fmtChips(r.staked))),
      lineChart({
        title: "Chips over time with the martingale",
        series: [{ label: "Martingale", role: "observed",
                   points: r.series.map((p) => ({ x: p.n, y: p.chips })) }],
        reference: { value: plan.startingChips, label: "Start" },
        xLabel: "Number of spins",
      }),
      prose(r.hitLimit
        ? "The run stopped because the next stake was above the table limit of " +
          fmtChips(plan.tableLimit) + "."
        : "The run stopped because there were not enough chips left to double the stake again."),
      prose("The house edge on each spin was " + fmtPercent(houseEdge("red", null, wheel), 2) +
            " before the run, and it is the same now."),
      el("div", { class: "btn-row" },
        el("button", { class: "btn btn--primary", text: "Run it again", onclick: run })));
  }
  run();
  return el("div", { class: "panel" }, el("h2", { text: step.title }), out);
}

/* ---------- summary ---------- */
function summaryStep(mod) {
  const sum = Progress.summary(progress, mod.id);
  const pool = moduleQuestions(mod.id);
  const kids = [el("h2", { text: "What you did" })];

  if (pool.length && sum) {
    kids.push(el("div", { class: "stats" },
      stat("Questions answered", sum.answered + " of " + pool.length),
      stat("Correct", String(sum.correct))));
  }
  kids.push(el("div", { class: "stats" },
    stat("Spins in this activity", progress.totals.spins.toLocaleString())));

  kids.push(prose("Covered in this activity:"));
  kids.push(el("ul", { class: "muted" }, ...mod.dotpoints.map((d) =>
    el("li", { text: DOTPOINT_TEXT[d] || ("Dot point " + d) }))));
  return el("div", { class: "panel" }, ...kids);
}

/* The syllabus dot points, in words a student can read. */
const DOTPOINT_TEXT = {
  1: "Listing the sample space for a chance experiment",
  2: "Writing a probability as favourable outcomes over total outcomes",
  3: "Probabilities run from 0 (impossible) to 1 (certain)",
  4: "The probabilities of all the outcomes add to 1",
  5: "Theoretical probability, for a fair and unbiased wheel",
  6: "Observed probability, as the relative frequency from trials",
  7: "Using a random number generator to repeat an experiment",
  8: "Identifying and describing the complement of an event",
  9: "P(A) and P(A') add to 1",
  10: "Solving problems with complementary events",
  11: "Showing complementary events in different forms",
};

document.addEventListener("DOMContentLoaded", boot);
