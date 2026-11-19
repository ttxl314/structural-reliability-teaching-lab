# Lecture Script for the "Structural Reliability Method Comparison Lab"

> **Companion file**: `structural-reliability-lab.html` in the repository root (single file, offline, open by double-clicking; see `README.md` for the build)
>
> **Main example**: `g(X) = X₁² − 2X₂`, `X₁ ~ N(10, 2)`, `X₂ ~ N(20, 5)`, `ρ = 0.5`
>
> **Number conventions**: every number on the page is computed on the spot. Unless otherwise noted, the numbers in this document are results consistent with the page under "default parameters + Cholesky transform + fixed seed 20261119" (β to 3 decimals, Pf to 3 decimals), and the vast majority are shown directly on screen; the few marked "instructor reference" are intermediate quantities computed from the model/formulas (not necessarily displayed as text on the page).
>
> **Usage**: the instructor operates the projected screen while students watch the large display; a 45-minute main route + a 20-minute compressed route; when time runs out, cut the content in Appendix F, but do not cut Stations 1, 3 and 5.

---

## 0. Three main threads (revisited throughout the class)

1. **AFOSM and FORM share the same design point.** Station 4 finds the boundary along the α ray in X space, while Station 5 performs "tangent → foot of the perpendicular" in U space; the paths differ, but both converge to the same `β = 2.108` and `Pf = 1.750%`. Station 4's comparison card is marked directly `≡ same design point`.
2. **The β of MVFOSM changes with the algebraic form.** For the same failure surface `R = S`: written as `R − S` it gives `β = 3.000`; written as `R/S − 1` it gives `β = 2.080`; the equivalent form of the main example, `g₂ = X₁²/(2X₂) − 1`, gives `β = 1.714`. FORM gives `2.108 / 3.000` for all these forms — this is the watershed for whether a method is invariant.
3. **SORM changes only the Pf conversion.** `β` remains FORM's `2.108`, and the design point is not searched again; adding a curvature `κ = 0.0612` corrects `Pf` from `1.750%` to `1.647%` (exact `1.623%`).

> The three main threads land respectively on Stations 4/5, Station 3 (+ the small table on Station 2) and Station 6. When wrapping up, return to the comparison table on Station 8 and say them once more.

---

## 1. Three-minute pre-class checklist

- [ ] Double-click `structural-reliability-lab.html` in the repository root with **Chrome / Edge** (fully offline, no network requests; do not use IE).
- [ ] Press `F` for full screen; try switching stations with `1` and `5`; press `0` to return to the overview.
- [ ] Press `?` to open Help → click **"Run numerical self-test"** and confirm **20 / 20 passed** (you can also open `structural-reliability-lab.html?selftest=1` directly).
- [ ] Press `R` once to reset: default parameters restored, station back to 0 — this guarantees consistency with the numbers in this document.
- [ ] Projection: **1920×1080 is best**; at 1366×768 the left column collapses into numeric icons and the right result panel stays, but the main area requires vertical scrolling.
- [ ] If someone changed the parameters in the previous class, press `R` first; MC samples are cleared as well.

**Three small pitfalls that are easy to hit in class** (know them in advance, stay calm):

- **Shortcuts do not respond while an input has focus**: right after dragging a slider, focus is still on the slider, so `←/→` and `0–9` are passed to the slider. Click an empty area of the page and then press the key.
- **Changing any parameter will**: make the Station 4/5 iteration step jump automatically to the "convergence end point" and clear the MC samples. To re-demo single-stepping, first click **"Back to start"** (to the right of the playback bar on Stations 4/5) or row 0/1 of the iteration table.
- **Entering Stations 4/5 for the first time auto-plays once, and Station 7 starts continuous sampling automatically**; to stop at a given step/blank state, add `?auto=0` when opening (or shared links carrying `af`/`hlr` disable it automatically).
- `Space` / `S` **are valid only on Stations 4, 5 and 7**: on 4/5 they play/single-step; on 7 (Monte Carlo) they toggle continuous sampling/add samples per "batch".

---

## 2. 45-minute overview

The dialog opened by the **"45-minute route"** button in the page's top bar is the table below; click any row to jump directly to that station, and the timings can be adjusted to the class.

| Time | Station | In one sentence | Number anchor |
|---|---|---|---|
| 0–3 | 0 Overview | First create a conflict: the same problem, answers differ by about 3× | 4.80% vs 1.62% |
| 3–9 | 1 Variables and transformation | Skewed ellipse → concentric circles; β is a distance | β = 2.108 |
| 9–16 | 3 Mean-value first-order second-moment | Tangent at the mean point; change the form and β changes | 1.664 / 4.805% |
| 16–21 | 4 Advanced first-order second-moment | Search along the α ray; same design point as FORM | 2.145 → 2.108 |
| 21–29 | 5 FORM / HLRF | Tangent → foot of the perpendicular, 6 iterations to converge | 2.108 / 1.750% |
| 29–34 | 6 SORM | β unchanged; Pf corrected by curvature | 1.750% → 1.647% |
| 34–39 | 7 Monte Carlo | Large samples as the baseline; CI validates FORM | 100k: 1.585% |
| 39–43 | 2 Probability interference | Overlap area ≠ Pf | 3.000 / 0.135% |
| 43–45 | 8 Formulas and code | Wrap-up + print the formula card | Comparison table |

> Note: the main route places **Station 2 (probability interference) in the later part**: first Stations 1, 3 and 5 establish the "transformation — linearization — convergence" backbone, then Station 2 adds "R/S intuition + the small form-sensitivity example", and finally Station 8 wraps up. The page's route dialog is authoritative.

---

## 3. 45-minute segment-by-segment script

### 3.1 0–3 min | Station 0 · Overview

**Time**: 0–3 min (3 min)
**Station**: 0 · Overview — "the same problem: why isn't there just one answer?"
**Click path**: the page opens at Station 0 (press `0` at any time to return). First point at the "failure probability comparison" bar (log axis), then at the 6 method cards; clicking any card jumps to the corresponding station. The "algorithm map" button in the top right opens the method-family pseudocode.

**Key points**:

1. Same problem, same set of random variables; the six objects give **4.80% / 1.75% / 1.75% / 1.65% / 1.63% / 1.62%** (in order: MVFOSM / AFOSM / FORM / SORM / MC / exact). The largest difference is about 3× — this is not a calculation error, it is a difference in assumptions.
2. The differences come from three switches: **where to linearize** (mean point / design point), **what shape to assume for the boundary** (straight line / parabola / no assumption), and **how many samples to use** (Monte Carlo).
3. Page map: X space (skewed ellipse, correlation) → U space (concentric circles, β = distance) → linearization (mean point / design point) → Pf (Φ(−β) or simulation).

**Expected numbers**:

- Method cards: MVFOSM `1.664 / 4.80%`; AFOSM `2.108 / 1.75%`; FORM `2.108 / 1.75%`; SORM `2.108 / 1.65%`; MC `1.63%` (under default parameters this is the **reference** N = 4×10⁶); exact `1.62%`.
- The comparison bar is on a **log axis**, with ticks at 0.1% / 1% / 10%; the callout below says exactly "the difference between 4.80% and 1.62% is not in the arithmetic".

**Common questions**:

- **"Why are AFOSM and FORM exactly the same?"** → two routes to the same design point, demonstrated separately on Stations 4/5 (the page marks `≡`).
- **"I haven't sampled for MC, why is a number already there?"** → under default parameters it shows the preset reference value (4×10⁶ samples, labelled inline "reference N=4×10⁶"); **change any parameter and this row disappears**, and you need to sample live on Station 7.

> 🎯 **Let the students guess first**: reading only the comparison bar, ask "how many times larger is the maximum than the minimum — which one do you believe?" Do not give the answer yet.

---

### 3.2 3–9 min | Station 1 · Variables and transformation

**Time**: 3–9 min (6 min)
**Station**: 1 · Variables and transformation — "turn 'most likely' into 'nearest'"
**Click path**: press `1` (or click in the left navigation). On the right there are four step entries, or use `←` `→` at the top right of the canvas (labelled `1 / 4`) to walk from 1/4 to 4/4; clicking `Play` runs them automatically (1.05 s per step, 1.25 s for the whitening step of affine-deformation animation). From step 2 on, the **equal-β ellipse/circle** and the FORM tangent at the tangent point x* are drawn. In the bottom right, switch the "transformation mode" once between **Cholesky ↔ PCA**. While paused at 2/4 or 3/4, drag the `ρ` slider in the right panel (e.g. 0.5 → 0) and watch the skewed ellipse become a true circle.

**Key points**:

1. In X space, "close to the mean" does not equal "most likely to fail": the two components have different units, variances and correlation, so Euclidean distance has no probabilistic meaning.
2. Three affine steps: **centering** removes location → **standardization** removes units → **whitening** removes correlation; between the four steps there is a **matrix-interpolation animation** (2/4→3/4 first scales the viewport, then fixes the viewport and scales Y, and never toggles the equal-aspect flag so nothing flashes), while the canvas, formula card and matrix card `[A|b]` change in sync; note that the animation interpolates matrices linearly rather than being a simple cross-fade. In the standardization/whitening stages you can also see the equal-β ellipse tangent to the limit state surface at x*, and the tangent line is FORM's linearization; the Z₁ axis spans ±8 with a tick interval of about 2.
3. After whitening, the equal-probability contours become concentric circles and the probability density depends only on the radius, so **β is the distance to the origin**. Cholesky and PCA differ only by an orthogonal rotation: β and Pf are unchanged, and only the design-point coordinates differ.

**Expected numbers**:

- `L = [[2, 0], [2.5, 4.330]]`, `C = [[4, 5], [5, 25]]`, mean point `(10, 20)` (these three are instructor reference; the matrix card on the page shows the `[A|b]` of the current transformation).
- Same design point: under Cholesky `U* = (−1.928, 0.853)`, under PCA `U* = (−0.381, 2.074)` (PCA coordinates are instructor reference), **β is 2.108 in both cases**; `X* = (6.144, 18.873)` (coordinates are shown in the Station 4/5 charts and the status bar).
- While dragging `ρ`, FORM updates in sync (result panel updates too): `ρ = −0.8 → β 1.399 / 8.091%`; `−0.5 → 1.495 / 6.744%`; `0 → 1.717 / 4.298%`; `0.3 → 1.918 / 2.757%`; `0.5 → 2.108 / 1.750%`; `0.8 → 2.615 / 0.446%`; `0.9 → 2.976 / 0.146%`.

**Common questions**:

- **"Why not just use the Mahalanobis distance in X space?"** → the Mahalanobis distance is exactly the Euclidean distance in the whitened U space, and β is precisely that.
- **"Why is U* under PCA different from Cholesky?"** → a different orthonormal basis was used; the coordinates change but the length does not; `β = ‖U*‖ = 2.108` is the same under both.
- **"Does a larger ρ give a larger β?"** → in this example yes (1.399 → 2.976); the reason is explained on Station 3 (gradient components of opposite sign + positive correlation cancel the variance terms).

> 💻 **Code drawer**: "View pseudocode" at the top right (transform), look at the `toU / toX` sections, about 20 seconds.
> 🎯 **Let the students guess**: pause at 3/4 (standardized, `ρ = 0.5`) and ask "are the two directions independent now?" — not yet, it is still a skewed ellipse; only whitening at 4/4 makes them independent.

---

### 3.3 9–16 min | Station 3 · Mean-value first-order second-moment method (MVFOSM)

**Time**: 9–16 min (7 min)
**Station**: 3 · Mean-value FOSM — "draw a tangent line at the mean point"
**Click path**: press `3`. The left chart is X space (blue curve = true boundary, orange dashed = mean-point tangent, orange diamond = center-point-method corresponding point, red star = FORM design point), the right chart is U space (the foot of the perpendicular from the origin to the tangent, `U_L`). Further down, look at the "form sensitivity" card and the "where the error comes from" card. Finally open "View pseudocode" at the top right.

**Key points**:

1. Take a first-order Taylor expansion only at the mean point: `μ_g = g(μ) = 60`, `σ_g = √(∇gᵀC∇g) = 36.056`, `β_M = μ_g/σ_g = 1.664`, `Pf ≈ Φ(−β_M) = 4.805%`.
2. Exact for linear g and normal X; in this example the parabola is strongly nonlinear, so the mean-point tangent is far from the design point and Pf is overestimated by **+196.1%** — this is not a numerical error, it is "the wrong linearization point".
3. The method is not invariant: change the algebraic form of the same failure surface and β changes. `R − S` gives `3.000`; `R/S − 1` gives `2.080`; the ratio form of the main example `g₂ = X₁²/(2X₂) − 1` gives `1.714` (while FORM still gives `2.108`).

**Expected numbers**:

- Next to the canvas title: `β_M = 1.664, tangent X₂ = 10X₁ − 50`; the other chart: `U_L = (−1.615, 0.400), β = 1.664`; orange diamond `X_L = (6.769, 17.692)` (coordinates are instructor reference).
- Formula card: `μ_g = 60.000`, `σ_g = 36.056`; the cross term `−400.0` lowers `σ_g` from `41.231` to `36.056`.
- Error card (relative to the exact value 1.623%): MVFOSM `+196.1%`, AFOSM/FORM `+7.9%`, SORM `+1.5%`.
- Form-sensitivity card: `R − S: 3.000 / 0.135%`; `R/S − 1: 2.080 / 1.876%`.

**Common questions**:

- **"Why does ρ > 0 make β larger?"** → `∂g/∂X₁ = 20 > 0` and `∂g/∂X₂ = −2 < 0` have opposite signs; positive correlation makes the two terms cancel in the variance, so `σ_g` becomes smaller and β becomes larger.
- **"Where does that −400 come from?"** → expand `σ_g² = ∇gᵀC∇g` to `2·g₁·g₂·C₁₂ = 2·20·(−2)·5 = −400`.
- **"Does changing the form really change the result? That's outrageous."** → Station 2 has a cleaner linear example: with `R = S` changed to `R/S − 1`, MVFOSM drops from 3.000 to 2.080 while FORM is unchanged.

> 💻 **Code drawer**: mvfosm (open it after the form-sensitivity part, 5 lines: `g(μ)`, `∇g(μ)`, `σ_g`, `β`, `Φ`).
> 🎯 **Let the students guess**: cover the right panel first and ask "will the mean-point method's β be larger or smaller than the true value?" — in this example `1.664 < 2.108`, it is smaller, so Pf is larger.

---

### 3.4 16–21 min | Station 4 · Advanced first-order second-moment method (AFOSM / design-point method)

**Time**: 16–21 min (5 min)
**Station**: 4 · Advanced FOSM — "follow the current α direction straight to the boundary"
**Click path**: press `4`. On first entry it auto-plays once (to start manually from step 0, pause/return to start first); you can also click "Play" (or press `Space`) to run all 6 steps; click **any row of the iteration table** to replay that step; look at the "AFOSM vs FORM" card on the right (with the `≡ same design point` badge). The playback bar has `◀ / Play / ▶ / Back to start`.

**Key points**:

1. Each step: use the current gradient to compute the direction cosines `α`, define a ray starting at the mean `x = μ + β·Lα`, solve `g = 0` along the ray to get β, then update α at the new point, until neither β nor g changes any more.
2. **The first jump overshoots**: `β = 2.145 > 2.108`, then it swings back. So the first step cannot be taken as the answer — this is also the intuitive explanation of "why iteration is needed".
3. It shares **the same design point and the same β/Pf** with FORM; only the path differs: AFOSM does directional search in X space, FORM does tangent–foot-of-perpendicular in U space. For normal variables the two are equivalent.

**Expected numbers**:

- Converges in 6 steps (iteration table rows 1–6): β `2.145 → 2.109 → 2.108 → 2.108 → 2.108 → 2.108`; `g ≈ 0` (displayed at e−14 magnitude).
- Final value `x* = (6.144, 18.873)`, `β = 2.108`, `Pf = 1.750%`.
- Comparison card: AFOSM and FORM both `β 2.108 / Pf 1.750% / 6 iterations`.
- Step 1 label: "1st jump β=2.145".

**Common questions**:

- **"Why does the first jump overshoot?"** → the starting gradient is taken at the mean point, so the ray direction is not yet aimed at the design point; `α` and the design point depend on each other, so the only option is iteration.
- **"If it equals FORM, why teach it separately?"** → it gives two geometric intuitions, and AFOSM is common in textbooks; it also shows that the "design point" does not depend on the parameterization (algebraic form / coordinate system).

> 💻 **Code drawer**: afosm (open it after explaining the first-jump overshoot; look at `α → d → solve g=0 → substitute back`).
> 🎯 **Let the students guess**: play only to step 1 and ask "will β be larger or smaller next?" (in this example it first falls back, then converges).

---

### 3.5 21–29 min | Station 5 · FORM / HLRF (core section)

**Time**: 21–29 min (8 min)
**Station**: 5 · FORM / HLRF — "tangent → foot of the perpendicular → tangent again"
**Click path**: press `5`. On first entry it auto-plays once (pause first if you want manual control); alternatively click "Back to start" first, then "Play" or press `S` to single-step 6 times; click **any row of the iteration table** to replay it; look at the **"α² contributions"** in the right panel; look at the two mini charts below for β_k and the |g| residual; after convergence, open "View pseudocode" at the top right.

**Key points**:

1. Each step is just: **take the tangent at the current point → take the foot of the perpendicular from the origin to the tangent**. The sequence of feet is the iteration table; after convergence, β is "the nearest distance from the origin to the limit state surface".
2. **The foot at step 1 is exactly the `U_L` of the mean-point method (β = 1.664)** — so MVFOSM can be regarded as the first step of HLRF. This is the key sentence that connects the two methods.
3. After convergence `β = ‖U*‖ = 2.108`; `α = (−0.915, 0.405)` and `α² = (83.6%, 16.4%)` are the variance contributions of the variables to β; `Pf ≈ Φ(−β) = 1.750%`.

**Expected numbers**:

- Iteration table k = 0…6 (7 rows): β `0 → 1.664 → 2.090 → 2.108 → 2.108 → 2.108 → 2.108`; `g` residual `60 → 10.44 → 0.44 → … → 7.6×10⁻⁹` (the |g| mini chart uses a log axis and drops like a straight line).
- `U* = (−1.928, 0.853)`, `X* = (6.144, 18.873)`; the result panel shows β `2.108`, the formula card shows `2.1083`.
- Status bar: "6 iterations in total"; result card note "U-space HLRF; converged in 6 iterations."
- Change `ρ` to verify on the spot that "a larger ρ takes a few more steps": `ρ = 0.8 → β 2.615 / 0.446% / 8 steps`; `ρ = 0.9 → β 2.976 / 0.146% / 11 steps`.

**Common questions**:

- **"When can Pf = Φ(−β) not be used?"** → it is exact only for a half-space/linear boundary; in nonlinear cases it is the FORM approximation (the "sign convention" in the Help dialog and Station 6 both emphasise this).
- **"Why is the sign of α opposite to the textbook?"** → on this page α points to the design point: `α = −∇g(u*)/‖∇g(u*)‖`, `u* = βα`; textbooks often define α along the gradient and write `x* = μ − βασ`; the sign is opposite but the essence is the same.
- **"What does X₁ accounting for 83.6% mean?"** → β is mainly controlled by X₁; to increase reliability, move X₁ first (drag `σ₁` smaller or increase `μ₁` and watch β rise).
- **"Why is the residual chart on a log axis?"** → normal iteration is approximately quadratic convergence, so the residual falls faster than linearly and looks like a steep straight line on a log axis.

> 💻 **Code drawer**: form (HLRF iteration, 7 lines, one-to-one with the iteration table).
> 🎯 **Let the students guess**: before playing, ask "step 0 has β=0; where does the foot land?"; after convergence ask "will more iterations change β?" (no, it has converged).

---

### 3.6 29–34 min | Station 6 · SORM / Breitung

**Time**: 29–34 min (5 min)
**Station**: 6 · SORM — "β unchanged, Pf corrected by curvature"
**Click path**: press `6`. Check **"curvature illustration magnified ×3"** (affects the plot only, not the calculation); then check **"show osculating circle"**; look at the four metric cards on the right and the "Pf comparison" bar.

**Key points**:

1. FORM treats the boundary as a straight line; SORM adds second-order curvature `κ` at **the same design point**, treats the boundary as a parabola, and only corrects the Pf conversion (n = 2: `Pf ≈ Φ(−β)/√(1 + βκ)`).
2. **β is unchanged and the design point is not re-searched**: `κ = 0.0612`, `βκ = 0.129`, correction factor `0.941`; Pf drops from `1.750%` to `1.647%`, and the error relative to the exact value drops from `+7.9%` to `+1.5%`.
3. The sign convention for the correction direction: on this page `κ > 0` means the boundary curves toward the failure domain and the failure domain shrinks, so Pf decreases; if a textbook takes the opposite normal, the formula would be written `(1 − βκ)`. The ×3 magnification only changes the picture.

**Expected numbers**:

- Canvas corner annotation: `κ = 0.0612 · βκ = 0.129 · factor 0.941`.
- Metric cards: principal curvature `κ = 0.0612`, `1/κ ≈ 16.35`; `βκ = 0.129`; correction factor `0.941`; `Pf (SORM) = 1.647%` (FORM `1.750%`).
- Comparison bar: FORM `1.750% (+7.9%)`, SORM `1.647% (+1.5%)`, exact `1.623%`.

**Common questions**:

- **"Why change only Pf and not β?"** → β is defined by the first-order condition (nearest distance); SORM adds second-order information at the same point. "β = distance" and "Pf = Φ(−β)" are two different things.
- **"κ is so small, how can the correction be 5.9%?"** → the factor is `1/√(1.129) = 0.941`, which multiplies Pf down by about 5.9% directly; and Pf is inherently extremely sensitive to β.
- **"Does magnifying ×3 also magnify the numbers?"** → no, it is for plotting only; the page labels it "magnification affects the plot only, not the calculation".

> 💻 **Code drawer**: sorm (Hessian → normal/tangential → κ → factor, 4 core lines).
> 🎯 **Let the students guess**: first ask "with curvature added, will Pf increase or decrease?", then check the magnification to verify.

---

### 3.7 34–39 min | Station 7 · Monte Carlo

**Time**: 34–39 min (5 min)
**Station**: 7 · Monte Carlo — "use large samples as the baseline"
**Click path**: press `7`. On first entry it auto-samples continuously to 100k (to control manually, click `Pause`/`Reset` first; to open blank, use `?auto=0`). Alternatively, first set **target N** to `100000` and click **"Resample to N"** (one step; you can also click "Continuous sampling" to watch the sample cloud appear batch by batch, with "batch size" adjustable from 100 to 20000); switch between **X / U space** to see the same samples; look at the "running estimate and 95% CI" chart and the metric cards.

**Key points**:

1. No linearization: sample directly from `N(μ, C)` and count the proportion with `g < 0`. So it tests all the preceding approximations rather than being a "more advanced answer".
2. Error ∝ `1/√N`: COV ≈ 7.9% at 10k, ≈ 2.5% at 100k; **the 95% CI is sampling error, not model error**.
3. Fixed seed `20261119` makes it reproducible; the page's sampling upper limit is **100k**, and `4×10⁶` is only a preset reference under default parameters (65,121 failures).

**Expected numbers** (fixed seed, default parameters, "Resample to N" = 100000 from zero; results reproducible):

- 100k: `1,585` failures → `Pf = 1.585%`, COV `2.5%`, 95% CI `±0.077%` (absolute percentage points).
- 10k: `158` failures → `Pf = 1.580%`, COV `7.9%`, 95% CI `±0.244%`.
- 1k: `20` failures → `Pf = 2.000%`, COV `22.1%` — too few samples, only the trend can be read.
- Preset reference: N = 4×10⁶, `Pf = 1.628%` (Station 0 card shows `1.63%`; the Station 8 comparison table shows `1.628%` and notes "reference N=4×10⁶"; intermediate quantities such as `se` are in the Python baseline); exact `1.623%`, FORM `1.750%`.
- Result panel: MC / simulation / note "N=100,000; 95% CI ±0.077%".

**Common questions**:

- **"Why does each student get a different result?"** → if everyone starts from zero with target N=100000 and clicks "Resample to N", the fixed seed gives the same result; changing parameters midway or resetting in a different order changes it. The CI describes exactly this kind of fluctuation.
- **"Should we sample 4 million?"** → the page caps at 100k (class-time consideration); the 4×10⁶ reference value is already in the baseline table, used to show "how large a sample is needed for a 0.4% COV".
- **"Who is right, MC or FORM?"** → MC is a baseline but not the truth; it agrees with the exact 1.623% within the CI, showing that FORM's +7.9% is a linearization error.

> 💻 **Code drawer**: mc (8 lines of pseudocode + the binomial standard error).
> 🎯 **Let the students guess**: before sampling ask "for a 1.6% failure probability, how many failures are there in 10,000 samples?" (about 160), then compare after sampling.

---

### 3.8 39–43 min | Station 2 · Probability interference

**Time**: 39–43 min (4 min)
**Station**: 2 · Probability interference — "how much R-and-S overlap counts as failure?"
**Click path**: press `2`. Note: **when entering this station, the "main example parameters / method comparison" on the right panel are hidden**; the four sliders for `R` and `S` are on the right side of the main area (R mean 20–40, S mean 5–25, R/S standard deviation 1–8). Look at the three charts: ① density overlap, with h(s) and f_R/f_S on the same absolute density axis; ② h(s)=f_S·F_R (area = Pf); ③ safety margin `g = R − S`; look at the small "form sensitivity" table. On the spot, drag the S mean from 15 to 18.

**Key points**:

1. **The overlap area is only "what looks dangerous", not Pf** (annotated directly on the chart); the true Pf is the integral of `h(s)=f_S(s)F_R(s)` — the area under the curve in chart ②; in chart ① h(s) shares the absolute density axis with f_R/f_S, so it looks very small, which exactly shows that the failure density accounts for only a small part of the overlap region.
2. When R and S are independent normal, `g = R − S` is also normal: `β = (μ_R − μ_S)/√(σ_R² + σ_S²)`, `Pf = Φ(−β)` is **exact** (β = 3.000 in this example).
3. For the same failure surface `R = S`, changing the form: `R − S` and `R/S − 1` give different MVFOSM β (`3.000` vs `2.080`), while FORM gives `3.000` for both — form sensitivity is cleanest on a "linear g".

**Expected numbers**:

- Default `β = 3.000`, `Pf = 0.135%`, reliability `99.865%`; `μ_g = 15`, `σ_g = 5` (`√(4² + 3²)`, these two are instructor reference).
- Form-sensitivity table: `R − S`: MVFOSM `3.000` / FORM `3.000`; `R/S − 1`: MVFOSM `2.080` / FORM `3.000`.
- Changing parameters live: S mean 15 → 18 gives `β = 2.400`, `Pf = 0.820%` (Pf increases by about 6×).

**Common questions**:

- **"Why is FORM also exact for R/S − 1?"** → in this example both forms have the same zero set, the straight line `R = S`; FORM's linearization at the design point is exactly that line, so there is no linearization error. For a general nonlinear g, FORM is still a first-order approximation.
- **"With so much overlap, how is Pf only 0.135%?"** → the two distributions do overlap, but both must fall in the tail where `R < S`, which is very unlikely.
- **"Where have the main-example sliders gone?"** → this station uses R/S's own four sliders (right side of the main area); the main-example parameter card is temporarily hidden to avoid mixing two parameter sets.

> 🎯 **Let the students guess**: first ask "with this much overlap between the two curves, is Pf 10%?" — the actual value is 0.135%.

---

### 3.9 43–45 min | Station 8 · Formulas and code

**Time**: 43–45 min (2 min)
**Station**: 8 · Formulas and code card — "tie the methods together on one page"
**Click path**: press `8` (or the last row of the top bar's "45-minute route"). Quickly scroll through the 7 formula groups (basics and conversions / spatial transformation / MVFOSM / AFOSM / FORM·HLRF / SORM / simulation and interference); point at the "method comparison (current parameters)" table and the "β ↔ Pf conversion" table; click "Print formula card".

**Key points**:

1. No method is absolutely better; what matters is **whether the assumptions fit, whether the error is acceptable, and whether the computational cost is affordable**.
2. Linear g + normal X: MVFOSM = AFOSM = FORM = exact; nonlinear g: FORM first-order, SORM second-order, MC baseline.
3. Wrap up in three sentences: go to U space to turn "most likely" into "nearest"; FORM linearizes at the most likely failure point; SORM adds curvature, MC provides the baseline, and MVFOSM changes with the algebraic form.

**Expected numbers**:

- Comparison table (current parameters): MVFOSM `1.664 / 4.805% / +196.1%`; AFOSM `2.108 / 1.750% / +7.9%`; FORM `2.108 / 1.750% / +7.9%`; SORM `2.108 / 1.647% / +1.5%`; MC (reference) `1.628% / +0.3%`; exact `1.623% / +0.0%`.
- The β ↔ Pf conversion table has 8 entries; the page notes "memorise these three first for the exam": `β=2 → 2.28%`, `β=3 → 0.135%`, `β=4 → 3.17×10⁻⁵`.
- The formula card has **24 formulas in 7 groups** in total, with 7 method-code entries at the end (the same content as the top-right "View pseudocode" on each station).

**Common questions**:

- **"How do I take the formula card with me?"** → top bar "Print formula card" or the Station 8 button; the print style outputs only this station (A4, hiding the navigation/result panel/code area).
- **"Why don't the station numbers match the requirements document?"** → the body of the requirements document uses the v0.9 7-station numbering (0–6); the implementation was expanded to 11 stations 0–10 by the v1.0 addendum (Station 9 is the later-added overlay/tangent-error module, and Station 10 is the custom-function lab); see Appendix C for the mapping.

> ⏭ If you are already overtime: just flip through the comparison table + say the three sentences, and leave the formula card for after class.

---

### 3.10 Optional extra 2–3 min | Station 9 · Overlay and tangent error

**Time**: optional (not in the main route; teach it if 2–3 min are freed earlier or in a separate session)
**Station**: 9 · Overlay and tangent error
**Click path**: press `9`. The left chart overlays the MVFOSM tangent (orange), the AFOSM=FORM tangent (red) and the SORM second-order curve (green) on the same figure; the top-right `X/Y/Z/U` switches the space, and the equal-probability ellipses (circles in U space) are drawn together; the colour bar below gives β/Pf at the same time. The right chart defaults to β=2.108, κ=0.5; clicking the four failure-domain buttons switches the shading, with the selected curve highlighted and the others dimmed.

**Key points**:

1. **The same figure**: MVFOSM's `g=0` linearized boundary lies above the mean point (g=60 at the mean, not on g=0), the AFOSM=FORM tangent is at the design point, and SORM is a second-order curve near the design point; the light orange dashed line is the parallel tangent through μ, used to explain MVFOSM's offset.
2. **Spaces**: the four charts X/Y/Z/U are affine transformations of the same set of geometric objects; in U space the equal-probability ellipses become circles, and β is the distance to the origin.
3. **Tangent error**: with the same β but different boundary shapes, the error of `Φ(−β)` differs. Defaults: linear 1.752%, convex 1.154% (−34.1%), concave 4.193% (+139.4%), outside-circle 10.841% (+518.9%, equivalent β 1.235).
4. **Extreme case**: when the failure domain lies outside the density contour (outside the circle, r>β), Pf=exp(−β²/2), and the straight-line tangent underestimates Pf by about 6×; therefore `Pf=Φ(−β)` is exact only for a half-space.
5. Drag the `β` and `κ` sliders so students can see how the error varies with curvature and β; when κ=0 the convex/concave/linear cases coincide.

> ⏭ If you can only add 1 minute: just cover the last row of the right table, "outside-circle 10.841% vs linear 1.752%".

### 3.11 Optional extra 3–5 min | Station 10 · Custom function lab

**Time**: optional; suitable for letting students pose their own problems after all methods have been covered
**Station**: 10 · Custom function lab
**Click path**: press `C` (or click "Custom function" in the left navigation). Enter a function in the `g =` box (e.g. `x1*x2 - 50`) and click `Calculate`; drag the μ/σ/ρ sliders; check MVFOSM / FORM / SORM / MC.

**Key points**:

1. This step turns the "worked example" into a "calculator": the limit state surface is no longer the fixed `x1²−2x2`; the curve and failure domain are drawn on the spot with a grid.
2. Arbitrary functions need numerical gradients/Hessians; the page uses finite differences, so FORM/SORM are numerical approximations, not analytical solutions.
3. MC is the reference and gives a 95% CI; an arbitrary function has no "exact analytical value", so do not treat it as the standard answer.
4. Compare on the spot: for the same function, do the linearization method, the curvature correction and the simulation agree? The less smooth the function / the more failure modes it has, the larger the difference.
5. The URL `?station=10&fn=...` can be used to share a function with students.

> ⏭ If you can only add 1 minute: just enter `x1 + x2 - 30`, show that Pf=50% when β=0, then change μ and watch β change.

---

## 4. 20-minute compressed route

Applicable when: the class is squeezed by the previous session, or only a short report is needed to "explain clearly where the differences come from". **Keep the backbone: transformation → linearization → convergence → wrap-up**; omit all of Station 2 and keep only 2 minutes for Station 4.

### 4.1 Timetable

| Time | Station | Only do this | Numbers to keep |
|---|---|---|---|
| 0–2 | 0 Overview | comparison bar + six cards, create the conflict | 4.80% vs 1.62% |
| 2–5 | 1 Variables and transformation | only 3/4 → 4/4, switch PCA once | β = 2.108 |
| 5–9 | 3 MVFOSM | mean-point tangent + small form-sensitivity card | 1.664; 3.000 vs 2.080 |
| 9–11 | 4 AFOSM | play to step 2; only explain "overshoot + ≡FORM" | 2.145 → 2.108 |
| 11–15 | 5 FORM / HLRF | one-click play to convergence; α² contributions | 2.108 / 1.750% / 83.6% |
| 15–17 | 6 SORM | only check the magnification, explain factor 0.941 | 1.750% → 1.647% |
| 17–19 | 7 Monte Carlo | target N=100000, click "Resample to N", look at the CI | 1.585% ± 0.077% |
| 19–20 | 8 Formulas and code | comparison table + three sentences | whole table |

### 4.2 What can be cut when compressing

- **Cut entirely**: Station 2 (probability interference) → leave for self-study after class (`?station=2` goes straight there).
- **Station 3**: on the error card only look at the three percentages, without explaining the cross term; "the ratio form of the main example, 1.714" can be mentioned in one sentence.
- **Station 4**: only look at the step-1 overshoot and the `≡` badge on the right; do not go through the iteration table row by row.
- **Station 6**: only check "curvature magnification ×3", not the osculating circle.
- **Station 7**: target N=100000; click "Resample to N" instead of "Continuous sampling"; do not switch to U space.
- **Station 8**: only flip through the comparison table, not every formula.

### 4.3 10-minute fallback plan

| Time | Station | In one sentence |
|---|---|---|
| 0–1 | 0 Overview | the same problem differs 3× because the assumptions differ |
| 1–6 | 5 FORM / HLRF | play to convergence: tangent→foot, β=2.108, α²=83.6% |
| 6–8 | 6 SORM | β unchanged, Pf 1.750% → 1.647% |
| 8–9.5 | 7 Monte Carlo | 100k sampling, CI validates FORM |
| 9.5–10 | 8 Formula card | comparison table + three sentences |

> If the students' background is stress–strength (civil/bridge): replace the 2 minutes for Station 4 in the 20-minute route with **Station 2** (R/S interference + the small form-sensitivity example), and keep only one sentence for Station 4: "AFOSM is an equivalent route to FORM".

---

## 5. Appendices

### Appendix A · Instructor quick-reference number card (default parameters)

| Quantity | Value | Where it appears |
|---|---|---|
| MVFOSM β / Pf | `1.664 / 4.805%` | Stations 0/3/8, result panel |
| Mean-point tangent | `X₂ = 10X₁ − 50` | Station 3 chart annotation |
| `U_L` (step-1 foot) | `(−1.615, 0.400)` | Stations 3, 5 |
| `X_L` (center-point-method corresponding point) | `(6.769, 17.692)` | Station 3 chart (orange diamond; coordinates are instructor reference) |
| FORM β / Pf | `2.108 / 1.750%` | Stations 0/4/5/8 |
| `U*` (design point) | `(−1.928, 0.853)` | Station 5, formula card |
| `X*` (design point in X space) | `(6.144, 18.873)` | Stations 4/5 |
| `α` / `α²` | `(−0.915, 0.405)` / `83.6% + 16.4%` | Station 5 |
| Iteration count | HLRF 6 (table 7 rows); AFOSM 6 steps | Stations 4/5 |
| SORM `κ / βκ / factor` | `0.0612 / 0.129 / 0.941` | Station 6, formula card |
| SORM Pf | `1.647%` | Stations 6/8 |
| MC reference | `1.628%` (N=4×10⁶, 65,121 failures) | Stations 0/7/8 |
| MC live 100k | `1.585%` (1,585 failures, CI ±0.077%) | Station 7 |
| Exact Pf | `1.623%` | Stations 3/6/7/8 |
| R−S interference | `3.000 / 0.135%` | Station 2 |
| MVFOSM of R/S−1 | `2.080 / 1.876%` (FORM still 3.000) | Stations 2/3 |
| Ratio form of the main example | `1.714` (FORM still 2.108) | Station 3 |

### Appendix B · URL live-demo checklist

Append a query string after the file path in the address bar to reproduce a given step (`station`, `trans`, `hlr`, `af`, `mc`, `mode`, `code`, `selftest`, as well as the main parameters `mu1/mu2/s1/s2/rho` and the R/S parameters `muR/muS/sR/sS`):

| What to demo | Open |
|---|---|
| Whitening (Cholesky) | `structural-reliability-lab.html?station=1&trans=3` |
| Whitening (PCA) | `structural-reliability-lab.html?station=1&trans=3&mode=pca` |
| AFOSM step 2 | `structural-reliability-lab.html?station=4&af=1` |
| FORM row 3 (k=2) | `structural-reliability-lab.html?station=5&hlr=2` |
| FORM convergence step | `structural-reliability-lab.html?station=5&hlr=6` |
| FORM large-ρ demo | `structural-reliability-lab.html?station=5&rho=0.8` |
| MC pre-sample 100k | `structural-reliability-lab.html?station=7&mc=100000` |
| Interference + change S mean | `structural-reliability-lab.html?station=2&muS=18` |
| Formula card | `structural-reliability-lab.html?station=8` |
| Self-test | `structural-reliability-lab.html?selftest=1` |
| Open the code drawer directly | `structural-reliability-lab.html?station=5&code=form` |

Note: `code` can be `overview / transform / interference / mvfosm / afosm / form / sorm / mc`; parameters are clipped to the widget ranges, and `hlr/af` out of range are clamped to valid step counts; `mc` is capped at 100,000. Some browsers do not allow scripts to rewrite the address bar under `file://`, but "opening with parameters" itself works.

### Appendix C · Station numbering cross-reference (requirements v0.9 → current implementation)

| Requirements body (v0.9, 7 stations) | Current implementation (10 stations) |
|---|---|
| 0 Overview | 0 Overview |
| 1 Variables and U space | 1 Variables and transformation |
| 2 Mean-point method | **3** Mean-value FOSM (MVFOSM) |
| 3 FORM/HLRF | **5** FORM / HLRF |
| 4 SORM | **6** SORM |
| 5 Monte Carlo | **7** Monte Carlo |
| 6 Formula card | **8** Formulas and code |
| — (new) | **2** Probability interference |
| — (new) | **4** Advanced FOSM (AFOSM) |
| — (later added) | **9** Overlay and tangent error |

> The v1.0 addendum at the top of the requirements document already declares that "the number of stations is adjusted from 7 to 9"; the pacing table in §2 and the station list in §5.2 of the body still use the v0.9 numbering. **The page implementation 0–10 and this document are authoritative.**

### Appendix D · Code drawers and interactive checkpoints

**Code drawers** (top right of each method station; the dialog has two tabs, "pseudocode / JS implementation", and is copyable):

| When to open | Drawer | In one sentence |
|---|---|---|
| after the whitening explanation on Station 1 | transform | the affine transform changes coordinates only, not probabilities |
| after the form-sensitivity part on Station 3 | mvfosm | 5 lines: `g(μ)`, `∇g(μ)`, `σ_g`, `β`, `Φ` |
| after the first-jump overshoot on Station 4 | afosm | `α → d → solve g=0 → substitute back` |
| after convergence on Station 5 | form | one-to-one with the iteration table |
| after the metrics on Station 6 | sorm | Hessian → κ → factor |
| after sampling 100k on Station 7 | mc | counting + binomial standard error |
| before the end of Station 2 | interference | overlap area ≠ Pf; only the integral of h(s)=f_S·F_R is |
| opening/wrap-up of Station 0 | overview ("algorithm map") | six assumptions for the same problem |

**Interactive checkpoints quick reference**:

| Station | Let students guess | Answer |
|---|---|---|
| 0 | how many times larger is the maximum than the minimum | about 3× (4.80% vs 1.62%) |
| 1 | are they independent after standardization | no, still a skewed ellipse |
| 3 | is the mean-point β too large or too small | too small (1.664 < 2.108), Pf too large |
| 4 | will β be larger or smaller next | the first jump overshoots, then it falls back and converges |
| 5 | who is the step-1 foot | MVFOSM's `U_L`, β = 1.664 |
| 6 | will Pf increase or decrease | decrease (κ > 0, failure domain shrinks) |
| 7 | how many failures in 10,000 samples | about 160 (1.6%) |
| 2 | with this much overlap, is Pf 10% | no, 0.135% |

### Appendix E · Standard answers to students' frequent questions

1. **Why must β be defined in U space?** Because in X space the components have different units/variances/correlations, so distance has no probabilistic meaning; after whitening the probability density depends only on the radius, so "nearest" equals "most likely".
2. **Why does MVFOSM change when the form changes?** It only does a first-order Taylor expansion at the mean point, so the linearization error depends on the algebraic form of `g`; `R−S` and `R/S−1` have the same zero set but different gradients at the mean point, hence `3.000` vs `2.080`.
3. **Why do AFOSM and FORM give the same number?** For normal variables both converge to "the nearest point from U space to the zero set", the same design point and the same β; only the search path differs.
4. **Why does SORM change Pf but not β?** β is defined by the first-order (nearest point) condition; SORM adds second-order curvature at the same point and only changes the Pf conversion.
5. **MC differs every time; can it be trusted?** With a fixed seed it is reproducible; the 95% CI describes the sampling error. When Pf is small, the relative error ∝ `1/√(N·Pf)`.
6. **The sign of α is opposite to the textbook?** On this page α points to the design point, `u* = βα`; textbooks often take the gradient direction and write `x* = μ − βασ`; the sign is opposite but the essence is the same.
7. **Why is β larger when ρ is larger?** In this example the gradient components have opposite signs, and positive correlation makes the variance cross term negative and `σ_g` smaller, so β becomes larger.
8. **When must MC be used?** High dimensions, strong nonlinearity, non-normal distributions, no analytical gradient, or when a baseline check is needed; in this example MC checks FORM/SORM.
9. **Does the same β always give the same Pf?** No. `Pf = Φ(−β)` is exact only for a half-space/linear boundary; with the same β = 2.108, if the boundary is a circle (χ² type), `Pf = exp(−β²/2) ≈ 10.83%`. The page does not draw this counterexample; you can say it or write it on the board as an after-class thought.
10. **Why should we trust the page's numbers?** Everything is computed live; the Help dialog has **20 numerical self-checks** (currently 20/20 passed), and there is an independent Python baseline in `reference_values.py`.

### Appendix F · Cut order when time runs out

1. **Cut Station 2 first** (4 min) → make it after-class self-study (`?station=2`).
2. On Station 3, only look at the numbers on the "where the error comes from" card and do not explain the cross term (saves 1–2 min).
3. On Station 6, only explain `κ` and the factor; do not check the osculating circle (saves 1 min).
4. On Station 7, set target N to 100000 and click "Resample to N" instead of continuous sampling (saves 1–2 min).
5. On Station 8, only flip through the comparison table (saves 1 min).
6. **Do not cut Stations 1, 3 and 5**: they are the backbone of "geometry → linearization → convergence"; cut them and only conclusions remain.

### Appendix G · Number conventions and self-test

- All numbers on the page are computed live by `src/js/model.js`; the default parameters are `μ₁=10, μ₂=20, σ₁=2, σ₂=5, ρ=0.5`, and the transformation is Cholesky.
- HLRF convergence criterion `|g| < 1e-8`, at most 30 steps; SORM uses the analytical Hessian (the Python baseline additionally cross-checks with finite differences).
- MC fixed seed `20261119` (the footer shows `seed 20261119`); the page's sampling limit is 100k; the `4×10⁶` reference value comes from the Python baseline.
- Self-test: Help dialog → "Run numerical self-test" (or `?selftest=1`), which shows PASS/FAIL item by item; if the page scripts themselves error, a red error bar appears at the top of the page.
- Independent recomputation: `python reference_values.py` (numpy), which outputs MVFOSM / the HLRF iteration table / SORM / exact / MC / the ρ sweep / the R−S small example, consistent with the page to the displayed digits.
- This document quotes **screen-displayed values**: β to 3 decimals, Pf to 3 decimals; in the formula card β can be shown to 4 decimals (e.g. `2.1083`), which is not a contradiction.
