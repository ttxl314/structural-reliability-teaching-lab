/* ============================================================================
 * 01_transform.js — station 1: X → Y → Z → U
 *
 * Formulas:
 *   C = [[σ₁², ρσ₁σ₂], [ρσ₁σ₂, σ₂²]]
 *   C = L Lᵀ (Cholesky, L lower triangular)
 *   Y = X − μ
 *   Z = D⁻¹Y，D = diag(σ₁, σ₂)
 *   U = L⁻¹Y，X = μ + L U
 *   ||U|| = β
 *
 * Order of computation: first C, then L, then U from X (or X from U).
 * ==========================================================================*/
'use strict';
const M = require('./shared/math');
const { P } = require('./shared/example');

function transform(p = P) {
  const C = M.cov(p);
  const L = M.cholesky(C);
  const mu = [p.mu1, p.mu2];
  const toU = (x) => M.toU(p, x);
  const toX = (u) => M.toX(p, u);
  return { C, L, mu, toU, toX };
}

// Cholesky and design-point radius at the default parameters (design point taken from 05_form_hlrf)
const t = transform(P);
const xStar = [6.143838, 18.873373];
const uStar = t.toU(xStar);

module.exports = { transform, demo: { L: t.L, uStar, beta: M.norm(uStar) } };
