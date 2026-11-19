# Review Fix Record (for `docs/review_report.md`)

> Compiled by the root agent · evening of 2026-11-19  
> The review report is a **pre-fix** snapshot; this record explains the disposition of each item so acceptance can be checked against it.  
> Final artifacts after the fixes: the root `structural-reliability-lab.html` and `dist/structural-reliability-lab.html` (byte-identical); the A4 formula card is 3 pages.

## 1. BLOCKER

### B1. AFOSM crashed under legal slider parameters → fixed

- **Root cause**: `solveBeta()` relied on a "double until the sign changes" assumption, so when the quadratic form `g` is non-monotonic along the ray it could skip the negative interval; `afosm()` had no NaN guard.
- **Fix** (`src/js/model.js`):
  1. `solveBeta()` now performs a **fine scan (step 0.02, up to β = 60) to find the first +→− interval, then bisects** it; it returns `{beta, reason}` and returns `reason` instead of NaN when the problem is unsolvable.
  2. `afosm()` checks for finiteness at every step; when the problem is unsolvable or NaN, it **falls back to FORM's same design point** and returns `failed:true, fallback:true`, with β/Pf taken from FORM.
  3. Station 4 gained a fallback state: the iteration table shows an explanation, the result card shows a "Fallback" badge, the comparison card is marked "≡ same design point (fallback)", and playback/single-stepping shows a hint; 0.000/50% or NaN no longer appears.
- **Retest** (Edge 157 headless, final build):
  - `?station=4&mu1=12&mu2=12` → AFOSM β=4.100, 15-row iteration table, no NaN; FORM is 4.100, and the two share the same design point.
  - `?station=4&mu1=5&mu2=30` → falls back to FORM 1.552/6.037%; the page shows the fallback explanation and warning, with no NaN.
  - Default parameters → 2.108 / 6 rows, unchanged.

## 2. MAJOR

### M1. 5 hard-coded numbers/texts → now dynamic

| Location | After the fix |
|---|---|
| `src/js/stations.js` `mvXTag` | `tangent X₂ = μ1·X₁ − μ1²/2`, generated from the current μ1; with `μ1=15` it shows `15.00X₁ − 112.50` |
| `src/js/stations.js` SORM comparison card / result panel | Errors are computed on the fly from `(form.pf-ex)/ex` and `(so.pf-ex)/ex`; with `μ1=15` it shows "corrected from +17.2% to +1.4%", and the result panel shows "1.4% above the exact value" |
| `src/js/stations.js` MC formula card | COV is computed on the fly from the current `main.exact` for the 10k/100k tiers; with `μ1=15` it shows 1922.6%/608.0%, versus 7.8%/2.5% by default |
| `src/js/stations.js` formula-card FORM row / overview FORM card | The iteration count is computed on the fly from `main.form.history.length-1`; with `μ1=12,μ2=12` it shows 15 steps |
| `src/js/stations.js` cross-term direction | Branches on `cross > 0 ? 'rises to' : 'falls to'`; with `μ1=15,s1=3,ρ=−0.2` the positive cross term shows "rises to" |

### M2. Formula-card comparison table showed `null` in the MC row → fixed

- The formula-table rendering in `src/js/stations.js` now uniformly uses the `num/—` check: `null`, `NaN` and non-numeric values all output `—`; MC's "sample on Station 7" note is placed in the description column.
- Retest `?station=8&mu1=15` → `MC | — | — | — | sample on Station 7`; `null` is never printed.

### M3. No warning when the mean point falls in the failure domain → fixed

- `computeMain()` now computes `meanSafe = g(μ) > 0`.
- A new yellow global warning bar below the top bar shows, when `g(μ) = … ≤ 0`: "Mean point is in the failure domain; the linearization assumptions of MVFOSM/AFOSM do not hold. Move the parameters back to the safe domain or use MC."
- The Station 3/4 result-card badge is changed to "Assumption invalid", with an explanatory note; when the mean point is in the failure domain, AFOSM falls back to FORM and this is annotated; the warning bar is hidden when printing.
- Retest `?station=3&mu1=5&mu2=30` → warning bar plus the "assumption invalid" annotation on MVFOSM −2.021/97.835%; a negative β is no longer treated as a normal result.

### M4. Print output is 3 pages vs. the acceptance criterion "within two pages" → 3 pages accepted after confirmation

- 24 formulas + the method comparison table + the β↔Pf table; for readability the measured result is **A4 3 pages** (the code area is hidden, and only Station 8 is printed).
- The v1.0 addendum item 8 of the requirements and `docs/user_guide.md` have been updated: **3 pages is now the criterion**; the v0.9 "within two pages" criterion is no longer used for acceptance.
- `docs/formula_card.pdf` has been exported from the final build (3 pages).

### M5. Projector font sizes too small → "projector mode" added

- A new `Projector` button in the top bar: body text 14→17 px, headings 28→36 px, large result numbers 42→52 px, canvas labels uniformly ×1.4 (about 14.7 px).
- Clicking `Exit projector` again restores the normal view; `?projector=1` is supported; print styles are unaffected.
- Retest `?station=0&projector=1` and `?station=5&projector=1`: the font sizes are clearly enlarged, and the layout allows vertical scrolling.

## 3. MINOR (handled)

1. **8 px of vertical scrolling on Station 5**: `.two-mini-charts` margin 14→10 and stage bottom padding 30→26, reducing the height.
2. **Formatting of very small Pf**: the `<0.01%` branch of `fmt.pct` now uses scientific notation plus an exponent percentage (e.g. `2.71×10⁻⁷ (2.7×10⁻⁵%)`); `0.0000%` no longer appears.
3. **MC empty-state legend**: when no sampling has been done, only the "exact/FORM" legend entries are shown; the "running estimate" entry is no longer shown without data.
4. **Overview MC card vs. formula card**: both show the reference value under default parameters; after changing parameters the formula card shows `—`/go sample, and the overview card behaves the same (the default reference is shown only under default parameters).
5. **Documentation wording**: `docs/user_guide.md` now adds the "under default parameters" qualifier, projector mode, `?projector=1`, AFOSM fallback and the mean-point warning; `README.md` has been synced.
6. **Deliverable gap**: `docs/formula_card.pdf` has been generated; `README.md` exists.

## 4. Post-fix regression

| Item | Result |
|---|---|
| `node tests/test_math.js` | 20/20 passed |
| Page `?selftest=1` | 20/20 passed, no error banner |
| `?station=4&mu1=12&mu2=12` | AFOSM 4.100 / 15 rows / no NaN |
| `?station=4&mu1=5&mu2=30` | fallback to FORM 1.552 / 6.037%, warning bar, no NaN |
| `?station=3&mu1=5&mu2=30` | warning bar + "assumption invalid" annotation |
| `?station=3&mu1=15` | tangent `15.00X₁ − 112.50`; cross-term direction correct |
| `?station=6&mu1=15` | SORM error +17.2%→+1.4%, result panel 1.4% |
| `?station=7&mu1=15` | COV computed on the fly from the current Pf (1922.6%/608.0%) |
| `?station=8&mu1=15` | MC row `—`, no `null`; FORM 7 steps, dynamic |
| Print | A4 3 pages, only Station 8 printed, code area hidden |
| Offline | root HTML has 0 external `script src`/`link`; root and dist have the same hash |
| Backup | 9 × 1920×1080 screenshots plus a full-page shot of Station 8; re-generated from the final build |

## 5. Conventions retained

- The main example is still a **2-D normal + parabola**; arbitrary `g(x)`, non-normal distributions, subset simulation and importance sampling are not supported.
- AFOSM's "fallback to FORM" is **by design**: the directional search can miss the boundary under some parameters, while FORM still converges; the page clearly labels the fallback and never disguises it as AFOSM iteration.
- Printing 3 pages is a **product decision** (readability first), not an unfixed defect.
- Projector mode raises canvas font sizes to about 14.7 px; if the classroom is farther away, browser `Ctrl +` can zoom further.

## 6. Additional features (requested by the user at 23:50 on 2026-11-19)

1. **Adjustable MC sample count** (Station 7): added "Batch size [1000]", "Draw one batch", "Target N [100000]", "Resample to N" and "Continuous sampling". `Resample to N` first clears to zero and then samples up to the target with the fixed seed, so it is reproducible; `?mc=5000` sets the target box to 5000.
2. **The interference plot now gives the failure probability density directly** (Station 2): `h(s)=f_S(s)·F_R(s)` is overlaid directly on the density-overlap plot and shares **the same absolute density axis** as f_R/f_S (h is small but drawn at its true value; chart ② keeps the enlarged h(s) vertical axis); the formula card states explicitly that `h(s)` and `∫h(s)ds=Pf`, and keeps the "the orange overlap is not Pf" annotation.
3. **Unified method colours across the page**: MVFOSM orange, AFOSM blue, FORM red, SORM green, MC purple, exact grey. The overview "same problem comparison: β / Pf" chart gives one row per method with a legend, β values and Pf bars; the right-panel comparison table, the formula-card comparison table, the Station 3 error bars, the Station 6 Pf bars and the MC convergence chart all use this palette; the tangents of MVFOSM/AFOSM/FORM/SORM also use the method colours.
4. **Animations between the four steps on Station 1**: 1.05 s affine-matrix interpolation (whitening step 1.25 s, standardization step 1.4 s; translation→scaling→whitening); **2/4→3/4 is split into two segments**: first scale the viewport to the standardized proportions, then keep the viewport fixed and scale the Y axis; the `equal` flag is never toggled throughout, avoiding flicker; the Z₁ axis is symmetric at ±8 with a tick interval of about 2; equal-probability ellipses, the limit state surface and the design point deform continuously together; from step 2 onward the **equal-β ellipse/circle** and the FORM tangent at the tangent point x* are also drawn; the X/Y zero axes and ticks are bolder; the failure domain/curves are drawn beyond the boundary and then clipped, so no artificial edges or truncated data endpoints appear inside the visible area; supports `←/→`, step cards, `Play` and `?transplay=1`, and respects `prefers-reduced-motion`.
5. **New Station 9 · Overlay and tangent error**: the left chart overlays the tangents and design points of MVFOSM/AFOSM=FORM/SORM on one figure, and supports switching between **the X/Y/Z/U spaces**; equal-probability ellipses (circles in U space) are drawn with the space; a fixed **1:1 square window** is used (X: 0–22; U: centred on β), the canvas is square, both axes have the same unit length, and the line from the origin can be measured by eye; the figure supports **mouse-wheel zoom, drag to pan, double-click to reset** and `−/＋/⟲` buttons. MVFOSM's `g=0` linearized boundary and "the parallel tangent through μ (g=60)" are annotated separately. The right chart compares the linear/convex/concave/outside-circle failure domains at the same design point, with draggable β and κ; the selected curve is highlighted and the others dimmed, and the table highlights in sync; boundaries and failure-domain fills are drawn beyond the window and then clipped, so there is no `U₂≈±4.5` cut-off inside the window. Default β=2.108, κ=0.5: linear 1.752%, convex 1.154% (−34.1%), concave 4.193% (+139.4%), outside-circle 10.841% (+518.9%, equivalent β 1.235).
6. **U-space charts are not truncated** (Stations 3/4/5/7/9): the limit state surface and failure domain are drawn beyond the window and then clipped; MC's U-space sample plot, the FORM/HLRF iteration plot, the SORM local window and the Station 9 overlay all fill the viewport continuously.
7. **New Station 10 · custom function lab**: enter `g(x₁,x₂)` (recursive-descent parser, no eval), and compute MVFOSM / FORM (AFOSM) / SORM / 100k MC on the fly under 2-variable normal + correlation; draw g=0 and the failure domain as an on-the-fly grid, show the equal-β ellipse, the two tangents and the mean/design points/MVFOSM foot; the μ/σ/ρ sliders recompute in real time; the URL supports `fn=`; the keyboard shortcut `C` jumps straight there.
8. **Auto-demo on first entry**: Stations 4/5 auto-play once on first entry (stopping at convergence); Station 7 auto-samples continuously to 100k on first entry. `?auto=0` disables this; shared links that explicitly carry `af`/`hlr` also disable it, so the specified step is not overwritten.
9. Retest: `?mc=5000` gives N=5000, 80 failures, Pf=1.600%, CI ±0.348%; `?station=2`'s h(s) shares the axis with chart ② and the area annotation is normal; `?station=0`'s legend and β/Pf values are normal; `?station=1&transplay=1` stops stably on the 4/4 whitened view; `?station=9`'s overlay/tangent and error table are normal; `?allspace=u` opens the U-space overlay directly; `?station=10&fn=x1%5E2-2*x2` gives MVFOSM 1.664 / FORM 2.108 / SORM 2.108 / MC around 1.6%; no error banner.
10. **Formula/code/verification tidy-up**: added `code/` (module-by-module reference implementations 00–10 + `shared/` + `verify.js`), `docs/formulas_by_module.md`, `docs/verification_report.md`; `node code/verify.js` 39/39, page `?selftest=1` 20/20.
11. **Top-bar simplification**: removed the four buttons in the top-right corner (`45-minute route / Projector / Help / Print formula card`), keeping only `Reset`. Help is still available via `?`, projector mode via `?projector=1`, and printing can still be triggered from Station 8.
12. **Station 9 fixed 1:1**: the `1:1` toggle was removed; entering Station 9 directly uses an equal-scale square window; X is 0–22 and U is centred on β; zoom/pan are retained.
13. **Station 10 function-example correction**: the original "sine" example `5+sin(x1)+2cos(x2)` has range [2,8], always greater than 0, so it has no `g=0`; it was first changed to `sin(x1)+2cos(x2)+1`, but inspection showed 30+ disconnected failure regions, making a single-design-point FORM/SORM unrepresentative. Two examples were kept in the end: sine = `sin(x1)+x2-19` (a simply connected failure region, suitable for a single design point); multiple failure regions = `sin(x1)+2cos(x2)+1` (a multiply connected failure region, suitable for demonstrating the limitations of FORM/SORM). The page also adds a count of connected failure-region components, a "multiple failure regions" hint and a "no g=0 in the viewport" hint.
14. **The seed is shown only in the corner of the MC page**: the footer `MC seed 20261119` is shown only on Stations 7 and 10 and hidden on other stations; the tooltip says "used for Monte Carlo sampling only".
15. **Mobile adaptation**: at ≤760 px, or on touch landscape screens with height ≤500 px, the page automatically switches to the mobile layout — the top bar keeps only Reset, the left sidebar becomes a horizontally scrolling station bar, cards are single-column, canvases are full-width, tables scroll horizontally, and canvas fonts are ×1.05; the desktop layout is unchanged. Tested on a real 390×844 viewport with no horizontal overflow.

---

*End of fix record. B1/M1/M2/M3 from the review report are closed; M4/M5 have been handled as described above.*
