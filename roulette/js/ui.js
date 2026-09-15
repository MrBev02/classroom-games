/* =====================================================
   ROULETTE: DOM HELPERS
   =====================================================

   This file contains the functions that build the screen elements. The
   student page, the teacher console and the projector all use them.

   Each function makes DOM elements. Do not use innerHTML for text from a
   different source.

   The function fracDisplay() draws each fraction. The program does not
   use KaTeX for a fraction. The file shared/math.js loads KaTeX from a
   content delivery network. The standalone student file must operate from
   a USB memory device with no internet connection. A fraction is three
   div elements, thus it must not need a network request.

   The program uses MathText only for the text of a question. Each
   question is also correct as plain text.
   ===================================================== */

/** el("div", {class:"x"}, "text", childEl) */
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach((k) => {
      const v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") throw new Error("ui.el: this function does not accept innerHTML. Build elements.");
      else if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.keys(v).forEach((d) => { node.dataset[d] = v[d]; });
      else if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, v);
    });
  }
  children.flat().forEach((c) => {
    if (c == null || c === false) return;
    node.appendChild(typeof c === "string" || typeof c === "number"
      ? document.createTextNode(String(c)) : c);
  });
  return node;
}

/**
 * The student screens show chips. They do not show a currency symbol. The
 * teacher can change the setting to dollars.
 *
 * This file does not contain a function for money. Refer to
 * SAFEGUARDING.md for the reason.
 */
function fmtChips(n) {
  const v = Math.round(n);
  const s = Math.abs(v).toLocaleString();
  const sign = v < 0 ? "−" : "";          // This character is a minus sign. It is not a hyphen.
  return ROULETTE_CONFIG.currencyMode === "dollars"
    ? sign + "$" + s
    : sign + s;
}

/** Dollars. Use this function only for the teacher debrief and for the
    printed material. */
function fmtAUD(n) {
  const sign = n < 0 ? "−" : "";
  return sign + "$" + Math.abs(n).toFixed(2);
}

function fmtDuration(ms) {
  if (!isFinite(ms)) return "∞";
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60), s = total % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

/** A fraction with the numerator above the denominator. A screen reader
    says "18 over 37". */
function fracDisplay(num, den, opts) {
  const o = opts || {};
  return el("span", { class: "frac" + (o.big ? " frac--big" : ""), role: "math",
                      "aria-label": num + " over " + den },
    el("span", { class: "frac__n", text: String(num), "aria-hidden": "true" }),
    el("span", { class: "frac__bar", "aria-hidden": "true" }),
    el("span", { class: "frac__d", text: String(den), "aria-hidden": "true" }));
}

/**
 * This function makes two input boxes in the format of a fraction. The
 * student types a value in each box.
 *
 * The function gives the container element. The container has a read()
 * function and a focus() function.
 */
function fracInput(opts) {
  const o = opts || {};
  const mk = (label) => el("input", {
    class: "frac__in", type: "text", inputmode: "numeric",
    "aria-label": label, autocomplete: "off", size: 3,
  });
  const n = mk("numerator"), d = mk("denominator");
  if (o.denominator != null) { d.value = String(o.denominator); d.readOnly = true; d.classList.add("is-fixed"); }
  const wrap = el("span", { class: "frac frac--input" },
    n, el("span", { class: "frac__bar" }), d);
  wrap.read = () => ({ n: n.value.trim(), d: d.value.trim() });
  wrap.focus = () => n.focus();
  wrap.setDisabled = (v) => { n.disabled = v; d.disabled = v || d.readOnly; };
  if (o.onEnter) [n, d].forEach((i) =>
    i.addEventListener("keydown", (e) => { if (e.key === "Enter") o.onEnter(); }));
  return wrap;
}

/**
 * This function draws the wheel as an SVG image.
 *
 * opts.highlight   The pockets to show with more contrast.
 * opts.dim         The pockets to show with less contrast.
 * opts.onPick      A function. The student can then select a pocket.
 * opts.selected    The pockets that the student selected.
 * opts.ball        The pocket that contains the ball.
 * opts.labels      Show the numbers. The default value is true.
 * opts.dimOthers   Fade the pockets that are not in the event. The default
 *                  value is FALSE. A ring around each winning pocket is
 *                  enough, and a faded pocket loses its colour. Set it to
 *                  true only where a student must separate two groups.
 */
function wheelSVG(wheel, opts) {
  const o = opts || {};
  const w = wheel || currentWheel();
  const order = w.order;
  const n = order.length;
  const size = o.size || 320;
  const c = size / 2;
  const rOuter = c - 2;
  const rInner = rOuter * 0.62;
  const step = 360 / n;

  const hi = new Set(o.highlight || []);
  const dim = new Set(o.dim || []);
  const sel = new Set(o.selected || []);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 " + size + " " + size);
  svg.setAttribute("class", "wheel" + (o.onPick ? " wheel--pickable" : ""));
  svg.setAttribute("role", o.onPick ? "group" : "img");
  svg.setAttribute("aria-label", o.label || (w.label + " roulette wheel"));

  const ns = (tag, attrs) => {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
    return e;
  };

  // A disc behind the pockets. A faded pocket then blends toward this
  // neutral colour rather than toward the colour of the page.
  svg.appendChild(ns("circle", { cx: c, cy: c, r: rOuter, class: "wheel__backing" }));

  order.forEach((pocket, i) => {
    const a0 = (i * step - 90 - step / 2) * Math.PI / 180;
    const a1 = ((i + 1) * step - 90 - step / 2) * Math.PI / 180;
    const path = [
      "M", c + rInner * Math.cos(a0), c + rInner * Math.sin(a0),
      "L", c + rOuter * Math.cos(a0), c + rOuter * Math.sin(a0),
      "A", rOuter, rOuter, 0, 0, 1, c + rOuter * Math.cos(a1), c + rOuter * Math.sin(a1),
      "L", c + rInner * Math.cos(a1), c + rInner * Math.sin(a1),
      "A", rInner, rInner, 0, 0, 0, c + rInner * Math.cos(a0), c + rInner * Math.sin(a0),
      "Z",
    ].join(" ");

    let cls = "wheel__pocket wheel__pocket--" + pocketColour(w, pocket);
    if (hi.size && hi.has(pocket)) cls += " is-highlight";
    if (dim.has(pocket)) cls += " is-dim";
    if (sel.has(pocket)) cls += " is-selected";
    if (hi.size && !hi.has(pocket) && !o.onPick && o.dimOthers === true) cls += " is-muted";

    const seg = ns("path", { d: path, class: cls });
    seg.dataset.pocket = pocket;
    if (o.onPick) {
      seg.setAttribute("tabindex", "0");
      seg.setAttribute("role", "checkbox");
      seg.setAttribute("aria-checked", sel.has(pocket) ? "true" : "false");
      seg.setAttribute("aria-label", "pocket " + pocket + ", " + pocketColour(w, pocket));
      seg.addEventListener("click", () => o.onPick(pocket));
      seg.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); o.onPick(pocket); }
      });
    }
    svg.appendChild(seg);

    if (o.labels !== false) {
      const am = (a0 + a1) / 2;
      const rl = (rInner + rOuter) / 2;
      // The numbers stay horizontal. On a real wheel they turn with the
      // rim, which puts half of them upside down. A student must be able
      // to read every number without turning the screen.
      const t = ns("text", {
        x: c + rl * Math.cos(am), y: c + rl * Math.sin(am),
        class: "wheel__label", "text-anchor": "middle", "dominant-baseline": "central",
      });
      t.textContent = pocket;
      svg.appendChild(t);
    }
  });

  svg.appendChild(ns("circle", { cx: c, cy: c, r: rInner * 0.97, class: "wheel__hub" }));

  // The ball is always in the wheel. It is hidden until a spin gives a
  // result. animateBall() moves this element, so it does not have to draw
  // the wheel again on each frame.
  const ballR = rInner * 0.86;
  const ballAngle = (o.ball ? pocketAngle(w, o.ball) : 0) - 90;
  const ball = ns("circle", {
    cx: c + ballR * Math.cos(ballAngle * Math.PI / 180),
    cy: c + ballR * Math.sin(ballAngle * Math.PI / 180),
    r: Math.max(4, size * 0.024),
    class: "wheel__ball",
  });
  if (!o.ball) ball.setAttribute("opacity", "0");
  svg.appendChild(ball);
  svg.dataset.cx = c;
  svg.dataset.ballR = ballR;
  return svg;
}

/** This function makes a table from a list of headers and a list of rows.
    A row contains text or elements. */
function tableFrom(headers, rows, opts) {
  const o = opts || {};
  const thead = el("thead", null, el("tr", null,
    ...headers.map((h) => el("th", { scope: "col" }, h))));
  const tbody = el("tbody", null, ...rows.map((r) =>
    el("tr", r.class ? { class: r.class } : null,
      ...(r.cells || r).map((cell, i) =>
        el(i === 0 && o.rowHeaders ? "th" : "td",
           i === 0 && o.rowHeaders ? { scope: "row" } : null, cell)))));
  // A wide table moves horizontally in its own container. The page must
  // not move horizontally.
  return el("div", { class: "table-scroll" },
    el("table", { class: "data-table" + (o.class ? " " + o.class : "") }, thead, tbody));
}

/** A value with a label. Example: Staked 4,210. */
function stat(label, value, opts) {
  const o = opts || {};
  return el("div", { class: "stat" + (o.class ? " " + o.class : "") },
    el("div", { class: "stat__label", text: label }),
    el("div", { class: "stat__value", text: value }));
}

/** This function replaces the contents of an element with the given
    elements. */
function fill(node, ...children) {
  node.replaceChildren(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

/** This function shows a text. If the browser loaded KaTeX, the function
    also formats the mathematics in the text. */
function prose(text, cls) {
  const p = el("p", { class: cls || "prose" });
  if (typeof MathText !== "undefined" && MathText.render) MathText.render(p, text);
  else p.textContent = text;
  return p;
}

/**
 * The betting board, which is the felt layout on a roulette table.
 *
 * The board shows where each bet goes. A student who selects "second
 * dozen" on the board can see which numbers that covers, and the wheel
 * beside it lights the same pockets.
 *
 * opts.highlight   Pocket identifiers to show with more contrast.
 * opts.selected    {betId, arg} that the student chose.
 * opts.onPick      A function (betId, arg). It makes the board selectable.
 * opts.ball        The pocket that won the last spin.
 */
function bettingBoard(wheel, opts) {
  const o = opts || {};
  const w = wheel || currentWheel();
  const hi = new Set(o.highlight || []);
  const sel = o.selected || {};
  const board = el("div", { class: "board" + (o.onPick ? " board--pickable" : "") });

  function cell(text, cls, betId, arg, pockets) {
    const winners = pockets || (betId ? betOutcomes(betId, arg, w) : []);
    const isSel = sel.betId === betId && String(sel.arg) === String(arg);
    const inHi = hi.size && winners.length && winners.every((p) => hi.has(p));
    const node = el(o.onPick ? "button" : "div", {
      class: "board__cell " + cls + (isSel ? " is-selected" : "") + (inHi ? " is-lit" : ""),
      type: o.onPick ? "button" : null,
      title: betId ? betDescription(betId, arg) : null,
    }, text);
    if (o.ball && winners.indexOf(o.ball) !== -1 && winners.length === 1) {
      node.classList.add("is-ball");
    }
    if (o.onPick && betId) node.addEventListener("click", () => o.onPick(betId, arg));
    return node;
  }

  // The zero pockets sit on the left and span the three number rows.
  const zeros = el("div", { class: "board__zeros" });
  w.zeroes.forEach((z) => {
    zeros.appendChild(cell(z, "board__num is-green", "straight", z, [z]));
  });
  board.appendChild(zeros);

  // The numbers. A real table runs 3, 6, 9 along the top row and 1, 4, 7
  // along the bottom row.
  const grid = el("div", { class: "board__grid" });
  [3, 2, 1].forEach((offset) => {
    for (let col = 0; col < 12; col++) {
      const nStr = String(col * 3 + offset);
      grid.appendChild(cell(nStr, "board__num is-" + pocketColour(w, nStr), "straight", nStr, [nStr]));
    }
  });
  board.appendChild(grid);

  // The column bets sit at the right end of each row.
  const cols = el("div", { class: "board__cols" });
  [3, 2, 1].forEach((c) => cols.appendChild(cell("2 to 1", "board__outside", "column", c)));
  board.appendChild(cols);

  // The dozens sit under the numbers.
  const dozens = el("div", { class: "board__dozens" });
  ["1st 12", "2nd 12", "3rd 12"].forEach((label, i) =>
    dozens.appendChild(cell(label, "board__outside", "dozen", i + 1)));
  board.appendChild(dozens);

  // The even money bets sit along the bottom.
  const outside = el("div", { class: "board__outside-row" });
  [["1 to 18", "low", null], ["Even", "even", null], ["Red", "red", null],
   ["Black", "black", null], ["Odd", "odd", null], ["19 to 36", "high", null]]
    .forEach((b) => {
      const cls = "board__outside" + (b[1] === "red" ? " is-red" : b[1] === "black" ? " is-black" : "");
      outside.appendChild(cell(b[0], cls, b[1], b[2]));
    });
  board.appendChild(outside);

  return board;
}

/**
 * Move the ball to the pocket that won.
 *
 * THE DURATION IS ALWAYS THE SAME. It does not depend on the result, and
 * the ball does not slow down as it approaches the winning pocket. That
 * slow approach is the part of a real wheel that holds a player's
 * attention, and this activity leaves it out. Refer to SAFEGUARDING.md.
 *
 * The movement is here so that a student can see which pocket won. It
 * does not run for a group of spins, and it does not run when the browser
 * asks for reduced motion.
 */
const SPIN_MS = 1100;

function animateBall(svg, wheel, pocket, onDone) {
  const w = wheel || currentWheel();
  const ball = svg.querySelector(".wheel__ball");
  if (!ball) { if (onDone) onDone(); return; }

  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = pocketAngle(w, pocket);
  const cx = parseFloat(svg.dataset.cx), r = parseFloat(svg.dataset.ballR);

  function place(angleDeg) {
    const a = (angleDeg - 90) * Math.PI / 180;
    ball.setAttribute("cx", cx + r * Math.cos(a));
    ball.setAttribute("cy", cx + r * Math.sin(a));
  }

  if (reduced) { place(target); if (onDone) onDone(); return; }

  // Three complete turns each time, then the winning pocket.
  const from = target + 360 * 3;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / SPIN_MS);
    // One smooth curve across the whole path. There is no extra slowing
    // near the end.
    const eased = 1 - Math.pow(1 - t, 3);
    place(from + (target - from) * eased);
    if (t < 1) requestAnimationFrame(frame);
    else if (onDone) onDone();
  }
  requestAnimationFrame(frame);
}
