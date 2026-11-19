function y = rel_norm_pdf(z)
% Standard normal PDF.
y = exp(-0.5 .* z .* z) / sqrt(2 * pi);
end
