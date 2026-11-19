# Structural Reliability Method Comparison Lab

[Chinese README](docs/zh/README.md) · Chinese documentation: [docs/zh/](docs/zh/)

**Version:** 1.0.0 (2026-11-20) · [Changelog](CHANGELOG.md)

A **single-file, offline, double-click-to-open** teaching "lab bench" for structural reliability: around the main example `g(X) = X₁² − 2X₂` (`X₁ ~ N(10, 2)`, `X₂ ~ N(20, 5)`, `ρ = 0.5`), it compares **MVFOSM / AFOSM / FORM / SORM / Monte Carlo** side by side on the same problem, and cross-checks them against the exact value from 1-D conditional integration. Change one parameter and every method recomputes at once; press "single step" and the tangent, foot of the perpendicular and design point grow out step by step.

- **Main page**: `structural-reliability-lab.html` (about 0.5 MB, self-contained)
- **No server required**: open the HTML file directly in a modern browser (Chrome / Edge).
- **No external requests**: CSS, JavaScript and formula SVGs are all inlined.
- **Audience**: structural reliability courses, method comparison and classroom demos.

Default answers (computed live by the page):

| Method | β | Pf | Notes |
|---|---:|---:|---|
| MVFOSM | 1.664 | 4.805% | mean-point tangent |
| AFOSM = FORM | 2.108 | 1.750% | same design point, two routes |
| SORM | 2.108 | 1.647% | β unchanged; curvature corrects Pf |
| Monte Carlo (reference N=4×10⁶) | — | 1.628% | large-sample baseline |
| Exact (1-D conditional integration) | — | 1.623% | truth reference |

> Key phenomena: change the algebraic form of the same failure surface and MVFOSM's β changes (`R−S` gives 3.000, `R/S−1` gives 2.080), while FORM does not; SORM does not search for the design point again and only corrects the Pf conversion.

## Quick start

1. **Double-click** [structural-reliability-lab.html](structural-reliability-lab.html) in the repository root. Chrome / Edge opens it directly, with no server and no internet; it can be copied onto a USB stick and carried around.
2. `F` full screen; `?` opens Help; `←/→` switch stations, number keys `0–9` jump directly, `C` opens the custom function; `Space` plays and `S` single-steps (valid on Stations 1/4/5/7); `R` resets; the top bar keeps only `Reset`. Entering Stations 4/5 for the first time auto-plays once, and Station 7 auto-samples continuously to 100k; add `?auto=0` to disable the auto demos.
3. **Verify the numbers**: `?` → "Run numerical self-test" (20 items), or open `structural-reliability-lab.html?selftest=1`.
4. **Print the formula card**: top right of Station 8 → "Print formula card"; the print style outputs only Station 8 (A4). The print entry has been removed from the top bar.
5. **Reproduce a step**: append a query string to the address, e.g. `?station=5&hlr=2` (FORM row 3) or `?station=7&mc=100000` (pre-sample 100k).

## The 11 stations

| # | Station | In one sentence | Key interactions |
|---|---|---|---|
| 0 | Overview | same problem, six assumptions, answers differ by about 3× | six method cards + log-axis Pf comparison bar; click a card to jump |
| 1 | Variables and transformation | X → centering → standardization → whitening; β is the distance to the origin | smooth 4-step affine animation (2→3 scales the viewport first, then scales Y), Play; equal-β ellipses/circles and the tangent at the tangent point; bold axes; Cholesky / PCA switch; ρ slider |
| 2 | Probability interference | density overlap ≠ Pf; the true Pf is the integral of the failure probability density h(s)=f_S·F_R | four R/S sliders; three charts (h(s) on the same absolute density axis as f_R/f_S / h(s) area / safety margin); small form-sensitivity table |
| 3 | Mean-value first-order second-moment | draw a tangent at the mean point; change the form and β changes | X/U dual view; tangent, foot of the perpendicular, error comparison card |
| 4 | Advanced first-order second-moment (AFOSM) | search the boundary along the current α direction; same design point as FORM | auto-play on first entry; play / single-step / click the iteration table to replay; `≡` comparison card; falls back to FORM with a label when unsolvable |
| 5 | FORM / HLRF | tangent → foot of the perpendicular → tangent again, usually converging in 6 iterations (more for other parameters) | auto-play on first entry; single-step / play; α² contributions; β and residual convergence mini charts |
| 6 | SORM | β unchanged; Pf corrected by curvature | curvature illustration magnified ×3; osculating circle; Pf comparison bar |
| 7 | Monte Carlo | large samples as the baseline; error ∝ 1/√N | auto continuous sampling to 100k on first entry; adjustable batch size / target N; Resample to N; X/U sample clouds; 95% CI |
| 8 | Formulas and code | 7 formula groups + method comparison + β↔Pf table, printable | Print formula card; 7 method-code entries |
| 9 | Overlay and tangent error | all methods on one figure; β→Pf error for linear/convex/concave/outside-circle failure | X/Y/Z/U switch + fixed 1:1 square window; mouse-wheel zoom / drag to pan / double-click to reset; equal-probability ellipses/circles; β distance labelled next to each method point; MVFOSM g=0 and the parallel line through μ; β/κ sliders + failure-domain highlighting; no truncated tangents |
| 10 | Custom function lab | enter any g(x₁,x₂) and compute β/Pf on the spot | expression parsing (no eval) + numerical gradient/Hessian; MVFOSM / FORM(AFOSM) / SORM / MC checkboxes; μ/σ/ρ sliders; on-the-fly plot of g=0, the failure domain, tangents and design point |

Every method station has a **"View pseudocode"** drawer in its top-right corner (two tabs, pseudocode / JS implementation, copyable); the corresponding entry on Station 0 is called "algorithm map". The right panel also contains 3 "teaching notes" per station, the main-example parameter sliders and a result card (the parameter card is hidden automatically on Stations 2 and 8).

> **Unified method colours**: MVFOSM orange, AFOSM blue, FORM red, SORM green, MC purple, exact grey. The overview "same-problem comparison: β / Pf" chart has a legend and per-row β/Pf values; the right-panel comparison table, the formula-card comparison table, the Station 3 error bars, the Station 6 Pf bars and the Station 9 overlay all use the same palette. Each method's tangent also uses its method colour — MVFOSM orange, AFOSM blue, FORM red, SORM green; the limit state surface uses a neutral blue, and the design point is still a red star.

## Documentation

- [requirements.md](requirements.md) — requirements and design decisions (the station list in the body is the early v0.9 `0–6`; the implementation follows the v1.0 addendum as `0–10`, and the page prevails).
- [docs/user_guide.md](docs/user_guide.md) — UI, shortcuts, URL parameters, code drawers, printing, self-test, build and source layout.
- [docs/lecture_script.md](docs/lecture_script.md) — a 45-minute main route + a 20-minute compressed route, with time, click path, key points, expected numbers and common questions for each segment.
- [docs/formulas_by_module.md](docs/formulas_by_module.md) — formulas, calculation order, code files and display locations, organised by station.
- [docs/verification_report.md](docs/verification_report.md) — module-by-module verification of the displayed values against independent recomputation (39/39).
- [docs/benchmark_values.md](docs/benchmark_values.md) — all baseline numbers: method comparison, HLRF iteration table, SORM, form sensitivity, exact integration and recomputation commands.
- [docs/formula_card.pdf](docs/formula_card.pdf) — the A4 formula card exported from the final build (3 pages).
- [docs/review_report.md](docs/review_report.md) — independent review (pre-fix snapshot); see [docs/review_fixes.md](docs/review_fixes.md) for the fixes.
- [docs/zh/](docs/zh/) — the Chinese originals of the documentation (including [docs/zh/README.md](docs/zh/README.md)).
- [code/README.md](code/README.md) — module-by-module reference code; `node code/verify.js` recomputes it.

## Build and tests

```bash
python tools/build.py        # src/ → dist/structural-reliability-lab.html, plus a copy in the repository root (overwrites the artifact with the same name)
node tests/test_math.js      # numerical kernel/model regression; the output should contain 20/20 passed
python reference_values.py   # independent Python baseline (numpy); recomputes all key numbers
```

- After modifying `src/` you **must rerun the build**; the root HTML and `dist/` are generated artifacts — do not edit them by hand.
- To change formulas: edit `tools/formulas.json` → `node tools/gen_formulas.cjs` (build-time MathJax under `_tmp/mathjax`) → `python tools/build.py`.
- In-page self-test: `structural-reliability-lab.html?selftest=1` (20 items, currently 20/20 passed).

## Repository layout

```text
structural-reliability-lab.html  ← build artifact (double-click to use; do not edit by hand)
dist/                            ← copy of the build artifact
src/
  index.html                     ← page skeleton (11 stations + dialogs)
  styles.css                     ← all styles (printing and responsive included)
  js/
    math.js                      ← normal distribution, 2×2 linear algebra, RNG, formatting
    i18n.js / i18n-data.js       ← Chinese/English UI switching
    model.js                     ← MVFOSM / HLRF / AFOSM / SORM / exact integration / MC
    charts.js                    ← Canvas 2D plotting (no third-party library)
    formulas.js                  ← build-time generated formula SVGs (do not edit by hand)
    pseudocode.js                ← per-method pseudocode / JS snippets
    ui.js                        ← sliders, code drawer, result panel, self-test
    custom.js                    ← Station 10: expression parsing + custom-g computation
    stations.js                  ← drawing and events for Stations 0–10
    app.js                       ← state, navigation, shortcuts, URL, startup
code/                            ← module-by-module reference implementation + verify.js
python/                          ← standard-library Python reference (reliability.py, run_all.py)
matlab/                          ← base MATLAB reference (no toolbox required)
tools/
  build.py                       ← single-file inline build
  gen_formulas.cjs               ← formulas.json → src/js/formulas.js
  formulas.json                  ← TeX sources of the 24 formulas
tests/test_math.js               ← Node numerical regression (20/20)
docs/                            ← user guide, reference values, lecture script, reports (English)
docs/zh/                         ← Chinese originals of the documentation
reference_values.py              ← independent Python baseline (single source of truth)
requirements.md                  ← requirements and design decisions
plot_*.py / *.png                ← early 8 static figures and plotting scripts (historical; the page does not depend on them)
```

> Everything else is temporary/historical (`_tmp/`, `__pycache__/`, `miscellaneous/`, `_*_check.py`, the JCSS training notice, etc.) and does not take part in the page build.

## Python reference

No NumPy/SciPy required.

```powershell
python python\run_all.py
```

It prints the Cholesky factor, MVFOSM, AFOSM, FORM/HLRF, SORM, Monte Carlo, R−S interference and the tangent-error case, and runs assertions. Main file: `python/reliability.py`.

## MATLAB reference

Base MATLAB is sufficient; the Statistics Toolbox is **not** required (the normal CDF uses `erfc`, and the inverse CDF uses the Acklam approximation).

In MATLAB:

```matlab
cd matlab
rel_run_all
```

Or from a terminal:

```powershell
matlab -batch "cd('path/to/matlab'); rel_run_all"
```

Main entry: `matlab/rel_run_all.m`. The reference was tested with MATLAB R2025a.

Expected default results include:

```text
MVFOSM beta = 1.664101, Pf = 4.8046%
FORM   beta = 2.108340, Pf = 1.7501%
SORM   kappa = 0.061175, Pf = 1.6471%
```

## Verification

```powershell
node tests\test_math.js
# 20/20 passed

node code\verify.js
# 39/39 passed
```

```python
python python\run_all.py
# all assertions passed
```

```matlab
rel_run_all
# all assertions passed
```

Page self-test:

```text
structural-reliability-lab.html?selftest=1
# 20/20 PASS
```

The verification report is in [docs/verification_report.md](docs/verification_report.md); the module-level formula map is in [docs/formulas_by_module.md](docs/formulas_by_module.md).

## Technical points

- **Zero runtime dependencies**: native JavaScript + Canvas 2D + SVG, no framework, no CDN, no network requests; the single-file HTML is about 0.5 MB.
- **Single-file build**: [tools/build.py](tools/build.py) inlines `styles.css` and the JavaScript files referenced by `src/index.html` into a copy of `src/index.html`, producing the single-file HTML in `dist/` and in the repository root; the formula SVGs are pre-generated by MathJax at build time and embedded, so no font server is needed at runtime.
- **Bilingual interface**: the page UI can switch between Chinese and English (`?lang=zh` / `?lang=en`, falling back to the browser language).
- **All numbers computed live**: [src/js/model.js](src/js/model.js) implements each method (they are not pasted images); MC uses the fixed seed `20261119` and is reproducible, and the footer shows `MC seed` only on Stations 7/10; deterministic methods are unaffected by the seed.
- **20 built-in numerical self-checks**: covering the normal CDF, Cholesky, the β/Pf of MVFOSM/FORM/SORM, β invariance under PCA, R−S form sensitivity and more.
- **Shareable state**: `?station=N&trans=k&hlr=k&af=k&mc=N&rho=…&mode=pca&code=…&selftest=1&fn=…` and the main-example / interference parameters can all be restored from the URL.
- **Classroom-friendly**: designed for 1920×1080 projection; ≤1500 px collapses the left column into numeric icons; ≤1024 px hides the right result panel; ≤760 px (or touch landscape) switches automatically to the mobile layout: horizontal station bar, single-column cards, full-width canvases, scrollable tables; the desktop layout is unaffected. Printing outputs Station 8 only.

## Known boundaries

- Only the **2-D normal** main example (parabolic limit state) and the `R−S` interference small example; arbitrary `g(x)`, non-normal / correlated non-normal / R-F equivalent normalization, subset simulation and importance sampling are not supported.
- Analytical gradients and Hessians are hard-coded in the `EXAMPLES` of `model.js`; this is a teaching demo, not general-purpose reliability software.
- The page's MC sampling cap is **100k**; `4×10⁶` is a preset reference value (shown only under default parameters, and it disappears as soon as the parameters change).
- Printing covers only the formula card (Station 8); A4 measures **3 pages** (24 formulas + two tables; 3 pages are accepted for readability).
- The sliders allow the mean point to be moved into the failure domain; a yellow warning then appears at the top, MVFOSM's β becomes negative, and AFOSM falls back to FORM — this is a domain issue, not a numerical bug.
- Mobile layout is a fallback only; for projection, 1920×1080 + the latest Chrome / Edge is recommended, and the URL parameter `?projector=1` can be used if needed.

## License

No open-source license file is included in this repository yet. Please contact the repository owner before redistributing or using the materials outside their intended teaching context.
