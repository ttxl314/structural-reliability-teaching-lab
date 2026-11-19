function r = rel_mvfosm(ex, p)
% Mean-value first-order second-moment method (MVFOSM).
mu = [p.mu1; p.mu2];
C = rel_cov(p);
g0 = ex.g(mu);
grad = ex.grad(mu);
grad = grad(:);
varG = grad' * C * grad;
sigmaG = sqrt(max(0, varG));
beta = g0 / sigmaG;
T = rel_transform(p);
gu = T.L' * grad;
uL = -g0 / (gu' * gu) * gu;
xL = T.mu + T.L * uL;
r.g0 = g0;
r.grad = grad;
r.sigmaG = sigmaG;
r.beta = beta;
r.pf = rel_norm_cdf(-beta);
r.gu = gu;
r.uL = uL;
r.xL = xL;
r.varG = varG;
end
