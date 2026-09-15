/* =====================================================
   ROULETTE: PROJECTOR VIEWS
   =====================================================

   These functions build the screens that the class sees.

   The projector uses them. The teacher console also uses them, to show a
   copy of the projector on the teacher's own screen. Thus a teacher can
   see the result of each control without looking up at the wall, and the
   two screens cannot become different.

   A view reads only the state it receives. It holds no state of its own.
   ===================================================== */

function projectorView(state, opts) {
  const o = opts || {};
  if (!state) return el("div", { class: "idle" }, el("h1", { class: "idle__title", text: "Roulette and Probability" }));
  if (state.showCode && state.code) return codeView(state);
  if (state.phase === "module" && state.demoModule) return moduleView(state, o);
  return idleView();
}

function idleView() {
  return el("div", { class: "idle" },
    el("h1", { class: "idle__title", text: "Roulette and Probability" }),
    el("p", { style: "margin:1rem auto 0", text: "Waiting for your teacher." }));
}

function codeView(state) {
  return el("div", { class: "codewrap" },
    el("div", { class: "codewrap__label", text: "Type this code to start" }),
    el("div", { class: "codewrap__code", text: state.code }),
    state.joinUrl ? el("div", { class: "codewrap__url", text: state.joinUrl }) : null);
}

function moduleView(state, o) {
  const wheel = wheelById(state.wheel);
  const mod = moduleById(state.demoModule);
  const kids = [el("h1", { text: mod.title })];

  switch (mod.id) {
    case "sample-space": kids.push(sampleSpaceView(wheel, state)); break;
    case "house-edge": kids.push(edgeView(wheel)); break;
    case "betting-systems": kids.push(systemsView(wheel, state)); break;
    case "debrief": kids.push(debriefView(wheel)); break;
    default: kids.push(simView(wheel, mod, state, o)); break;
  }
  return el("div", null, ...kids);
}

/* ---------- the sample space ---------- */
function sampleSpaceView(wheel, state) {
  const reds = betOutcomes("red", null, wheel).length;
  const blacks = betOutcomes("black", null, wheel).length;
  const greens = betOutcomes("green", null, wheel).length;
  return el("div", null,
    el("div", { class: "row split" },
      wheelSVG(wheel, { size: 420, ball: state.ball || null }),
      el("div", null,
        el("div", { class: "big-stats" },
          bigStat("Pockets", String(pocketCount(wheel))),
          bigStat("Red", String(reds)),
          bigStat("Black", String(blacks)),
          bigStat("Green", String(greens))),
        el("p", { style: "margin-top:1.5rem",
          text: "Every pocket is one outcome. Each has a probability of 1 over " +
                pocketCount(wheel) + "." }))),
    el("div", { class: "board-scroll" }, bettingBoard(wheel, { ball: state.ball || null })));
}

/* ---------- theory against the spins ---------- */
function simView(wheel, mod, state, o) {
  const betId = state.betId || "red";
  const arg = state.arg == null ? null : state.arg;
  const winners = betOutcomes(betId, arg, wheel);
  const theory = probability(winners, wheel);

  const kids = [];
  kids.push(el("p", { class: "lead",
    text: "Bet: " + betDescription(betId, arg) + ". " + theory.num + " of the " +
          theory.den + " pockets win it." }));

  kids.push(el("div", { class: "row split" },
    wheelSVG(wheel, { size: o.small ? 200 : 340, highlight: winners, ball: state.ball || null }),
    el("div", { class: "board-scroll" }, bettingBoard(wheel, {
      highlight: winners, ball: state.ball || null,
      selected: { betId: betId, arg: arg },
    }))));

  if (!state.sim || !state.sim.n) {
    kids.push(el("p", { text: "No spins yet." }));
    return el("div", null, ...kids);
  }

  const hits = winners.reduce((a, p) => a + (state.sim.counts[p] || 0), 0);
  const observed = hits / state.sim.n;

  kids.push(el("div", { class: "big-stats" },
    bigStat("Spins", state.sim.n.toLocaleString()),
    bigStat("Wins", hits.toLocaleString()),
    bigStat("Observed", fmtPercent(observed)),
    bigStat("Theory", fmtPercent(theory.decimal)),
    bigStat("Difference", fmtPercent(Math.abs(observed - theory.decimal), 2))));

  // The first few spins give a relative frequency of 0 or 1, which would
  // set the scale of the whole chart. The line starts once there are
  // enough spins for it to mean something.
  const plot = state.sim.series ? state.sim.series.filter((p) => p.n >= CHART_MIN_SPINS) : [];
  if (plot.length > 1) {
    kids.push(lineChart({
      series: [{ label: "Observed", role: "observed",
                 points: plot.map((p) => ({ x: p.n, y: p.rf })) }],
      reference: { value: theory.decimal, label: "Theory" },
      xLabel: "Number of spins", percent: true,
    }));
    kids.push(chartLegend([
      { role: "observed", label: "Observed, from the spins" },
      { role: "theory", label: "Theoretical, from counting pockets" },
    ]));
  }
  if (mod.id === "equally-likely") {
    kids.push(barChart({
      rows: sampleSpace(wheel).map((p) => ({ label: p, value: state.sim.counts[p] || 0 })),
      reference: { value: state.sim.n / pocketCount(wheel), label: "Expected" },
    }));
  }
  return el("div", null, ...kids);
}

/* ---------- the house edge ---------- */
function edgeView(wheel) {
  const rows = wagersForWheel(wheel).map((b) => {
    const arg = demoArgFor(b);
    return [b.label, b.payout + " to 1", trueOdds(b.id, arg, wheel).text,
            fmtPercent(houseEdge(b.id, arg, wheel), 2)];
  });
  return el("div", null,
    tableFrom(["Bet", "Casino pays", "True odds", "House edge"], rows, { rowHeaders: true }),
    el("p", { style: "margin-top:1rem", text: "Read down the last column." }));
}

/** A representative value for a bet that needs one, for the edge table. */
function demoArgFor(b) {
  if (!b.arg) return null;
  if (b.arg.kind === "pocket") return "17";
  if (b.arg.kind === "index") return 1;
  if (b.arg.kind === "set") return b.id === "split" ? ["1", "2"] : ["1", "2", "4", "5"];
  return null;
}

/* ---------- betting systems ---------- */
function systemsView(wheel, state) {
  const r = state.martingale;
  if (!r) return el("p", { text: "Your teacher will run the system." });
  return el("div", null,
    el("div", { class: "big-stats" },
      bigStat("Spins survived", String(r.spinsSurvived)),
      bigStat("Longest losing run", String(r.longestLosingRun)),
      bigStat("Chips left", fmtChips(r.finalChips)),
      bigStat("Total staked", fmtChips(r.staked)),
      bigStat("House edge", fmtPercent(houseEdge("red", null, wheel), 2))),
    lineChart({
      series: [{ label: "Martingale", role: "observed",
                 points: r.series.map((p) => ({ x: p.n, y: p.chips })) }],
      reference: { value: r.startingChips, label: "Start" },
      xLabel: "Number of spins",
    }),
    el("p", { text: r.hitLimit
      ? "The stake reached the table limit, so the doubling had to stop."
      : "The chips ran out before the next double." }),
    el("p", { text: "The house edge did not move." }));
}

/* ---------- the debrief ---------- */
function debriefView(wheel) {
  const d = ROULETTE_CONFIG.debrief;
  const perHour = expectedLoss(d.stakePerSpin, d.spinsPerHour, 1, "red", null, wheel);
  const contacts = (typeof SUPPORT_CONTACTS !== "undefined" ? SUPPORT_CONTACTS : []);
  return el("div", null,
    el("div", { class: "big-stats" },
      bigStat("House edge", fmtPercent(houseEdge("red", null, wheel), 2)),
      bigStat("Stake each spin", fmtAUD(d.stakePerSpin)),
      bigStat("Spins each hour", String(d.spinsPerHour)),
      bigStat("Expected loss each hour", fmtAUD(perHour))),
    el("p", { style: "margin-top:1.5rem",
      text: "Every bet on this wheel has the same house edge. No betting system changes it." }),
    el("p", { text: "The longer a person plays, the closer their result gets to that loss." }),
    el("div", { style: "margin-top:1.5rem" }, ...contacts.map((c) =>
      el("p", null, c.name + ". " + c.detail))));
}

function bigStat(label, value) {
  return el("div", null,
    el("div", { class: "big-stat__label", text: label }),
    el("div", { class: "big-stat__value", text: value }));
}
