/* =====================================================
   ROULETTE: THE WHEEL
   =====================================================

   This file contains the data for a roulette wheel. It gives the pocket
   order, the pocket colours and the pocket angles. Do not put this data
   in a different file.

   A pocket identifier is always a string: "0", "00", "1" to "36".

   An American wheel has a "0" pocket and a "00" pocket. In JavaScript,
   Number("00") is equal to 0. If you use a number for an identifier, the
   two pockets become one pocket. Use the pocketNumber() function only
   when you must do arithmetic. Keep each identifier as a string.

   The pocket orders are the orders of a real wheel. They are not the
   numbers 0 to 36 in sequence. A student can compare this wheel with a
   photograph of a real wheel.
   ===================================================== */

const WHEELS = {
  european: {
    id: "european",
    label: "European wheel (one zero)",
    zeroes: ["0"],
    // The sequence is clockwise from 0 on a wheel with one zero.
    order: [
      "0", "32", "15", "19", "4", "21", "2", "25", "17", "34", "6", "27",
      "13", "36", "11", "30", "8", "23", "10", "5", "24", "16", "33", "1",
      "20", "14", "31", "9", "22", "18", "29", "7", "28", "12", "35", "3", "26",
    ],
  },
  american: {
    id: "american",
    label: "American wheel (two zeros)",
    zeroes: ["0", "00"],
    // The sequence is clockwise from 0 on a wheel with two zeros.
    order: [
      "0", "28", "9", "26", "30", "11", "7", "20", "32", "17", "5", "22",
      "34", "15", "3", "24", "36", "13", "1", "00", "27", "10", "25", "29",
      "12", "8", "19", "31", "18", "6", "21", "33", "16", "4", "23", "35",
      "14", "2",
    ],
  },
};

/* These are the 18 red pockets. All other numbered pockets are black.
   The zero pockets are green. The colour is a property of the number.
   Thus this list is the same for the two wheels. */
const RED_NUMBERS = [
  "1", "3", "5", "7", "9", "12", "14", "16", "18",
  "19", "21", "23", "25", "27", "30", "32", "34", "36",
];

/**
 * This function gives the sample space. The sequence is the zero pockets
 * first, then 1 to 36 in increasing order. This sequence is not the wheel
 * order. It is the list of possible results.
 * @returns {string[]}
 */
function sampleSpace(wheel) {
  const w = wheel || currentWheel();
  const numbers = [];
  for (let n = 1; n <= 36; n++) numbers.push(String(n));
  return w.zeroes.concat(numbers);
}

/** The number of outcomes. A European wheel has 37. An American wheel has 38. */
function pocketCount(wheel) {
  return sampleSpace(wheel).length;
}

/** "red" | "black" | "green" */
function pocketColour(wheel, id) {
  const w = wheel || currentWheel();
  if (w.zeroes.indexOf(id) !== -1) return "green";
  return RED_NUMBERS.indexOf(id) !== -1 ? "red" : "black";
}

/**
 * This function gives the numeric value of a pocket. Use it only for
 * arithmetic, for example odd, even, dozens and columns.
 *
 * The function gives 0 for "0" and also 0 for "00". A zero pocket is not
 * a member of those groups. Thus you must remove the zero pockets first.
 * Do not use this number to identify a zero pocket.
 */
function pocketNumber(id) {
  return parseInt(id, 10);
}

/** This function gives true for a green pocket. */
function isZero(wheel, id) {
  return (wheel || currentWheel()).zeroes.indexOf(id) !== -1;
}

/** The angle in degrees, clockwise from the top. Use it to draw the wheel. */
function pocketAngle(wheel, id) {
  const w = wheel || currentWheel();
  const i = w.order.indexOf(id);
  return i === -1 ? 0 : (360 / w.order.length) * i;
}

/** This function finds a wheel by its identifier. If it does not find the
    wheel, it gives the default wheel from the configuration. */
function wheelById(id) {
  return WHEELS[id] || WHEELS[ROULETTE_CONFIG.defaultWheel] || WHEELS.european;
}

/**
 * This function gives the wheel that is in use.
 *
 * The preference of the student has a higher priority than the default
 * value in the configuration. A question that specifies one wheel supplies
 * that wheel as a parameter. Such a question does not call this function.
 */
function currentWheel() {
  let pref = null;
  try {
    const raw = localStorage.getItem("roulette-prefs");
    if (raw) pref = JSON.parse(raw).wheel;
  } catch (_) {
    /* The storage is not available. Use the default wheel. */
  }
  return WHEELS[pref] || WHEELS[ROULETTE_CONFIG.defaultWheel] || WHEELS.european;
}
