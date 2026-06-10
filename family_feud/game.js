// ---------------------
// Game State
// ---------------------

const state = {
  teamNames: ["Team 1", "Team 2"],
  scores: [0, 0],
  currentRound: 0,
  totalRounds: 20,
  strikes: 0,
  roundPoints: 0,
  revealedAnswers: new Set(),
  controlsVisible: true,
  questions: [],
  hostedMode: false,
};

// ---------------------
// DOM References
// ---------------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---------------------
// BroadcastChannel (two-screen sync)
// ---------------------

const channel = new BroadcastChannel("family-feud");

channel.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "start":
      state.teamNames = data.teamNames;
      state.totalRounds = data.totalRounds;
      state.questions = data.questions;
      state.scores = [0, 0];
      state.currentRound = 0;
      state.hostedMode = true;

      $("#setup-screen").style.display = "none";
      $("#game-screen").style.display = "flex";
      $("#gameover-screen").style.display = "none";

      // Hide host controls on display — host.html is the controller
      if ($(".host-controls")) $(".host-controls").style.display = "none";
      if ($(".controls-hint")) $(".controls-hint").style.display = "none";

      loadRound();
      break;

    case "reveal":
      revealAnswer(data.index);
      break;

    case "strike":
      addStrike();
      break;

    case "clearStrikes":
      clearStrikes();
      break;

    case "award":
      awardPoints(data.teamIndex);
      break;

    case "revealAll":
      revealAll();
      break;

    case "nextRound":
      nextRound();
      break;

    case "prevRound":
      prevRound();
      break;

    case "newGame":
      state.hostedMode = false;
      newGame();
      break;

    case "gameOver":
      showGameOver();
      break;
  }
};

// ---------------------
// Setup (standalone mode)
// ---------------------

function startGame() {
  state.teamNames[0] = $("#team1-input").value.trim() || "Team 1";
  state.teamNames[1] = $("#team2-input").value.trim() || "Team 2";
  state.totalRounds = parseInt($("#rounds-select").value, 10);

  // Shuffle and pick the number of rounds needed
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  state.questions = shuffled.slice(0, state.totalRounds);

  state.scores = [0, 0];
  state.currentRound = 0;

  $("#setup-screen").style.display = "none";
  $("#game-screen").style.display = "flex";
  $("#gameover-screen").style.display = "none";

  loadRound();
}

// ---------------------
// Round Management
// ---------------------

function loadRound() {
  const q = state.questions[state.currentRound];
  state.strikes = 0;
  state.roundPoints = 0;
  state.revealedAnswers = new Set();

  // Update header
  $(".team-score.team1 .team-name").textContent = state.teamNames[0];
  $(".team-score.team2 .team-name").textContent = state.teamNames[1];
  $(".team-score.team1 .score-value").textContent = state.scores[0];
  $(".team-score.team2 .score-value").textContent = state.scores[1];
  $(".round-info").textContent = `Round ${state.currentRound + 1} of ${state.totalRounds}`;

  // Update control button labels (if present in standalone mode)
  const ct1 = $(".ctrl-team1-name");
  const ct2 = $(".ctrl-team2-name");
  if (ct1) ct1.textContent = state.teamNames[0];
  if (ct2) ct2.textContent = state.teamNames[1];

  // Update question
  $(".question-bar h2").textContent = q.question;

  // Clear strikes
  $(".strikes-overlay").innerHTML = "";

  // Build board
  buildBoard(q.answers);
  updateRoundPoints();
}

function buildBoard(answers) {
  const board = $(".board");
  board.innerHTML = "";

  if (answers.length <= 4) {
    board.classList.add("single-col");
  } else {
    board.classList.remove("single-col");
  }

  // For two-column layout, interleave: left column gets 1,2,3,4 and right gets 5,6,7,8
  const half = Math.ceil(answers.length / 2);
  const ordered = [];

  if (answers.length <= 4) {
    answers.forEach((_, i) => ordered.push(i));
  } else {
    for (let i = 0; i < half; i++) {
      ordered.push(i);
      if (i + half < answers.length) {
        ordered.push(i + half);
      }
    }
  }

  ordered.forEach((answerIndex) => {
    const answer = answers[answerIndex];
    const card = document.createElement("div");
    card.className = "answer-card";
    card.dataset.index = answerIndex;

    card.innerHTML = `
      <div class="answer-card-inner">
        <div class="answer-card-front">
          <span class="card-number">${answerIndex + 1}</span>
        </div>
        <div class="answer-card-back">
          <span class="answer-text">${answer.text}</span>
          <span class="answer-points">${answer.points}</span>
        </div>
      </div>
    `;

    // Only allow clicking to reveal in standalone mode
    card.addEventListener("click", () => {
      if (!state.hostedMode) {
        revealAnswer(answerIndex);
      }
    });
    board.appendChild(card);
  });
}

// ---------------------
// Game Actions
// ---------------------

function revealAnswer(index) {
  if (state.revealedAnswers.has(index)) return;

  state.revealedAnswers.add(index);
  const card = $(`.answer-card[data-index="${index}"]`);
  if (card) card.classList.add("revealed");

  state.roundPoints += state.questions[state.currentRound].answers[index].points;
  updateRoundPoints();
}

function revealAll() {
  const answers = state.questions[state.currentRound].answers;
  answers.forEach((_, i) => revealAnswer(i));
}

function addStrike() {
  if (state.strikes >= 3) return;

  state.strikes++;
  const x = document.createElement("div");
  x.className = "strike-x";
  x.textContent = "X";
  $(".strikes-overlay").appendChild(x);

  // Auto-clear strikes display after a delay
  if (state.strikes >= 3) {
    setTimeout(() => {
      $(".strikes-overlay").innerHTML = "";
    }, 1500);
  }
}

function clearStrikes() {
  state.strikes = 0;
  $(".strikes-overlay").innerHTML = "";
}

function awardPoints(teamIndex) {
  if (state.roundPoints === 0) return;

  state.scores[teamIndex] += state.roundPoints;

  // Flash the score
  const scoreEl = $(`.team-score.team${teamIndex + 1} .score-value`);
  scoreEl.textContent = state.scores[teamIndex];
  scoreEl.style.transition = "none";
  scoreEl.style.color = "#ffd700";
  scoreEl.style.transform = "scale(1.3)";
  setTimeout(() => {
    scoreEl.style.transition = "all 0.3s";
    scoreEl.style.color = "";
    scoreEl.style.transform = "";
  }, 50);

  state.roundPoints = 0;
  updateRoundPoints();
}

function updateRoundPoints() {
  $(".round-points-bar span").textContent = state.roundPoints;
}

function nextRound() {
  if (state.currentRound < state.totalRounds - 1) {
    state.currentRound++;
    loadRound();
  } else {
    showGameOver();
  }
}

function prevRound() {
  if (state.currentRound > 0) {
    state.currentRound--;
    loadRound();
  }
}

function showGameOver() {
  $("#game-screen").style.display = "none";
  $("#gameover-screen").style.display = "flex";

  const screen = $("#gameover-screen");
  const t1 = state.scores[0];
  const t2 = state.scores[1];
  let winnerText;

  if (t1 > t2) {
    winnerText = `${state.teamNames[0]} Wins!`;
  } else if (t2 > t1) {
    winnerText = `${state.teamNames[1]} Wins!`;
  } else {
    winnerText = "It's a Tie!";
  }

  screen.querySelector(".winner-text").textContent = winnerText;

  const card1 = screen.querySelector(".final-score-card.team1");
  const card2 = screen.querySelector(".final-score-card.team2");

  card1.querySelector(".final-team-name").textContent = state.teamNames[0];
  card1.querySelector(".final-score-value").textContent = t1;
  card2.querySelector(".final-team-name").textContent = state.teamNames[1];
  card2.querySelector(".final-score-value").textContent = t2;

  card1.classList.toggle("winner", t1 >= t2 && !(t1 === t2));
  card2.classList.toggle("winner", t2 >= t1 && !(t1 === t2));
}

function newGame() {
  $("#gameover-screen").style.display = "none";
  $("#game-screen").style.display = "none";
  $("#setup-screen").style.display = "flex";
}

// ---------------------
// Print Answer Key
// Opens a new tab with all questions & answers for the teacher to print
// before starting the game. Do this BEFORE projecting to students.
// ---------------------

function printAnswerKey() {
  const rounds = parseInt($("#rounds-select").value, 10);
  const note = rounds < QUESTIONS.length
    ? `<p style="color:#888;font-size:0.85rem;">Note: The game shuffles and picks ${rounds} of ${QUESTIONS.length} questions at random, so print all ${QUESTIONS.length} to be safe.</p>`
    : "";

  let html = `<!DOCTYPE html><html><head><title>Answer Key</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 750px; margin: 2rem auto; color: #222; }
  h1 { text-align: center; margin-bottom: 0.3rem; }
  .note { text-align: center; }
  .round { page-break-inside: avoid; margin-bottom: 1.2rem; }
  .round h3 { margin: 0 0 0.3rem; font-size: 1rem; }
  .round table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .round th, .round td { text-align: left; padding: 0.2rem 0.6rem; border-bottom: 1px solid #ddd; }
  .round th { font-size: 0.75rem; text-transform: uppercase; color: #888; }
  .pts { text-align: right; font-weight: bold; }
  @media print { body { margin: 0.5cm; } }
</style></head><body>
<h1>Family Feud — Answer Key</h1>
<div class="note">${note}</div>`;

  html += `
<div style="background:#f4f4f4;border:1px solid #ccc;border-radius:8px;padding:1rem 1.2rem;margin:1.2rem 0;">
  <h2 style="margin:0 0 0.5rem;font-size:1rem;">Two-Screen Setup (Optional)</h2>
  <p style="font-size:0.85rem;margin:0 0 0.5rem;">Run a second screen where you see the answers and control the game from your
  laptop, while students only see the game board on the projector. Nothing to install &mdash; just open the links:</p>
  <ol style="font-size:0.85rem;margin:0;padding-left:1.3rem;">
    <li>On your <strong>laptop</strong>, open the host page:<br>
        <code>https://mrbev02.github.io/classroom-games/family_feud/host.html</code></li>
    <li>On the <strong>projector</strong>, open the board:<br>
        <code>https://mrbev02.github.io/classroom-games/family_feud/index.html</code></li>
    <li>Start the game from the host page &mdash; both screens sync automatically (keep them in the same browser on the same computer).</li>
  </ol>
  <p style="font-size:0.8rem;color:#888;margin:0.5rem 0 0;">Running your own copy offline instead? Serve the folder with <code>python3 -m http.server 8080</code> (Windows: <code>python -m http.server 8080</code>) and use the matching <code>http://localhost:8080/&hellip;</code> addresses.</p>
</div>`;

  QUESTIONS.forEach((q, qi) => {
    html += `<div class="round"><h3>Q${qi + 1}: ${q.question}</h3><table>
      <tr><th>#</th><th>Answer</th><th style="text-align:right">Points</th></tr>`;
    q.answers.forEach((a, ai) => {
      html += `<tr><td>${ai + 1}</td><td>${a.text}</td><td class="pts">${a.points}</td></tr>`;
    });
    html += `</table></div>`;
  });

  html += `</body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

// ---------------------
// Toggle Controls (H key) — standalone mode only
// ---------------------

function toggleControls() {
  if (state.hostedMode) return;
  state.controlsVisible = !state.controlsVisible;
  const el = $(".host-controls");
  if (el) el.style.display = state.controlsVisible ? "flex" : "none";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "h" || e.key === "H") {
    if (e.target.tagName === "INPUT") return;
    toggleControls();
  }
});
