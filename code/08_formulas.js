/* ============================================================================
 * 08_formulas.js — station 8: general conversions used by the formula card
 *
 * For a half-space/linear boundary and normal variables:
 *   P_f = Φ(−β)
 *   β = −Φ⁻¹(P_f)
 * For nonlinear boundaries these two equations are only "equivalent conversions", not exact relations.
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');

const betaToPf = (beta) => M.normCdf(-beta);
const pfToBeta = (pf) => -M.normInv(pf);

const FORMULA_INDEX = [
  ['Definition of failure probability', 'P_f = ∫_{g(x)<0} f_X(x) dx'],
  ['β and Pf', 'P_f = Φ(−β)'],
  ['Mean-value first-order second-moment', 'β = g(μ)/√(∇gᵀ C ∇g)'],
  ['FORM/HLRF', 'u_{k+1} = [(∇g_uᵀu_k − g_k)/||∇g_u||²]∇g_u'],
  ['SORM/Breitung', 'P_f,SORM = P_f,FORM / √(1+βκ)'],
  ['Monte Carlo', 'P̂_f = N_f/N，se=√(P̂_f(1−P̂_f)/N)'],
  ['Outside-circle extreme', 'P_f = exp(−β²/2)'],
];

module.exports = { betaToPf, pfToBeta, FORMULA_INDEX,
  demo: { beta: 2.108, pf: betaToPf(2.108), roundTrip: pfToBeta(betaToPf(2.108)) } };
