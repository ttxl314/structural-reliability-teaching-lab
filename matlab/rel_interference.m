function r = rel_interference(p, n)
% R-S interference: g=R-S, independent normal R and S.
if nargin < 1
    p = struct('muR',30,'muS',15,'sR',4,'sS',3);
end
if nargin < 2, n = 4000; end
beta = (p.muR - p.muS) / sqrt(p.sR^2 + p.sS^2);
pf = rel_norm_cdf(-beta);
% h(s) = f_S(s) * F_R(s), integrate by Simpson
h = @(s) rel_norm_pdf((s - p.muS)/p.sS)/p.sS .* rel_norm_cdf((s - p.muR)/p.sR);
hInt = rel_simpson(h, -20, 80, n);
r.p = p;
r.beta = beta;
r.pf = pf;
r.hIntegral = hInt;
end
