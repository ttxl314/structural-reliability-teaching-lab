# Structural Reliability Method Comparison Lab · Usage Guide

[Chinese original](zh/user_guide.md)

> For teachers / teaching assistants opening the page for the first time: after reading this page you can independently run one class session's demonstration, printing, and self-check.
> Corresponding page: [structural-reliability-lab.html](../structural-reliability-lab.html) (single-file build artifact in the repository root).
> Reviewed on: 2026-11-20. The current implementation has **11 stations, numbered 0–10**.

---

## 1. How to open

| Step | Action |
|---|---|
| 1 | Double-click `structural-reliability-lab.html` in the repository root; a copy with the same name is under `dist/` and has identical content |
| 2 | Open it with **Chrome or Edge** (Chromium-based); 1920×1080 is recommended for projection, at least 1280×800 |
| 3 | No internet or installation needed: a single file, no external requests, no CDN; formulas are embedded SVG and do not depend on a font server |

Before use:

- The page is a **build artifact**. After changing `src/`, run `python tools/build.py` to regenerate both the root copy and the `dist/` copy; opening `src/index.html` directly also works (it references the CSS/JS in the same directory), but for classroom distribution, copying, and printing use the single-file version in the root.
- Under `file://`, the browser may forbid the page from writing back to the address bar (the code silently ignores this); this does not affect station switching or the demonstration.
- When the window width is **less than 1024 px**, the right-hand result panel is hidden automatically; **below 760 px (or in phone landscape)** the phone layout is enabled automatically (see section 4.6).
- If the red "page script error" banner appears at the top, press F5 to reload; if it persists, first run `node tests/test_math.js` on the command line to confirm the numerical kernel is healthy.

---

## 2. Interface layout

| Area | Content | Use |
|---|---|---|
| Top bar | `Reset` | Restores all default parameters and returns to station 0; the route / projection / help / print entries that used to be in the top bar have been removed |
| Left navigation | 11 stations in 5 groups: **Overview / Geometry / Methods / Wrap-up / Lab** | Click to jump; `←` `→` step through stations, `0–9` jump, `C` opens the custom function |
| Center stage | Charts, iteration tables, and formula cards of the current station | Most charts are Canvas and are redrawn in real time when parameters change |
| Right result panel | Result card → main example parameters → method comparison → teaching notes | The result card follows the station and method; parameter sliders recompute in real time |
| Bottom status bar | Current station, shortcut hints; only stations 7/10 show `MC seed 20261119` | The seed only affects Monte Carlo; deterministic methods are unaffected, and other stations do not show it |

The page title "One problem · six algorithms · step by step" refers to the 6 results shown side by side under the main example: MVFOSM, AFOSM, FORM, SORM, MC (reference), and exact integration.

> **Method colors (consistent across the page)**: MVFOSM orange `#ff7f0e`, AFOSM blue `#1f77b4`, FORM red `#d62728`, SORM green `#2ca02c`, MC purple `#9467bd`, exact gray `#7f7f7f`. The overview "same problem: β / Pf" chart, the right-panel comparison table, the formula-card comparison table, the station 3 error bars, the station 6 Pf bars, and the station 9 combined figure all use this palette. Each method's tangent line also uses the method color: MVFOSM orange, AFOSM blue, FORM red, SORM green; the limit-state surface uses a neutral blue, and the design point is still a red star.

> **Projector mode**: The top-bar button has been removed; when needed, open with `?projector=1` to scale up the body text, large result numbers, and canvas labels uniformly (canvas font size ×1.4); clear the URL or reset to restore. In projector mode the page may scroll vertically, which is normal.
>
> **Mean-point warning**: If μ is moved so that `g(μ) ≤ 0` (the mean point has entered the failure domain), a yellow warning bar appears at the top; in that case MVFOSM's β becomes negative and AFOSM falls back to FORM. This is "the domain is not satisfied", not a numerical error. Move back into the safe domain to restore.

---

## 3. The eleven stations at a glance

| # | Station | Group | One-line content |
|---|---|---|---|
| 0 | Overview | Overview | 6 result cards + failure probability comparison bars (log axis 0.1%–10%) + method map; start by seeing "where the difference is" |
| 1 | Variables and transformations | Geometry | Original X → centered → standardized → whitened, all 4 steps; the tilted ellipse becomes concentric circles, and β is the distance to the origin |
| 2 | Probability interference | Geometry | Density overlap of R and S + failure probability density h(s)=f_S·F_R, safety margin g=R−S; overlap area ≠ Pf |
| 3 | Mean-value first-order second-moment (MVFOSM) | Methods | Draw a tangent at the mean point; view the tangent in X space and the foot of the perpendicular in U space; large error when nonlinearity is strong |
| 4 | Advanced first-order second-moment (AFOSM) | Methods | Search along the current α direction in X space; 6 steps with default parameters, 5–15 with other parameters; same design point as FORM. If the direction search does not cross the boundary, the page falls back to FORM and labels it |
| 5 | FORM / HLRF | Methods | In U space "tangent → foot → tangent again"; 6 iterations with default parameters; α² shows what controls β |
| 6 | SORM | Methods | Add curvature κ at the design point; β unchanged, Pf corrected from 1.750% to 1.647% |
| 7 | Monte Carlo | Methods | Count g<0 directly with a large sample; on-page sampling limit 100k; 95% CI is the sampling error |
| 8 | Formulas and code | Wrap-up | 7 groups, 24 formulas total + method comparison table + β↔Pf conversion table; printable |
| 9 | Combined figure and tangent error | Wrap-up | All methods overlaid in one X-space figure; β→Pf error comparison for linear / convex / concave / outside-circle failure domains |
| 10 | Custom function lab | Lab | Enter any g(x₁,x₂), draw g=0/failure domain on the spot, compute MVFOSM / FORM / SORM / MC |

### 3.1 Operating highlights per station

**Station 0 · Overview**

- Click any result card to jump directly to the corresponding station (MVFOSM→3, AFOSM→4, FORM→5, SORM→6, MC→7, exact→8).
- With default parameters, look at the gap between 4.80% and 1.62%; the MC reference value is N=4×10⁶ and is only displayed under default parameters.

**Station 1 · Variables and transformations**

- Use the `←` `→` inside the card, the 4 step buttons, or `Play` at the top right to switch between 1/4 → 4/4; when switching, the canvas interpolates the affine matrix over **1.05 s (1.25 s for the whitening step, 1.4 s for the standardization step)**, deforming the iso-probability ellipse, limit-state surface, and design point together and continuously. **2/4 → 3/4 is deliberately split into two segments**: first zoom the coordinate viewport to the standardized scale, then fix the viewport and apply a Y-axis scaling to the data; the `equal` flag is never toggled, avoiding a whole-figure flash. The Z₁ axis uses symmetric ±8 with a tick interval of about 2, with ticks on both the negative and positive sides; curves and the failure domain are drawn beyond the window and then clipped, so in each viewport the curves are continuous and fill the window, not stopping at the data endpoints. From the second step on, the **β iso-probability ellipse/circle** and its **FORM tangent line at the tangent point x*** are also drawn. The X/Y zero axes and ticks are also made thicker. `?transplay=1` can auto-play. In the "Transformation" card on the right, the whitening formulation can be switched between `Cholesky / PCA`.
- The two whitening choices differ only by an orthogonal rotation: β and Pf are unchanged, while the coordinates of the design point in U space differ (compare with the formula card).
- Dashed ellipses/circles are the iso-probability ellipse / equal-β circle for r=1, 2, 3; the red star is the design point.

**Station 2 · Probability interference**

- The four sliders on the right (mean of R, mean of S, standard deviation of R, standard deviation of S) affect this station only; the main-example parameter card is hidden on this station.
- Three figures: ① density overlap, with h(s)=f_S·F_R sharing **the same absolute density axis** as f_R/f_S (h(s) values are small but keep their true proportions; use figure ② to zoom in) ② failure probability density h(s) (area = Pf) ③ safety margin g=R−S; the orange overlap area is not Pf.
- The "form sensitivity" table below: R−S and R/S−1 have the same zero set, MVFOSM's β is 3.000 / 2.080 in both forms, and FORM is 3.000 in both.

**Station 3 · Mean-value first-order second-moment**

- Left figure, X space: tangent at the mean point (with default parameters X₂ = 10X₁ − 50); right figure, U space: the foot U_L of the perpendicular from the origin to the tangent line.
- The "form sensitivity" card explains that the same failure surface written differently changes β; "where the error comes from" gives the Pf error relative to the exact value (MVFOSM +196.1%).

**Station 4 · Advanced first-order second-moment (AFOSM)**

- `◀` `▶` single step, `Play` continuous playback, `Back to start` reset; clicking any row of the iteration table replays that step.
- **Entering this station for the first time auto-plays once** (also when the page opens directly on this station; about 0.7 s per step, stopping after convergence). For manual control, click `Play`/`‖` to pause.
- With default parameters it converges in 6 steps: the first jump (step 1, β≈2.145) overshoots, then it converges near 2.108; there is an AFOSM vs FORM comparison on the right.

**Station 5 · FORM / HLRF**

- `◀` `▶` / `Play` play iteration by iteration (about 0.7 s per step); **entering this station for the first time auto-plays once**. With default parameters the iteration table has 7 rows: k=0 is the mean point, k=1…6 are the 6 iterations (more when ρ is large).
- Click a row of the iteration table to replay it; the α² bar chart shows variance contributions of about 83.6% for X₁ and 16.4% for X₂.
- Two small figures below: β_k convergence curve, and |g(U_k)| residual (log axis).

**Station 6 · SORM**

- Metric cards: principal curvature κ≈0.0612, βκ≈0.129, correction factor 0.941, Pf (SORM).
- Two checkboxes: `Curvature illustration ×3` only magnifies the drawing and does not affect the computation; `Show osculating circle` only adds an illustration.
- The Pf comparison bars below also give the relative errors of FORM, SORM, and the exact value (FORM +7.9%, SORM +1.5%).

**Station 7 · Monte Carlo**

- Sampling controls: `Reset` (zero out), `[1000] per batch` (changeable 100–20000), `Draw one batch` (add one batch), `Target N [100000]` (changeable 1000–100000), `Resample to N` (zero out and then sample to the target, fixed seed and reproducible), `Continuous sampling` (about 95 ms, adding the "per batch" amount).
- **Entering this station for the first time starts continuous sampling automatically**, stopping automatically at 100k; click `Pause` to stop, `Reset` to zero out. To keep it blank when opening, add `&auto=0` to the URL.
- The sample cloud can switch between `X` / `U` space; red points are failed samples with g<0.
- The metric cards show N, number of failures, Pf, COV, 95% CI; the curve below is the running estimate with its 95% CI band, with the exact value and FORM reference lines drawn.
- The random seed is fixed at `20261119` and is used only for **Monte Carlo sampling** (MC on stations 7 and 10): the same sequence of operations reproduces the same sample sequence. Deterministic computations such as FORM/SORM/MVFOSM/exact integration/interference/transformation use no random numbers and are unaffected by the seed.

**Station 8 · Formulas and code**

- 7 formula groups: basics and conversion, space transformation, mean-value first-order second-moment, advanced first-order second-moment, FORM/HLRF, SORM/Breitung, simulation and interference.
- Also: the method comparison table for the current parameters (including Pf relative errors), the β↔Pf conversion table, and 7 algorithm pseudocode buttons (the same content as the top-right buttons on the method stations).
- The "Print formula card" button at the top right of station 8 still prints here; see section 7 for details.

**Station 9 · Combined figure and tangent error**

- The left figure overlays the MVFOSM tangent (orange), the AFOSM=FORM tangent (red), the SORM second-order curve (green), and the limit-state surface in one figure; `X / Y / Z / U` at the top right switches the space, and iso-probability ellipses (circles in U space) are drawn along with the space; the color bar below gives each method's β/Pf at the same time. The limit-state surface/failure domain is drawn beyond the window and then clipped, so the U-space figure is not cut off at the data endpoints.
- The left figure now uses a **fixed 1:1 view**: a square window of `0–22` in X space (equal unit length on both axes), and a square window centered on the design point β in U space; the canvas is square, so the line from the origin can be judged directly by eye. The "adaptive / 1:1" switch has been removed; station 9 opens directly in the equal-scale view.
- The figure supports **free zoom/pan**: wheel zoom (centered on the mouse position), drag to pan, double-click to reset; `−` / `＋` / `⟲` at the top right also zoom out/in/reset. When switching spaces the view automatically returns to that space's baseline range.
- Next to each method point, **β = distance to the origin (circle center)** is labeled: MVFOSM's U_L is labeled `β_M=1.664`, the AFOSM/FORM design point is labeled `β=2.108`, and the SORM point (same design point) is labeled `β=2.108`. With the fixed 1:1 view, visual distances match the common scale.
- MVFOSM's linearized `g=0` boundary **does not pass through the mean point** (g=60 at the mean); the light orange dashed line is the parallel tangent through μ, and the two differ by `g/‖∇g‖`; both are labeled on the figure so that the "mean point" is not mistaken for a point on the boundary.
- The right figure is the tangent-error case: at the same design point β, compare linear / convex / concave / outside-circle failure domains; drag the `β` and `κ` sliders, click the four failure-domain buttons to switch the shading; **the selected curve is highlighted and the others are faded**, and the table highlights the current row accordingly. Boundary and failure-domain fills are drawn beyond the window and then clipped, so no break appears inside the window at `U₂≈±4.5`.
- Defaults β=2.108, κ=0.5: linear 1.752%, convex 1.154% (−34.1%), concave 4.193% (+139.4%), outside circle (extreme) 10.841% (+518.9%, equivalent β 1.235). The outside-circle case is exactly "the failure domain is outside the density contour", showing that `Pf=Φ(−β)` is strictly valid only for a half-space.

**Station 10 · Custom function lab**

- Enter a two-variable function in the **`g =`** input box, e.g. `x1^2 - 2*x2`, `x1 + x2 - 30`, `20 - sqrt(x1^2 + x2^2)`; `+ − * / ^`, parentheses, `sin/cos/exp/log/sqrt/abs/min/max`, etc. are supported. Press Enter or click **`Compute`** to apply; below it "parabola/linear/outside-circle/product/sine/multiple failure regions" are quick examples. `Sine` uses `sin(x1) + x2 - 19` (only one failure region, convenient for discussing a single design point); `Multiple failure regions` uses `sin(x1) + 2cos(x2) + 1`, which has several disconnected failure domains, used to demonstrate the limitation of single-design-point FORM/SORM. The page counts the connected components of the failure region and warns "multiple failure regions: FORM/SORM take only one design point, use MC as reference"; if the function is always positive or always negative within the viewport, it explicitly reports "no g=0".
- **Data positions**: the five sliders μ₁, μ₂, σ₁, σ₂, ρ directly change the normal distribution; changes are recomputed automatically. `σ` must be greater than 0.
- **Method selection**: MVFOSM / FORM(AFOSM) / SORM / MC can be checked; FORM and AFOSM are the same design point in normal space; MC uses 100k samples each time and gives the 95% CI.
- The left canvas draws **the g=0 curve, failure domain, β iso-probability ellipse, MVFOSM tangent and FORM tangent, mean point/design point/MVFOSM foot** on the fly; the result table on the right gives β, Pf, and notes.
- An arbitrary function has no "exact analytical value"; FORM/SORM are approximations and MC is the reference. When the function is discontinuous, singular, or non-smooth, treat the results as a method demonstration, not as a guarantee.
- A given function can be opened directly with `?station=10&fn=x1%5E2%20-...` in the URL; the `C` key jumps to this station.

---

## 4. Right result panel and parameters

### 4.1 Result card

The result card shows **β, Pf, reliability** and a one-line note for the method corresponding to the current station. Different stations show different methods:

| Station | Result-card method | Notes |
|---|---|---|
| 0, 1 | FORM | By default shows the design-point method result for the current parameters |
| 2 | R − S analytical | Uses station 2's own R, S parameters; linear g, independent normal, Pf=Φ(−β) is exact |
| 3 | MVFOSM | The note says "in this example Pf is 196% above the exact value" |
| 4 | AFOSM | Note "directional search in X space; same design point as FORM (≡)" |
| 5 | FORM | The note gives the number of iterations to convergence for the current parameters |
| 6 | SORM | β follows FORM; Pf uses the curvature correction |
| 7 | MC | Shows N and the 95% CI of this sampling run; when no sampling has been done, gives the exact reference |
| 8 | Exact integration | β shows the FORM design-point β; Pf is the exact value |
| 9 | Tangent error | Shows the case's β and the outside-circle extreme Pf; the four failure domains are detailed in the stage table |

β and Pf are displayed to **3 decimal places** in the result card (e.g. β=2.108, Pf=1.750%).

### 4.2 Main example parameters (5 sliders)

| Parameter | Meaning | Default | Range | Step |
|---|---|---|---|---|
| μ₁ | mean of X₁ | 10 | 5 – 15 | 0.1 |
| μ₂ | mean of X₂ | 20 | 10 – 30 | 0.1 |
| σ₁ | standard deviation of X₁ | 2 | 1 – 4 | 0.05 |
| σ₂ | standard deviation of X₂ | 5 | 2 – 8 | 0.1 |
| ρ₁₂ | correlation coefficient | 0.5 | −0.8 – 0.9 | 0.01 |

Changing any slider recomputes immediately:

- β, Pf, reliability, the method comparison table, and the formula-card comparison table on the right update synchronously;
- The step indices of stations 4/5 automatically return to the **converged step** (not step 0);
- Station 7's MC samples are zeroed and need to be resampled;
- Station 3's error bars and station 6's κ/factor, etc., are redrawn for the new parameters when entering the corresponding station.

Station 2 uses its own R/S parameters; the main parameter card and the comparison card are hidden on stations 2 and 8.

### 4.3 Station 2's R/S parameters (4 sliders)

| Parameter | Meaning | Default | Range | Step |
|---|---|---|---|---|
| μ_R | mean of R | 30 | 20 – 40 | 0.1 |
| μ_S | mean of S | 15 | 5 – 25 | 0.1 |
| σ_R | standard deviation of R | 4 | 1 – 8 | 0.05 |
| σ_S | standard deviation of S | 3 | 1 – 8 | 0.05 |

With default parameters: β=3.000, Pf=0.135% for R−S; MVFOSM β=2.080, FORM still 3.000 for R/S−1.

### 4.4 Method comparison table

Fixed 6 rows: MVFOSM, AFOSM, FORM, SORM, MC, exact.

- With default parameters the MC row shows the 1.628% of "reference N=4×10⁶" (the offline reference value, not on-page sampling).
- After changing parameters, the MC row shows "station 7" or the N and Pf of this sampling; the β column shows "—" for MC and exact.
- The note below the table emphasizes: AFOSM and FORM are the same design point under normal variables (≡); SORM keeps β unchanged and only corrects Pf.

### 4.5 Teaching notes

Each station has 3 teaching notes (for example station 5 notes "under default parameters X₁ accounts for 83.6% of α²"). Click the "Teaching notes" heading to collapse/expand.

### 4.6 Small screens and phones

- **≤1024 px**: the right result panel (result card, parameters, comparison table, teaching notes) is hidden, leaving only the stage and the left navigation;
- **≤760 px, or touch devices with landscape height ≤500 px**: automatically switch to the **phone layout**:
  - the top bar is compressed to just the brand and `Reset`;
  - the left navigation becomes a **horizontally scrollable station bar**, with the current station automatically scrolled to the middle;
  - the overview cards and station layouts become **single-column**;
  - canvas width 100%, and station 9's 1:1 figure stays square but scales to the screen width;
  - tables can scroll horizontally; function input/sliders stay below the canvas;
  - Canvas font sizes are slightly larger (×1.05) and touch buttons are larger.
- On desktop/projector widths above 760 px the original desktop layout is kept; **no separate file is needed**.
- Phone limitations: keyboard operations such as `Space` and `?` are unavailable; for help use the URL `?selftest=1` or a desktop; station 9 zooming uses the `−/＋` buttons and dragging, without relying on a mouse wheel; previewing HTML directly inside WeChat may disable JS, so download it and open it in a browser.

---

## 5. Keyboard shortcuts

| Key | Action | Scope / notes |
|---|---|---|
| `←` / `→` | Previous / next station | Stops at station 0 / 10 |
| `0`–`9` | Jump directly to the corresponding station | For station 10 press `C` |
| `C` | Open the custom function lab | Jumps to station 10 |
| `Space` | Play / pause | **Only stations 4, 5, 7**; no action on other stations |
| `S` | Single step | **Only stations 4, 5, 7**: AFOSM / HLRF takes one step, MC adds 1000 samples |
| `R` | Reset | Restores main parameters, R/S parameters, transformation step and formulation, SORM checkboxes, and MC sampling to defaults, and returns to station 0 |
| `F` | Toggle full screen | The browser may refuse; when refused the page silently ignores it |
| `?` | Open help | Help also has a "Run numerical self-test" button |

Note: when focus is on an input control such as a slider, shortcuts are ignored (the browser gives the key to the control); click a blank area of the page and press again.

---

## 6. Code drawer

- Stations 1–7 all have a `View pseudocode` button at the top right; station 0's button is `Algorithm map`.
- The drawer has two tabs: **Pseudocode** and **JS implementation**; "Algorithm map" has only the pseudocode tab (the JS tab is hidden automatically).
- `Copy` at the top right copies the content of the current tab to the clipboard; `×`, `Esc`, or clicking the overlay closes it.
- The code matches the actual page computation (there is explanatory text at the bottom of the drawer).

---

## 7. Formula card and printing

- The formula card is on **station 8**: 7 groups, 24 formulas in total (each with a one-line "assumption / pitfall"), the method comparison table for the current parameters, the β↔Pf conversion table, and 7 pseudocode buttons.
- There are two print entries:
  - `Print formula card` at the top right of station 8: invokes printing directly.
- Print layout: **A4, 12 mm margins**; only station 8 is kept, and the top bar, left navigation, right result panel, bottom status bar, dialogs, station buttons, and the "algorithm pseudocode" section are hidden.
- Measured on this machine (Chrome 157, Windows, headers/footers off): **3 A4 pages**. The requirements specification v0.9 once said "within two pages", but with 24 formulas + two tables, 3 pages were measured for readability; **3 pages is authoritative** (requirements specification v1.0, supplementary item 8, notes this). Different browsers/fonts/zoom may differ slightly; rely on the print preview; keep the zoom at "Default".
- To keep an electronic copy: choose "Save as PDF" in the browser print dialog (a built-in browser feature).

---

## 8. Numerical self-test

All numbers on the page are computed on the fly by JS. There are three ways to check:

| Method | Operation | What you see |
|---|---|---|
| Page entry | Press `?` to open help → `Run numerical self-test` | PASS/FAIL item by item, last line "20 / 20 passed" |
| URL parameter | Add `?selftest=1` when opening the page | Opens the help dialog automatically and runs the self-test |
| Command line | `node tests/test_math.js` | Prints the main values and `20/20 passed` |

- The self-test has **20 items**, covering Φ, Cholesky, MVFOSM, HLRF's β/u*/x*, β invariance under PCA, SORM's κ and Pf, the exact value, R−S, R/S−1, and the ratio form of the main example.
- The current implementation **passes 20/20** (verified via both the page and the Node path).
- After `?selftest=1` runs, in Chrome/Edge the `selftest` is removed from the address bar, so a refresh does not run it again automatically; if the browser forbids rewriting the address bar, a refresh may run the self-test again.
- If an item FAILs: do not use this page's numbers in class yet; follow the hints in "Help" or re-run `node tests/test_math.js`.

---

## 9. URL parameters: reproduce a scene

Append query parameters to the page address. The page **reads them once at load time**; sliders can still be changed afterwards.

| Parameter | Meaning | Values and rules |
|---|---|---|
| `station` | Station | 0–10; out-of-range values are clamped into range; default 0 |
| `trans` | Transformation step on station 1 | 0–3, corresponding to 1/4–4/4; clamped |
| `transplay` | Auto-play station 1's 4-step transformation after loading | Only `1` is recognized (`?station=1&transplay=1`) |
| `hlr` | Station 5 stops at which HLRF step | 0–6 with default parameters; clamped to the current history length |
| `af` | Station 4 stops at which AFOSM step | 0–5 with default parameters; clamped |
| `mc` | How many MC samples to draw first after loading | Positive integer; the page draws at most **100000**; values above are treated as 100k |
| `mode` | Whitening formulation | `chol` or `pca`; other values ignored |
| `projector` | Projector mode | `1` on, `0` off; the top-bar button has been removed, use the URL |
| `auto` | Whether first entry into stations 4/5/7 auto-plays the demo | `0` disables; enabled by default (automatically disabled when `af`/`hlr` is given explicitly, to avoid overriding the shared step) |
| `allspace` | Station 9 combined-figure space | `x` / `y` / `z` / `u`; also jumps to station 9 |
| `fn` | Initial function expression for station 10 | A URL-encoded string, e.g. `?station=10&fn=x1%5E2-2*x2` |
| `code` | Open the code drawer after loading | `overview`, `transform`, `interference`, `mvfosm`, `afosm`, `form`, `sorm`, `mc` |
| `selftest` | Run the numerical self-test after loading | Only `1` is recognized (`?selftest=1`) |
| `mu1` `mu2` `s1` `s2` `rho` | Main example parameters | Values outside the slider range are clamped; defaults 10 / 20 / 2 / 5 / 0.5 |
| `muR` `muS` `sR` `sS` | Station 2's R/S parameters | Ranges 20–40 / 5–25 / 1–8 / 1–8; defaults 30 / 15 / 4 / 3 |

Common examples (replace the filename with the actual path):

| To reproduce | URL |
|---|---|
| Stop at HLRF step 3 | `structural-reliability-lab.html?station=5&hlr=3` |
| AFOSM back to the start | `structural-reliability-lab.html?station=4&af=0` |
| Last transformation step + PCA formulation | `structural-reliability-lab.html?station=1&trans=3&mode=pca` |
| Open projector mode | `structural-reliability-lab.html?projector=1` |
| Draw 50k samples on load | `structural-reliability-lab.html?station=7&mc=50000` |
| Use another set of R/S parameters | `structural-reliability-lab.html?station=2&muR=32&muS=14&sR=5&sS=4` |
| Open the SORM code drawer | `structural-reliability-lab.html?station=8&code=sorm` |
| Combined figure + tangent-error case | `structural-reliability-lab.html?station=9` |
| Combined figure switched directly to U space | `structural-reliability-lab.html?allspace=u` |
| One-click self-test | `structural-reliability-lab.html?selftest=1` |

Additional notes:

- When switching stations the page writes `station` back to the address bar (to make sharing "which station it stops at" easy); parameter slider changes are **not** written back to the URL automatically, so to share a parameter configuration you need to assemble the parameters manually.
- Under `file://`, if the browser forbids rewriting the address bar, rely on what the page actually displays.

---

## 10. Build and source layout

```
structural-reliability-lab/
├─ structural-reliability-lab.html        # build artifact (root copy, double-click to open)
├─ dist/structural-reliability-lab.html   # build artifact copy
├─ src/
│  ├─ index.html                    # page structure template
│  ├─ styles.css                    # all styles (including @media print)
│  └─ js/
│     ├─ math.js                    # Φ, 2×2 linear algebra, random numbers, formatting
│     ├─ model.js                   # numerical kernel (five methods + exact integration + self-test)
│     ├─ charts.js                  # Canvas drawing
│     ├─ ui.js                      # sliders, tables, code drawer, result panel
│     ├─ pseudocode.js              # pseudocode / JS snippets
│     ├─ formulas.js                # embedded SVG formulas (auto-generated)
│     ├─ custom.js                  # station 10: expression parser + custom function computation
│     ├─ stations.js                # behavior and animation of the 11 stations
│     └─ app.js                     # state, navigation, parameters, shortcuts, URL, startup
├─ code/                            # module-by-module reference code + verify.js (39 checks)
├─ tests/test_math.js               # Node numerical tests (20 checks)
├─ reference_values.py              # Python baseline (offline reference values)
├─ tools/
│  ├─ build.py                      # inline src/ into a single HTML file
│  ├─ formulas.json                 # TeX source of the formulas
│  └─ gen_formulas.cjs              # generate src/js/formulas.js
└─ docs/                            # user guide, formula notes, verification report, reference values, lecture script
```

Frequently used commands:

| Purpose | Command |
|---|---|
| Rebuild the single file | `python tools/build.py` (outputs to `dist/`, and copies one to the repository root) |
| Run numerical tests | `node tests/test_math.js` |
| Regenerate all reference values | `python reference_values.py` (requires Python 3 + numpy; runs a 4×10⁶-sample MC, somewhat slow) |
| Regenerate formula SVGs | `node tools/gen_formulas.cjs` (the build-time dependency is MathJax in `_tmp/mathjax/`, with no runtime dependency) |
| Page self-test | Open `?selftest=1` in the browser, or press `?` to open help and run the self-test |

Local verification environment: Chrome 157 (Windows), Node.js v24.19.0, Python 3.11.15 + numpy 2.4.6.

---

## 11. Known limitations (features not on the page)

- The main example supports only **2 random variables, normal distribution** (X₁, X₂ correlated or independent); station 2's R/S also supports only independent normals.
- Only two built-in examples: the parabola `g=X₁²−2X₂` and R−S interference; **an arbitrary g(x) cannot be entered**, and non-normal variables, equivalent normalization, and subset simulation are not supported.
- Importance sampling (IS) appears only in `reference_values.py` as a numerical comparison; **the page has no IS feature**.
- The page's MC limit is **100k** samples (for performance); the 1.628% of 4×10⁶ is the offline reference, and the "method comparison" table cites it under default parameters, but 4M cannot be sampled live on the page.
- The page's MC seed is fixed at `20261119`; the sampling sequence is the same after every reset/refresh, and changing the seed requires editing the source code.
- AFOSM and FORM are **the same design point** under normal variables, with identical β/Pf; do not treat them as two independent methods. SORM follows FORM's design point and only corrects Pf.
- The page displays β to 3 decimal places; Pf is usually also 3 decimal places (the "method comparison" table defaults to 2, but still 3 when less than 1%); the page computes Φ with the A&S approximation, and the difference from the Python baseline is on the order of 10⁻⁷, **identical at 3-decimal display**.
- The right result panel is hidden when the window is smaller than 1024 px; `F` full screen may be refused by browser policy.

---

## 12. 45-minute class route

The route entry in the top bar has been removed; the route below is kept as a lecture reference. You can click the left column or press number keys to jump to the corresponding station. The default route is as follows (45 minutes total):

| Order | Station | Minutes | What this segment covers |
|---|---|---|---|
| 1 | 0 Overview | 3 | First reveal several answers (4.80 / 1.75 / 1.65 / 1.63 / 1.62%), creating the question |
| 2 | 1 Variables and transformations | 6 | Step-by-step X→U transformation; β is the distance to the origin |
| 3 | 3 MVFOSM | 7 | Tangent at the mean point; β changes when the form changes |
| 4 | 4 AFOSM | 5 | Directional search in X space; same design point as FORM |
| 5 | 5 FORM / HLRF | 8 | 6 iterations; α² contributions |
| 6 | 6 SORM | 5 | Curvature correction: 1.750%→1.647% |
| 7 | 7 Monte Carlo | 5 | Sampling and CI, validating FORM |
| 8 | 2 Probability interference | 4 | Overlap ≠ Pf; form-sensitivity comparison |
| 9 | 8 Formulas and code | 2 | Formula-card wrap-up, assign after-class reading |

Timings are written in the `ROUTE` in `src/js/app.js`; adjust them to your own class pace (requires editing the source and rebuilding).

