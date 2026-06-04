// =====================================================
// Jeopardy — Sounds
//
// Played from the HOST tab. The host laptop is the same
// machine driving the projector, so the class hears it
// through the room speakers — and because the host is
// clicking buttons, browser autoplay rules are satisfied.
//
// Think music: drop an MP3 at sounds/think.mp3 (source
// the Jeopardy "Think!" track yourself — it's copyrighted,
// so it isn't bundled). If the file is missing, a built-in
// synthesised "thinking clock" loop is used instead,
// running ~30 seconds like the real thing.
// =====================================================

class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem("jeopardy-sound") !== "off";
    this.ctx = null;
    this.thinkPlaying = false;
    this.onThinkEnd = null; // UI hook so the music button can reset

    // User-supplied think track (sounds/think.mp3). We try to play it
    // first and only fall back to the built-in loop if it fails/404s.
    this.thinkAudio = new Audio("sounds/think.mp3");
    this.thinkAudio.preload = "auto";
    this.thinkFileBroken = false;
    this.thinkAudio.addEventListener("error", () => (this.thinkFileBroken = true));
    this.thinkAudio.addEventListener("ended", () => this._thinkEnded());

    this._tickTimer = null;
    this._tickCount = 0;
  }

  setEnabled(on) {
    this.enabled = on;
    localStorage.setItem("jeopardy-sound", on ? "on" : "off");
    if (!on) this.stopThink();
  }

  _audioCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  // ---------------------
  // Think music
  // ---------------------

  /**
   * How long the think music will run, in seconds — the mp3's real
   * length if one is loaded, otherwise the 30-second built-in loop.
   * Used to drive the countdown on the display.
   */
  thinkDuration() {
    if (
      !this.thinkFileBroken &&
      isFinite(this.thinkAudio.duration) &&
      this.thinkAudio.duration > 0
    ) {
      return this.thinkAudio.duration;
    }
    return 30;
  }

  toggleThink() {
    if (this.thinkPlaying) {
      this.stopThink();
    } else {
      this.playThink();
    }
  }

  playThink() {
    if (!this.enabled || this.thinkPlaying) return;
    this.thinkPlaying = true;
    if (this.thinkFileBroken) {
      this._startTickLoop();
      return;
    }
    try {
      this.thinkAudio.currentTime = 0;
    } catch {
      /* no metadata yet — play() will start from 0 anyway */
    }
    const p = this.thinkAudio.play();
    if (p && p.catch) {
      p.catch((err) => {
        console.warn("think.mp3 could not play, using built-in loop:", err);
        if (this.thinkPlaying) this._startTickLoop();
      });
    }
  }

  stopThink() {
    this.thinkPlaying = false;
    this.thinkAudio.pause();
    if (this._tickTimer) {
      clearInterval(this._tickTimer);
      this._tickTimer = null;
    }
  }

  _thinkEnded() {
    this.thinkPlaying = false;
    if (this.onThinkEnd) this.onThinkEnd();
  }

  // Built-in fallback: a gentle "thinking clock" — two alternating
  // soft ticks every half-second, auto-stopping after ~30 seconds.
  _startTickLoop() {
    const ctx = this._audioCtx();
    this._tickCount = 0;

    const tick = () => {
      if (!this.thinkPlaying) return;
      if (++this._tickCount > 60) {
        // 60 ticks ≈ 30 seconds — time's up
        this.stopThink();
        this._timesUp();
        this._thinkEnded();
        return;
      }
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = this._tickCount % 2 ? 880 : 659; // tick... tock...
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    };

    tick();
    this._tickTimer = setInterval(tick, 500);
  }

  // Little two-note "time's up" flourish at the end of the tick loop
  _timesUp() {
    const ctx = this._audioCtx();
    const t0 = ctx.currentTime;
    [659, 523].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = t0 + i * 0.25;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  // ---------------------
  // One-shot effects
  // ---------------------

  /**
   * Plays the ding regardless of the mute setting and reports the
   * AudioContext state — wired to the "Test sound" button so problems
   * are easy to diagnose.
   */
  testSound() {
    const ctx = this._audioCtx();
    this.ding(true);
    return ctx.state;
  }

  /** Cheerful rising chime for a correct answer. */
  ding(force = false) {
    if (!this.enabled && !force) return;
    const ctx = this._audioCtx();
    const t0 = ctx.currentTime + 0.05;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const t = t0 + i * 0.07;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  }

  /** Low buzzer for a wrong answer. */
  buzz() {
    if (!this.enabled) return;
    const ctx = this._audioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.35);
    filter.type = "lowpass";
    filter.frequency.value = 500;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }
}
