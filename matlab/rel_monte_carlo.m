function r = rel_monte_carlo(ex, p, n, seed)
% Crude Monte Carlo with fixed seed.
if nargin < 3, n = 100000; end
if nargin < 4, seed = 20261119; end
T = rel_transform(p);
L = T.L; mu = T.mu;
rng(seed, 'twister');
z = randn(n, 2);
x = repmat(mu', n, 1) + z * L';
fails = 0;
for i = 1:n
    if ex.g(x(i,:)') < 0
        fails = fails + 1;
    end
end
pf = fails / n;
se = sqrt(max(0, pf * (1-pf) / n));
r.n = n;
r.fails = fails;
r.pf = pf;
r.se = se;
r.ci = 1.96 * se;
if pf > 0 && pf < 1
    r.beta = -rel_norm_inv(pf);
else
    r.beta = NaN;
end
end
