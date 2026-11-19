function r = rel_tangent_error(beta, kappa, n)
% Same design point, different failure-domain shapes.
if nargin < 1, beta = 2.108; end
if nargin < 2, kappa = 0.5; end
if nargin < 3, n = 4000; end
linear = rel_norm_cdf(-beta);
convex = rel_simpson(@(u2) rel_norm_pdf(u2) .* ...
    rel_norm_cdf(-(beta + kappa*u2.^2/2)), -12, 12, n);
concave = rel_simpson(@(u2) rel_norm_pdf(u2) .* ...
    rel_norm_cdf(-(beta - kappa*u2.^2/2)), -12, 12, n);
extreme = exp(-0.5*beta^2);
beq = @(p) -rel_norm_inv(max(1e-12, min(1-1e-12, p)));
r.beta = beta; r.kappa = kappa;
r.linear = linear; r.convex = convex; r.concave = concave; r.extreme = extreme;
r.betaLinear = beta; r.betaConvex = beq(convex);
r.betaConcave = beq(concave); r.betaExtreme = beq(extreme);
end
