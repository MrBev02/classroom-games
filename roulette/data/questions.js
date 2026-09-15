/* =====================================================
   ROULETTE: QUESTION BANK
   =====================================================

   QUESTION_BANK has one list of questions for each module.

   A question does not contain its answer. It contains the method to
   calculate the answer. The property {from:"betProbability", bet:"red"}
   tells the program to ask js/probability.js for the probability of red.

   This method gives three results:
     - If the user changes the wheel, each question gets a new answer.
     - The printed answer key uses the same function as the screen.
     - The file contains no probabilities, thus it can contain no
       incorrect probability.

   Use {from:"literal", value:...} only for an answer in words.

   PROPERTIES

     id          A unique identifier for the question.
     type        "mc", "fraction", "numeric", "pockets" or "text".
     dotpoints   The syllabus dot points. The teacher report uses them.
     prompt      The question. A student reads this text.
     wheel       Optional. "european" or "american". This value fixes the
                 wheel for the question. Without it, the question uses the
                 wheel that the student selected.
     answer      The method to calculate the answer.
     hint        Optional. The student can request it.
     feedback    The text after a correct answer and after a wrong answer.

   TYPE-SPECIFIC PROPERTIES

     mc          choices: [{text, correct}]
     fraction    accept: {unreduced, reduced, exactDenominator}
     numeric     unit: "percent", dp: decimal places, tolerance
     pockets     partialCredit: true gives the count of correct pockets
     text        acceptText: [keywords], matchMode: "anyKeyword" or
                 "allKeywords"

   TO ADD A QUESTION
     1. Copy a question of the same type.
     2. Change the id, the prompt and the answer method.
     3. Open the page. The question is in the module immediately.
   ===================================================== */

const QUESTION_BANK = {

  /* ---------- Module: what can the wheel land on? ---------- */
  "sample-space": [
    {
      id: "ss-01", type: "numeric", dotpoints: [1],
      prompt: "How many pockets does a European wheel have?",
      wheel: "european", dp: 0, tolerance: 0.01,
      answer: { from: "outcomeCount" },
      hint: "Count the numbers 1 to 36, then add the green pocket.",
      feedback: {
        correct: "A European wheel has 37 pockets: 1 to 36, and one green 0.",
        wrong: "Count 1 to 36. Then add the green 0.",
      },
    },
    {
      id: "ss-02", type: "numeric", dotpoints: [1],
      prompt: "How many pockets does an American wheel have?",
      wheel: "american", dp: 0, tolerance: 0.01,
      answer: { from: "outcomeCount" },
      hint: "An American wheel has a second green pocket, marked 00.",
      feedback: {
        correct: "An American wheel has 38 pockets. It has two green pockets: 0 and 00.",
        wrong: "An American wheel has both a 0 and a 00.",
      },
    },
    {
      id: "ss-03", type: "numeric", dotpoints: [1, 2],
      prompt: "How many red pockets are there on a European wheel?",
      wheel: "european", dp: 0, tolerance: 0.01,
      answer: { from: "favourableCount", bet: "red" },
      feedback: {
        correct: "There are 18 red pockets and 18 black pockets. The 0 is green.",
        wrong: "Count the red pockets on the wheel above.",
      },
    },
    {
      id: "ss-04", type: "mc", dotpoints: [1],
      prompt: "A student writes the sample space for one spin of a European wheel as {1, 2, 3, ..., 36}. What is wrong with it?",
      answer: { from: "literal", value: "the zero is missing" },
      choices: [
        { text: "Nothing. That list is correct.", correct: false },
        { text: "The 0 is missing.", correct: true },
        { text: "The colours are missing.", correct: false },
        { text: "It should stop at 35.", correct: false },
      ],
      feedback: {
        correct: "The 0 is a pocket the ball can land in, so it belongs in the sample space.",
        wrong: "The sample space lists every possible result. The ball can land in the 0.",
      },
    },
  ],

  /* ---------- Module: is every pocket equally likely? ---------- */
  "equally-likely": [
    {
      id: "eq-01", type: "fraction", dotpoints: [2, 3, 5],
      prompt: "On a fair European wheel, what is the probability that the ball lands in pocket 17?",
      wheel: "european",
      answer: { from: "betProbability", bet: "straight", arg: "17" },
      accept: { unreduced: true, reduced: true },
      hint: "One pocket is a winner. How many pockets are there in total?",
      feedback: {
        correct: "Every pocket has a probability of 1/37. Pocket 17 is not different from any other.",
        wrong: "One pocket wins, out of 37 pockets.",
      },
    },
    {
      id: "eq-02", type: "mc", dotpoints: [3, 5],
      prompt: "The last five spins were all red. What is the probability that the next spin is red?",
      wheel: "european",
      answer: { from: "literal", value: "18/37, the same as always" },
      choices: [
        { text: "Higher than usual, because red is running hot.", correct: false },
        { text: "Lower than usual, because black is due.", correct: false },
        { text: "18/37, the same as every other spin.", correct: true },
        { text: "There is no way to tell.", correct: false },
      ],
      hint: "The wheel has no memory of the last spin.",
      feedback: {
        correct: "The wheel has no memory. Every spin has the same probabilities as the first one.",
        wrong: "The wheel does not know what happened last time. Each spin starts again.",
      },
    },
    {
      id: "eq-03", type: "mc", dotpoints: [3],
      prompt: "Which of these numbers cannot be a probability?",
      answer: { from: "literal", value: "1.4" },
      choices: [
        { text: "0", correct: false },
        { text: "0.5", correct: false },
        { text: "1", correct: false },
        { text: "1.4", correct: true },
      ],
      feedback: {
        correct: "A probability is always between 0 and 1. A value of 0 is impossible and 1 is certain.",
        wrong: "A probability of 0 means impossible. A probability of 1 means certain. Nothing sits outside that range.",
      },
    },
    {
      id: "eq-04", type: "numeric", dotpoints: [3],
      prompt: "What is the probability that the ball lands on a number from 0 to 36 on a European wheel? Write it as a decimal.",
      wheel: "european", dp: 0, tolerance: 0.001,
      answer: { from: "setProbability", outcomes: ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36"] },
      feedback: {
        correct: "This event is certain, so its probability is 1. Those are all the pockets there are.",
        wrong: "Every pocket on the wheel is in that list, so the event always happens.",
      },
    },
  ],

  /* ---------- Module: writing P(event) ---------- */
  "simple-probability": [
    {
      id: "sp-01", type: "fraction", dotpoints: [2, 3],
      prompt: "A European wheel is spun once. What is P(red)?",
      wheel: "european",
      answer: { from: "betProbability", bet: "red" },
      accept: { unreduced: true, reduced: true },
      hint: "Count the red pockets for the top. Count all the pockets for the bottom.",
      feedback: {
        correct: "18 of the 37 pockets are red, so P(red) = 18/37.",
        wrong: "The top number is how many pockets are red. The bottom number is how many pockets there are.",
      },
    },
    {
      id: "sp-02", type: "fraction", dotpoints: [2],
      prompt: "What is P(even number) on a European wheel? The 0 does not count as even here.",
      wheel: "european",
      answer: { from: "betProbability", bet: "even" },
      accept: { unreduced: true, reduced: true },
      hint: "The even numbers from 1 to 36 are 2, 4, 6, and so on up to 36.",
      feedback: {
        correct: "There are 18 even numbers from 1 to 36, so P(even) = 18/37.",
        wrong: "Count the even numbers between 1 and 36. The bottom number is still 37.",
      },
    },
    {
      id: "sp-03", type: "numeric", dotpoints: [2],
      prompt: "On an American wheel, what is P(green)? Write it as a percentage to 1 decimal place.",
      wheel: "american", unit: "percent", dp: 1, tolerance: 0.05,
      answer: { from: "betProbability", bet: "green" },
      hint: "An American wheel has two green pockets out of 38.",
      feedback: {
        correct: "Two green pockets out of 38 gives 5.3%.",
        wrong: "Divide the number of green pockets by 38, then multiply by 100.",
      },
    },
    {
      id: "sp-04", type: "fraction", dotpoints: [2],
      prompt: "What is P(the ball lands in the first dozen, 1 to 12) on a European wheel?",
      wheel: "european",
      answer: { from: "betProbability", bet: "dozen", arg: 1 },
      accept: { unreduced: true, reduced: true },
      feedback: {
        correct: "Twelve pockets win out of 37, so P = 12/37.",
        wrong: "The numbers 1 to 12 are twelve pockets. The 0 is not one of them.",
      },
    },
    {
      id: "sp-05", type: "mc", dotpoints: [2, 3],
      prompt: "Which of these events is most likely on one spin of a European wheel?",
      wheel: "european",
      answer: { from: "literal", value: "the ball lands on a black number" },
      choices: [
        { text: "The ball lands on 7.", correct: false },
        { text: "The ball lands on a black number.", correct: true },
        { text: "The ball lands in the first dozen.", correct: false },
        { text: "The ball lands on green.", correct: false },
      ],
      hint: "Count how many pockets win each one.",
      feedback: {
        correct: "Black wins on 18 pockets. A dozen wins on 12, a single number on 1, and green on 1.",
        wrong: "Count the winning pockets for each option. The one with the most pockets is the most likely.",
      },
    },
  ],

  /* ---------- Module: all the probabilities add to 1 ---------- */
  "sum-to-one": [
    {
      id: "s1-01", type: "fraction", dotpoints: [4],
      prompt: "On a European wheel, what is P(black)?",
      wheel: "european",
      answer: { from: "betProbability", bet: "black" },
      accept: { unreduced: true, reduced: true },
      feedback: {
        correct: "18 black pockets out of 37.",
        wrong: "Count the black pockets. There are as many black pockets as red ones.",
      },
    },
    {
      id: "s1-02", type: "fraction", dotpoints: [4],
      prompt: "On a European wheel, what is P(green)?",
      wheel: "european",
      answer: { from: "betProbability", bet: "green" },
      accept: { unreduced: true, reduced: true },
      feedback: {
        correct: "One green pocket out of 37.",
        wrong: "The only green pocket on a European wheel is the 0.",
      },
    },
    {
      id: "s1-03", type: "mc", dotpoints: [4],
      prompt: "You add P(red) + P(black) + P(green) on a European wheel. What do you get?",
      wheel: "european",
      answer: { from: "literal", value: "1" },
      choices: [
        { text: "36/37", correct: false },
        { text: "1", correct: true },
        { text: "37/36", correct: false },
        { text: "It depends on the spin.", correct: false },
      ],
      hint: "Add the top numbers. Every pocket is red, black or green.",
      feedback: {
        correct: "18 + 18 + 1 = 37, so the total is 37/37, which is 1.",
        wrong: "Every pocket is one of those three colours, so the three probabilities cover the whole wheel.",
      },
    },
    {
      id: "s1-04", type: "mc", dotpoints: [4],
      prompt: "A student adds P(red) + P(even) and gets more than 1. What has gone wrong?",
      wheel: "european",
      answer: { from: "literal", value: "some pockets are both red and even" },
      choices: [
        { text: "They made an arithmetic mistake.", correct: false },
        { text: "Some pockets are both red and even, so those pockets get counted twice.", correct: true },
        { text: "Probabilities can add to more than 1.", correct: false },
        { text: "They forgot the 0.", correct: false },
      ],
      hint: "Look at pocket 12. Is it red? Is it even?",
      feedback: {
        correct: "Pockets like 12, 14 and 16 are red and even. Adding the two probabilities counts them twice.",
        wrong: "Find a pocket that belongs to both events. Pocket 12 is red, and it is also even.",
      },
    },
  ],

  /* ---------- Module: theory against what happened ---------- */
  "theoretical-vs-observed": [
    {
      id: "tv-01", type: "mc", dotpoints: [5, 6],
      prompt: "You spin the wheel 100 times and red comes up 44 times. What is the observed probability of red?",
      wheel: "european",
      answer: { from: "literal", value: "44/100" },
      choices: [
        { text: "18/37", correct: false },
        { text: "44/100", correct: true },
        { text: "44/37", correct: false },
        { text: "56/100", correct: false },
      ],
      hint: "The observed probability counts what actually happened.",
      feedback: {
        correct: "The observed probability is how many times it happened, over how many trials you ran.",
        wrong: "Divide the number of times red came up by the number of spins.",
      },
    },
    {
      id: "tv-02", type: "mc", dotpoints: [5, 6],
      prompt: "In that same set of 100 spins, what is the theoretical probability of red on a European wheel?",
      wheel: "european",
      answer: { from: "literal", value: "18/37" },
      choices: [
        { text: "18/37", correct: true },
        { text: "44/100", correct: false },
        { text: "1/2", correct: false },
        { text: "It changes with the results.", correct: false },
      ],
      feedback: {
        correct: "The theoretical probability comes from the wheel itself. Running spins does not change it.",
        wrong: "The theoretical probability comes from counting pockets, not from counting results.",
      },
    },
    {
      id: "tv-03", type: "mc", dotpoints: [6, 7],
      prompt: "You run 10 spins, then 100, then 10 000. What usually happens to the observed probability of red?",
      wheel: "european",
      answer: { from: "literal", value: "it gets closer to the theoretical probability" },
      choices: [
        { text: "It moves further from 18/37.", correct: false },
        { text: "It gets closer to 18/37 and stays closer.", correct: true },
        { text: "It reaches exactly 18/37 and stops.", correct: false },
        { text: "It stays the same the whole time.", correct: false },
      ],
      hint: "Run the spins and watch the line on the chart.",
      feedback: {
        correct: "More trials bring the observed probability closer to the theoretical one. It rarely lands exactly on it.",
        wrong: "Run 10 spins, then 10 000, and compare how far the line sits from the theoretical value.",
      },
    },
    {
      id: "tv-04", type: "text", dotpoints: [5],
      prompt: "In your own words, what does 'theoretical probability' mean?",
      wheel: "european",
      answer: { from: "literal", value: "what we expect on a fair wheel, worked out by counting the pockets" },
      acceptText: ["fair", "expect", "counting", "pockets", "should", "unbiased", "even chance"],
      matchMode: "anyKeyword",
      feedback: {
        correct: "Theoretical probability is what a fair, unbiased wheel gives you. You work it out by counting pockets.",
        wrong: "Think about where the number 18/37 comes from. You do not need to spin the wheel to find it.",
      },
    },
  ],

  /* ---------- Module: the complement of an event ---------- */
  "complement": [
    {
      id: "cp-01", type: "pockets", dotpoints: [8, 11],
      prompt: "A is the event 'the ball lands in the first dozen, 1 to 12'. Click every pocket that is in A' (not A).",
      wheel: "european", partialCredit: true,
      answer: { from: "complementOutcomes", bet: "dozen", arg: 1 },
      hint: "Start with 13 to 36. Then decide whether the 0 belongs in A'.",
      feedback: {
        correct: "A' is all 25 pockets that are not 1 to 12. The 0 is one of them.",
        wrong: "The 0 is not in the first dozen, so it belongs in A'.",
      },
    },
    {
      id: "cp-02", type: "pockets", dotpoints: [8, 11],
      prompt: "A is the event 'the ball lands on red'. Click every pocket in A'.",
      wheel: "european", partialCredit: true,
      answer: { from: "complementOutcomes", bet: "red" },
      hint: "A' is everything that is not red. That includes the green 0.",
      feedback: {
        correct: "A' is the 18 black pockets and the green 0, which is 19 pockets.",
        wrong: "'Not red' means black or green. Do not leave out the 0.",
      },
    },
    {
      id: "cp-03", type: "mc", dotpoints: [8],
      prompt: "A is 'the ball lands on an odd number'. Which of these is A'?",
      wheel: "european",
      answer: { from: "literal", value: "an even number or the 0" },
      choices: [
        { text: "The ball lands on an even number.", correct: false },
        { text: "The ball lands on an even number, or on the 0.", correct: true },
        { text: "The ball lands on black.", correct: false },
        { text: "The ball lands on a number from 19 to 36.", correct: false },
      ],
      hint: "Is the 0 an odd number? So which side does it belong on?",
      feedback: {
        correct: "The 0 is not odd, so it is in A'. A' is 'even, or 0'.",
        wrong: "Every pocket is either in A or in A'. The 0 is not odd, so it has to be in A'.",
      },
    },
    {
      id: "cp-04", type: "text", dotpoints: [8],
      prompt: "In your own words, what does the complement of an event mean?",
      answer: { from: "literal", value: "every outcome that is not in the event" },
      acceptText: ["not", "opposite", "everything else", "all the other", "rest"],
      matchMode: "anyKeyword",
      feedback: {
        correct: "A' is every outcome in the sample space that is not in A.",
        wrong: "Think about what is left in the sample space after you take A away.",
      },
    },
  ],

  /* ---------- Module: P(A) + P(A') = 1 ---------- */
  "complement-sums": [
    {
      id: "cs-01", type: "fraction", dotpoints: [9],
      prompt: "P(red) is 18/37 on a European wheel. What is P(not red)?",
      wheel: "european",
      answer: { from: "betComplementProbability", bet: "red" },
      accept: { unreduced: true, reduced: true },
      hint: "The two probabilities add to 1, so P(not red) = 1 - P(red).",
      feedback: {
        correct: "37/37 minus 18/37 leaves 19/37.",
        wrong: "Take 18/37 away from 37/37.",
      },
    },
    {
      id: "cs-02", type: "fraction", dotpoints: [9, 10],
      prompt: "What is P(the ball does not land in the second dozen) on a European wheel?",
      wheel: "european",
      answer: { from: "betComplementProbability", bet: "dozen", arg: 2 },
      accept: { unreduced: true, reduced: true },
      hint: "Work out P(second dozen) first, then subtract it from 1.",
      feedback: {
        correct: "The second dozen wins on 12 pockets, so 25 of the 37 pockets do not.",
        wrong: "12 pockets are in the second dozen. The other 25 are not.",
      },
    },
    {
      id: "cs-03", type: "mc", dotpoints: [10],
      prompt: "Which is quicker to work out: P(the ball does not land on 7), or P(the ball lands on 7) and then subtract?",
      wheel: "european",
      answer: { from: "literal", value: "work out P(7) and subtract" },
      choices: [
        { text: "Count all 36 pockets that are not 7.", correct: false },
        { text: "Work out P(7) = 1/37, then take it away from 1.", correct: true },
        { text: "Both take the same amount of work.", correct: false },
        { text: "Neither can be done.", correct: false },
      ],
      feedback: {
        correct: "Counting one pocket and subtracting is faster than counting 36 pockets.",
        wrong: "You can count 36 pockets, or you can count 1 pocket and subtract. Try both and compare.",
      },
    },
    {
      id: "cs-04", type: "numeric", dotpoints: [9],
      prompt: "P(A) = 0.30. What is P(A')?",
      dp: 2, tolerance: 0.005,
      answer: { from: "literal", value: 0.7 },
      feedback: {
        correct: "P(A) + P(A') = 1, so P(A') = 1 - 0.30 = 0.70.",
        wrong: "The two probabilities add to 1.",
      },
    },
  ],

  /* ---------- Module: why the house always wins ---------- */
  "house-edge": [
    {
      id: "he-01", type: "numeric", dotpoints: [2],
      prompt: "A straight-up bet on one number pays 35 to 1. On a European wheel, how many pockets lose for every pocket that wins?",
      wheel: "european", dp: 0, tolerance: 0.01,
      answer: { from: "literal", value: 36 },
      hint: "One pocket wins. How many are left?",
      feedback: {
        correct: "36 pockets lose and 1 wins, so the true odds are 36 to 1.",
        wrong: "There are 37 pockets. One of them wins.",
      },
    },
    {
      id: "he-02", type: "mc", dotpoints: [2, 5],
      prompt: "The true odds are 36 to 1. The casino pays 35 to 1. Who does that difference favour?",
      answer: { from: "literal", value: "the casino" },
      choices: [
        { text: "The player.", correct: false },
        { text: "The casino.", correct: true },
        { text: "Neither. It is a fair bet.", correct: false },
        { text: "It depends on the number you pick.", correct: false },
      ],
      hint: "A fair payout would be 36 to 1. The casino pays less than that.",
      feedback: {
        correct: "A fair game would pay 36 to 1. The casino keeps the difference on every win.",
        wrong: "Compare what a fair payout would be with what the casino actually pays.",
      },
    },
    {
      id: "he-03", type: "numeric", dotpoints: [2, 5],
      prompt: "What is the house edge on a bet on red on a European wheel? Give your answer as a percentage to 2 decimal places.",
      wheel: "european", unit: "percent", dp: 2, tolerance: 0.005,
      answer: { from: "houseEdge", bet: "red" },
      hint: "Work out 18/37 of a win, minus 19/37 of a loss, for a stake of 1 chip.",
      feedback: {
        correct: "The house keeps 2.70% of everything staked on red.",
        wrong: "You win 1 chip with probability 18/37, and lose 1 chip with probability 19/37.",
      },
    },
    {
      id: "he-04", type: "numeric", dotpoints: [2, 5],
      prompt: "What is the house edge on a straight-up bet on 17 on a European wheel? Give a percentage to 2 decimal places.",
      wheel: "european", unit: "percent", dp: 2, tolerance: 0.005,
      answer: { from: "houseEdge", bet: "straight", arg: "17" },
      hint: "You win 35 chips with probability 1/37, and lose 1 chip with probability 36/37.",
      feedback: {
        correct: "It is 2.70%, the same as red. The payouts change but the edge does not.",
        wrong: "Work out 35 x (1/37) - 1 x (36/37).",
      },
    },
    {
      id: "he-05", type: "mc", dotpoints: [5, 10],
      prompt: "You have worked out the house edge for several different bets on a European wheel. What did you find?",
      wheel: "european",
      answer: { from: "literal", value: "every bet has the same edge" },
      choices: [
        { text: "Single numbers have the smallest edge.", correct: false },
        { text: "Red and black have the smallest edge.", correct: false },
        { text: "Every bet has the same edge of 2.70%.", correct: true },
        { text: "The edge changes from spin to spin.", correct: false },
      ],
      feedback: {
        correct: "Every bet on a European wheel has an edge of 2.70%. Choosing a different bet does not help.",
        wrong: "Look at your table again and compare the last column across the rows.",
      },
    },
    {
      id: "he-06", type: "numeric", dotpoints: [2, 5],
      prompt: "What is the house edge on a bet on red on an American wheel? Give a percentage to 2 decimal places.",
      wheel: "american", unit: "percent", dp: 2, tolerance: 0.005,
      answer: { from: "houseEdge", bet: "red" },
      hint: "An American wheel has 38 pockets, and 20 of them lose a bet on red.",
      feedback: {
        correct: "It is 5.26%, which is almost double the European wheel. The extra green pocket does that.",
        wrong: "There are still 18 red pockets, but now there are 38 pockets in total.",
      },
    },
  ],

  /* ---------- Module: can a system beat it? ---------- */
  "betting-systems": [
    {
      id: "bs-01", type: "mc", dotpoints: [6, 10],
      prompt: "In the martingale system you double your stake after every loss. What is the system meant to do?",
      answer: { from: "literal", value: "recover the losses with the first win" },
      choices: [
        { text: "Recover all the losses as soon as you win once.", correct: true },
        { text: "Change the probability of red.", correct: false },
        { text: "Make the payout larger.", correct: false },
        { text: "Reduce the house edge.", correct: false },
      ],
      feedback: {
        correct: "The first win covers every earlier loss and adds one unit of profit.",
        wrong: "Work through 1, 2, 4, 8 chips and see what a win on the fourth bet gets back.",
      },
    },
    {
      id: "bs-02", type: "mc", dotpoints: [6, 10],
      prompt: "You ran the martingale until it stopped. Why did it stop?",
      answer: { from: "literal", value: "the bankroll ran out or the table limit was reached" },
      choices: [
        { text: "The probability of red changed.", correct: false },
        { text: "The chips ran out, or the next stake was above the table limit.", correct: true },
        { text: "The wheel became unfair.", correct: false },
        { text: "The house edge increased.", correct: false },
      ],
      hint: "Look at the size of the stake just before the run ended.",
      feedback: {
        correct: "Doubling grows fast. A run of losses reaches the table limit or empties the chips.",
        wrong: "Look at the stake on the last few spins of your run.",
      },
    },
    {
      id: "bs-03", type: "numeric", dotpoints: [10],
      prompt: "You lose 6 bets in a row starting at 1 chip and doubling each time. What is your stake on the 7th bet?",
      dp: 0, tolerance: 0.01,
      answer: { from: "literal", value: 64 },
      hint: "1, 2, 4, 8, and keep going.",
      feedback: {
        correct: "The stakes go 1, 2, 4, 8, 16, 32, then 64. You have already lost 63 chips.",
        wrong: "Double the stake each time: 1, 2, 4, 8, 16, 32, then the 7th.",
      },
    },
    {
      id: "bs-04", type: "mc", dotpoints: [5, 10],
      prompt: "Does the martingale system change the house edge?",
      answer: { from: "literal", value: "no" },
      choices: [
        { text: "Yes, it removes the edge.", correct: false },
        { text: "Yes, it halves the edge.", correct: false },
        { text: "No. Every individual bet still has the same edge.", correct: true },
        { text: "Only on a European wheel.", correct: false },
      ],
      feedback: {
        correct: "The system changes the size of each stake. It does not change the edge on any bet.",
        wrong: "The edge belongs to each bet. Changing how much you stake does not change it.",
      },
    },
  ],
};
