/* ============================================================================
 * math.js — numerical core (no DOM dependency; can be tested standalone under Node)
 * Normal distribution, 2×2 linear algebra, random numbers, formatting.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});

  /* --------------------------- Normal distribution ----------------------- */
  const SQRT2PI = Math.sqrt(2 * Math.PI);

  function normPdf(z) {
    return Math.exp(-0.5 * z * z) / SQRT2PI;
  }

  // Abramowitz & Stegun 26.2.17, absolute error < 7.5e-8, enough for 3-4 displayed digits.
  function normCdf(z) {
    const p = 0.2316419;
    const b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937;
    const b4 = -1.821255978, b5 = 1.330274429;
    const az = Math.abs(z);
    const t = 1 / (1 + p * az);
    const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
    const cdf = 1 - normPdf(az) * poly;
    return z >= 0 ? cdf : 1 - cdf;
  }

  // Acklam rational approximation + one Halley refinement, relative error ~1e-15.
  function normInv(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02,
      -2.759285104469687e+02, 1.383577518672690e+02,
      -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02,
      -1.556989798598866e+02, 6.680131188771972e+01,
      -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01,
      -2.400758277161838e+00, -2.549732539343734e+00,
      4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01,
      2.445134137142996e+00, 3.754408661907416e+00];
    const plow = 0.02425, phigh = 1 - plow;
    let q, r, x;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
          ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p > phigh) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else {
      q = p - 0.5;
      r = q * q;
      x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
          (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    // One Halley refinement (optional; accuracy is already good)
    const e = normCdf(x) - p;
    const u = e * normPdf(x);
    return x - u / (1 + x * u / 2);
  }

  /* ----------------------------- 2×2 linear algebra ---------------------- */
  function chol2(C) {
    const c11 = C[0][0], c12 = C[0][1], c22 = C[1][1];
    const l11 = Math.sqrt(c11);
    const l21 = c12 / l11;
    const l22 = Math.sqrt(Math.max(0, c22 - l21 * l21));
    return [[l11, 0], [l21, l22]];
  }

  // Symmetric 2×2 eigendecomposition, eigenvalues in descending order, det(Q)=+1; the columns of Q are the eigenvectors.
  function eig2(C) {
    const c11 = C[0][0], c12 = C[0][1], c22 = C[1][1];
    const tr = 0.5 * (c11 + c22);
    const diff = 0.5 * (c11 - c22);
    const disc = Math.hypot(diff, c12);
    const l1 = tr + disc, l2 = tr - disc;
    let v1;
    if (Math.abs(c12) > 1e-14) {
      v1 = [l1 - c22, c12];
    } else {
      v1 = c11 >= c22 ? [1, 0] : [0, 1];
    }
    const n = Math.hypot(v1[0], v1[1]) || 1;
    v1 = [v1[0] / n, v1[1] / n];
    let v2 = [-v1[1], v1[0]];
    const det = v1[0] * v2[1] - v1[1] * v2[0];
    if (det < 0) v2 = [-v2[0], -v2[1]];
    return { values: [l1, l2], Q: [[v1[0], v2[0]], [v1[1], v2[1]]] };
  }

  function matVec(A, x) {
    return [A[0][0] * x[0] + A[0][1] * x[1],
            A[1][0] * x[0] + A[1][1] * x[1]];
  }
  function matMul(A, B) {
    return [[A[0][0] * B[0][0] + A[0][1] * B[1][0],
             A[0][0] * B[0][1] + A[0][1] * B[1][1]],
            [A[1][0] * B[0][0] + A[1][1] * B[1][0],
             A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
  }
  function transpose(A) {
    return [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function norm(a) { return Math.hypot(a[0], a[1]); }
  function scale(a, s) { return [a[0] * s, a[1] * s]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function neg(a) { return [-a[0], -a[1]]; }
  function unit(a) {
    const n = norm(a);
    return n < 1e-15 ? [0, 0] : [a[0] / n, a[1] / n];
  }
  function solveLower(L, b) {
    const x0 = b[0] / L[0][0];
    const x1 = (b[1] - L[1][0] * x0) / L[1][1];
    return [x0, x1];
  }
  function det2(A) { return A[0][0] * A[1][1] - A[0][1] * A[1][0]; }
  function inv2(A) {
    const d = det2(A);
    return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
  }

  /* ----------------------------- Random numbers -------------------------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class RNG {
    constructor(seed) {
      this.next = mulberry32(seed == null ? 20261119 : seed);
      this.spare = null;
    }
    uniform() { return this.next(); }
    normal() {
      if (this.spare !== null) {
        const v = this.spare;
        this.spare = null;
        return v;
      }
      let u, v, s;
      do {
        u = 2 * this.next() - 1;
        v = 2 * this.next() - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const m = Math.sqrt(-2 * Math.log(s) / s);
      this.spare = v * m;
      return u * m;
    }
    normalPair() { return [this.normal(), this.normal()]; }
  }

  /* ------------------------------ Formatting ----------------------------- */
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

  function sci(x, digits) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const d = digits == null ? 2 : digits;
    const s = x.toExponential(d);
    const m = s.split('e');
    const exp = String(parseInt(m[1], 10)).split('').map(c => SUP[c] || c).join('');
    return m[0] + '×10' + exp;
  }

  const fmt = {
    beta(x) { return isFinite(x) ? x.toFixed(3) : '—'; },
    beta4(x) { return isFinite(x) ? x.toFixed(4) : '—'; },
    pct(x, d) {
      if (!isFinite(x)) return '—';
      const v = x * 100;
      if (v >= 1) return v.toFixed(d == null ? 2 : d) + '%';
      if (v >= 0.01) return v.toFixed(3) + '%';
      return sci(x) + '（' + v.toExponential(1) + '%）';
    },
    pctRaw(x, d) {
      if (!isFinite(x)) return '—';
      const v = x * 100;
      return v.toFixed(d == null ? 2 : d) + '%';
    },
    pp(x, d) { return (x * 100).toFixed(d == null ? 2 : d) + ' pp'; },
    num(x, d) { return isFinite(x) ? x.toFixed(d == null ? 3 : d) : '—'; },
    sign(x, d) {
      const s = (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d == null ? 3 : d);
      return s;
    },
    sci: sci,
  };

  RL.Math = {
    normPdf, normCdf, normInv,
    chol2, eig2, matVec, matMul, transpose, dot, norm, scale, add, sub, neg, unit,
    solveLower, det2, inv2,
    mulberry32, RNG,
    fmt,
  };
})(typeof window !== 'undefined' ? window : globalThis);
