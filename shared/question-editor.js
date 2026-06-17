/**
 * Shared "Build your own quiz" editor kit for the classroom games.
 *
 * Provides the whole authoring surface — a saved-sets bank, a title field, a
 * grid area, a "paste from a spreadsheet" box, and Use / Save / Export actions —
 * and delegates the *game-specific* parts (what a row looks like, how a paste
 * maps to it, how the model turns into the game's data) to a small config.
 *
 * Everything runs in the browser (localStorage + a Blob download), so it works
 * on GitHub Pages or from file:// — nothing is uploaded.
 *
 *   QuestionEditorKit.mount({
 *     mount, storageKey,
 *     heading, lead, titleLabel, titlePlaceholder,
 *     blankModel(): model,
 *     renderBody(model, host, helpers): void,   // build the grid bound to model
 *     fromTable(rows, title): { model, title?, note } | { error },
 *     pasteSummary, pasteHelp (DOM node|string), pasteExample,
 *     toData(model, title): data,               // the game's real format
 *     summary(model): 'short label',            // for the saved-sets list
 *     validate(data): {ok:true,data,summary} | {ok:false,error},
 *     onUse(data): void, useLabel, useDoneHint,
 *   });
 *
 * The game mutates `model` in place inside renderBody (inputs bind to it) and
 * calls helpers.rerender() after any structural change (add/remove a row).
 */
(function (global) {
  'use strict';

  let stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const css = `
.qed{font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#fff;color:#1a1f3a;border:1px solid #c7cce0;border-radius:10px;padding:14px;margin-top:10px;text-align:left;}
.qed *{box-sizing:border-box;}
.qed h4{margin:0 0 2px;font-size:15px;color:#1a1f3a;}
.qed h5{margin:14px 0 2px;font-size:13px;color:#2b3a8c;text-transform:uppercase;letter-spacing:.05em;}
.qed p.qed-lead{margin:0 0 10px;color:#555;}
.qed label{display:block;font-weight:600;margin:10px 0 4px;color:#1a1f3a;}
.qed input[type=text],.qed input[type=number],.qed textarea{width:100%;font:inherit;padding:7px 8px;border:1px solid #b9bfd6;border-radius:6px;background:#fbfcff;color:#1a1f3a;}
.qed textarea{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;resize:vertical;}
.qed button{font:inherit;font-weight:600;cursor:pointer;background:#2b3a8c;color:#fff;border:0;border-radius:6px;padding:8px 14px;}
.qed button:hover{background:#3a4cae;}
.qed button.qed-sec{background:#eef0f8;color:#2b3a8c;border:1px solid #c7cce0;}
.qed button.qed-sec:hover{background:#e2e6f4;}
.qed button.qed-mini{padding:3px 8px;font-size:12px;background:#eef0f8;color:#2b3a8c;border:1px solid #c7cce0;}
.qed button.qed-mini:hover{background:#e2e6f4;}
.qed button.qed-x{padding:2px 8px;background:#fdeaea;color:#c0271e;border:1px solid #f3c6c2;}
.qed button.qed-x:hover{background:#f9d9d6;}
.qed .qed-row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;}
.qed .qed-row>*{margin:0;}
.qed .qed-grow{flex:1 1 160px;min-width:0;}
.qed .qed-size{width:78px;flex:0 0 auto;}
.qed .qed-hint{font-size:12px;color:#666;font-weight:400;}
.qed code{background:#eef0f8;padding:1px 5px;border-radius:4px;font-size:12px;}
.qed .qed-bank{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;padding:10px;background:#f4f6fc;border:1px solid #d7dcec;border-radius:8px;}
.qed .qed-bank select{flex:1 1 180px;min-width:0;padding:7px 8px;border:1px solid #b9bfd6;border-radius:6px;background:#fff;color:#1a1f3a;font:inherit;}
.qed .qed-block{border:1px solid #d7dcec;border-radius:8px;margin:10px 0;background:#fafbff;}
.qed .qed-block-head{display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #e4e8f4;}
.qed .qed-block-head .qed-grow{flex:1 1 auto;}
.qed .qed-block-num{font-weight:700;color:#2b3a8c;font-size:12px;letter-spacing:.04em;white-space:nowrap;}
.qed .qed-foot{padding:6px 8px 8px;display:flex;gap:8px;flex-wrap:wrap;}
.qed .qed-r{display:grid;gap:8px;align-items:start;padding:8px;border-top:1px solid #eef0f8;}
.qed .qed-r:first-child{border-top:0;}
.qed .qed-r textarea{min-height:46px;}
.qed .qed-colhead{display:grid;gap:8px;padding:2px 8px 0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8089a8;font-weight:700;}
.qed .qed-c-clue{grid-template-columns:1.4fr 1fr 70px auto;}
.qed .qed-c-ans{grid-template-columns:1fr 84px auto;}
.qed .qed-c-pans{grid-template-columns:1.3fr 66px 1.2fr auto;}
.qed .qed-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;align-items:center;}
.qed .qed-status{margin-top:10px;font-weight:600;white-space:pre-wrap;}
.qed .qed-status.ok{color:#0a7f3f;}
.qed .qed-status.bad{color:#c0271e;}
.qed details.qed-paste{margin:12px 0 0;border:1px solid #d7dcec;border-radius:8px;background:#f4f6fc;}
.qed details.qed-paste>summary{cursor:pointer;font-weight:600;color:#2b3a8c;padding:9px 12px;list-style:none;}
.qed details.qed-paste>summary::-webkit-details-marker{display:none;}
.qed details.qed-paste>summary::before{content:"▸ ";}
.qed details.qed-paste[open]>summary::before{content:"▾ ";}
.qed .qed-paste-body{padding:0 12px 12px;}
@media (max-width:560px){
  .qed .qed-r,.qed .qed-colhead{grid-template-columns:1fr !important;}
  .qed .qed-colhead{display:none;}
}
`;
    const el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  // el('button.qed-x', { type:'button' }, '✕')  ·  text via {text:'…'} or children
  function el(spec, attrs, ...kids) {
    const [tag, ...classes] = spec.split('.');
    const node = document.createElement(tag || 'div');
    if (classes.length) node.className = classes.join(' ');
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const kid of kids) if (kid != null) node.append(kid);
    return node;
  }

  // CSV / TSV: detects tab vs comma, honours "quoted, fields" with "" escapes.
  function parseTable(text) {
    const delim = text.includes('\t') ? '\t' : ',';
    const rows = [];
    let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some((x) => x.trim() !== '')) rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); if (row.some((x) => x.trim() !== '')) rows.push(row); }
    return rows;
  }

  function slug(s) {
    return (s || 'quiz').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'quiz';
  }

  const clone = (x) => JSON.parse(JSON.stringify(x));

  function mount(cfg) {
    injectStyles();
    const root = cfg.mount;
    if (!root) throw new Error('QuestionEditorKit.mount: missing mount element');
    const storageKey = cfg.storageKey;

    let model = cfg.blankModel();

    const bank = {
      list() { try { const a = JSON.parse(localStorage.getItem(storageKey)); return Array.isArray(a) ? a : []; } catch { return []; } },
      write(l) { try { localStorage.setItem(storageKey, JSON.stringify(l)); } catch { /* quota / private mode */ } },
    };

    // ---- shell ----
    const titleInput = el('input', { type: 'text', placeholder: cfg.titlePlaceholder || 'Name this set' });
    const bodyEl = el('div.qed-body');
    const status = el('div.qed-status', { role: 'status' });

    const bankSelect = el('select');
    const bankLoad = el('button.qed-mini', { type: 'button' }, 'Load');
    const bankDelete = el('button.qed-mini', { type: 'button' }, 'Delete');
    const bankNew = el('button.qed-mini', { type: 'button' }, 'Start blank');

    const pasteBox = el('textarea', { placeholder: cfg.pasteExample || '' });
    const pasteBtn = el('button', { type: 'button' }, 'Fill grid from this');
    const pasteHelp = typeof cfg.pasteHelp === 'string' ? el('p.qed-hint', { text: cfg.pasteHelp }) : cfg.pasteHelp;
    const pasteDetails = el('details.qed-paste', null,
      el('summary', { text: cfg.pasteSummary || 'Paste from a spreadsheet (Excel / Google Sheets / CSV)' }),
      el('div.qed-paste-body', null, pasteHelp, pasteBox, el('div', { style: 'margin-top:8px' }, pasteBtn))
    );

    const useBtn = el('button', { type: 'button' }, cfg.useLabel || 'Use this set ▶');
    const saveBtn = el('button.qed-sec', { type: 'button' }, '💾 Save to my sets');
    const exportBtn = el('button.qed-sec', { type: 'button' }, '⬇ Export JSON');

    const card = el('div.qed', null,
      el('h4', { text: cfg.heading || 'Build your own' }),
      cfg.lead ? el('p.qed-lead', { text: cfg.lead }) : null,
      el('div.qed-bank', null,
        el('div.qed-grow', null, el('label', { text: 'Your saved sets' }), bankSelect),
        bankLoad, bankDelete, bankNew
      ),
      el('label', { text: cfg.titleLabel || 'Set name' }), titleInput,
      bodyEl,
      pasteDetails,
      el('div.qed-actions', null, useBtn, saveBtn, exportBtn),
      status
    );
    root.replaceChildren(card);

    function setStatus(msg, kind) { status.textContent = msg || ''; status.className = 'qed-status' + (kind ? ' ' + kind : ''); }
    const title = () => titleInput.value.trim();

    // ---- helpers handed to the game's renderBody ----
    function bindText(obj, key, opts = {}) {
      const tag = opts.tag || 'input';
      const node = el(tag + (opts.cls ? '.' + opts.cls : ''), {
        placeholder: opts.placeholder, type: tag === 'input' ? (opts.type || 'text') : null,
        min: opts.min, max: opts.max,
      });
      if (obj[key] != null) node.value = obj[key];
      node.addEventListener('input', () => {
        if (opts.type === 'number') { const t = node.value.trim(); if (t === '') delete obj[key]; else obj[key] = Number(t); }
        else obj[key] = node.value;
      });
      return node;
    }
    function xBtn(title, onClick) { const b = el('button.qed-x', { type: 'button', title: title || 'Remove' }, '✕'); b.addEventListener('click', onClick); return b; }
    function miniBtn(label, onClick) { const b = el('button.qed-mini', { type: 'button' }, label); b.addEventListener('click', onClick); return b; }

    function rerender() {
      bodyEl.replaceChildren();
      cfg.renderBody(model, bodyEl, { el, bindText, xBtn, miniBtn, rerender });
    }

    function loadModel(m, t) { model = m; titleInput.value = t || ''; rerender(); }

    function data() { return cfg.toData(model, title()); }
    function validated() {
      const d = data();
      const res = cfg.validate ? cfg.validate(d) : { ok: true, data: d, summary: title() };
      if (!res || !res.ok) { setStatus('Can’t use this yet: ' + (res ? res.error : 'unknown error'), 'bad'); return null; }
      return { data: d, summary: res.summary };
    }

    function refreshBank() {
      const l = bank.list();
      bankSelect.replaceChildren();
      if (!l.length) {
        bankSelect.append(el('option', { value: '' }, 'No saved sets yet'));
        bankSelect.disabled = bankLoad.disabled = bankDelete.disabled = true;
      } else {
        bankSelect.disabled = bankLoad.disabled = bankDelete.disabled = false;
        l.forEach((e, i) => {
          let label = e.title || 'Untitled';
          if (cfg.summary) { try { label += ' (' + cfg.summary(e.model) + ')'; } catch { /* ignore */ } }
          bankSelect.append(el('option', { value: String(i) }, label));
        });
      }
    }

    // ---- events ----
    pasteBtn.addEventListener('click', () => {
      const text = pasteBox.value.trim();
      if (!text) { setStatus('Paste some rows first.', 'bad'); return; }
      const res = cfg.fromTable(parseTable(text), title());
      if (!res || res.error) { setStatus(res ? res.error : 'Couldn’t read that.', 'bad'); return; }
      loadModel(res.model, res.title != null ? res.title : title());
      setStatus('✓ ' + (res.note || 'Imported.') + ' Review below, then Use it.', 'ok');
    });

    useBtn.addEventListener('click', () => {
      const v = validated(); if (!v) return;
      try { cfg.onUse(v.data); } catch (e) { setStatus('Loaded, but installing failed: ' + e.message, 'bad'); return; }
      setStatus('✓ ' + v.summary + ' — ' + (cfg.useDoneHint || 'ready. Click Start.'), 'ok');
    });

    saveBtn.addEventListener('click', () => {
      const v = validated(); if (!v) return;
      const t = title() || 'Untitled';
      const list = bank.list();
      const i = list.findIndex((e) => (e.title || '') === t);
      const entry = { title: t, model: clone(model) };
      if (i >= 0) { if (!confirm(`Replace your saved set "${t}"?`)) return; list[i] = entry; }
      else list.push(entry);
      bank.write(list); refreshBank();
      setStatus(`✓ Saved "${t}" to this browser.`, 'ok');
    });

    exportBtn.addEventListener('click', () => {
      const v = validated(); if (!v) return;
      const blob = new Blob([JSON.stringify(v.data, null, 2)], { type: 'application/json' });
      const a = el('a', { href: URL.createObjectURL(blob), download: slug(title()) + '.json' });
      document.body.append(a); a.click(); a.remove();
      setStatus(`✓ Downloaded ${slug(title())}.json — keep it to reuse or share.`, 'ok');
    });

    bankLoad.addEventListener('click', () => {
      const e = bank.list()[parseInt(bankSelect.value, 10)];
      if (e) { loadModel(clone(e.model), e.title); setStatus(`Loaded "${e.title}" — edit it, then Use it.`, 'ok'); }
    });
    bankDelete.addEventListener('click', () => {
      const list = bank.list(); const i = parseInt(bankSelect.value, 10);
      if (!list[i]) return;
      if (!confirm(`Delete saved set "${list[i].title}"?`)) return;
      list.splice(i, 1); bank.write(list); refreshBank();
      setStatus('Deleted.', 'ok');
    });
    bankNew.addEventListener('click', () => { loadModel(cfg.blankModel(), ''); setStatus('', null); });

    // Load already-built game data (e.g. pasted from an AI or a file) into the
    // grid, by inverting the game's toData() via cfg.fromData(). Lets the AI and
    // import paths reuse this editor — review, tweak, save, export — instead of
    // loading straight into the game. Returns {ok} / {ok:false,error}.
    function loadData(data) {
      if (!cfg.fromData) return { ok: false, error: 'Editing imported questions isn’t supported here.' };
      let res;
      try { res = cfg.fromData(data); } catch (e) { return { ok: false, error: e.message }; }
      if (!res || res.error) return { ok: false, error: res ? res.error : 'Couldn’t read that.' };
      loadModel(res.model, res.title != null ? res.title : '');
      setStatus('✓ Loaded into the editor below — review it, then “💾 Save to my sets” to keep it, ' +
        'or “' + (cfg.useLabel || 'Use this set ▶') + '” to play.', 'ok');
      return { ok: true };
    }

    refreshBank();
    rerender();

    return { reset() { setStatus('', null); }, loadModel, setStatus, loadData };
  }

  global.QuestionEditorKit = { mount, parseTable, slug, el };
})(window);
