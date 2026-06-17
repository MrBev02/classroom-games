/**
 * Family Feud — question editor (thin adapter over the shared editor kit).
 *
 * Family Feud data is a flat array of survey questions, each with a list of
 * answers and their points:  [ { question, answers:[{text, points}] }, … ].
 * Spreadsheet columns: Question, Answer, Points.
 *
 * Exposes window.FeudEditor.mount({ mount, storageKey, validate, onUse }).
 */
(function (global) {
  'use strict';

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const blankQ = () => ({ question: '', answers: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }] });
  function blankModel() { return { questions: [blankQ(), blankQ(), blankQ()] }; }

  function looksLikeHeader(cells) {
    const j = (cells || []).map((c) => c.trim().toLowerCase());
    return j.includes('question') && j.includes('answer');
  }

  // Spreadsheet rows -> model. Columns: Question, Answer, Points.
  function fromTable(rows, title) {
    if (looksLikeHeader(rows[0])) rows = rows.slice(1);
    const order = [], byQ = new Map();
    let skipped = 0, defaulted = 0;
    for (const r of rows) {
      const question = (r[0] || '').trim(), answer = (r[1] || '').trim();
      if (!question || !answer) { skipped++; continue; }
      const raw = (r[2] || '').trim();
      const n = Number(raw.replace(/[^0-9.\-]/g, ''));
      const points = isFinite(n) && raw !== '' ? n : (defaulted++, 0);
      if (!byQ.has(question)) { byQ.set(question, []); order.push(question); }
      byQ.get(question).push({ text: answer, points });
    }
    const questions = order.map((q) => ({ question: q, answers: byQ.get(q) }));
    const ans = questions.reduce((s, q) => s + q.answers.length, 0);
    if (!ans) return { error: 'No usable rows — each needs a Question and an Answer.' };
    const note = `Imported ${ans} answer${ans === 1 ? '' : 's'} across ${questions.length} ` +
      `question${questions.length === 1 ? '' : 's'}` +
      `${skipped ? `, skipped ${skipped} incomplete` : ''}${defaulted ? `, ${defaulted} missing points set to 0` : ''}.`;
    return { model: { questions }, title, note };
  }

  function toData(model) { return clone(model.questions); }
  function summary(model) { const n = model.questions.length; return `${n} question${n === 1 ? '' : 's'}`; }

  // Inverse of toData: turn a built question set (AI-pasted / imported) back
  // into an editable model. Feud data is the bare questions array.
  function fromData(data) {
    const arr = Array.isArray(data) ? data
      : (data && Array.isArray(data.questions) ? data.questions : null);
    if (!arr) return { error: 'That isn’t a Family Feud question set.' };
    return { model: { questions: clone(arr) }, title: '' };
  }

  function renderBody(model, host, h) {
    const { el, bindText, xBtn, miniBtn, rerender } = h;

    model.questions.forEach((q, qi) => {
      const answers = el('div.qed-rows');
      q.answers.forEach((a, ai) => {
        answers.append(el('div.qed-r.qed-c-ans', null,
          bindText(a, 'text', { placeholder: `Answer ${ai + 1}` }),
          bindText(a, 'points', { type: 'number', min: '0', placeholder: 'pts' }),
          xBtn('Remove this answer', () => {
            q.answers.splice(ai, 1);
            if (!q.answers.length) q.answers.push({ text: '' });
            rerender();
          })
        ));
      });

      host.append(el('div.qed-block', null,
        el('div.qed-block-head', null,
          el('span.qed-block-num', { text: `Q${qi + 1}` }),
          el('span.qed-grow'),
          xBtn('Remove this question', () => {
            model.questions.splice(qi, 1);
            if (!model.questions.length) model.questions.push(blankQ());
            rerender();
          })
        ),
        el('div', { style: 'padding:8px' }, bindText(q, 'question', { tag: 'textarea', placeholder: `Question ${qi + 1} — e.g. "Name something you take to the beach"` })),
        el('div.qed-colhead.qed-c-ans', null, el('span', { text: 'Answer' }), el('span', { text: 'Points' }), el('span')),
        answers,
        el('div.qed-foot', null, miniBtn('+ Add answer', () => { q.answers.push({ text: '' }); rerender(); }))
      ));
    });

    host.append(el('div', { style: 'margin-top:8px' },
      miniBtn('+ Add question', () => { model.questions.push(blankQ()); rerender(); })));
  }

  function mount({ mount, storageKey, validate, onUse }) {
    return QuestionEditorKit.mount({
      mount, storageKey: storageKey || 'feud-bank-v1',
      heading: 'Build your own questions',
      lead: 'Type your survey questions and answers — or paste them from a spreadsheet. Saved in this browser; nothing is uploaded.',
      titleLabel: 'Set name (for saving / export)',
      titlePlaceholder: 'My questions (e.g. End-of-term review)',
      blankModel, renderBody, summary, toData, fromData,
      fromTable, validate, onUse,
      useLabel: 'Use these questions ▶',
      useDoneHint: 'loaded. Set your teams and click Start Game ▶.',
      pasteSummary: 'Paste from a spreadsheet (Excel / Google Sheets / CSV)',
      pasteExample: 'Name something you take to the beach\tTowel\t40\nName something you take to the beach\tSunscreen\t28\nName a breakfast food\tEggs\t35',
      pasteHelp: QuestionEditorKit.el('p.qed-hint', null,
        'One row per answer, columns in this order: ',
        QuestionEditorKit.el('code', { text: 'Question, Answer, Points' }),
        '. Repeat the question on each of its answer rows. A header row is fine.'),
    });
  }

  global.FeudEditor = { mount, fromTable, toData, fromData };
})(window);
