# MATLAB / Octave Reference Implementation

Base MATLAB (tested with R2025a); the Statistics Toolbox is **not** required:
normal CDF uses `erfc`, and inverse CDF uses the Acklam approximation.

## Run

In MATLAB:

```matlab
cd matlab
rel_run_all
```

Or from a terminal:

```powershell
matlab -batch "cd('path/to/matlab'); rel_run_all"
```

## Files

| File | Content |
|---|---|
| `rel_norm_pdf.m`, `rel_norm_cdf.m`, `rel_norm_inv.m` | Normal distribution |
| `rel_cov.m`, `rel_cholesky.m`, `rel_transform.m` | Covariance / Cholesky / X↔U |
| `rel_parabola_example.m` | Main example g, gradient, Hessian |
| `rel_mvfosm.m` | MVFOSM |
| `rel_solve_beta.m`, `rel_afosm.m` | AFOSM directional search |
| `rel_hlrf.m` | FORM/HLRF |
| `rel_sorm.m` | SORM/Breitung |
| `rel_monte_carlo.m` | MC + 95% CI |
| `rel_interference.m` | R−S interference, h(s) integral |
| `rel_tangent_error.m` | Linear/convex/concave/outside-circle cases |
| `rel_simpson.m` | Simpson integration |
| `rel_run_all.m` | Run everything with default parameters and assert |

## Calling convention

- Parameters:

```matlab
p = struct('mu1',10,'mu2',20,'s1',2,'s2',5,'rho',0.5);
ex = rel_parabola_example();
```

- `ex` can be replaced by any function:

```matlab
ex.g = @(x) sin(x(1)) + 2*cos(x(2)) + 1;
ex.grad = @(x) [cos(x(1)), -2*sin(x(2))];   % provide analytically or use finite differences
ex.hess = @(x) [-sin(x(1)), 0; 0, -2*cos(x(2))];
form = rel_hlrf(ex, p);
```

An arbitrary function has no analytic exact value; FORM/SORM are approximations,
and MC is the reference.

## Conventions

- The page displays β to 3 decimals; MATLAB prints 6.
- MC uses `rng(20261119,'twister')`; its sequence differs from the web LCG, but the
  statistical result is the same order of magnitude.
- Default example: β_FORM=2.10834, Pf=1.7501%, κ=0.061176, Pf_SORM=1.6471%.
