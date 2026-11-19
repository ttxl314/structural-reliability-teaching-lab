function C = rel_cov(p)
% Covariance matrix of (X1,X2): sigma1^2, rho*sigma1*sigma2, sigma2^2.
C = [p.s1^2, p.rho*p.s1*p.s2;
     p.rho*p.s1*p.s2, p.s2^2];
end
