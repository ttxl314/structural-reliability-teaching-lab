/* ============================================================================
 * code/verify.js — per-module independent verification (Node)
 * Run: node code/verify.js
 * Recomputes each module with the reference implementation in this directory and compares against the values shown by the page at its default parameters.
 * ==========================================================================*/
'use strict';
const transform = require('./01_transform');
const overview = require('./00_overview');
const formulas = require('./08_formulas');
const intf = require('./02_interference');
const mv = require('./03_mvfosm');
const af = require('./04_afosm');
const form = require('./05_form_hlrf');
const sorm = require('./06_sorm');
const mc = require('./07_monte_carlo');
const tan = require('./09_tangent_error');
const custom = require('./10_custom_function');
const M = require('./shared/math');

let pass = 0, fail = 0;
const rows = [];
function check(name, actual, expected, tol) {
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= tol;
  if (ok) pass++; else fail++;
  rows.push({ name, actual, expected, tol, ok });
}
function checkRange(name, actual, lo, hi) {
  const ok = Number.isFinite(actual) && actual >= lo && actual <= hi;
  if (ok) pass++; else fail++;
  rows.push({ name, actual, expected: `[${lo}, ${hi}]`, tol: 'range', ok });
}

const d1 = transform.demo;
check('00 overview exact', overview.exact, 0.0162263, 1e-7);
check('00 overview MVFOSM Pf', overview.rows[0].pf, 0.0480461600, 2e-7);
check('00 overview FORM Pf', overview.rows[1].pf, 0.0175008089, 1e-7);
check('00 overview SORM Pf', overview.rows[2].pf, 0.01647082, 1e-7);
check('08 β=2.108 → Pf', formulas.demo.pf, 0.0175154, 2e-6);
check('08 Pf → β round trip', formulas.demo.roundTrip, 2.108, 2e-6);
check('01 Cholesky L11', d1.L[0][0], 2, 1e-12);
check('01 Cholesky L21', d1.L[1][0], 2.5, 1e-12);
check('01 Cholesky L22', d1.L[1][1], Math.sqrt(18.75), 1e-12);
check('01 design point ||U||=β', d1.beta, 2.1083396823, 1e-6);

const d2 = intf.demo;
check('02 R−S β', d2.beta, 3, 1e-12);
check('02 R−S Pf=Φ(−3)', d2.pf, 0.0013498980, 2e-7);
check('02 ∫h(s)ds=Pf', d2.integral, d2.pf, 2e-5);

const d3 = mv.demo;
check('03 MVFOSM β', d3.beta, 1.6641005887, 1e-8);
check('03 MVFOSM Pf', d3.pf, 0.0480461600, 2e-7);
check('03 MVFOSM σ_g', d3.sigmaG, 36.0555127546, 1e-8);

const d4 = af.demo;
check('04 AFOSM β=FORM β', d4.beta, 2.1083396823, 1e-6);
check('04 AFOSM Pf', d4.pf, 0.0175008089, 1e-6);

const d5 = form.demo;
check('05 HLRF β', d5.beta, 2.1083396823, 1e-7);
check('05 HLRF u1*', d5.uStar[0], -1.92808099, 1e-6);
check('05 HLRF u2*', d5.uStar[1], 0.85299468, 1e-6);
check('05 HLRF x1*', d5.xStar[0], 6.143838, 1e-5);
check('05 HLRF x2*', d5.xStar[1], 18.873373, 1e-5);
check('05 FORM Pf', d5.pf, 0.0175008089, 1e-7);

const d6 = sorm.demo;
check('06 SORM κ', d6.kappa, 0.06117568, 1e-6);
check('06 SORM factor', d6.factor, 0.9411458, 1e-6);
check('06 SORM Pf', d6.pf, 0.01647082, 1e-7);

const d7 = mc.demo;
checkRange('07 MC Pf (100k samples)', d7.pf, 0.014, 0.019);
checkRange('07 MC failures', d7.fails, 1400, 1900);
checkRange('07 MC 95% CI', d7.ci, 0.0001, 0.002);

const d9 = tan.demo;
check('09 linear Pf (β=2.108)', d9.linear, 0.0175154, 2e-6);
check('09 convex Pf', d9.convex, 0.011540, 2e-3);
check('09 concave Pf', d9.concave, 0.041930, 3e-3);
check('09 outside-circle Pf', d9.extreme, 0.108410, 1e-5);

const d10 = custom.defaultDemo;
check('10 custom=main MVFOSM β', d10.mv.beta, 1.6641005887, 1e-5);
check('10 custom=main FORM β', d10.form.beta, 2.1083396823, 1e-4);
check('10 custom=main FORM Pf', d10.form.pf, 0.0175008089, 1e-5);
check('10 custom=main SORM Pf', d10.sorm.pf, 0.01647082, 2e-4);
checkRange('10 custom MC Pf', d10.mc.pf, 0.014, 0.019);

for (const r of rows) {
  const a = Number.isFinite(r.actual) ? r.actual.toPrecision(10) : String(r.actual);
  console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name.padEnd(28) + ' actual=' + a +
    ' expected=' + r.expected + (r.tol === 'range' ? '' : ' tol=' + r.tol));
}
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
