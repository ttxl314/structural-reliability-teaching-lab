/* ============================================================================
 * 06_sorm.js — station 6: SORM (Breitung curvature correction)
 *
 * Formulas:
 *   H_u = Lᵀ H_x L, where H_x is the Hessian of g at x*
 *   n = ∇g_u / ||∇g_u||
 *   e = (−n₂, n₁) (tangential)
 *   κ = eᵀ H_u e / ||∇g_u||
 *   P_f,SORM = P_f,FORM / √(1 + βκ)
 *   β is unchanged; when κ > 0, Pf becomes smaller.
 * Default parameters: κ=0.061176, factor=0.941146, Pf=1.64708%.
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');
const { P, example } = require('./shared/example');
const { hlr } = require('./05_form_hlrf');

function sorm(ex = example, p = P, form = hlr(ex, p)) {
  const L = M.cholesky(M.cov(p));
  const x = form.xStar;
  const gx = ex.grad(x);
  const Hx = ex.hess(x);
  const gu = M.matVec(M.transpose(L), gx);
  const Hu = M.matMul(M.matMul(M.transpose(L), Hx), L);
  const nrm = M.norm(gu);
  const n = M.scale(gu, 1 / nrm);
  const e = [-n[1], n[0]];
  const kappa = M.dot(e, M.matVec(Hu, e)) / nrm;
  const denom = 1 + form.beta * kappa;
  const factor = denom > 1e-12 ? 1 / Math.sqrt(denom) : 1;
  return { kappa, betaKappa: form.beta * kappa, factor, pf: form.pf * factor, valid: denom > 0 };
}

module.exports = { sorm, demo: sorm() };
