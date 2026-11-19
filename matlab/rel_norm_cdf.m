function y = rel_norm_cdf(z)
% Standard normal CDF via erfc; base MATLAB/Octave, no toolbox.
y = 0.5 * erfc(-z ./ sqrt(2));
end
