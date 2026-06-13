/**
 * Score bar animation and audio engine for the Pointless display tab.
 */

/* ── Audio Engine (Web Audio API) ─────────────────────────────── */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _osc(freq, type, gainVal, start, duration) {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(gainVal, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
    }

    /** Short tick — pitch rises as score drops. */
    tick(score) {
        if (!this.ctx || !this.enabled) return;
        const freq = 300 + (100 - score) * 8;
        this._osc(freq, 'sine', 0.06, this.ctx.currentTime, 0.04);
    }

    /** Score lock-in ding. */
    lockIn() {
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc(880, 'sine', 0.12, t, 0.15);
        this._osc(1320, 'sine', 0.08, t + 0.08, 0.15);
    }

    /** Triumphant pointless fanfare — ascending C major arpeggio. */
    pointless() {
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            this._osc(freq, 'sine', 0.15, t + i * 0.12, 0.4);
            this._osc(freq * 1.005, 'triangle', 0.08, t + i * 0.12, 0.45);
        });
    }

    /** Low buzz for wrong answer. */
    wrong() {
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc(120, 'sawtooth', 0.1, t, 0.45);
        this._osc(117, 'sawtooth', 0.08, t, 0.45);
    }
}

/* ── Celebration Particles ────────────────────────────────────── */

class CelebrationEffect {
    constructor(overlay) {
        this.overlay = overlay;
        this.particles = [];
        this.running = false;
    }

    burst(x, y, count = 60) {
        this.overlay.innerHTML = '';
        this.overlay.classList.add('active');

        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'particle';

            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const velocity = 200 + Math.random() * 400;
            const size = 4 + Math.random() * 8;
            const hue = Math.random() > 0.5 ? 45 + Math.random() * 15 : 190 + Math.random() * 30;

            el.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${x}px; top: ${y}px;
                background: hsl(${hue}, 90%, 60%);
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            `;

            this.overlay.appendChild(el);
            this.particles.push({ el, x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity - 200, life: 1 });
        }

        this.running = true;
        this._animate(performance.now());
    }

    _animate(startTime) {
        const tick = (now) => {
            const dt = Math.min((now - startTime) / 1000, 0.05);
            startTime = now;
            let alive = false;

            for (const p of this.particles) {
                if (p.life <= 0) continue;
                alive = true;
                p.vy += 600 * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 0.6;
                p.el.style.transform = `translate(${p.x - parseFloat(p.el.style.left)}px, ${p.y - parseFloat(p.el.style.top)}px)`;
                p.el.style.opacity = Math.max(0, p.life);
            }

            if (alive && this.running) {
                requestAnimationFrame(tick);
            } else {
                this.clear();
            }
        };
        requestAnimationFrame(tick);
    }

    clear() {
        this.running = false;
        this.particles = [];
        this.overlay.classList.remove('active');
        this.overlay.innerHTML = '';
    }
}

/* ── Score Bar Animation ──────────────────────────────────────── */

class ScoreBarAnimation {
    constructor({ track, fill, counter, answerEl, container, overlay }) {
        this.track = track;
        this.fill = fill;
        this.counter = counter;
        this.answerEl = answerEl;
        this.container = container;
        this.animating = false;
        this.audio = new AudioEngine();
        this.celebration = new CelebrationEffect(overlay);
        this.lastTickScore = 100;
    }

    initAudio() {
        this.audio.init();
    }

    /**
     * Interpolate colour across the score range.
     * Red (100) → Orange (75) → Yellow (50) → Green (25) → Cyan (0)
     */
    getColor(score) {
        const stops = [
            { s: 100, r: 239, g: 68, b: 68 },
            { s: 75, r: 249, g: 115, b: 22 },
            { s: 50, r: 234, g: 179, b: 8 },
            { s: 25, r: 34, g: 197, b: 94 },
            { s: 0, r: 0, g: 200, b: 255 },
        ];

        for (let i = 0; i < stops.length - 1; i++) {
            const a = stops[i], b = stops[i + 1];
            if (score <= a.s && score >= b.s) {
                const t = a.s === b.s ? 0 : (a.s - score) / (a.s - b.s);
                return {
                    r: Math.round(a.r + (b.r - a.r) * t),
                    g: Math.round(a.g + (b.g - a.g) * t),
                    b: Math.round(a.b + (b.b - a.b) * t),
                };
            }
        }
        return stops[stops.length - 1];
    }

    /**
     * Dramatic easing: fast initial drop, tense slowdown near target.
     */
    ease(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    /**
     * Run the score bar countdown animation.
     * @param {number} targetScore - Final score (0–100)
     * @param {string} answer - Answer text to display at end
     * @param {function} onComplete - Called when animation + display pause finishes
     */
    run(targetScore, answer, onComplete) {
        if (this.animating) {
            // Cancel any in-progress animation
            this._cancelId && cancelAnimationFrame(this._cancelId);
        }
        this.audio.resume();
        this.animating = true;
        this._cancelId = null;
        this.lastTickScore = 100;

        // Reset visuals
        this.container.classList.remove('pointless', 'revealed');
        this.container.classList.add('active');
        this.fill.style.height = '100%';
        this.counter.textContent = '100';
        this.answerEl.textContent = '';
        this.answerEl.classList.remove('visible');

        const duration = 2500 + (100 - targetScore) * 25;
        const start = performance.now();

        const frame = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.ease(progress);
            const currentScore = Math.round(100 - (100 - targetScore) * eased);

            // Update bar
            this.fill.style.height = `${currentScore}%`;

            // Update colour
            const c = this.getColor(currentScore);
            this.fill.style.background = `linear-gradient(to top, rgb(${c.r},${c.g},${c.b}), rgba(${c.r},${c.g},${c.b},0.7))`;
            this.fill.style.boxShadow = `0 0 30px rgba(${c.r},${c.g},${c.b},0.5), inset 0 0 20px rgba(255,255,255,0.1)`;

            // Update counter
            this.counter.textContent = currentScore;

            // Ticks (every 3 points)
            if (currentScore < this.lastTickScore - 2) {
                this.audio.tick(currentScore);
                this.lastTickScore = currentScore;
            }

            if (progress < 1) {
                this._cancelId = requestAnimationFrame(frame);
            } else {
                this._complete(targetScore, answer, onComplete);
            }
        };

        requestAnimationFrame(frame);
    }

    _complete(targetScore, answer, onComplete) {
        this.animating = false;
        this.counter.textContent = targetScore;
        MathText.render(this.answerEl, answer);
        this.answerEl.classList.add('visible');
        this.container.classList.add('revealed');

        if (targetScore === 0) {
            this.container.classList.add('pointless');
            this.audio.pointless();

            // Fire celebration at the bar's position
            const rect = this.track.getBoundingClientRect();
            this.celebration.burst(
                rect.left + rect.width / 2,
                rect.top + rect.height * 0.3,
                80
            );
        } else if (targetScore === 100) {
            this.audio.wrong();
        } else {
            this.audio.lockIn();
        }

        if (onComplete) {
            setTimeout(() => onComplete(), targetScore === 0 ? 3000 : 1500);
        }
    }

    /** Reset bar to idle state. */
    reset() {
        this.container.classList.remove('active', 'pointless', 'revealed');
        this.fill.style.height = '0%';
        this.fill.style.background = '';
        this.fill.style.boxShadow = '';
        this.counter.textContent = '\u2014';
        this.answerEl.textContent = '';
        this.answerEl.classList.remove('visible');
        this.celebration.clear();
    }
}

/* ── Utility: Animated score counter for team panels ──────────── */

function animateScoreCounter(element, from, to, duration = 600) {
    const start = performance.now();
    const frame = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        element.textContent = Math.round(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}
