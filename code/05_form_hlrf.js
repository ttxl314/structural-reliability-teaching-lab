/* ============================================================================
 * 05_form_hlrf.js — station 5: FORM / HLRF
 *
 * Formulas (U space):
 *   given u_k, x_k = μ + L u_k
 *   g_k = g(x_k)，∇g_u = Lᵀ ∇g(x_k)
 *   u_{k+1} = [ (∇g_uᵀ u_k − g_k) / ||∇g_u||² ] ∇g_u
 *   after convergence β = ||u*||, x* = μ + L u*, P_f ≈ Φ(−β)
 * Stop when |g| < tol and k > 0; then run a few refinement steps to drive |g| → 0.
 * Default parameters: β=2.10834, u*=(−1.92808,0.85299), x*=(6.14384,18.87337).
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');
const { P, example } = require('./shared/example');

function hlr(ex = example, p = P, maxit = 30, tol = 1e-8) {
  const L = M.cholesky(M.cov(p));
  const mu = [p.mu1, p.mu2];
  const toX = (u) => M.add(mu, M.matVec(L, u));
  let u = [0, 0];
  const history = [];
  for (let k = 0; k < maxit; k++) {
    const x = toX(u);
    const g = ex.g(x);
    const gu = M.matVec(M.transpose(L), ex.grad(x));
    history.push({ k, u: u.slice(), x, g, beta: M.norm(u) });
    if (Math.abs(g) < tol && k > 0) break;
    const den = M.dot(gu, gu);
    u = M.scale(gu, (M.dot(gu, u) - g) / den);
  }
  // Refinement so the final point lands on g = 0
  for (let i = 0; i < 6; i++) {
    const x = toX(u);
    const g = ex.g(x);
    if (Math.abs(g) < 1e-14) break;
    const gu = M.matVec(M.transpose(L), ex.grad(x));
    u = M.scale(gu, (M.dot(gu, u) - g) / M.dot(gu, gu));
  }
  const beta = M.norm(u);
  const xStar = toX(u);
  const alpha = beta > 0 ? M.scale(u, 1 / beta) : [0, 0];
  return { uStar: u, xStar, beta, pf: M.normCdf(-beta), alpha, history, L, mu };
}

module.exports = { hlr, demo: hlr() };
