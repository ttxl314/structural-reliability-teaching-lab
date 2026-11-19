function T = rel_transform(p)
% Cholesky transform: X = mu + L*U, U = L\(X-mu).
C = rel_cov(p);
L = rel_cholesky(C);
mu = [p.mu1; p.mu2];
T.p = p;
T.C = C;
T.L = L;
T.mu = mu;
T.toX = @(u) mu + L * u(:);
T.toU = @(x) L \ (x(:) - mu);
end
