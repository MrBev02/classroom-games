/**
 * Pointless — question editor (thin adapter over the shared editor kit).
 *
 * Pointless data is rounds of questions plus a single final, where each answer
 * maps to a score (0–100, LOWER = more obscure = better) and may carry aliases:
 *   { title, rounds:[{ roundNumber, questions:[{ category, question,
 *       answers:{ "name": score | { score, aliases:[…] } } }] }], final:{…} }
 *
 * For editing, answers are kept as an array [{ text, score, aliases }] (aliases
 * a comma-separated string) and converted to the score map on the way out.
 * Spreadsheet columns: Round, Category, Question, Answer, Score, Aliases.
 *
 * Exposes window.PointlessEditor.mount({ mount, storageKey, validate, onUse }).
 */
(function (global) {
  'use strict';

  const blankA = () => ({ text: '', aliases: '' });
  const blankQ = () => ({ category: '', question: '', answers: [blankA(), blankA(), blankA(), blankA(), blankA()] });
  function blankModel() { return { rounds: [{ questions: [blankQ()] }], final: blankQ() }; }

  // ---- model -> game data ----
  function answersToMap(arr) {
    const map = {};
    for (const a of arr || []) {
      const text = (a.text || '').trim();
      if (!text) continue;
      const aliases = (a.aliases || '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
      const score = a.score == null || a.score === '' ? NaN : Number(a.score);
      map[text] = aliases.length ? { score, aliases } : score;
    }
    return map;
  }
  function qToData(q) {
    return { category: (q.category || '').trim(), question: (q.question || '').trim(), answers: answersToMap(q.answers) };
  }
  function toData(model, title) {
    return {
      title,
      rounds: model.rounds.map((r, i) => ({ roundNumber: i + 1, questions: (r.questions || []).map(qToData) })),
      final: qToData(model.final),
    };
  }

  function summary(model) {
    const n = model.rounds.length;
    return `${n} round${n === 1 ? '' : 's'} + final`;
  }

  // ---- game data -> model (inverse of toData) ----
  // Turns a built game (AI-pasted / imported) back into the editable model:
  // each answer's score map becomes a { text, score, aliases } row again.
  function mapToAnswers(map) {
    const arr = [];
    for (const [text, v] of Object.entries(map || {})) {
      if (v && typeof v === 'object') arr.push({ text, score: v.score, aliases: (v.aliases || []).join(', ') });
      else arr.push({ text, score: v, aliases: '' });
    }
    return arr.length ? arr : [blankA()];
  }
  function qFromData(q) {
    q = q || {};
    return { category: q.category || '', question: q.question || '', answers: mapToAnswers(q.answers) };
  }
  function fromData(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.rounds)) return { error: 'That isn’t a Pointless game.' };
    const rounds = data.rounds.length
      ? data.rounds.map((r) => {
          const qs = (r && Array.isArray(r.questions) ? r.questions : []).map(qFromData);
          return { questions: qs.length ? qs : [blankQ()] };
        })
      : [{ questions: [blankQ()] }];
    const final = data.final ? qFromData(data.final) : blankQ();
    return { model: { rounds, final }, title: data.title || '' };
  }

  // ---- spreadsheet -> model. Columns: Round, Category, Question, Answer, Score, Aliases ----
  function looksLikeHeader(cells) {
    const j = (cells || []).map((c) => c.trim().toLowerCase());
    return j.includes('answer') && (j.includes('question') || j.includes('round'));
  }
  function fromTable(rows, title) {
    if (looksLikeHeader(rows[0])) rows = rows.slice(1);
    const roundsMap = new Map();      // roundNum -> Map(qKey -> {category, question, answers:[]})
    const finalMap = new Map();
    let skipped = 0, total = 0;
    const ensureQ = (container, category, question) => {
      const key = category + '||' + question;
      if (!container.has(key)) container.set(key, { category, question, answers: [] });
      return container.get(key);
    };
    for (const r of rows) {
      const roundRaw = (r[0] || '').trim();
      const category = (r[1] || '').trim();
      const question = (r[2] || '').trim();
      const answer = (r[3] || '').trim();
      const scoreRaw = (r[4] || '').trim();
      const aliases = (r[5] || '').trim();
      if (!question || !answer) { skipped++; continue; }
      const n = Number(scoreRaw.replace(/[^0-9.\-]/g, ''));
      const score = scoreRaw !== '' && isFinite(n) ? n : 0;
      const isFinal = /^(final|f)$/i.test(roundRaw);
      let container;
      if (isFinal) {
        container = finalMap;
      } else {
        const rn = parseInt(roundRaw, 10) || 1;
        if (!roundsMap.has(rn)) roundsMap.set(rn, new Map());
        container = roundsMap.get(rn);
      }
      ensureQ(container, category, question).answers.push({ text: answer, score, aliases });
      total++;
    }
    const roundNums = [...roundsMap.keys()].sort((a, b) => a - b);
    const rounds = roundNums.length
      ? roundNums.map((rn) => ({ questions: [...roundsMap.get(rn).values()] }))
      : [{ questions: [blankQ()] }];
    const final = finalMap.size ? [...finalMap.values()][0] : blankQ();
    if (!total) return { error: 'No usable rows — each needs a Question, an Answer and a Score.' };
    const note = `Imported ${total} answer${total === 1 ? '' : 's'} across ${rounds.length} round${rounds.length === 1 ? '' : 's'}` +
      `${finalMap.size ? ' + final' : ' (no Final row found — add one below)'}${skipped ? `, skipped ${skipped} incomplete` : ''}.`;
    return { model: { rounds, final }, title, note };
  }

  // ---- rendering ----
  function renderQuestion(q, label, h, onRemove) {
    const { el, bindText, xBtn, miniBtn, rerender } = h;
    const answers = el('div.qed-rows');
    q.answers.forEach((a, ai) => {
      answers.append(el('div.qed-r.qed-c-pans', null,
        bindText(a, 'text', { placeholder: `Answer ${ai + 1}` }),
        bindText(a, 'score', { type: 'number', min: '0', max: '100', placeholder: '0–100' }),
        bindText(a, 'aliases', { placeholder: 'alt spellings (optional)' }),
        xBtn('Remove this answer', () => {
          q.answers.splice(ai, 1);
          if (!q.answers.length) q.answers.push(blankA());
          rerender();
        })
      ));
    });
    return el('div.qed-block', null,
      el('div.qed-block-head', null,
        el('span.qed-block-num', { text: label }),
        bindText(q, 'category', { cls: 'qed-grow', placeholder: 'Category (e.g. Australian Animals)' }),
        onRemove ? xBtn('Remove this question', onRemove) : null
      ),
      el('div', { style: 'padding:8px' }, bindText(q, 'question', { tag: 'textarea', placeholder: 'Question — e.g. "Name an animal native to Australia"' })),
      el('div.qed-colhead.qed-c-pans', null, el('span', { text: 'Answer' }), el('span', { text: 'Score' }), el('span', { text: 'Aliases' }), el('span')),
      answers,
      el('div.qed-foot', null, miniBtn('+ Add answer', () => { q.answers.push(blankA()); rerender(); }))
    );
  }

  function renderBody(model, host, h) {
    const { el, xBtn, miniBtn, rerender } = h;

    host.append(el('h5', { text: 'Rounds' }),
      el('p.qed-hint', { text: 'Score = how many of 100 people gave that answer. Lower is better; a "pointless" answer scores 0.' }));

    model.rounds.forEach((round, ri) => {
      const qWrap = el('div', { style: 'padding:0 8px' });
      round.questions.forEach((q, qi) => {
        const canRemove = round.questions.length > 1 || model.rounds.length > 1;
        qWrap.append(renderQuestion(q, `Q${qi + 1}`, h, canRemove ? () => {
          round.questions.splice(qi, 1);
          if (!round.questions.length) round.questions.push(blankQ());
          rerender();
        } : null));
      });
      host.append(el('div.qed-block', null,
        el('div.qed-block-head', null,
          el('span.qed-block-num', { text: `Round ${ri + 1}` }),
          el('span.qed-grow'),
          model.rounds.length > 1 ? xBtn('Remove this round', () => {
            model.rounds.splice(ri, 1);
            if (!model.rounds.length) model.rounds.push({ questions: [blankQ()] });
            rerender();
          }) : null
        ),
        qWrap,
        el('div.qed-foot', null, miniBtn('+ Add question', () => { round.questions.push(blankQ()); rerender(); }))
      ));
    });

    host.append(el('div', { style: 'margin:6px 0 4px' },
      miniBtn('+ Add round', () => { model.rounds.push({ questions: [blankQ()] }); rerender(); })));

    host.append(el('h5', { text: 'Final round' }));
    host.append(renderQuestion(model.final, 'Final', h, null));
  }

  function mount({ mount, storageKey, validate, onUse }) {
    return QuestionEditorKit.mount({
      mount, storageKey: storageKey || 'pointless-bank-v1',
      heading: 'Build your own game',
      lead: 'Type your rounds, questions and answers — or paste them from a spreadsheet. Saved in this browser; nothing is uploaded.',
      titleLabel: 'Game title',
      titlePlaceholder: 'My game title (e.g. Year 8 — World Geography)',
      blankModel, renderBody, summary, toData, fromData,
      fromTable, validate, onUse,
      useLabel: 'Use this game ▶',
      useDoneHint: 'added as the selected set. Set teams and click Start Game ▶.',
      pasteSummary: 'Paste from a spreadsheet (Excel / Google Sheets / CSV)',
      pasteExample: 'Round\tCategory\tQuestion\tAnswer\tScore\tAliases\n1\tAussie Animals\tName an animal native to Australia\tKangaroo\t95\troo; red kangaroo\n1\tAussie Animals\tName an animal native to Australia\tNumbat\t8\nFinal\tCapitals\tName a country capital\tCanberra\t40',
      pasteHelp: QuestionEditorKit.el('p.qed-hint', null,
        'One row per answer, columns in this order: ',
        QuestionEditorKit.el('code', { text: 'Round, Category, Question, Answer, Score, Aliases' }),
        '. Use ', QuestionEditorKit.el('code', { text: 'Final' }), ' as the round for the final question; separate aliases with commas. A header row is fine.'),
    });
  }

  global.PointlessEditor = { mount, fromTable, toData, fromData };
})(window);
