/**
 * Shared "Load your own questions" helper for the classroom games.
 *
 * Renders, into a mount element on a game's HOST screen:
 *   1. A copyable AI prompt   (copy prompt → paste into an AI → paste JSON back)
 *   2. A file picker AND a paste box
 *   3. A validator that either loads the game or shows a precise error
 *
 * Everything runs in the browser (FileReader / JSON.parse) — no server,
 * no CORS, works even from file://. A bad load only affects that attempt;
 * nothing is uploaded, committed, or shared.
 *
 * Usage:
 *   const ui = CustomQuestions.mount({
 *     mount: document.getElementById('custom-questions'),
 *     mode: 'all',           // 'ai' (prompt + paste-back) · 'import' (file) · 'all'
 *     promptText: '...the AI prompt...',
 *     readyHint: 'Click Start to play.',
 *     validate(parsed) {
 *       // return { ok: true, data, summary } or { ok: false, error: 'why' }
 *     },
 *     onLoad(data) { ...install the validated data into the game... },
 *   });
 *   ui.reset();   // clear inputs + status (e.g. on "new game")
 *
 * Validators can use the CustomQuestions.ok / CustomQuestions.err helpers.
 */
(function (global) {
  'use strict';

  const ok = (data, summary) => ({ ok: true, data, summary });
  const err = (error) => ({ ok: false, error });

  let stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const css = `
.cq{font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#fff;color:#1a1f3a;border:1px solid #c7cce0;border-radius:10px;padding:14px;margin-top:10px;text-align:left;}
.cq *{box-sizing:border-box;}
.cq p{margin:0 0 8px;color:#444;}
.cq label{display:block;font-weight:600;margin:12px 0 4px;color:#1a1f3a;}
.cq textarea{width:100%;min-height:80px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;padding:8px;border:1px solid #b9bfd6;border-radius:6px;resize:vertical;background:#fbfcff;color:#1a1f3a;}
.cq .cq-prompt-text{min-height:150px;}
.cq input[type=file]{display:block;margin:4px 0;color:#1a1f3a;}
.cq button{font:inherit;font-weight:600;cursor:pointer;background:#2b3a8c;color:#fff;border:0;border-radius:6px;padding:8px 14px;margin-top:6px;}
.cq button:hover{background:#3a4cae;}
.cq .cq-or{display:block;margin:12px 0 0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:.06em;}
.cq .cq-status{margin-top:12px;font-weight:600;white-space:pre-wrap;}
.cq .cq-status.cq-ok{color:#0a7f3f;}
.cq .cq-status.cq-bad{color:#c0271e;}
.cq .cq-copy-status{margin-left:8px;font-size:12px;color:#0a7f3f;font-weight:600;}
.cq details{margin:4px 0;}
.cq summary{cursor:pointer;font-weight:600;color:#1a1f3a;}
`;
    const el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  // Tiny DOM builder: el('button.cq-copy', { type: 'button' }, 'Copy prompt')
  function el(spec, attrs, ...children) {
    const [tag, ...classes] = spec.split('.');
    const node = document.createElement(tag || 'div');
    if (classes.length) node.className = classes.join(' ');
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v != null) node.setAttribute(k, v);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      node.append(child);
    }
    return node;
  }

  async function copyText(text, fallbackEl) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API can be blocked (e.g. file://) — fall back to selecting.
      try {
        fallbackEl.focus();
        fallbackEl.select();
        return document.execCommand('copy');
      } catch {
        return false;
      }
    }
  }

  function mount(opts) {
    injectStyles();
    const root = opts.mount;
    if (!root) throw new Error('CustomQuestions.mount: missing mount element');

    // Which halves to show. 'ai' = copy-a-prompt + paste it back, 'import' =
    // load a .json file, 'all' (default) = both, the original combined card.
    const mode = opts.mode || 'all';
    const showAI = mode === 'ai' || mode === 'all';
    const showImport = mode === 'import' || mode === 'all';

    const statusEl = el('div.cq-status', { role: 'status' });

    // AI half — copy a prompt, paste back the JSON the AI returns.
    let promptEl = null, copyBtn = null, copyStatus = null, pasteEl = null, loadBtn = null;
    if (showAI) {
      promptEl = el('textarea.cq-prompt-text', { readonly: '' });
      promptEl.value = opts.promptText || '';
      copyBtn = el('button.cq-copy', { type: 'button' }, 'Copy prompt');
      copyStatus = el('span.cq-copy-status');
      pasteEl = el('textarea.cq-paste', { placeholder: 'Paste the JSON here…' });
      loadBtn = el('button.cq-load-btn', { type: 'button' }, 'Load pasted JSON');
    }

    // Import half — load a .json file you already have.
    let fileEl = null;
    if (showImport) {
      fileEl = el('input.cq-file', { type: 'file', accept: '.json,application/json' });
    }

    const kids = [];
    if (showAI) {
      kids.push(
        el('p', null, showImport
          ? 'Generate a question set with an AI, then load it here. Nothing is uploaded — it stays in this browser.'
          : 'Copy the prompt, paste it into ChatGPT, Claude, or any AI, then paste the JSON it returns. Nothing is uploaded — it stays in this browser.'),
        el('details', mode === 'ai' ? { open: '' } : null,
          el('summary', null, 'Step 1 — copy an AI prompt'),
          el('p', null, 'Paste this into ChatGPT, Claude, or any AI. Replace the bracketed parts, then copy the JSON it returns.'),
          promptEl, copyBtn, copyStatus
        ),
        el('label', null, showImport ? 'Step 2 — load the JSON' : 'Step 2 — paste the JSON it gives you')
      );
    } else {
      kids.push(
        el('p', null, 'Already have a question file (.json)? Choose it here. Nothing is uploaded — it stays in this browser.'),
        el('label', null, 'Choose a file')
      );
    }
    if (showImport) kids.push(fileEl);
    if (showAI) {
      if (showImport) kids.push(el('span.cq-or', null, '— or paste it —'));
      kids.push(pasteEl, loadBtn);
    }
    kids.push(statusEl);

    const card = el('div.cq', null, ...kids);
    root.replaceChildren(card);

    function setStatus(message, kind) {
      statusEl.textContent = message;
      statusEl.className = 'cq-status' + (kind ? ' cq-' + kind : '');
    }

    function handleText(text, sourceLabel) {
      const trimmed = (text || '').trim();
      if (!trimmed) {
        setStatus('Nothing to load — pick a file or paste some JSON first.', 'bad');
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch (e) {
        setStatus(`That isn't valid JSON: ${e.message}\n(Tip: paste only the JSON, with no extra text or code fences.)`, 'bad');
        return;
      }

      let result;
      try {
        result = opts.validate(parsed);
      } catch (e) {
        setStatus(`Couldn't read that file: ${e.message}`, 'bad');
        return;
      }

      if (!result || !result.ok) {
        setStatus(`Couldn't use that file: ${result ? result.error : 'unknown error'}`, 'bad');
        return;
      }

      try {
        opts.onLoad(result.data);
      } catch (e) {
        setStatus(`Loaded, but something went wrong installing it: ${e.message}`, 'bad');
        return;
      }

      const from = sourceLabel ? ` (from ${sourceLabel})` : '';
      const hint = opts.readyHint ? `\n${opts.readyHint}` : '';
      setStatus(`✓ ${result.summary}${from}.${hint}`, 'ok');
    }

    if (showAI) {
      copyBtn.addEventListener('click', async () => {
        const okCopy = await copyText(promptEl.value, promptEl);
        copyStatus.textContent = okCopy ? 'Copied!' : 'Press Ctrl/Cmd+C to copy';
        setTimeout(() => { copyStatus.textContent = ''; }, 2500);
      });
      loadBtn.addEventListener('click', () => handleText(pasteEl.value, null));
    }

    if (showImport) {
      fileEl.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => handleText(ev.target.result, file.name);
        reader.onerror = () => setStatus(`Couldn't read the file: ${reader.error}`, 'bad');
        reader.readAsText(file);
      });
    }

    function reset() {
      if (fileEl) fileEl.value = '';
      if (pasteEl) pasteEl.value = '';
      setStatus('', null);
    }

    return { reset };
  }

  global.CustomQuestions = { mount, ok, err };
})(window);
