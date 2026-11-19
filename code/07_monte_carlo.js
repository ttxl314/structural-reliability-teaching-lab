/* ============================================================================
 * 07_monte_carlo.js — station 7: Monte Carlo
 *
 * Algorithm:
 *   1. Generate U ~ N(0,I) samples from μ and L (Box-Muller)
 *   2. X = μ + L U
 *   3. Count the number N_f of g(X) < 0
 *   4. P̂_f = N_f/N
 *   5. Standard error se = √(P̂(1−P̂)/N), 95% CI ≈ 1.96se
 *   6. Equivalent β = −Φ⁻¹(P̂_f)
 * A fixed seed guarantees reproducibility; the page caps N at 100,000.
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');
const { P, example } = require('./shared/example');

function runMC(ex = example, p = P, N = 100000, seed = 20261119) {
  const L = M.cholesky(M.cov(p));
  const mu = [p.mu1, p.mu2];
  let state = seed >>> 0;
  const rnd = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state + 0.5) / 4294967296;
  };
  let spare = null;
  const normal = () => {
    if (spare != null) { const z = spare; spare = null; return z; }
    let u = 0;
    while (u <= 1e-12) u = rnd();
    const v = rnd();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  let fails = 0;
  for (let i = 0; i < N; i++) {
    const u = [normal(), normal()];
    const x = M.add(mu, M.matVec(L, u));
    if (ex.g(x) < 0) fails++;
  }
  const pf = fails / N;
  const se = Math.sqrt(Math.max(0, pf * (1 - pf) / N));
  return {
    N, fails, pf, se, ci: 1.96 * se,
    beta: pf > 0 && pf < 1 ? -M.normInv(pf) : NaN,
  };
}

module.exports = { runMC, demo: runMC() };
