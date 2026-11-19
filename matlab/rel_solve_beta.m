function [beta, reason] = rel_solve_beta(ex, mu, d, maxBeta, step)
% Find first positive root of g(mu + beta*d)=0 by scan + bisection.
if nargin < 4, maxBeta = 60; end
if nargin < 5, step = 0.02; end
f = @(b) ex.g(mu + b * d);
if ~(f(0) > 0)
    beta = NaN; reason = 'mean-failure'; return;
end
prev = 0;
b = step;
while b <= maxBeta + 1e-12
    if f(b) <= 0
        lo = prev; hi = b;
        for k = 1:80
            mid = 0.5 * (lo + hi);
            if f(mid) > 0
                lo = mid;
            else
                hi = mid;
            end
        end
        beta = 0.5 * (lo + hi);
        reason = '';
        return;
    end
    prev = b;
    b = b + step;
end
beta = NaN;
reason = 'no-crossing';
end
