# Computation Verification Report

[Chinese original](zh/verification_report.md)

> Verification target: `structural-reliability-lab.html` (stations 0–10)
> Reference implementation: `code/` (split by module, with formula comments)
> Page source: `src/js/`
> Verification date: 2026-11-20

## 1. Verification method

Two independent paths:

1. **Page self-test**: `?selftest=1` (or "Run numerical self-test" in Help), 20 items, all PASS;
2. **Module-level independent recomputation**: `node code/verify.js`, 39 items, all PASS.

`code/verify.js` recomputes each module with an independent implementation and then compares against the values displayed by the page under default parameters.
The page's `Φ` uses the A&S approximation (absolute error about \(7.5\times10^{-8}\)), so CDF-type checks have tolerances on the order of \(10^{-7}\); the page displays β/Pf to only 3 decimal places, and the displayed values agree.

```text
node code/verify.js
39/39 passed
```

```text
node tests/test_math.js
20/20 passed
```

## 2. Module verification results

| Station | On-screen display | Formula result | Reference file | Conclusion |
|---|---|---|---|---|
| 0 Overview | MVFOSM β=1.664, Pf=4.80%; FORM=2.108/1.75%; SORM=2.108/1.65%; MC≈1.6%; exact=1.62% | Same `app.main` as stations 3–8 | `code/00_overview.js` | PASS |
| 1 Transform | Cholesky \(L=[[2,0],[2.5,4.330127]]\); design point \(\|U\|=2.108\) | \(C=LL^T\), \(X=\mu+LU\) | `code/01_transform.js` | PASS |
| 2 Interference | β=3.000, Pf=0.135% | \(P_f=\Phi(-3)\), \(\int h(s)ds\approx P_f\) | `code/02_interference.js` | PASS |
| 3 MVFOSM | β=1.664, Pf=4.80%, σ_g=36.0555 | \(g(\mu)=60\), \(\sigma_g=36.0555\) | `code/03_mvfosm.js` | PASS |
| 4 AFOSM | β=2.108, Pf=1.75%, x*=(6.144,18.873) | Directional search reaches the same design point as FORM | `code/04_afosm.js` | PASS |
| 5 FORM/HLRF | β=2.108, u*=(-1.928,0.853), x*=(6.144,18.873) | HLRF converges in 6 iterations | `code/05_form_hlrf.js` | PASS |
| 6 SORM | κ=0.0612, factor=0.941, Pf=1.647% | Breitung correction | `code/06_sorm.js` | PASS |
| 7 MC | N=100000, Pf≈1.64%, 95% CI about ±0.08% | Fixed seed 20261119 | `code/07_monte_carlo.js` | PASS |
| 8 Formula card | \(P_f=\Phi(-\beta)\), β↔Pf conversion | Half-space/linear boundary relation | `code/08_formulas.js` | PASS |
| 9 Tangent error | Linear 1.752%, convex 1.154%, concave 4.193%, outside-circle 10.841% | Simpson integration + outside-circle closed form | `code/09_tangent_error.js` | PASS |
| 10 Custom | Default `x1^2-2*x2` gives MVFOSM 1.664, FORM 2.108, SORM 1.647%, MC≈1.64% | Numerical gradient/Hessian + the same method set | `code/10_custom_function.js` | PASS |

## 3. Where the "numbers on screen" come from

The page does not maintain a second set of preset results for the stations:

- **Result cards**: `updateInspector()` in `src/js/stations.js` reads values from `app.main` / `state.mc` / `tangentErrorCase()` / `RL.Custom.getResult()`, then formats them with `setResult` from `src/js/ui.js`;
- **Right-panel method comparison**: `U.setCompare(app.main, active, mc)`, with data from `app.main.mv/af/form/sorm/exact` for the current parameters;
- **Station 1/3/4/5/6/7/9 canvases**: use the same `app.main` results and the formulas in `src/js/model.js`;
- **Station 2**: `interferenceCurves` and the analytical R−S result;
- **Station 9 right table**: `tangentErrorCase(beta,kappa)` integrated on the fly;
- **Station 10**: `src/js/custom.js` parses on the fly, uses finite differences, HLRF/SORM/MC.

The only "preset reference value" is the **MC N=4×10⁶** reference row under the main example's default parameters (`MC_REF`, explicitly labeled "reference N=4×10⁶" on the page); after changing parameters that row disappears, and you need to resample on station 7.

## 4. Rounding and randomness notes

- β is displayed to 3 decimal places; Pf generally to 3, and the method comparison table defaults to 2;
- The page's `Φ` differs from the Python baseline by about \(10^{-7}\); at 3-decimal display they agree;
- Station 9's "linear 1.752%" is computed with the **displayed value β=2.108**; with the full-precision 2.10834 it is 1.750%; both are explained in the documentation;
- MC results are random quantities; a fixed seed makes them reproducible, and the 95% CI describes the sampling error;
- An arbitrary function on station 10 has no analytical exact value; FORM/SORM are numerical approximations and MC is the reference; when a function is non-smooth or has multiple failure modes, the results should only be used as a method demonstration.

## 5. Conclusion

- Under default parameters, the β, Pf, κ, CI, and tangent point/design point displayed by each module agree with the independent reference implementation;
- The computational results are computed on the fly from formulas, not statically hard-coded;
- Page self-test 20/20, module-level verification 39/39.
