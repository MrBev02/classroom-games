/**
 * MAKE & SWAP — shared puzzle logic.
 *
 * Pure, browser-only helpers for the "build a puzzle, share a link, swap"
 * activity. No backend, no build step:
 *
 *   - encode/decode : pack a puzzle into a URL-safe string (base64url of UTF-8
 *                     JSON) so a whole puzzle travels inside a link's #hash.
 *   - buildWordSearch : hide a word list in a letter grid (8 directions).
 *   - buildCrossword  : greedily interlock a word+clue list into a crossword.
 *
 * One word list feeds BOTH puzzle types — the creator enters terms (and clues),
 * the solver can play either. Everything is deterministic-ish and self-contained
 * so it runs the same from github.io or file://.
 */
(function (global) {
  'use strict';

  /* ----------------------------------------------------------------
     Share encoding — a puzzle <-> a compact URL-safe string.
     Shape stored:  { v:1, t:title, by:author, words:[{w,c}, …] }
     ---------------------------------------------------------------- */

  function encode(obj) {
    const json = JSON.stringify(obj);
    const utf8 = unescape(encodeURIComponent(json)); // JSON -> latin1 bytes
    return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decode(str) {
    let b64 = String(str || '').trim().replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const utf8 = atob(b64);
    const json = decodeURIComponent(escape(utf8));
    return JSON.parse(json);
  }

  // Pull a payload out of whatever the student pasted — a full share link,
  // a "#p=…" fragment, or the bare code on its own.
  function extractCode(text) {
    const s = String(text || '').trim();
    if (!s) return '';
    const m = s.match(/[#&?]p=([^#&\s]+)/);
    if (m) return decodeURIComponent(m[1]);
    return s; // assume it's the bare code
  }

  /* ----------------------------------------------------------------
     Word normalisation — grids only hold A–Z.
     ---------------------------------------------------------------- */

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function normalize(word) {
    return String(word || '').toUpperCase().replace(/[^A-Z]/g, '');
  }

  // A tiny seeded PRNG so a given list lays out the same way each visit
  // (no Date.now()/Math.random surprises mid-session). Seeded off the words.
  function makeRng(seedStr) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ----------------------------------------------------------------
     WORD SEARCH
     ---------------------------------------------------------------- */

  const WS_DIRS = [
    [0, 1], [1, 0], [1, 1], [1, -1],
    [0, -1], [-1, 0], [-1, -1], [-1, 1],
  ];

  function buildWordSearch(words) {
    const list = [];
    const seen = new Set();
    for (const w of words) {
      const n = normalize(w);
      if (n.length >= 2 && n.length <= 18 && !seen.has(n)) {
        seen.add(n);
        list.push(n);
      }
    }
    if (!list.length) return { ok: false, error: 'Add at least one word (2+ letters).' };

    const longest = list.reduce((m, w) => Math.max(m, w.length), 0);
    const totalLetters = list.reduce((s, w) => s + w.length, 0);
    // Fresh random seed per build so the same word list hides differently each
    // play-through (browser Math.random is fine here — this isn't a workflow).
    const rng = makeRng(list.join('|') + '#' + Math.floor(Math.random() * 1e9));

    // Try a few sizes, growing if a word won't fit, so it never silently drops.
    let size = Math.max(longest, Math.ceil(Math.sqrt(totalLetters * 2)), 9);
    let result = null;
    for (let attempt = 0; attempt < 60 && !result; attempt++) {
      result = tryFill(list, size, rng);
      if (!result) size = Math.min(size + 1, longest + 8);
    }
    if (!result) return { ok: false, error: 'Could not fit those words — try fewer or shorter words.' };

    // Fill blanks with random letters.
    const grid = result.grid;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) grid[r][c] = ALPHA[Math.floor(rng() * 26)];
      }
    }

    return { ok: true, size, grid, words: list, placements: result.placements };
  }

  function tryFill(list, size, rng) {
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const placements = [];
    // Longest first — easiest to place while the grid is empty.
    const ordered = [...list].sort((a, b) => b.length - a.length);

    for (const word of ordered) {
      let placed = false;
      for (let tries = 0; tries < 200 && !placed; tries++) {
        const dir = WS_DIRS[Math.floor(rng() * WS_DIRS.length)];
        const [dr, dc] = dir;
        const r0 = Math.floor(rng() * size);
        const c0 = Math.floor(rng() * size);
        const rEnd = r0 + dr * (word.length - 1);
        const cEnd = c0 + dc * (word.length - 1);
        if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;

        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const cell = grid[r0 + dr * i][c0 + dc * i];
          if (cell && cell !== word[i]) { fits = false; break; }
        }
        if (!fits) continue;

        for (let i = 0; i < word.length; i++) grid[r0 + dr * i][c0 + dc * i] = word[i];
        placements.push({ word, r: r0, c: c0, dr, dc });
        placed = true;
      }
      if (!placed) return null; // caller grows the grid and retries
    }
    return { grid, placements };
  }

  /* ----------------------------------------------------------------
     CROSSWORD — greedy interlock.
     ---------------------------------------------------------------- */

  function buildCrossword(entries) {
    const items = [];
    const seen = new Set();
    for (const e of entries) {
      const w = normalize(e.w != null ? e.w : e.word);
      const clue = String((e.c != null ? e.c : e.clue) || '').trim();
      if (w.length >= 2 && w.length <= 18 && !seen.has(w)) {
        seen.add(w);
        items.push({ word: w, clue });
      }
    }
    if (items.length < 2) return { ok: false, error: 'A crossword needs at least 2 words.' };

    items.sort((a, b) => b.word.length - a.word.length);
    const rng = makeRng(items.map((i) => i.word).join('|'));

    const cells = new Map(); // "r,c" -> letter
    const placed = [];
    const key = (r, c) => r + ',' + c;

    function canPlace(word, r, c, dir) {
      const dr = dir === 'D' ? 1 : 0;
      const dc = dir === 'A' ? 1 : 0;
      let crossings = 0;
      // Cell immediately before the start and after the end must be empty.
      if (cells.has(key(r - dr, c - dc))) return null;
      if (cells.has(key(r + dr * word.length, c + dc * word.length))) return null;
      for (let i = 0; i < word.length; i++) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        const cur = cells.get(key(rr, cc));
        if (cur) {
          if (cur !== word[i]) return null;
          crossings++;
        } else {
          // No accidental side-by-side parallel words: perpendicular neighbours
          // of a fresh cell must be empty.
          if (dir === 'A') {
            if (cells.has(key(rr - 1, cc)) || cells.has(key(rr + 1, cc))) return null;
          } else {
            if (cells.has(key(rr, cc - 1)) || cells.has(key(rr, cc + 1))) return null;
          }
        }
      }
      if (crossings === 0 && placed.length > 0) return null; // must interlock
      return crossings;
    }

    function place(item, r, c, dir) {
      const dr = dir === 'D' ? 1 : 0;
      const dc = dir === 'A' ? 1 : 0;
      for (let i = 0; i < item.word.length; i++) cells.set(key(r + dr * i, c + dc * i), item.word[i]);
      placed.push({ word: item.word, clue: item.clue, r, c, dir });
    }

    const unplaced = [];
    place(items[0], 0, 0, 'A');

    for (let n = 1; n < items.length; n++) {
      const item = items[n];
      let best = null;
      for (const p of placed) {
        const pdr = p.dir === 'D' ? 1 : 0;
        const pdc = p.dir === 'A' ? 1 : 0;
        const dir = p.dir === 'A' ? 'D' : 'A';
        for (let pi = 0; pi < p.word.length; pi++) {
          const lr = p.r + pdr * pi;
          const lc = p.c + pdc * pi;
          const letter = p.word[pi];
          for (let wi = 0; wi < item.word.length; wi++) {
            if (item.word[wi] !== letter) continue;
            const dr = dir === 'D' ? 1 : 0;
            const dc = dir === 'A' ? 1 : 0;
            const r = lr - dr * wi;
            const c = lc - dc * wi;
            const score = canPlace(item.word, r, c, dir);
            if (score != null) {
              const jitter = rng() * 0.5;
              const total = score + jitter;
              if (!best || total > best.total) best = { r, c, dir, total };
            }
          }
        }
      }
      if (best) place(item, best.r, best.c, best.dir);
      else unplaced.push(item.word);
    }

    // Normalise coordinates to a 0-based grid.
    let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
    for (const p of placed) {
      const dr = p.dir === 'D' ? 1 : 0;
      const dc = p.dir === 'A' ? 1 : 0;
      minR = Math.min(minR, p.r);
      minC = Math.min(minC, p.c);
      maxR = Math.max(maxR, p.r + dr * (p.word.length - 1));
      maxC = Math.max(maxC, p.c + dc * (p.word.length - 1));
    }
    for (const p of placed) { p.r -= minR; p.c -= minC; }
    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;

    // Letter grid (null = black square).
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (const p of placed) {
      const dr = p.dir === 'D' ? 1 : 0;
      const dc = p.dir === 'A' ? 1 : 0;
      for (let i = 0; i < p.word.length; i++) grid[p.r + dr * i][p.c + dc * i] = p.word[i];
    }

    // Number every cell that starts an across and/or down word.
    const startKeys = [...new Set(placed.map((p) => key(p.r, p.c)))]
      .map((s) => s.split(',').map(Number))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const numOf = new Map();
    startKeys.forEach(([r, c], i) => numOf.set(key(r, c), i + 1));
    const numbers = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (const [k, num] of numOf) {
      const [r, c] = k.split(',').map(Number);
      numbers[r][c] = num;
    }

    const across = [];
    const down = [];
    for (const p of placed) {
      const dr = p.dir === 'D' ? 1 : 0;
      const dc = p.dir === 'A' ? 1 : 0;
      const list = [];
      for (let i = 0; i < p.word.length; i++) list.push([p.r + dr * i, p.c + dc * i]);
      const slot = {
        num: numOf.get(key(p.r, p.c)),
        clue: p.clue,
        answer: p.word,
        dir: p.dir,
        cells: list,
      };
      (p.dir === 'A' ? across : down).push(slot);
    }
    across.sort((a, b) => a.num - b.num);
    down.sort((a, b) => a.num - b.num);

    return { ok: true, rows, cols, grid, numbers, across, down, unplaced };
  }

  /* ----------------------------------------------------------------
     STARTER SAMPLES — one per class, so each room has a worked example
     to copy and an instant puzzle to solve.
     ---------------------------------------------------------------- */

  const SAMPLES = {
    y10: {
      t: 'Computing Technology — Core Terms',
      by: 'Sample',
      words: [
        { w: 'ALGORITHM', c: 'A step-by-step set of instructions to solve a problem' },
        { w: 'BINARY', c: 'The base-2 number system computers use' },
        { w: 'VARIABLE', c: 'A named container that stores a value' },
        { w: 'DEBUG', c: 'To find and fix errors in code' },
        { w: 'NETWORK', c: 'Two or more connected computers that share data' },
        { w: 'HARDWARE', c: 'The physical parts of a computer' },
        { w: 'INPUT', c: 'Data that goes into a system' },
        { w: 'OUTPUT', c: 'Information a system produces' },
        { w: 'PIXEL', c: 'The smallest dot in a digital image' },
        { w: 'BOOLEAN', c: 'A value that is either true or false' },
        { w: 'ENCRYPT', c: 'To scramble data so only authorised people can read it' },
        { w: 'FUNCTION', c: 'A reusable named block of code' },
      ],
    },
    y11: {
      t: 'Enterprise Computing — Key Terms',
      by: 'Sample',
      words: [
        { w: 'WIREFRAME', c: 'A basic layout sketch of a screen' },
        { w: 'USABILITY', c: 'How easy a product is to use' },
        { w: 'DATABASE', c: 'An organised collection of data' },
        { w: 'PROTOTYPE', c: 'An early model used to test a design' },
        { w: 'AGILE', c: 'An iterative, flexible project-management approach' },
        { w: 'METADATA', c: 'Data that describes other data' },
        { w: 'FEEDBACK', c: 'Information a system gives a user about an action' },
        { w: 'NAVIGATION', c: 'How a user moves around an interface' },
        { w: 'RESPONSIVE', c: 'A design that adapts to the screen size' },
        { w: 'ENCRYPTION', c: 'Scrambling data to keep it private' },
        { w: 'STAKEHOLDER', c: 'A person with an interest in a project' },
        { w: 'ACCESSIBLE', c: 'Designed so everyone, including people with disability, can use it' },
      ],
    },
  };

  global.Puzzles = {
    encode, decode, extractCode, normalize,
    buildWordSearch, buildCrossword, SAMPLES,
  };
})(window);
