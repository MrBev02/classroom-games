/* =====================================================
   ROULETTE: SESSION LIFECYCLE
   =====================================================

   This file decides if the activity is open or locked. It uses only the
   data on this device. It does not use a network connection. Thus the
   system operates when the device of the student cannot connect to the
   device of the teacher.

   The session locks if one or more of these conditions is true:

     1. The time is after the expiry time of the key.
     2. The time after the first unlock operation is more than
        `durationMin`. This condition prevents use at a break.
     3. The clock of the device moved to an earlier time. The program
        makes the key invalid immediately.
     4. The key is in the list of invalid keys on this device. The key
        expired, or the teacher used the stop code.

   A lock operation does not remove the work of the student. A student
   who is locked out at the end of a lesson finds their answers in the
   next lesson.
   ===================================================== */

const SESSION_KEY = "roulette-session";
const BURNT_KEY = "roulette-burnt-keys";
const LAST_LOCK_KEY = "roulette-last-lock";
const BURNT_LIMIT = 50;
const HEARTBEAT_MS = 15000;
const CLOCK_SLACK_MS = 120000;   // The permitted backwards movement of the clock.

const Session = (function () {
  let heartbeat = null;
  let pageStart = { wall: Date.now(), mono: nowMono() };

  function nowMono() {
    return typeof performance !== "undefined" && performance.now
      ? performance.now() : Date.now();
  }

  function burntList() {
    const list = Store.get(BURNT_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function isBurnt(canonical) {
    return burntList().some((e) => e && e.canonical === canonical);
  }

  function burn(reason) {
    const s = Store.get(SESSION_KEY);
    if (s && s.canonical) {
      const list = burntList().filter((e) => e && e.canonical !== s.canonical);
      list.push({ canonical: s.canonical, burntAt: Date.now(), reason: reason || "ended" });
      // Limit the length of the list. Remove the oldest item first.
      Store.set(BURNT_KEY, list.slice(-BURNT_LIMIT));
    }
    // Record the reason. The page then shows the reason to the student.
    // Without the reason, the page shows an empty code box.
    Store.set(LAST_LOCK_KEY, { reason: reason || "ended", at: Date.now() });
    Store.remove(SESSION_KEY);
    stopHeartbeat();
    return { state: "locked", reason: reason || "ended" };
  }

  /**
   * This function opens a session with the code that the student typed.
   * @returns {ok:true, moduleIds, remainingMs} or {ok:false, reason}
   *   The reason is FORMAT, CHECKSUM, VERSION, EXPIRED, BURNT or
   *   NO_MODULES.
   */
  function unlock(str) {
    const d = RouletteKey.decode(str);
    if (!d.ok) return { ok: false, reason: d.reason };
    if (isBurnt(d.canonical)) return { ok: false, reason: "BURNT" };
    if (Date.now() > d.expiresAt) return { ok: false, reason: "EXPIRED" };
    if (!d.moduleIds.length) return { ok: false, reason: "NO_MODULES" };

    const now = Date.now();
    Store.remove(LAST_LOCK_KEY);
    Store.set(SESSION_KEY, {
      canonical: d.canonical,
      ver: d.ver,
      expiresAt: d.expiresAt,
      durationMin: d.durationMin,
      moduleIds: d.moduleIds,
      nonce: d.nonce,
      firstUnlockAt: now,
      lastSeenAt: now,
    });
    pageStart = { wall: now, mono: nowMono() };
    startHeartbeat();
    return { ok: true, moduleIds: d.moduleIds, remainingMs: remaining(Store.get(SESSION_KEY)) };
  }

  /** The time in milliseconds before the session ends. The function uses
      the limit that occurs first. */
  function remaining(s) {
    if (!s) return 0;
    const byExpiry = s.expiresAt - Date.now();
    if (!s.durationMin) return Math.max(0, byExpiry);
    const byDuration = s.firstUnlockAt + s.durationMin * 60000 - Date.now();
    return Math.max(0, Math.min(byExpiry, byDuration));
  }

  /**
   * This function gives the current state. You can call it frequently.
   * @returns {state:"open"|"locked"|"none", reason?, remainingMs, moduleIds}
   */
  function check() {
    if (!ROULETTE_CONFIG.REQUIRE_SESSION_KEY) {
      return { state: "open", remainingMs: Infinity, moduleIds: MODULE_ORDER.slice(), ungated: true };
    }

    const s = Store.get(SESSION_KEY);
    if (!s || !s.canonical) {
      // There is no session. If the last session ended for a known
      // reason, the page shows the lock panel. The panel stays on the
      // screen until the student closes it.
      const last = Store.get(LAST_LOCK_KEY);
      if (last && last.reason) {
        return { state: "locked", reason: last.reason, remainingMs: 0, moduleIds: [] };
      }
      return { state: "none", remainingMs: 0, moduleIds: [] };
    }
    if (isBurnt(s.canonical)) return burnAndReport("BURNT");

    const now = Date.now();

    // Test if the clock moved to an earlier time. The function compares
    // the clock with the last recorded time. It also compares the clock
    // with the timer of the page. Thus the function finds a change while
    // the page is open. It does not wait for the next page load.
    const elapsedMono = nowMono() - pageStart.mono;
    const expectedWall = pageStart.wall + elapsedMono;
    if (now < s.lastSeenAt - CLOCK_SLACK_MS || now < expectedWall - CLOCK_SLACK_MS) {
      return burnAndReport("CLOCK");
    }

    if (now > s.expiresAt) return burnAndReport("EXPIRED");
    if (s.durationMin && now - s.firstUnlockAt > s.durationMin * 60000) {
      return burnAndReport("ELAPSED");
    }

    return { state: "open", remainingMs: remaining(s), moduleIds: s.moduleIds, session: s };
  }

  function burnAndReport(reason) {
    burn(reason);
    return { state: "locked", reason: reason, remainingMs: 0, moduleIds: [] };
  }

  /**
   * The student read the lock message. The student can now type a new
   * code. This function removes only the message. It does not change the
   * list of invalid keys. It does not remove the work of the student.
   */
  function dismissLock() {
    Store.remove(LAST_LOCK_KEY);
  }

  /** The teacher read the stop code to the class. This function ends the
      session on this device. */
  function applyStopCode(typed) {
    const s = Store.get(SESSION_KEY);
    if (!s || !s.canonical) return false;
    const wanted = RouletteKey.stopCode(s.canonical);
    if (String(typed).replace(/[^0-9]/g, "") !== wanted) return false;
    burn("STOPPED");
    return true;
  }

  function touch() {
    const s = Store.get(SESSION_KEY);
    if (!s) return;
    s.lastSeenAt = Date.now();
    Store.set(SESSION_KEY, s);
  }

  function startHeartbeat(onLock) {
    stopHeartbeat();
    heartbeat = setInterval(function () {
      const st = check();
      if (st.state === "open") touch();
      else if (onLock) onLock(st);
    }, HEARTBEAT_MS);
    if (typeof document !== "undefined" && document.addEventListener) {
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
          const st = check();
          if (st.state === "open") touch();
          else if (onLock) onLock(st);
        }
      });
    }
  }

  function stopHeartbeat() {
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
  }

  /** The reason in words. The lock panel shows this text. */
  function explain(reason) {
    return {
      FORMAT: "A code has 15 letters and numbers. Check what you typed.",
      CHECKSUM: "That code is not valid. Check each character and try again.",
      VERSION: "That code is from an older version. Ask your teacher for a new code.",
      EXPIRED: "That code has expired. Ask your teacher for a new code.",
      BURNT: "That code has already been used. Ask your teacher for a new code.",
      NO_MODULES: "That code does not open any activities. Ask your teacher.",
      ELAPSED: "Your session time has finished.",
      CLOCK: "The clock on this device changed. The session has ended.",
      STOPPED: "Your teacher ended the session.",
      ended: "This session has finished.",
    }[reason] || "This session has finished.";
  }

  return {
    unlock: unlock,
    check: check,
    burn: burn,
    dismissLock: dismissLock,
    applyStopCode: applyStopCode,
    startHeartbeat: startHeartbeat,
    stopHeartbeat: stopHeartbeat,
    remaining: remaining,
    explain: explain,
    isBurnt: isBurnt,
  };
})();
