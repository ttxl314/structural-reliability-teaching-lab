/* ============================================================================
 * stations.js — drawing, interaction and animation for the 10 stations
 * Depends on math.js / model.js / charts.js / ui.js / pseudocode.js / formulas.js
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});
  const M = RL.Math;
  const U = RL.UI;
  const Ch = RL.Charts;
  const C = Ch.C;
  const $ = U.$;
  const $$ = U.$$;

  const STATIONS = [
    { n: 0, key: 'overview', title: '总览', sub: '同一道题，不同答案', group: '看全貌' },
    { n: 1, key: 'transform', title: '变量与变换', sub: 'X → U，一步一步', group: '看几何' },
    { n: 2, key: 'interference', title: '概率干涉', sub: 'R 与 S 的重叠', group: '看几何' },
    { n: 3, key: 'mvfosm', title: '均值一次二阶矩', sub: '均值点切线', group: '看方法' },
    { n: 4, key: 'afosm', title: '改进的一次二阶矩', sub: 'X 空间方向搜索', group: '看方法' },
    { n: 5, key: 'form', title: 'FORM / HLRF', sub: 'U 空间切线-垂足', group: '看方法' },
    { n: 6, key: 'sorm', title: 'SORM', sub: '曲率修正 Pf', group: '看方法' },
    { n: 7, key: 'mc', title: '蒙特卡洛', sub: '大样本基准', group: '看方法' },
    { n: 8, key: 'formulas', title: '公式与代码', sub: '一页总结', group: '收束' },
    { n: 9, key: 'all-methods', title: '同图与切线误差', sub: '所有方法 + 凸凹对比', group: '收束' },
    { n: 10, key: 'custom', title: '自定义函数', sub: '输入 g，现场算', group: '实验' },
  ];

  const DEFAULT_PARAMS = { mu1: 10, mu2: 20, s1: 2, s2: 5, rho: 0.5 };
  const DEFAULT_INTF = { muR: 30, muS: 15, sR: 4, sS: 3 };
  const MC_REF = { ref: true, n: 4000000, fails: 65121, pf: 0.01628025, se: 0.00006328 };
  const MC_SEED = 20261119;

  const NOTES = {
    0: ['默认参数下，4.80% 与 1.62% 不是算错，是假设不同。', 'AFOSM 与 FORM 是同一设计点的两种走法，数值相同。', 'MC 是基准，不是“更高级的答案”。'],
    1: ['X 空间的欧氏距离没有概率意义：单位、方差、相关性都不同。', '中心化去位置，标准化去量纲，白化去相关。', '白化后等概率线是圆，β 才是“到原点的距离”。'],
    2: ['f_R 与 f_S 的重叠面积不是 Pf，只是直观示意。', '真正的 Pf 是 ∫ f_S(s) F_R(s) ds。', 'R、S 独立正态时，g=R−S 正态，Pf=Φ(−β) 精确。'],
    3: ['只在均值点取一阶泰勒；对线性 g、正态 X 精确。', '非线性强时，切线离验算点远，误差大。', '换个代数写法，β 会变——方法本身不具有不变性。'],
    4: ['每一步沿当前 α 定射线，再沿射线解 g=0。', '和 FORM 收敛到同一设计点，但迭代路径不同。', '第一跳可能“过冲”，随后在验算点附近摆回来。'],
    5: ['每一步：当前点切线 → 原点到切线的垂足。', '第 1 步的垂足正好是均值点法的 U_L。', 'α² 是变量对 β 的方差贡献；默认参数下 X1 占 83.6%。'],
    6: ['β 不变，SORM 只修正 Pf 的换算。', 'κ 的符号约定要讲清；本页 n 指向安全域。', 'SORM 仍用 FORM 的验算点，不重新找点。'],
    7: ['误差 ∝ 1/√N；Pf 越小，需要 N 越大。', '95% CI 是抽样误差，不是模型误差。', '固定种子可复现；换种子会变。'],
    8: ['方法没有绝对好坏，只有假设是否匹配。', '线性 g + 正态 X：MVFOSM=AFOSM=FORM=精确。', '非线性 g：FORM 一阶，SORM 二阶，MC 基准。'],
    9: ['同图里 MVFOSM 的切线在均值点，AFOSM=FORM 的切线在设计点，SORM 是设计点附近的抛物线。', 'Φ(−β) 只对半空间严格；边界越弯，β 与 Pf 的换算误差越大。', '极端“圆外失效”下直线切线会低估 Pf 一个数量级。'],
    10: ['这里是自己输入 g(x₁,x₂) 的计算器：曲线、失效域、β、Pf 都是现算的。', 'FORM/AFOSM 需要梯度，页面用有限差分；SORM 再用数值 Hessian。', '任意函数没有“精确值”；MC 是参考，注意相对误差和适用条件。'],
  };

  const FORMULA_SECTIONS = [
    {
      title: '基础与换算', sub: 'Pf、β、Φ',
      items: [
        { title: '失效概率', id: 'pf_def', note: '定义：对失效域做多维积分；一般算不出来，才需要近似或模拟。' },
        { title: 'β 与 Pf', id: 'pf_beta', note: '半空间/线性边界下严格；非线性时，Pf=Φ(−β) 是 FORM 近似。' },
      ],
    },
    {
      title: '空间变换', sub: 'X → Y → Z → U',
      items: [
        { title: '原始空间', id: 'trans_x', note: '相关正态；均值 μ，协方差 C。' },
        { title: '中心化', id: 'trans_center', note: '把均值移到原点；形状不变。' },
        { title: '标准化', id: 'trans_scale', note: '除以标准差；ρ=0 时椭圆变正圆。' },
        { title: '白化', id: 'trans_whiten', note: '乘 L⁻¹ 去相关；等概率线变同心圆。' },
        { title: 'PCA 写法', id: 'pca', note: '与 Cholesky 只差一个正交旋转；β、Pf 不变。' },
        { title: '等概率椭圆', id: 'ellipse', note: 'X 空间的 β 椭圆；主轴是 C 的特征向量。' },
      ],
    },
    {
      title: '均值一次二阶矩', sub: 'MVFOSM / 中心点法',
      items: [
        { title: '一阶泰勒', id: 'mvfosm_lin', note: '只在均值点展开；非线性强时误差大。' },
        { title: '均值与方差', id: 'mvfosm_moments', note: 'σ_g 要带交叉项；默认参数下交叉项 −400。' },
        { title: '可靠指标与 Pf', id: 'mvfosm_beta', note: '线性 g、正态 X 时精确；否则是近似。' },
      ],
    },
    {
      title: '改进的一次二阶矩', sub: 'AFOSM / 验算点法',
      items: [
        { title: '方向余弦', id: 'afosm_dir', note: 'α 指向验算点；沿 d=Lα 找边界。' },
        { title: '沿射线求 β', id: 'afosm_beta', note: '一维求根；与 FORM 同一设计点。' },
      ],
    },
    {
      title: 'FORM / HLRF', sub: 'Hasofer–Lind / 切线-垂足',
      items: [
        { title: 'β 的几何定义', id: 'form_beta', note: 'U 空间里到原点的最近距离。' },
        { title: '方向余弦', id: 'form_alpha', note: 'α=u*/β；α_i² 是方差贡献。' },
        { title: 'HLRF 迭代', id: 'hlrf', note: '当前点切线 → 原点垂足。' },
        { title: '回到 X 空间', id: 'form_xstar', note: 'x*=μ+L u*；g(x*)=0。' },
        { title: 'Pf 的一阶近似', id: 'form_pf', note: '边界弯曲时用 SORM/模拟修正。' },
        { title: '灵敏度', id: 'sensitivity', note: '相关时用 ∇g/‖Lᵀ∇g‖；ρ=0 时退化为 −α_i/σ_i。' },
      ],
    },
    {
      title: 'SORM / Breitung', sub: '二阶可靠度',
      items: [
        { title: 'n 维公式', id: 'sorm', note: 'κ_i 为主曲率；符号约定要讲清。' },
        { title: 'n=2', id: 'sorm_n2', note: '默认参数下 κ≈0.0612，因子 0.941。' },
      ],
    },
    {
      title: '模拟与干涉', sub: 'MC / 概率干涉',
      items: [
        { title: '蒙特卡洛', id: 'mc', note: '直接数 g<0；误差 ∝ 1/√N。' },
        { title: '误差', id: 'mc_cov', note: 'Pf 越小，需要 N 越大。' },
        { title: '概率干涉', id: 'interference', note: '重叠面积不是 Pf；失效积分才是。' },
      ],
    },
  ];

  const CODE_BUTTONS = [
    ['transform', '空间变换'], ['interference', '概率干涉'], ['mvfosm', 'MVFOSM'],
    ['afosm', 'AFOSM'], ['form', 'FORM/HLRF'], ['sorm', 'SORM'], ['mc', '蒙特卡洛'],
  ];

  let app = null;
  let state = null;
  const plots = {};
  const timers = {};
  const transAnim = { raf: 0 };
  let intfCache = null;

  /* ------------------------------ Helpers -------------------------------- */
  function paramsEqual() {
    return ['mu1', 'mu2', 's1', 's2', 'rho'].every(k => Math.abs(state.params[k] - DEFAULT_PARAMS[k]) < 1e-9);
  }
  function setText(id, s) { const n = $('#' + id); if (n) n.textContent = s; }
  function setHTML(id, s) { const n = $('#' + id); if (n) n.innerHTML = s; }
  // Clip a draw call to the plot rectangle; curves and failure domains may extend past the window,
  // so each viewport stays continuously "filled" by the curve instead of stopping at the data endpoints.
  function clipPlot(plot, fn) {
    const r = plot.rect(), ctx = plot.ctx;
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    fn();
    ctx.restore();
  }
  function curveX(ex, x1min, x1max, n) {
    n = n || 180;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x1 = x1min + (x1max - x1min) * i / n;
      pts.push([x1, ex.x2Of(x1)]);
    }
    return pts;
  }
  function failurePolyX(ex, x1min, x1max, ymax, n) {
    const pts = curveX(ex, x1min, x1max, n || 120);
    pts.push([x1max, ymax]);
    pts.push([x1min, ymax]);
    return pts;
  }
  function ellipsePoints(mu, L, r, n) {
    n = n || 180;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = 2 * Math.PI * i / n;
      const c = Math.cos(a) * r, s = Math.sin(a) * r;
      pts.push([mu[0] + L[0][0] * c + L[0][1] * s, mu[1] + L[1][0] * c + L[1][1] * s]);
    }
    return pts;
  }
  function tangentX(ex, x0, g0, grad, x1min, x1max) {
    if (Math.abs(grad[1]) < 1e-12) return [[x0[0], -1e3], [x0[0], 1e3]];
    const f = (x1) => x0[1] + (g0 + grad[0] * (x1 - x0[0])) / (-grad[1]);
    return [[x1min, f(x1min)], [x1max, f(x1max)]];
  }
  function tangentU(u0, g0, gu, u1min, u1max) {
    if (Math.abs(gu[1]) < 1e-12) return [[u0[0], -1e3], [u0[0], 1e3]];
    const f = (u1) => u0[1] + (g0 + gu[0] * (u1 - u0[0])) / (-gu[1]);
    return [[u1min, f(u1min)], [u1max, f(u1max)]];
  }
  function fmtM(v) {
    if (Math.abs(v) < 1e-10) return '0';
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }
  function matrixHTML(m) {
    return '<div class="matrix"><span class="bracket left"></span><table>' +
      '<tr><td>' + fmtM(m[0][0]) + '</td><td>' + fmtM(m[0][1]) + '</td><td class="sep">' + fmtM(m[0][2]) + '</td></tr>' +
      '<tr><td>' + fmtM(m[1][0]) + '</td><td>' + fmtM(m[1][1]) + '</td><td class="sep">' + fmtM(m[1][2]) + '</td></tr>' +
      '</table><span class="bracket right"></span><span class="mlabel">A | b</span></div>';
  }

  /* --------------------------- Base coordinate view ---------------------- */
  function drawXBase(plot, main, dataFn) {
    const p = main.p, ex = main.example;
    plot.opts.equal = false;
    plot.opts.xlabel = 'X₁';
    plot.opts.ylabel = 'X₂';
    plot.setRange([0, 12.5], [0, 60]);
    plot.begin();
    plot.grid();
    clipPlot(plot, () => {
      plot.fillPolygon(failurePolyX(ex, -100, 100, 1e6, 500), { color: C.failure });
      const T = RL.Model.transform(p, 'chol');
      for (const r of [1, 2, 3]) {
        plot.line(ellipsePoints(T.mu, T.L, r), { color: '#cbd5e1', width: 1, dash: [4, 4], alpha: 0.75 });
      }
      plot.line(curveX(ex, -100, 100, 500), { color: C.blue, width: 2.6 });
      if (dataFn) dataFn(plot, main, T);
    });
    plot.end();
    plot.axes();
  }

  function drawUBase(plot, main, dataFn, opts) {
    opts = opts || {};
    const p = main.p, ex = main.example;
    const T = RL.Model.transform(p, 'chol');
    plot.opts.equal = true;
    plot.opts.xlabel = 'U₁';
    plot.opts.ylabel = 'U₂';
    plot.setRange(opts.xlim || [-4.6, 1.2], opts.ylim || [-2, 4.4]);
    plot.begin();
    plot.grid();
    clipPlot(plot, () => {
      plot.fillPolygon(failurePolyX(ex, -100, 100, 1e6, 500).map(T.toU), { color: C.failure });
      for (const r of [1, 2, 3]) {
        plot.circle(0, 0, r, { color: '#cbd5e1', width: 1, dash: [4, 4], alpha: 0.8 });
      }
      plot.line(curveX(ex, -100, 100, 500).map(T.toU), { color: C.blue, width: 2.6 });
      if (dataFn) dataFn(plot, main, T);
    });
    plot.end();
    plot.axes();
  }

  /* ----------------------------- Initialization -------------------------- */
  function createPlots() {
    const P = (id, opts) => new Ch.Plot($('#' + id), opts);
    plots.trans = P('transCanvas', { pad: { l: 58, r: 20, t: 18, b: 44 } });
    plots.intf = P('intfCanvas', { pad: { l: 50, r: 16, t: 14, b: 34 } });
    plots.intfInt = P('intfIntegrandCanvas', { pad: { l: 68, r: 16, t: 14, b: 34 } });
    plots.intfMargin = P('intfMarginCanvas', { pad: { l: 62, r: 16, t: 14, b: 34 } });
    plots.mvX = P('mvXCanvas', { pad: { l: 52, r: 16, t: 16, b: 40 } });
    plots.mvU = P('mvUCanvas', { pad: { l: 52, r: 16, t: 16, b: 40 }, equal: true });
    plots.af = P('afCanvas', { pad: { l: 52, r: 16, t: 16, b: 40 } });
    plots.form = P('formCanvas', { pad: { l: 52, r: 16, t: 16, b: 40 }, equal: true });
    plots.beta = P('betaChart', { pad: { l: 50, r: 12, t: 12, b: 30 } });
    plots.g = P('gChart', { pad: { l: 64, r: 12, t: 12, b: 30 }, ylog: true, ylim: [1e-10, 1e2] });
    plots.sorm = P('sormCanvas', { pad: { l: 48, r: 14, t: 14, b: 36 }, equal: true });
    plots.mc = P('mcCanvas', { pad: { l: 52, r: 16, t: 16, b: 40 } });
    plots.mcChart = P('mcChart', { pad: { l: 54, r: 12, t: 12, b: 30 } });
    plots.allMethods = P('allMethodsCanvas', { pad: { l: 58, r: 18, t: 18, b: 40 } });
    plots.tan = P('tanCanvas', { pad: { l: 52, r: 18, t: 18, b: 38 } });

    plots.trans.redraw = drawTransform;
    plots.intf.redraw = drawIntf;
    plots.intfInt.redraw = drawIntf;
    plots.intfMargin.redraw = drawIntf;
    plots.allMethods.redraw = drawAllMethods;
    plots.tan.redraw = drawTan;
    plots.mvX.redraw = drawMv;
    plots.mvU.redraw = drawMv;
    plots.af.redraw = drawAf;
    plots.form.redraw = drawForm;
    plots.beta.redraw = drawForm;
    plots.g.redraw = drawForm;
    plots.sorm.redraw = drawSorm;
    plots.mc.redraw = drawMc;
    plots.mcChart.redraw = drawMc;
  }

  function init(appRef) {
    app = appRef;
    state = app.state;
    createPlots();
    buildTransformUI();
    buildIntfUI();
    buildFormulaSheet();
    bindStationEvents();
    bindTanUI();
    if (RL.Custom) RL.Custom.init(app);
    U.initCodeDialog();
    computeIntf();
    refresh();
  }

  /* -------------------------- Station 1 transform ------------------------ */
  const TRANS_STEPS = [
    { title: '原始 X 空间', formula: 'X ~ N(μ, C)' },
    { title: '中心化', formula: 'Y = X − μ' },
    { title: '标准化', formula: 'Z = D⁻¹(X − μ)' },
    { title: '白化', formula: 'U = L⁻¹(X − μ)' },
  ];

  function buildTransformUI() {
    const box = $('#transformSteps');
    box.innerHTML = TRANS_STEPS.map((s, i) =>
      '<button class="step-item' + (i === 0 ? ' active' : '') + '" data-step="' + i + '">' +
      '<span class="si-num">' + (i + 1) + '</span>' +
      '<span><span class="si-title">' + s.title + '</span><span class="si-formula">' + s.formula + '</span></span>' +
      '</button>').join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (b) setTransformStep(+b.dataset.step);
    });
    $('#transPrev').addEventListener('click', () => setTransformStep(state.transformStep - 1));
    $('#transNext').addEventListener('click', () => setTransformStep(state.transformStep + 1));
    $('#transPlay').addEventListener('click', playTransform);
    U.bindSegmented($('#transMode'), (mode) => {
      stopAll();
      cancelTransAnim();
      state.transformMode = mode;
      updateTransformUI();
      drawTransform();
    });
  }

  function cancelTransAnim() {
    if (transAnim.raf) { cancelAnimationFrame(transAnim.raf); transAnim.raf = 0; }
    state.transVisual = null;
  }

  function affineOf(st) {
    const m = st.matrix;
    return { a11: m[0][0], a12: m[0][1], b1: m[0][2], a21: m[1][0], a22: m[1][1], b2: m[1][2] };
  }

  function blendStage(from, to, t) {
    const A = affineOf(from), B = affineOf(to);
    const L = (u, v) => u + (v - u) * t;
    const a11 = L(A.a11, B.a11), a12 = L(A.a12, B.a12), b1 = L(A.b1, B.b1);
    const a21 = L(A.a21, B.a21), a22 = L(A.a22, B.a22), b2 = L(A.b2, B.b2);
    return {
      map: (x) => [a11 * x[0] + a12 * x[1] + b1, a21 * x[0] + a22 * x[1] + b2],
      xlim: [L(from.xlim[0], to.xlim[0]), L(from.xlim[1], to.xlim[1])],
      ylim: [L(from.ylim[0], to.ylim[0]), L(from.ylim[1], to.ylim[1])],
      equal: from.equal && to.equal,
      xlabel: to.xlabel, ylabel: to.ylabel, labels: to.labels,
      title: to.title,
    };
  }

  function transformStage(step) {
    return RL.Model.transformStage(state.params, step, state.transformMode);
  }

  // Match the pixel scale of xlim/ylim to the canvas (equivalent to Plot's equal mode,
  // but here we only pre-fit the ranges; the equal flag never toggles during the animation, avoiding flicker).
  function fitAspect(xlim, ylim, aspect) {
    let [x0, x1] = xlim, [y0, y1] = ylim;
    const sx = x1 - x0, sy = y1 - y0;
    if (sx / sy > aspect) {
      const mid = (y0 + y1) / 2, half = sx / aspect / 2;
      y0 = mid - half; y1 = mid + half;
    } else {
      const mid = (x0 + x1) / 2, half = sy * aspect / 2;
      x0 = mid - half; x1 = mid + half;
    }
    return { xlim: [x0, x1], ylim: [y0, y1] };
  }

  function setTransformStep(i, animate) {
    const target = Math.max(0, Math.min(3, i));
    const fromStep = state.transformStep;
    const fromStage = state.transVisual || transformStage(state.transformStep);
    if (target === state.transformStep && !state.transVisual) return;
    const toStage = transformStage(target);
    state.transformStep = target;
    updateTransformUI();
    if (animate === false || (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      cancelTransAnim();
      drawTransform();
      return;
    }
    cancelTransAnim();
    const started = performance.now();
    const DUR = target === 2 ? 1400 : target === 3 ? 1250 : 1050;
    const ease = (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const L = (u, v, q) => u + (v - u) * q;
    // Deliberately split 2/4 → 3/4 into two stages: first zoom the axes window to the standardized scale,
    // then fix the window and scale the data on the Y axis (D⁻¹). This makes the animation "window first, then data",
    // avoiding the awkward look of the window and the geometry scaling at the same time.
    const special23 = fromStep === 1 && target === 2 && !state.transVisual;
    const aspect = plots.trans.rect().w / Math.max(1, plots.trans.rect().h);
    const fitted = fitAspect(toStage.xlim, toStage.ylim, aspect);
    const frame = (now) => {
      const p = Math.min(1, (now - started) / DUR);
      if (special23) {
        if (p < 0.55) {
          const q = ease(p / 0.55);
          state.transVisual = {
            map: fromStage.map,
            xlim: [L(fromStage.xlim[0], fitted.xlim[0], q), L(fromStage.xlim[1], fitted.xlim[1], q)],
            ylim: [L(fromStage.ylim[0], fitted.ylim[0], q), L(fromStage.ylim[1], fitted.ylim[1], q)],
            equal: false,
            xlabel: toStage.xlabel, ylabel: toStage.ylabel, labels: toStage.labels, title: toStage.title,
          };
        } else {
          const q = ease((p - 0.55) / 0.45);
          const b = blendStage(fromStage, toStage, q);
          state.transVisual = Object.assign({}, b, { xlim: fitted.xlim, ylim: fitted.ylim, equal: false });
        }
      } else {
        state.transVisual = blendStage(fromStage, toStage, ease(p));
      }
      drawTransform(true);
      if (p < 1) {
        transAnim.raf = requestAnimationFrame(frame);
      } else {
        transAnim.raf = 0;
        state.transVisual = null;
        drawTransform();
      }
    };
    transAnim.raf = requestAnimationFrame(frame);
  }

  function updateTransformUI() {
    const step = state.transformStep;
    const st = RL.Model.transformStage(state.params, step, state.transformMode);
    setText('transformTitle', st.title);
    setText('transStepLabel', (step + 1) + ' / 4');
    setText('transformNote', st.note);
    $$('#transformSteps .step-item').forEach((b, i) => b.classList.toggle('active', i === step));
    const stepFormulas = $$('#transformSteps .step-item .si-formula');
    if (stepFormulas[3]) {
      stepFormulas[3].textContent = state.transformMode === 'pca'
        ? 'U = Λ^{-1/2}Qᵀ(X − μ)'
        : 'U = L⁻¹(X − μ)';
    }
    setHTML('transformMatrix', matrixHTML(st.matrix));
    const shortNotes = [
      '相关正态的协方差 C 决定椭圆形状；X 空间的距离没有概率意义。',
      '中心化只移动中心，不改变形状。',
      '标准化把两个方向都变成“几个 σ”；ρ=0 时椭圆才是正圆。',
      '白化后 U 的各分量独立标准正态；β 才是到原点的距离。',
    ];
    setHTML('transformFormula',
      '<div class="fl-label">当前公式</div>' +
      '<div class="fl-svg">' + U.formula(st.formula) + '</div>' +
      '<div class="tiny muted">' + shortNotes[step] + '</div>');
  }

  function drawTransform(skipUI) {
    if (!app || !app.main) return;
    const step = state.transformStep;
    const st = state.transVisual || transformStage(step);
    const plot = plots.trans;
    plot.opts.equal = st.equal;
    plot.opts.xlabel = st.xlabel;
    plot.opts.ylabel = st.ylabel;
    plot.opts.axisBold = true;
    plot.opts.xTickTarget = 10;
    plot.opts.yTickTarget = 8;
    plot.setRange(st.xlim, st.ylim);
    plot.begin();
    plot.grid();

    const p = state.params;
    const ex = app.main.example;
    const T = RL.Model.transform(p, 'chol');
    const x1min = 0;
    const x1max = 11.5;
    // Draw the failure domain and curve beyond the window, then clip to the viewport; each stage then fills the whole window,
    // instead of "stopping" at the data endpoints x1 = 0/11.5.
    clipPlot(plot, () => {
      plot.fillPolygon(failurePolyX(ex, -100, 100, 1e6, 700).map(st.map), { color: C.failure });
      plot.line(curveX(ex, -100, 100, 700).map(st.map), { color: C.blue, width: 2.6 });
      for (const r of [1, 2, 3]) {
        plot.line(ellipsePoints(T.mu, T.L, r).map(st.map), {
          color: '#cbd5e1', width: 1, dash: [4, 4], alpha: 0.8,
        });
      }
      if (step >= 1) {
        // β equal-probability ellipse/circle: it is tangent to the limit-state surface at x*; the tangent point is the design point.
        plot.line(ellipsePoints(T.mu, T.L, app.main.form.beta).map(st.map), {
          color: C.purple, width: 1.8, dash: [5, 3], alpha: 0.95,
        });
        plot.line(tangentX(ex, app.main.form.xStar, 0, ex.grad(app.main.form.xStar), -100, 100).map(st.map), {
          color: C.method.form, width: 1.8, dash: [7, 4], alpha: 0.95,
        });
      }
    });

    const mean = st.map([p.mu1, p.mu2]);
    const design = st.map(app.main.form.xStar);
    if (step === 0) {
      plot.square(mean[0], mean[1], 6, C.blue);
      plot.star(design[0], design[1], 10, C.red);
    } else {
      plot.scatter([[0, 0]], { color: C.dark, size: 4.5, stroke: '#fff' });
      plot.star(design[0], design[1], 10, C.red);
      if (step === 3) {
        plot.line([[0, 0], design], { color: C.red, width: 1.2, dash: [2, 3], alpha: 0.85 });
        plot.circle(0, 0, Math.hypot(design[0], design[1]), { color: C.red, width: 1.2, dash: [5, 4], alpha: 0.55 });
      }
    }
    plot.end();
    plot.axes();

    // Annotations
    if (step === 0) {
      plot.tag(mean[0], mean[1], '均值 μ', { dx: 0, dy: -30, size: 10.5, color: C.blue, border: '#b9d5ea' });
      plot.tag(design[0], design[1], '验算点 x*', { dx: -14, dy: -22, align: 'right', size: 10.5, color: C.red, border: '#f0c2c2' });
      plot.text(3.2, 45, '失效区 g<0', { color: '#b22222', size: 11, align: 'left' });
    } else {
      plot.tag(0, 0, 'O', { dx: -18, dy: 16, size: 11, color: C.dark, border: '#d0d5dd' });
      plot.tag(design[0], design[1], '切点 x*', { dx: -12, dy: -22, align: 'right', size: 10.5, color: C.red, border: '#f0c2c2' });
      const failPt = st.map([8, 45]);
      if (failPt[0] >= st.xlim[0] && failPt[0] <= st.xlim[1] && failPt[1] >= st.ylim[0] && failPt[1] <= st.ylim[1]) {
        plot.tag(failPt[0], failPt[1], '失效区 g<0', { dx: 8, dy: 0, size: 10, color: '#b22222', border: '#f0c2c2', bg: 'rgba(255,245,245,.94)' });
      }
      if (step === 3) {
        const mx = design[0] * 0.5, my = design[1] * 0.5;
        plot.tag(mx, my, 'β = ' + M.fmt.beta(app.main.form.beta), { dx: 4, dy: 14, size: 10.5, color: C.red, border: '#f0c2c2' });
      }
    }
    const transLegend = [
      { type: 'line', color: C.blue, label: '极限状态面' },
      { type: 'line', color: '#cbd5e1', label: step === 3 ? '等 β 线' : '等概率椭圆', dash: [4, 4] },
      { type: 'marker', color: C.red, label: '设计点', shape: 'star' },
    ];
    if (step >= 1) {
      transLegend.push({ type: 'line', color: C.purple, label: 'β 等概率椭圆/圆', dash: [5, 3] });
      transLegend.push({ type: 'line', color: C.method.form, label: 'FORM 切线（切点 x*）', dash: [7, 4] });
    }
    plot.legend(transLegend, { x: plot.rect().x + 9, y: plot.rect().y + 9 });
    if (!skipUI) updateTransformUI();
  }

  /* ------------------------ Station 2 interference ----------------------- */
  const INTF_DEFS = [
    { key: 'muR', label: 'R 均值', min: 20, max: 40, step: 0.1 },
    { key: 'muS', label: 'S 均值', min: 5, max: 25, step: 0.1 },
    { key: 'sR', label: 'R 标准差', min: 1, max: 8, step: 0.05 },
    { key: 'sS', label: 'S 标准差', min: 1, max: 8, step: 0.05 },
  ];

  function buildIntfControls() {
    U.buildSliders($('#intfControls'), INTF_DEFS, state.intf, () => {
      computeIntf();
      drawIntf();
      updateIntfUI();
      updateInspector();
    });
  }

  function buildIntfUI() {
    buildIntfControls();
  }

  function resetIntf() {
    state.intf = Object.assign({}, DEFAULT_INTF);
    buildIntfControls();
    computeIntf();
    updateIntfUI();
    updateInspector();
    if (state.station === 2) drawIntf();
  }

  function computeIntf() {
    intfCache = {
      res: RL.Model.interference(state.intf),
      curves: RL.Model.interferenceCurves(state.intf, 220),
    };
  }

  function drawIntf() {
    if (!intfCache) computeIntf();
    const cur = intfCache.curves;
    const res = intfCache.res;

    // ① Density overlap + failure probability density h(s)=f_S(s)F_R(s) (right axis)
    let maxY = 0;
    for (let i = 0; i < cur.xs.length; i++) maxY = Math.max(maxY, cur.fR[i], cur.fS[i]);
    let maxH = 0;
    for (let i = 0; i < cur.h.length; i++) maxH = Math.max(maxH, cur.h[i]);
    const p1 = plots.intf;
    p1.opts.equal = false;
    p1.opts.xlabel = 'x';
    p1.opts.ylabel = '密度';
    p1.setRange([cur.xmin, cur.xmax], [0, maxY * 1.18]);
    p1.begin(); p1.grid();
    const poly = [];
    for (let i = 0; i < cur.xs.length; i++) poly.push([cur.xs[i], cur.overlap[i]]);
    for (let i = cur.xs.length - 1; i >= 0; i--) poly.push([cur.xs[i], 0]);
    p1.fillPolygon(poly, { color: 'rgba(255,127,14,0.18)' });
    // h(s) shares the same absolute density axis as f_R/f_S; it is tiny, but keeps its true scale.
    const hToDensity = (h) => h;
    const polyH = [[cur.xmin, 0]];
    for (let i = 0; i < cur.xs.length; i++) polyH.push([cur.xs[i], hToDensity(cur.h[i])]);
    polyH.push([cur.xmax, 0]);
    p1.fillPolygon(polyH, { color: 'rgba(44,160,44,0.13)' });
    p1.line(cur.xs.map((x, i) => [x, cur.fR[i]]), { color: C.blue, width: 2.2 });
    p1.line(cur.xs.map((x, i) => [x, cur.fS[i]]), { color: C.orange, width: 2.2 });
    p1.line(cur.xs.map((x, i) => [x, hToDensity(cur.h[i])]), { color: C.green, width: 2.0, dash: [5, 3] });
    let cross = null;
    for (let i = 1; i < cur.xs.length; i++) {
      if ((cur.fR[i - 1] - cur.fS[i - 1]) * (cur.fR[i] - cur.fS[i]) <= 0) { cross = cur.xs[i]; break; }
    }
    if (cross != null) p1.line([[cross, 0], [cross, maxY * 1.05]], { color: C.gray, width: 1, dash: [4, 4], alpha: 0.7 });
    p1.end(); p1.axes();
    const p1r = p1.rect();
    p1.legend([
      { type: 'line', color: C.blue, label: 'f_R(r)' },
      { type: 'line', color: C.orange, label: 'f_S(s)' },
      { type: 'line', color: C.green, label: 'h(s)=f_S·F_R（同一绝对密度轴）', dash: [5, 3] },
    ], { x: p1r.x + 9, y: p1r.y + 9 });
    p1.tag(cur.xmax - (cur.xmax - cur.xmin) * 0.03, maxY * 0.20,
      '橙色重叠：不是 Pf\n绿色 h(s)：绝对密度；面积 = Pf = ' + M.fmt.pct(res.pf, 3) + '\n（h 很小，放大看用图②）', {
        dx: 0, dy: 0, size: 10, color: '#8a4b00', border: '#f0d5b0', bg: 'rgba(255,250,240,.94)', align: 'right',
      });

    // ② Failure probability density h(s)
    const p2 = plots.intfInt;
    p2.opts.equal = false;
    p2.opts.xlabel = 's';
    p2.opts.ylabel = 'h(s)';
    p2.setRange([cur.xmin, cur.xmax], [0, Math.max(maxH * 1.22, 1e-6)]);
    p2.begin(); p2.grid();
    const poly2 = [[cur.xmin, 0]];
    for (let i = 0; i < cur.xs.length; i++) poly2.push([cur.xs[i], cur.h[i]]);
    poly2.push([cur.xmax, 0]);
    p2.fillPolygon(poly2, { color: 'rgba(44,160,44,0.18)' });
    p2.line(cur.xs.map((x, i) => [x, cur.h[i]]), { color: C.green, width: 2.2 });
    p2.end(); p2.axes();
    p2.tag((cur.xmin + cur.xmax) / 2, maxH * 0.55, '面积 = Pf = ' + M.fmt.pct(res.pf, 3), {
      dx: 0, dy: 0, size: 10.5, color: '#1a6b1a', border: '#c7e5c7', bg: 'rgba(247,255,247,.94)',
    });

    // ③ Safety margin
    const p3 = plots.intfMargin;
    const gmax = Math.max.apply(null, cur.gp);
    const gx0 = Math.min(cur.muG - 4 * cur.sG, -0.35 * cur.sG);
    const gx1 = Math.max(cur.muG + 4 * cur.sG, 0.35 * cur.sG);
    p3.opts.equal = false;
    p3.opts.xlabel = 'g = R − S';
    p3.opts.ylabel = '密度';
    p3.setRange([gx0, gx1], [0, gmax * 1.18]);
    p3.begin(); p3.grid();
    const poly3 = [];
    for (let i = 0; i < cur.gx.length; i++) if (cur.gx[i] <= 0) poly3.push([cur.gx[i], cur.gp[i]]);
    if (poly3.length > 1) {
      poly3.push([0, 0]);
      poly3.unshift([cur.gx[0], 0]);
      p3.fillPolygon(poly3, { color: 'rgba(214,39,40,0.16)' });
    }
    p3.line(cur.gx.map((x, i) => [x, cur.gp[i]]), { color: C.purple, width: 2.2 });
    p3.line([[0, 0], [0, gmax * 1.12]], { color: C.red, width: 1.4, dash: [5, 4] });
    p3.end(); p3.axes();
    p3.tag(0, gmax * 0.62, 'g < 0\n失效', { dx: 8, dy: 0, size: 10, color: C.red, border: '#f0c2c2' });
  }

  function updateIntfUI() {
    const res = intfCache.res;
    setText('intfBeta', 'β = ' + M.fmt.beta(res.beta) + ' · Pf = ' + M.fmt.pct(res.pf, 3));
    const fs = RL.Model.formSensitivity(state.intf);
    setHTML('intfFormula',
      '<div class="fl-label">失效概率密度</div>' +
      '<div class="fl-svg">' + U.formula('interference') + '</div>' +
      '<div class="fl-sub">h(s) = f<sub>S</sub>(s)·F<sub>R</sub>(s)</div>' +
      '<div class="tiny muted">曲线 h(s) 的积分才是 P<sub>f</sub> = Φ(−' +
      M.fmt.beta(res.beta) + ') = ' + M.fmt.pct(res.pf, 3) +
      '；f<sub>R</sub> 与 f<sub>S</sub> 的密度重叠面积不是 P<sub>f</sub>。</div>');
    setHTML('intfFormTable',
      '<table class="form-sens-table"><thead><tr><th>写法</th><th>MVFOSM β</th><th>FORM β</th></tr></thead><tbody>' +
      '<tr><td>R − S</td><td class="num">' + M.fmt.beta(fs.betaRS) + '</td><td class="num">' + M.fmt.beta(fs.formBeta) + '</td></tr>' +
      '<tr><td>R/S − 1</td><td class="num hl">' + M.fmt.beta(fs.betaRatio) + '</td><td class="num">' + M.fmt.beta(fs.formBeta) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="tiny muted" style="margin-top:6px">R−S 与 R/S−1 的零集都是 R=S；MVFOSM 的 β 却从 ' +
      M.fmt.beta(fs.betaRS) + ' 变到 ' + M.fmt.beta(fs.betaRatio) + '，FORM 仍是 ' + M.fmt.beta(fs.formBeta) + '。</div>');
  }

  /* -------------------------- Station 3 MVFOSM --------------------------- */
  function drawMv() {
    const main = app.main;
    const mv = main.mv;
    const p = main.p;
    const mu = [p.mu1, p.mu2];

    drawXBase(plots.mvX, main, (plot) => {
      plot.line(tangentX(main.example, mu, mv.muG, mv.gradX, 0, 12.5), {
        color: C.orange, width: 2.3, dash: [7, 4],
      });
      plot.square(mu[0], mu[1], 5.5, C.blue);
      plot.diamond(mv.xL[0], mv.xL[1], 5, C.orange);
      plot.star(main.form.xStar[0], main.form.xStar[1], 9.5, C.red);
    });
    plots.mvX.tag(mu[0], mu[1], '均值 μ（g=60）', { dx: 8, dy: -26, size: 10.5, color: C.blue, border: '#b9d5ea' });
    plots.mvX.tag(mv.xL[0], mv.xL[1], '中心点法对应点', { dx: 10, dy: 20, size: 10, color: '#a45700', border: '#f0d5b0' });
    plots.mvX.tag(main.form.xStar[0], main.form.xStar[1], '验算点 x*', { dx: -12, dy: -22, align: 'right', size: 10.5, color: C.red, border: '#f0c2c2' });
    plots.mvX.legend([
      { type: 'line', color: C.blue, label: '真实极限状态面' },
      { type: 'line', color: C.orange, label: '均值点切线', dash: [7, 4] },
      { type: 'marker', color: C.orange, label: '均值点法垂足' },
      { type: 'marker', color: C.red, label: 'FORM 验算点', shape: 'star' },
    ], { x: plots.mvX.rect().x + 9, y: plots.mvX.rect().y + 9 });

    drawUBase(plots.mvU, main, (plot) => {
      plot.line(tangentU([0, 0], mv.muG, mv.gradU, -4.6, 1.2), {
        color: C.orange, width: 2.1, dash: [7, 4],
      });
      plot.line([[0, 0], mv.uL], { color: C.orange, width: 1.1, dash: [2, 3], alpha: 0.9 });
      plot.scatter([mv.uL], { color: C.orange, size: 5, stroke: '#fff' });
      plot.star(main.form.uStar[0], main.form.uStar[1], 9.5, C.red);
      plot.scatter([[0, 0]], { color: C.dark, size: 4, stroke: '#fff' });
    });
    plots.mvU.tag(mv.uL[0], mv.uL[1], 'U_L', { dx: 8, dy: 18, size: 10.5, color: '#a45700', border: '#f0d5b0' });
    plots.mvU.tag(main.form.uStar[0], main.form.uStar[1], 'U*', { dx: -8, dy: -20, size: 10.5, color: C.red, border: '#f0c2c2' });
    plots.mvU.legend([
      { type: 'line', color: C.blue, label: '极限状态面' },
      { type: 'line', color: C.orange, label: '均值点切线', dash: [7, 4] },
      { type: 'marker', color: C.orange, label: 'U_L（第 1 步）' },
      { type: 'marker', color: C.red, label: 'U*（收敛）', shape: 'star' },
    ], { x: plots.mvU.rect().x + plots.mvU.rect().w - 186, y: plots.mvU.rect().y + 9 });

    updateMvUI();
  }

  function updateMvUI() {
    const main = app.main;
    const mv = main.mv;
    const ex = main.exact;
    const rel = (x) => (x - ex) / ex * 100;
    const p = main.p;
    const tangentSlope = p.mu1;
    const tangentIntercept = -p.mu1 * p.mu1 / 2;
    setText('mvXTag', 'β_M = ' + M.fmt.beta(mv.beta) + '，线性化 g=0：X₂ = ' +
      tangentSlope.toFixed(2) + 'X₁ − ' + Math.abs(tangentIntercept).toFixed(2));
    setText('mvUTag', 'U_L = (' + mv.uL[0].toFixed(3) + ', ' + mv.uL[1].toFixed(3) + ')，β = ' + M.fmt.beta(mv.beta));
    const cross = mv.cross;
    const sigmaNoCross = Math.sqrt(Math.max(0, mv.varG - cross));
    const crossDir = cross > 0 ? '升到' : '降到';
    const crossNote = Math.abs(cross) > 1e-9
      ? 'σ_g² = ∇gᵀ C ∇g；交叉项 ' + M.fmt.num(cross, 1) + ' 使 σ_g 从 ' +
        M.fmt.num(sigmaNoCross, 3) + ' ' + crossDir + ' ' + M.fmt.num(mv.sigmaG, 3) + '。'
      : 'σ_g² = ∇gᵀ C ∇g；ρ=0，交叉项为 0，σ_g = ' + M.fmt.num(mv.sigmaG, 3) + '。';
    setHTML('mvFormula',
      '<div class="fl-label">MVFOSM · 代入</div>' +
      '<div class="fl-svg">' + U.formula('mvfosm_beta') + '</div>' +
      '<div class="fl-sub">μ_g = ' + M.fmt.num(mv.muG, 3) + '，σ_g = ' + M.fmt.num(mv.sigmaG, 3) +
      ' → β_M = ' + M.fmt.num(mv.beta, 3) + '，Pf ≈ ' + M.fmt.pct(mv.pf, 3) + '</div>' +
      '<div class="tiny muted">' + crossNote + '<br>注意：g(μ)=' + M.fmt.num(mv.muG, 1) + '≠0，所以线性化边界 g=0 不穿过均值点；μ 只是展开点。</div>');

    const fs = RL.Model.formSensitivity();
    setHTML('mvFormBody',
      '<table class="form-sens-table"><thead><tr><th>同一失效面</th><th>MVFOSM β</th><th>Pf</th></tr></thead><tbody>' +
      '<tr><td>R − S</td><td class="num">' + M.fmt.beta(fs.betaRS) + '</td><td class="num">' + M.fmt.pct(fs.pfRS, 3) + '</td></tr>' +
      '<tr><td>R/S − 1</td><td class="num hl">' + M.fmt.beta(fs.betaRatio) + '</td><td class="num">' + M.fmt.pct(fs.pfRatio, 3) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="tiny muted" style="margin-top:6px">主例题的比值写法 g₂ = X₁²/(2X₂) − 1：MVFOSM β = ' +
      M.fmt.beta(main.ratio.beta) + '，FORM 仍为 ' + M.fmt.beta(main.form.beta) + '。写法变了，均值点法就变；验算点法不变。</div>');

    const items = [
      { name: 'MVFOSM', pf: mv.pf, color: C.method.mvfosm, err: rel(mv.pf) },
      { name: 'AFOSM', pf: main.form.pf, color: C.method.afosm, err: rel(main.form.pf) },
      { name: 'FORM', pf: main.form.pf, color: C.method.form, err: rel(main.form.pf) },
      { name: 'SORM', pf: main.sorm.pf, color: C.method.sorm, err: rel(main.sorm.pf) },
    ];
    const maxErr = Math.max.apply(null, items.map(x => Math.abs(x.err)));
    setHTML('mvErrorBody',
      '<div class="error-list">' + items.map(it =>
        '<div class="error-item"><span class="ei-label">' + it.name + '</span>' +
        '<span class="error-track"><span class="error-fill" style="width:' + Math.min(100, Math.abs(it.err) / maxErr * 100) + '%;--c:' + it.color + '"></span></span>' +
        '<span class="ei-val">' + (it.err >= 0 ? '+' : '') + it.err.toFixed(1) + '%</span></div>').join('') +
      '</div>' +
      '<div class="tiny muted" style="margin-top:8px">相对精确值 ' + M.fmt.pct(ex, 3) + ' 的 Pf 误差；MVFOSM 的误差不是数值误差，是“线性化点不对”。</div>');
  }

  /* --------------------------- Station 4 AFOSM --------------------------- */
  function drawAf() {
    const main = app.main;
    const af = main.af;
    const p = main.p;
    const mu = [p.mu1, p.mu2];

    if (af.failed) {
      drawXBase(plots.af, main, (plot) => {
        plot.square(mu[0], mu[1], 5.5, C.blue);
        plot.star(af.xStar[0], af.xStar[1], 9.5, C.red);
        plot.line([mu, af.xStar], { color: C.gray, width: 1.2, dash: [4, 4], alpha: 0.7 });
      });
      plots.af.tag(mu[0], mu[1], '均值 μ', { dx: 8, dy: -26, size: 10.5, color: C.blue, border: '#b9d5ea' });
      plots.af.tag(af.xStar[0], af.xStar[1], '回退 FORM 设计点', { dx: -12, dy: -24, align: 'right', size: 10.5, color: C.red, border: '#f0c2c2' });
      plots.af.tag((mu[0] + af.xStar[0]) / 2, (mu[1] + af.xStar[1]) / 2, '方向搜索未穿过边界', {
        dx: 0, dy: -16, size: 10, color: '#7a4b12', border: '#f0d5b0', bg: 'rgba(255,250,242,.95)',
      });
      plots.af.legend([
        { type: 'line', color: C.blue, label: '极限状态面' },
        { type: 'line', color: C.gray, label: '回退路径', dash: [4, 4] },
        { type: 'marker', color: C.red, label: 'FORM 设计点', shape: 'star' },
      ], { x: plots.af.rect().x + 9, y: plots.af.rect().y + 9 });
      updateAfUI();
      return;
    }

    const step = Math.max(0, Math.min(state.afStep, af.history.length - 1));
    const cur = af.history[step];

    drawXBase(plots.af, main, (plot) => {
      // Historical rays
      for (let i = 0; i <= step; i++) {
        const h = af.history[i];
        plot.line([mu, h.x], { color: C.gray, width: 1, dash: [2, 4], alpha: i === step ? 0.75 : 0.22 });
      }
      // Iteration path and points
      plot.line(af.history.slice(0, step + 1).map(h => h.x), {
        color: C.method.afosm, width: 1.2, dash: [3, 4], alpha: 0.6,
      });
      for (let i = 0; i < step; i++) {
        plot.scatter([af.history[i].x], { color: '#98a2b3', size: 4.2, stroke: '#fff' });
      }
      plot.scatter([cur.x], { color: C.method.afosm, size: 6.2, stroke: '#fff' });
      plot.square(mu[0], mu[1], 5.5, C.blue);
      plot.star(af.xStar[0], af.xStar[1], 9.5, C.red);
      plot.line([mu, cur.x], { color: C.method.afosm, width: 1.6, alpha: 0.8 });
    });
    plots.af.tag(mu[0], mu[1], '均值 μ', { dx: 8, dy: -26, size: 10.5, color: C.blue, border: '#b9d5ea' });
    if (step < af.history.length - 1) {
      plots.af.tag(cur.x[0], cur.x[1], '第 ' + (step + 1) + ' 步', { dx: 10, dy: 18, size: 10, color: C.method.afosm, border: '#b9d5ea' });
    }
    if (step > 0) {
      const h1 = af.history[0];
      plots.af.tag(h1.x[0], h1.x[1], '第 1 跳 β=' + M.fmt.beta(h1.beta), {
        dx: 0, dy: 24, size: 9.5, color: C.method.afosm, border: '#b9d5ea', bg: 'rgba(247,251,255,.94)',
      });
    }
    plots.af.tag(af.xStar[0], af.xStar[1], step === af.history.length - 1 ? '收敛 x*' : '设计点 x*', {
      dx: -12, dy: -22, align: 'right', size: 10.5, color: C.red, border: '#f0c2c2',
    });
    plots.af.legend([
      { type: 'line', color: C.blue, label: '极限状态面' },
      { type: 'line', color: C.method.afosm, label: '当前 α 方向', width: 1.6 },
      { type: 'marker', color: C.method.afosm, label: 'AFOSM 迭代点' },
      { type: 'marker', color: C.red, label: '设计点', shape: 'star' },
    ], { x: plots.af.rect().x + 9, y: plots.af.rect().y + 9 });

    updateAfUI();
  }

  function updateAfUI() {
    const main = app.main;
    const af = main.af;

    if (af.failed) {
      const reasonText = af.reason === 'mean-failure'
        ? '均值点已在失效域，沿当前 α 方向没有可用的 g=0 交点'
        : '沿当前 α 方向没有找到 g=0 的交点';
      setText('afStepTag', '方向搜索未穿过边界 · 已回退 FORM');
      setHTML('afTable',
        '<div class="tiny muted" style="padding:8px 2px;line-height:1.7">' + reasonText +
        '。<br>已回退到 FORM 的同一设计点：AFOSM 与 FORM 在正态变量下同解，β/Pf 取 FORM 结果。</div>');
      setText('afStatus', '回退 FORM：β=' + M.fmt.beta(af.beta) + '，x=(' + af.xStar[0].toFixed(3) + ', ' + af.xStar[1].toFixed(3) + ')');
      setHTML('afCompareBody',
        '<table class="compare-table"><thead><tr><th></th><th>β</th><th>Pf</th><th>迭代</th></tr></thead><tbody>' +
        '<tr><td>AFOSM</td><td>' + M.fmt.beta(af.beta) + '</td><td>' + M.fmt.pct(af.pf, 3) + '</td><td>回退</td></tr>' +
        '<tr><td>FORM</td><td>' + M.fmt.beta(main.form.beta) + '</td><td>' + M.fmt.pct(main.form.pf, 3) + '</td><td>' + (main.form.history.length - 1) + '</td></tr>' +
        '</tbody></table>' +
        '<div style="margin-top:8px"><span class="eq-badge">≡ 同一设计点（回退）</span></div>' +
        '<div class="tiny muted" style="margin-top:6px">这不是数值错误：AFOSM 的方向搜索在某些参数下会错过边界，FORM 的切线-垂足仍能收敛；两者最终同解。</div>');
      setHTML('afFormula',
        '<div class="fl-label">AFOSM · 回退说明</div>' +
        '<div class="fl-svg">' + U.formula('afosm_dir') + '</div>' +
        '<div class="tiny muted">回退原因：' + reasonText + '。β=' + M.fmt.num(af.beta, 4) + ' 来自 FORM；如需看 AFOSM 迭代，请调回默认参数。</div>');
      return;
    }

    const step = Math.max(0, Math.min(state.afStep, af.history.length - 1));
    const cur = af.history[step];
    setText('afStepTag', '第 ' + (step + 1) + ' / ' + af.history.length + ' 步 · β = ' + M.fmt.beta(cur.beta) + ' · g = ' + (Math.abs(cur.g) < 1e-2 ? cur.g.toExponential(1) : cur.g.toFixed(2)));
    setHTML('afTable', U.afTable(af.history, step));
    setText('afStatus', '当前 β=' + M.fmt.beta(cur.beta) + '，x=(' + cur.x[0].toFixed(3) + ', ' + cur.x[1].toFixed(3) + ')');
    setHTML('afCompareBody',
      '<table class="compare-table"><thead><tr><th></th><th>β</th><th>Pf</th><th>迭代</th></tr></thead><tbody>' +
      '<tr><td>AFOSM</td><td>' + M.fmt.beta(af.beta) + '</td><td>' + M.fmt.pct(af.pf, 3) + '</td><td>' + af.history.length + '</td></tr>' +
      '<tr><td>FORM</td><td>' + M.fmt.beta(main.form.beta) + '</td><td>' + M.fmt.pct(main.form.pf, 3) + '</td><td>' + (main.form.history.length - 1) + '</td></tr>' +
      '</tbody></table>' +
      '<div style="margin-top:8px"><span class="eq-badge">≡ 同一设计点</span></div>' +
      '<div class="tiny muted" style="margin-top:6px">AFOSM 在 X 空间沿 α 射线找边界；FORM 在 U 空间做切线-垂足。路径不同，终点相同。</div>');
    setHTML('afFormula',
      '<div class="fl-label">AFOSM · 代入</div>' +
      '<div class="fl-svg">' + U.formula('afosm_dir') + '</div>' +
      '<div class="fl-sub">α = (' + cur.alpha[0].toFixed(3) + ', ' + cur.alpha[1].toFixed(3) + ')，β = ' + M.fmt.num(cur.beta, 3) + '</div>' +
      '<div class="tiny muted">沿 d = Lα 解 g(μ+βd)=0；第一跳 β≈' + M.fmt.beta(af.history[0].beta) +
      '，随后在 ' + M.fmt.beta(af.beta) + ' 附近收敛。</div>');
  }

  /* ---------------------------- Station 5 FORM --------------------------- */
  function drawForm() {
    const main = app.main;
    const form = main.form;
    const hist = form.history;
    const step = Math.max(0, Math.min(state.hlrStep, hist.length - 1));
    const cur = hist[step];
    const curU = step < hist.length - 1 ? hist[step + 1].u : form.uStar;

    drawUBase(plots.form, main, (plot) => {
      for (let k = 0; k <= step; k++) {
        const h = hist[k];
        const foot = k < hist.length - 1 ? hist[k + 1].u : form.uStar;
        plot.line(tangentU(h.u, h.g, h.gradU, -4.6, 1.2), {
          color: k === step ? C.method.form : '#98a2b3',
          width: k === step ? 1.9 : 1,
          dash: [6, 4],
          alpha: k === step ? 0.95 : 0.45,
        });
        plot.line([[0, 0], foot], { color: C.red, width: 1, dash: [2, 3], alpha: k === step ? 0.8 : 0.3 });
        if (k < step) plot.circle(foot[0], foot[1], 0.045, { color: '#98a2b3', width: 1, alpha: 0.8 });
      }
      plot.line(hist.slice(0, step + 1).map(h => h.u), { color: C.purple, width: 1.3, alpha: 0.8, dash: [2, 4] });
      plot.scatter([cur.u], { color: C.method.form, size: 5, stroke: '#fff' });
      plot.circle(curU[0], curU[1], 0.06, { color: C.method.form, width: 1.4, alpha: 0.9 });
      plot.scatter([[0, 0]], { color: C.dark, size: 4, stroke: '#fff' });
      plot.star(form.uStar[0], form.uStar[1], 9.5, C.red);
    });
    plots.form.tag(cur.u[0], cur.u[1], 'U' + step, { dx: 10, dy: -16, size: 10.5, color: C.method.form, border: '#f0c2c2' });
    plots.form.tag(form.uStar[0], form.uStar[1], 'U*', { dx: -10, dy: -20, align: 'right', size: 10.5, color: C.red, border: '#f0c2c2' });
    plots.form.tag(0, 0, 'O', { dx: -18, dy: 16, size: 11, color: C.dark, border: '#d0d5dd' });
    plots.form.legend([
      { type: 'line', color: C.blue, label: '极限状态面' },
      { type: 'line', color: C.method.form, label: '当前切线', dash: [6, 4] },
      { type: 'line', color: C.red, label: '原点到垂足', dash: [2, 3] },
      { type: 'marker', color: C.method.form, label: '当前迭代点' },
      { type: 'marker', color: C.red, label: 'U*', shape: 'star' },
    ], { x: plots.form.rect().x + plots.form.rect().w - 190, y: plots.form.rect().y + 9 });

    updateFormUI();
  }

  function updateFormUI() {
    const main = app.main;
    const form = main.form;
    const step = Math.max(0, Math.min(state.hlrStep, form.history.length - 1));
    const cur = form.history[step];
    setText('formStepTag', 'k=' + step + ' · β=' + M.fmt.beta(cur.beta) + ' · g=' + (Math.abs(cur.g) < 1e-2 ? cur.g.toExponential(1) : cur.g.toFixed(2)));
    setHTML('formTable', U.hlrfTable(form.history, step));
    setText('formStatus', '当前第 ' + step + ' 步 / 共 ' + (form.history.length - 1) + ' 次迭代；' + (step === form.history.length - 1 ? '已收敛' : '播放或单步继续'));
    setHTML('alphaBars',
      '<div class="alpha-bars">' +
      ['X₁', 'X₂'].map((name, i) => {
        const a2 = form.alpha2[i] * 100;
        return '<div class="alpha-row"><span>' + name + '</span><span class="alpha-track"><span class="alpha-fill" style="width:' + a2.toFixed(1) + '%"></span></span><span class="alpha-val">' + a2.toFixed(1) + '%</span></div>';
      }).join('') +
      '</div>' +
      '<div class="tiny muted" style="margin-top:7px">α = (' + form.alpha[0].toFixed(3) + ', ' + form.alpha[1].toFixed(3) + ')；α² 是 U 空间的方差贡献。</div>');
    setHTML('formFormula',
      '<div class="fl-label">FORM / HLRF · 代入</div>' +
      '<div class="fl-svg">' + U.formula('hlrf') + '</div>' +
      '<div class="fl-sub">U* = (' + form.uStar[0].toFixed(3) + ', ' + form.uStar[1].toFixed(3) + ')，β = ' + M.fmt.num(form.beta, 4) + '</div>' +
      '<div class="tiny muted">第 1 步的垂足就是 MVFOSM 的 U_L；所以 MVFOSM = HLRF 的第 1 步。</div>');

    // Convergence plot
    const bp = plots.beta;
    bp.opts.equal = false;
    bp.opts.xlabel = 'k';
    bp.opts.ylabel = 'β_k';
    bp.setRange([-0.2, Math.max(6, form.history.length - 1) + 0.2], [0, Math.max(2.3, form.beta * 1.15)]);
    bp.begin(); bp.grid();
    bp.line(form.history.map(h => [h.k, h.beta]), { color: C.method.form, width: 2 });
    bp.scatter(form.history.map(h => [h.k, h.beta]), { color: C.method.form, size: 3.2, stroke: '#fff' });
    bp.line([[-0.2, form.beta], [form.history.length - 1 + 0.2, form.beta]], { color: C.red, width: 1, dash: [5, 4], alpha: 0.7 });
    bp.scatter([[form.history[step].k, form.history[step].beta]], { color: C.red, size: 4.5, stroke: '#fff' });
    bp.end(); bp.axes();
    setText('betaChartTag', 'β* = ' + M.fmt.beta(form.beta));

    const gp = plots.g;
    gp.opts.equal = false;
    gp.opts.xlabel = 'k';
    gp.opts.ylabel = '|g|';
    gp.opts.ylog = true;
    gp.setRange([-0.2, Math.max(6, form.history.length - 1) + 0.2], [1e-10, 1e2]);
    gp.begin(); gp.grid();
    gp.line(form.history.map(h => [h.k, Math.max(1e-15, Math.abs(h.g))]), { color: C.method.form, width: 2 });
    gp.scatter(form.history.map(h => [h.k, Math.max(1e-15, Math.abs(h.g))]), { color: C.method.form, size: 3.2, stroke: '#fff' });
    gp.scatter([[form.history[step].k, Math.max(1e-15, Math.abs(form.history[step].g))]], { color: C.red, size: 4.5, stroke: '#fff' });
    gp.end(); gp.axes();
  }

  /* ---------------------------- Station 6 SORM --------------------------- */
  function drawSorm() {
    const main = app.main;
    const form = main.form;
    const so = main.sorm;
    const u = form.uStar;
    const plot = plots.sorm;
    const T = RL.Model.transform(main.p, 'chol');
    const winX = 1.6, winY = 1.25;
    plot.opts.equal = true;
    plot.opts.xlabel = 'U₁';
    plot.opts.ylabel = 'U₂';
    plot.setRange([u[0] - winX, u[0] + winX], [u[1] - winY, u[1] + winY]);
    plot.begin(); plot.grid();
    // Failure domain / true curve: draw beyond the window then clip, so nothing is cut off at data endpoints in U space
    clipPlot(plot, () => {
      plot.fillPolygon(failurePolyX(main.example, -100, 100, 1e6, 500).map(T.toU), { color: C.failure });
      plot.line(curveX(main.example, -100, 100, 500).map(T.toU), { color: C.blue, width: 2.6 });
    });
    // Tangent
    const tan = tangentU(u, 0, form.gradU, u[0] - winX, u[0] + winX);
    plot.line(tan, { color: C.method.form, width: 2, dash: [7, 4] });
    // Osculating parabola
    const exag = state.sormExag ? 3 : 1;
    const kap = so.kappa * exag;
    const n = so.n, e = so.e;
    const par = [];
    for (let i = -60; i <= 60; i++) {
      const s = i / 60 * 1.25;
      par.push([u[0] + s * e[0] - 0.5 * kap * s * s * n[0],
                u[1] + s * e[1] - 0.5 * kap * s * s * n[1]]);
    }
    plot.line(par, { color: C.green, width: 2.2 });
    // Osculating circle
    if (state.sormCircle && Math.abs(kap) > 1e-9) {
      const R = 1 / Math.abs(kap);
      const cx = u[0] - R * n[0], cy = u[1] - R * n[1];
      plot.circle(cx, cy, R, { color: C.purple, width: 1.2, dash: [5, 5], alpha: 0.65 });
    }
    // Direction to the origin
    plot.arrow(u[0], u[1], u[0] - n[0] * 0.9, u[1] - n[1] * 0.9, { color: C.gray, width: 1.1, dash: [3, 3], head: 6 });
    plot.star(u[0], u[1], 9.5, C.red);
    plot.end(); plot.axes();

    plot.tag(u[0], u[1], 'U*', { dx: -8, dy: -20, align: 'right', size: 10.5, color: C.red, border: '#f0c2c2' });
    plot.tag(u[0] - n[0] * 0.9, u[1] - n[1] * 0.9, '→ O', { dx: 6, dy: 0, size: 10, color: C.muted, border: '#d0d5dd' });
    plot.tag(u[0] + e[0] * 0.9, u[1] + e[1] * 0.9, '切线', { dx: 4, dy: -10, size: 10, color: C.method.form, border: '#f0c2c2' });
    plot.tag(u[0] + e[0] * 0.6 - 0.5 * kap * 0.36 * n[0], u[1] + e[1] * 0.6 - 0.5 * kap * 0.36 * n[1],
      'SORM', { dx: -10, dy: 18, size: 10, color: '#1a6b1a', border: '#c7e5c7' });
    plot.legend([
      { type: 'line', color: C.blue, label: '真实极限状态面' },
      { type: 'line', color: C.method.form, label: 'FORM 切线', dash: [7, 4] },
      { type: 'line', color: C.green, label: 'SORM 密切抛物线' },
    ], { x: plot.rect().x + 9, y: plot.rect().y + 9 });
    updateSormUI();
  }

  function updateSormUI() {
    const main = app.main;
    const so = main.sorm;
    const form = main.form;
    const ex = main.exact;
    setText('sormTag', 'κ=' + so.kappa.toFixed(4) + ' · βκ=' + so.betaKappa.toFixed(3) + ' · 因子 ' + so.factor.toFixed(3));
    setHTML('sormMetrics',
      '<div class="metric"><div class="m-label">主曲率 κ</div><div class="m-value">' + so.kappa.toFixed(4) + '</div><div class="m-sub">1/κ ≈ ' + (isFinite(so.radius) ? so.radius.toFixed(2) : '∞') + '</div></div>' +
      '<div class="metric"><div class="m-label">βκ</div><div class="m-value">' + so.betaKappa.toFixed(3) + '</div><div class="m-sub">β = ' + M.fmt.beta(form.beta) + '</div></div>' +
      '<div class="metric"><div class="m-label">修正因子</div><div class="m-value">' + so.factor.toFixed(3) + '</div><div class="m-sub">1/√(1+βκ)</div></div>' +
      '<div class="metric"><div class="m-label">Pf (SORM)</div><div class="m-value" style="font-size:18px">' + M.fmt.pct(so.pf, 3) + '</div><div class="m-sub">FORM ' + M.fmt.pct(form.pf, 3) + '</div></div>');

    const items = [
      { name: 'FORM', pf: form.pf, color: C.method.form },
      { name: 'SORM', pf: so.pf, color: C.method.sorm },
      { name: '精确', pf: ex, color: C.method.exact },
    ];
    const maxPf = Math.max.apply(null, items.map(x => x.pf));
    const errForm = (form.pf - ex) / ex * 100;
    const errSorm = (so.pf - ex) / ex * 100;
    setHTML('sormBars',
      '<div class="pf-compare">' + items.map(it => {
        const err = (it.pf - ex) / ex * 100;
        return '<div class="pf-compare-row"><span>' + it.name + '</span>' +
          '<span class="pf-compare-track"><span class="pf-compare-fill" style="width:' + (it.pf / maxPf * 100).toFixed(1) + '%;--c:' + it.color + '"></span></span>' +
          '<span class="pc-val">' + M.fmt.pct(it.pf, 3) + '<span class="pc-err">' + (it.err >= 0 ? '+' : '') + err.toFixed(1) + '%</span></span></div>';
      }).join('') + '</div>' +
      '<div class="tiny muted" style="margin-top:7px">相对精确值 ' + M.fmt.pct(ex, 3) + '；SORM 把误差从 ' +
      (errForm >= 0 ? '+' : '') + errForm.toFixed(1) + '% 修正到 ' +
      (errSorm >= 0 ? '+' : '') + errSorm.toFixed(1) + '%。</div>');
    setHTML('sormFormula',
      '<div class="fl-label">SORM / Breitung · 代入</div>' +
      '<div class="fl-svg">' + U.formula('sorm_n2') + '</div>' +
      '<div class="fl-sub">Pf ≈ ' + M.fmt.pct(form.pf, 3) + ' / √(1 + ' + form.beta.toFixed(3) + '×' + so.kappa.toFixed(4) + ') = ' + M.fmt.pct(so.pf, 3) + '</div>' +
      '<div class="tiny muted">β 仍是 ' + M.fmt.beta(form.beta) + '；SORM 只改 Pf 的换算，不重新找验算点。</div>');
  }

  /* ----------------------------- Station 7 MC ---------------------------- */
  function resetMc() {
    state.mc = {
      n: 0, fails: 0, pf: 0, se: 0, ci: 0, cov: Infinity,
      x1: [], x2: [], u1: [], u2: [], fail: [], hist: [],
    };
    state.mcRng = new M.RNG(MC_SEED);
  }

  function addMc(n, silent) {
    if (!state.mc) resetMc();
    const m = state.mc;
    if (m.n >= 100000) return;
    n = Math.min(n, 100000 - m.n);
    const batch = RL.Model.sampleBatch(app.main.example, app.main.p, n, state.mcRng);
    for (let i = 0; i < batch.n; i++) {
      m.x1.push(batch.x1[i]); m.x2.push(batch.x2[i]);
      m.u1.push(batch.u1[i]); m.u2.push(batch.u2[i]);
      m.fail.push(batch.fail[i]);
      if (batch.fail[i]) m.fails++;
    }
    m.n += batch.n;
    const st = RL.Model.mcStats(m.n, m.fails);
    m.pf = st.pf; m.se = st.se; m.ci = st.ci; m.cov = st.cov;
    m.hist.push({ n: m.n, pf: m.pf, lo: Math.max(0, m.pf - m.ci), hi: m.pf + m.ci });
    if (m.hist.length > 260) m.hist.shift();
    if (!silent) {
      updateMcUI();
      drawMc();
      updateInspector();
      updateCompare();
    }
  }

  function mcBatch() {
    const el = $('#mcBatch');
    let n = el ? parseInt(el.value, 10) : 1000;
    if (!isFinite(n)) n = 1000;
    n = Math.max(100, Math.min(20000, n));
    if (el) el.value = String(n);
    return n;
  }

  function mcTarget() {
    const el = $('#mcTarget');
    let n = el ? parseInt(el.value, 10) : 100000;
    if (!isFinite(n)) n = 100000;
    n = Math.max(1000, Math.min(100000, n));
    if (el) el.value = String(n);
    return n;
  }

  function runTo(target) {
    if (!state.mc) resetMc();
    target = Math.max(1000, Math.min(100000, target));
    while (state.mc.n < target) addMc(Math.min(2000, target - state.mc.n), true);
    updateMcUI(); drawMc(); updateInspector(); updateCompare();
  }

  function drawMc() {
    if (!state.mc) resetMc();
    const m = state.mc;
    const space = state.mcSpace;
    const plot = plots.mc;
    const drawSamples = (p, kind) => {
      const total = m.n;
      const drawN = Math.min(total, 20000);
      if (drawN === 0) {
        p.star(app.main.form.xStar[0], app.main.form.xStar[1], 9.5, C.red);
        return;
      }
      const stepv = Math.max(1, Math.floor(total / drawN));
      const sx = [], sy = [], fx = [], fy = [];
      for (let i = 0; i < total; i += stepv) {
        if (kind === 'x') {
          if (m.fail[i]) { fx.push(m.x1[i]); fy.push(m.x2[i]); }
          else { sx.push(m.x1[i]); sy.push(m.x2[i]); }
        } else {
          if (m.fail[i]) { fx.push(m.u1[i]); fy.push(m.u2[i]); }
          else { sx.push(m.u1[i]); sy.push(m.u2[i]); }
        }
      }
      p.dots(sx, sy, { color: C.blue, size: 1.6, alpha: 0.19 });
      p.dots(fx, fy, { color: C.red, size: 1.8, alpha: 0.85 });
      if (kind === 'x') p.star(app.main.form.xStar[0], app.main.form.xStar[1], 9, C.dark, true);
      else p.star(app.main.form.uStar[0], app.main.form.uStar[1], 9, C.dark, true);
    };

    if (space === 'x') {
      drawXBase(plot, app.main, (p) => drawSamples(p, 'x'));
      plot.legend([
        { type: 'marker', color: C.blue, label: '安全样本' },
        { type: 'marker', color: C.red, label: '失效样本' },
        { type: 'line', color: C.blue, label: '极限状态面' },
      ], { x: plot.rect().x + 9, y: plot.rect().y + 9 });
    } else {
      drawUBase(plot, app.main, (p) => drawSamples(p, 'u'));
      plot.legend([
        { type: 'marker', color: C.blue, label: '安全样本' },
        { type: 'marker', color: C.red, label: '失效样本' },
        { type: 'line', color: C.blue, label: '极限状态面' },
      ], { x: plot.rect().x + plot.rect().w - 150, y: plot.rect().y + 9 });
    }
    setText('mcSpaceLabel', space === 'x' ? 'X 空间' : 'U 空间');

    // Running-estimate plot
    const chart = plots.mcChart;
    const main = app.main;
    const pfm = Math.max(main.form.pf, main.sorm.pf, main.exact, 0.005);
    const ymax = Math.max(pfm * 1.9, m.pf * 1.4, 0.01);
    chart.opts.equal = false;
    chart.opts.xlabel = 'N';
    chart.opts.ylabel = 'Pf';
    chart.setRange([0, 100000], [0, ymax]);
    chart.begin(); chart.grid();
    if (m.hist.length > 0) {
      const band = [];
      for (const h of m.hist) band.push([h.n, Math.min(h.hi, ymax)]);
      for (let i = m.hist.length - 1; i >= 0; i--) band.push([m.hist[i].n, Math.min(m.hist[i].lo, ymax)]);
      chart.fillPolygon(band, { color: 'rgba(148,103,189,0.14)' });
      chart.line(m.hist.map(h => [h.n, h.pf]), { color: C.method.mc, width: 2 });
      chart.line([[0, m.pf], [100000, m.pf]], { color: C.method.mc, width: 1, dash: [2, 4], alpha: 0.5 });
    }
    chart.line([[0, main.exact], [100000, main.exact]], { color: C.method.exact, width: 1, dash: [6, 4], alpha: 0.8 });
    chart.line([[0, main.form.pf], [100000, main.form.pf]], { color: C.method.form, width: 1, dash: [4, 4], alpha: 0.65 });
    chart.end(); chart.axes();
    const legendItems = [];
    if (m.hist.length > 0) legendItems.push({ type: 'line', color: C.method.mc, label: '运行估计' });
    legendItems.push({ type: 'line', color: C.method.exact, label: '精确', dash: [6, 4] });
    legendItems.push({ type: 'line', color: C.method.form, label: 'FORM', dash: [4, 4] });
    chart.legend(legendItems, { x: chart.rect().x + chart.rect().w - 128, y: chart.rect().y + 8 });
    setText('mcChartTag', m.n > 0 ? 'N=' + m.n.toLocaleString() : '尚未抽样');
    updateMcUI();
  }

  function updateMcUI() {
    const m = state.mc;
    if (!m) return;
    const pct = (x, d) => M.fmt.pct(x, d);
    setHTML('mcMetrics',
      '<div class="metric"><div class="m-label">样本数 N</div><div class="m-value">' + m.n.toLocaleString() + '</div><div class="m-sub">上限 100k</div></div>' +
      '<div class="metric"><div class="m-label">失效数</div><div class="m-value">' + m.fails.toLocaleString() + '</div><div class="m-sub">g &lt; 0</div></div>' +
      '<div class="metric"><div class="m-label">Pf（本次）</div><div class="m-value" style="font-size:18px">' + (m.n ? pct(m.pf, 3) : '—') + '</div><div class="m-sub">COV ' + (m.n && isFinite(m.cov) ? (m.cov * 100).toFixed(1) + '%' : '—') + '</div></div>' +
      '<div class="metric"><div class="m-label">95% CI</div><div class="m-value" style="font-size:15px">' + (m.n ? '±' + pct(m.ci, 3) : '—') + '</div><div class="m-sub">二项标准误</div></div>');
    setText('mcStatus', m.n ? ('N=' + m.n.toLocaleString() + '，失效 ' + m.fails.toLocaleString() + '，Pf=' + pct(m.pf, 3)) : '尚未抽样');
    const pRef = app.main.exact;
    const cov10 = pRef > 0 ? Math.sqrt((1 - pRef) / (1e4 * pRef)) * 100 : Infinity;
    const cov100 = pRef > 0 ? Math.sqrt((1 - pRef) / (1e5 * pRef)) * 100 : Infinity;
    setHTML('mcFormula',
      '<div class="fl-label">蒙特卡洛 · 代入</div>' +
      '<div class="fl-svg">' + U.formula('mc') + '</div>' +
      '<div class="fl-sub">Pf ≈ ' + (m.n ? m.fails.toLocaleString() + ' / ' + m.n.toLocaleString() + ' = ' + pct(m.pf, 3) : '—') + '</div>' +
      '<div class="tiny muted">误差 ∝ 1/√N；按当前 Pf 估算，10k 的 COV≈' +
      (isFinite(cov10) ? cov10.toFixed(1) + '%' : '—') + '，100k≈' +
      (isFinite(cov100) ? cov100.toFixed(1) + '%' : '—') + '。</div>');
  }

  /* ------------------------- Station 8 formula card ---------------------- */
  function buildFormulaSheet() {
    let html = '';
    for (const sec of FORMULA_SECTIONS) {
      html += '<section class="fs-section"><div class="fs-section-head"><h2>' + sec.title + '</h2><span>' + sec.sub + '</span></div><div class="fs-grid">';
      for (const it of sec.items) {
        html += '<div class="fs-item"><div class="fi-title">' + it.title + '<span class="tag">' + (it.tag || '') + '</span></div>' +
          '<div class="fi-formula">' + U.formula(it.id) + '</div><div class="fi-note">' + it.note + '</div></div>';
      }
      html += '</div></section>';
    }
    html += '<section class="fs-section"><div class="fs-section-head"><h2>方法对比</h2><span>当前参数</span></div><div id="fsCompare"></div></section>';
    html += '<section class="fs-section"><div class="fs-section-head"><h2>β ↔ Pf 换算</h2><span>半空间/线性边界</span></div><div id="fsBeta" class="beta-table"></div>' +
      '<div class="fs-note">β=2.0 → 2.28%；β=3.0 → 0.135%；β=4.0 → 3.17×10⁻⁵。考试先背这三档。</div></section>';
    html += '<section class="fs-section fs-code"><div class="fs-section-head"><h2>算法伪代码</h2><span>点开看完整代码</span></div><div style="padding:14px 16px;display:flex;gap:8px;flex-wrap:wrap">' +
      CODE_BUTTONS.map(([id, name]) => '<button class="btn small ghost" data-code="' + id + '">' + name + '</button>').join('') +
      '</div></section>';
    $('#formulaSheet').innerHTML = html;
    updateFormulaTables();
  }

  function updateFormulaTables() {
    if (!app || !app.main) return;
    const main = app.main;
    const ex = main.exact;
    const mcLive = state.mc && state.mc.n ? state.mc : (paramsEqual() ? MC_REF : null);
    const afNote = main.af.failed ? '方向搜索回退 FORM' : 'X 空间方向搜索；≡ FORM';
    const formSteps = main.form.history.length - 1;
    const rows = [
      ['MVFOSM', main.mv.beta, main.mv.pf, '均值点切线；换写法会变'],
      ['AFOSM', main.af.beta, main.af.pf, afNote],
      ['FORM', main.form.beta, main.form.pf, 'U 空间 HLRF；' + formSteps + ' 步'],
      ['SORM', main.form.beta, main.sorm.pf, '曲率修正；β 不变'],
      ['MC', '—', mcLive ? mcLive.pf : null, mcLive ? (mcLive.ref ? '参考 N=4×10⁶' : '本次抽样') : '去站台 7 抽样'],
      ['精确', '—', ex, '一维条件积分'],
    ];
    const comp = $('#fsCompare');
    if (comp) {
      const MCOL = { MVFOSM: C.method.mvfosm, AFOSM: C.method.afosm, FORM: C.method.form, SORM: C.method.sorm, MC: C.method.mc, '精确': C.method.exact };
      comp.innerHTML = '<table class="formula-table"><thead><tr><th>方法</th><th>β</th><th>Pf</th><th>Pf 相对误差</th><th>说明</th></tr></thead><tbody>' +
        rows.map(r => {
          const err = typeof r[2] === 'number' && isFinite(r[2]) ? (r[2] - ex) / ex * 100 : null;
          const errTxt = err == null ? '—' : (err >= 0 ? '+' : '') + err.toFixed(1) + '%';
          const betaTxt = typeof r[1] === 'number' && isFinite(r[1]) ? M.fmt.beta(r[1]) : '—';
          const pfTxt = typeof r[2] === 'number' && isFinite(r[2]) ? M.fmt.pct(r[2], 3) : '—';
          return '<tr><td><span class="m-dot" style="background:' + (MCOL[r[0]] || '#ccc') + '"></span>' + r[0] + '</td><td class="num">' + betaTxt + '</td>' +
            '<td class="num">' + pfTxt + '</td>' +
            '<td class="num">' + errTxt + '</td><td>' + r[3] + '</td></tr>';
        }).join('') + '</tbody></table>' +
        '<div class="fs-note" style="margin-top:6px">颜色 = 方法：<span class="m-dot" style="background:' + MCOL.MVFOSM + '"></span>MVFOSM、' +
        '<span class="m-dot" style="background:' + MCOL.AFOSM + '"></span>AFOSM、' +
        '<span class="m-dot" style="background:' + MCOL.FORM + '"></span>FORM、' +
        '<span class="m-dot" style="background:' + MCOL.SORM + '"></span>SORM、' +
        '<span class="m-dot" style="background:' + MCOL.MC + '"></span>MC、' +
        '<span class="m-dot" style="background:' + MCOL['精确'] + '"></span>精确积分。</div>';
    }
    const betaBox = $('#fsBeta');
    if (betaBox) {
      betaBox.innerHTML = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5].map(b =>
        '<div class="beta-cell"><div class="bc-b">β = ' + b + '</div><div class="bc-p">' + M.fmt.pct(M.normCdf(-b), 2) + '</div></div>').join('');
    }
  }

  /* ------------------------- Station 0 overview -------------------------- */
  function updateOverview() {
    if (!app || !app.main) return;
    const main = app.main;
    const cards = [
      { n: 3, name: 'MVFOSM', tag: '均值点', color: C.method.mvfosm, beta: main.mv.beta, pf: main.mv.pf, note: main.meanSafe ? '切线在均值点' : '均值点在失效域' },
      { n: 4, name: 'AFOSM', tag: 'X 空间', color: C.method.afosm, beta: main.af.beta, pf: main.af.pf, note: main.af.failed ? '方向搜索回退 FORM' : '方向搜索 ≡ FORM' },
      { n: 5, name: 'FORM', tag: 'U 空间', color: C.method.form, beta: main.form.beta, pf: main.form.pf, note: '切线-垂足，' + (main.form.history.length - 1) + ' 步' },
      { n: 6, name: 'SORM', tag: '曲率', color: C.method.sorm, beta: main.form.beta, pf: main.sorm.pf, note: 'β 不变，Pf 修正' },
      { n: 7, name: 'MC', tag: '模拟', color: C.method.mc, beta: null, pf: paramsEqual() ? MC_REF.pf : null, note: paramsEqual() ? '参考 N=4×10⁶' : '去站台 7 抽样' },
      { n: 8, name: '精确', tag: '基准', color: C.method.exact, beta: null, pf: main.exact, note: '一维条件积分' },
    ];
    setHTML('methodCards', cards.map(c =>
      '<div class="method-card" data-station="' + c.n + '" style="--c:' + c.color + '">' +
      '<div class="mc-top"><span class="mc-name">' + c.name + '</span><span class="mc-tag">' + c.tag + '</span></div>' +
      '<div class="mc-beta">' + (c.beta == null ? '—' : M.fmt.beta(c.beta)) + (c.beta == null ? '' : '<small>β</small>') + '</div>' +
      '<div class="mc-pf">Pf <b>' + (c.pf == null ? '—' : M.fmt.pct(c.pf, 2)) + '</b></div>' +
      '<div class="mc-note">' + c.note + '</div></div>').join(''));

    const items = [
      { name: 'MVFOSM', pf: main.mv.pf, beta: main.mv.beta, color: C.method.mvfosm },
      { name: 'AFOSM', pf: main.af.pf, beta: main.af.beta, color: C.method.afosm },
      { name: 'FORM', pf: main.form.pf, beta: main.form.beta, color: C.method.form },
      { name: 'SORM', pf: main.sorm.pf, beta: main.form.beta, color: C.method.sorm },
      { name: '精确', pf: main.exact, beta: null, color: C.method.exact },
    ];
    if (paramsEqual()) items.splice(4, 0, { name: 'MC 参考', pf: MC_REF.pf, beta: null, color: C.method.mc });
    setHTML('pfBars', U.pfBars(items, main.exact) +
      '<div class="pf-axis"><span>0.1%</span><span>1%</span><span>10%</span></div>');
    setHTML('overviewCallout',
      '<b>先别急着算。</b> ' + M.fmt.pct(main.mv.pf, 2) + ' 与 ' + M.fmt.pct(main.exact, 2) +
      ' 的差别不在算术，在“在哪儿线性化、把边界当成什么形状、用多少个样本”。' +
      '点任意卡片跳到对应站台；右侧结果栏会一直跟着当前参数。');
  }

  /* ------------------------ Right panel / comparison --------------------- */
  function activeKey() {
    return ({ 3: 'mv', 4: 'af', 5: 'form', 6: 'sorm', 7: 'mc', 8: 'exact' })[state.station] || 'form';
  }

  function mcArg() {
    if (state.mc && state.mc.n > 0) return state.mc;
    if (paramsEqual()) return MC_REF;
    return null;
  }

  function updateCompare() {
    if (!app || !app.main) return;
    U.setCompare(app.main, activeKey(), mcArg());
  }

  function updateInspector() {
    if (!app || !app.main) return;
    const main = app.main;
    const st = state.station;
    const unsafe = !main.meanSafe;
    const warn = $('#meanWarning');
    if (warn) {
      const show = unsafe && st !== 2 && st !== 10;
      warn.hidden = !show;
      if (show) {
        warn.innerHTML = '<b>均值点在失效域：</b> g(μ) = ' + M.fmt.num(main.mv.muG, 3) +
          ' ≤ 0。均值点法的线性化、以及以均值点为起点的 AFOSM/HLRF 都失去了“最可能失效点”的解释；请调回安全域，或改用 MC 观察。';
      }
    }
    if (st === 10) {
      const r = RL.Custom ? RL.Custom.getResult() : null;
      if (r) {
        U.setResult(r);
      } else {
        U.setResult({
          method: '自定义', badge: '待计算', badgeClass: '',
          beta: NaN, pf: NaN,
          note: '输入 g(x₁,x₂)，设好 μ/σ/ρ，再勾选方法。',
        });
      }
      $('#paramCard').style.display = 'none';
      $('#compareCard').style.display = 'none';
      updateNotes();
      return;
    }
    if (st === 2) {
      const res = intfCache.res;
      U.setResult({
        method: 'R − S 解析', badge: '精确', badgeClass: 'exact',
        beta: res.beta, pf: res.pf,
        note: '线性 g、独立正态；Pf=Φ(−β) 精确。',
      });
    } else if (st === 3) {
      const err = (main.mv.pf - main.exact) / main.exact * 100;
      U.setResult({
        method: 'MVFOSM', badge: unsafe ? '假设不成立' : '近似', badgeClass: '',
        beta: main.mv.beta, pf: main.mv.pf,
        note: unsafe
          ? 'g(μ)≤0：均值点已在失效域，MVFOSM 的 β/Pf 不能作可靠度解释。'
          : '均值点切线；本例 Pf 比精确值高 ' + err.toFixed(0) + '%。',
      });
    } else if (st === 4) {
      U.setResult({
        method: 'AFOSM', badge: main.af.failed ? '回退' : (unsafe ? '假设不成立' : '近似'), badgeClass: '',
        beta: main.af.beta, pf: main.af.pf,
        note: (main.af.failed
          ? '方向搜索未穿过边界，已回退 FORM；β/Pf 为 FORM 结果。'
          : 'X 空间方向搜索；与 FORM 同设计点（≡）。') + (unsafe ? ' 注意：g(μ)≤0。' : ''),
      });
    } else if (st === 5) {
      U.setResult({
        method: 'FORM', badge: unsafe ? '注意' : '近似', badgeClass: '',
        beta: main.form.beta, pf: main.form.pf,
        note: unsafe
          ? '均值点在失效域，HLRF 结果仅作数值演示。'
          : 'U 空间 HLRF；' + (main.form.history.length - 1) + ' 次迭代收敛。',
      });
    } else if (st === 6) {
      const errS = (main.sorm.pf - main.exact) / main.exact * 100;
      U.setResult({
        method: 'SORM', badge: unsafe ? '注意' : '近似', badgeClass: '',
        beta: main.form.beta, pf: main.sorm.pf,
        note: unsafe
          ? '均值点在失效域，SORM 结果仅作数值演示。'
          : 'Breitung 曲率修正；Pf 比精确值' + (errS >= 0 ? '高 ' : '低 ') + Math.abs(errS).toFixed(1) + '%。',
      });
    } else if (st === 7) {
      const m = state.mc;
      const has = m && m.n > 0;
      U.setResult({
        method: 'MC', badge: '模拟', badgeClass: 'sim',
        beta: NaN, pf: has ? m.pf : NaN,
        note: (has ? ('N=' + m.n.toLocaleString() + '；95% CI ±' + M.fmt.pct(m.ci, 3)) : ('尚未抽样；精确参考 ' + M.fmt.pct(main.exact, 3))) +
          (unsafe ? '（均值点在失效域，MC 仍可直接统计）' : ''),
      });
    } else if (st === 8) {
      U.setResult({
        method: '精确积分', badge: '基准', badgeClass: 'exact',
        beta: main.form.beta, pf: main.exact,
        note: '一维条件积分；β 为 FORM 设计点。' + (unsafe ? ' 注意：g(μ)≤0。' : ''),
      });
    } else if (st === 9) {
      const c = RL.Model.tangentErrorCase(state.tanBeta, state.tanKappa);
      U.setResult({
        method: '切线误差', badge: '对比', badgeClass: '',
        beta: c.beta, pf: c.extreme,
        note: '同图：切线/设计点；极端圆外 Pf=' + M.fmt.pct(c.extreme, 3) + '，线性 Pf=' + M.fmt.pct(c.linear, 3) + '。',
      });
    } else {
      U.setResult({
        method: 'FORM', badge: unsafe ? '注意' : '近似', badgeClass: '',
        beta: main.form.beta, pf: main.form.pf,
        note: unsafe ? '均值点在失效域，结果仅作数值演示。' : '当前参数下的验算点法结果。',
      });
    }
    updateNotes();
    $('#paramCard').style.display = (st === 2 || st === 8 || st === 10) ? 'none' : '';
    $('#compareCard').style.display = (st === 2 || st === 8 || st === 10) ? 'none' : '';
  }

  function updateNotes() {
    U.setNotes(NOTES[state.station] || []);
  }

  /* --------------------------- Station switching ------------------------- */
  function activate(i) {
    if (!app) return;
    state.station = i;
    $$('.station').forEach(s => s.classList.toggle('active', +s.dataset.station === i));
    $$('.rail-btn').forEach(b => b.classList.toggle('active', +b.dataset.station === i));
    if (document.body.classList.contains('mobile')) {
      const activeRail = $('.rail-btn.active');
      if (activeRail && activeRail.scrollIntoView) {
        activeRail.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    }
    stopAll();
    if (i === 2) { computeIntf(); updateIntfUI(); }
    if (i === 7 && !state.mc) resetMc();
    if (i === 10 && RL.Custom) RL.Custom.activate();
    updateInspector();
    updateCompare();
    updateNotes();
    drawActive();
    setText('statusText', i + ' · ' + STATIONS[i].title + ' — ' + STATIONS[i].sub);
    const seedEl = $('#seedText');
    if (seedEl) seedEl.hidden = !(i === 7 || i === 10);
    // On first entry to 4/5/7, auto-play the demo once; skip when auto=0 is explicit or when a specific step is shared.
    if (state.autoDemo && !state.autoPlayed[i] && (i === 4 || i === 5 || i === 7)) {
      setTimeout(() => {
        if (!state.autoDemo || state.station !== i || state.playing) return;
        state.autoPlayed[i] = true;
        if (i === 4) playAf();
        else if (i === 5) playForm();
        else playMc();
      }, 420);
    }
    const stage = $('#stage');
    if (stage) stage.scrollTop = 0;
  }

  function drawActive() {
    if (!app || !app.main) return;
    const i = state.station;
    if (i === 1) drawTransform();
    else if (i === 2) drawIntf();
    else if (i === 3) drawMv();
    else if (i === 4) drawAf();
    else if (i === 5) drawForm();
    else if (i === 6) drawSorm();
    else if (i === 7) drawMc();
    else if (i === 9) { drawAllMethods(); drawTan(); }
    else if (i === 10 && RL.Custom) RL.Custom.draw();
  }

  function refresh() {
    if (!app || !app.main) return;
    cancelTransAnim();
    updateOverview();
    updateCompare();
    updateInspector();
    updateFormulaTables();
    drawActive();
  }

  function onMainChanged() {
    if (!app) return;
    state.hlrStep = app.main.form.history.length - 1;
    state.afStep = app.main.af.history.length ? app.main.af.history.length - 1 : 0;
    resetMc();
    refresh();
  }

  /* --------------------------- Animation control ------------------------- */
  function stopAll() {
    for (const k in timers) { clearInterval(timers[k]); delete timers[k]; }
    cancelTransAnim();
    state.playing = null;
    const fp = $('#formPlay'), ap = $('#afPlay'), mp = $('#mcPlay'), tp = $('#transPlay');
    if (fp) fp.textContent = '播放';
    if (ap) ap.textContent = '播放';
    if (mp) mp.textContent = '连续抽样';
    if (tp) tp.textContent = '播放';
  }

  function playTransform() {
    if (state.playing === 'trans') { stopAll(); return; }
    stopAll();
    if (state.transformStep >= 3) {
      state.transformStep = 0;
      updateTransformUI();
      drawTransform();
    }
    state.playing = 'trans';
    const btn = $('#transPlay');
    if (btn) btn.textContent = '暂停';
    setTransformStep(state.transformStep + 1);
    timers.trans = setInterval(() => {
      if (state.transformStep >= 3) { stopAll(); return; }
      setTransformStep(state.transformStep + 1);
    }, 1500);
  }

  function playForm() {
    if (state.playing === 'form') { stopAll(); return; }
    stopAll();
    const hist = app.main.form.history;
    if (state.hlrStep >= hist.length - 1) state.hlrStep = 0;
    state.playing = 'form';
    $('#formPlay').textContent = '暂停';
    updateFormUI(); drawForm();
    timers.form = setInterval(() => {
      if (state.hlrStep >= hist.length - 1) { stopAll(); return; }
      state.hlrStep++;
      updateFormUI(); drawForm();
    }, 680);
  }

  function playAf() {
    if (state.playing === 'af') { stopAll(); return; }
    stopAll();
    const hist = app.main.af.history;
    if (!hist.length) { U.toast('本组参数下 AFOSM 已回退 FORM，无迭代可播放'); return; }
    if (state.afStep >= hist.length - 1) state.afStep = 0;
    state.playing = 'af';
    $('#afPlay').textContent = '暂停';
    updateAfUI(); drawAf();
    timers.af = setInterval(() => {
      if (state.afStep >= hist.length - 1) { stopAll(); return; }
      state.afStep++;
      updateAfUI(); drawAf();
    }, 720);
  }

  function playMc() {
    if (state.playing === 'mc') { stopAll(); return; }
    stopAll();
    if (!state.mc) resetMc();
    state.playing = 'mc';
    $('#mcPlay').textContent = '暂停';
    const batch = mcBatch();
    timers.mc = setInterval(() => {
      if (state.mc.n >= 100000) { stopAll(); return; }
      addMc(Math.min(batch, 100000 - state.mc.n));
    }, 95);
  }

  function stepActive() {
    if (state.station === 1) {
      setTransformStep(state.transformStep + 1);
    } else if (state.station === 4) {
      const af = app.main.af;
      if (!af.history.length) { U.toast('本组参数下 AFOSM 已回退 FORM，无迭代可单步'); return; }
      state.afStep = Math.min(af.history.length - 1, state.afStep + 1);
      updateAfUI(); drawAf();
    } else if (state.station === 5) {
      state.hlrStep = Math.min(app.main.form.history.length - 1, state.hlrStep + 1);
      updateFormUI(); drawForm();
    } else if (state.station === 7) {
      addMc(mcBatch());
    }
  }

  function playPause() {
    if (state.station === 1) playTransform();
    else if (state.station === 4) playAf();
    else if (state.station === 5) playForm();
    else if (state.station === 7) playMc();
  }

  /* ------------------- Station 9 combined plot + tangent error ------------- */
  function mcCompareValue() {
    if (state.mc && state.mc.n > 0) return { pf: state.mc.pf, n: state.mc.n, live: true };
    if (paramsEqual()) return { pf: MC_REF.pf, n: MC_REF.n, live: false, ref: true };
    return null;
  }

  function drawAllMethods() {
    if (!app || !app.main) return;
    const main = app.main, ex = main.example, p = main.p;
    const mu = [p.mu1, p.mu2];
    const stepMap = { x: 0, y: 1, z: 2, u: 3 };
    const step = stepMap[state.allSpace] || 0;
    const st = RL.Model.transformStage(p, step, 'chol');
    const map = st.map;
    const plot = plots.allMethods;
    const card = $('#allMethodsCard');
    if (card) card.classList.add('equal-mode');
    plot.opts.equal = true;
    plot.opts.xlabel = st.xlabel;
    plot.opts.ylabel = st.ylabel;
    plot.opts.axisBold = true;
    plot.opts.xTickTarget = 10;
    plot.opts.yTickTarget = 8;
    if (state.allSpace === 'x') {
      // X space: shared window 0–22, square canvas, same unit length for X1/X2
      plot.setRange([0, 22], [0, 22]);
    } else if (state.allSpace === 'z') {
      plot.setRange([-9, 9], [-9, 9]);
    } else if (state.allSpace === 'u') {
      const L = Math.max(5, main.form.beta * 2.2);
      plot.setRange([-L, L], [-L, L]);
    } else {
      plot.setRange([-30, 30], [-30, 30]);
    }
    if (state.allView) plot.setRange(state.allView.xlim, state.allView.ylim);
    plot.begin(); plot.grid();
    const T = RL.Model.transform(p, 'chol');
    const so = main.sorm, u = main.form.uStar;
    const xStar = main.form.xStar;
    const x1min = -100, x1max = 100;
    const slope = Math.abs(main.mv.gradX[1]) > 1e-12 ? -main.mv.gradX[0] / main.mv.gradX[1] : 0;
    const meanTangent = [
      [x1min, mu[1] + slope * (x1min - mu[0])],
      [x1max, mu[1] + slope * (x1max - mu[0])],
    ];
    const par = [];
    for (let i = -60; i <= 60; i++) {
      const s = i / 20;
      const uu = [
        u[0] + s * so.e[0] - 0.5 * so.kappa * s * s * so.n[0],
        u[1] + s * so.e[1] - 0.5 * so.kappa * s * s * so.n[1],
      ];
      par.push(map(T.toX(uu)));
    }
    clipPlot(plot, () => {
      plot.fillPolygon(failurePolyX(ex, x1min, x1max, 1e6, 600).map(map), { color: C.failure });
      plot.line(curveX(ex, x1min, x1max, 600).map(map), { color: C.blue, width: 2.6 });
      for (const r of [1, 2, 3]) {
        plot.line(ellipsePoints(T.mu, T.L, r).map(map), { color: '#cbd5e1', width: 1, dash: [4, 4], alpha: 0.85 });
      }
      plot.line(meanTangent.map(map), { color: C.method.mvfosm, width: 1, dash: [3, 5], alpha: 0.5 });
      plot.line(tangentX(ex, mu, main.mv.muG, main.mv.gradX, x1min, x1max).map(map), { color: C.method.mvfosm, width: 2, dash: [7, 4] });
      plot.line(tangentX(ex, xStar, 0, ex.grad(xStar), x1min, x1max).map(map), { color: C.method.form, width: 2, dash: [7, 4] });
      plot.line(par, { color: C.method.sorm, width: 2.2 });
    });
    const meanM = map(mu), lineM = map([10, 50]), starM = map(xStar);
    const uLm = map(T.toX(main.mv.uL));
    // Line from the origin: its length in U space is β, directly readable in the 1:1 view.
    plot.line([[0, 0], uLm], { color: C.method.mvfosm, width: 1, dash: [3, 3], alpha: 0.5 });
    plot.line([[0, 0], starM], { color: C.method.form, width: 1, dash: [3, 3], alpha: 0.5 });
    plot.scatter([[0, 0]], { color: C.dark, size: 4.5, stroke: '#fff' });
    plot.square(meanM[0], meanM[1], 6, C.method.mvfosm);
    plot.diamond(uLm[0], uLm[1], 5.5, C.method.mvfosm);
    plot.star(starM[0], starM[1], 10, C.method.form);
    plot.diamond(starM[0], starM[1], 8, C.method.afosm);
    plot.end(); plot.axes();

    const inView = (q) => q[0] >= plot.xlim[0] && q[0] <= plot.xlim[1] && q[1] >= plot.ylim[0] && q[1] <= plot.ylim[1];
    plot.tag(0, 0, 'O', { dx: -16, dy: 14, size: 10, color: C.dark, border: '#d0d5dd' });
    if (inView(meanM)) plot.tag(meanM[0], meanM[1], '均值 μ（g=60）', { dx: 8, dy: -24, size: 10, color: C.method.mvfosm, border: '#f0d5b0' });
    if (inView(lineM)) plot.tag(lineM[0], lineM[1], 'MVFOSM 线性化 g=0', { dx: 8, dy: 18, size: 10, color: C.method.mvfosm, border: '#f0d5b0' });
    if (inView(uLm)) plot.tag(uLm[0], uLm[1], 'β_M=' + M.fmt.beta(main.mv.beta), { dx: -10, dy: 14, align: 'right', size: 10, color: C.method.mvfosm, border: '#f0d5b0' });
    if (inView(starM)) plot.tag(starM[0], starM[1], 'AFOSM ≡ FORM  β=' + M.fmt.beta(main.form.beta), { dx: -12, dy: -22, align: 'right', size: 10, color: C.method.form, border: '#f0c2c2' });
    const parMid = par[Math.floor(par.length / 2)];
    if (parMid && inView(parMid)) plot.tag(parMid[0], parMid[1], 'SORM 二阶  β=' + M.fmt.beta(main.form.beta), { dx: 8, dy: 18, size: 10, color: C.method.sorm, border: '#c7e5c7' });
    plot.legend([
      { type: 'line', color: C.blue, label: '极限状态面' },
      { type: 'line', color: '#cbd5e1', label: st.equal ? '等 β 圆' : '等概率椭圆', dash: [4, 4] },
      { type: 'line', color: C.method.mvfosm, label: 'MVFOSM g=0 切线', dash: [7, 4] },
      { type: 'line', color: C.method.mvfosm, label: '过 μ 的平行切线（g=60）', dash: [3, 5] },
      { type: 'line', color: C.method.form, label: 'AFOSM=FORM 切线', dash: [7, 4] },
      { type: 'line', color: C.method.sorm, label: 'SORM 二阶' },
    ], { x: plot.rect().x + 9, y: plot.rect().y + 9 });
    const spaceNames = { x: 'X 空间', y: 'Y 空间', z: 'Z 空间', u: 'U 空间' };
    setText('allSpaceName', spaceNames[state.allSpace] + ' · 颜色 = 方法');

    const mc = mcCompareValue();
    const vals = [
      ['MVFOSM', main.mv.beta, main.mv.pf, C.method.mvfosm],
      ['AFOSM', main.af.beta, main.af.pf, C.method.afosm],
      ['FORM', main.form.beta, main.form.pf, C.method.form],
      ['SORM', main.form.beta, main.sorm.pf, C.method.sorm],
      ['MC', null, mc ? mc.pf : null, C.method.mc],
      ['精确', null, main.exact, C.method.exact],
    ];
    setHTML('allMethodsNote',
      '<div class="method-legend" style="margin:2px 0 0">' + vals.map(v =>
        '<span><i style="background:' + v[3] + '"></i>' + v[0] + (v[1] == null ? '' : ' β=' + M.fmt.beta(v[1])) +
        (v[2] == null ? ' Pf=—' : ' Pf=' + M.fmt.pct(v[2], 3)) + '</span>').join('') + '</div>' +
      '<span style="color:#667085">MVFOSM 的 g=0 线性化边界不穿过均值（g(μ)=60）；浅橙虚线是过 μ 的平行切线，二者相差 g/‖∇g‖。图中 β 是 U 空间到原点的距离；X/Y/Z 坐标比例不同时，视觉长度不等于 β，比较实际距离请切到 U 空间。</span>' +
      '<div class="tiny muted" style="margin-top:2px">1:1 视图：两轴单位长度相同（X 用 0–22 窗口，U 以设计点 β 为中心；画布为正方形）；原点连线在 U 空间长度就是 β。滚轮缩放、拖动平移、双击复位。</div>' +
      (main.af.failed ? ' <span style="color:#8a4b00">AFOSM 本组参数回退 FORM。</span>' : ''));
  }

  function drawTan() {
    const beta = state.tanBeta, kappa = state.tanKappa;
    const c = RL.Model.tangentErrorCase(beta, kappa);
    const plot = plots.tan;
    const yHalf = Math.max(4.5, beta * 2);
    const xHalf = Math.max(yHalf, beta + 0.5 * kappa * yHalf * yHalf + 1);
    const xmin = -xHalf, xmax = xHalf, ymin = -yHalf, ymax = yHalf;
    // Draw boundaries/failure domains beyond the window then clip, avoiding a "chopped off" look at ±yHalf.
    const yLo = -Math.max(60, yHalf * 4), yHi = -yLo;
    plot.opts.equal = true;
    plot.opts.xlabel = 'U₁';
    plot.opts.ylabel = 'U₂';
    plot.setRange([xmin, xmax], [ymin, ymax]);
    plot.begin(); plot.grid();
    // Failure-domain fill (currently selected case)
    let fill = null;
    const fillColors = {
      linear: 'rgba(255,127,14,0.12)',
      convex: 'rgba(31,119,180,0.12)',
      concave: 'rgba(214,39,40,0.11)',
      extreme: 'rgba(148,103,189,0.13)',
    };
    if (state.tanCase === 'linear') {
      fill = [[beta, yLo], [xmax, yLo], [xmax, yHi], [beta, yHi]];
    } else if (state.tanCase === 'convex' || state.tanCase === 'concave') {
      const sgn = state.tanCase === 'convex' ? 1 : -1;
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const u2 = yLo + (yHi - yLo) * i / 160;
        pts.push([beta + sgn * kappa * u2 * u2 / 2, u2]);
      }
      fill = pts.concat([[xmax, yHi], [xmax, yLo]]);
    } else {
      // Outside the circle: even-odd ring fill within the plot rectangle
      const r = plot.rect(), ctx = plot.ctx;
      const cx = plot.sx(0), cy = plot.sy(0);
      const rr = Math.abs(plot.sx(beta) - cx);
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h);
      ctx.arc(cx, cy, rr, 0, Math.PI * 2, true);
      ctx.fillStyle = fillColors.extreme; ctx.fill('evenodd'); ctx.restore();
    }
    clipPlot(plot, () => {
      if (fill) plot.fillPolygon(fill, { color: fillColors[state.tanCase] });
      // Density contour lines
      for (const rr of [1, 2, 3]) plot.circle(0, 0, rr, { color: '#cbd5e1', width: 1, dash: [3, 4], alpha: 0.75 });
      // Four boundaries; highlight the selected one, fade the rest, draw beyond the window and clip
      const on = (name) => state.tanCase === name;
      plot.line([[beta, yLo], [beta, yHi]], { color: C.method.mvfosm, width: on('linear') ? 2.4 : 1.3, alpha: on('linear') ? 1 : 0.2 });
      const cvx = [], ccv = [];
      for (let i = 0; i <= 240; i++) {
        const u2 = yLo + (yHi - yLo) * i / 240;
        cvx.push([beta + kappa * u2 * u2 / 2, u2]);
        ccv.push([beta - kappa * u2 * u2 / 2, u2]);
      }
      plot.line(cvx, { color: C.method.afosm, width: on('convex') ? 2.2 : 1.2, alpha: on('convex') ? 1 : 0.2 });
      plot.line(ccv, { color: C.method.form, width: on('concave') ? 2.2 : 1.2, alpha: on('concave') ? 1 : 0.2 });
      plot.circle(0, 0, beta, { color: C.method.mc, width: on('extreme') ? 2.2 : 1.2, dash: [5, 4], alpha: on('extreme') ? 1 : 0.22 });
      plot.star(beta, 0, 10, C.red);
    });
    plot.end(); plot.axes();
    plot.tag(beta, 0, 'M*（共同设计点）', { dx: 8, dy: -24, size: 10, color: C.red, border: '#f0c2c2' });
    plot.legend([
      { type: 'line', color: C.method.mvfosm, label: '线性 u₁=β' },
      { type: 'line', color: C.method.afosm, label: '凸 u₁=β+κu₂²/2' },
      { type: 'line', color: C.method.form, label: '凹 u₁=β−κu₂²/2' },
      { type: 'line', color: C.method.mc, label: '圆外 r=β（极端）', dash: [5, 4] },
    ], { x: plot.rect().x + 9, y: plot.rect().y + 9 });
    updateTanTable(c);
  }

  function updateTanTable(c) {
    const rows = [
      ['线性（半空间）', 'linear', c.linear, c.betaLinear, C.method.mvfosm],
      ['凸失效域', 'convex', c.convex, c.betaConvex, C.method.afosm],
      ['凹失效域', 'concave', c.concave, c.betaConcave, C.method.form],
      ['圆外（极端）', 'extreme', c.extreme, c.betaExtreme, C.method.mc],
    ];
    setHTML('tanTable',
      '<table class="compare-table" style="font-size:10.5px"><thead><tr><th>失效域</th><th>Pf</th><th>等效 β</th><th>Pf 误差</th><th>β 误差</th></tr></thead><tbody>' +
      rows.map(r => {
        const err = (r[2] / c.linear - 1) * 100;
        const be = r[3] - c.beta;
        const act = state.tanCase === r[1];
        return '<tr' + (act ? ' style="background:#f5f8fb"' : '') + '><td><span class="m-dot" style="background:' + r[4] + '"></span><b>' + r[0] + '</b></td>' +
          '<td class="num">' + M.fmt.pct(r[2], 3) + '</td><td class="num">' + r[3].toFixed(3) + '</td>' +
          '<td class="num">' + (err >= 0 ? '+' : '') + err.toFixed(1) + '%</td>' +
          '<td class="num">' + (be >= 0 ? '+' : '') + be.toFixed(3) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="tiny muted" style="margin-top:5px">线性 Pf=Φ(−β)；凸/凹为二次边界；极端为圆外 r&gt;β，Pf=exp(−β²/2)。κ=0 时三者相同。</div>');
  }

  function bindTanUI() {
    U.bindSegmented($('#allSpaceToggle'), (space) => {
      state.allSpace = space;
      state.allView = null;
      drawAllMethods();
    });
    const allCanvas = $('#allMethodsCanvas');
    const currentAllView = () => {
      const p = plots.allMethods;
      return { xlim: p.xlim.slice(), ylim: p.ylim.slice() };
    };
    const zoomAll = (factor, fx, fy) => {
      fx = fx == null ? 0.5 : fx; fy = fy == null ? 0.5 : fy;
      const v = currentAllView();
      const [x0, x1] = v.xlim, [y0, y1] = v.ylim;
      const xc = x0 + (x1 - x0) * fx, yc = y0 + (y1 - y0) * fy;
      const nx0 = xc - (xc - x0) / factor, nx1 = xc + (x1 - xc) / factor;
      const ny0 = yc - (yc - y0) / factor, ny1 = yc + (y1 - yc) / factor;
      if (!isFinite(nx0) || !isFinite(ny0) || nx1 - nx0 < 0.02 || ny1 - ny0 < 0.02) return;
      if (nx1 - nx0 > 5000 || ny1 - ny0 > 5000) return;
      state.allView = { xlim: [nx0, nx1], ylim: [ny0, ny1] };
      drawAllMethods();
    };
    $('#allZoomIn').addEventListener('click', () => zoomAll(1.28));
    $('#allZoomOut').addEventListener('click', () => zoomAll(1 / 1.28));
    $('#allZoomReset').addEventListener('click', () => { state.allView = null; drawAllMethods(); });
    allCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = allCanvas.getBoundingClientRect();
      zoomAll(e.deltaY < 0 ? 1.2 : 1 / 1.2,
        (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }, { passive: false });
    let drag = null;
    allCanvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, v: currentAllView() };
      allCanvas.classList.add('dragging');
      if (allCanvas.setPointerCapture) allCanvas.setPointerCapture(e.pointerId);
    });
    allCanvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = allCanvas.getBoundingClientRect();
      const dx = (e.clientX - drag.x) / r.width * (drag.v.xlim[1] - drag.v.xlim[0]);
      const dy = (e.clientY - drag.y) / r.height * (drag.v.ylim[1] - drag.v.ylim[0]);
      state.allView = {
        xlim: [drag.v.xlim[0] - dx, drag.v.xlim[1] - dx],
        ylim: [drag.v.ylim[0] + dy, drag.v.ylim[1] + dy],
      };
      drawAllMethods();
    });
    const endDrag = () => { drag = null; allCanvas.classList.remove('dragging'); };
    allCanvas.addEventListener('pointerup', endDrag);
    allCanvas.addEventListener('pointercancel', endDrag);
    allCanvas.addEventListener('dblclick', () => { state.allView = null; drawAllMethods(); });
    $('#tanBeta').addEventListener('input', (e) => {
      state.tanBeta = +e.target.value;
      setText('tanBetaVal', state.tanBeta.toFixed(3));
      drawTan();
    });
    $('#tanKappa').addEventListener('input', (e) => {
      state.tanKappa = +e.target.value;
      setText('tanKappaVal', state.tanKappa.toFixed(2));
      drawTan();
    });
    $('#tanCaseToggle').addEventListener('click', (e) => {
      const b = e.target.closest('[data-case]');
      if (!b) return;
      state.tanCase = b.dataset.case;
      $$('#tanCaseToggle button').forEach(x => x.classList.toggle('active', x === b));
      drawTan();
    });
  }

  /* --------------------------- Event binding ----------------------------- */
  function bindStationEvents() {
    $('#formPrev').addEventListener('click', () => {
      state.hlrStep = Math.max(0, state.hlrStep - 1); updateFormUI(); drawForm();
    });
    $('#formNext').addEventListener('click', () => {
      state.hlrStep = Math.min(app.main.form.history.length - 1, state.hlrStep + 1); updateFormUI(); drawForm();
    });
    $('#formPlay').addEventListener('click', playForm);
    $('#formReset').addEventListener('click', () => {
      stopAll(); state.hlrStep = 0; updateFormUI(); drawForm();
    });
    $('#formTable').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-k]');
      if (!tr) return;
      state.hlrStep = +tr.dataset.k; updateFormUI(); drawForm();
    });

    $('#afPrev').addEventListener('click', () => {
      if (!app.main.af.history.length) { U.toast('本组参数下 AFOSM 已回退 FORM，无迭代可回放'); return; }
      state.afStep = Math.max(0, state.afStep - 1); updateAfUI(); drawAf();
    });
    $('#afNext').addEventListener('click', () => {
      if (!app.main.af.history.length) { U.toast('本组参数下 AFOSM 已回退 FORM，无迭代可回放'); return; }
      state.afStep = Math.min(app.main.af.history.length - 1, state.afStep + 1); updateAfUI(); drawAf();
    });
    $('#afPlay').addEventListener('click', playAf);
    $('#afReset').addEventListener('click', () => {
      stopAll(); state.afStep = 0; updateAfUI(); drawAf();
    });
    $('#afTable').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-k]');
      if (!tr) return;
      state.afStep = +tr.dataset.k; updateAfUI(); drawAf();
    });

    $('#sormExag').addEventListener('change', (e) => { state.sormExag = e.target.checked; drawSorm(); });
    $('#sormCircle').addEventListener('change', (e) => { state.sormCircle = e.target.checked; drawSorm(); });

    $('#mcReset').addEventListener('click', () => { stopAll(); resetMc(); updateMcUI(); drawMc(); updateInspector(); updateCompare(); });
    $('#mcStep').addEventListener('click', () => { stopAll(); addMc(mcBatch()); });
    $('#mcRunTo').addEventListener('click', () => { stopAll(); resetMc(); runTo(mcTarget()); });
    $('#mcBatch').addEventListener('change', mcBatch);
    $('#mcTarget').addEventListener('change', mcTarget);
    $('#mcPlay').addEventListener('click', playMc);
    U.bindSegmented($('#mcSpaceToggle'), (space) => { state.mcSpace = space; drawMc(); });

    $('#methodCards').addEventListener('click', (e) => {
      const card = e.target.closest('[data-station]');
      if (card) app.setStation(+card.dataset.station);
    });
    $('#notesToggle').addEventListener('click', () => {
      const card = $('#notesToggle').closest('.notes-card');
      card.classList.toggle('collapsed');
      $('#notesCaret').textContent = card.classList.contains('collapsed') ? '▸' : '▾';
    });
    $('#printCard').addEventListener('click', () => window.print());
  }

  RL.Stations = {
    STATIONS, DEFAULT_PARAMS, DEFAULT_INTF, MC_REF, MC_SEED,
    init, activate, refresh, onMainChanged, drawActive, refreshInspector: updateInspector,
    playPause, stepActive, stopAll, resetIntf,
    resetMc, addMc, playTransform,
  };
})(typeof window !== 'undefined' ? window : globalThis);
