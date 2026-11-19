function r = rel_afosm(ex, p, maxit, tol)
% AFOSM: X-space directional search. Normal variables -> same design point as FORM.
if nargin < 3, maxit = 20; end
if nargin < 4, tol = 1e-8; end
T = rel_transform(p);
L = T.L; mu = T.mu;
x = mu;
beta = 0;
for k = 1:maxit
    gu = L' * ex.grad(x)';
    ng = norm(gu);
    if ng < 1e-14
        r.beta = NaN; r.reason = 'bad-gradient'; return;
    end
    alpha = -gu / ng;
    d = L * alpha;
    [bNew, reason] = rel_solve_beta(ex, mu, d);
    if ~isfinite(bNew)
        r.beta = NaN; r.reason = reason; return;
    end
    x = mu + bNew * d;
    done = abs(bNew - beta) < tol && abs(ex.g(x)) < 1e-8;
    beta = bNew;
    if done, break; end
end
gu = L' * ex.grad(x)';
alpha = -gu / norm(gu);
r.beta = beta;
r.pf = rel_norm_cdf(-beta);
r.xStar = x;
r.uStar = alpha * beta;
r.alpha = alpha;
r.reason = '';
end
