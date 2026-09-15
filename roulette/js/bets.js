/* =====================================================
   ROULETTE: BET TYPES
   =====================================================

   A function defines each bet. The function gives the set of pockets that
   win the bet. A bet does not contain its own probability. The file
   js/probability.js calculates the probability from the set.

   This method removes the special conditions for the two wheels. The
   program asks for the winning set on the wheel that is in use. The
   probability comes from that set.

   The `payout` value uses the same format as a casino. A payout of "35 to
   1" means that you keep your stake and you receive 35 more chips. The
   true odds are different from the payout. This difference is the house
   edge. The house-edge module shows the two values together.

   The `arg` property tells you what data the bet needs:
     null                 No data. Examples are red and even.
     {kind:"pocket"}      One pocket identifier, for example "17".
     {kind:"index"}       A group number that starts at 1, for example
                          dozen 2.
     {kind:"set", size:n} A list of n pocket identifiers. A split bet and
                          a corner bet depend on the position of the
                          numbers on the table. They do not depend on the
                          values of the numbers.

   The property `wager: false` identifies an event that is not a bet. A
   student can calculate the probability of the event. A player cannot put
   a chip on it.

   Green is such an event. On a European wheel, green is the same as a
   straight-up bet on 0. On an American wheel, there is no single chip
   position that covers 0 and 00 at 35 to 1. If the program calculates an
   edge for green on an American wheel, the result shows a large player
   edge. That result is incorrect. Green stays an event. The sum-to-one
   module and the complement module can then use it.
   ===================================================== */

/** The numbered pockets 1 to 36. This set does not include the zero
    pockets. Most groups use this set. */
function numberedPockets(wheel) {
  return sampleSpace(wheel).filter((p) => !isZero(wheel, p));
}

const BET_TYPES = [
  // ---- Inside bets. These bets have few pockets and a large payout. ----
  {
    id: "straight", label: "Straight up", group: "inside", payout: 35,
    arg: { kind: "pocket" },
    describe: (a) => "the ball lands on " + a,
    outcomes: (w, a) => (sampleSpace(w).indexOf(a) === -1 ? [] : [a]),
  },
  {
    id: "split", label: "Split", group: "inside", payout: 17,
    arg: { kind: "set", size: 2 },
    describe: (a) => "the ball lands on " + a.join(" or "),
    outcomes: (w, a) => keepValid(w, a),
  },
  {
    id: "street", label: "Street", group: "inside", payout: 11,
    arg: { kind: "index", range: [1, 12] },
    describe: (a) => "the ball lands in row " + a + " (" + (3 * a - 2) + "-" + 3 * a + ")",
    outcomes: (w, a) => keepValid(w, [3 * a - 2, 3 * a - 1, 3 * a].map(String)),
  },
  {
    id: "corner", label: "Corner", group: "inside", payout: 8,
    arg: { kind: "set", size: 4 },
    describe: (a) => "the ball lands on one of " + a.join(", "),
    outcomes: (w, a) => keepValid(w, a),
  },
  {
    id: "line", label: "Six line", group: "inside", payout: 5,
    arg: { kind: "index", range: [1, 11] },
    describe: (a) => "the ball lands in rows " + a + "-" + (a + 1),
    outcomes: (w, a) =>
      keepValid(w, [3 * a - 2, 3 * a - 1, 3 * a, 3 * a + 1, 3 * a + 2, 3 * a + 3].map(String)),
  },
  {
    // This bet is available only on an American wheel. It is the
    // five-number bet. Its house edge is 7.89%. This value is larger than
    // the house edge of all the other bets. Show this bet to the students.
    // It is an exception to the rule that all bets have the same edge.
    id: "basket", label: "Five number (0-00-1-2-3)", group: "inside", payout: 6,
    arg: null, wheels: ["american"],
    describe: () => "the ball lands on 0, 00, 1, 2 or 3",
    outcomes: (w) => keepValid(w, ["0", "00", "1", "2", "3"]),
  },

  // ---- Outside bets. These bets have many pockets and a small payout. ----
  {
    id: "red", label: "Red", group: "outside", payout: 1, arg: null,
    describe: () => "the ball lands on red",
    outcomes: (w) => sampleSpace(w).filter((p) => pocketColour(w, p) === "red"),
  },
  {
    id: "black", label: "Black", group: "outside", payout: 1, arg: null,
    describe: () => "the ball lands on black",
    outcomes: (w) => sampleSpace(w).filter((p) => pocketColour(w, p) === "black"),
  },
  {
    id: "green", label: "Green (zero)", group: "outside", payout: null, wager: false, arg: null,
    describe: () => "the ball lands on green",
    outcomes: (w) => sampleSpace(w).filter((p) => pocketColour(w, p) === "green"),
  },
  {
    id: "even", label: "Even", group: "outside", payout: 1, arg: null,
    describe: () => "the ball lands on an even number",
    outcomes: (w) => numberedPockets(w).filter((p) => pocketNumber(p) % 2 === 0),
  },
  {
    id: "odd", label: "Odd", group: "outside", payout: 1, arg: null,
    describe: () => "the ball lands on an odd number",
    outcomes: (w) => numberedPockets(w).filter((p) => pocketNumber(p) % 2 === 1),
  },
  {
    id: "low", label: "Low (1-18)", group: "outside", payout: 1, arg: null,
    describe: () => "the ball lands on 1 to 18",
    outcomes: (w) => numberedPockets(w).filter((p) => pocketNumber(p) <= 18),
  },
  {
    id: "high", label: "High (19-36)", group: "outside", payout: 1, arg: null,
    describe: () => "the ball lands on 19 to 36",
    outcomes: (w) => numberedPockets(w).filter((p) => pocketNumber(p) >= 19),
  },
  {
    id: "dozen", label: "Dozen", group: "outside", payout: 2,
    arg: { kind: "index", range: [1, 3] },
    describe: (a) => "the ball lands in the " + ordinal(a) + " dozen (" + (12 * a - 11) + "-" + 12 * a + ")",
    outcomes: (w, a) =>
      numberedPockets(w).filter((p) => Math.ceil(pocketNumber(p) / 12) === a),
  },
  {
    id: "column", label: "Column", group: "outside", payout: 2,
    arg: { kind: "index", range: [1, 3] },
    describe: (a) => "the ball lands in column " + a,
    outcomes: (w, a) =>
      numberedPockets(w).filter((p) => ((pocketNumber(p) - 1) % 3) + 1 === a),
  },
];

/** This function removes each item that is not a pocket on this wheel. It
    also removes each item that occurs more than one time. */
function keepValid(wheel, ids) {
  const space = sampleSpace(wheel);
  const seen = {};
  return (ids || []).filter((p) => {
    if (space.indexOf(p) === -1 || seen[p]) return false;
    seen[p] = true;
    return true;
  });
}

function ordinal(n) {
  return ["", "first", "second", "third"][n] || String(n);
}

function betById(id) {
  return BET_TYPES.filter((b) => b.id === id)[0] || null;
}

/** The set of pockets that win this bet on this wheel. */
function betOutcomes(betId, arg, wheel) {
  const bet = betById(betId);
  if (!bet) return [];
  const w = wheel || currentWheel();
  if (bet.wheels && bet.wheels.indexOf(w.id) === -1) return [];
  return bet.outcomes(w, arg);
}

/** A description in words. The questions and the worksheets use it. */
function betDescription(betId, arg) {
  const bet = betById(betId);
  return bet ? bet.describe(arg) : "";
}

/** All the bets and all the events on this wheel. */
function betsForWheel(wheel) {
  const w = wheel || currentWheel();
  return BET_TYPES.filter((b) => !b.wheels || b.wheels.indexOf(w.id) !== -1);
}

/** Only the bets that a player can put a chip on. The house-edge table
    uses this list. */
function wagersForWheel(wheel) {
  return betsForWheel(wheel).filter((b) => b.wager !== false);
}

/** This function gives true if the item is a bet. It gives false if the
    item is only an event. */
function isWager(betId) {
  const b = betById(betId);
  return !!b && b.wager !== false;
}
