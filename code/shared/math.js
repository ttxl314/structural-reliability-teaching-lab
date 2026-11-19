/* ============================================================================
 * code/shared/math.js — shared math helpers (same conventions as src/js/math.js on the page)
 * Normal distribution, 2×2 linear algebra, covariance matrix, Cholesky.
 * Used only by the module-by-module reference implementation and independent verification; the page still runs src/js at runtime.
 * ==========================================================================*/
'use strict';

const normPdf = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

// Abramowitz-Stegun 7.1.26 error-function approximation, absolute error < 1.5e-7
function normCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-0.5 * z * z);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 +
    t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

// Acklam inverse-normal approximation
function normInv(p) {
  if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : (p === 1 ? Infinity : NaN);
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
    3.754408661907416e+00];
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > pHigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

const cov = (p) => [
  [p.s1 * p.s1, p.rho * p.s1 * p.s2],
  [p.rho * p.s1 * p.s2, p.s2 * p.s2],
];

// 2×2 Cholesky: C = L Lᵀ, L lower triangular
function cholesky(C) {
  const l11 = Math.sqrt(C[0][0]);
  const l21 = C[1][0] / l11;
  const l22 = Math.sqrt(Math.max(0, C[1][1] - l21 * l21));
  return [[l11, 0], [l21, l22]];
}
const matVec = (A, x) => [
  A[0][0] * x[0] + A[0][1] * x[1],
  A[1][0] * x[0] + A[1][1] * x[1],
];
const transpose = (A) => [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norm = (a) => Math.sqrt(dot(a, a));
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const scale = (a, s) => [a[0] * s, a[1] * s];
const matMul = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];

// X = μ + L U,  U = L⁻¹(X − μ)
function toX(p, u) {
  const L = cholesky(cov(p));
  return add([p.mu1, p.mu2], matVec(L, u));
}
function toU(p, x) {
  const L = cholesky(cov(p));
  const d = sub(x, [p.mu1, p.mu2]);
  return [(d[0]) / L[0][0], (d[1] - L[1][0] * ((d[0]) / L[0][0])) / L[1][1]];
}

module.exports = {
  normPdf, normCdf, normInv, cov, cholesky,
  matVec, transpose, dot, norm, add, sub, scale, matMul, toX, toU,
};
