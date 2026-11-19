/* ============================================================================
 * model.js — reliability models and the actual implementations of the four/five algorithms
 * Depends on math.js; no DOM, can be tested under Node.
 *
 * Conventions:
 *   α = −∇g(u)/‖∇g(u)‖  points to the design point; u* = β α, x* = μ + L u*
 *   (many textbooks take α along the gradient and write x* = μ − β α σ; opposite sign, same meaning)
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});
  const M = RL.Math;

  /* ------------------------------ Examples ------------------------------- */
  const EXAMPLES = {
    parabola: {
      id: 'parabola',
      name: '抛物线极限状态',
      short: 'g(X) = X₁² − 2X₂',
      vars: [
        { key: 'mu1', sym: 'μ₁', label: 'X₁ 均值', value: 10, min: 5, max: 15, step: 0.1 },
        { key: 'mu2', sym: 'μ₂', label: 'X₂ 均值', value: 20, min: 10, max: 30, step: 0.1 },
        { key: 's1', sym: 'σ₁', label: 'X₁ 标准差', value: 2, min: 1, max: 4, step: 0.05 },
        { key: 's2', sym: 'σ₂', label: 'X₂ 标准差', value: 5, min: 2, max: 8, step: 0.1 },
        { key: 'rho', sym: 'ρ₁₂', label: '相关系数', value: 0.5, min: -0.8, max: 0.9, step: 0.01 },
      ],
      g(x) { return x[0] * x[0] - 2 * x[1]; },
      grad(x) { return [2 * x[0], -2]; },
      hess() { return [[2, 0], [0, 0]]; },
      x2Of(x1) { return 0.5 * x1 * x1; },
      domain: { x1: [0, 12], x2: [0, 60] },
      failure: 'X₂ > X₁² / 2',
      note: '非线性强：均值点切线离验算点远，MVFOSM 误差大。',
    },
    rs: {
      id: 'rs',
      name: '应力-强度干涉',
      short: 'g(R,S) = R − S',
      vars: [
        { key: 'muR', sym: 'μ_R', label: 'R 均值', value: 30, min: 20, max: 40, step: 0.1 },
        { key: 'muS', sym: 'μ_S', label: 'S 均值', value: 15, min: 5, max: 25, step: 0.1 },
        { key: 'sR', sym: 'σ_R', label: 'R 标准差', value: 4, min: 1, max: 8, step: 0.05 },
        { key: 'sS', sym: 'σ_S', label: 'S 标准差', value: 3, min: 1, max: 8, step: 0.05 },
      ],
      g(x) { return x[0] - x[1]; },
      grad() { return [1, -1]; },
      hess() { return [[0, 0], [0, 0]]; },
      x2Of(x1) { return x1; },
      domain: { x1: [0, 50], x2: [0, 50] },
      failure: 'S > R',
      note: '线性极限状态：MVFOSM、AFOSM、FORM 都精确；概率干涉的经典例子。',
    },
  };

  /* ----------------------------- Covariance ------------------------------ */
  function cov(p) {
    const c = p.rho * p.s1 * p.s2;
    return [[p.s1 * p.s1, c], [c, p.s2 * p.s2]];
  }

  /* ------------------------ Coordinate transform (X→U) ------------------- */
  function transform(p, mode) {
    mode = mode || 'chol';
    const mu = [p.mu1, p.mu2];
    const C = cov(p);
    let L, Q = null, lam = null, sq = null, A, b, toU, toX;
    if (mode === 'pca') {
      const e = M.eig2(C);
      Q = e.Q;
      lam = e.values;
      sq = lam.map(Math.sqrt);
      // x = μ + Q Λ^{1/2} u; L is just a square root and need not be lower triangular
      L = [[Q[0][0] * sq[0], Q[0][1] * sq[1]],
           [Q[1][0] * sq[0], Q[1][1] * sq[1]]];
      const Qt = M.transpose(Q);
      A = [[Qt[0][0] / sq[0], Qt[0][1] / sq[0]],
           [Qt[1][0] / sq[1], Qt[1][1] / sq[1]]];
      b = M.scale(M.matVec(A, mu), -1);
      toU = (x) => {
        const y = M.matVec(Qt, M.sub(x, mu));
        return [y[0] / sq[0], y[1] / sq[1]];
      };
      toX = (u) => {
        const y = [sq[0] * u[0], sq[1] * u[1]];
        return M.add(mu, M.matVec(Q, y));
      };
    } else {
      L = M.chol2(C);
      A = M.inv2(L);
      b = M.scale(M.solveLower(L, mu), -1);
      toU = (x) => M.solveLower(L, M.sub(x, mu));
      toX = (u) => M.add(mu, M.matVec(L, u));
    }
    return { mode, mu, C, L, Q, lam, sq, A, b, toU, toX };
  }

  /* ---------------------- Mean-value first-order (MVFOSM) ---------------- */
  function mvfosm(example, p) {
    const mu = [p.mu1, p.mu2];
    const C = cov(p);
    const g0 = example.g(mu);
    const grad = example.grad(mu);
    const varG = grad[0] * grad[0] * C[0][0] +
                 grad[1] * grad[1] * C[1][1] +
                 2 * grad[0] * grad[1] * C[0][1];
    const sigmaG = Math.sqrt(Math.max(0, varG));
    const beta = g0 / sigmaG;
    const T = transform(p, 'chol');
    const gu = M.matVec(M.transpose(T.L), grad);
    const uL = M.scale(gu, -g0 / M.dot(gu, gu));
    const xL = M.add(mu, M.matVec(T.L, uL));
    return {
      muG: g0, sigmaG, varG, beta, pf: M.normCdf(-beta),
      gradX: grad, gradU: gu, uL, xL,
      cross: 2 * grad[0] * grad[1] * C[0][1],
    };
  }

  /* ------------------------- FORM / HLRF (U space) ----------------------- */
  function hlr(example, p, opts) {
    opts = opts || {};
    const T = transform(p, 'chol');
    const L = T.L;
    const maxit = opts.maxit || 30;
    const tol = opts.tol == null ? 1e-8 : opts.tol;
    let u = [0, 0];
    const hist = [];
    for (let k = 0; k < maxit; k++) {
      const x = T.toX(u);
      const g = example.g(x);
      const gx = example.grad(x);
      const gu = M.matVec(M.transpose(L), gx);
      hist.push({ k, u: u.slice(), x, g, beta: M.norm(u), gradU: gu });
      if (Math.abs(g) < tol && k > 0) break;
      const denom = M.dot(gu, gu);
      u = M.scale(gu, (M.dot(gu, u) - g) / denom);
    }
    const last = hist[hist.length - 1];
    // The displayed history stops at |g| < 1e-8; run a few extra refinement steps so the final point matches the analytical solution.
    let uFinal = last.u.slice();
    for (let i = 0; i < 6; i++) {
      const x = T.toX(uFinal);
      const g = example.g(x);
      if (Math.abs(g) < 1e-14) break;
      const gu = M.matVec(M.transpose(L), example.grad(x));
      uFinal = M.scale(gu, (M.dot(gu, uFinal) - g) / M.dot(gu, gu));
    }
    const beta = M.norm(uFinal);
    const xStar = T.toX(uFinal);
    const alpha = beta > 0 ? M.scale(uFinal, 1 / beta) : [0, 0];
    return {
      history: hist, uStar: uFinal, xStar,
      beta, pf: M.normCdf(-beta), alpha,
      alpha2: [alpha[0] * alpha[0], alpha[1] * alpha[1]],
      gradU: M.matVec(M.transpose(L), example.grad(xStar)), L, mu: T.mu,
    };
  }

  /* ---------- Advanced first-order / AFOSM (X-space direction search) ----- */
  // Along the ray x(β) = μ + βd, find the first positive root of g = 0.
  // Note: g is not guaranteed monotonic along the ray, so do not assume "double until the sign changes";
  // first scan finely for the first +→− bracket, then bisect. Returns {beta, reason}.
  function solveBeta(example, mu, d) {
    if (!isFinite(d[0]) || !isFinite(d[1])) return { beta: NaN, reason: 'bad-direction' };
    const f = (b) => example.g([mu[0] + b * d[0], mu[1] + b * d[1]]);
    const f0 = f(0);
    if (!(f0 > 0)) return { beta: NaN, reason: 'mean-failure' };
    let prev = 0;
    const maxB = 60;
    const step = 0.02;
    for (let b = step; b <= maxB + 1e-12; b += step) {
      const fb = f(b);
      if (!isFinite(fb)) return { beta: NaN, reason: 'nan' };
      if (fb <= 0) {
        let lo = prev, hi = b;
        for (let i = 0; i < 90; i++) {
          const mid = 0.5 * (lo + hi);
          const fm = f(mid);
          if (Math.abs(fm) < 1e-12) return { beta: mid, reason: null };
          if (fm > 0) lo = mid; else hi = mid;
        }
        return { beta: 0.5 * (lo + hi), reason: null };
      }
      prev = b;
    }
    return { beta: NaN, reason: 'no-crossing' };
  }

  function afosm(example, p, opts) {
    opts = opts || {};
    const T = transform(p, 'chol');
    const L = T.L, mu = T.mu;
    const maxit = opts.maxit || 20;
    const tol = opts.tol == null ? 1e-8 : opts.tol;
    let x = mu.slice();
    let beta = 0;
    const hist = [];
    let failReason = null;
    for (let k = 0; k < maxit; k++) {
      const gradX = example.grad(x);
      const gu = M.matVec(M.transpose(L), gradX);
      const ng = M.norm(gu);
      if (!isFinite(ng) || ng < 1e-14) { failReason = 'bad-gradient'; break; }
      const alpha = M.scale(gu, -1 / ng);       // points to the design point
      const d = M.matVec(L, alpha);              // x = μ + β d
      const sol = solveBeta(example, mu, d);
      if (!isFinite(sol.beta)) { failReason = sol.reason || 'no-root'; break; }
      const betaNew = sol.beta;
      const xNew = M.add(mu, M.scale(d, betaNew));
      const gNew = example.g(xNew);
      if (!isFinite(xNew[0]) || !isFinite(xNew[1]) || !isFinite(gNew)) {
        failReason = 'nan'; break;
      }
      hist.push({
        k, x: xNew.slice(), xPrev: x.slice(), g: gNew,
        beta: betaNew, alpha: alpha.slice(), d: d.slice(),
      });
      const done = Math.abs(betaNew - beta) < tol && Math.abs(gNew) < 1e-8;
      x = xNew;
      beta = betaNew;
      if (done) break;
    }
    if (failReason) {
      // Fall back to the same design point as FORM: AFOSM and FORM agree for normal variables.
      const form = hlr(example, p);
      return {
        history: [], failed: true, reason: failReason,
        xStar: form.xStar, uStar: form.uStar, beta: form.beta, pf: form.pf,
        alpha: form.alpha, L, mu, fallback: true,
      };
    }
    // Recompute α at the final point so that u* = β α and x* = μ + L u* stay consistent
    const gu = M.matVec(M.transpose(L), example.grad(x));
    const alpha = M.scale(gu, -1 / M.norm(gu));
    const uStar = M.scale(alpha, beta);
    return {
      history: hist, xStar: x, beta, pf: M.normCdf(-beta),
      alpha, uStar, L, mu, failed: false,
    };
  }

  /* ---------------- Tangent-error cases: linear / convex / concave / extreme -------------- */
  // Standard normal in U space, design point (β,0). Four failure domains:
  // linear u1 > β; convex u1 > β + κu2²/2; concave u1 > β − κu2²/2;
  // extreme: outside the circle r > β (the failure domain lies outside the density contour), Pf = exp(−β²/2).
  function tangentErrorCase(beta, kappa) {
    beta = Math.max(0.5, Math.min(4, beta == null ? 2.108 : beta));
    kappa = Math.max(0, Math.min(2, kappa == null ? 0.5 : kappa));
    const n = 400, a = -8, b = 8, h = (b - a) / n;
    let convex = 0, concave = 0;
    for (let i = 0; i <= n; i++) {
      const u2 = a + i * h;
      const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
      const phi = M.normPdf(u2);
      convex += w * phi * M.normCdf(-(beta + kappa * u2 * u2 / 2));
      concave += w * phi * M.normCdf(-(beta - kappa * u2 * u2 / 2));
    }
    convex = Math.min(1, Math.max(0, convex * h / 3));
    concave = Math.min(1, Math.max(0, concave * h / 3));
    const linear = M.normCdf(-beta);
    const extreme = Math.exp(-0.5 * beta * beta);
    const betaEq = (pf) => -M.normInv(Math.max(1e-12, Math.min(1 - 1e-12, pf)));
    return {
      beta, kappa, linear, convex, concave, extreme,
      betaLinear: beta,
      betaConvex: betaEq(convex),
      betaConcave: betaEq(concave),
      betaExtreme: betaEq(extreme),
    };
  }

  function sorm(example, p, form) {
    const T = transform(p, 'chol');
    const L = T.L;
    const x = form.xStar;
    const gx = example.grad(x);
    const Hx = example.hess(x);
    const gu = M.matVec(M.transpose(L), gx);
    const Hu = M.matMul(M.matMul(M.transpose(L), Hx), L);
    const nrm = M.norm(gu);
    const n = M.scale(gu, 1 / nrm);
    const e = [-n[1], n[0]];
    const kappa = M.dot(e, M.matVec(Hu, e)) / nrm;
    const denom = 1 + form.beta * kappa;
    const factor = denom > 1e-12 ? 1 / Math.sqrt(denom) : 1;
    return {
      kappa, betaKappa: form.beta * kappa, factor,
      pf: form.pf * factor, Hu, e, n,
      radius: Math.abs(kappa) > 1e-12 ? 1 / Math.abs(kappa) : Infinity,
      valid: denom > 0,
    };
  }

  /* ---------------------- Exact value (main example) --------------------- */
  function exactParabola(p) {
    const mu1 = p.mu1, mu2 = p.mu2, s1 = p.s1, s2 = p.s2, rho = p.rho;
    const sCond = Math.max(1e-9, s2 * Math.sqrt(Math.max(0, 1 - rho * rho)));
    const m = (x1) => mu2 + rho * s2 / s1 * (x1 - mu1);
    const a = mu1 - 8 * s1, b = mu1 + 8 * s1;
    const n = 1600;
    let sum = 0;
    for (let i = 0; i <= n; i++) {
      const x1 = a + (b - a) * i / n;
      const w = Math.exp(-0.5 * ((x1 - mu1) / s1) ** 2) / (s1 * Math.sqrt(2 * Math.PI));
      const inner = M.normCdf((m(x1) - 0.5 * x1 * x1) / sCond);
      const coef = (i === 0 || i === n) ? 0.5 : 1;
      sum += coef * w * inner;
    }
    return sum * (b - a) / n;
  }

  /* -------------------- Probability interference (R−S, independent normals) --- */
  function interference(p) {
    const beta = (p.muR - p.muS) / Math.hypot(p.sR, p.sS);
    const pf = M.normCdf(-beta);
    return { beta, pf, reliability: 1 - pf, sigmaG: Math.hypot(p.sR, p.sS), muG: p.muR - p.muS };
  }

  function interferenceCurves(p, n) {
    n = n || 240;
    const xmin = Math.min(p.muR - 4 * p.sR, p.muS - 4 * p.sS);
    const xmax = Math.max(p.muR + 4 * p.sR, p.muS + 4 * p.sS);
    const xs = [], fR = [], fS = [], overlap = [], h = [], FR = [];
    for (let i = 0; i <= n; i++) {
      const x = xmin + (xmax - xmin) * i / n;
      const zR = (x - p.muR) / p.sR;
      const zS = (x - p.muS) / p.sS;
      const dr = M.normPdf(zR) / p.sR;
      const ds = M.normPdf(zS) / p.sS;
      const fr = M.normCdf(zR);
      xs.push(x); fR.push(dr); fS.push(ds);
      overlap.push(Math.min(dr, ds));
      FR.push(fr);
      h.push(ds * fr);
    }
    const muG = p.muR - p.muS;
    const sG = Math.hypot(p.sR, p.sS);
    const gx = [], gp = [];
    for (let i = 0; i <= n; i++) {
      const x = muG - 4 * sG + 8 * sG * i / n;
      gx.push(x);
      gp.push(M.normPdf((x - muG) / sG) / sG);
    }
    return { xs, fR, fS, overlap, h, FR, xmin, xmax, gx, gp, muG, sG };
  }

  /* --------------------- Form sensitivity: R−S vs R/S−1 ------------------ */
  function formSensitivity(p) {
    p = Object.assign({ muR: 30, muS: 15, sR: 4, sS: 3 }, p || {});
    const muR = p.muR, muS = p.muS, sR = p.sR, sS = p.sS;
    const betaRS = (muR - muS) / Math.hypot(sR, sS);
    const pfRS = M.normCdf(-betaRS);
    const g0 = muR / muS - 1;
    const dR = 1 / muS;
    const dS = -muR / (muS * muS);
    const sigmaRatio = Math.sqrt(dR * dR * sR * sR + dS * dS * sS * sS);
    const betaRatio = g0 / sigmaRatio;
    return {
      muR, muS, sR, sS, betaRS, pfRS,
      g0, dR, dS, sigmaRatio, betaRatio, pfRatio: M.normCdf(-betaRatio),
      formBeta: betaRS, formPf: pfRS,
      ratioLine: (r) => 0.5 * (r + muR - muS),
    };
  }

  /* ---------------- Equivalent form of the main example: g2 = X1²/(2X2) − 1 ---- */
  function ratioMain(p) {
    const mu = [p.mu1, p.mu2];
    const g0 = mu[0] * mu[0] / (2 * mu[1]) - 1;
    const d = [mu[0] / mu[1], -mu[0] * mu[0] / (2 * mu[1] * mu[1])];
    const C = cov(p);
    const varG = d[0] * d[0] * C[0][0] + 2 * d[0] * d[1] * C[0][1] + d[1] * d[1] * C[1][1];
    const beta = g0 / Math.sqrt(Math.max(0, varG));
    return { g0, d, sigma: Math.sqrt(Math.max(0, varG)), beta, pf: M.normCdf(-beta) };
  }

  /* -------------------- Step-by-step transform (station 1) ---------------- */
  function transformStage(p, step, mode) {
    const T = transform(p, mode);
    const mu = T.mu;
    const map = step === 0 ? (x) => x.slice()
      : step === 1 ? (x) => M.sub(x, mu)
      : step === 2 ? (x) => [(x[0] - mu[0]) / p.s1, (x[1] - mu[1]) / p.s2]
      : (x) => T.toU(x);
    const labels = step === 0 ? ['X₁', 'X₂']
      : step === 1 ? ['Y₁', 'Y₂']
      : step === 2 ? ['Z₁', 'Z₂']
      : ['U₁', 'U₂'];
    const ex = EXAMPLES.parabola;
    const pts = [];
    const x1Start = ex.domain.x1[0];
    const x1End = ex.domain.x1[1];
    for (let i = 0; i <= 80; i++) {
      const x1 = x1Start + (x1End - x1Start) * i / 80;
      pts.push(map([x1, ex.x2Of(x1)]));
    }
    const corners = [
      [ex.domain.x1[0], ex.domain.x2[0]],
      [ex.domain.x1[0], ex.domain.x2[1]],
      [ex.domain.x1[1], ex.domain.x2[0]],
      [ex.domain.x1[1], ex.domain.x2[1]],
    ];
    if (step < 3) corners.forEach(c => pts.push(map(c)));
    pts.push(map([p.mu1, p.mu2]));
    const form = hlr(ex, p);
    pts.push(map(form.xStar));
    if (step === 3) {
      for (const r of [1, 2, 3]) {
        for (let i = 0; i < 24; i++) {
          const a = 2 * Math.PI * i / 24;
          pts.push([r * Math.cos(a), r * Math.sin(a)]);
        }
      }
    }
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
    for (const q of pts) {
      if (!isFinite(q[0]) || !isFinite(q[1])) continue;
      xmin = Math.min(xmin, q[0]); xmax = Math.max(xmax, q[0]);
      ymin = Math.min(ymin, q[1]); ymax = Math.max(ymax, q[1]);
    }
    const padX = Math.max(0.5, (xmax - xmin) * 0.12);
    const padY = Math.max(0.5, (ymax - ymin) * 0.14);
    let xlim = [xmin - padX, xmax + padX];
    // Standardized Z₁ axis: use a symmetric ±8 window with ticks every 2,
    // so both negative and positive sides have ticks; the geometry itself stays centred and is not truncated by data endpoints.
    if (step === 2) xlim = [-8, 8];
    const titles = ['原始 X 空间', '中心化 Y = X − μ', '标准化 Z = D⁻¹(X − μ)',
      mode === 'pca' ? '白化（PCA）' : '白化 U = L⁻¹(X − μ)'];
    const formulas = ['trans_x', 'trans_center', 'trans_scale',
      mode === 'pca' ? 'pca' : 'trans_whiten'];
    const notes = [
      '等概率线是斜椭圆：X 的分量单位、方差、相关性都不同，欧氏距离没有概率意义。',
      '减掉均值，椭圆中心移到原点；形状不变，概率密度只跟“相对均值”有关。',
      '除以标准差，两个方向都变成“几个 σ”；若 ρ=0，椭圆变成正圆；ρ≠0 仍是斜椭圆。',
      mode === 'pca'
        ? '乘 Λ^{-1/2}Qᵀ 去相关，斜椭圆变成同心圆；概率密度只跟半径有关，β 就是到原点的最近距离。'
        : '乘 L⁻¹ 去相关，斜椭圆变成同心圆；概率密度只跟半径有关，β 就是到原点的最近距离。',
    ];
    const matrix = step === 0 ? [[1, 0, 0], [0, 1, 0]]
      : step === 1 ? [[1, 0, -mu[0]], [0, 1, -mu[1]]]
      : step === 2 ? [[1 / p.s1, 0, -mu[0] / p.s1], [0, 1 / p.s2, -mu[1] / p.s2]]
      : [[T.A[0][0], T.A[0][1], T.b[0]], [T.A[1][0], T.A[1][1], T.b[1]]];
    return {
      step, T, map, labels, matrix,
      title: titles[step], formula: formulas[step], note: notes[step],
      xlim: xlim,
      ylim: [ymin - padY, ymax + padY],
      equal: step >= 2,
      xlabel: labels[0], ylabel: labels[1],
    };
  }

  /* ---------------------------- Monte Carlo ------------------------------ */
  function sampleBatch(example, p, n, rng) {
    const T = transform(p, 'chol');
    const L = T.L, mu = T.mu;
    const out = {
      n,
      x1: new Float64Array(n), x2: new Float64Array(n),
      u1: new Float64Array(n), u2: new Float64Array(n),
      fail: new Uint8Array(n),
    };
    for (let i = 0; i < n; i++) {
      const z1 = rng.normal();
      const z2 = rng.normal();
      const x1 = mu[0] + L[0][0] * z1;
      const x2 = mu[1] + L[1][0] * z1 + L[1][1] * z2;
      out.x1[i] = x1; out.x2[i] = x2;
      out.u1[i] = z1; out.u2[i] = z2;
      out.fail[i] = example.g([x1, x2]) < 0 ? 1 : 0;
    }
    return out;
  }

  function mcStats(n, fails) {
    const pf = n > 0 ? fails / n : 0;
    const se = n > 0 ? Math.sqrt(Math.max(0, pf * (1 - pf) / n)) : 0;
    return { n, fails, pf, se, ci: 1.96 * se, cov: pf > 0 ? se / pf : Infinity };
  }

  /* ------------------------------ Assembly ------------------------------- */
  function computeMain(p) {
    const example = EXAMPLES.parabola;
    const mv = mvfosm(example, p);
    const af = afosm(example, p);
    const form = hlr(example, p);
    const so = sorm(example, p, form);
    const exact = exactParabola(p);
    const ratio = ratioMain(p);
    return {
      p, example, C: cov(p), mv, af, form, sorm: so, exact, ratio,
      meanSafe: example.g([p.mu1, p.mu2]) > 0,
      chi2: Math.exp(-0.5 * form.beta * form.beta),
    };
  }

  /* ------------------------------ Self-test ------------------------------ */
  function selfTest() {
    const p = { mu1: 10, mu2: 20, s1: 2, s2: 5, rho: 0.5 };
    const main = computeMain(p);
    const rs = formSensitivity();
    const L = transform(p, 'chol').L;
    const tests = [
      ['Φ(0)=0.5', Math.abs(M.normCdf(0) - 0.5) < 1e-8],
      ['Φ(−1)=0.158655', Math.abs(M.normCdf(-1) - 0.1586552539) < 1e-7],
      ['Φ(−2.10834)=1.7501%', Math.abs(M.normCdf(-2.1083396826) - 0.0175008089) < 2e-7],
      ['Cholesky L11=2', Math.abs(L[0][0] - 2) < 1e-12],
      ['Cholesky L22=√18.75', Math.abs(L[1][1] - Math.sqrt(18.75)) < 1e-12],
      ['MVFOSM β=1.66410', Math.abs(main.mv.beta - 1.6641005887) < 1e-7],
      ['MVFOSM Pf=4.8046%', Math.abs(main.mv.pf - 0.04804616) < 1e-7],
      ['HLRF β=2.10834', Math.abs(main.form.beta - 2.1083396823) < 1e-7],
      ['HLRF u1*=−1.92808', Math.abs(main.form.uStar[0] + 1.92808099) < 1e-7],
      ['HLRF u2*=0.852995', Math.abs(main.form.uStar[1] - 0.85299468) < 1e-7],
      ['HLRF x1*=6.14384', Math.abs(main.form.xStar[0] - 6.143838) < 1e-5],
      ['HLRF x2*=18.87337', Math.abs(main.form.xStar[1] - 18.873373) < 1e-5],
      ['FORM Pf=1.7501%', Math.abs(main.form.pf - 0.0175008089) < 2e-7],
      ['PCA 下 β 不变', Math.abs(M.norm(transform(p, 'pca').toU(main.form.xStar)) - main.form.beta) < 1e-10],
      ['SORM κ=0.061176', Math.abs(main.sorm.kappa - 0.06117568) < 1e-6],
      ['SORM Pf=1.64708%', Math.abs(main.sorm.pf - 0.01647082) < 1e-7],
      ['精确 Pf=1.62263%', Math.abs(main.exact - 0.0162263) < 5e-6],
      ['R−S β=3.000', Math.abs(rs.betaRS - 3) < 1e-12],
      ['R/S−1 MVFOSM β=2.08013', Math.abs(rs.betaRatio - 2.0801257358) < 1e-7],
      ['主例题比值写法 β=1.71429', Math.abs(main.ratio.beta - 1.7142857143) < 1e-7],
    ];
    return tests.map(([name, ok]) => ({ name, ok }));
  }

  RL.Model = {
    EXAMPLES,
    cov, transform,
    mvfosm, hlr, afosm, sorm,
    exactParabola, interference, interferenceCurves,
    formSensitivity, ratioMain, transformStage,
    sampleBatch, mcStats, computeMain, selfTest, tangentErrorCase,
  };
})(typeof window !== 'undefined' ? window : globalThis);
