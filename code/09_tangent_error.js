/* ============================================================================
 * 09_tangent_error.js — station 9: how "boundary shape" affects Pf at the same design point
 *
 * Four failure domains (u₁ is the design-point direction):
 *   linear (half-space): u₁ = β
 *   convex: u₁ = β + κu₂²/2
 *   concave: u₁ = β − κu₂²/2
 *   outside a circle (extreme): r = β
 *
 * Formulas:
 *   linear   Pf = Φ(−β)
 *   convex/concave  Pf = ∫ φ(u₂) Φ( −(β ± κu₂²/2) ) du₂
 *   outside circle  Pf = P(χ₂² > β²) = exp(−β²/2)
 *   equivalent β = −Φ⁻¹(Pf)
 * Simpson integration is used; defaults β=2.108, κ=0.5.
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');

function integrate(fn, lo = -12, hi = 12, n = 4000) {
  if (n % 2) n++;
  const h = (hi - lo) / n;
  let sum = fn(lo) + fn(hi);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * fn(lo + i * h);
  return sum * h / 3;
}

function tangentErrorCase(beta = 2.108, kappa = 0.5) {
  const linear = M.normCdf(-beta);
  const convex = integrate((u2) => M.normPdf(u2) * M.normCdf(-(beta + kappa * u2 * u2 / 2)));
  const concave = integrate((u2) => M.normPdf(u2) * M.normCdf(-(beta - kappa * u2 * u2 / 2)));
  const extreme = Math.exp(-0.5 * beta * beta);
  const betaEq = (pf) => -M.normInv(Math.max(1e-12, Math.min(1 - 1e-12, pf)));
  return {
    beta, kappa, linear, convex, concave, extreme,
    betaLinear: beta, betaConvex: betaEq(convex),
    betaConcave: betaEq(concave), betaExtreme: betaEq(extreme),
  };
}

module.exports = { tangentErrorCase, integrate, demo: tangentErrorCase() };
