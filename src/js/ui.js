/* ============================================================================
 * ui.js — DOM helpers, sliders, code drawer, result panel, tables
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});
  const M = RL.Math;
  const U = {};

  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  U.el = function (tag, attrs, html) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'dataset') Object.assign(n.dataset, attrs[k]);
        else if (k === 'style') n.style.cssText = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      }
    }
    if (html != null) n.innerHTML = html;
    return n;
  };

  U.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };
  U.escape = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  U.highlight = function (code, lang) {
    const isJS = lang === 'js';
    return String(code).split('\n').map(line => {
      let comment = '';
      const marker = isJS ? '//' : '#';
      const idx = line.indexOf(marker);
      if (idx >= 0) {
        comment = line.slice(idx);
        line = line.slice(0, idx);
      }
      let h = U.escape(line);
      h = h.replace(/\b(const|let|var|for|if|else|return|function|repeat|until|while|in|of|new|class)\b/g,
        '<span class="kw">$1</span>');
      h = h.replace(/\b(\d+(?:\.\d+)?(?:e[-+]?\d+)?)\b/gi, '<span class="num">$1</span>');
      if (comment) h += '<span class="cm">' + U.escape(comment) + '</span>';
      return h;
    }).join('\n');
  };

  /* ------------------------------- Slider -------------------------------- */
  U.makeSlider = function (cfg) {
    const row = U.el('div', { class: 'slider-row' });
    const label = U.el('label', {}, cfg.label);
    const input = U.el('input', {
      type: 'range', min: cfg.min, max: cfg.max, step: cfg.step, value: cfg.value,
      'aria-label': cfg.label,
    });
    const out = U.el('output', {}, cfg.format ? cfg.format(cfg.value) : String(cfg.value));
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      out.textContent = cfg.format ? cfg.format(v) : String(v);
      cfg.onInput(v);
    });
    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(out);
    row._input = input;
    row._output = out;
    row._set = (v) => {
      input.value = v;
      out.textContent = cfg.format ? cfg.format(v) : String(v);
    };
    return row;
  };

  U.buildSliders = function (container, defs, values, onChange) {
    U.clear(container);
    const handles = {};
    defs.forEach(def => {
      const row = U.makeSlider({
        label: def.label,
        min: def.min, max: def.max, step: def.step,
        value: values[def.key],
        format: (v) => (def.key === 'rho' ? v.toFixed(2) : v.toFixed(2)),
        onInput: (v) => { values[def.key] = v; onChange(def.key, v); },
      });
      container.appendChild(row);
      handles[def.key] = row;
    });
    return handles;
  };

  U.bindSegmented = function (container, onChange) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || !container.contains(btn)) return;
      U.$$('button', container).forEach(b => b.classList.toggle('active', b === btn));
      onChange(btn.dataset.mode || btn.dataset.space || btn.dataset.tab);
    });
  };

  /* ------------------------------- Formula ------------------------------- */
  U.formula = function (id) {
    const svg = (global.RL_FORMULAS || {})[id];
    if (svg) return svg;
    return '<span class="mono" style="font-size:12px;color:#98a2b3">[' + U.escape(id) + ']</span>';
  };
  U.insertFormula = function (node, id) { node.innerHTML = U.formula(id); };

  /* ----------------------------- Code drawer ----------------------------- */
  let codeState = { id: null, tab: 'pseudo' };

  U.openCode = function (id) {
    const item = (RL.PSEUDO || {})[id];
    if (!item) return;
    codeState = { id, tab: 'pseudo' };
    U.$('#codeTitle').textContent = item.title;
    U.$('#codeNote').textContent = item.note || '与页面实际计算一致';
    const tabs = U.$('#codeTabs');
    const jsBtn = tabs.querySelector('[data-tab="js"]');
    if (item.js) jsBtn.style.display = ''; else jsBtn.style.display = 'none';
    U.$$('button', tabs).forEach(b => b.classList.toggle('active', b.dataset.tab === 'pseudo'));
    renderCode();
    const dlg = U.$('#codeDialog');
    if (!dlg.open) dlg.showModal();
  };

  function renderCode() {
    const item = (RL.PSEUDO || {})[codeState.id];
    if (!item) return;
    const code = codeState.tab === 'js' ? item.js : item.pseudo;
    U.$('#codeBody').innerHTML = U.highlight(code, codeState.tab);
  }

  U.initCodeDialog = function () {
    const tabs = U.$('#codeTabs');
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      codeState.tab = btn.dataset.tab;
      U.$$('button', tabs).forEach(b => b.classList.toggle('active', b === btn));
      renderCode();
    });
    U.$('#copyCode').addEventListener('click', async () => {
      const item = (RL.PSEUDO || {})[codeState.id];
      const code = codeState.tab === 'js' ? item && item.js : item && item.pseudo;
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        U.toast('已复制');
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = code; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove(); U.toast('已复制');
      }
    });
    U.$$('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = U.$('#' + btn.dataset.close);
        if (d) d.close();
      });
    });
    U.$$('dialog').forEach(d => {
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    });
  };

  /* -------------------------------- Toast -------------------------------- */
  U.toast = function (msg) {
    let t = U.$('#toast');
    if (!t) {
      t = U.el('div', { id: 'toast', style: 'position:fixed;left:50%;bottom:48px;transform:translateX(-50%);background:#101828;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;z-index:99;opacity:0;transition:opacity .2s;pointer-events:none' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 1400);
  };

  /* ----------------------------- Result panel ---------------------------- */
  U.setResult = function (r) {
    U.$('#resMethod').textContent = r.method;
    const badge = U.$('#resBadge');
    badge.textContent = r.badge || '近似';
    badge.className = 'badge ' + (r.badgeClass || '');
    U.$('#resBeta').textContent = M.fmt.beta(r.beta);
    U.$('#resPf').textContent = M.fmt.pct(r.pf, 3);
    U.$('#resR').textContent = M.fmt.pct(1 - r.pf, 3);
    U.$('#resNote').textContent = r.note || '';
  };

  U.setCompare = function (main, active, mc) {
    const rows = [
      { key: 'mv', name: 'MVFOSM', sub: '均值点', beta: main.mv.beta, pf: main.mv.pf },
      { key: 'af', name: 'AFOSM', sub: main.af.failed ? 'X 空间 回退' : 'X 空间 ≡', beta: main.af.beta, pf: main.af.pf },
      { key: 'form', name: 'FORM', sub: 'U 空间 ≡', beta: main.form.beta, pf: main.form.pf },
      { key: 'sorm', name: 'SORM', sub: '曲率', beta: main.form.beta, pf: main.sorm.pf },
      { key: 'mc', name: 'MC', sub: mc ? (mc.ref ? '参考 N=4×10⁶' : '本次 N=' + mc.n.toLocaleString()) : '站台 7', beta: null, pf: mc ? mc.pf : null },
      { key: 'exact', name: '精确', sub: '积分', beta: null, pf: main.exact },
    ];
    let html = '<table class="compare-table"><thead><tr><th>方法</th><th>β</th><th>Pf</th></tr></thead><tbody>';
    const MCOL = RL.Charts.C.method;
    const colors = { mv: MCOL.mvfosm, af: MCOL.afosm, form: MCOL.form, sorm: MCOL.sorm, mc: MCOL.mc, exact: MCOL.exact };
    for (const r of rows) {
      html += '<tr class="' + (active === r.key ? 'active' : '') + '">' +
        '<td><span class="m-dot" style="background:' + colors[r.key] + '"></span>' + r.name + '<span class="sub">' + r.sub + '</span></td>' +
        '<td>' + (r.beta == null ? '—' : M.fmt.beta(r.beta)) + '</td>' +
        '<td>' + (r.pf == null ? '—' : M.fmt.pct(r.pf, 2)) + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '<div class="tiny muted" style="margin-top:6px">AFOSM 与 FORM 在正态变量下是同一设计点（≡）；SORM 的 β 不变，只修正 Pf。MC 为本次抽样或站台 7 现场结果。</div>';
    U.$('#compareTable').innerHTML = html;
  };

  U.setNotes = function (items) {
    U.$('#notesBody').innerHTML = '<ul>' + items.map(s => '<li>' + s + '</li>').join('') + '</ul>';
  };

  /* ---------------------------- Iteration table -------------------------- */
  U.hlrfTable = function (history, active, onClick) {
    let html = '<table class="compare-table" style="font-size:11px">' +
      '<thead><tr><th>k</th><th>u₁</th><th>u₂</th><th>β</th><th>g</th></tr></thead><tbody>';
    history.forEach((h, i) => {
      html += '<tr class="' + (i === active ? 'active' : '') + '" data-k="' + i + '" style="cursor:pointer">' +
        '<td>' + h.k + '</td>' +
        '<td>' + h.u[0].toFixed(3) + '</td>' +
        '<td>' + h.u[1].toFixed(3) + '</td>' +
        '<td>' + h.beta.toFixed(3) + '</td>' +
        '<td>' + (Math.abs(h.g) < 1e-2 ? h.g.toExponential(1) : h.g.toFixed(2)) + '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
  };

  U.afTable = function (history, active, onClick) {
    let html = '<table class="compare-table" style="font-size:11px">' +
      '<thead><tr><th>k</th><th>x₁</th><th>x₂</th><th>β</th><th>g</th></tr></thead><tbody>';
    history.forEach((h, i) => {
      html += '<tr class="' + (i === active ? 'active' : '') + '" data-k="' + i + '" style="cursor:pointer">' +
        '<td>' + (h.k + 1) + '</td>' +
        '<td>' + h.x[0].toFixed(3) + '</td>' +
        '<td>' + h.x[1].toFixed(3) + '</td>' +
        '<td>' + h.beta.toFixed(3) + '</td>' +
        '<td>' + (Math.abs(h.g) < 1e-2 ? h.g.toExponential(1) : h.g.toFixed(2)) + '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
  };

  U.pfBars = function (items, exact) {
    const min = Math.log10(0.001), max = Math.log10(0.1);
    let html = '<div class="method-legend">' +
      items.map(it => '<span><i style="background:' + it.color + '"></i>' + it.name + '</span>').join('') +
      '</div>';
    for (const it of items) {
      const p = Math.max(1e-6, it.pf);
      const w = Math.max(2, Math.min(100, (Math.log10(p) - min) / (max - min) * 100));
      html += '<div class="pf-row">' +
        '<div class="pf-label" style="color:' + it.color + '">' + it.name + '</div>' +
        '<div class="pf-beta">' + (it.beta == null ? 'β —' : 'β ' + M.fmt.beta(it.beta)) + '</div>' +
        '<div class="pf-track"><div class="pf-fill" style="width:' + w + '%;--c:' + it.color + '"></div>' +
        (exact ? '<div class="pf-exact" style="left:' + Math.max(0, Math.min(100, (Math.log10(exact) - min) / (max - min) * 100)) + '%"></div>' : '') +
        '</div>' +
        '<div class="pf-value">' + M.fmt.pct(it.pf, 2) + '</div></div>';
    }
    return html;
  };

  /* ------------------------------- Self-test ----------------------------- */
  U.runSelfTest = function () {
    const body = U.$('#selfTestBody');
    if (!body) return;
    const res = RL.Model.selfTest();
    const pass = res.filter(r => r.ok).length;
    body.innerHTML = '<div class="st-row" style="font-weight:700"><span>结果</span><span class="' +
      (pass === res.length ? 'st-pass' : 'st-fail') + '">' + pass + ' / ' + res.length + ' 通过</span></div>' +
      res.map(r => '<div class="st-row"><span>' + U.escape(r.name) + '</span><span class="' +
        (r.ok ? 'st-pass' : 'st-fail') + '">' + (r.ok ? 'PASS' : 'FAIL') + '</span></div>').join('');
    U.toast(pass === res.length ? '数值自检全部通过' : '有 ' + (res.length - pass) + ' 项失败');
  };

  RL.UI = U;
})(typeof window !== 'undefined' ? window : globalThis);
