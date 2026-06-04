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

// ---------------------
// DOM helpers
// ---------------------

const $ = (sel) => document.querySelector(sel);

// ---------------------
// Setup
// ---------------------

document.getElementById("start-btn").addEventListener("click", () => {
  host.teamNames[0] = $("#team1-input").value.trim() || "Team 1";
  host.teamNames[1] = $("#team2-input").value.trim() || "Team 2";
  host.totalRounds = parseInt($("#rounds-select").value, 10);

  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  host.questions = shuffled.slice(0, host.totalRounds);

  host.scores = [0, 0];
  host.currentRound = 0;

  // Send start to display
  channel.postMessage({
    type: "start",
    data: {
      teamNames: host.teamNames,
      totalRounds: host.totalRounds,
      questions: host.questions,
    },
  });

  $("#host-setup").style.display = "none";
  $("#host-game").style.display = "block";
  $("#host-gameover").style.display = "none";

  loadHostRound();
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
  $("#host-question-text").textContent = q.question;

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
