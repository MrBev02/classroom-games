/* =====================================================
   ROULETTE: PROBABILITY
   =====================================================

   RULE FOR THIS PROJECT:

     Do not write a probability, a percentage, a fraction, an expected
     value or a house edge as a literal value in a different file. This
     rule applies to the question bank, to the text of a module and to
     the printed answer key. If you need one of these numbers, call a
     function in this file.

     The program lets the user change the wheel. If you write "2.70%" in
     a text string, that string is not correct for an American wheel.
     The program calculates each number when it needs it.

     The printed answer key uses the same functions as the screen. Thus
     the answer key always agrees with the screen.
   ===================================================== */

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
}

function reduceFraction(n, d) {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function fmtFraction(f) {
  return f.n + "/" + f.d;
}

function fmtPercent(x, dp) {
  return (x * 100).toFixed(dp == null ? 1 : dp) + "%";
}

/**
 * This function gives the probability of a set of outcomes. It gives the
 * probability in each form that a question can ask for.
 *
 * The values num and den are not reduced. The value 18/37 shows the count
 * of the favourable outcomes and the count of all the outcomes. The
 * function also gives the reduced fraction, the decimal and the percentage.
 */
function probability(favSet, wheel) {
  const w = wheel || currentWheel();
  const den = pocketCount(w);
  const num = keepValid(w, favSet).length;
  return {
    num: num,
    den: den,
    reduced: reduceFraction(num, den),
    decimal: num / den,
    percent: (num / den) * 100,
    fractionText: num + "/" + den,
  };
}

function probabilityOfBet(betId, arg, wheel) {
  return probability(betOutcomes(betId, arg, wheel), wheel);
}

/**
 * This function gives the complement of an event. The complement is each
 * outcome in the sample space that is not in the event.
 *
 * The sequence is the sample-space sequence. A student writes the list in
 * the same sequence.
 */
function complementSet(favSet, wheel) {
  const w = wheel || currentWheel();
  const inSet = {};
  keepValid(w, favSet).forEach((p) => { inSet[p] = true; });
  return sampleSpace(w).filter((p) => !inSet[p]);
}

function complementOfBet(betId, arg, wheel) {
  return complementSet(betOutcomes(betId, arg, wheel), wheel);
}

/**
 * This function tests a group of events. The events must divide the wheel
 * into parts. The sum of the probabilities must be exactly 1.
 *
 * The function also gives the reason for a failure. There are two possible
 * faults. Two events can contain the same pocket. Also, the events can
 * omit a pocket.
 *
 * Example: red and even are not a correct division. The two events both
 * contain pocket 12, pocket 14 and pocket 16. The function gives a list of
 * these pockets. The sum-to-one module shows this list to the student.
 *
 * @param sets [{label, outcomes:[pocketId]}]
 */
function verifySumToOne(sets, wheel) {
  const w = wheel || currentWheel();
  const den = pocketCount(w);
  const seen = {};        // Each pocket has a list of the events that contain it.
  const parts = [];

  sets.forEach((s) => {
    const valid = keepValid(w, s.outcomes);
    valid.forEach((p) => {
      if (!seen[p]) seen[p] = [];
      seen[p].push(s.label);
    });
    parts.push({ label: s.label, count: valid.length, probability: probability(valid, w) });
  });

  const total = parts.reduce((sum, p) => sum + p.count, 0);
  const overlaps = Object.keys(seen)
    .filter((p) => seen[p].length > 1)
    .map((p) => ({ pocket: p, claimedBy: seen[p] }));
  const missing = sampleSpace(w).filter((p) => !seen[p]);

  return {
    parts: parts,
    sum: { num: total, den: den, decimal: total / den, fractionText: total + "/" + den },
    isOne: total === den && overlaps.length === 0 && missing.length === 0,
    overlaps: overlaps,
    missing: missing,
  };
}

/**
 * This function gives the true odds of a bet. It uses the same format as a
 * casino payout. The value "36 to 1" means that there are 36 ways to lose
 * and 1 way to win.
 *
 * Show the true odds and the payout together. A straight-up bet has true
 * odds of 36 to 1. The casino pays 35 to 1. The difference is the house
 * edge.
 */
function trueOdds(betId, arg, wheel) {
  const w = wheel || currentWheel();
  const wins = betOutcomes(betId, arg, w).length;
  const losses = pocketCount(w) - wins;
  if (wins === 0) return { against: losses, to: 0, text: "never wins" };
  const f = reduceFraction(losses, wins);
  return { against: f.n, to: f.d, text: f.n + " to " + f.d };
}

/**
 * This function gives the expected value for a stake of 1 chip. The result
 * is a positive number or a negative number.
 *
 * If the bet wins, the player receives `payout` chips.
 * If the bet loses, the player loses the 1 chip of the stake.
 *   EV = payout x P(win) - 1 x P(lose)
 *
 * Each bet on a European wheel gives -1/37. Each bet on an American wheel
 * gives -2/38. The five-number bet is an exception with a larger loss.
 */
function expectedValuePerUnit(betId, arg, wheel) {
  const bet = betById(betId);
  // An event that is not a bet has no expected value. The function gives
  // null. It does not give 0. A value of 0 puts the event in the
  // house-edge table as a bet with no loss. That entry is not correct.
  if (!bet || bet.wager === false) return null;
  const p = probabilityOfBet(betId, arg, wheel).decimal;
  return bet.payout * p - 1 * (1 - p);
}

/** The house edge. This is the part of each chip of the stake that the
    casino keeps. */
function houseEdge(betId, arg, wheel) {
  const ev = expectedValuePerUnit(betId, arg, wheel);
  return ev === null ? null : -ev;
}

/**
 * This function gives the expected loss for a period of play. The teacher
 * uses it in the debrief.
 *
 * The function calculates the result. The result is not a fixed value. If
 * the teacher changes the stake, the result changes.
 */
function expectedLoss(stake, spinsPerHour, hours, betId, arg, wheel) {
  const edge = houseEdge(betId || "red", arg, wheel);
  return stake * spinsPerHour * hours * edge;
}

/**
 * This function gives the position of a probability on the scale from 0 to
 * 1. A probability of 0 is impossible. A probability of 1 is certain. The
 * number-line activity uses this function.
 */
function describeLikelihood(p) {
  if (p === 0) return "impossible";
  if (p === 1) return "certain";
  if (p < 0.5) return "less likely than not";
  if (p > 0.5) return "more likely than not";
  return "even chance";
}
