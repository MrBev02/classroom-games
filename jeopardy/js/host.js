// =====================================================
// Jeopardy — Host Controller
//
// The host tab OWNS all game state. Every change is
// broadcast as a full state snapshot; the display tab
// (index.html) is a passive renderer that mirrors it.
// State is also saved to localStorage so an accidental
// refresh mid-game doesn't lose anything.
// =====================================================

const channel = new GameChannel();
const sounds = new SoundManager();
const $ = (sel) => document.querySelector(sel);

const SAVE_KEY = "jeopardy-save-v1";
const MIN_TEAMS = 2;
const MAX_TEAMS = 10;

let state = null; // null until a game starts

// Auto-play think music whenever a clue opens (setup checkbox)
let autoPlayMusic = localStorage.getItem("jeopardy-autoplay") !== "off";

// ---------------------
// Helpers
// ---------------------

const fmtMoney = (n) => (n < 0 ? `−$${Math.abs(n)}` : `$${n}`);

function publicState() {
  return state ?? { phase: "waiting" };
}

/** Broadcast + persist + re-render. Call after every state change. */
function update() {
  if (state) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }
  channel.send("STATE", publicState());
  render();
}

// Late-opened display asks for the current state
channel.on("HELLO", () => channel.send("STATE", publicState()));

// ---------------------
// State construction
// ---------------------

function newState(setIndex, teamNames) {
  const set = GAME_SETS[setIndex];
  const rows = Math.max(...set.categories.map((c) => c.clues.length));

  return {
    phase: "board", // board | gameover
    title: set.title,
    rows,
    categories: set.categories.map((c) => ({
      name: c.name,
      clues: c.clues.map((cl, r) => ({
        clue: cl.clue,
        answer: cl.answer,
        value: cl.value ?? (r + 1) * 100,
      })),
    })),
    teams: teamNames.map((n) => ({ name: n, score: 0 })),
    used: set.categories.map((c) => c.clues.map(() => false)),
    active: null,        // { cat, row } while a clue is open
    answerRevealed: false,
    attempted: [],       // team indexes that answered the open clue wrong
    resolved: false,     // open clue has been won (lock team buttons)
    lastWinner: null,    // team index that won the open clue
    thinkTimer: null,    // { duration, startedAt } while think music plays
  };
}

function remainingClues() {
  return state.used.flat().filter((u) => !u).length;
}

// ---------------------
// Setup screen
// ---------------------

function populateSetup() {
  const select = $("#game-select");
  select.replaceChildren();
  GAME_SETS.forEach((set, i) => {
    const rows = Math.max(...set.categories.map((c) => c.clues.length));
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${set.title} (${set.categories.length} categories × ${rows} clues)`;
    select.appendChild(opt);
  });

  const teamSelect = $("#team-count");
  teamSelect.replaceChildren();
  for (let n = MIN_TEAMS; n <= MAX_TEAMS; n++) {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = `${n} teams`;
    teamSelect.appendChild(opt);
  }
  teamSelect.value = "4";

  teamSelect.addEventListener("change", buildTeamInputs);
  buildTeamInputs();

  const autoplayBox = $("#autoplay-music");
  autoplayBox.checked = autoPlayMusic;
  autoplayBox.addEventListener("change", () => {
    autoPlayMusic = autoplayBox.checked;
    localStorage.setItem("jeopardy-autoplay", autoPlayMusic ? "on" : "off");
  });

  // Offer to resume a saved game
  const saved = loadSave();
  if (saved) {
    $("#resume-banner").hidden = false;
    $("#resume-title").textContent =
      `"${saved.title}" — ${saved.teams.length} teams, ` +
      `${saved.used.flat().filter((u) => !u).length} clues left`;
  }
}

// ---------------------
// Load your own questions (custom game set)
// ---------------------

const CUSTOM_PROMPT = `Create a Jeopardy question set as JSON for a classroom game.

Topic: [TOPIC]
Year/grade level: [YEAR LEVEL]
Board: 5 categories with 5 clues each, easiest clue first, hardest last.

Output ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{
  "title": "Short game title",
  "categories": [
    {
      "name": "Category name",
      "clues": [
        { "clue": "A statement students must respond to", "answer": "What is ...?" }
      ]
    }
  ]
}

Rules:
- "clue" is the prompt shown to students; "answer" is the correct response.
- Answers may be in Jeopardy style ("What is ...?") or plain — either is fine.
- Do NOT include dollar values; they are added automatically by row.
- Keep clues factual and suitable for the year level.`;

function validateCustomGame(d) {
  const { ok, err } = CustomQuestions;
  if (!d || typeof d !== "object" || Array.isArray(d))
    return err('The top level must be an object with "title" and "categories".');
  if (typeof d.title !== "string" || !d.title.trim())
    return err('Missing "title" (a non-empty string).');
  if (!Array.isArray(d.categories) || d.categories.length === 0)
    return err('"categories" must be a non-empty array.');

  for (let i = 0; i < d.categories.length; i++) {
    const c = d.categories[i];
    const where = `Category ${i + 1}`;
    if (!c || typeof c !== "object" || Array.isArray(c))
      return err(`${where} must be an object.`);
    if (typeof c.name !== "string" || !c.name.trim())
      return err(`${where} is missing a "name".`);
    if (!Array.isArray(c.clues) || c.clues.length === 0)
      return err(`${where} ("${c.name}") must have a non-empty "clues" array.`);
    for (let j = 0; j < c.clues.length; j++) {
      const cl = c.clues[j];
      const cw = `${where} ("${c.name}") clue ${j + 1}`;
      if (!cl || typeof cl !== "object" || Array.isArray(cl))
        return err(`${cw} must be an object.`);
      if (typeof cl.clue !== "string" || !cl.clue.trim())
        return err(`${cw} is missing "clue" text.`);
      if (typeof cl.answer !== "string" || !cl.answer.trim())
        return err(`${cw} is missing an "answer".`);
      if (cl.value != null && (typeof cl.value !== "number" || !isFinite(cl.value)))
        return err(`${cw} has a non-numeric "value".`);
    }
  }

  const rows = Math.max(...d.categories.map((c) => c.clues.length));
  return ok(d, `${d.title} — ${d.categories.length} categories × up to ${rows} clues`);
}

function addCustomGameSet(set) {
  GAME_SETS.push(set);
  const i = GAME_SETS.length - 1;
  const rows = Math.max(...set.categories.map((c) => c.clues.length));
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = `★ ${set.title} (${set.categories.length} categories × ${rows} clues)`;
  $("#game-select").appendChild(opt);
  $("#game-select").value = String(i);
}

function setupCustomQuestions() {
  CustomQuestions.mount({
    mount: $("#custom-questions"),
    promptText: CUSTOM_PROMPT,
    readyHint: "Added as the selected game set — click Start Game ▶.",
    validate: validateCustomGame,
    onLoad: addCustomGameSet,
  });
}

function buildTeamInputs() {
  const count = parseInt($("#team-count").value, 10);
  const wrap = $("#team-names");
  const existing = [...wrap.querySelectorAll("input")].map((i) => i.value);
  wrap.replaceChildren();
  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Team ${i + 1}`;
    input.value = existing[i] || "";
    input.maxLength = 20;
    wrap.appendChild(input);
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.phase && s.teams ? s : null;
  } catch {
    return null;
  }
}

function startGame() {
  const setIndex = parseInt($("#game-select").value, 10);
  const names = [...$("#team-names").querySelectorAll("input")].map(
    (input, i) => input.value.trim() || `Team ${i + 1}`
  );
  state = newState(setIndex, names);
  update();
}

function resumeGame() {
  state = loadSave();
  if (state) update();
}

function discardSave() {
  localStorage.removeItem(SAVE_KEY);
  $("#resume-banner").hidden = true;
}

// ---------------------
// Clue flow
// ---------------------

function openClue(cat, row) {
  if (state.used[cat][row]) return;
  state.active = { cat, row };
  state.answerRevealed = false;
  state.attempted = [];
  state.resolved = false;
  state.lastWinner = null;
  state.thinkTimer = null;
  if (autoPlayMusic && sounds.enabled) startThinkMusic();
  update();
}

/** Start the think music and the countdown shown on the display. */
function startThinkMusic() {
  sounds.playThink();
  state.thinkTimer = { duration: sounds.thinkDuration(), startedAt: Date.now() };
}

function stopThinkMusic() {
  sounds.stopThink();
  state.thinkTimer = null;
}

function activeClue() {
  const { cat, row } = state.active;
  return state.categories[cat].clues[row];
}

function markCorrect(teamIndex) {
  if (!state.active || state.resolved) return;
  state.teams[teamIndex].score += activeClue().value;
  state.lastWinner = teamIndex;
  state.answerRevealed = true;
  state.resolved = true;
  stopThinkMusic();
  sounds.ding();
  update();
}

function markWrong(teamIndex) {
  if (!state.active || state.resolved) return;
  if (state.attempted.includes(teamIndex)) return;
  state.teams[teamIndex].score -= activeClue().value;
  state.attempted.push(teamIndex);
  sounds.buzz();
  update();
}

function revealAnswer() {
  if (!state.active) return;
  state.answerRevealed = true;
  stopThinkMusic(); // thinking time is over once the answer is up
  update();
}

/** Mark the clue used and return to the board. */
function closeClue() {
  if (!state.active) return;
  stopThinkMusic();
  const { cat, row } = state.active;
  state.used[cat][row] = true;
  state.active = null;
  state.answerRevealed = false;
  state.lastWinner = null;
  state.resolved = false;
  state.attempted = [];
  update();
}

/** Close WITHOUT marking used — for an accidental click. */
function cancelClue() {
  if (!state.active) return;
  stopThinkMusic();
  // Undo any scoring that happened while the clue was open
  const value = activeClue().value;
  state.attempted.forEach((ti) => (state.teams[ti].score += value));
  if (state.lastWinner !== null) state.teams[state.lastWinner].score -= value;
  state.active = null;
  state.answerRevealed = false;
  state.lastWinner = null;
  state.resolved = false;
  state.attempted = [];
  update();
}

// ---------------------
// Scores / game end
// ---------------------

function adjustScore(teamIndex, delta) {
  state.teams[teamIndex].score += delta;
  update();
}

function showFinalResults() {
  state.phase = "gameover";
  state.active = null;
  update();
}

function backToBoard() {
  state.phase = "board";
  update();
}

function newGame() {
  if (state && !confirm("Start a new game? The current game will be discarded.")) {
    return;
  }
  state = null;
  localStorage.removeItem(SAVE_KEY);
  channel.send("STATE", { phase: "waiting" });
  $("#resume-banner").hidden = true;
  render();
}

// ---------------------
// Rendering (host screen)
// ---------------------

function render() {
  const inGame = state !== null;
  $("#setup-screen").hidden = inGame;
  $("#game-screen").hidden = !inGame || state.phase !== "board";
  $("#final-screen").hidden = !inGame || state.phase !== "gameover";
  $("#clue-modal").hidden = !inGame || !state.active;

  if (!inGame) return;

  if (state.phase === "board") {
    renderBoard();
    renderTeamsPanel();
    $("#game-title-label").textContent = state.title;
    $("#sound-btn").textContent = sounds.enabled ? "🔊 Sounds on" : "🔇 Sounds off";
    const left = remainingClues();
    $("#remaining-label").textContent = `${left} clue${left === 1 ? "" : "s"} left`;
    $("#all-done-banner").hidden = left !== 0;
  }

  if (state.active) renderClueModal();
  if (state.phase === "gameover") renderFinal();
}

function renderBoard() {
  const board = $("#host-board");
  board.replaceChildren();
  board.style.setProperty("--cols", state.categories.length);

  state.categories.forEach((cat) => {
    const h = document.createElement("div");
    h.className = "hb-category";
    h.textContent = cat.name;
    board.appendChild(h);
  });

  for (let row = 0; row < state.rows; row++) {
    state.categories.forEach((cat, ci) => {
      const cell = document.createElement("button");
      cell.className = "hb-cell";
      const clue = cat.clues[row];
      if (!clue) {
        cell.disabled = true;
        cell.classList.add("empty");
      } else if (state.used[ci][row]) {
        cell.disabled = true;
        cell.classList.add("used");
        cell.textContent = "—";
      } else {
        cell.textContent = `$${clue.value}`;
        cell.addEventListener("click", () => openClue(ci, row));
      }
      board.appendChild(cell);
    });
  }
}

function renderTeamsPanel() {
  const panel = $("#teams-panel");
  panel.replaceChildren();
  const topScore = Math.max(...state.teams.map((t) => t.score));

  state.teams.forEach((team, ti) => {
    const row = document.createElement("div");
    row.className = "team-row";
    if (team.score === topScore && topScore > 0) row.classList.add("leader");

    const name = document.createElement("span");
    name.className = "team-row-name";
    name.textContent = team.name;

    const score = document.createElement("span");
    score.className = "team-row-score" + (team.score < 0 ? " negative" : "");
    score.textContent = fmtMoney(team.score);

    const minus = document.createElement("button");
    minus.className = "adjust-btn";
    minus.textContent = "−100";
    minus.title = "Manual adjustment";
    minus.addEventListener("click", () => adjustScore(ti, -100));

    const plus = document.createElement("button");
    plus.className = "adjust-btn";
    plus.textContent = "+100";
    plus.title = "Manual adjustment";
    plus.addEventListener("click", () => adjustScore(ti, 100));

    row.append(name, score, minus, plus);
    panel.appendChild(row);
  });
}

function renderClueModal() {
  const { cat } = state.active;
  const clue = activeClue();

  $("#cm-category").textContent = state.categories[cat].name;
  $("#cm-value").textContent = `$${clue.value}`;
  $("#cm-clue").textContent = clue.clue;
  $("#cm-answer").textContent = clue.answer;

  $("#cm-reveal-btn").disabled = state.answerRevealed;
  $("#cm-reveal-btn").textContent = state.answerRevealed
    ? "Answer shown on display"
    : "Reveal answer on display";

  const musicBtn = $("#cm-music-btn");
  musicBtn.textContent = sounds.thinkPlaying ? "⏹ Stop music" : "🎵 Think music";
  musicBtn.disabled = !sounds.enabled;

  $("#cm-done-btn").classList.toggle("pulse", state.resolved);

  const status = $("#cm-status");
  if (state.resolved) {
    status.textContent = `✓ ${state.teams[state.lastWinner].name} +$${clue.value}`;
    status.className = "cm-status correct";
  } else if (state.attempted.length) {
    status.textContent = `${state.attempted.length} wrong attempt${state.attempted.length === 1 ? "" : "s"}`;
    status.className = "cm-status wrong";
  } else {
    status.textContent = "";
    status.className = "cm-status";
  }

  const grid = $("#cm-teams");
  grid.replaceChildren();
  state.teams.forEach((team, ti) => {
    const card = document.createElement("div");
    card.className = "cm-team";
    if (state.attempted.includes(ti)) card.classList.add("attempted");
    if (state.lastWinner === ti) card.classList.add("winner");

    const label = document.createElement("div");
    label.className = "cm-team-label";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = team.name;
    const scoreSpan = document.createElement("span");
    scoreSpan.textContent = fmtMoney(team.score);
    if (team.score < 0) scoreSpan.className = "negative";
    label.append(nameSpan, scoreSpan);

    const buttons = document.createElement("div");
    buttons.className = "cm-team-buttons";

    const right = document.createElement("button");
    right.className = "btn-correct";
    right.textContent = `✓ +$${clue.value}`;
    right.disabled = state.resolved;
    right.addEventListener("click", () => markCorrect(ti));

    const wrong = document.createElement("button");
    wrong.className = "btn-wrong";
    wrong.textContent = `✗ −$${clue.value}`;
    wrong.disabled = state.resolved || state.attempted.includes(ti);
    wrong.title = "Deduct points — only if you're playing with penalties";
    wrong.addEventListener("click", () => markWrong(ti));

    buttons.append(right, wrong);
    card.append(label, buttons);
    grid.appendChild(card);
  });
}

function renderFinal() {
  const list = $("#final-standings");
  list.replaceChildren();
  const ranked = state.teams
    .map((t, i) => ({ ...t, index: i }))
    .sort((a, b) => b.score - a.score);

  ranked.forEach((team, place) => {
    const row = document.createElement("div");
    row.className = "final-row" + (place === 0 ? " first" : "");

    const placeSpan = document.createElement("span");
    placeSpan.className = "final-place";
    placeSpan.textContent = place + 1;

    const nameSpan = document.createElement("span");
    nameSpan.className = "final-name";
    nameSpan.textContent = team.name;

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "final-score" + (team.score < 0 ? " negative" : "");
    scoreSpan.textContent = fmtMoney(team.score);

    row.append(placeSpan, nameSpan, scoreSpan);
    list.appendChild(row);
  });
}

// ---------------------
// Print Answer Key
// Opens a printable tab with every clue & answer for the
// selected game set.
// ---------------------

function printAnswerKey() {
  const set = GAME_SETS[parseInt($("#game-select").value, 10)];
  const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let html = `<!DOCTYPE html><html><head><title>Answer Key — ${esc(set.title)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 750px; margin: 2rem auto; color: #222; }
  h1 { text-align: center; margin-bottom: 1.2rem; }
  .cat { page-break-inside: avoid; margin-bottom: 1.2rem; }
  .cat h3 { margin: 0 0 0.3rem; font-size: 1.05rem; border-bottom: 2px solid #222; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { text-align: left; padding: 0.25rem 0.6rem; border-bottom: 1px solid #ddd; vertical-align: top; }
  th { font-size: 0.75rem; text-transform: uppercase; color: #888; }
  .val { white-space: nowrap; font-weight: bold; }
  @media print { body { margin: 0.5cm; } }
</style></head><body>
<h1>Jeopardy — ${esc(set.title)}</h1>`;

  set.categories.forEach((cat) => {
    html += `<div class="cat"><h3>${esc(cat.name)}</h3><table>
      <tr><th>Value</th><th>Clue</th><th>Answer</th></tr>`;
    cat.clues.forEach((cl, r) => {
      html += `<tr><td class="val">$${cl.value ?? (r + 1) * 100}</td><td>${esc(cl.clue)}</td><td>${esc(cl.answer)}</td></tr>`;
    });
    html += `</table></div>`;
  });

  html += `</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  window.open(URL.createObjectURL(blob), "_blank");
}

// ---------------------
// Wire up static buttons
// ---------------------

$("#start-btn").addEventListener("click", startGame);
$("#resume-btn").addEventListener("click", resumeGame);
$("#discard-btn").addEventListener("click", discardSave);
$("#print-key-btn").addEventListener("click", printAnswerKey);
$("#test-sound-btn").addEventListener("click", () => {
  const ctxState = sounds.testSound();
  const status = $("#test-sound-status");
  if (ctxState === "running") {
    status.textContent = "Ding played — if you heard nothing, check the tab isn't muted and your output device/volume.";
  } else {
    status.textContent = `Audio is blocked by the browser (state: ${ctxState}) — check the site's sound permission in the address bar.`;
  }
});
$("#open-display-btn").addEventListener("click", () =>
  window.open("index.html", "_blank")
);

$("#final-results-btn").addEventListener("click", showFinalResults);
$("#new-game-btn").addEventListener("click", newGame);
$("#all-done-btn").addEventListener("click", showFinalResults);

$("#cm-reveal-btn").addEventListener("click", revealAnswer);
$("#cm-done-btn").addEventListener("click", closeClue);
$("#cm-cancel-btn").addEventListener("click", cancelClue);

$("#cm-music-btn").addEventListener("click", () => {
  if (sounds.thinkPlaying) {
    stopThinkMusic();
  } else {
    startThinkMusic();
  }
  update();
});
$("#sound-btn").addEventListener("click", () => {
  sounds.setEnabled(!sounds.enabled);
  if (!sounds.enabled && state) state.thinkTimer = null;
  state ? update() : render();
});
// When the think track/loop finishes on its own, clear the countdown
sounds.onThinkEnd = () => {
  if (state) {
    state.thinkTimer = null;
    update();
  }
};

$("#final-back-btn").addEventListener("click", backToBoard);
$("#final-new-btn").addEventListener("click", newGame);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state && state.active) cancelClue();
});

// ---------------------
// Init
// ---------------------

populateSetup();
setupCustomQuestions();
render();
// Tell any already-open display we're here (it shows the waiting screen)
channel.send("STATE", publicState());
