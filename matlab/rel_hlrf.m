function r = rel_hlrf(ex, p, maxit, tol)
% FORM / HLRF in standard normal U-space.
if nargin < 3, maxit = 30; end
if nargin < 4, tol = 1e-8; end
T = rel_transform(p);
L = T.L; mu = T.mu;
u = [0; 0];
hist = zeros(maxit, 8);
nh = 0;
for k = 1:maxit
    x = mu + L * u;
    g = ex.g(x);
    gu = L' * ex.grad(x)';
    nh = nh + 1;
    hist(nh, :) = [k-1, u(1), u(2), x(1), x(2), g, norm(u), NaN];
    if abs(g) < tol && k > 1
        break;
    end
    den = gu' * gu;
    u = gu * ((gu' * u - g) / den);
end
% Refinement to |g| ~ 0
for k = 1:6
    x = mu + L * u;
    g = ex.g(x);
    if abs(g) < 1e-14, break; end
    gu = L' * ex.grad(x)';
    u = gu * ((gu' * u - g) / (gu' * gu));
end
beta = norm(u);
xStar = mu + L * u;
if beta > 0
    alpha = u / beta;
else
    alpha = [0; 0];
end
r.uStar = u;
r.xStar = xStar;
r.beta = beta;
r.pf = rel_norm_cdf(-beta);
r.alpha = alpha;
r.history = hist(1:nh, 1:7);
end
