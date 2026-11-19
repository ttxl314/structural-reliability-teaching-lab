function I = rel_simpson(fn, lo, hi, n)
% Composite Simpson rule.
if mod(n,2) ~= 0, n = n + 1; end
h = (hi - lo) / n;
s = fn(lo) + fn(hi);
for i = 1:n-1
    if mod(i,2) == 1
        s = s + 4 * fn(lo + i*h);
    else
        s = s + 2 * fn(lo + i*h);
    end
end
I = s * h / 3;
end
