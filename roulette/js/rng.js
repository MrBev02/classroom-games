/* =====================================================
   ROULETTE: RANDOM NUMBER GENERATOR
   =====================================================

   This file contains a random number generator with a seed. It is the
   mulberry32 algorithm. The program does not use Math.random.

   There are two reasons for a seed:

   1. The teacher can repeat a demonstration. If you set a seed, each
      class sees the same 10,000 spins. The teacher knows the result
      before the demonstration starts. All the students can also analyse
      the same sequence.

   2. The syllabus tells the students to use a random number generator.
      Thus the generator must be visible on the screen. Each spin records
      the random number and the calculation. A module shows this data:
      0.4821 gives pocket 18 of 37. The ball stops on pocket 5.
   ===================================================== */

/**
 * This function mixes the bits of a seed.
 *
 * The mulberry32 algorithm is fast, but two adjacent seeds give two
 * similar sequences. For the seeds 1, 2, 3 and 4, the first values are
 * 0.63, 0.73, 0.72 and 0.92. All four values are more than 0.5.
 *
 * A teacher can use seed 1 in one lesson and seed 2 in the next lesson.
 * Without this function, the two lessons start with similar spins. That
 * result is not correct for a lesson about randomness.
 *
 * The program keeps the seed of the teacher as the label. The generator
 * starts from the mixed value.
 */
function scrambleSeed(s) {
  let x = ((s >>> 0) + 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return (x ^ (x >>> 15)) >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class SpinRNG {
  /**
   * @param seed  A number gives the same sequence each time. A value of
   *              null gives a different sequence each time.
   */
  constructor(seed) {
    this.seed = seed == null ? Math.floor(Math.random() * 4294967295) : seed >>> 0;
    this.explicitSeed = seed != null;
    this.next = mulberry32(scrambleSeed(this.seed));
    this.count = 0;
    this.lastDraw = null;
  }

  /** This function starts the same sequence again from the first value. */
  reset() {
    this.next = mulberry32(scrambleSeed(this.seed));
    this.count = 0;
    this.lastDraw = null;
  }

  /**
   * This function does one spin. It gives the pocket identifier. It also
   * records the calculation in `lastDraw`. A module can then show how the
   * random number gives a pocket.
   */
  spin(wheel) {
    const w = wheel || currentWheel();
    const space = sampleSpace(w);
    const r = this.next();
    const index = Math.floor(r * space.length);
    this.count++;
    this.lastDraw = {
      random: r,
      index: index,
      of: space.length,
      pocket: space[index],
    };
    return space[index];
  }

  /**
   * This function does many spins. It gives the counts. It does not give a
   * list of the results.
   *
   * Do not keep 10,000 results as 10,000 strings. The host sends its full
   * state to the projector after each change. The program also writes the
   * state to localStorage. A set of 37 counts contains all the data that
   * the frequency activity needs.
   *
   * The parameter `track` is optional. It gives a set of pockets. The
   * function then gives the relative frequency after each group of spins.
   * The convergence chart uses this data.
   */
  spinMany(wheel, n, track) {
    const w = wheel || currentWheel();
    const space = sampleSpace(w);
    const counts = {};
    space.forEach((p) => { counts[p] = 0; });

    const following = {};
    if (track) track.forEach((p) => { following[p] = true; });
    let hits = 0;
    const series = track ? [] : null;
    // Use ceil. Do not use floor. With floor, 10000/300 gives a step of
    // 33. The result is 303 points. The last point makes 304 points. That
    // quantity is more than the limit.
    const cap = ROULETTE_CONFIG.maxSeriesPoints;
    const step = track ? Math.max(1, Math.ceil(n / cap)) : 0;

    for (let i = 0; i < n; i++) {
      const r = this.next();
      const pocket = space[Math.floor(r * space.length)];
      counts[pocket]++;
      if (track) {
        if (following[pocket]) hits++;
        // Record a point at each step. Always record the last spin. If the
        // last spin is also a step, record it only one time.
        if ((i + 1) % step === 0 || i === n - 1) {
          const lastN = series.length ? series[series.length - 1].n : -1;
          if (lastN !== i + 1) series.push({ n: i + 1, rf: hits / (i + 1) });
        }
      }
    }
    this.count += n;
    return { counts: counts, n: n, hits: track ? hits : null, series: series };
  }
}
