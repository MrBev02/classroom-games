/**
 * Shared math typesetting for the classroom games (Jeopardy, Family Feud,
 * Pointless). Question / answer / category text may contain TeX math; this
 * turns it into rendered formulas with KaTeX.
 *
 * Delimiters (single $ is deliberately NOT one, so dollar amounts in
 * questions — "you have $5 and spend $3" — are never mistaken for math):
 *     inline   \( ... \)
 *     display  $$ ... $$   or   \[ ... \]
 *
 * Because question sets are authored as JSON, every backslash must be DOUBLED
 * in the source, e.g.
 *     "Solve \\(x^2 + 5x + 6 = 0\\)"   ->  Solve \(x^2 + 5x + 6 = 0\)
 *     "$$A = \\pi r^2$$"               ->  centred  A = πr²
 *
 * KaTeX and its auto-render extension are loaded from a CDN before this file.
 * If they are unavailable (e.g. the CDN is unreachable) every helper degrades
 * to plain text — nothing throws.
 *
 *   MathText.render(el, text) — set el's text, then typeset any math in it.
 *   MathText.typeset(el)      — typeset math already in el's DOM, e.g. after
 *                               assigning innerHTML.
 */
(function (global) {
  'use strict';

  const OPTIONS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
    ],
    throwOnError: false, // malformed TeX renders in red rather than crashing
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'option'],
  };

  function typeset(el) {
    if (!el || typeof global.renderMathInElement !== 'function') return;
    try {
      global.renderMathInElement(el, OPTIONS);
    } catch (_) {
      /* never let math rendering break the game */
    }
  }

  function render(el, text) {
    if (!el) return;
    el.textContent = text == null ? '' : String(text);
    typeset(el);
  }

  // KaTeX renders real letter glyphs, so the game-show styling on a clue/
  // question container (text-transform: uppercase, wide letter-spacing, a drop
  // shadow) bleeds into the formula — turning "x" into "X", spreading the
  // glyphs apart, and shadowing the fraction/√ rules. These are all inherited
  // properties, so reset them on KaTeX output only. font-family / font-weight
  // are left alone — KaTeX manages its own math fonts.
  function injectStyles() {
    if (document.getElementById('mathtext-reset')) return;
    const style = document.createElement('style');
    style.id = 'mathtext-reset';
    style.textContent =
      '.katex,.katex *{' +
      'text-transform:none !important;' +
      'letter-spacing:normal !important;' +
      'word-spacing:normal !important;' +
      'text-shadow:none !important;}';
    (document.head || document.documentElement).appendChild(style);
  }
  injectStyles();

  global.MathText = { render, typeset };
})(window);
