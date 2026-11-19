/* ============================================================================
 * code/shared/example.js — main example definition (matches the page)
 *   g(X) = X₁² − 2X₂
 *   Failure domain: X₂ > X₁²/2
 *   X₁~N(10,2), X₂~N(20,5), ρ=0.5
 * ==========================================================================*/
'use strict';

const P = { mu1: 10, mu2: 20, s1: 2, s2: 5, rho: 0.5 };

const example = {
  g: (x) => x[0] * x[0] - 2 * x[1],
  grad: (x) => [2 * x[0], -2],
  hess: () => [[2, 0], [0, 0]],
};

module.exports = { P, example };
