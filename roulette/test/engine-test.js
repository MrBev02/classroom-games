// ---- test suite (appended after the engine files) ----

const EU = WHEELS.european, US = WHEELS.american;

console.log("\n== wheel ==");
ok("European has 37 pockets", pocketCount(EU) === 37, pocketCount(EU));
ok("American has 38 pockets", pocketCount(US) === 38, pocketCount(US));
[["European", EU], ["American", US]].forEach(([name, w]) => {
  const space = sampleSpace(w).slice().sort();
  const order = w.order.slice().sort();
  ok(name + " wheel order == sample space", JSON.stringify(space) === JSON.stringify(order));
  ok(name + " order has no duplicates", new Set(w.order).size === w.order.length);
  const reds = space.filter(p => pocketColour(w, p) === "red").length;
  const blacks = space.filter(p => pocketColour(w, p) === "black").length;
  const greens = space.filter(p => pocketColour(w, p) === "green").length;
  ok(name + " 18 red / 18 black", reds === 18 && blacks === 18, reds + "/" + blacks);
  ok(name + " greens = " + w.zeroes.length, greens === w.zeroes.length, greens);
});
ok("00 and 0 stay distinct", pocketColour(US,"00")==="green" && sampleSpace(US).indexOf("00") !== -1);

console.log("\n== probability ==");
const pRed = probabilityOfBet("red", null, EU);
ok("P(red) EU = 18/37 unreduced", pRed.fractionText === "18/37", pRed.fractionText);
ok("P(red) EU decimal", near(pRed.decimal, 18/37));
const pDoz = probabilityOfBet("dozen", 1, EU);
ok("P(dozen 1) EU = 12/37", pDoz.fractionText === "12/37", pDoz.fractionText);
ok("12/36 reduces to 1/3", fmtFraction(reduceFraction(12,36)) === "1/3");
ok("18/37 does not reduce", fmtFraction(reduceFraction(18,37)) === "18/37");
const pImp = probability([], EU);
ok("impossible event = 0", pImp.decimal === 0);
ok("certain event = 1", probability(sampleSpace(EU), EU).decimal === 1);

console.log("\n== complements ==");
["red","even","low","dozen","straight"].forEach(id => {
  const arg = id === "dozen" ? 2 : id === "straight" ? "17" : null;
  const A = betOutcomes(id, arg, EU), Ac = complementOfBet(id, arg, EU);
  const pa = probability(A, EU).decimal, pac = probability(Ac, EU).decimal;
  ok("P(" + id + ") + P(not " + id + ") = 1", near(pa + pac, 1), pa + "+" + pac);
  ok(id + ": |A|+|A'| = 37", A.length + Ac.length === 37);
  ok(id + ": A and A' disjoint", A.filter(p => Ac.indexOf(p) !== -1).length === 0);
});
const compDoz1 = complementOfBet("dozen", 1, EU);
ok("complement of dozen 1 includes 0", compDoz1.indexOf("0") !== -1);

console.log("\n== sum to one ==");
const good = verifySumToOne([
  { label: "red",   outcomes: betOutcomes("red", null, EU) },
  { label: "black", outcomes: betOutcomes("black", null, EU) },
  { label: "green", outcomes: betOutcomes("green", null, EU) },
], EU);
ok("red/black/green partitions the wheel", good.isOne === true);
ok("...and totals 37/37", good.sum.fractionText === "37/37", good.sum.fractionText);
const bad = verifySumToOne([
  { label: "red",  outcomes: betOutcomes("red", null, EU) },
  { label: "even", outcomes: betOutcomes("even", null, EU) },
], EU);
ok("red/even is NOT a partition", bad.isOne === false);
ok("...and names the overlapping pockets", bad.overlaps.length > 0, bad.overlaps.length + " overlaps");
ok("...and names what's missing", bad.missing.length > 0, bad.missing.length + " missing");

console.log("\n== the punchline: every bet, same edge ==");
function edgesFor(w, label, expected) {
  const rows = [];
  wagersForWheel(w).forEach(b => {
    let args = [null];
    if (b.arg && b.arg.kind === "pocket") args = ["17"];
    else if (b.arg && b.arg.kind === "index") args = [1, 2];
    else if (b.arg && b.arg.kind === "set") args = [b.id === "split" ? ["1","2"] : ["1","2","4","5"]];
    args.forEach(a => rows.push({ id: b.id, edge: houseEdge(b.id, a, w) }));
  });
  rows.forEach(r => {
    if (r.id === "basket") return; // the one deliberate exception
    ok(label + " " + r.id + " edge = " + (expected*100).toFixed(2) + "%",
       near(r.edge, expected, 1e-12), (r.edge*100).toFixed(4) + "%");
  });
  return rows;
}
edgesFor(EU, "EU", 1/37);
edgesFor(US, "US", 2/38);
const basket = houseEdge("basket", null, US);
ok("US five-number bet is WORSE (7.89%)", near(basket, 3/38, 1e-12), (basket*100).toFixed(2) + "%");
ok("basket does not exist on European wheel", betOutcomes("basket", null, EU).length === 0);
ok("green is an event, not a wager", isWager("green") === false);
ok("...so it has no house edge", houseEdge("green", null, US) === null);
ok("...but still has a probability", probabilityOfBet("green", null, US).fractionText === "2/38",
   probabilityOfBet("green", null, US).fractionText);
ok("green excluded from the edge table", wagersForWheel(US).filter(b => b.id === "green").length === 0);

console.log("\n== true odds vs payout ==");
const to = trueOdds("straight", "17", EU);
ok("straight true odds 36 to 1", to.text === "36 to 1", to.text);
ok("...but pays 35 to 1", betById("straight").payout === 35);
const tr = trueOdds("red", null, EU);
ok("red true odds 19 to 18", tr.text === "19 to 18", tr.text);

console.log("\n== expected loss (debrief maths) ==");
const loss = expectedLoss(5, 40, 1, "red", null, EU);
ok("$5 x 40 spins/hr EU ~ $5.41/hr", near(loss, 5*40*(1/37), 1e-9), "$" + loss.toFixed(2));
const lossUS = expectedLoss(5, 40, 1, "red", null, US);
ok("...and more on an American wheel", lossUS > loss, "$" + lossUS.toFixed(2));

console.log("\n== the random number generator ==");
const seeded1 = new SpinRNG(12345), seeded2 = new SpinRNG(12345);
ok("same seed = same sequence",
   [0,1,2,3,4].map(()=>seeded1.spin(EU)).join(",") === [0,1,2,3,4].map(()=>seeded2.spin(EU)).join(","));
const r3 = new SpinRNG(999); r3.spin(EU);
ok("draw shows its working", r3.lastDraw && r3.lastDraw.random >= 0 && r3.lastDraw.random < 1
   && r3.lastDraw.of === 37 && sampleSpace(EU)[r3.lastDraw.index] === r3.lastDraw.pocket);
const big = new SpinRNG(7).spinMany(EU, 100000);
ok("100k spins accounted for", Object.values(big.counts).reduce((a,b)=>a+b,0) === 100000);
const rfs = sampleSpace(EU).map(p => big.counts[p] / 100000);
const worst = Math.max(...rfs.map(r => Math.abs(r - 1/37)));
ok("every pocket within 0.004 of 1/37", worst < 0.004, "worst drift " + worst.toFixed(5));
const tracked = new SpinRNG(7).spinMany(EU, 10000, betOutcomes("red", null, EU));
ok("tracked run respects the series cap", tracked.series.length <= ROULETTE_CONFIG.maxSeriesPoints,
   tracked.series.length + " pts");
ok("tracked series ends on the final spin",
   tracked.series[tracked.series.length-1].n === 10000, tracked.series[tracked.series.length-1].n);
ok("tracked series has no duplicate final point",
   new Set(tracked.series.map(p=>p.n)).size === tracked.series.length);
[1,10,300,301,999,10000,100000].forEach(n => {
  const t = new SpinRNG(3).spinMany(EU, n, betOutcomes("red", null, EU));
  ok("cap holds at n=" + n, t.series.length <= ROULETTE_CONFIG.maxSeriesPoints && t.series[t.series.length-1].n === n,
     t.series.length + " pts, ends " + t.series[t.series.length-1].n);
});

console.log("\n== consecutive seeds must not correlate ==");
const firsts = [1,2,3,4,5,6,7,8].map(s => new SpinRNG(s).next());
ok("consecutive seeds spread across both halves",
   firsts.some(v => v < 0.5) && firsts.some(v => v >= 0.5),
   firsts.map(v=>v.toFixed(2)).join(" "));
ok("consecutive seeds give different sequences",
   new Set([1,2,3,4,5].map(s => { const r = new SpinRNG(s); return [0,0,0,0].map(()=>r.spin(EU)).join(); })).size === 5);
ok("a named seed still reproduces exactly",
   [0,0,0,0,0].map(()=>new SpinRNG(2026).spin(EU)).join() ===
   [0,0,0,0,0].map(()=>new SpinRNG(2026).spin(EU)).join());
ok("observed P(red) near theoretical", Math.abs(tracked.hits/10000 - 18/37) < 0.02,
   (tracked.hits/10000).toFixed(4));

console.log("\n== bankroll / martingale ==");
const bank = bankrollSeries(new SpinRNG(42), EU, 2000, { startingChips: 5000, stake: 5, betId: "red", arg: null });
ok("bankroll series is capped", bank.series.length <= ROULETTE_CONFIG.maxSeriesPoints, bank.series.length + " pts");

// Do not test that one session loses chips. One session can finish with a
// profit. The activity teaches this variation. The house edge is a
// statement about the average. Thus the test uses the average.
let net = 0, ahead = 0; const RUNS = 400;
for (let s = 0; s < RUNS; s++) {
  const r = bankrollSeries(new SpinRNG((s * 2654435761) >>> 0), EU, 2000,
    { startingChips: 5000, stake: 5, betId: "red", arg: null });
  net += r.net; if (r.net > 0) ahead++;
}
const meanNet = net / RUNS, expectedNet = -2000 * 5 * (1/37);
ok("mean net over " + RUNS + " sessions matches the theoretical edge",
   Math.abs(meanNet - expectedNet) < 40, meanNet.toFixed(1) + " vs " + expectedNet.toFixed(1));
ok("but SOME sessions finish ahead (this is the point)", ahead > 0 && ahead < RUNS,
   ahead + "/" + RUNS + " finished ahead");
const mart = martingaleRun(new SpinRNG(42), EU, 5000, { startingChips: 500, stake: 1, tableLimit: 100, betId: "red", arg: null });
ok("martingale eventually stops", mart.spinsSurvived < 5000 || mart.net < 0,
   "survived " + mart.spinsSurvived + ", net " + mart.net + ", limit hit: " + mart.hitLimit);
ok("martingale records its longest losing run", mart.longestLosingRun > 0, mart.longestLosingRun);

console.log("\n" + (fail ? "FAILED " + fail + " / " + (pass+fail) : "engine: all " + pass + " checks passed"));
if (fail) globalThis.__fail = true;
