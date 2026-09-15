/* =====================================================
   ROULETTE: STUDENT PROGRESS
   =====================================================

   This file keeps the work of the student. The data stays on the device
   of the student. It does not go to a different location.

   This data is separate from the session in js/session.js. A session ends
   at the end of a lesson. The work of the student does not end. A student
   who is locked out finds their answers in the next lesson.

   This file does not keep the result of each spin. A run of 10,000 spins
   becomes 37 counts and a short series. A list of 10,000 results uses too
   much space. The browser must also read that list at each page load.
   ===================================================== */

const PROGRESS_KEY = "roulette-progress-v1";
const PREFS_KEY = "roulette-prefs";

const Progress = (function () {
  function blank() {
    return {
      version: 1,
      studentLabel: "",       // Optional. The student types it one time. It stays on this device.
      modules: {},
      totals: { spins: 0, chipsStaked: 0, chipsReturned: 0 },
    };
  }

  function load() {
    const p = Store.get(PROGRESS_KEY);
    if (!p || p.version !== 1 || !p.modules) return blank();
    return p;
  }

  function save(p) {
    return Store.set(PROGRESS_KEY, p);
  }

  function moduleState(p, id) {
    if (!p.modules[id]) {
      p.modules[id] = {
        status: "not-started", stepIndex: 0, answers: {},
        startedAt: null, updatedAt: null, completedAt: null,
      };
    }
    return p.modules[id];
  }

  function start(p, id) {
    const m = moduleState(p, id);
    if (m.status === "not-started") { m.status = "in-progress"; m.startedAt = Date.now(); }
    m.updatedAt = Date.now();
    return m;
  }

  function setStep(p, id, index) {
    const m = start(p, id);
    m.stepIndex = index;
    m.updatedAt = Date.now();
  }

  function recordAnswer(p, id, questionId, result) {
    const m = start(p, id);
    const prior = m.answers[questionId];
    m.answers[questionId] = {
      response: result.response,
      correct: result.correct,
      attempts: (prior ? prior.attempts : 0) + 1,
      at: Date.now(),
    };
    m.updatedAt = Date.now();
  }

  function complete(p, id) {
    const m = start(p, id);
    m.status = "complete";
    m.completedAt = Date.now();
    m.updatedAt = Date.now();
  }

  /** The totals for all the modules. The debrief uses these values. */
  function addSpins(p, spins, staked, returned) {
    p.totals.spins += spins;
    p.totals.chipsStaked += staked || 0;
    p.totals.chipsReturned += returned || 0;
  }

  function resetModule(p, id) {
    delete p.modules[id];
  }

  function clearAll() {
    Store.remove(PROGRESS_KEY);
    return blank();
  }

  function summary(p, id) {
    const m = p.modules[id];
    if (!m || m.status === "not-started") return null;
    const ids = Object.keys(m.answers);
    return {
      status: m.status,
      stepIndex: m.stepIndex,
      answered: ids.length,
      correct: ids.filter((k) => m.answers[k].correct).length,
    };
  }

  /* ---- The preferences: the wheel, the motion setting and the name. ---- */
  function prefs() {
    return Store.get(PREFS_KEY, {}) || {};
  }
  function setPref(key, value) {
    const p = prefs();
    p[key] = value;
    Store.set(PREFS_KEY, p);
    return p;
  }

  return {
    blank: blank, load: load, save: save,
    moduleState: moduleState, start: start, setStep: setStep,
    recordAnswer: recordAnswer, complete: complete, addSpins: addSpins,
    resetModule: resetModule, clearAll: clearAll, summary: summary,
    prefs: prefs, setPref: setPref,
  };
})();
