/* ============================================================================
 * custom.js — station 10: custom limit-state function
 * Takes g(x1,x2) and computes MVFOSM / FORM(HLRF) / SORM / MC on the fly for two correlated normal variables.
 * No third-party libraries; expressions are parsed with a recursive-descent parser instead of eval.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});
  const M = RL.Math;
  const Ch = RL.Charts;
  const U = RL.UI;
  const C = Ch ? Ch.C : {};

  const DEFAULT = { mu1: 10, mu2: 20, s1: 2, s2: 5, rho: 0.5 };
  const DEFS = [
    { key: 'mu1', sym: 'μ₁', label: 'μ₁  X₁均值', value: 10, min: -5, max: 25, step: 0.1 },
    { key: 'mu2', sym: 'μ₂', label: 'μ₂  X₂均值', value: 20, min: -5, max: 35, step: 0.1 },
    { key: 's1', sym: 'σ₁', label: 'σ₁  X₁标准差', value: 2, min: 0.5, max: 6, step: 0.05 },
    { key: 's2', sym: 'σ₂', label: 'σ₂  X₂标准差', value: 5, min: 0.5, max: 8, step: 0.1 },
    { key: 'rho', sym: 'ρ', label: 'ρ 相关系数', value: 0.5, min: -0.9, max: 0.9, step: 0.01 },
  ];
  const METHOD_DEFS = [
    { key: 'mvfosm', label: 'MVFOSM 均值点', color: C.method ? C.method.mvfosm : '#ff7f0e' },
    { key: 'form', label: 'FORM / AFOSM', color: C.method ? C.method.form : '#d62728' },
    { key: 'sorm', label: 'SORM 曲率修正', color: C.method ? C.method.sorm : '#2ca02c' },
    { key: 'mc', label: 'MC 模拟参考', color: C.method ? C.method.mc : '#9467bd' },
  ];
  const EXAMPLES = [
    { name: '抛物线（默认）', expr: 'x1^2 - 2*x2' },
    { name: '线性', expr: 'x1 + x2 - 30' },
    { name: '圆外', expr: '20 - sqrt(x1^2 + x2^2)' },
    { name: '乘积', expr: 'x1*x2 - 50' },
    { name: '正弦', expr: 'sin(x1) + x2 - 19' },
    { name: '正弦（多失效区）', expr: 'sin(x1) + 2*cos(x2) + 1' },
  ];

  /* --------------------------- Expression parser ------------------------- */
  const FUNCS = {
    sin: { n: 1, f: Math.sin }, cos: { n: 1, f: Math.cos }, tan: { n: 1, f: Math.tan },
    asin: { n: 1, f: Math.asin }, acos: { n: 1, f: Math.acos }, atan: { n: 1, f: Math.atan },
    atan2: { n: 2, f: Math.atan2 },
    exp: { n: 1, f: Math.exp }, log: { n: 1, f: Math.log }, ln: { n: 1, f: Math.log },
    sqrt: { n: 1, f: Math.sqrt }, abs: { n: 1, f: Math.abs },
    sinh: { n: 1, f: Math.sinh }, cosh: { n: 1, f: Math.cosh }, tanh: { n: 1, f: Math.tanh },
    floor: { n: 1, f: Math.floor }, ceil: { n: 1, f: Math.ceil },
    min: { n: -1, f: Math.min }, max: { n: -1, f: Math.max }, pow: { n: 2, f: Math.pow },
  };
  const CONSTS = { pi: Math.PI, e: Math.E };

  function tokenize(src) {
    const out = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i));
        if (!m) throw new Error('数字格式错误');
        out.push({ t: 'num', v: parseFloat(m[0]), pos: i });
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
        out.push({ t: 'id', v: m[0], pos: i });
        i += m[0].length;
        continue;
      }
      if ('+-*/^(),'.indexOf(ch) >= 0) { out.push({ t: ch, pos: i }); i++; continue; }
      throw new Error('不能识别的字符 “' + ch + '”');
    }
    out.push({ t: 'end', pos: src.length });
    return out;
  }

  function parseExpression(src) {
    const tk = tokenize(src);
    let pos = 0, nodes = 0;
    const peek = () => tk[pos];
    const take = (t) => {
      if (tk[pos].t !== t) throw new Error('这里需要 “' + t + '”');
      return tk[pos++];
    };
    function expr() {
      let n = term();
      while (peek().t === '+' || peek().t === '-') {
        const op = tk[pos++].t;
        n = { t: 'bin', op, a: n, b: term() };
      }
      return n;
    }
    function term() {
      let n = unary();
      while (peek().t === '*' || peek().t === '/') {
        const op = tk[pos++].t;
        n = { t: 'bin', op, a: n, b: unary() };
      }
      return n;
    }
    function unary() {
      if (peek().t === '+') { pos++; return unary(); }
      if (peek().t === '-') { pos++; return { t: 'neg', a: unary() }; }
      return power();
    }
    function power() {
      const a = primary();
      if (peek().t === '^') { pos++; return { t: 'bin', op: '^', a, b: unary() }; }
      return a;
    }
    function primary() {
      if (nodes++ > 240) throw new Error('表达式太复杂');
      const tok = tk[pos];
      if (tok.t === 'num') { pos++; return { t: 'num', v: tok.v }; }
      if (tok.t === '(') {
        pos++; const n = expr(); take(')'); return n;
      }
      if (tok.t === 'id') {
        pos++;
        const name = tok.v;
        if (peek().t === '(') {
          const f = FUNCS[name];
          if (!f) throw new Error('未知函数 “' + name + '”');
          pos++;
          const args = [];
          if (peek().t !== ')') {
            while (true) {
              args.push(expr());
              if (peek().t === ',') { pos++; continue; }
              break;
            }
          }
          take(')');
          if (f.n >= 0 && args.length !== f.n) throw new Error('函数 ' + name + ' 需要 ' + f.n + ' 个参数');
          return { t: 'fn', name, args };
        }
        if (name === 'x1' || name === 'x2') return { t: 'var', name };
        if (Object.prototype.hasOwnProperty.call(CONSTS, name)) return { t: 'const', name };
        throw new Error('未知变量 “' + name + '”');
      }
      throw new Error('表达式不完整');
    }
    const ast = expr();
    if (peek().t !== 'end') throw new Error('多余的内容 “' + tk[pos].v + '”');
    return ast;
  }

  function evalAst(n, x1, x2) {
    try {
      switch (n.t) {
        case 'num': return n.v;
        case 'var': return n.name === 'x1' ? x1 : x2;
        case 'const': return CONSTS[n.name];
        case 'neg': return -evalAst(n.a, x1, x2);
        case 'bin': {
          const a = evalAst(n.a, x1, x2), b = evalAst(n.b, x1, x2);
          if (n.op === '+') return a + b;
          if (n.op === '-') return a - b;
          if (n.op === '*') return a * b;
          if (n.op === '/') return a / b;
          return Math.pow(a, b);
        }
        case 'fn': {
          const a = n.args.map(z => evalAst(z, x1, x2));
          return FUNCS[n.name].f.apply(null, a);
        }
      }
    } catch (e) { return NaN; }
    return NaN;
  }

  /* ------------------------ Numerical differentiation -------------------- */
  function makeExample(g) {
    const grad = (x) => {
      const out = [0, 0];
      for (let i = 0; i < 2; i++) {
        const h = Math.max(1e-5, Math.abs(x[i]) * 1e-4);
        const xp = x.slice(), xm = x.slice();
        xp[i] += h; xm[i] -= h;
        const gp = g(xp), gm = g(xm);
        if (isFinite(gp) && isFinite(gm)) out[i] = (gp - gm) / (2 * h);
        else {
          const g0 = g(x);
          out[i] = isFinite(gp) ? (gp - g0) / h : (isFinite(gm) ? (g0 - gm) / h : NaN);
        }
      }
      return out;
    };
    const hess = (x) => {
      const h1 = Math.max(1e-4, Math.abs(x[0]) * 2e-4);
      const h2 = Math.max(1e-4, Math.abs(x[1]) * 2e-4);
      const xpp = [x[0] + h1, x[1]], xmm = [x[0] - h1, x[1]];
      const ypp = [x[0], x[1] + h2], ymm = [x[0], x[1] - h2];
      const f00 = g(x);
      const fxx = (g(xpp) - 2 * f00 + g(xmm)) / (h1 * h1);
      const fyy = (g(ypp) - 2 * f00 + g(ymm)) / (h2 * h2);
      const fxy = (g([x[0] + h1, x[1] + h2]) - g([x[0] + h1, x[1] - h2]) -
        g([x[0] - h1, x[1] + h2]) + g([x[0] - h1, x[1] - h2])) / (4 * h1 * h2);
      return [[fxx, fxy], [fxy, fyy]];
    };
    return {
      name: 'custom', short: 'g(x₁,x₂)', g, grad, hess,
      x2Of(x1) { return 0; },
    };
  }

  /* ------------------------------- MC ---------------------------------- */
  function runMC(g, p, N) {
    const mu = [p.mu1, p.mu2];
    const T = RL.Model.transform(p, 'chol');
    const L = T.L;
    let seed = 20261119 >>> 0;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed + 0.5) / 4294967296; };
    let spare = null;
    const normal = () => {
      if (spare != null) { const z = spare; spare = null; return z; }
      let u = 0, v = 0;
      while (u <= 1e-12) u = rnd();
      v = rnd();
      const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
    let fails = 0;
    for (let i = 0; i < N; i++) {
      const z1 = normal(), z2 = normal();
      const x1 = mu[0] + L[0][0] * z1;
      const x2 = mu[1] + L[1][0] * z1 + L[1][1] * z2;
      const gv = g([x1, x2]);
      if (isFinite(gv) && gv < 0) fails++;
    }
    const pf = fails / N;
    const se = Math.sqrt(Math.max(0, pf * (1 - pf) / N));
    return {
      n: N, fails, pf, se,
      ci: 1.96 * se,
      beta: pf > 0 && pf < 1 ? -M.normInv(pf) : (pf === 0 ? Infinity : -Infinity),
    };
  }

  /* ------------------------------- State -------------------------------- */
  const custom = {
    params: Object.assign({}, DEFAULT),
    methods: { mvfosm: true, form: true, sorm: true, mc: true },
    expr: 'x1^2 - 2*x2',
    last: null,
    error: '',
    plot: null,
    app: null,
    timer: 0,
  };

  function $(id) { return document.getElementById(id); }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function setHTML(id, html) { const el = $(id); if (el) el.innerHTML = html; }

  function notify() {
    if (RL.Stations && typeof RL.Stations.refreshInspector === 'function' && custom.app &&
        custom.app.state && custom.app.state.station === 10) {
      RL.Stations.refreshInspector();
    }
  }

  function parseAndCompute() {
    const expr = ($('customExpr') || {}).value || custom.expr;
    custom.expr = expr.trim();
    let ast;
    try {
      ast = parseExpression(custom.expr);
    } catch (e) {
      custom.error = e.message;
      custom.last = null;
      setText('customExprMsg', '解析错误：' + e.message);
      setHTML('customTable', '<div class="tiny" style="color:#b42318">先修好函数表达式。</div>');
      setHTML('customNote', '表达式错误：' + escapeHtml(e.message));
      setText('customStatus', '表达式错误');
      draw();
      notify();
      return;
    }
    custom.error = '';
    setText('customExprMsg', '');
    const g = (x) => evalAst(ast, x[0], x[1]);
    const ex = makeExample(g);
    const p = Object.assign({}, custom.params);
    const last = { expr: custom.expr, ast, g, ex, p, mv: null, form: null, sorm: null, mc: null };

    try { last.mv = RL.Model.mvfosm(ex, p); } catch (e) { last.mv = null; }
    try {
      const f = RL.Model.hlr(ex, p, { maxit: 45, tol: 1e-7 });
      if (f && isFinite(f.beta) && isFinite(f.pf) && f.beta >= 0 && f.beta < 80) last.form = f;
    } catch (e) { last.form = null; }
    if (custom.methods.sorm && last.form) {
      try {
        const s = RL.Model.sorm(ex, p, last.form);
        if (s && isFinite(s.pf)) last.sorm = s;
      } catch (e) { last.sorm = null; }
    }
    if (custom.methods.mc) {
      try { last.mc = runMC(g, p, 100000); } catch (e) { last.mc = null; }
    }
    custom.last = last;
    setText('customStatus', '已计算 · ' + (last.form ? 'β=' + M.fmt.beta(last.form.beta) : 'FORM 未收敛'));
    updateTable();
    draw();
    notify();
  }

  function scheduleCompute(delay) {
    clearTimeout(custom.timer);
    custom.timer = setTimeout(parseAndCompute, delay == null ? 180 : delay);
  }

  function updateTable() {
    const last = custom.last;
    if (!last) return;
    const rows = [];
    const dot = (color) => '<span class="m-dot" style="background:' + color + '"></span>';
    if (custom.methods.mvfosm && last.mv) {
      rows.push('<tr><td>' + dot(C.method.mvfosm) + '<b>MVFOSM</b></td><td class="num">' +
        M.fmt.beta(last.mv.beta) + '</td><td class="num">' + M.fmt.pct(last.mv.pf, 3) +
        '</td><td class="tiny muted">均值点切线</td></tr>');
    }
    if (custom.methods.form) {
      if (last.form) {
        rows.push('<tr><td>' + dot(C.method.form) + '<b>FORM / AFOSM</b></td><td class="num">' +
          M.fmt.beta(last.form.beta) + '</td><td class="num">' + M.fmt.pct(last.form.pf, 3) +
          '</td><td class="tiny muted">HLRF · x*=(' + last.form.xStar.map(v => v.toFixed(2)).join(', ') + ')</td></tr>');
      } else {
        rows.push('<tr><td>' + dot(C.method.form) + '<b>FORM / AFOSM</b></td><td class="num">—</td><td class="num">—</td><td class="tiny" style="color:#b42318">未收敛/无设计点</td></tr>');
      }
    }
    if (custom.methods.sorm && last.sorm) {
      rows.push('<tr><td>' + dot(C.method.sorm) + '<b>SORM</b></td><td class="num">' +
        M.fmt.beta(last.form.beta) + '</td><td class="num">' + M.fmt.pct(last.sorm.pf, 3) +
        '</td><td class="tiny muted">κ=' + last.sorm.kappa.toFixed(4) + (last.sorm.valid ? '' : ' · 不适用') + '</td></tr>');
    }
    if (custom.methods.mc && last.mc) {
      rows.push('<tr><td>' + dot(C.method.mc) + '<b>MC 参考</b></td><td class="num">' +
        (isFinite(last.mc.beta) ? M.fmt.beta(last.mc.beta) : '—') + '</td><td class="num">' +
        M.fmt.pct(last.mc.pf, 3) + '</td><td class="tiny muted">N=' + last.mc.n.toLocaleString() +
        ' · 95% CI ±' + M.fmt.pct(last.mc.ci, 3) + '</td></tr>');
    }
    if (!rows.length) rows.push('<tr><td colspan="4" class="tiny muted">至少勾选一种方法。</td></tr>');
    setHTML('customTable',
      '<table class="compare-table"><thead><tr><th>方法</th><th>β</th><th>P<sub>f</sub></th><th>备注</th></tr></thead><tbody>' +
      rows.join('') + '</tbody></table>' +
      '<div class="tiny muted" style="margin-top:5px">FORM/SORM 只取一个设计点；多失效区或强非线性时以 MC 为参考。</div>');
  }

  function inView(q, xlim, ylim) {
    return q[0] >= xlim[0] && q[0] <= xlim[1] && q[1] >= ylim[0] && q[1] <= ylim[1];
  }

  // Count 4-connected components of the failure domain; used to flag "multiple failure regions, a single design point may not be representative"
  function countFailComponents(vals, NX, NY) {
    const seen = new Uint8Array(vals.length);
    let comps = 0;
    const w = NX + 1;
    for (let k = 0; k < vals.length; k++) {
      if (!(vals[k] < 0) || seen[k]) continue;
      comps++;
      seen[k] = 1;
      const stack = [k];
      while (stack.length) {
        const p = stack.pop();
        const j = Math.floor(p / w), i = p % w;
        const nb = [];
        if (i > 0) nb.push(p - 1);
        if (i < NX) nb.push(p + 1);
        if (j > 0) nb.push(p - w);
        if (j < NY) nb.push(p + w);
        for (const q of nb) {
          if (vals[q] < 0 && !seen[q]) { seen[q] = 1; stack.push(q); }
        }
      }
    }
    return comps;
  }

  function drawMessage(text) {
    const plot = custom.plot;
    if (!plot) return;
    if (plot.w < 50) plot.resize();
    plot.opts.equal = false;
    plot.setRange([0, 1], [0, 1]);
    plot.begin();
    const ctx = plot.ctx, r = plot.rect();
    ctx.fillStyle = '#b42318'; ctx.font = '13px "Microsoft YaHei UI", sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2);
    plot.end();
  }

  function draw() {
    try {
      drawNow();
    } catch (e) {
      if (global.console) console.error(e);
      setText('customStatus', '绘图错误：' + e.message);
      drawMessage('绘图错误：' + e.message);
    }
  }

  function drawNow() {
    const plot = custom.plot;
    if (!plot) return;
    const last = custom.last;
    if (!last) { drawMessage(custom.error || '输入函数后点“计算”'); return; }
    if (plot.w < 50) plot.resize();
    const p = last.p, mu = [p.mu1, p.mu2];
    const s1 = p.s1, s2 = p.s2;
    let xmin = mu[0] - 4.2 * s1, xmax = mu[0] + 4.2 * s1;
    let ymin = mu[1] - 4.2 * s2, ymax = mu[1] + 4.2 * s2;
    const inc = (q) => {
      if (!q || !isFinite(q[0]) || !isFinite(q[1])) return;
      xmin = Math.min(xmin, q[0]); xmax = Math.max(xmax, q[0]);
      ymin = Math.min(ymin, q[1]); ymax = Math.max(ymax, q[1]);
    };
    inc(mu);
    if (last.form) inc(last.form.xStar);
    if (last.mv) inc(last.mv.xL);
    const padX = Math.max(0.4, (xmax - xmin) * 0.12);
    const padY = Math.max(0.4, (ymax - ymin) * 0.12);
    xmin -= padX; xmax += padX; ymin -= padY; ymax += padY;
    if (xmax - xmin < 1) { xmin -= 0.5; xmax += 0.5; }
    if (ymax - ymin < 1) { ymin -= 0.5; ymax += 0.5; }

    plot.opts.equal = false;
    plot.opts.xlabel = 'X₁';
    plot.opts.ylabel = 'X₂';
    plot.opts.axisBold = true;
    plot.opts.xTickTarget = 8;
    plot.opts.yTickTarget = 6;
    plot.setRange([xmin, xmax], [ymin, ymax]);
    plot.begin(); plot.grid();

    // Failure domain: row-by-row scanline fill
    const NX = 220, NY = 160;
    const ctx = plot.ctx, r = plot.rect();
    const sx = (x) => plot.sx(x), sy = (y) => plot.sy(y);
    ctx.save();
    ctx.fillStyle = C.failure || 'rgba(214,39,40,0.075)';
    const dy = (ymax - ymin) / NY;
    for (let j = 0; j < NY; j++) {
      const y = ymin + (j + 0.5) * dy;
      let start = null, prevX = xmin;
      for (let i = 0; i <= NX; i++) {
        const x = xmin + (xmax - xmin) * i / NX;
        const v = last.g([x, y]);
        const fail = isFinite(v) && v < 0;
        if (fail && start === null) start = x;
        if (!fail && start !== null) {
          const X = sx(start), W = sx(prevX) - X;
          const Y = sy(y + dy / 2), H = Math.abs(sy(y - dy / 2) - sy(y + dy / 2)) + 1;
          if (W > 0) ctx.fillRect(X, Y, W, H);
          start = null;
        }
        prevX = x;
      }
      if (start !== null) {
        const X = sx(start), W = sx(xmax) - X;
        const Y = sy(y + dy / 2), H = Math.abs(sy(y - dy / 2) - sy(y + dy / 2)) + 1;
        if (W > 0) ctx.fillRect(X, Y, W, H);
      }
    }
    ctx.restore();

    // Limit-state surface g=0: grid + marching squares
    const vals = new Float32Array((NX + 1) * (NY + 1));
    let anyFail = false, anySafe = false;
    for (let j = 0; j <= NY; j++) {
      const y = ymin + (ymax - ymin) * j / NY;
      for (let i = 0; i <= NX; i++) {
        const x = xmin + (xmax - xmin) * i / NX;
        const v = last.g([x, y]);
        vals[j * (NX + 1) + i] = isFinite(v) ? v : NaN;
        if (isFinite(v)) { if (v < 0) anyFail = true; else anySafe = true; }
      }
    }
    const components = countFailComponents(vals, NX, NY);
    last.components = components;
    if (components > 1) {
      setText('customStatus', '多失效区（' + components + ' 块）：FORM/SORM 只取一个设计点');
    }
    const edgePoint = (v1, v2, p1, p2) => {
      const t = v1 / (v1 - v2);
      return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
    };
    ctx.save();
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let j = 0; j < NY; j++) {
      const y0 = ymin + (ymax - ymin) * j / NY;
      const y1 = ymin + (ymax - ymin) * (j + 1) / NY;
      for (let i = 0; i < NX; i++) {
        const x0 = xmin + (xmax - xmin) * i / NX;
        const x1 = xmin + (xmax - xmin) * (i + 1) / NX;
        const v00 = vals[j * (NX + 1) + i];
        const v10 = vals[j * (NX + 1) + i + 1];
        const v01 = vals[(j + 1) * (NX + 1) + i];
        const v11 = vals[(j + 1) * (NX + 1) + i + 1];
        if (![v00, v10, v01, v11].every(isFinite)) continue;
        const pts = [];
        if ((v00 >= 0) !== (v10 >= 0)) pts.push(edgePoint(v00, v10, [x0, y0], [x1, y0]));
        if ((v10 >= 0) !== (v11 >= 0)) pts.push(edgePoint(v10, v11, [x1, y0], [x1, y1]));
        if ((v11 >= 0) !== (v01 >= 0)) pts.push(edgePoint(v11, v01, [x1, y1], [x0, y1]));
        if ((v01 >= 0) !== (v00 >= 0)) pts.push(edgePoint(v01, v00, [x0, y1], [x0, y0]));
        if (pts.length >= 2) {
          const X0 = sx(pts[0][0]), Y0 = sy(pts[0][1]);
          const X1 = sx(pts[1][0]), Y1 = sy(pts[1][1]);
          ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y1);
          if (pts.length >= 4) {
            ctx.moveTo(sx(pts[2][0]), sy(pts[2][1]));
            ctx.lineTo(sx(pts[3][0]), sy(pts[3][1]));
          }
        }
      }
    }
    ctx.stroke();
    ctx.restore();

    // Equal-probability ellipses
    const T = RL.Model.transform(p, 'chol');
    const L = T.L;
    const ellipse = (rad) => {
      const pts = [];
      for (let k = 0; k <= 90; k++) {
        const a = k / 90 * Math.PI * 2;
        pts.push([
          mu[0] + L[0][0] * rad * Math.cos(a),
          mu[1] + L[1][0] * rad * Math.cos(a) + L[1][1] * rad * Math.sin(a),
        ]);
      }
      return pts;
    };
    for (const rr of [1, 2, 3]) plot.line(ellipse(rr), { color: '#cbd5e1', width: 1, dash: [4, 4], alpha: 0.7 });
    if (last.form && last.form.beta > 0 && last.form.beta < 20) {
      plot.line(ellipse(last.form.beta), { color: C.purple, width: 1.6, dash: [5, 3], alpha: 0.9 });
    }

    // Two tangents: mean point / design point
    const tangent = (g0, gr, color, label) => {
      const pts = [];
      if (!gr || !isFinite(gr[0]) || !isFinite(gr[1])) return;
      if (Math.abs(gr[1]) > 1e-8) {
        const xv = label === 'mv' ? mu[0] : last.form.xStar[0];
        const yv = label === 'mv' ? mu[1] : last.form.xStar[1];
        pts.push([xmin, yv - (g0 + gr[0] * (xmin - xv)) / gr[1]]);
        pts.push([xmax, yv - (g0 + gr[0] * (xmax - xv)) / gr[1]]);
      } else {
        const xv = label === 'mv' ? mu[0] : last.form.xStar[0];
        pts.push([xv, ymin], [xv, ymax]);
      }
      plot.line(pts, { color, width: 1.6, dash: [7, 4], alpha: 0.95 });
    };
    if (last.mv) {
      tangent(last.mv.muG, last.mv.gradX, C.method.mvfosm, 'mv');
    }
    if (last.form) {
      const gx = last.ex.grad(last.form.xStar);
      tangent(last.ex.g(last.form.xStar), gx, C.method.form, 'form');
    }

    // Points: these Plot methods take data coordinates; do not convert to pixels first
    plot.square(mu[0], mu[1], 6, C.method.mvfosm);
    plot.star(last.form ? last.form.xStar[0] : mu[0], last.form ? last.form.xStar[1] : mu[1], 10, C.method.form);
    if (last.mv) plot.diamond(last.mv.xL[0], last.mv.xL[1], 5.5, C.method.mvfosm);
    plot.end(); plot.axes();

    // Annotations / legend
    const viewX = [xmin, xmax], viewY = [ymin, ymax];
    if (inView(mu, viewX, viewY)) plot.tag(mu[0], mu[1], '均值 μ', { dx: 8, dy: -22, size: 10, color: C.method.mvfosm, border: '#f0d5b0' });
    if (last.mv && inView(last.mv.xL, viewX, viewY)) plot.tag(last.mv.xL[0], last.mv.xL[1], 'MVFOSM x_L', { dx: 8, dy: 16, size: 10, color: C.method.mvfosm, border: '#f0d5b0' });
    if (last.form && inView(last.form.xStar, viewX, viewY)) plot.tag(last.form.xStar[0], last.form.xStar[1], '设计点 x*', { dx: -12, dy: -22, align: 'right', size: 10, color: C.method.form, border: '#f0c2c2' });
    if (!anyFail || !anySafe) {
      const noSurface = !anyFail
        ? '当前视窗内 g>0：没有失效域 / 没有 g=0'
        : '当前视窗内 g<0：全部失效 / 没有 g=0';
      setText('customStatus', noSurface);
      plot.tag((xmin + xmax) / 2, (ymin + ymax) / 2, noSurface, {
        dx: 0, dy: 0, size: 11, color: '#8a4b00', border: '#f0d5b0', bg: 'rgba(255,250,240,.94)',
      });
    }
    plot.legend([
      { type: 'line', color: C.blue, label: '极限状态面 g=0' },
      { type: 'line', color: C.purple, label: 'β 等概率椭圆', dash: [5, 3] },
      { type: 'line', color: C.method.mvfosm, label: 'MVFOSM 切线', dash: [7, 4] },
      { type: 'line', color: C.method.form, label: 'FORM 切线', dash: [7, 4] },
    ], { x: plot.rect().x + 9, y: plot.rect().y + 9 });
    setHTML('customNote',
      '<span class="mono">g = ' + escapeHtml(last.expr) + '</span> · 曲线和失效域由现场网格计算；' +
      (last.form ? '设计点 (' + last.form.xStar.map(v => v.toFixed(3)).join(', ') + ')' : 'FORM 未收敛') +
      (last.components > 1 ? ' · 检测到多失效区：单设计点 FORM/SORM 只是局部近似，请以 MC 为参考。' : ''));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function getResult() {
    const last = custom.last;
    if (!last) return null;
    const multi = last.components > 1 ? ' 检测到多失效区：单设计点近似可能不代表性，请以 MC 为参考。' : '';
    if (custom.methods.form && last.form) {
      return { method: 'FORM / AFOSM', badge: '近似', beta: last.form.beta, pf: last.form.pf, note: '自定义 g；HLRF 设计点。' + multi };
    }
    if (custom.methods.sorm && last.sorm) {
      return { method: 'SORM', badge: '近似', beta: last.form.beta, pf: last.sorm.pf, note: '自定义 g；曲率修正。' + multi };
    }
    if (custom.methods.mc && last.mc) {
      return { method: 'MC', badge: '模拟', beta: last.mc.beta, pf: last.mc.pf, note: 'N=' + last.mc.n.toLocaleString() + '。' + multi };
    }
    if (custom.methods.mvfosm && last.mv) {
      return { method: 'MVFOSM', badge: '近似', beta: last.mv.beta, pf: last.mv.pf, note: '自定义 g；均值点切线。' + multi };
    }
    return null;
  }

  function buildUI() {
    U.buildSliders($('customParams'), DEFS, custom.params, () => scheduleCompute());
    const expr = $('customExpr');
    if (expr) {
      expr.value = custom.expr;
      expr.addEventListener('input', () => scheduleCompute(420));
      expr.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); parseAndCompute(); } });
    }
    const apply = $('customApply');
    if (apply) apply.addEventListener('click', () => parseAndCompute());
    for (const b of document.querySelectorAll('[data-custom-expr]')) {
      b.addEventListener('click', () => {
        custom.expr = b.dataset.customExpr;
        if (expr) expr.value = custom.expr;
        parseAndCompute();
      });
    }
    for (const def of METHOD_DEFS) {
      const cb = $('customM-' + def.key);
      if (cb) {
        cb.checked = !!custom.methods[def.key];
        cb.addEventListener('change', () => { custom.methods[def.key] = cb.checked; parseAndCompute(); });
      }
    }
    const reset = $('customReset');
    if (reset) reset.addEventListener('click', () => {
      custom.params = Object.assign({}, DEFAULT);
      custom.methods = { mvfosm: true, form: true, sorm: true, mc: true };
      custom.expr = 'x1^2 - 2*x2';
      const e = $('customExpr'); if (e) e.value = custom.expr;
      for (const d of METHOD_DEFS) { const cb = $('customM-' + d.key); if (cb) cb.checked = true; }
      buildUI();
      parseAndCompute();
    });
  }

  function init(appRef) {
    custom.app = appRef;
    const canvas = $('customCanvas');
    if (!canvas || !Ch) return;
    custom.plot = new Ch.Plot(canvas, { pad: { l: 54, r: 18, t: 18, b: 44 } });
    custom.plot.redraw = draw;
    const qs = new URLSearchParams(location.search);
    const fn = qs.get('fn');
    if (fn) custom.expr = fn;
    for (const def of DEFS) {
      const v = parseFloat(qs.get(def.key));
      if (isFinite(v)) custom.params[def.key] = Math.max(def.min, Math.min(def.max, v));
    }
    buildUI();
    parseAndCompute();
  }

  function activate() {
    if (!custom.plot) return;
    custom.plot.resize();
    if (!custom.last) parseAndCompute();
    draw();
    notify();
    requestAnimationFrame(() => {
      if (custom.plot) custom.plot.resize();
      draw();
    });
  }

  function reset() {
    custom.params = Object.assign({}, DEFAULT);
    custom.methods = { mvfosm: true, form: true, sorm: true, mc: true };
    custom.expr = 'x1^2 - 2*x2';
    if (!custom.plot) return;
    const e = $('customExpr'); if (e) e.value = custom.expr;
    for (const d of METHOD_DEFS) { const cb = $('customM-' + d.key); if (cb) cb.checked = true; }
    U.buildSliders($('customParams'), DEFS, custom.params, () => scheduleCompute());
    parseAndCompute();
  }

  RL.Custom = {
    init, activate, draw, reset, getResult, parseAndCompute,
    get state() { return custom; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
