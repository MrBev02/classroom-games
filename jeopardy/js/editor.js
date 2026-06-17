/**
 * Jeopardy — question editor (thin adapter over the shared editor kit).
 *
 * Defines the Jeopardy-shaped grid (categories × clue/answer rows), the
 * spreadsheet mapping (Category, Clue, Answer, Value), and how the model turns
 * into the game's `{ title, categories:[…] }` data. All the chrome — saved-sets
 * bank, paste box, export — comes from QuestionEditorKit.
 *
 * Exposes window.QuestionEditor.mount({ mount, storageKey, validate, onUse }),
 * so the host page wiring stays the same.
 */
(function (global) {
  'use strict';

  const clone = (x) => JSON.parse(JSON.stringify(x));

  function blankModel() {
    return {
      categories: Array.from({ length: 5 }, () => ({
        name: '',
        clues: Array.from({ length: 5 }, () => ({ clue: '', answer: '' })),
      })),
    };
  }

  function looksLikeHeader(cells) {
    const j = (cells || []).map((c) => c.trim().toLowerCase());
    return j.includes('category') && (j.includes('clue') || j.includes('question'));
  }

  // Spreadsheet rows -> model. Columns: Category, Clue, Answer, [Value].
  function fromTable(rows, title) {
    if (looksLikeHeader(rows[0])) rows = rows.slice(1);
    const order = [], byCat = new Map();
    let skipped = 0;
    for (const r of rows) {
      const name = (r[0] || '').trim(), clue = (r[1] || '').trim(), answer = (r[2] || '').trim();
      if (!name || !clue || !answer) { skipped++; continue; }
      if (!byCat.has(name)) { byCat.set(name, []); order.push(name); }
      const e = { clue, answer };
      const v = (r[3] || '').trim();
      if (v !== '') { const n = Number(v.replace(/[$,]/g, '')); if (isFinite(n)) e.value = n; }
      byCat.get(name).push(e);
    }
    const categories = order.map((n) => ({ name: n, clues: byCat.get(n) }));
    const count = categories.reduce((s, c) => s + c.clues.length, 0);
    if (!count) return { error: 'No usable rows — each needs a Category, Clue and Answer.' };
    const note = `Imported ${count} clue${count === 1 ? '' : 's'} across ${categories.length} ` +
      `categor${categories.length === 1 ? 'y' : 'ies'}${skipped ? ` (skipped ${skipped} incomplete)` : ''}.`;
    return { model: { categories }, title, note };
  }

  function toData(model, title) {
    return { title, categories: clone(model.categories) };
  }

  // Inverse of toData: turn a built board (AI-pasted / imported) back into an
  // editable model so it can be reviewed, saved and tweaked in the grid.
  function fromData(data) {
    if (!data || !Array.isArray(data.categories)) return { error: 'That isn’t a Jeopardy board.' };
    return { model: { categories: clone(data.categories) }, title: data.title || '' };
  }

  function summary(model) {
    const rows = Math.max(1, ...model.categories.map((c) => c.clues.length));
    return `${model.categories.length}×${rows}`;
  }

  function renderBody(model, host, h) {
    const { el, bindText, xBtn, miniBtn, rerender } = h;

    // size controls
    const cols = el('input.qed-size', { type: 'number', min: '1', max: '10', value: String(model.categories.length) });
    const rows = el('input.qed-size', { type: 'number', min: '1', max: '12', value: String(Math.max(1, ...model.categories.map((c) => c.clues.length))) });
    const resize = el('button.qed-sec', { type: 'button' }, 'Resize');
    resize.addEventListener('click', () => {
      const nc = Math.max(1, Math.min(10, parseInt(cols.value, 10) || 1));
      const nr = Math.max(1, Math.min(12, parseInt(rows.value, 10) || 1));
      while (model.categories.length < nc) model.categories.push({ name: '', clues: [] });
      model.categories.length = nc;
      model.categories.forEach((cat) => {
        while (cat.clues.length < nr) cat.clues.push({ clue: '', answer: '' });
        cat.clues.length = nr;
      });
      rerender();
    });

    host.append(
      el('label', { text: 'Board size' }),
      el('div.qed-row', null,
        el('div', null, el('span.qed-hint', { text: 'Categories' }), cols),
        el('div', null, el('span.qed-hint', { text: 'Clues each' }), rows),
        resize
      ),
      el('div.qed-colhead.qed-c-clue', null,
        el('span', { text: 'Clue (read aloud)' }), el('span', { text: 'Answer' }), el('span', { text: '$' }), el('span'))
    );

    model.categories.forEach((cat, ci) => {
      const clues = el('div.qed-rows');
      cat.clues.forEach((clue, ri) => {
        clues.append(el('div.qed-r.qed-c-clue', null,
          bindText(clue, 'clue', { tag: 'textarea', placeholder: `Clue ${ri + 1} — a statement to read aloud` }),
          bindText(clue, 'answer', { placeholder: 'What is …?' }),
          bindText(clue, 'value', { type: 'number', min: '0', placeholder: `${(ri + 1) * 100}` }),
          xBtn('Remove this clue', () => {
            cat.clues.splice(ri, 1);
            if (!cat.clues.length) cat.clues.push({ clue: '', answer: '' });
            rerender();
          })
        ));
      });

      host.append(el('div.qed-block', null,
        el('div.qed-block-head', null,
          el('span.qed-block-num', { text: `#${ci + 1}` }),
          bindText(cat, 'name', { cls: 'qed-grow', placeholder: `Category ${ci + 1} name` }),
          xBtn('Remove this category', () => {
            model.categories.splice(ci, 1);
            if (!model.categories.length) model.categories.push({ name: '', clues: [{ clue: '', answer: '' }] });
            rerender();
          })
        ),
        clues,
        el('div.qed-foot', null, miniBtn('+ Add clue', () => { cat.clues.push({ clue: '', answer: '' }); rerender(); }))
      ));
    });

    host.append(el('div', { style: 'margin-top:8px' },
      miniBtn('+ Add category', () => {
        const n = model.categories[0] ? model.categories[0].clues.length : 5;
        model.categories.push({ name: '', clues: Array.from({ length: n }, () => ({ clue: '', answer: '' })) });
        rerender();
      })
    ));
  }

  function mount({ mount, storageKey, validate, onUse }) {
    return QuestionEditorKit.mount({
      mount, storageKey: storageKey || 'jeopardy-bank-v1',
      heading: 'Build your own board',
      lead: 'Type your questions below — or paste them from a spreadsheet. Saved in this browser; nothing is uploaded.',
      titleLabel: 'Board title',
      titlePlaceholder: 'My game title (e.g. Year 9 — The Water Cycle)',
      blankModel, renderBody, summary, toData, fromData,
      fromTable, validate, onUse,
      useLabel: 'Use this board ▶',
      useDoneHint: 'added as the selected game set. Click Start Game ▶.',
      pasteSummary: 'Paste from a spreadsheet (Excel / Google Sheets / CSV)',
      pasteExample: 'Science\tThe closest planet to the Sun\tWhat is Mercury?\nScience\tThe gas plants take in\tWhat is carbon dioxide?',
      pasteHelp: QuestionEditorKit.el('p.qed-hint', null,
        'One row per clue, columns in this order: ',
        QuestionEditorKit.el('code', { text: 'Category, Clue, Answer, Value' }),
        ' (Value optional). Copy the cells from your sheet and paste — a header row is fine.'),
    });
  }

  global.QuestionEditor = { mount, fromTable, toData, fromData };
})(window);
