/* ============================================================================
 * 04_afosm.js — station 4: AFOSM / design-point method (X-space direction search)
 *
 * Formulas/steps:
 *   1. At the current point x_k compute ∇g(x_k), transform to U: g_u = Lᵀ∇g
 *   2. Direction α = −g_u/||g_u||; X-space ray x(β) = μ + β Lα
 *   3. Solve g(x(β)) = 0 along the ray (scan for the first +→−, then bisect)
 *   4. Recompute α at the new point until β and g converge
 * For normal variables it converges to the same design point as FORM (same x*, β).
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');
const { P, example } = require('./shared/example');

function solveBeta(ex, mu, d, maxB = 60, step = 0.02) {
  const f = (b) => ex.g([mu[0] + b * d[0], mu[1] + b * d[1]]);
  if (!(f(0) > 0)) return { beta: NaN, reason: 'mean-failure' };
  let prev = 0;
  for (let b = step; b <= maxB + 1e-12; b += step) {
    const fb = f(b);
    if (fb <= 0) {
      let lo = prev, hi = b;
      for (let i = 0; i < 80; i++) {
        const mid = 0.5 * (lo + hi);
        if (f(mid) > 0) lo = mid; else hi = mid;
      }
      return { beta: 0.5 * (lo + hi), reason: null };
    }
    prev = b;
  }
  return { beta: NaN, reason: 'no-crossing' };
}

function afosm(ex = example, p = P, maxit = 20, tol = 1e-8) {
  const L = M.cholesky(M.cov(p));
  const mu = [p.mu1, p.mu2];
  let x = mu.slice(), beta = 0;
  for (let k = 0; k < maxit; k++) {
    const gu = M.matVec(M.transpose(L), ex.grad(x));
    const ng = M.norm(gu);
    if (!(ng > 1e-14)) return { beta: NaN, reason: 'bad-gradient' };
    const alpha = M.scale(gu, -1 / ng);
    const d = M.matVec(L, alpha);
    const sol = solveBeta(ex, mu, d);
    if (!isFinite(sol.beta)) return { beta: NaN, reason: sol.reason };
    const xNew = M.add(mu, M.scale(d, sol.beta));
    const done = Math.abs(sol.beta - beta) < tol && Math.abs(ex.g(xNew)) < 1e-8;
    x = xNew; beta = sol.beta;
    if (done) break;
  }
  const gu = M.matVec(M.transpose(L), ex.grad(x));
  const alpha = M.scale(gu, -1 / M.norm(gu));
  return { xStar: x, uStar: M.scale(alpha, beta), beta, pf: M.normCdf(-beta), alpha };
}

module.exports = { solveBeta, afosm, demo: afosm() };
