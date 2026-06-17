/**
 * Shared segmented-tabs controller for the "Make your own quiz" panel.
 *
 * Turns markup like
 *
 *   <div class="maketabs" role="tablist">
 *     <button class="maketabs__tab is-active" role="tab" data-panel="mk-write">…</button>
 *     <button class="maketabs__tab"           role="tab" data-panel="mk-ai">…</button>
 *   </div>
 *   <div id="mk-write" class="maketabs__panel is-active" role="tabpanel">…</div>
 *   <div id="mk-ai"    class="maketabs__panel" role="tabpanel" hidden>…</div>
 *
 * into equal-weight tabs: each button shows its `data-panel` element and hides
 * the rest. Pure DOM toggling — the tools inside each panel are mounted
 * separately and don't care whether their panel is visible.
 *
 * Self-initialising: wires every `.maketabs` group on the page. Left/Right (and
 * Up/Down) arrow keys move between tabs, matching the WAI-ARIA tabs pattern.
 *
 * Exposes window.MakeTabs.show(panelId) so other code can switch tabs — e.g. the
 * AI/import paths jump to the editor tab after loading questions into it.
 */
(function () {
  'use strict';

  const groups = [];

  function initGroup(tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[data-panel]'));
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.dataset.panel);
        if (panel) {
          panel.classList.toggle('is-active', on);
          panel.hidden = !on;
        }
      });
    }

    groups.push({ tabs, select });

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        if (j == null) return;
        e.preventDefault();
        tabs[j].focus();
        select(tabs[j]);
      });
    });

    select(tabs.find((t) => t.classList.contains('is-active')) || tabs[0]);
  }

  function init() {
    document.querySelectorAll('.maketabs').forEach(initGroup);
  }

  // Programmatically activate the tab whose panel has this id.
  function show(panelId) {
    for (const g of groups) {
      const tab = g.tabs.find((t) => t.dataset.panel === panelId);
      if (tab) { g.select(tab); tab.focus(); return true; }
    }
    return false;
  }

  window.MakeTabs = { show };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
