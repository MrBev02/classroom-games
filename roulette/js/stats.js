/* =====================================================
   ROULETTE: TALLIES AND SERIES
   =====================================================

   This file changes the spin counts into the data that the modules show.
   The data includes relative frequencies, convergence lines and bankroll
   lines.

   Each series has a limited number of points. The limit is in the file
   data/config.js. The host sends its full state to the projector after
   each change. Thus a run of 10,000 spins must become a few hundred
   points. A projector cannot show more than a few hundred points.
   ===================================================== */

/* The limit has one definition. It is in data/config.js. The file
   js/rng.js uses the same value. */
function maxSeriesPoints() {
  return ROULETTE_CONFIG.maxSeriesPoints;
}

function newTally(wheel) {
  const counts = {};
  sampleSpace(wheel).forEach((p) => { counts[p] = 0; });
  return { counts: counts, n: 0 };
}

function tallyAdd(tally, pocket) {
  tally.counts[pocket] = (tally.counts[pocket] || 0) + 1;
  tally.n++;
  return tally;
}

/** This function adds the result of spinMany() to a total. */
function tallyMerge(tally, result) {
  Object.keys(result.counts).forEach((p) => {
    tally.counts[p] = (tally.counts[p] || 0) + result.counts[p];
  });
  tally.n += result.n;
  return tally;
}

/** The number of times that a set of pockets occurred. This value is the
    observed probability. */
function relativeFrequency(tally, favSet) {
  if (!tally.n) return { hits: 0, n: 0, decimal: 0, percent: 0 };
  const hits = favSet.reduce((sum, p) => sum + (tally.counts[p] || 0), 0);
  return {
    hits: hits,
    n: tally.n,
    decimal: hits / tally.n,
    percent: (hits / tally.n) * 100,
  };
}

/**
 * This function gives a frequency table. The table has one row for each
 * pocket. Each row shows the observed relative frequency and the
 * theoretical probability.
 */
function frequencyTable(tally, wheel) {
  const w = wheel || currentWheel();
  const theoretical = 1 / pocketCount(w);
  return sampleSpace(w).map((p) => ({
    pocket: p,
    colour: pocketColour(w, p),
    count: tally.counts[p] || 0,
    observed: tally.n ? (tally.counts[p] || 0) / tally.n : 0,
    theoretical: theoretical,
  }));
}

/** This function reduces the number of points to the limit. The points
    have equal spaces between them. The function always keeps the last
    point. */
function downsample(series, max) {
  const cap = max || maxSeriesPoints();
  if (series.length <= cap) return series;
  const step = series.length / cap;
  const out = [];
  for (let i = 0; i < cap; i++) out.push(series[Math.floor(i * step)]);
  out[out.length - 1] = series[series.length - 1];
  return out;
}

/**
 * This function gives the quantity of chips after each spin. The stake
 * stays the same for each spin.
 *
 * plan: { startingChips, stake, betId, arg }
 */
function bankrollSeries(rng, wheel, spins, plan) {
  const w = wheel || currentWheel();
  const winners = {};
  betOutcomes(plan.betId, plan.arg, w).forEach((p) => { winners[p] = true; });
  const bet = betById(plan.betId);
  const payout = bet ? bet.payout : 1;

  let chips = plan.startingChips;
  let staked = 0;
  const series = [{ n: 0, chips: chips }];

  for (let i = 0; i < spins && chips >= plan.stake; i++) {
    const pocket = rng.spin(w);
    staked += plan.stake;
    chips += winners[pocket] ? plan.stake * payout : -plan.stake;
    series.push({ n: i + 1, chips: chips });
  }

  return {
    series: downsample(series),
    finalChips: chips,
    staked: staked,
    net: chips - plan.startingChips,
    bust: chips < plan.stake,
  };
}

/**
 * This function does a martingale run. In this system, the player
 * multiplies the stake by 2 after each loss. The first win then recovers
 * all the losses. Students frequently suggest this system.
 *
 * The system fails for two reasons. The table has a maximum stake, thus
 * the player cannot continue to multiply the stake. Also, a long sequence
 * of losses uses all the chips of the player.
 *
 * The expected value for each spin stays the same.
 */
function martingaleRun(rng, wheel, spins, plan) {
  const w = wheel || currentWheel();
  const winners = {};
  betOutcomes(plan.betId, plan.arg, w).forEach((p) => { winners[p] = true; });
  const bet = betById(plan.betId);
  const payout = bet ? bet.payout : 1;

  let chips = plan.startingChips;
  let stake = plan.stake;
  let staked = 0;
  let longestLosingRun = 0;
  let run = 0;
  let hitLimit = false;
  const series = [{ n: 0, chips: chips }];

  let i = 0;
  for (; i < spins; i++) {
    if (stake > chips) break;            // The player does not have sufficient chips.
    if (stake > plan.tableLimit) { hitLimit = true; break; }
    const pocket = rng.spin(w);
    staked += stake;
    if (winners[pocket]) {
      chips += stake * payout;
      stake = plan.stake;                 // Set the stake to the first value after a win.
      run = 0;
    } else {
      chips -= stake;
      stake *= 2;                         // Multiply the stake by 2 after a loss.
      run++;
      if (run > longestLosingRun) longestLosingRun = run;
    }
    series.push({ n: i + 1, chips: chips });
  }

  return {
    series: downsample(series),
    finalChips: chips,
    staked: staked,
    net: chips - plan.startingChips,
    spinsSurvived: i,
    longestLosingRun: longestLosingRun,
    hitLimit: hitLimit,
    bust: stake > chips,
  };
}
