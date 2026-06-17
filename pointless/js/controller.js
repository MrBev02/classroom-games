/**
 * Pointless — Controller tab logic.
 * Owns all game state; sends commands to the display tab.
 */

(function () {
    'use strict';

    const channel = new GameChannel();
    const scorer = new Scorer();

    // ── DOM helpers ─────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const show = (el) => { if (el) el.style.display = ''; };
    const hide = (el) => { if (el) el.style.display = 'none'; };

    // Open (or re-focus) the students' Board in its own tab. Keeping a
    // reference plus a fixed window name reuses the tab instead of duplicating.
    let boardWin = null;
    function openBoard() {
        if (boardWin && !boardWin.closed) { boardWin.focus(); return true; }
        boardWin = window.open('display.html', 'pointless-board');
        if (boardWin) { boardWin.focus(); return true; }
        const hint = $('consoleHint');
        if (hint) hint.textContent = 'Pop-up blocked — click Open Board (top right)';
        return false;
    }
    $('openBoardBtn').addEventListener('click', openBoard);
    const esc = (s) => {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    };

    // ── Game State ──────────────────────────────────────────
    const state = {
        phase: 'setup',          // setup | round | scoreboard | final | finished
        gameData: null,
        teams: [
            { name: 'Team 1', score: 0, eliminated: false },
            { name: 'Team 2', score: 0, eliminated: false },
            { name: 'Team 3', score: 0, eliminated: false },
            { name: 'Team 4', score: 0, eliminated: false },
        ],
        currentRound: 0,         // 0-indexed into gameData.rounds
        currentQuestionIndex: 0,
        currentTurnIndex: 0,     // index into turnOrder
        turnOrder: [],
        questionAnswers: [],     // { teamIndex, answer, score } given this question
        waitingForAnimation: false,
        displayConnected: false,
        history: [],             // snapshots for undo
        // Final round
        finalTeamIndex: -1,
        finalAnswerCount: 0,
        finalScores: [],
    };

    // ── Panels ──────────────────────────────────────────────
    const panels = {
        setup: $('setupPanel'),
        game: $('gamePanel'),
        scoreboard: $('scoreboardPanel'),
        final: $('finalPanel'),
    };

    function showPanel(name) {
        Object.values(panels).forEach(p => hide(p));
        if (panels[name]) show(panels[name]);
        if (name === 'setup') {
            hide($('sidebar'));
        } else {
            show($('sidebar'));
        }
    }

    // ── Connection status ───────────────────────────────────
    function setConnected(connected) {
        state.displayConnected = connected;
        const dot = $('statusDot');
        const text = $('statusText');
        dot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
        text.textContent = `Board: ${connected ? 'connected' : 'disconnected'}`;
    }

    channel.on('READY', () => {
        setConnected(true);
        // If game is in progress, resend current state
        if (state.phase !== 'setup' && state.gameData) {
            channel.send('LOAD_GAME', { teams: state.teams });
            if (state.phase === 'round') {
                const round = state.gameData.rounds[state.currentRound];
                channel.send('START_ROUND', {
                    roundNumber: round.roundNumber,
                    totalRounds: state.gameData.rounds.length,
                });
            }
        }
    });

    let heartbeatTimeout = null;
    channel.on('PONG', () => {
        clearTimeout(heartbeatTimeout);
        setConnected(true);
    });

    channel.on('ANIMATION_COMPLETE', (payload) => {
        state.waitingForAnimation = false;
        if (payload.eventType === 'REVEAL_ANSWER') {
            advanceAfterAnswer();
        } else if (payload.eventType === 'REVEAL_FINAL_ANSWER') {
            advanceAfterFinalAnswer();
        }
    });

    // Heartbeat — detect display tab disconnect
    setInterval(() => {
        if (state.phase !== 'setup') {
            channel.send('PING', {});
            heartbeatTimeout = setTimeout(() => setConnected(false), 3000);
        }
    }, 10000);

    // ── Load your own questions ─────────────────────────────
    const CUSTOM_PROMPT = String.raw`You are creating a "Pointless"-style game for my class. Output a single valid
JSON object that I will load into a game tool. Follow the format exactly.

MY CONTENT
- Subject / year level: <e.g. Year 9 Science>
- Topic of this game: <e.g. The Water Cycle>
- Number of rounds: 3 (with 1-2 questions each, plus one final question)
- Answers per question: 10 to 12
- Source material (paste your notes, a textbook section, or key terms — or leave
  blank to use general knowledge of the topic):
  <paste here or leave blank>

HOW POINTLESS WORKS — LOWER scores are better:
- A score is how many of 100 surveyed people gave that answer.
- Common, obvious answers score HIGH (bad). Obscure-but-correct answers score
  LOW (good). A score of 0 is "pointless" — correct but almost no one named it.
- Every answer you list must be genuinely CORRECT; the game rewards finding the
  obscure correct ones.
- Example:  question = "Name a planet in our solar system"
            "Earth" might score 80, "Neptune" might score 5, and a correct but
            rarely-named one could score 0.

RULES
- Produce the number of rounds I asked for, with 1-2 questions each, plus one
  final question.
- Give each question the number of answers I asked for, from common (high score)
  to obscure (score 0).
- Every score is a whole number from 0 to 100 (lower = more obscure/better).
- Include at least one answer scoring 0 per question where possible.
- Write all answer keys (and any aliases) in lowercase.
- "aliases" is OPTIONAL — alternative spellings or abbreviations that should also
  be accepted as the same answer.
- Answers should be drawn from the topic or source material.

MATH & FORMULAS (only if your subject needs them)
- A category or question may contain mathematical notation written in LaTeX. Put
  inline maths inside \\( ... \\) and a large, centred formula inside $$ ... $$.
- Because this is JSON, every backslash must be DOUBLED, e.g.
    "question": "Name a solution of \\(x^2 = 4\\)"
- Keep the answer keys themselves as plain words or numbers where you can —
  students type their guesses, so plain text is easiest to match.
- Do NOT use a single $ as a maths delimiter — a lone $ stays a dollar sign.

OUTPUT FORMAT — this must be valid JSON:
- Use double quotes around every key and every text value.
- No trailing commas. No comments. No markdown code fences.
- Output ONLY the JSON object — nothing before or after it.

Copy this structure exactly:
{
  "title": "Short game title",
  "rounds": [
    {
      "roundNumber": 1,
      "questions": [
        {
          "category": "Category name",
          "question": "Name a ...",
          "answers": {
            "common answer": 90,
            "less common answer": 45,
            "rarer answer": { "score": 12, "aliases": ["alt spelling"] },
            "obscure correct answer": 0
          }
        }
      ]
    }
  ],
  "final": {
    "category": "Category name",
    "question": "Name a ...",
    "answers": { "an answer": 40, "a pointless answer": 0 }
  }
}

If the tool says the file is invalid, paste the error back to me and I will fix it.

Now generate the game.`;

    function validateQuestion(q, where) {
        const { err } = CustomQuestions;
        if (!q || typeof q !== 'object' || Array.isArray(q))
            return err(`${where} must be an object.`);
        if (typeof q.category !== 'string' || !q.category.trim())
            return err(`${where} is missing a "category".`);
        if (typeof q.question !== 'string' || !q.question.trim())
            return err(`${where} is missing "question" text.`);
        if (!q.answers || typeof q.answers !== 'object' || Array.isArray(q.answers))
            return err(`${where} must have an "answers" object.`);
        const keys = Object.keys(q.answers);
        if (keys.length === 0) return err(`${where} has no answers.`);
        for (const k of keys) {
            const v = q.answers[k];
            let score;
            if (typeof v === 'number') score = v;
            else if (v && typeof v === 'object' && typeof v.score === 'number') score = v.score;
            else return err(`${where}: answer "${k}" must be a number, or an object with a numeric "score".`);
            if (!isFinite(score)) return err(`${where}: answer "${k}" has a non-numeric score.`);
        }
        return null; // valid
    }

    function validatePointlessGame(d) {
        const { ok, err } = CustomQuestions;
        if (!d || typeof d !== 'object' || Array.isArray(d))
            return err('The top level must be a JSON object.');
        if (typeof d.title !== 'string' || !d.title.trim())
            return err('Missing "title" (a non-empty string).');
        if (!Array.isArray(d.rounds) || d.rounds.length === 0)
            return err('"rounds" must be a non-empty array.');

        for (let i = 0; i < d.rounds.length; i++) {
            const r = d.rounds[i];
            const w = `Round ${i + 1}`;
            if (!r || typeof r !== 'object' || Array.isArray(r))
                return err(`${w} must be an object.`);
            if (typeof r.roundNumber !== 'number')
                return err(`${w} is missing a numeric "roundNumber".`);
            if (!Array.isArray(r.questions) || r.questions.length === 0)
                return err(`${w} must have a non-empty "questions" array.`);
            for (let j = 0; j < r.questions.length; j++) {
                const e = validateQuestion(r.questions[j], `${w} question ${j + 1}`);
                if (e) return e;
            }
        }

        if (!d.final || typeof d.final !== 'object' || Array.isArray(d.final))
            return err('Missing a "final" round object.');
        const fe = validateQuestion(d.final, 'The "final" round');
        if (fe) return fe;

        const qCount = d.rounds.reduce((n, r) => n + r.questions.length, 0);
        return ok(d, `${d.title} — ${d.rounds.length} rounds, ${qCount} questions + final`);
    }

    // ── Ready-made sample games ─────────────────────────────
    // Built-in sets from data/samples.js, shown in the #sampleSelect
    // dropdown so a host can pick one and press Start with nothing to
    // edit — the same flow as the Jeopardy and Family Feud host screens.
    // Custom sets loaded below are appended here and auto-selected.
    // POINTLESS_SAMPLES is a global `const` from data/samples.js (loaded first).
    // A top-level `const` is a global lexical binding, not a window property, so
    // reference it directly — guarded with typeof in case the script didn't load.
    const games = typeof POINTLESS_SAMPLES !== 'undefined' && Array.isArray(POINTLESS_SAMPLES)
        ? POINTLESS_SAMPLES.slice()
        : [];
    const builtinCount = games.length;

    function gameLabel(g) {
        const qCount = g.rounds.reduce((n, r) => n + r.questions.length, 0);
        return `${g.title} (${g.rounds.length} rounds, ${qCount} questions + final)`;
    }

    function selectGame(i) {
        const g = games[i];
        if (!g) return;
        state.gameData = g;
        $('startGameBtn').disabled = false;
    }

    // (Re)build the dropdown and select one set. Custom sets (index past the
    // built-ins) are marked with a ★. Falls back to disabling Start if there
    // are somehow no sets at all (e.g. samples.js failed to load).
    function refreshSampleSelect(selectedIndex = 0) {
        const select = $('sampleSelect');
        select.replaceChildren();
        games.forEach((g, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = (i >= builtinCount ? '★ ' : '') + gameLabel(g);
            select.appendChild(opt);
        });
        if (games.length === 0) {
            state.gameData = null;
            $('startGameBtn').disabled = true;
            return;
        }
        const idx = Math.min(Math.max(selectedIndex, 0), games.length - 1);
        select.value = String(idx);
        selectGame(idx);
    }

    $('sampleSelect').addEventListener('change', (e) =>
        selectGame(parseInt(e.target.value, 10))
    );

    const customReadyHint = 'Added as the selected set — set team names and click Start Game.';
    const onCustomLoad = (data) => {
        games.push(data);
        refreshSampleSelect(games.length - 1);
    };
    const customAI = CustomQuestions.mount({
        mount: $('customQuestionsAI'),
        mode: 'ai',
        promptText: CUSTOM_PROMPT,
        readyHint: customReadyHint,
        validate: validatePointlessGame,
        onLoad: onCustomLoad,
    });
    const customImport = CustomQuestions.mount({
        mount: $('customQuestionsImport'),
        mode: 'import',
        readyHint: customReadyHint,
        validate: validatePointlessGame,
        onLoad: onCustomLoad,
    });

    if (window.PointlessEditor) {
        PointlessEditor.mount({
            mount: $('questionEditor'),
            storageKey: 'pointless-bank-v1',
            validate: validatePointlessGame,
            onUse: (data) => {
                games.push(data);
                refreshSampleSelect(games.length - 1);
            },
        });
    }

    // ── Start Game ──────────────────────────────────────────
    $('startGameBtn').addEventListener('click', () => {
        // Read team names
        for (let i = 0; i < 4; i++) {
            const input = $(`setupTeam${i}`);
            state.teams[i].name = input.value.trim() || `Team ${i + 1}`;
            state.teams[i].score = 0;
            state.teams[i].eliminated = false;
        }

        state.currentRound = 0;
        state.currentQuestionIndex = 0;
        state.history = [];

        channel.send('LOAD_GAME', { teams: state.teams });
        startRound();
        openBoard();
    });

    // ── Round management ────────────────────────────────────
    function startRound() {
        const round = state.gameData.rounds[state.currentRound];
        if (!round) return;

        state.phase = 'round';
        state.currentQuestionIndex = 0;

        channel.send('START_ROUND', {
            roundNumber: round.roundNumber,
            totalRounds: state.gameData.rounds.length,
        });

        showPanel('game');
        $('roundTitle').textContent = `Round ${round.roundNumber}`;
        updateQuestionInfo();
        show($('showQuestionBtn'));
        hide($('answerSection'));
        hide($('nextQuestionBtn'));
        hide($('showScoreboardBtn'));
        hide($('answerReference'));
        hide($('currentQuestion'));

        updateSidebar();
    }

    function updateQuestionInfo() {
        const round = state.gameData.rounds[state.currentRound];
        const qNum = state.currentQuestionIndex + 1;
        const total = round.questions.length;
        $('questionInfo').textContent = `Question ${qNum} of ${total}`;
    }

    // ── Show Question ───────────────────────────────────────
    $('showQuestionBtn').addEventListener('click', () => {
        const round = state.gameData.rounds[state.currentRound];
        const question = round.questions[state.currentQuestionIndex];
        if (!question) return;

        // Load scorer
        scorer.loadAnswers(question.answers);
        state.questionAnswers = [];

        // Build turn order (active teams, rotated)
        const activeTeams = state.teams
            .map((t, i) => i)
            .filter(i => !state.teams[i].eliminated);

        const rotation = state.currentQuestionIndex % activeTeams.length;
        state.turnOrder = [...activeTeams.slice(rotation), ...activeTeams.slice(0, rotation)];
        state.currentTurnIndex = 0;

        // Send to display
        channel.send('SHOW_QUESTION', {
            category: question.category,
            question: question.question,
        });

        // Update controller UI
        hide($('showQuestionBtn'));
        show($('answerSection'));
        show($('answerReference'));
        $('currentQuestion').style.display = 'block';
        MathText.render($('cqCategory'), question.category);
        MathText.render($('cqText'), question.question);

        renderAnswerReference();
        setActiveTeamUI();
    });

    // ── Team turn management ────────────────────────────────
    function setActiveTeamUI() {
        const teamIdx = state.turnOrder[state.currentTurnIndex];
        const team = state.teams[teamIdx];

        $('activeTeamLabel').textContent = `${team.name}'s Turn`;
        $('activeTeamLabel').className = `team-turn-${teamIdx}`;

        $('answerInput').value = '';
        $('answerInput').disabled = false;
        $('submitAnswerBtn').disabled = false;
        hideAnswerResult();
        hide($('wrongControls'));

        $('answerInput').focus();

        channel.send('SET_ACTIVE_TEAM', { teamIndex: teamIdx });
    }

    function hideAnswerResult() {
        const el = $('answerResult');
        el.className = 'answer-result';
        el.style.display = 'none';
        el.innerHTML = '';
    }

    function showAnswerResult(type, html) {
        const el = $('answerResult');
        el.className = `answer-result ${type}`;
        el.style.display = 'block';
        el.innerHTML = html;
        MathText.typeset(el);
    }

    // ── Submit answer ───────────────────────────────────────
    $('submitAnswerBtn').addEventListener('click', submitAnswer);
    $('answerInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitAnswer();
    });

    function submitAnswer() {
        if (state.waitingForAnimation) return;

        const input = $('answerInput').value.trim();
        if (!input) return;

        const result = scorer.match(input);
        const teamIdx = state.turnOrder[state.currentTurnIndex];

        if (result.matched && result.claimed) {
            showAnswerResult('claimed',
                `<strong>"${esc(result.original)}"</strong> has already been claimed!<br>Team must give a different answer.`);
            $('answerInput').value = '';
            $('answerInput').focus();
            return;
        }

        if (result.matched) {
            showAnswerResult('matched',
                `<strong>"${esc(result.original)}"</strong><br><span class="result-score">${result.score}</span>`);
            $('answerInput').disabled = true;
            $('submitAnswerBtn').disabled = true;
            hide($('wrongControls'));

            scorer.claim(result.original);
            revealAnswer(teamIdx, result.original, result.score);
        } else {
            showAnswerResult('no-match',
                `<strong>"${esc(input)}"</strong> — No match found.`);
            show($('wrongControls'));
            $('answerInput').disabled = true;
            $('submitAnswerBtn').disabled = true;
        }
    }

    // ── Wrong / Override ────────────────────────────────────
    $('markWrongBtn').addEventListener('click', () => {
        const teamIdx = state.turnOrder[state.currentTurnIndex];
        const input = $('answerInput').value.trim();
        revealAnswer(teamIdx, input || 'Wrong', 100);
        hide($('wrongControls'));
    });

    $('overrideBtn').addEventListener('click', () => {
        const score = parseInt($('overrideScore').value);
        if (isNaN(score) || score < 0 || score > 100) return;
        const teamIdx = state.turnOrder[state.currentTurnIndex];
        const input = $('answerInput').value.trim();
        revealAnswer(teamIdx, input, score);
        hide($('wrongControls'));
        $('overrideScore').value = '';
    });

    // ── Reveal answer (send to display) ─────────────────────
    // Claiming is done at the call site before calling this function.
    function revealAnswer(teamIndex, answer, score) {
        pushHistory('answer', { teamIndex, answer, score });

        state.teams[teamIndex].score += score;
        state.questionAnswers.push({ teamIndex, answer, score });

        state.waitingForAnimation = true;

        channel.send('REVEAL_ANSWER', {
            answer,
            score,
            teamIndex,
            newTotal: state.teams[teamIndex].score,
        });

        renderAnswerReference();
        updateSidebar();
    }

    function advanceAfterAnswer() {
        state.currentTurnIndex++;

        if (state.currentTurnIndex >= state.turnOrder.length) {
            // All teams have answered this question
            hide($('answerSection'));

            const round = state.gameData.rounds[state.currentRound];
            if (state.currentQuestionIndex < round.questions.length - 1) {
                show($('nextQuestionBtn'));
            } else {
                show($('showScoreboardBtn'));
            }
        } else {
            setActiveTeamUI();
        }
    }

    // ── Next Question ───────────────────────────────────────
    $('nextQuestionBtn').addEventListener('click', () => {
        state.currentQuestionIndex++;
        hide($('nextQuestionBtn'));
        hide($('showScoreboardBtn'));
        show($('showQuestionBtn'));
        hide($('answerSection'));
        hide($('answerReference'));
        hide($('currentQuestion'));
        updateQuestionInfo();
    });

    // ── Show Scoreboard ─────────────────────────────────────
    $('showScoreboardBtn').addEventListener('click', () => {
        showScoreboard();
    });

    function showScoreboard() {
        state.phase = 'scoreboard';
        showPanel('scoreboard');

        channel.send('SHOW_SCOREBOARD', { teams: state.teams });

        renderControllerScoreboard();

        // Determine what comes next
        const totalRounds = state.gameData.rounds.length;
        const currentRoundNum = state.gameData.rounds[state.currentRound].roundNumber;

        hide($('nextRoundBtn'));
        hide($('startHeadToHeadBtn'));
        hide($('startFinalBtn'));
        hide($('showWinnerBtn'));

        if (state.currentRound < totalRounds - 2) {
            // More regular rounds
            show($('nextRoundBtn'));
        } else if (state.currentRound === totalRounds - 2) {
            // After round 2 — eliminate and head to head
            show($('startHeadToHeadBtn'));
        } else if (state.currentRound === totalRounds - 1) {
            // After head to head — go to final
            show($('startFinalBtn'));
        }
    }

    function renderControllerScoreboard() {
        const teamColors = ['var(--team-0)', 'var(--team-1)', 'var(--team-2)', 'var(--team-3)'];
        const sorted = state.teams
            .map((t, i) => ({ ...t, index: i }))
            .sort((a, b) => a.score - b.score);

        $('controllerScoreboard').innerHTML = sorted.map((t, rank) => `
            <div class="sb-row${t.eliminated ? ' eliminated' : ''}"
                 style="--row-color: ${teamColors[t.index]}">
                <div class="sb-rank">${rank + 1}</div>
                <div class="sb-name">${esc(t.name)}</div>
                <div class="sb-score">${t.score}</div>
            </div>
        `).join('');
    }

    // ── Next Round ──────────────────────────────────────────
    $('nextRoundBtn').addEventListener('click', () => {
        state.currentRound++;
        startRound();
    });

    // ── Head to Head (eliminate bottom 2 teams) ─────────────
    $('startHeadToHeadBtn').addEventListener('click', () => {
        // Sort by score descending (highest = worst)
        const sorted = state.teams
            .map((t, i) => ({ ...t, index: i }))
            .filter(t => !t.eliminated)
            .sort((a, b) => b.score - a.score);

        // Eliminate top 2 highest scorers
        for (let i = 0; i < 2 && i < sorted.length; i++) {
            state.teams[sorted[i].index].eliminated = true;
            channel.send('ELIMINATE_TEAM', { teamIndex: sorted[i].index });
        }

        renderControllerScoreboard();
        updateSidebar();

        // Move to round 3
        state.currentRound++;
        setTimeout(() => startRound(), 500);
    });

    // ── Start Final ─────────────────────────────────────────
    $('startFinalBtn').addEventListener('click', () => {
        // Find the finalist — lowest score in round 3 question
        const activeTeams = state.teams
            .map((t, i) => ({ ...t, index: i }))
            .filter(t => !t.eliminated);

        // Look at the last question's answers to determine round 3 winner
        // The team with the lower score on the last question goes to the final
        const lastAnswers = state.questionAnswers;
        let finalist;

        if (lastAnswers.length >= 2) {
            const sorted = [...lastAnswers].sort((a, b) => a.score - b.score);
            finalist = sorted[0].teamIndex;
        } else {
            // Fallback: lowest cumulative
            finalist = activeTeams.sort((a, b) => a.score - b.score)[0].index;
        }

        state.finalTeamIndex = finalist;
        state.finalAnswerCount = 0;
        state.finalScores = [];
        state.phase = 'final';

        const finalData = state.gameData.final;
        scorer.loadAnswers(finalData.answers);

        channel.send('START_FINAL', {
            category: finalData.category,
            question: finalData.question,
            teamName: state.teams[finalist].name,
        });

        showPanel('final');
        $('finalInfo').innerHTML = `
            <strong>${esc(state.teams[finalist].name)}</strong> plays the final!<br>
            <em>${esc(finalData.category)}</em>: ${esc(finalData.question)}<br>
            Give 3 answers. A pointless answer wins the trophy round!
        `;
        MathText.typeset($('finalInfo'));
        $('finalAnswerLabel').textContent = 'Answer 1 of 3';
        $('finalAnswerInput').value = '';
        $('finalAnswerInput').disabled = false;
        $('submitFinalBtn').disabled = false;
        hideFinalResult();
        hide($('finalWrongControls'));

        renderFinalAnswerReference();
    });

    // ── Final round answer submission ───────────────────────
    $('submitFinalBtn').addEventListener('click', submitFinalAnswer);
    $('finalAnswerInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitFinalAnswer();
    });

    function submitFinalAnswer() {
        if (state.waitingForAnimation) return;

        const input = $('finalAnswerInput').value.trim();
        if (!input) return;

        const result = scorer.match(input);

        if (result.matched && result.claimed) {
            showFinalResult('claimed',
                `<strong>"${esc(result.original)}"</strong> already given!`);
            $('finalAnswerInput').value = '';
            return;
        }

        if (result.matched) {
            showFinalResult('matched',
                `<strong>"${esc(result.original)}"</strong><br><span class="result-score">${result.score}</span>`);
            $('finalAnswerInput').disabled = true;
            $('submitFinalBtn').disabled = true;
            hide($('finalWrongControls'));

            scorer.claim(result.original);
            revealFinalAnswer(result.original, result.score);
        } else {
            showFinalResult('no-match', `<strong>"${esc(input)}"</strong> — No match.`);
            show($('finalWrongControls'));
            $('finalAnswerInput').disabled = true;
            $('submitFinalBtn').disabled = true;
        }
    }

    $('finalMarkWrongBtn').addEventListener('click', () => {
        const input = $('finalAnswerInput').value.trim();
        revealFinalAnswer(input || 'Wrong', 100);
        hide($('finalWrongControls'));
    });

    $('finalOverrideBtn').addEventListener('click', () => {
        const score = parseInt($('finalOverrideScore').value);
        if (isNaN(score) || score < 0 || score > 100) return;
        const input = $('finalAnswerInput').value.trim();
        revealFinalAnswer(input, score);
        hide($('finalWrongControls'));
        $('finalOverrideScore').value = '';
    });

    function revealFinalAnswer(answer, score) {
        state.finalScores.push(score);
        state.waitingForAnimation = true;

        channel.send('REVEAL_FINAL_ANSWER', {
            index: state.finalAnswerCount,
            answer,
            score,
        });

        state.finalAnswerCount++;
        renderFinalAnswerReference();
    }

    function advanceAfterFinalAnswer() {
        if (state.finalAnswerCount >= 3) {
            // All 3 answers given
            const total = state.finalScores.reduce((a, b) => a + b, 0);
            const hasPointless = state.finalScores.includes(0);

            channel.send('SHOW_FINAL_TOTAL', { total, hasPointless });

            state.phase = 'scoreboard';
            showPanel('scoreboard');
            renderControllerScoreboard();

            hide($('nextRoundBtn'));
            hide($('startHeadToHeadBtn'));
            hide($('startFinalBtn'));
            show($('showWinnerBtn'));

            $('controllerScoreboard').innerHTML += `
                <div style="margin-top:16px; padding:12px; background:var(--bg-input); border-radius:var(--radius); text-align:center;">
                    <strong>Final Round Total: ${total}</strong>
                    ${hasPointless ? '<br><span style="color:var(--warning)">POINTLESS answer achieved!</span>' : ''}
                </div>
            `;
        } else {
            $('finalAnswerLabel').textContent = `Answer ${state.finalAnswerCount + 1} of 3`;
            $('finalAnswerInput').value = '';
            $('finalAnswerInput').disabled = false;
            $('submitFinalBtn').disabled = false;
            hideFinalResult();
            hide($('finalWrongControls'));
            $('finalAnswerInput').focus();
        }
    }

    function hideFinalResult() {
        const el = $('finalResult');
        el.className = 'answer-result';
        el.style.display = 'none';
    }

    function showFinalResult(type, html) {
        const el = $('finalResult');
        el.className = `answer-result ${type}`;
        el.style.display = 'block';
        el.innerHTML = html;
        MathText.typeset(el);
    }

    // ── Show Winner ─────────────────────────────────────────
    $('showWinnerBtn').addEventListener('click', () => {
        const winner = state.teams[state.finalTeamIndex];
        channel.send('SHOW_WINNER', { teamName: winner.name });
        state.phase = 'finished';
    });

    // ── Answer Reference panel ──────────────────────────────
    function renderAnswerReference() {
        const answers = scorer.getAll();
        $('answerList').innerHTML = answers.map(a => `
            <div class="answer-list-item${a.claimed ? ' claimed' : ''}">
                <span class="ali-answer">${esc(a.answer)}</span>
                <span class="ali-score">${a.score}</span>
            </div>
        `).join('');
        MathText.typeset($('answerList'));
    }

    function renderFinalAnswerReference() {
        const answers = scorer.getAll();
        $('finalAnswerList').innerHTML = answers.map(a => `
            <div class="answer-list-item${a.claimed ? ' claimed' : ''}">
                <span class="ali-answer">${esc(a.answer)}</span>
                <span class="ali-score">${a.score}</span>
            </div>
        `).join('');
        MathText.typeset($('finalAnswerList'));
    }

    // ── Sidebar: Score overrides ────────────────────────────
    function updateSidebar() {
        const teamColors = ['var(--team-0)', 'var(--team-1)', 'var(--team-2)', 'var(--team-3)'];

        $('scoreOverrides').innerHTML = state.teams.map((t, i) => `
            <div class="override-team" style="--team-color: ${teamColors[i]}; ${t.eliminated ? 'opacity:0.4' : ''}">
                <div class="override-team-header">
                    <span class="override-team-name">${esc(t.name)}</span>
                    <span class="override-team-score">${t.score}</span>
                </div>
                <div class="override-team-controls">
                    <button onclick="adjustScore(${i}, -10)">-10</button>
                    <button onclick="adjustScore(${i}, -1)">-1</button>
                    <button onclick="adjustScore(${i}, 1)">+1</button>
                    <button onclick="adjustScore(${i}, 10)">+10</button>
                </div>
            </div>
        `).join('');

        $('undoBtn').disabled = state.history.length === 0;
    }

    // Expose to inline onclick handlers
    window.adjustScore = function (teamIndex, delta) {
        pushHistory('adjust', { teamIndex, delta });
        state.teams[teamIndex].score = Math.max(0, state.teams[teamIndex].score + delta);
        updateSidebar();
        channel.send('UPDATE_SCORES', { teams: state.teams });
    };

    // ── History / Undo ──────────────────────────────────────
    function pushHistory(action, data) {
        state.history.push({
            action,
            data,
            scores: state.teams.map(t => t.score),
        });
        if ($('undoBtn')) $('undoBtn').disabled = false;
    }

    $('undoBtn').addEventListener('click', () => {
        if (state.history.length === 0) return;
        const snapshot = state.history.pop();
        snapshot.scores.forEach((s, i) => { state.teams[i].score = s; });
        updateSidebar();
        channel.send('UPDATE_SCORES', { teams: state.teams });
    });

    // ── Reset Game ──────────────────────────────────────────
    $('resetBtn').addEventListener('click', () => {
        if (!confirm('Reset the entire game? All progress will be lost.')) return;

        state.phase = 'setup';
        state.gameData = null;
        state.currentRound = 0;
        state.currentQuestionIndex = 0;
        state.history = [];
        state.teams.forEach(t => { t.score = 0; t.eliminated = false; });

        customAI.reset();
        customImport.reset();
        refreshSampleSelect(parseInt($('sampleSelect').value, 10) || 0);

        channel.send('RESET_GAME', {});
        showPanel('setup');
        hide($('sidebar'));
    });

    // ── Init ────────────────────────────────────────────────
    showPanel('setup');
    refreshSampleSelect(0);

})();
