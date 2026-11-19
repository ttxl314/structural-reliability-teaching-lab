/* ============================================================================
 * 02_interference.js — station 2: probability interference between R and S
 *
 * Formulas (R, S independent normal):
 *   g = R − S
 *   β = (μ_R − μ_S) / √(σ_R² + σ_S²)
 *   P_f = Φ(−β) = ∫ f_S(s) F_R(s) ds
 *   h(s) = f_S(s) F_R(s)      (failure probability density)
 *   P_f = ∫ h(s) ds
 * Note: the overlapping area of the f_R and f_S densities is not P_f.
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');

const DEFAULT = { muR: 30, muS: 15, sR: 4, sS: 3 };

function rsCompute(p = DEFAULT) {
  const den = Math.sqrt(p.sR * p.sR + p.sS * p.sS);
  const beta = (p.muR - p.muS) / den;       // exact β for the linear g = R − S
  const pf = M.normCdf(-beta);               // analytical Pf
  return { p, beta, pf, den };
}

// h(s) = f_S(s) * F_R(s)
function failureDensity(s, p = DEFAULT) {
  const fS = M.normPdf((s - p.muS) / p.sS) / p.sS;
  const FR = M.normCdf((s - p.muR) / p.sR);
  return fS * FR;
}

// Verify ∫h(s)ds = Pf with Simpson integration
function integrateH(p = DEFAULT, lo = -20, hi = 80, n = 4000) {
  if (n % 2) n++;
  const h = (hi - lo) / n;
  let sum = failureDensity(lo, p) + failureDensity(hi, p);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * failureDensity(lo + i * h, p);
  return sum * h / 3;
}

module.exports = { DEFAULT, rsCompute, failureDensity, integrateH,
  demo: { ...rsCompute(), integral: integrateH() } };
