/* =====================================================
   ROULETTE: SAFE LOCAL STORAGE
   =====================================================

   All the read operations and the write operations for localStorage use
   this file.

   localStorage is not always available. Safari in private mode can give
   an error for a write operation. A page that opens from a file can also
   give an error. A policy can block the site data.

   An error from localStorage must not stop the activity.

   Thus no function in this file gives an error. If the storage is not
   available, the module keeps the values in memory. The memory keeps the
   values only while the page is open. The module also sets `Store.works`
   to false. The student page then shows one line about the storage. The
   page continues to operate. It does not show a dialog.
   ===================================================== */

const Store = (function () {
  const memory = {};
  let works = true;

  try {
    const probe = "roulette-probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
  } catch (_) {
    works = false;
  }

  function get(key, fallback) {
    let raw = null;
    if (works) {
      try { raw = localStorage.getItem(key); } catch (_) { raw = null; }
    }
    // The memory contains only the values that the storage did not keep.
    // It is an alternative. It is not a cache. If the memory kept a copy
    // of each write operation, it can give an old value. This occurs when
    // a different tab removes the site data.
    if (raw == null && Object.prototype.hasOwnProperty.call(memory, key)) raw = memory[key];
    if (raw == null) return fallback === undefined ? null : fallback;
    try { return JSON.parse(raw); } catch (_) { return fallback === undefined ? null : fallback; }
  }

  function set(key, value) {
    const raw = JSON.stringify(value);
    if (works) {
      try {
        localStorage.setItem(key, raw);
        delete memory[key];        // The storage kept the value. Remove the copy in memory.
        return true;
      } catch (_) {
        // There is no more space, or the browser stopped the storage.
        works = false;
      }
    }
    memory[key] = raw;
    return false;
  }

  function remove(key) {
    delete memory[key];
    if (!works) return;
    try { localStorage.removeItem(key); } catch (_) { /* nothing useful to do */ }
  }

  return {
    get: get,
    set: set,
    remove: remove,
    get works() { return works; },
  };
})();
