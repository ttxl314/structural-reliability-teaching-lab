function r = rel_sorm(ex, p, form)
% SORM / Breitung curvature correction at the FORM design point.
if nargin < 3, form = rel_hlrf(ex, p); end
T = rel_transform(p);
L = T.L;
x = form.xStar;
gx = ex.grad(x)';
Hx = ex.hess(x);
gu = L' * gx;
Hu = L' * Hx * L;
nrm = norm(gu);
n = gu / nrm;
e = [-n(2); n(1)];
kappa = (e' * Hu * e) / nrm;
denom = 1 + form.beta * kappa;
if denom > 1e-12
    factor = 1 / sqrt(denom);
else
    factor = 1;
end
r.kappa = kappa;
r.betaKappa = form.beta * kappa;
r.factor = factor;
r.pf = form.pf * factor;
r.valid = denom > 0;
end
