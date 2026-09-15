/* =====================================================
   ROULETTE: LIVE ROSTER, STUDENT SIDE
   =====================================================

   This file connects to the optional server in serve.js.

   THE RULE FOR THIS FILE

     Every failure is silent, and the activity continues.

   There is no server when the page comes from a file, from GitHub Pages,
   or from "python -m http.server". The page must work in each of those
   conditions. Thus each function in this file catches its own errors and
   gives a result that says "not connected". No function in this file is
   on the path that draws the page for the first time.
   ===================================================== */

const Live = (function () {
  let studentId = null;
  let timer = null;
  let onCommand = null;
  let getStatus = null;
  let connected = false;

  const PING_MS = 5000;
  const TIMEOUT_MS = 4000;

  /** fetch with a time limit. It never gives an error to the caller. */
  function ask(path, body) {
    const stop = new AbortController();
    const t = setTimeout(() => stop.abort(), TIMEOUT_MS);
    return fetch(path, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: stop.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .catch(() => null)
      .then((v) => { clearTimeout(t); return v; });
  }

  /**
   * Test for the server without joining.
   *
   * The roster route needs a token. Without one it gives 403. A 403 means
   * that the server is there. Any other result means that it is not.
   */
  function probe() {
    if (location.protocol === "file:") return Promise.resolve(false);
    const stop = new AbortController();
    const t = setTimeout(() => stop.abort(), TIMEOUT_MS);
    return fetch("api/roster", { signal: stop.signal })
      .then((r) => { clearTimeout(t); return r.status === 403; })
      .catch(() => { clearTimeout(t); return false; });
  }

  /** Join the class list. It gives {ok:false} if there is no server. */
  function join(name) {
    return ask("api/join", { name: name }).then((data) => {
      if (!data || !data.studentId) return { ok: false };
      studentId = data.studentId;
      connected = true;
      return { ok: true };
    });
  }

  function start(opts) {
    getStatus = opts.getStatus;
    onCommand = opts.onCommand;
    if (timer) clearInterval(timer);
    timer = setInterval(ping, PING_MS);
    ping();
  }

  function ping() {
    if (!studentId) return;
    ask("api/ping", { studentId: studentId, status: getStatus ? getStatus() : {} })
      .then((data) => {
        if (!data) { connected = false; return; }
        connected = true;
        // The server restarted and does not know this page. Join again.
        if (data.rejoin) { studentId = null; return; }
        (data.commands || []).forEach((c) => { if (onCommand) onCommand(c); });
      });
  }

  function stop() { if (timer) clearInterval(timer); timer = null; }

  return {
    probe: probe, join: join, start: start, stop: stop,
    get connected() { return connected; },
    get joined() { return !!studentId; },
  };
})();
