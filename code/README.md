# Structural Reliability Methods — Module-by-Module Reference Code

This directory splits the calculations used by the teaching page into small,
one-purpose modules with formula comments. It is a **reference implementation**:
the running page still uses `src/js/model.js`, `src/js/custom.js`, etc. Both use
the same formulas and default parameters, which makes the modules suitable for
code review, teaching, and independent recomputation.

## Run

```powershell
node code/verify.js
```

The last line should be `39/39 passed`.

`verify.js` recomputes each module independently and compares the result with
the value displayed by the page under the default parameters. The tolerance
accounts for the page's Abramowitz–Stegun normal-CDF approximation (~1e-7).

## Module map

| Station | Module | Formula file | Page source | Verification |
|---|---|---|---|---|
| 0 | Overview aggregation | `00_overview.js` | `src/js/app.js` + `ui.js` | `00_*` |
| 1 | X → Y → Z → U | `01_transform.js` | `transform` in `src/js/model.js` | `01_*` |
| 2 | R/S probability interference | `02_interference.js` | `interference*` in `model.js` | `02_*` |
| 3 | MVFOSM | `03_mvfosm.js` | `mvfosm` in `model.js` | `03_*` |
| 4 | AFOSM / design point | `04_afosm.js` | `afosm`, `solveBeta` in `model.js` | `04_*` |
| 5 | FORM / HLRF | `05_form_hlrf.js` | `hlr` in `model.js` | `05_*` |
| 6 | SORM | `06_sorm.js` | `sorm` in `model.js` | `06_*` |
| 7 | Monte Carlo | `07_monte_carlo.js` | `sampleBatch`, `mcStats` in `model.js` | `07_*` |
| 8 | Formula-card conversions | `08_formulas.js` | `src/js/formulas.js`, `ui.js` | `08_*` |
| 9 | Combined plot / tangent error | `09_tangent_error.js` | `tangentErrorCase` in `model.js` | `09_*` |
| 10 | Custom function | `10_custom_function.js` | `src/js/custom.js` | `10_*` |

Shared code:

- `shared/math.js`: normal PDF/CDF/inverse CDF, 2×2 linear algebra, covariance, Cholesky;
- `shared/example.js`: main example `g = X₁² − 2X₂` and default parameters.

## File conventions

1. The file header states the formulas and calculation order.
2. Variables use readable names such as `mu`, `sigma`, `C`, `L`, `grad`, `hess`.
3. One function does one job; inputs and outputs are documented.
4. No UI copy is hard-coded in the reference implementation; it only returns numbers.
5. The page formats the displayed values in `src/js/ui.js`; the reference code only computes.

## Verification conventions

- The page displays β to 3 decimals; Pf is usually 3 decimals (2 in the comparison table).
- The page uses an A&S normal CDF; the difference from the Python baseline is around 1e-7.
- MC uses a fixed seed and the same 100,000-sample convention as Station 7.
- An arbitrary function has no analytic "exact" value; Station 10 FORM/SORM use finite differences,
  and MC is the reference.
