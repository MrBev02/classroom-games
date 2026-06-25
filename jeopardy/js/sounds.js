// =====================================================
// Jeopardy — Sounds
//
// Played from the HOST tab. The host laptop is the same
// machine driving the projector, so the class hears it
// through the room speakers — and because the host is
// clicking buttons, browser autoplay rules are satisfied.
//
// Think music: the host can upload their own track on the
// setup screen (kept in the browser via IndexedDB so it
// survives a refresh / resume), or drop an MP3 at
// sounds/think.mp3. With neither, a built-in synthesised
// "thinking clock" loop runs ~30 seconds like the real thing.
// (The real "Think!" jingle is copyrighted, so nothing is
// bundled — bring your own.)
// =====================================================

// Tiny IndexedDB wrapper to persist an uploaded think track. Object URLs
// don't survive a page reload and audio files are too big for localStorage,
// so the raw Blob is stored here under a single key.
const ThinkStore = {
  _db: null,
  _open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open("jeopardy-media", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onsuccess = () => resolve((this._db = req.result));
      req.onerror = () => reject(req.error);
    });
  },
  async save(blob, name) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put({ blob, name }, "think");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async load() {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get("think");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  async clear() {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").delete("think");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

class SoundManager {
  constructor() {
    // Storage may be disabled/private — default to on rather than crash.
    try { this.enabled = localStorage.getItem("jeopardy-sound") !== "off"; }
    catch { this.enabled = true; }
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

    // A track the host uploaded on the setup screen overrides think.mp3.
    this.hasCustomThink = false;
    this.customThinkName = null;
    this._customUrl = null;

    this._tickTimer = null;
    this._tickCount = 0;
  }

  setEnabled(on) {
    this.enabled = on;
    try { localStorage.setItem("jeopardy-sound", on ? "on" : "off"); } catch {}
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

  // ---------------------
  // Custom uploaded think track
  // ---------------------

  /**
   * Use an uploaded audio File/Blob as the think track. Resolves once the
   * file is confirmed playable (and, unless persist:false, saved for next
   * time); rejects if the browser can't decode it. Pass persist:false when
   * re-applying a track that's already stored.
   */
  setCustomThink(blob, name, { persist = true } = {}) {
    return new Promise((resolve, reject) => {
      this.stopThink();
      if (this._customUrl) URL.revokeObjectURL(this._customUrl);
      this._customUrl = URL.createObjectURL(blob);

      const audio = this.thinkAudio;
      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", onOk);
        audio.removeEventListener("error", onErr);
      };
      const onOk = () => {
        cleanup();
        this.thinkFileBroken = false;
        this.hasCustomThink = true;
        this.customThinkName = name || "your track";
        if (persist) {
          ThinkStore.save(blob, this.customThinkName).catch((e) =>
            console.warn("Could not save think track for next time:", e)
          );
        }
        resolve();
      };
      const onErr = () => {
        cleanup();
        reject(new Error("Could not decode the uploaded audio file"));
      };
      audio.addEventListener("loadedmetadata", onOk);
      audio.addEventListener("error", onErr);
      audio.src = this._customUrl;
      audio.load();
    });
  }

  /** Forget the uploaded track and go back to sounds/think.mp3 (or the loop). */
  clearCustomThink() {
    this.stopThink();
    if (this._customUrl) {
      URL.revokeObjectURL(this._customUrl);
      this._customUrl = null;
    }
    this.hasCustomThink = false;
    this.customThinkName = null;
    this.thinkFileBroken = false;
    this.thinkAudio.src = "sounds/think.mp3";
    this.thinkAudio.load();
    ThinkStore.clear().catch(() => {});
  }

  /** On startup, re-apply a previously uploaded track if there is one. */
  async restoreCustomThink() {
    let saved;
    try {
      saved = await ThinkStore.load();
    } catch (e) {
      console.warn("Could not read saved think track:", e);
      return false;
    }
    if (!saved || !saved.blob) return false;
    try {
      await this.setCustomThink(saved.blob, saved.name, { persist: false });
      return true;
    } catch {
      ThinkStore.clear().catch(() => {});
      return false;
    }
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
