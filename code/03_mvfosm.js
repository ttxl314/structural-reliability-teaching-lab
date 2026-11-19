/* ============================================================================
 * 03_mvfosm.js — station 3: mean-value first-order second-moment (MVFOSM)
 *
 * Formulas:
 *   g₀ = g(μ)
 *   ∇g = (∂g/∂X₁, ∂g/∂X₂) evaluated at μ
 *   σ_g² = ∇gᵀ C ∇g
 *        = g₁²σ₁² + g₂²σ₂² + 2g₁g₂ρσ₁σ₂
 *   β = g₀ / σ_g
 *   P_f ≈ Φ(−β)
 *   U_L = −g₀ ∇g_U / ||∇g_U||²，∇g_U = Lᵀ∇g
 * Default parameters: g₀=60, ∇g=(20,−2), σ_g=36.06, β=1.664, P_f=4.805%.
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');
const { P, example } = require('./shared/example');

function mvfosm(ex = example, p = P) {
  const mu = [p.mu1, p.mu2];
  const C = M.cov(p);
  const g0 = ex.g(mu);
  const grad = ex.grad(mu);
  const varG = grad[0] * grad[0] * C[0][0] + grad[1] * grad[1] * C[1][1] +
    2 * grad[0] * grad[1] * C[0][1];
  const sigmaG = Math.sqrt(Math.max(0, varG));
  const beta = g0 / sigmaG;
  const T = M.cholesky(C);
  const gu = M.matVec(M.transpose(T), grad);   // ∇g in U space
  const uL = M.scale(gu, -g0 / M.dot(gu, gu)); // foot of the mean-point tangent
  const xL = M.add(mu, M.matVec(T, uL));
  return {
    g0, grad, varG, sigmaG, beta, pf: M.normCdf(-beta),
    gu, uL, xL, cross: 2 * grad[0] * grad[1] * C[0][1],
  };
}

module.exports = { mvfosm, demo: mvfosm() };
