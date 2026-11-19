/* ============================================================================
 * app.js — state, navigation, parameters, keyboard shortcuts, URL, boot
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = global.RL;
  const M = RL.Math;
  const U = RL.UI;
  const S = RL.Stations;
  const $ = U.$;
  const $$ = U.$$;

  const state = {
    station: 0,
    params: Object.assign({}, S.DEFAULT_PARAMS),
    intf: Object.assign({}, S.DEFAULT_INTF),
    transformStep: 0,
    transformMode: 'chol',
    hlrStep: 0,
    afStep: 0,
    mcSpace: 'x',
    mc: null,
    mcRng: null,
    sormExag: false,
    sormCircle: false,
    playing: null,
    projector: false,
    tanBeta: 2.108,
    tanKappa: 0.5,
    tanCase: 'linear',
    allSpace: 'x',
    allView: null,
    autoDemo: true,
    autoPlayed: {},
  };

  const app = {
    state,
    main: null,
    setStation(i) {
      S.activate(i);
      try {
        const url = new URL(location.href);
        url.searchParams.set('station', String(i));
        url.searchParams.delete('selftest');
        history.replaceState(null, '', url.toString());
      } catch (e) { /* may not be allowed under file://; ignore */ }
    },
    recompute() {
      this.main = RL.Model.computeMain(state.params);
      S.onMainChanged();
    },
    refresh() { S.refresh(); },
  };

  /* ----------------------------- Error banner ---------------------------- */
  function showError(msg) {
    let b = $('#errorBanner');
    if (!b) {
      b = U.el('div', {
        id: 'errorBanner',
        style: 'position:fixed;left:0;right:0;top:0;z-index:9999;background:#b42318;color:#fff;padding:8px 14px;font-size:12px;font-family:monospace;white-space:pre-wrap',
      });
      document.body.prepend(b);
    }
    b.textContent = '页面脚本错误：' + msg;
  }
  global.addEventListener('error', (e) => {
    const msg = e.message || String(e.error);
    if (/ResizeObserver loop/i.test(msg)) return; // browser layout-loop warning, not a page computation error
    showError(msg);
  });
  global.addEventListener('unhandledrejection', (e) => showError(String(e.reason)));

  /* ----------------------------- Navigation ------------------------------ */
  function buildRail() {
    const rail = $('#rail');
    rail.innerHTML = '';
    let group = '';
    for (const s of S.STATIONS) {
      if (s.group !== group) {
        group = s.group;
        rail.appendChild(U.el('div', { class: 'rail-group-label' }, group));
      }
      const b = U.el('button', {
        class: 'rail-btn', type: 'button', dataset: { station: String(s.n) },
        'aria-label': s.n + ' ' + s.title,
      });
      b.innerHTML = '<span class="rail-num">' + s.n + '</span>' +
        '<span class="rail-text"><span class="rail-title">' + s.title + '</span>' +
        '<span class="rail-sub">' + s.sub + '</span></span>';
      b.addEventListener('click', () => app.setStation(s.n));
      rail.appendChild(b);
    }
  }

  /* ----------------------------- Parameters ------------------------------ */
  function buildParamControls() {
    const defs = RL.Model.EXAMPLES.parabola.vars;
    U.buildSliders($('#paramControls'), defs, state.params, () => app.recompute());
  }

  /* -------------------------------- Reset -------------------------------- */
  function resetAll() {
    state.params = Object.assign({}, S.DEFAULT_PARAMS);
    state.transformStep = 0;
    state.transformMode = 'chol';
    state.sormExag = false;
    state.sormCircle = false;
    state.mcSpace = 'x';
    state.playing = null;
    state.tanBeta = 2.108;
    state.tanKappa = 0.5;
    state.tanCase = 'linear';
    state.allSpace = 'x';
    state.allView = null;
    const tb = $('#tanBeta'), tk = $('#tanKappa');
    if (tb) tb.value = '2.108';
    if (tk) tk.value = '0.5';
    const tbv = $('#tanBetaVal'), tkv = $('#tanKappaVal');
    if (tbv) tbv.textContent = '2.108';
    if (tkv) tkv.textContent = '0.50';
    const tct = $('#tanCaseToggle');
    if (tct) $$('#tanCaseToggle button').forEach(b => b.classList.toggle('active', b.dataset.case === 'linear'));
    const ast = $('#allSpaceToggle');
    if (ast) $$('#allSpaceToggle button').forEach(b => b.classList.toggle('active', b.dataset.space === 'x'));
    setProjector(false, true);
    buildParamControls();
    const tm = $('#transMode');
    if (tm) $$('button', tm).forEach(b => b.classList.toggle('active', b.dataset.mode === 'chol'));
    const se = $('#sormExag'), sc = $('#sormCircle');
    if (se) se.checked = false;
    if (sc) sc.checked = false;
    const mt = $('#mcSpaceToggle');
    if (mt) $$('button', mt).forEach(b => b.classList.toggle('active', b.dataset.space === 'x'));
    const mb = $('#mcBatch'), mtg = $('#mcTarget');
    if (mb) mb.value = '1000';
    if (mtg) mtg.value = '100000';
    app.main = RL.Model.computeMain(state.params);
    S.onMainChanged();
    if (S.resetIntf) S.resetIntf();
    if (RL.Custom) RL.Custom.reset();
    app.setStation(0);
    U.toast('已恢复默认参数');
  }

  /* ---------------------------- Projector mode --------------------------- */
  function setProjector(on, silent) {
    state.projector = !!on;
    document.body.classList.toggle('projector', state.projector);
    RL.Charts.setFontScale(state.projector ? 1.4 : (document.body.classList.contains('mobile') ? 1.05 : 1));
    const btn = $('#btnProjector');
    if (btn) btn.textContent = state.projector ? '退出投影' : '投影';
    if (S && S.refresh) S.refresh();
    if (!silent && !state._urlUpdating) {
      try {
        const url = new URL(location.href);
        url.searchParams.set('projector', state.projector ? '1' : '0');
        history.replaceState(null, '', url.toString());
      } catch (e) { /* may not be allowed under file:// */ }
    }
  }

  /* ------------------------------ Route ---------------------------------- */
  const ROUTE = [
    { min: 3, n: 0, d: '默认参数下先给几个数：4.80 / 1.75 / 1.65 / 1.63 / 1.62%' },
    { min: 6, n: 1, d: 'X→U 逐步变换，β 是距离' },
    { min: 7, n: 3, d: '均值点切线；换写法 β 会变' },
    { min: 5, n: 4, d: 'AFOSM 方向搜索；与 FORM 同设计点' },
    { min: 8, n: 5, d: 'HLRF 单步 6 次；α² 贡献' },
    { min: 5, n: 6, d: '默认参数下 SORM 曲率修正；1.750→1.647' },
    { min: 5, n: 7, d: 'MC 抽样；CI 验证 FORM' },
    { min: 4, n: 2, d: '概率干涉：重叠 ≠ Pf' },
    { min: 2, n: 8, d: '公式卡收束' },
  ];

  function buildRoute() {
    const list = $('#routeList');
    list.innerHTML = ROUTE.map(r =>
      '<li data-station="' + r.n + '"><span class="rt-time">' + r.min + ' min</span>' +
      '<span class="rt-station">' + r.n + ' · ' + S.STATIONS[r.n].title + '</span> ' +
      '<span class="rt-desc">' + r.d + '</span></li>').join('');
    list.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-station]');
      if (!li) return;
      app.setStation(+li.dataset.station);
      $('#routeDialog').close();
    });
  }

  /* ----------------------------- Keyboard -------------------------------- */
  function isTyping(e) {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (isTyping(e)) return;
      const k = e.key;
      if (k === 'ArrowRight') {
        e.preventDefault();
        app.setStation(Math.min(S.STATIONS.length - 1, state.station + 1));
      } else if (k === 'ArrowLeft') {
        e.preventDefault();
        app.setStation(Math.max(0, state.station - 1));
      } else if (/^[0-9]$/.test(k)) {
        e.preventDefault();
        app.setStation(+k);
      } else if (k === 'c' || k === 'C') {
        e.preventDefault();
        app.setStation(10);
      } else if (k === ' ') {
        e.preventDefault();
        S.playPause();
      } else if (k === 's' || k === 'S') {
        e.preventDefault();
        S.stepActive();
      } else if (k === 'r' || k === 'R') {
        e.preventDefault();
        resetAll();
      } else if (k === 'f' || k === 'F') {
        e.preventDefault();
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
      } else if (k === '?') {
        e.preventDefault();
        $('#helpDialog').showModal();
      }
    });
  }

  /* --------------------------- Mobile adaptation ------------------------- */
  function applyViewportMode(redraw) {
    const mq = global.matchMedia ? global.matchMedia('(max-width: 760px), (max-height: 500px) and (pointer: coarse)') : null;
    const mobile = !!(mq && mq.matches);
    document.body.classList.toggle('mobile', mobile);
    if (!state.projector) RL.Charts.setFontScale(mobile ? 1.05 : 1);
    if (redraw && S && S.refresh) S.refresh();
  }

  /* -------------------------------- Boot --------------------------------- */
  function boot() {
    if (RL.I18N) RL.I18N.init();
    const qs = new URLSearchParams(location.search);
    for (const def of RL.Model.EXAMPLES.parabola.vars) {
      const v = parseFloat(qs.get(def.key));
      if (isFinite(v)) state.params[def.key] = Math.max(def.min, Math.min(def.max, v));
    }
    const intfDefs = [
      ['muR', 20, 40], ['muS', 5, 25], ['sR', 1, 8], ['sS', 1, 8],
    ];
    for (const [key, lo, hi] of intfDefs) {
      const v = parseFloat(qs.get(key));
      if (isFinite(v)) state.intf[key] = Math.max(lo, Math.min(hi, v));
    }
    app.main = RL.Model.computeMain(state.params);
    state.hlrStep = app.main.form.history.length - 1;
    state.afStep = app.main.af.history.length ? app.main.af.history.length - 1 : 0;
    buildRail();
    buildParamControls();
    S.init(app);
    applyViewportMode(false);
    if (global.matchMedia) {
      const mq = global.matchMedia('(max-width: 760px), (max-height: 500px) and (pointer: coarse)');
      const onChange = () => applyViewportMode(true);
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    buildRoute();

    $('#btnReset').addEventListener('click', resetAll);
    $('#runSelfTest').addEventListener('click', () => U.runSelfTest());
    $('#seedText').textContent = 'MC seed ' + S.MC_SEED;

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-code]');
      if (b && b.dataset.code) U.openCode(b.dataset.code);
    });

    bindKeys();

    const st = parseInt(qs.get('station'), 10);
    const tr = parseInt(qs.get('trans'), 10);
    const hl = parseInt(qs.get('hlr'), 10);
    const af = parseInt(qs.get('af'), 10);
    const mcN = parseInt(qs.get('mc'), 10);
    const mode = qs.get('mode');
    if (qs.get('projector') === '1') setProjector(true, true);
    if (isFinite(tr)) state.transformStep = Math.max(0, Math.min(3, tr));
    if (isFinite(hl)) state.hlrStep = Math.max(0, Math.min(app.main.form.history.length - 1, hl));
    if (isFinite(af)) state.afStep = app.main.af.history.length
      ? Math.max(0, Math.min(app.main.af.history.length - 1, af))
      : 0;
    if (mode === 'pca' || mode === 'chol') {
      state.transformMode = mode;
      const tm = $('#transMode');
      if (tm) U.$$('button', tm).forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    }
    if (isFinite(mcN) && mcN > 0) {
      const target = Math.max(1000, Math.min(100000, mcN));
      const mtg = $('#mcTarget');
      if (mtg) mtg.value = String(target);
      while (!state.mc || state.mc.n < target) {
        S.addMc(Math.min(2000, target - (state.mc ? state.mc.n : 0)), true);
      }
    }
    app.setStation(isFinite(st) ? Math.max(0, Math.min(S.STATIONS.length - 1, st)) : 0);
    state.autoDemo = qs.get('auto') !== '0';
    // When a link pins a specific step, do not let autoplay overwrite that step.
    if (isFinite(hl) || isFinite(af)) state.autoDemo = false;
    const asp = qs.get('allspace');
    if (asp && ['x', 'y', 'z', 'u'].indexOf(asp) >= 0) {
      state.allSpace = asp;
      app.setStation(9);
      const ast = $('#allSpaceToggle');
      if (ast) $$('#allSpaceToggle button').forEach(b => b.classList.toggle('active', b.dataset.space === asp));
    }
    if (qs.get('transplay') === '1') {
      app.setStation(1);
      setTimeout(() => S.playTransform(), 350);
    }
    const code = qs.get('code');
    if (code) setTimeout(() => U.openCode(code), 180);
    if (qs.get('selftest') === '1') {
      $('#helpDialog').showModal();
      setTimeout(() => U.runSelfTest(), 120);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
