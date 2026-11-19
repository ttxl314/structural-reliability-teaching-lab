/* ============================================================================
 * 00_overview.js — station 0: where the overview page numbers come from
 * The overview introduces no new formulas; it only aggregates the method results for the main example:
 *   MVFOSM / FORM / SORM / MC
 * This way the overview cards and the station 3–7 details share one set of results instead of two.
 * ==========================================================================*/
'use strict';
const mv = require('./03_mvfosm').demo;
const form = require('./05_form_hlrf').demo;
const sorm = require('./06_sorm').demo;
const mc = require('./07_monte_carlo').demo;
const exact = 0.0162263; // independent Python benchmark for the main example (see docs/benchmark_values.md)

module.exports = {
  rows: [
    { key: 'mvfosm', name: 'MVFOSM', beta: mv.beta, pf: mv.pf },
    { key: 'form', name: 'FORM', beta: form.beta, pf: form.pf },
    { key: 'sorm', name: 'SORM', beta: form.beta, pf: sorm.pf },
    { key: 'mc', name: 'MC', beta: mc.beta, pf: mc.pf },
    { key: 'exact', name: 'Exact', beta: null, pf: exact },
  ],
  exact,
};
