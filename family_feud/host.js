// ---------------------
// Host State
// ---------------------

const host = {
  teamNames: ["Team 1", "Team 2"],
  scores: [0, 0],
  currentRound: 0,
  totalRounds: 10,
  strikes: 0,
  roundPoints: 0,
  revealedAnswers: new Set(),
  questions: [],
};

const channel = new BroadcastChannel("family-feud");

// The pool of questions to draw rounds from. Defaults to the built-in
// QUESTIONS, but "Load your own questions" can replace it at runtime.
let questionPool = QUESTIONS;

// ---------------------
// DOM helpers
// ---------------------

const $ = (sel) => document.querySelector(sel);

// Open (or re-focus) the students' Board in its own tab. Keeping a reference
// plus a fixed window name means we reuse the tab instead of spawning copies.
let boardWin = null;
function openBoard() {
  if (boardWin && !boardWin.closed) {
    boardWin.focus();
    return true;
  }
  boardWin = window.open("index.html", "feud-board");
  if (boardWin) {
    boardWin.focus();
    return true;
  }
  const hint = $("#console-hint");
  if (hint) hint.textContent = "Pop-up blocked — click Open Board (top right)";
  return false;
}

$("#open-board-btn").addEventListener("click", openBoard);

// Broadcast the current game to the board. Sent on Start, and again whenever a
// freshly-opened board announces itself — so the board can be opened at any time
// (e.g. via Open Board) and still receive the game in progress.
function sendStart() {
  channel.postMessage({
    type: "start",
    data: {
      teamNames: host.teamNames,
      totalRounds: host.totalRounds,
      questions: host.questions,
      scores: host.scores,
      currentRound: host.currentRound,
    },
  });
}

// A board tab says "hello" when it loads; resend the game if one is running.
channel.onmessage = (event) => {
  if (
    event.data &&
    event.data.type === "hello" &&
    host.questions.length &&
    $("#host-game").style.display !== "none"
  ) {
    sendStart();
  }
};

// ---------------------
// Setup
// ---------------------

document.getElementById("start-btn").addEventListener("click", () => {
  host.teamNames[0] = $("#team1-input").value.trim() || "Team 1";
  host.teamNames[1] = $("#team2-input").value.trim() || "Team 2";

  // Never ask for more rounds than there are questions in the pool.
  const requested = parseInt($("#rounds-select").value, 10);
  host.totalRounds = Math.min(requested, questionPool.length);

  const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
  host.questions = shuffled.slice(0, host.totalRounds);

  host.scores = [0, 0];
  host.currentRound = 0;

  // Send start to display (re-sent automatically if the board opens later)
  sendStart();

  $("#host-setup").style.display = "none";
  $("#host-game").style.display = "block";
  $("#host-gameover").style.display = "none";

  loadHostRound();
  openBoard();
});

// ---------------------
// Round Management
// ---------------------

function loadHostRound() {
  const q = host.questions[host.currentRound];
  host.strikes = 0;
  host.roundPoints = 0;
  host.revealedAnswers = new Set();

  // Update header
  $(".host-team.team1 .host-team-name").textContent = host.teamNames[0];
  $(".host-team.team2 .host-team-name").textContent = host.teamNames[1];
  $(".host-team.team1 .host-team-score").textContent = host.scores[0];
  $(".host-team.team2 .host-team-score").textContent = host.scores[1];
  $(".host-round-info").textContent = `Round ${host.currentRound + 1} of ${host.totalRounds}`;

  // Update control labels
  $("#btn-award-team1").textContent = `Award to ${host.teamNames[0]}`;
  $("#btn-award-team2").textContent = `Award to ${host.teamNames[1]}`;

  // Update question
  MathText.render($("#host-question-text"), q.question);

  // Build answer table
  buildAnswerTable(q.answers);
  updateHostStatus();
}

function buildAnswerTable(answers) {
  const tbody = $("#answer-table tbody");
  tbody.innerHTML = "";

  answers.forEach((answer, i) => {
    const tr = document.createElement("tr");
    tr.dataset.index = i;

    tr.innerHTML = `
      <td class="answer-num">${i + 1}</td>
      <td class="answer-text">${answer.text}</td>
      <td class="answer-pts">${answer.points}</td>
      <td class="answer-action">
        <button class="btn-reveal" data-index="${i}">Reveal</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  MathText.typeset(tbody);

  // Attach reveal handlers
  tbody.querySelectorAll(".btn-reveal").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index, 10);
      revealOnHost(idx);
    });
  });
}

// ---------------------
// Actions
// ---------------------

function revealOnHost(index) {
  if (host.revealedAnswers.has(index)) return;

  host.revealedAnswers.add(index);
  host.roundPoints += host.questions[host.currentRound].answers[index].points;

  // Update table row
  const row = $(`#answer-table tbody tr[data-index="${index}"]`);
  if (row) {
    row.classList.add("revealed-row");
    row.querySelector(".btn-reveal").disabled = true;
    row.querySelector(".btn-reveal").textContent = "Shown";
  }

  // Send to display
  channel.postMessage({ type: "reveal", data: { index } });
  updateHostStatus();
}

function sendStrike() {
  if (host.strikes >= 3) return;
  host.strikes++;
  channel.postMessage({ type: "strike" });
  updateHostStatus();
}

function sendClearStrikes() {
  host.strikes = 0;
  channel.postMessage({ type: "clearStrikes" });
  updateHostStatus();
}

function sendAward(teamIndex) {
  if (host.roundPoints === 0) return;

  host.scores[teamIndex] += host.roundPoints;
  host.roundPoints = 0;

  channel.postMessage({ type: "award", data: { teamIndex } });

  // Update display
  $(".host-team.team1 .host-team-score").textContent = host.scores[0];
  $(".host-team.team2 .host-team-score").textContent = host.scores[1];
  updateHostStatus();
}

function sendRevealAll() {
  const answers = host.questions[host.currentRound].answers;
  answers.forEach((_, i) => revealOnHost(i));
  channel.postMessage({ type: "revealAll" });
}

function sendNextRound() {
  if (host.currentRound < host.totalRounds - 1) {
    host.currentRound++;
    channel.postMessage({ type: "nextRound" });
    loadHostRound();
  } else {
    sendGameOver();
  }
}

function sendPrevRound() {
  if (host.currentRound > 0) {
    host.currentRound--;
    channel.postMessage({ type: "prevRound" });
    loadHostRound();
  }
}

function sendGameOver() {
  channel.postMessage({ type: "gameOver" });
  showHostGameOver();
}

function showHostGameOver() {
  $("#host-game").style.display = "none";
  $("#host-gameover").style.display = "block";

  const t1 = host.scores[0];
  const t2 = host.scores[1];

  let winnerText;
  if (t1 > t2) winnerText = `${host.teamNames[0]} Wins!`;
  else if (t2 > t1) winnerText = `${host.teamNames[1]} Wins!`;
  else winnerText = "It's a Tie!";

  $("#host-winner-text").textContent = winnerText;
  $("#final-team1-name").textContent = host.teamNames[0];
  $("#final-team1-score").textContent = t1;
  $("#final-team2-name").textContent = host.teamNames[1];
  $("#final-team2-score").textContent = t2;

  const card1 = $(".final-card.team1");
  const card2 = $(".final-card.team2");
  card1.classList.toggle("winner", t1 > t2);
  card2.classList.toggle("winner", t2 > t1);
}

function sendNewGame() {
  channel.postMessage({ type: "newGame" });
  $("#host-game").style.display = "none";
  $("#host-gameover").style.display = "none";
  $("#host-setup").style.display = "block";
}

function updateHostStatus() {
  $("#host-round-points").textContent = host.roundPoints;
  $("#host-strikes").textContent = host.strikes;
}

// ---------------------
// Button Handlers
// ---------------------

$("#btn-strike").addEventListener("click", sendStrike);
$("#btn-clear-strikes").addEventListener("click", sendClearStrikes);
$("#btn-award-team1").addEventListener("click", () => sendAward(0));
$("#btn-award-team2").addEventListener("click", () => sendAward(1));
$("#btn-reveal-all").addEventListener("click", sendRevealAll);
$("#btn-next").addEventListener("click", sendNextRound);
$("#btn-prev").addEventListener("click", sendPrevRound);
$("#btn-new-game").addEventListener("click", sendNewGame);
$("#btn-gameover-new").addEventListener("click", sendNewGame);

// ---------------------
// Load your own questions
// ---------------------

const CUSTOM_PROMPT = String.raw`You are creating a Family Feud-style survey game for my class. Output valid JSON
that I will load into a game tool. Follow the format exactly.

MY CONTENT
- Subject / year level: <e.g. Year 9 Science>
- Topic of this game: <e.g. The Water Cycle>
- Number of questions: 10
- Answers per question: 5 to 7
- Source material (paste your notes, a textbook section, or key terms — or leave
  blank to use general knowledge of the topic):
  <paste here or leave blank>

HOW FAMILY FEUD WORKS:
- Each question is a "Name something..." style prompt with several acceptable
  answers, as if 100 people were surveyed.
- Every answer carries points: the most popular/obvious answer scores highest,
  rarer answers score lower. Higher points = more popular.
- Example:  question = "Name a part of the water cycle"
            answers  = "Evaporation" (30), "Condensation" (25), "Rain" (20)...

RULES
- Produce exactly the number of questions I asked for.
- Give each question the number of answers I asked for, ordered highest points
  first, lowest last.
- Points are whole numbers; each question's answers should total roughly 100.
- Keep each answer short (a word or a few) and classroom-appropriate.
- Answers should be drawn from the topic or source material.

MATH & FORMULAS (only if your subject needs them)
- A question or answer may contain mathematical notation written in LaTeX. Put
  inline maths inside \\( ... \\) and a large, centred formula inside $$ ... $$.
- Because this is JSON, every backslash must be DOUBLED. Example:
    { "text": "\\(\\frac{1}{2}\\)", "points": 25 }
- Do NOT use a single $ as a maths delimiter — a lone $ stays a dollar sign, so
  prices like "$5" still display correctly.

OUTPUT FORMAT — this must be valid JSON:
- Use double quotes around every key and every text value.
- No trailing commas. No comments. No markdown code fences.
- Output ONLY the JSON — nothing before or after it.

Copy this structure exactly:
[
  {
    "question": "Name something ...",
    "answers": [
      { "text": "Most popular answer", "points": 30 },
      { "text": "Next most popular", "points": 22 },
      { "text": "Less common answer", "points": 15 }
    ]
  },
  {
    "question": "Name a ...",
    "answers": [
      { "text": "...", "points": 28 },
      { "text": "...", "points": 20 }
    ]
  }
]

If the tool says the file is invalid, paste the error back to me and I will fix it.

Now generate the game.`;

function validateFeudQuestions(d) {
  const { ok, err } = CustomQuestions;
  const arr = Array.isArray(d)
    ? d
    : d && Array.isArray(d.questions)
    ? d.questions
    : null;
  if (!arr)
    return err('The top level must be an array of questions (or an object with a "questions" array).');
  if (arr.length === 0) return err("Need at least one question.");

  for (let i = 0; i < arr.length; i++) {
    const q = arr[i];
    const w = `Question ${i + 1}`;
    if (!q || typeof q !== "object" || Array.isArray(q))
      return err(`${w} must be an object.`);
    if (typeof q.question !== "string" || !q.question.trim())
      return err(`${w} is missing "question" text.`);
    if (!Array.isArray(q.answers) || q.answers.length === 0)
      return err(`${w} must have a non-empty "answers" array.`);
    for (let j = 0; j < q.answers.length; j++) {
      const a = q.answers[j];
      const aw = `${w} answer ${j + 1}`;
      if (!a || typeof a !== "object" || Array.isArray(a))
        return err(`${aw} must be an object with "text" and "points".`);
      if (typeof a.text !== "string" || !a.text.trim())
        return err(`${aw} is missing "text".`);
      if (typeof a.points !== "number" || !isFinite(a.points))
        return err(`${aw} is missing a numeric "points" value.`);
    }
  }

  return ok(arr, `${arr.length} question${arr.length === 1 ? "" : "s"} loaded`);
}

CustomQuestions.mount({
  mount: $("#custom-questions"),
  promptText: CUSTOM_PROMPT,
  readyHint: "These questions are loaded — click Start Game.",
  validate: validateFeudQuestions,
  onLoad: (arr) => {
    questionPool = arr;
  },
});
