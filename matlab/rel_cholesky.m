function L = rel_cholesky(C)
% 2x2 lower Cholesky: C = L*L'.
l11 = sqrt(C(1,1));
l21 = C(2,1) / l11;
l22 = sqrt(max(0, C(2,2) - l21^2));
L = [l11, 0; l21, l22];
end
