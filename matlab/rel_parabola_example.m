function ex = rel_parabola_example()
% Main example: g(X) = X1^2 - 2*X2.
ex.g = @(x) x(1).^2 - 2*x(2);
ex.grad = @(x) [2*x(1), -2];
ex.hess = @(x) [2 0; 0 0];
end
