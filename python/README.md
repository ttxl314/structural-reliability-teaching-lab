# Python Reference Implementation

Uses only the Python standard library; **NumPy / SciPy are not required**.

## Run

```powershell
cd python
python run_all.py
```

By default it prints the Cholesky factor, MVFOSM, AFOSM, FORM/HLRF, SORM,
Monte Carlo, R–S interference, and the tangent-error case, followed by assertions.

## Files

| File | Content |
|---|---|
| `reliability.py` | All algorithms, separated by section |
| `run_all.py` | Default-parameter recomputation + assertions |

Main API in `reliability.py`:

- `transform(p)`: Cholesky, `toX(u)`, `toU(x)`;
- `mvfosm(ex,p)`;
- `afosm(ex,p)`;
- `hlr(ex,p)` (FORM/HLRF);
- `sorm(ex,p,form)`;
- `monte_carlo(ex,p,n,seed)`;
- `interference(p)`, `failure_density(s,p)`, `integrate_h(p)`;
- `tangent_error(beta,kappa)`;
- `custom_compute(g,p,n)`: numerical gradient/Hessian of any `g(x)` + the four methods.

`ex` is a dictionary: `{"g": callable, "grad": callable, "hess": callable}`.  
`p` is `{"mu1","mu2","s1","s2","rho"}`.

## Conventions

- Normal CDF uses `0.5*erfc(-z/sqrt(2))`, more accurate than the page's A&S approximation.
- The page keeps 3 decimals; Python prints 6.
- MC uses seed `20261119`. Its sample sequence differs from the JS LCG, but the statistical
  result is the same order of magnitude.
- An arbitrary function has no analytic exact value; `custom_compute` FORM/SORM are numerical
  approximations.
