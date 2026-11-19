/* Node test: loads math.js / model.js directly, no browser dependency. */
'use strict';
require('../src/js/math.js');
require('../src/js/model.js');

const RL = globalThis.RL;
const M = RL.Math;
const Model = RL.Model;
const p = { mu1: 10, mu2: 20, s1: 2, s2: 5, rho: 0.5 };

const main = Model.computeMain(p);
console.log('--- MAIN ---');
console.log('MVFOSM beta', main.mv.beta, 'pf', main.mv.pf, 'uL', main.mv.uL, 'xL', main.mv.xL);
console.log('FORM beta', main.form.beta, 'pf', main.form.pf);
console.log('u*', main.form.uStar, 'x*', main.form.xStar);
console.log('alpha', main.form.alpha, 'alpha2', main.form.alpha2);
console.log('SORM kappa', main.sorm.kappa, 'betaKappa', main.sorm.betaKappa, 'factor', main.sorm.factor, 'pf', main.sorm.pf);
console.log('exact', main.exact, 'chi2', main.chi2);
console.log('ratio main beta', main.ratio.beta, 'pf', main.ratio.pf);

const af = Model.afosm(Model.EXAMPLES.parabola, p);
console.log('--- AFOSM ---');
console.log('beta', af.beta, 'pf', af.pf, 'x*', af.xStar, 'u*', af.uStar, 'alpha', af.alpha);
console.log('history');
af.history.forEach(h => console.log(h.k, h.x, h.g, h.beta));

const rs = Model.formSensitivity();
console.log('--- R-S ---');
console.log(rs);

const intf = Model.interference({ muR: 30, muS: 15, sR: 4, sS: 3 });
console.log('--- INTERFERENCE ---');
console.log(intf);

console.log('--- TRANSFORM STAGES ---');
for (let s = 0; s <= 3; s++) {
  const st = Model.transformStage(p, s, 'chol');
  console.log(s, st.title, st.xlim, st.ylim, st.matrix);
}
const pca = Model.transform(p, 'pca');
console.log('PCA L', pca.L, 'Q', pca.Q, 'lam', pca.lam);
console.log('PCA u*', pca.toU(main.form.xStar), 'beta', M.norm(pca.toU(main.form.xStar)));

console.log('--- SELF TEST ---');
const results = Model.selfTest();
let pass = 0;
results.forEach(t => { console.log((t.ok ? 'PASS' : 'FAIL'), t.name); if (t.ok) pass++; });
console.log(pass + '/' + results.length + ' passed');

// Large-sample MC reference (run once, to sanity-check the idea)
const rng = new M.RNG(20261119);
let n = 0, fails = 0;
const N = 1000000;
for (let k = 0; k < N / 10000; k++) {
  const b = Model.sampleBatch(Model.EXAMPLES.parabola, p, 10000, rng);
  n += b.n;
  for (let i = 0; i < b.n; i++) fails += b.fail[i];
}
console.log('--- MC ---', Model.mcStats(n, fails));
