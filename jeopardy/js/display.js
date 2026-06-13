// =====================================================
// Jeopardy — Display (projector screen)
//
// A passive renderer: it holds no game logic, it simply
// mirrors whatever state the host tab broadcasts.
// =====================================================

const channel = new GameChannel();
const $ = (sel) => document.querySelector(sel);

let prev = null; // previous state, for detecting transitions

const fmtMoney = (n) => (n < 0 ? `−$${Math.abs(n)}` : `$${n}`);

channel.on("STATE", (state) => {
  render(state);
  prev = state;
});

// Ask the host (if open) for the current state
channel.send("HELLO");

// ---------------------
// Top-level render
// ---------------------

function render(state) {
  const phase = state.phase ?? "waiting";

  $("#waiting-screen").hidden = phase !== "waiting";
  $("#board-screen").hidden = phase !== "board";
  $("#gameover-screen").hidden = phase !== "gameover";

  if (phase === "board") {
    renderBoard(state);
    renderScoreboard(state);
    renderClueOverlay(state);
    updateThinkTimer(state);
  } else {
    $("#clue-overlay").classList.remove("open", "revealed");
    updateThinkTimer(null);
  }

  if (phase === "gameover" && prev?.phase !== "gameover") {
    renderGameOver(state);
  }
}

// ---------------------
// Board
// ---------------------

function boardChanged(state) {
  if (!prev || prev.phase !== "board") return true;
  if (prev.title !== state.title) return true;
  return JSON.stringify(prev.used) !== JSON.stringify(state.used);
}

function renderBoard(state) {
  $("#game-title").textContent = state.title;

  if (!boardChanged(state)) return;

  const board = $("#board");
  board.replaceChildren();
  board.style.setProperty("--cols", state.categories.length);

  // Stagger the cell reveal animation only when the board first appears
  const fresh = !prev || prev.phase !== "board" || prev.title !== state.title;
  board.classList.toggle("deal", fresh);

  state.categories.forEach((cat, i) => {
    const h = document.createElement("div");
    h.className = "category";
    h.style.setProperty("--i", i);
    const span = document.createElement("span");
    MathText.render(span, cat.name);
    h.appendChild(span);
    board.appendChild(h);
  });

  for (let row = 0; row < state.rows; row++) {
    state.categories.forEach((cat, ci) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.style.setProperty("--i", state.categories.length + row * state.categories.length + ci);

      const clue = cat.clues[row];
      if (!clue || state.used[ci][row]) {
        cell.classList.add("blank");
      } else {
        const dollar = document.createElement("span");
        dollar.className = "dollar";
        dollar.textContent = "$";
        const amount = document.createElement("span");
        amount.textContent = clue.value;
        cell.append(dollar, amount);
      }
      board.appendChild(cell);
    });
  }
}

// ---------------------
// Scoreboard
// ---------------------

function renderScoreboard(state) {
  const bar = $("#scoreboard");
  bar.replaceChildren();
  bar.classList.toggle("compact", state.teams.length > 5);

  const topScore = Math.max(...state.teams.map((t) => t.score));

  state.teams.forEach((team, ti) => {
    const card = document.createElement("div");
    card.className = "team-card";
    if (team.score === topScore && topScore > 0) card.classList.add("leader");
    if (state.active && state.lastWinner === ti) card.classList.add("won");

    const name = document.createElement("div");
    name.className = "team-card-name";
    name.textContent = team.name;

    const score = document.createElement("div");
    score.className = "team-card-score" + (team.score < 0 ? " negative" : "");
    score.textContent = fmtMoney(team.score);

    card.append(name, score);
    bar.appendChild(card);
  });
}

// ---------------------
// Clue overlay
// ---------------------

function renderClueOverlay(state) {
  const overlay = $("#clue-overlay");

  if (!state.active) {
    overlay.classList.remove("open", "revealed");
    return;
  }

  const { cat, row } = state.active;
  const clue = state.categories[cat].clues[row];

  // Only repopulate when a different clue opens (avoids re-running animations)
  const sameClue =
    prev?.active && prev.active.cat === cat && prev.active.row === row;

  if (!sameClue) {
    MathText.render($("#clue-category"), state.categories[cat].name);
    $("#clue-value").textContent = `$${clue.value}`;
    MathText.render($("#clue-text"), clue.clue);
    MathText.render($("#clue-answer"), clue.answer);
    overlay.classList.remove("revealed");
    // Force a reflow so the open transition replays for each clue
    void overlay.offsetWidth;
  }

  overlay.classList.add("open");
  overlay.classList.toggle("revealed", !!state.answerRevealed);
}

// ---------------------
// Think-music countdown
// Both tabs run on the same machine, so the host's
// startedAt timestamp is directly comparable to Date.now().
// ---------------------

let curTimer = null; // currently-running timer data
let timerLoop = null;

function updateThinkTimer(state) {
  curTimer = state && state.active ? state.thinkTimer : null;
  const el = $("#clue-timer");

  if (!curTimer) {
    el.classList.remove("show", "urgent");
    if (timerLoop) {
      clearInterval(timerLoop);
      timerLoop = null;
    }
    return;
  }

  const tick = () => {
    if (!curTimer) return;
    const elapsed = (Date.now() - curTimer.startedAt) / 1000;
    // clamp both ways: tab message latency can make elapsed slightly negative
    const remaining = Math.min(curTimer.duration, Math.max(0, curTimer.duration - elapsed));

    $("#clue-timer-secs").textContent = Math.ceil(remaining);
    $("#clue-timer-fill").style.width = `${(remaining / curTimer.duration) * 100}%`;
    el.classList.add("show");
    el.classList.toggle("urgent", remaining <= 5 && remaining > 0);

    if (remaining <= 0) {
      el.classList.remove("show", "urgent");
      clearInterval(timerLoop);
      timerLoop = null;
      curTimer = null;
    }
  };

  tick();
  if (!timerLoop) timerLoop = setInterval(tick, 100);
}

// ---------------------
// Game over
// ---------------------

function renderGameOver(state) {
  const podium = $("#podium");
  podium.replaceChildren();

  const ranked = [...state.teams].sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;

  ranked.forEach((team, place) => {
    const row = document.createElement("div");
    row.className = "podium-row";
    row.style.setProperty("--i", place);
    if (team.score === topScore) row.classList.add("champion");

    const medal = document.createElement("span");
    medal.className = "podium-place";
    medal.textContent =
      team.score === topScore ? "🏆" : place === 1 ? "🥈" : place === 2 ? "🥉" : `${place + 1}`;

    const name = document.createElement("span");
    name.className = "podium-name";
    name.textContent = team.name;

    const score = document.createElement("span");
    score.className = "podium-score" + (team.score < 0 ? " negative" : "");
    score.textContent = fmtMoney(team.score);

    row.append(medal, name, score);
    podium.appendChild(row);
  });

  spawnConfetti();
}

function spawnConfetti() {
  const wrap = $("#confetti");
  wrap.replaceChildren();
  const colours = ["#ffd700", "#ffffff", "#4a6cff", "#ff5e5e", "#5eff8f"];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colours[i % colours.length];
    piece.style.animationDelay = `${Math.random() * 4}s`;
    piece.style.animationDuration = `${3 + Math.random() * 3}s`;
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 200}px`);
    wrap.appendChild(piece);
  }
}
