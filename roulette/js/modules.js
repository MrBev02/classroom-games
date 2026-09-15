/* =====================================================
   ROULETTE: MODULE REGISTRY
   =====================================================

   MODULE_DEFS describes each activity. A module is independent. It does
   not need data from a different module. Thus a teacher can use one
   module in one lesson and a different module three weeks later.

   PROPERTIES

     id          The identifier. It must also be in MODULE_ORDER in
                 data/config.js.
     title       The name on the screen.
     dotpoints   The syllabus dot points that the module covers.
     minutes     The approximate length of the module.
     blurb       One sentence for the menu. A student reads this text.
     where       {student: true/false, projector: true/false}
     steps       The sequence of screens.

   STEP KINDS

     read        Text. Optionally a wheel image.
     questions   Questions from data/questions.js for this module.
     tour        The student clicks each pocket to build the sample space.
     partition   The student divides the wheel and adds the probabilities.
     sim         The student runs spins and compares the results with the
                 theory.
     edge        The table of payout, true odds and house edge.
     systems     The martingale demonstration.
     summary     The results of the module.
   ===================================================== */

const MODULE_DEFS = [
  {
    id: "sample-space", title: "What can the wheel land on?",
    dotpoints: [1, 3], minutes: 20, where: { student: true, projector: true },
    blurb: "List every pocket the ball can land in, and count them.",
    steps: [
      { kind: "read", title: "One spin, one result",
        body: [
          "A roulette wheel has a pocket for each number from 1 to 36. It also has at least one green pocket, numbered 0.",
          "The sample space is the list of every result you could get from one spin. Nothing else can happen, and no result can be left out.",
        ] },
      { kind: "tour", title: "Build the sample space" },
      { kind: "questions", title: "Check what you found" },
      { kind: "summary" },
    ],
  },
  {
    id: "equally-likely", title: "Is every pocket equally likely?",
    dotpoints: [3, 5], minutes: 20, where: { student: true, projector: true },
    blurb: "Test whether some numbers come up more often than others.",
    steps: [
      { kind: "read", title: "A fair wheel",
        body: [
          "The pockets on a roulette wheel are the same size. On a fair wheel the ball is equally likely to stop in any one of them.",
          "Equally likely outcomes have equal probabilities. Pick a pocket you think will win more often, then run some spins and see.",
        ] },
      { kind: "sim", title: "Run 370 spins", mode: "uniform", presets: [37, 370, 3700],
        bet: null, note: "On a European wheel, 370 spins gives an average of 10 for each pocket." },
      { kind: "questions", title: "What did you find?" },
      { kind: "summary" },
    ],
  },
  {
    id: "simple-probability", title: "Writing P(event)",
    dotpoints: [2, 3], minutes: 25, where: { student: true, projector: true },
    blurb: "Write the probability of an event as a fraction, a decimal and a percentage.",
    steps: [
      { kind: "read", title: "Counting the winners",
        body: [
          "To find the probability of an event, count the pockets that make it happen. Then divide by the total number of pockets.",
          "Pick an event below and the wheel will show you which pockets win it.",
        ] },
      { kind: "explore", title: "Pick an event and count", mode: "bets" },
      { kind: "questions", title: "Now work these out" },
      { kind: "summary" },
    ],
  },
  {
    id: "sum-to-one", title: "All the probabilities add to 1",
    dotpoints: [4], minutes: 20, where: { student: true, projector: true },
    blurb: "Split the wheel into groups and add up their probabilities.",
    steps: [
      { kind: "read", title: "Covering the whole wheel",
        body: [
          "If a set of events covers every pocket, and no pocket belongs to two of them, their probabilities add to exactly 1.",
          "Try it below. The first split works. The second one does not, and the screen will show you why.",
        ] },
      { kind: "partition", title: "Split the wheel",
        splits: [
          { label: "Red, black and green", bets: ["red", "black", "green"] },
          { label: "The three dozens, and the 0", bets: ["dozen:1", "dozen:2", "dozen:3", "green"] },
          { label: "Red and even", bets: ["red", "even"] },
        ] },
      { kind: "questions", title: "Check your understanding" },
      { kind: "summary" },
    ],
  },
  {
    id: "theoretical-vs-observed", title: "Theory against what happened",
    dotpoints: [5, 6, 7], minutes: 25, where: { student: true, projector: true },
    blurb: "Compare the probability you calculate with the results you actually get.",
    steps: [
      { kind: "read", title: "Two different numbers",
        body: [
          "Theoretical probability is what a fair wheel should give you. You find it by counting pockets. You do not need to spin at all.",
          "Observed probability is what actually happened. You find it by running spins and counting the results. It is also called relative frequency.",
        ] },
      { kind: "sim", title: "Spin and compare", mode: "compare",
        presets: [10, 100, 1000, 10000], bet: "red",
        note: "Watch the gap between the two lines as the number of spins grows." },
      { kind: "questions", title: "What did the chart show?" },
      { kind: "summary" },
    ],
  },
  {
    id: "relative-frequency-lab", title: "Relative frequency lab",
    dotpoints: [6, 7], minutes: 25, where: { student: true, projector: false },
    blurb: "Choose your own event, run your own trials and record the results.",
    steps: [
      { kind: "read", title: "Your experiment",
        body: [
          "Choose any event, choose how many spins to run, and record what you get.",
          "The program picks each result with a random number generator. You can see the number it used, and how that number becomes a pocket.",
        ] },
      { kind: "sim", title: "Run your own trials", mode: "lab",
        presets: [10, 50, 100, 500, 1000], bet: "red", showGenerator: true },
      { kind: "summary" },
    ],
  },
  {
    id: "complement", title: "The complement of an event",
    dotpoints: [8, 11], minutes: 20, where: { student: true, projector: false },
    blurb: "Work out everything that is not the event, in several different forms.",
    steps: [
      { kind: "read", title: "Everything else",
        body: [
          "The complement of event A is written A'. It is every outcome in the sample space that is not in A.",
          "Every pocket is either in A or in A'. No pocket is in both, and no pocket is in neither.",
        ] },
      { kind: "questions", title: "Build the complement" },
      { kind: "forms", title: "The same complement, four ways", bet: "red" },
      { kind: "summary" },
    ],
  },
  {
    id: "complement-sums", title: "P(A) + P(A') = 1",
    dotpoints: [9, 10], minutes: 20, where: { student: true, projector: false },
    blurb: "Use the complement to answer questions that would be slow the long way.",
    steps: [
      { kind: "read", title: "A shortcut",
        body: [
          "An event and its complement cover the whole sample space between them, so their probabilities add to 1.",
          "That gives you a shortcut. When an event is awkward to count, count its complement instead and subtract from 1.",
        ] },
      { kind: "questions", title: "Try the shortcut" },
      { kind: "summary" },
    ],
  },
  {
    id: "free-play", title: "Free play",
    dotpoints: [6, 7], minutes: 20, where: { student: true, projector: true },
    blurb: "Place your own bets and keep track of what happens to your chips.",
    steps: [
      { kind: "read", title: "Your chips",
        body: [
          "You start with a set number of chips. Choose a bet and a stake, then spin.",
          "The screen keeps a running total of what you have staked and where your chips stand.",
        ] },
      { kind: "play", title: "Place your bets" },
      { kind: "summary" },
    ],
  },
  {
    id: "house-edge", title: "Why the house always wins",
    dotpoints: [2, 5, 10], minutes: 25, where: { student: true, projector: true },
    blurb: "Compare what a bet pays with what a fair payout would be.",
    steps: [
      { kind: "read", title: "Payout and true odds",
        body: [
          "A straight-up bet on one number pays 35 to 1. On a European wheel there are 36 pockets that lose and 1 that wins, so the true odds are 36 to 1.",
          "A fair game would pay 36 to 1. The casino pays 35 to 1 and keeps the difference. That difference is the house edge.",
        ] },
      { kind: "edge", title: "Work out the edge for every bet" },
      { kind: "questions", title: "What the table shows" },
      { kind: "summary" },
    ],
  },
  {
    id: "betting-systems", title: "Can a system beat it?",
    dotpoints: [6, 10], minutes: 25, where: { student: true, projector: true },
    blurb: "Test the betting system people say cannot lose.",
    steps: [
      { kind: "read", title: "The martingale",
        body: [
          "Bet 1 chip on red. If you lose, bet 2. If you lose again, bet 4, then 8, and keep doubling.",
          "The first time you win, you get back everything you lost and one chip more. Run it below and see how far it gets.",
        ] },
      { kind: "systems", title: "Run the martingale" },
      { kind: "questions", title: "Why did it stop?" },
      { kind: "summary" },
    ],
  },
  {
    id: "debrief", title: "What this costs people",
    dotpoints: [], minutes: 15, where: { student: false, projector: true },
    blurb: "A whole-class discussion led by your teacher.",
    steps: [{ kind: "read", title: "Led by your teacher", body: [] }],
  },
];

function moduleById(id) {
  return MODULE_DEFS.filter((m) => m.id === id)[0] || null;
}

/** The modules that a session key opens, in the order of MODULE_ORDER. */
function enabledModules(moduleIds) {
  const set = {};
  (moduleIds || []).forEach((id) => { set[id] = true; });
  return MODULE_DEFS.filter((m) => set[m.id]);
}

/** The modules that a student can open on their own device. */
function studentModules(moduleIds) {
  return enabledModules(moduleIds).filter((m) => m.where.student);
}

/** The questions for a module, or an empty list. */
function moduleQuestions(id) {
  return (typeof QUESTION_BANK !== "undefined" && QUESTION_BANK[id]) || [];
}

/**
 * The dot points that a set of modules covers. The teacher console shows
 * this list.
 */
function dotpointsCovered(moduleIds) {
  const seen = {};
  enabledModules(moduleIds).forEach((m) => {
    m.dotpoints.forEach((d) => { seen[d] = true; });
  });
  return Object.keys(seen).map(Number).sort((a, b) => a - b);
}
