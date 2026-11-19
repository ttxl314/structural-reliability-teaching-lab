% rel_run_all.m
% Run all reference algorithms with the default example and print results.
% MATLAB R2025a tested; no toolbox needed.

clc;
p = struct('mu1',10, 'mu2',20, 's1',2, 's2',5, 'rho',0.5);
ex = rel_parabola_example();

T = rel_transform(p);
mv = rel_mvfosm(ex, p);
af = rel_afosm(ex, p);
form = rel_hlrf(ex, p);
so = rel_sorm(ex, p, form);
mc = rel_monte_carlo(ex, p, 100000, 20261119);
rs = rel_interference();
tan = rel_tangent_error(2.108, 0.5);

fprintf('============================================================\n');
fprintf('Main example: g(X)=X1^2-2*X2, X1~N(10,2), X2~N(20,5), rho=0.5\n');
fprintf('============================================================\n');
fprintf('Cholesky L = [%.6f 0; %.6f %.6f]\n', ...
        T.L(1,1), T.L(2,1), T.L(2,2));
fprintf('MVFOSM     beta=%.6f  Pf=%.4f%%  sigma_g=%.6f\n', ...
        mv.beta, 100*mv.pf, mv.sigmaG);
fprintf('AFOSM      beta=%.6f  Pf=%.4f%%\n', af.beta, 100*af.pf);
fprintf('FORM/HLRF  beta=%.6f  Pf=%.4f%%\n', form.beta, 100*form.pf);
fprintf('  u* = (%.6f, %.6f)\n', form.uStar(1), form.uStar(2));
fprintf('  x* = (%.6f, %.6f)\n', form.xStar(1), form.xStar(2));
fprintf('SORM       kappa=%.6f  factor=%.6f  Pf=%.4f%%\n', ...
        so.kappa, so.factor, 100*so.pf);
fprintf('MC         N=%d  fails=%d  Pf=%.4f%%  95%%CI=+/-%.4f%%\n', ...
        mc.n, mc.fails, 100*mc.pf, 100*mc.ci);
fprintf('\n');
fprintf('R-S        beta=%.6f  Pf=%.4f%%  int h(s)=%.4f%%\n', ...
        rs.beta, 100*rs.pf, 100*rs.hIntegral);
fprintf('\nTangent error (beta=2.108, kappa=0.5)\n');
fprintf('  linear=%.4f%%  convex=%.4f%%  concave=%.4f%%  extreme=%.4f%%\n', ...
        100*tan.linear, 100*tan.convex, 100*tan.concave, 100*tan.extreme);

% Regression assertions
assert(abs(mv.beta - 1.6641005887) < 1e-8);
assert(abs(form.beta - 2.1083396823) < 1e-7);
assert(abs(form.uStar(1) + 1.92808099) < 1e-6);
assert(abs(form.uStar(2) - 0.85299468) < 1e-6);
assert(abs(so.kappa - 0.06117568) < 1e-6);
assert(abs(so.pf - 0.01647082) < 1e-7);
assert(abs(rs.beta - 3) < 1e-12);
assert(abs(tan.convex - 0.011540) < 2e-3);
assert(abs(tan.concave - 0.041930) < 3e-3);
assert(mc.pf > 0.014 && mc.pf < 0.019);
fprintf('\nMATLAB reference implementation: all assertions passed.\n');
