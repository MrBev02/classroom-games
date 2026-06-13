/**
 * Pointless — Display tab logic.
 * Purely reactive: listens for messages from the controller and renders state.
 */

(function () {
    'use strict';

    const channel = new GameChannel();

    // ── DOM refs ────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

    const views = {
        waiting: $('viewWaiting'),
        question: $('viewQuestion'),
        scoreboard: $('viewScoreboard'),
        final: $('viewFinal'),
        winner: $('viewWinner'),
    };

    const dom = {
        roundInfo: $('roundInfo'),
        categoryText: $('categoryText'),
        questionText: $('questionText'),
        scoreBarContainer: $('scoreBarContainer'),
        scoreBarTrack: $('scoreBarTrack'),
        scoreBarFill: $('scoreBarFill'),
        counterValue: $('counterValue'),
        scoreAnswer: $('scoreAnswer'),
        scoreboardTeams: $('scoreboardTeams'),
        pointlessLabel: $('pointlessLabel'),
        finalCategory: $('finalCategory'),
        finalQuestion: $('finalQuestion'),
        finalAnswers: $('finalAnswers'),
        finalTotal: $('finalTotal'),
        winnerName: $('winnerName'),
        celebrationOverlay: $('celebrationOverlay'),
    };

    // ── Score bar animation instance ────────────────────────
    const scoreBar = new ScoreBarAnimation({
        track: dom.scoreBarTrack,
        fill: dom.scoreBarFill,
        counter: dom.counterValue,
        answerEl: dom.scoreAnswer,
        container: dom.scoreBarContainer,
        overlay: dom.celebrationOverlay,
    });

    // ── State ───────────────────────────────────────────────
    let teams = [];
    let audioInitialised = false;

    // ── View management ─────────────────────────────────────
    function showView(name) {
        Object.entries(views).forEach(([key, el]) => {
            el.classList.toggle('active', key === name);
        });
    }

    // ── Team display ────────────────────────────────────────
    function updateTeamNames(teamData) {
        teams = teamData;
        teamData.forEach((t, i) => {
            const nameEl = $(`teamName${i}`);
            const scoreEl = $(`teamScore${i}`);
            if (nameEl) nameEl.textContent = t.name;
            if (scoreEl) scoreEl.textContent = t.score;
        });
    }

    function updateTeamScore(teamIndex, newScore) {
        const scoreEl = $(`teamScore${teamIndex}`);
        if (!scoreEl) return;
        const oldScore = parseInt(scoreEl.textContent) || 0;
        animateScoreCounter(scoreEl, oldScore, newScore);
        if (teams[teamIndex]) teams[teamIndex].score = newScore;
    }

    function setActiveTeam(teamIndex) {
        document.querySelectorAll('.team-panel').forEach(panel => {
            panel.classList.toggle('active',
                parseInt(panel.dataset.team) === teamIndex);
        });
    }

    function clearActiveTeam() {
        document.querySelectorAll('.team-panel').forEach(p => p.classList.remove('active'));
    }

    function eliminateTeam(teamIndex) {
        const panel = document.querySelector(`.team-panel[data-team="${teamIndex}"]`);
        if (panel) panel.classList.add('eliminated');
        if (teams[teamIndex]) teams[teamIndex].eliminated = true;
    }

    // ── Scoreboard rendering ────────────────────────────────
    function renderScoreboard(teamData) {
        const sorted = teamData
            .map((t, i) => ({ ...t, index: i }))
            .sort((a, b) => a.score - b.score);

        const teamColors = ['var(--team-0)', 'var(--team-1)', 'var(--team-2)', 'var(--team-3)'];

        dom.scoreboardTeams.innerHTML = sorted.map((t, rank) => `
            <div class="scoreboard-row${t.eliminated ? ' eliminated' : ''}"
                 style="--row-color: ${teamColors[t.index]}; animation-delay: ${rank * 0.12}s">
                <div class="scoreboard-rank">${rank + 1}</div>
                <div class="scoreboard-name">${esc(t.name)}</div>
                <div class="scoreboard-score">${t.score}</div>
            </div>
        `).join('');
    }

    // ── Final round rendering ───────────────────────────────
    let finalSlots = [];

    function initFinalView(category, question) {
        MathText.render(dom.finalCategory, category);
        MathText.render(dom.finalQuestion, question);
        dom.finalAnswers.innerHTML = '';
        dom.finalTotal.textContent = '';
        finalSlots = [];

        for (let i = 0; i < 3; i++) {
            const slot = document.createElement('div');
            slot.className = 'final-answer-slot';
            slot.innerHTML = `
                <div class="final-answer-bar"><div class="final-answer-fill" id="finalFill${i}"></div></div>
                <div class="final-answer-text" id="finalText${i}">?</div>
                <div class="final-answer-score" id="finalScore${i}">&mdash;</div>
            `;
            dom.finalAnswers.appendChild(slot);
            finalSlots.push(slot);
        }
    }

    function revealFinalAnswer(index, answer, score) {
        const fill = $(`finalFill${index}`);
        const text = $(`finalText${index}`);
        const scoreEl = $(`finalScore${index}`);

        if (fill) {
            fill.style.height = `${score}%`;
            const c = scoreBar.getColor(score);
            fill.style.background = `rgb(${c.r},${c.g},${c.b})`;
            fill.style.transition = 'height 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        if (text) MathText.render(text, answer);
        if (scoreEl) scoreEl.textContent = score;
    }

    function showFinalTotal(total, hasPointless) {
        dom.finalTotal.textContent = hasPointless
            ? `POINTLESS! Total: ${total}`
            : `Total: ${total}`;
        if (hasPointless) {
            dom.finalTotal.style.animation = 'pointlessPulse 1s ease-in-out infinite';
        }
    }

    // ── Ensure audio is initialised on first user interaction ──
    function ensureAudio() {
        if (!audioInitialised) {
            scoreBar.initAudio();
            audioInitialised = true;
        }
    }
    document.addEventListener('click', ensureAudio, { once: true });
    document.addEventListener('keydown', ensureAudio, { once: true });

    // ── Channel event handlers ──────────────────────────────

    channel.on('LOAD_GAME', (payload) => {
        updateTeamNames(payload.teams);
        dom.roundInfo.textContent = '';
        showView('waiting');
        // Remove any eliminations
        document.querySelectorAll('.team-panel').forEach(p => p.classList.remove('eliminated'));
    });

    channel.on('START_ROUND', (payload) => {
        const { roundNumber, totalRounds } = payload;
        dom.roundInfo.textContent = `Round ${roundNumber} of ${totalRounds}`;
        scoreBar.reset();
        clearActiveTeam();
    });

    channel.on('SHOW_QUESTION', (payload) => {
        const { category, question } = payload;
        MathText.render(dom.categoryText, category);
        MathText.render(dom.questionText, question);
        scoreBar.reset();
        dom.pointlessLabel.classList.remove('show');
        showView('question');
    });

    channel.on('SET_ACTIVE_TEAM', (payload) => {
        setActiveTeam(payload.teamIndex);
    });

    channel.on('REVEAL_ANSWER', (payload) => {
        const { answer, score, teamIndex, newTotal } = payload;
        ensureAudio();
        scoreBar.run(score, answer, () => {
            // Update team score
            if (typeof newTotal === 'number') {
                updateTeamScore(teamIndex, newTotal);
            }
            // Pointless label
            if (score === 0) {
                dom.pointlessLabel.classList.add('show');
            }
            channel.send('ANIMATION_COMPLETE', { eventType: 'REVEAL_ANSWER' });
        });
    });

    channel.on('SHOW_SCOREBOARD', (payload) => {
        renderScoreboard(payload.teams);
        clearActiveTeam();
        showView('scoreboard');
    });

    channel.on('ELIMINATE_TEAM', (payload) => {
        eliminateTeam(payload.teamIndex);
    });

    channel.on('START_FINAL', (payload) => {
        const { category, question, teamName } = payload;
        dom.roundInfo.textContent = 'THE FINAL';
        initFinalView(category, question);
        showView('final');
    });

    channel.on('REVEAL_FINAL_ANSWER', (payload) => {
        const { index, answer, score } = payload;
        ensureAudio();

        // Use the main score bar for the final too
        scoreBar.run(score, answer, () => {
            revealFinalAnswer(index, answer, score);
            channel.send('ANIMATION_COMPLETE', { eventType: 'REVEAL_FINAL_ANSWER' });
        });
    });

    channel.on('SHOW_FINAL_TOTAL', (payload) => {
        showFinalTotal(payload.total, payload.hasPointless);
    });

    channel.on('SHOW_WINNER', (payload) => {
        dom.winnerName.textContent = payload.teamName;
        showView('winner');
        // Celebration burst
        const rect = dom.winnerName.getBoundingClientRect();
        const celebration = new CelebrationEffect(dom.celebrationOverlay);
        celebration.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 100);
    });

    channel.on('RESET_GAME', () => {
        teams = [];
        document.querySelectorAll('.team-panel').forEach(p => {
            p.classList.remove('active', 'eliminated');
        });
        for (let i = 0; i < 4; i++) {
            const scoreEl = $(`teamScore${i}`);
            const nameEl = $(`teamName${i}`);
            const roundEl = $(`teamRound${i}`);
            if (scoreEl) scoreEl.textContent = '0';
            if (nameEl) nameEl.textContent = `Team ${i + 1}`;
            if (roundEl) roundEl.textContent = '';
        }
        dom.roundInfo.textContent = '';
        scoreBar.reset();
        dom.pointlessLabel.classList.remove('show');
        showView('waiting');
    });

    channel.on('UPDATE_SCORES', (payload) => {
        payload.teams.forEach((t, i) => {
            updateTeamScore(i, t.score);
        });
    });

    // Heartbeat response
    channel.on('PING', () => {
        channel.send('PONG', {});
    });

    // ── Announce ready ──────────────────────────────────────
    channel.send('READY', {});

})();
