/* =====================================================
   ROULETTE: CONFIGURATION
   =====================================================

   This file contains the settings a teacher can change. You do not have
   to change the code in a different file.

   REQUIRE_SESSION_KEY   true  = the student must type a code from the
                                 teacher.
                         false = the activity starts immediately. Use this
                                 value for homework or for a relief lesson.

   currencyMode          "chips"   = the student screens show chips. This
                                     is the default value.
                         "dollars" = the student screens show dollars. The
                                     default value is off. Refer to
                                     SAFEGUARDING.md for the reason. The
                                     teacher debrief can show dollars with
                                     either setting.

   defaultWheel          "european" = 37 pockets. "american" = 38 pockets.
                         The European wheel has one zero. Each pocket has a
                         probability of 1/37.

   seed                  null      = a different sequence of spins each time.
                         a number  = the same sequence of spins each time.
                                     Use a number to repeat a demonstration
                                     with a different class.
   ===================================================== */

const ROULETTE_CONFIG = {
  REQUIRE_SESSION_KEY: true,
  currencyMode: "chips",
  defaultWheel: "european",
  seed: null,

  // Charts cannot resolve more than a few hundred points on a projector,
  // The host also sends its full state after each change. Thus the
  // program reduces each series to this number of points.
  maxSeriesPoints: 300,

  startingChips: 100,
  defaultStake: 1,
  tableLimit: 100,

  // The debrief uses these values to calculate a loss for one hour of play.
  debrief: {
    stakePerSpin: 5,
    spinsPerHour: 40,
  },
};

/* Support contacts. The student page shows one line. The debrief shows a
   full screen. You can change this list or make it empty. */
const SUPPORT_CONTACTS = [
  {
    name: "Gambling Help Online",
    detail: "1800 858 858. Free, confidential, 24 hours a day.",
    url: "https://www.gamblinghelponline.org.au",
  },
  {
    name: "Lifeline",
    detail: "13 11 14",
    url: "https://www.lifeline.org.au",
    debriefOnly: true,
  },
];

/* -----------------------------------------------------
   MODULE_ORDER is a data format.

   The position of a module in this list is its bit position in the
   module mask of the session key.

   You can add a module to the end of the list. Do not change the order
   of the list. Do not remove a module from the list. The system decodes
   an old key against these positions. If you move a module, an old key
   opens the wrong activity.
   ----------------------------------------------------- */
const MODULE_ORDER = [
  "sample-space",
  "equally-likely",
  "simple-probability",
  "sum-to-one",
  "theoretical-vs-observed",
  "relative-frequency-lab",
  "complement",
  "complement-sums",
  "free-play",
  "house-edge",
  "betting-systems",
  "debrief",
];
