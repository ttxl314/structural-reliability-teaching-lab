# Structural Reliability Method Comparison Lab · Requirements Specification (Review Draft)

> Version v0.9 · 2026-11-19
> Companion baseline script: `reference_values.py` (working; see §4 and Appendix A for the numbers)
> Please focus on: **§3 Scope, §5 Page, §12 Open questions**
>
> **v1.0 addendum (2026-11-19, per your additional requirements)**
> 1. Added a "step-by-step spatial transformation demo": X → centering → standardization → whitening, with formulas and graphics synchronized at each step.
> 2. Added a "probability interference" station: R−S density overlap, the failure integral, the R−S margin distribution; plus the small R−S vs R/S−1 form-sensitivity example.
> 3. Added "advanced first-order second-moment (AFOSM / design-point method)" to the algorithm comparison and taught it separately from FORM: AFOSM performs directional search in X space, FORM performs tangent–foot-of-perpendicular in U space; for normal variables they share the same design point and the same β/Pf, marked "≡" on the page.
> 4. Each method station has a "pseudocode / typical code" drawer; the code follows the real algorithm logic and the comments are in Chinese for readability.
> 5. The number of stations is adjusted from 7 to 9: 0 Overview, 1 Variables and step-by-step transformation, 2 Probability interference, 3 Mean-value first-order second-moment, 4 Advanced first-order second-moment, 5 FORM, 6 SORM, 7 Monte Carlo, 8 Formulas and code card; later Station 9 (overlay and tangent error: all methods on one figure, β→Pf comparison for linear/convex/concave/outside-circle failure) was added.
> 6. Delivery follows "take the time to do it well, no rush", with no hard 11/24 deadline; ensure numerics, interaction and readability first.
> 7. Unified notation: on this page α is defined as the direction cosines **pointing to the design point**, `α = −∇g(u*)/‖∇g(u*)‖`, hence `u* = β α` and `x* = μ + β L α`. Many textbooks define α along the gradient and write `x* = μ − β α σ`; the sign is opposite but the essence is the same; the page notes this on the formula card.
> 8. **Implementation status (evening of 2026-11-20)**: the page has been implemented with 11 stations, 0–10; §5–§7 keep the v0.9 7-station numbering as the requirements record, and **the current functionality is defined by `docs/user_guide.md` and the page**. The 1/2/3σ toggle, dragging the mean, run-all, curve thickness, curvature ×1/×2/×5, IS and PNG export listed in §5.3 are P1/P2 and not all implemented. Numerical values follow `docs/benchmark_values.md` (SORM factor 0.941146; the page shows 0.941); the g2 convention has been changed to R−S vs R/S−1. Printing measures **A4 three pages** (24 formulas + two tables; for readability the v0.9 "within two pages" criterion is no longer used for acceptance); a "Projector" mode was added to the top bar (page and canvas font sizes about ×1.4); AFOSM falls back to FORM and annotates it when the directional search does not cross the boundary, and a warning is shown at the top when the mean point has `g(μ)≤0` — these two are the current delivery conventions. Also, per the 23:50 supplement and later adjustments: the MC station gained "batch size / target N / Resample to N" controls; the probability-interference chart overlays the failure probability density `h(s)=f_S·F_R` on **the same absolute density axis as f_R/f_S**, and makes clear that its integral is Pf (chart ② keeps the magnified coordinates); unified method colours across the page (MVFOSM orange, AFOSM blue, FORM red, SORM green, MC purple, exact grey), with each method's tangent also in its method colour; Station 1 has 1.05 s affine-matrix interpolation animations between the 1/4–4/4 steps (whitening step 1.25 s, standardization step 1.4 s; 2/4→3/4 first scales the viewport and then scales Y without toggling the equal flag), draws the equal-β ellipse/circle and the tangent at the tangent point, has the Z₁ axis symmetric at ±8 with a tick interval of about 2, bolder X/Y zero axes, and failure-domain fills that create no artificial boundaries, and provides "Play"/`?transplay=1`; new Station 9: all methods on one figure (X/Y/Z/U four spaces, fixed 1:1 square window, mouse-wheel zoom/drag to pan/double-click to reset, equal-probability ellipses/circles, β distance labelled next to each method point, MVFOSM g=0 and the parallel line through μ annotated separately) + β→Pf error cases for linear/convex/concave/outside-circle failure domains (including β/κ sliders, selection highlighting and the extreme outside-circle case); new Station 10: enter a custom g(x₁,x₂) and compute MVFOSM/FORM/SORM/MC on the fly under 2-variable normal + correlation, draw g=0/the failure domain/the tangents/the design point, show β/Pf, and support μ/σ/ρ sliders and `fn=` URLs. The limit state curves and failure domains of Stations 1/9 are extended beyond the viewport and then clipped, so the curves fill the window; the probability-interference chart's h(s) shares the same absolute density axis as f_R/f_S. Entering Stations 4/5 for the first time auto-plays once, and Station 7 auto-samples continuously; `?auto=0` disables this. Only "Reset" is kept in the top bar; the route/projector/help/print buttons were removed; formulas are organised by module in `docs/formulas_by_module.md`, reference code is in `code/`, and independent verification is in `docs/verification_report.md` (39/39).

---

## 0. One-page overview

**What**: a **single-file, offline, double-click-to-open** HTML teaching page. Around the main example

```
g(X) = X1² − 2X2
X1 ~ N(10, 2),  X2 ~ N(20, 5),  ρ12 = 0.5
```

it puts **the mean-point method (MVFOSM / center-point method) → the design-point method (FORM / HLRF) → the second-order method (SORM / Breitung) → Monte Carlo (MC)** into one set of linked views: X space on the left, U space on the right, the iteration table / convergence chart below, and results and formulas on the right. Change one parameter and several methods' results change at the same time; press "single step" and HLRF's tangent, foot of the perpendicular and design point grow out step by step.

**Why**: over the past two days there were already 8 figures (U space, β distance, Cholesky/PCA, linearization error, form sensitivity, HLRF, effect of ρ, half-space vs circle), each explaining one point, but all static and separate. In class, switching methods meant flipping pages, and changing parameters showed no linkage; students found it hard to connect "different β/Pf for the same problem" with "different algorithms". This page strings them into one **lab bench**: not a replacement for PPT, but a demo that can be switched into at any time within the PPT.

**Audience**: JCSS 2026 / graduate students / engineers' classrooms; the instructor operates the projected screen and students watch the large display; also suitable for self-study after class.

**Key numbers (independently recomputed with Python)**:

| Method | β | Pf | Reliability 1−Pf | Notes |
|---|---:|---:|---:|---|
| MVFOSM | 1.664 | 4.805% | 95.195% | mean-point tangent |
| FORM | 2.108 | 1.750% | 98.250% | HLRF 6 steps |
| SORM | 2.108 | 1.647% | 98.353% | Breitung curvature correction |
| MC (4×10⁶) | — | 1.628% ± 0.006% | 98.372% | 95% CI ±0.012% |
| Exact (1-D integration) | — | 1.623% | 98.377% | baseline |

**Form**: single-file HTML (about 0.5–1 MB), no backend, no CDN, no network requests; double-click in Chrome / Edge; no scrolling at 1920×1080 projection.

**Decisions needed from you**: ① whether to use it for the 11/24 9:15 session; ② method scope; ③ whether to build a single-file HTML; ④ whether to use this main example; ⑤ whether to change the g2 convention in the existing `mvfosm_two_forms_comparison.png` (see Appendix C).

---

## 1. Project history: what line do these 8 figures tell

| # | Existing file | Concept explained | Position in the new page |
|---|---|---|---|
| 1 | `why_u_space_ellipse_circle.png` | why go to U space: skewed ellipse → concentric circles | Station 1 |
| 2 | `u_space_norm_distance.png` | β is the minimum norm / nearest distance | Stations 1, 3 |
| 3 | `cholesky_vs_pca_u_space.png` | Cholesky and PCA differ only by a rotation | Station 1 |
| 4 | `form_linearization_error.png` | mean-point tangent vs design-point tangent | Stations 2, 3 |
| 5 | `mvfosm_two_forms_comparison.png` | "same failure surface, different forms, β changes" | Station 2 (needs verification, see Appendix C) |
| 6 | `hlrf_demo.png` | HLRF: tangent → foot → convergence | Station 3 |
| 7 | `correlation_effect_form.png` | effect of ρ on β and the design point | Stations 1, 3 |
| 8 | `halfspace_vs_circle.png` | same β, different boundary shape, different Pf | Stations 4, 6 (thought question) |

**Three upgrades**:

1. **Static → linked**: sliders / single-step / animation, X and U on the same screen, so changing parameters immediately shows both sides changing together.
2. **Single method → same-problem comparison**: four methods share one problem, one parameter set and one table, so the differences are visible at a glance.
3. **Preset numbers → recomputable**: the page computes HLRF, curvature and MC itself, rather than showing images; numbers can be changed and verified on the spot.

---

## 2. Teaching goals and 45-minute pacing

**Students will be able to answer**:

- Why must β be defined in U space? Why does "nearest" equal "most likely to fail"?
- What assumptions do the mean-point method, the design-point method, the second-order method and Monte Carlo each make? Where does the error come from?
- Why does β change for the same failure surface when the algebraic form changes? Which method is invariant?
- When β=2.108, why can Pf be 1.75% or 10.83%? (half-space vs circle)
- When must simulation be used? How is the simulation error estimated?

**Three-sentence summary** (end of the page):

1. Go to U space: turn "most likely to fail" into "nearest to the origin".
2. FORM: linearize at the most likely failure point (design point); β is the nearest distance, Pf ≈ Φ(−β).
3. Errors come from linearization and boundary shape: SORM adds a curvature correction, MC uses large samples as the baseline; MVFOSM's β changes with the form of g, FORM does not.

**Suggested 45-minute pacing**:

| Time | Station | Instructor action | What students see |
|---|---|---|---|
| 0–3 min | 0 Overview | give five numbers first: 4.80 / 1.75 / 1.65 / 1.62% | same problem, answers differ 3× |
| 3–10 | 1 Variables and U space | drag ρ, switch Cholesky/PCA | ellipse → circle, β = distance |
| 10–18 | 2 Mean-point method | show the mean-point tangent; change the form of g | β changes from 1.664 to 1.714 / 2.080 |
| 18–30 | 3 FORM / HLRF | single-step 6 times; point at α | tangent → foot → design point |
| 30–36 | 4 SORM | magnify the curvature; compare 1.750 → 1.647 | curvature correction is small but effective |
| 36–42 | 5 MC | sample 100k points; look at the CI | 1.628% ± 0.012%, validates FORM |
| 42–45 | 6 Formula card | wrap up with the three sentences | one page of formulas + comparison table |

> If this session is only 45 minutes, it is recommended that **Stations 0–4 are essential, Station 5 is a quick demo, and Station 6 is left for after class**; the page supports jumping directly between stations, so it stays coherent even out of order.

---

## 3. Scope

### 3.1 In scope (v1)

- **One main example** throughout the page: `g = X1² − 2X2`, `N(10,2)`, `N(20,5)`, `ρ=0.5`; parameters adjustable.
- **Four methods**: MVFOSM, FORM (HLRF single-step/play), SORM (Breitung), MC; plus an "exact value" baseline line.
- **Form-sensitivity small example**: `R−S` vs `R/S−1` (same failure surface, MVFOSM 3.000 vs 2.080, FORM 3.000 for both).
- **Linked dual views**: X space and U space on the same screen; equal-probability ellipses/circles, limit state surface, design point, tangent and sample cloud linked together.
- **Single-step and animation**: HLRF iteration can be single-stepped, replayed and speed-adjusted; MC samples in batches, with running estimate + 95% CI.
- **Same-problem comparison table**: method, assumptions, β, Pf, reliability, computational cost, error source — all on one screen.
- **Formula card**: grouped formulas + symbol notes + assumptions/pitfalls + β↔Pf conversion table; printable.
- **Classroom features**: large fonts, shortcuts, full screen, reset, teaching-notes drawer, one-click demo presets.
- **Offline single file**: no network requests, can be carried on a USB stick; `?selftest=1` numerical self-test.

### 3.2 Out of scope (v1)

| Not doing | Reason | Do later? |
|---|---|---|
| Arbitrary `g(x)` text input | Parsing, differentiation and domains are all error-prone; parameterized presets are enough for class | Can add in v2 (numerical differentiation + safe expression parsing) |
| Non-normal / R-F equivalent normalization | The focus of this section is FORM/SORM geometry; non-normal is covered on the "probabilistic modeling" day | Can add in v2 |
| Subset simulation / response surface / surrogate models | There is a separate course; this page only does "baseline comparison" | Not on this page |
| More than 2 dimensions / system reliability | 2-D figures explain the geometry clearly; 3-D projections are actually harder to understand | Not on this page |
| Cloud / multi-user collaboration / accounts | Single-machine classroom demo; not needed | Not needed |

### 3.3 About "should we build a piece of software"

You mentioned "if a standalone HTML is hard to handle, build a piece of software and display it with HTML". My judgement is: **this problem does not need a backend, and a single-file HTML is actually better for the classroom**.

- This problem is 2-D, normal, with analytical g; one HLRF run takes less than 1 ms, and 100k MC runs take about a few tens of ms in the browser, so it is entirely computable.
- Single-file HTML: no Python installation, no server, no fear of network loss, no fear of classroom computer permission restrictions; double-click to open, copy onto a USB stick and it works.
- Only two situations need "software + backend": ① entering an arbitrary g(x) live in class; ② computing more than 3 dimensions / non-normal / subset simulation. These two can go into v2, using the same frontend plus a Python computation service, without affecting v1.
- So for v1 I recommend building **a single-file HTML**; in terms of experience it is already a small piece of software, just without an installer.

---

## 4. Main example and baseline answers

### 4.1 Problem

- Limit state function: `g(X) = X1² − 2X2`
- Limit state surface: `X2 = X1² / 2` (parabola)
- Failure domain: `g < 0`, i.e. `X2 > X1² / 2` (above the parabola)
- Random variables: `X1 ~ N(10, 2)`, `X2 ~ N(20, 5)`, `ρ12 = 0.5`
- Covariance: `C = [[4, 5], [5, 25]]`; Cholesky: `L = [[2, 0], [2.5, √18.75]]`
- Mean point: `μ = (10, 20)`; `g(μ) = 60` (safe)

### 4.2 Baseline table (the single source of truth for all numbers on the page)

| Method | β | Pf | Reliability | Key points / notes |
|---|---:|---:|---:|---|
| MVFOSM (mean-point method) | 1.6641 | 4.8046% | 95.1954% | tangent at the mean point; `U_L=(−1.6154, 0.3997)`, `X_L=(6.7692, 17.6923)` |
| FORM (design-point method) | 2.10834 | 1.75008% | 98.24992% | HLRF 6 steps; `U*=(−1.92808, 0.85299)`, `X*=(6.14384, 18.87337)` |
| SORM (Breitung) | 2.10834 | 1.64708% | 98.35292% | `κ=0.061176`, `βκ=0.128979`, correction factor `0.94122` |
| MC (N=4×10⁶) | — | 1.62803% | 98.37197% | 65,121 failures; `se=0.00633%`; 95% CI ±0.0124% |
| Exact (1-D conditional integration) | — | 1.62263% | 98.37737% | baseline; not a hand calculation for class, only a "truth" reference |
| χ² circle (another boundary shape, comparison only) | 2.10834 | 10.8333% | 89.1667% | `exp(−β²/2)`; shows "same β, different boundary, different Pf" |

> Display convention: β keeps 3 decimals (2.108), the Pf big card keeps 2 decimals (1.75%), tables keep 3 significant figures (1.750%). After rounding, they must match the existing figures: 1.664 / 2.108 / 4.80% / 1.75%.

### 4.3 Key intermediate quantities (numbers that will be asked about in class)

| Quantity | Value | Notes |
|---|---|---|
| `∇g(μ)` | `(20, −2)` | gradient at the mean point |
| `σ_g` | 36.0555 | `√(∇g^T C ∇g)`; the cross term −400 lowers σ_g from √1700=41.23 to 36.06 |
| `U_L` | `(−1.61538, 0.39970)` | foot of the perpendicular of the mean-point tangent; also HLRF step 1 |
| `U*` | `(−1.92808, 0.85299)` | design point; `β=‖U*‖=2.10834` |
| `X*` | `(6.14384, 18.87337)` | `X* = μ + L U*`; `g(X*)≈0` |
| `α` | `(−0.91450, 0.40458)` | direction cosines; `α = U*/β` |
| `α²` | `(0.83631, 0.16369)` | X1 contributes 83.6%, X2 contributes 16.4% |
| `κ` | `0.061176` | principal curvature (only one for n=2); `1/κ≈16.35` |
| `∂β/∂μ1` | `0.57404` | correlated normal: `∇ₓg/‖Lᵀ∇ₓg‖`; equals `−α1/σ1` only when ρ=0 |
| `∂β/∂μ2` | `−0.09343` | same as above; note that the correlated value is not −0.081 |

**ρ sweep (FORM, used by the page sliders)**:

| ρ | −0.5 | 0.0 | 0.3 | 0.5 | 0.8 |
|---|---:|---:|---:|---:|---:|
| β | 1.4952 | 1.7171 | 1.9178 | 2.1083 | 2.6147 |
| Pf | 6.744% | 4.298% | 2.757% | 1.750% | 0.4465% |
| X1* | 7.105 | 6.778 | 6.461 | 6.144 | 5.251 |
| X2* | 25.242 | 22.971 | 20.870 | 18.873 | 13.789 |

### 4.4 Number conventions

- Internally double precision; HLRF convergence `|g|<1e-8`, at most 30 steps; SORM curvature uses the analytical Hessian, cross-checked with finite differences.
- MC uses a fixed seed (default `20261119`), reproducible with the same seed; the page shows N, failure count, COV and the 95% CI.
- Φ in the formulas uses a high-precision normal CDF (aligned with Python `math.erf` to within 1e-8).
- Single source of truth: `reference_values.py`; the page's `?selftest=1` automatically compares all the numbers above and shows a red bar on failure.
- **All "method results" must be computed by the page on the spot** and must not be hard-coded; only the "exact value 1.623%" and the MC reference value may be preset (with their source stated).

---

## 5. Page structure

### 5.1 Wireframe (1920×1080 main design)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ Structural Reliability Lab   Example: g=X1²−2X2 ▾   [Reset] [Help] [Full screen] [Print]      │
├─────────────┬────────────────────────────────────────────────────────────┬────────────────────┤
│             │ X-space view                U-space view                   │ Results            │
│ 0 Overview  │ ┌───────────────────────┐  ┌────────────────────┐          │ β   2.108          │
│ 1 Variables │ │ failure surface /     │  │ circle /           │          │ Pf  1.750%         │
│ 2 Mean point│ │ ellipse / samples     │  │ tangent / point    │          │ R   98.250%        │
│ 3 FORM      │ └───────────────────────┘  └────────────────────┘          │                    │
│ 4 SORM      │ iteration table / β convergence / g residual               │                    │
│ 5 Simulation│ animation control bar                                      │ Method comparison  │
│ 6 Formulas  │                                                            │ Current formulas   │
│             │                                                            │ Teaching notes ▾   │
│             │                                                            │                    │
│             │                                                            │                    │
│             │                                                            │                    │
├─────────────┴────────────────────────────────────────────────────────────┴────────────────────┤
│ Shortcuts: ←/→ station   Space play/pause   S single-step   R reset   F full screen   ? help  │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

> "Station" borrows the lab-bench metaphor: it means one of the 7 switchable pages; the top bar allows jumping at any time, not necessarily in order.

### 5.2 Station list

| Station | One-sentence goal | Main view | Key interactions | Suggested time |
|---|---|---|---|---|
| 0 Overview | first create a conflict: five answers for the same problem | big-number cards + log-axis Pf comparison bar + method map | click cards to jump; run all | 3 min |
| 1 Variables and U space | why "nearest" = "most likely" | X ellipse / U circle dual view | μ, σ, ρ sliders; Cholesky/PCA switch | 7 min |
| 2 Mean-point method | simplest, and most easily fooled by the "form" | mean-point tangent + error shading | change form; nonlinearity degree; show foot | 8 min |
| 3 FORM/HLRF | linearize at the design point; β = nearest distance | U-space iteration + iteration table + convergence chart | single-step/play/replay; click any table row | 12 min |
| 4 SORM | β unchanged, Pf corrected by curvature | U* magnified window + osculating parabola | curvature magnification; FORM/SORM/MC comparison | 6 min |
| 5 Simulation | use large samples as the baseline | sample cloud + running Pf/CI | batch sampling; X/U switch; fixed seed | 6 min |
| 6 Formula card | tie the methods together on one page | grouped formulas + comparison table + three sentences | print; view formulas/comparison table only | 3 min |

### 5.3 Station-by-station description

#### Station 0 · Overview: one problem, five answers

- **On screen**: 5 method cards (each showing β, Pf, R), a log-axis Pf comparison bar (MVFOSM / FORM / SORM / MC / exact), a "method map" (X → U → linearization → design point → curvature → simulation), and a "run all" button.
- **Interaction**: clicking any card jumps to the corresponding station; "run all" highlights the four methods in sequence and finally stops at the comparison table; hovering a card highlights the corresponding bar in the comparison bar.
- **Explanation**: create the conflict first — same problem, 4.80% vs 1.75% vs 1.62%, who is right? Why? Don't rush to explain; take them into Station 1.
- **Formulas**: `Pf=Φ(−β)`, `β=−Φ⁻¹(Pf)` (only as "conversion", not as a definition).
- **Notes**: the big-number cards show β, Pf and R together, preventing students from confusing "larger β" with "larger reliability".

#### Station 1 · Variables and U space: why "nearest" equals "most likely"

- **On screen**: X space (mean, 1/2/3σ ellipses, limit state surface, failure region); U space (concentric circles, transformed curve, design point); small cards for the matrix L and QΛQᵀ below.
- **Interaction**: μ1/μ2/σ1/σ2/ρ sliders; Cholesky/PCA switch; `ρ=0` button; `show 1/2/3σ ellipses` toggle; drag the mean (P1).
- **Explanation**: in X space "close to the mean" does not equal "high probability density" (the ellipse is skewed); in U space the equal-probability contours become circles, and the density depends only on the radius, so "nearest" = "most likely".
- **Formulas**: `U=L⁻¹(X−μ)`, `X=μ+LU`; equal-probability ellipse `(x−μ)ᵀC⁻¹(x−μ)=β²`; Cholesky and the eigendecomposition differ only by an orthogonal rotation.
- **Key numbers**: `L=[[2,0],[2.5,4.3301]]`; the same design point is `U*=(−1.928,0.853)` under Cholesky and `(−0.381,2.074)` under PCA, with β = 2.108 in both cases.
- **Common question**: why not use Euclidean distance in X space? Because the components of X have different units, variances and correlations, so distance has no probabilistic meaning.

#### Station 2 · Mean-point method (MVFOSM): simplest, and most easily fooled by the "form"

- **On screen**: mean point, tangent, foot of the perpendicular from the origin, β_M; the "true curve vs tangent" error shading in the bottom right; a "change form" toggle.
- **Interaction**: show/hide the tangent; `g1 vs g2` switch; `nonlinearity degree` slider (P1); "show foot" toggle.
- **Explanation**: take a first-order Taylor expansion at the mean point only, β=μ_g/σ_g; exact for linear g and normal X; for nonlinear g, the tangent is far from the design point and the error is large; worse, change the algebraic form and β changes — this is not a numerical error, it is the method itself lacking invariance.
- **Formulas**: `g≈g(μ)+∇g(μ)ᵀ(X−μ)`; `μ_g≈g(μ)`; `σ_g²≈∇gᵀC∇g`; `β_M=μ_g/σ_g`; `Pf≈Φ(−β_M)`.
- **Key numbers**: `μ_g=60`, `σ_g=36.056`, `β=1.664`, `Pf=4.805%`; the cross term −400 lowers σ_g from 41.23 to 36.06 (the effect of ρ=0.5).
- **Form sensitivity (essential)**:
  - Equivalent form of the main example `g2 = X1²/(2X2) − 1` (same solution as the parabola for X2>0): MVFOSM `β=1.714` (Pf=4.324%), FORM still `β=2.108`.
  - Classic small example `R~N(30,4)`, `S~N(15,3)`: MVFOSM of `g1=R−S` is `β=3.000` (Pf=0.135%); MVFOSM of `g2=R/S−1` is `β=2.080` (Pf=1.876%); FORM is 3.000 for both.
  - Suggested for class: use `R/S−1`, which has a larger difference and a cleaner conclusion; use the main example's 1.714 as a supplement showing "even the same problem can change".
- **Common question**: why does ρ>0 make β larger? Because `∂g/∂X1` and `∂g/∂X2` have opposite signs, and positive correlation lets the two terms "cancel", making σ_g smaller.

#### Station 3 · FORM/HLRF: linearize at the design point

- **On screen**: large U-space chart; the current iteration point `U_k`, the tangent, the foot of the perpendicular from the origin `U_{k+1}`, the trajectory; the iteration table on the right (k, u1, u2, β, g, α); small β_k and |g| convergence charts below.
- **Interaction**: reset / single-step / play / speed; click any row of the iteration table to replay that step; "show tangent/foot/trajectory" toggles; "from different starting points" (P2).
- **Explanation**: each step of HLRF is "take the tangent at the current point, then take the foot of the perpendicular from the origin to the tangent"; the foot at step 1 is exactly the mean-point method's `U_L` (β=1.664), step 2 is 2.090, step 3 is 2.1083, then almost unchanged; after convergence the tangent is at the design point and β is the nearest distance.
- **Formulas**: `β=min‖u‖ s.t. g(u)=0`; `u*=βα`; `α=−∇g(u*)/‖∇g(u*)‖`; `u_{k+1}=[(∇g(u_k)ᵀu_k−g(u_k))/‖∇g(u_k)‖²]∇g(u_k)`; `Pf≈Φ(−β)`.
- **Key numbers**: 6 iterations; `U*=(−1.928,0.853)`; `X*=(6.144,18.873)`; `α=(−0.9145,0.4046)`, `α²=(83.6%,16.4%)`; `β=2.108`, `Pf=1.750%`.
- **Common question**: why is step 1 the mean-point method? Because starting from `U=0`, the tangent is the mean-point tangent and the foot is `U_L`; so MVFOSM can be seen as the first step of HLRF.
- **Common question**: what is α? It is the normal direction cosines of the limit state surface at the design point, and `α_i²` is the variance contribution of variable i to β; in this example X1 accounts for 83.6%.

#### Station 4 · SORM: β unchanged, Pf corrected by curvature

- **On screen**: magnified window near `U*` (true curve, tangent, osculating parabola/circle); κ, βκ, correction factor; Pf comparison bar for FORM/SORM/MC; error percentages.
- **Interaction**: "curvature magnification" ×1/×2/×5; show/hide osculating circle; switch Breitung/first-order; "back to full view".
- **Explanation**: FORM uses only first-order gradients and treats the boundary as a straight line; SORM then uses second-order curvature and treats the boundary as a parabola; in this example `κ=0.0612`, `βκ=0.129`, correction factor 0.941, Pf drops from 1.750% to 1.647%, only 1.5% away from the exact 1.623%; FORM is 7.9% off.
- **Formulas**: `Pf≈Φ(−β)∏(1+βκ_i)^(−1/2)`; for n=2 `Pf≈Φ(−β)/√(1+βκ)`; `κ_i` are the principal curvatures (positive outward normal of the safe domain; κ>0 shrinks the failure domain).
- **Caution**: β is still 2.108; SORM does not change β, only the Pf conversion; this shows that "β = distance" and "Pf = Φ(−β)" are two different things.
- **Common question**: why doesn't SORM search for the design point again? The design point is defined by the first-order condition, and SORM adds second-order information at the same point; to be more accurate, one can iterate the curvature or use exact integration.

#### Station 5 · Monte Carlo: use large samples as the baseline

- **On screen**: X-space sample cloud (safe blue, failure red), the same batch of samples in U space; running Pf estimate and 95% CI band; N, failure count, COV and CI width table; comparison with the FORM/SORM/exact lines.
- **Interaction**: batch 1k / 10k / 100k; play/pause/reset; fixed seed; "show in X/U space" switch; "show FORM tangent" toggle; IS toggle (P2).
- **Explanation**: MC makes no linearization assumption; it directly counts the proportion with `g<0`; error ∝ 1/√N; when Pf=1.6%, N=10⁴ gives only about 160 failure samples, COV≈7.8%; N=10⁵ gives COV≈2.5%; N=4×10⁶ reaches 0.39%. FORM computes only a few dozen gradients and gets Pf to 1.75% — that is "trading approximation for speed".
- **Formulas**: `Pf≈(1/N)ΣI[g(x_j)≤0]`; `COV=√((1−Pf)/(N Pf))`; 95% CI ≈ `Pf±1.96·se`.
- **Key numbers**: N=4×10⁶, 65,121 failures, `Pf=1.628%`, `se=0.0063%`, CI ±0.0124%; consistent with the exact 1.623%.
- **Common question**: why is MC's answer different every time? Because of random sampling; a fixed seed makes it reproducible; the CI tells you how large "different" is.

#### Station 6 · Formula card: tie the methods together on one page

- **On screen**: grouped formulas (basics / transformation / MVFOSM / FORM / SORM / MC), each with "where used / assumptions / pitfalls"; a method comparison table (assumptions, β, Pf, computational cost, Pf relative error, error source); the three-sentence summary; the β↔Pf conversion table.
- **Interaction**: print/export PDF; "formulas only"/"comparison table only"; enlarge fonts.
- **Explanation**: wrap-up — no method is absolutely better; what matters is whether the assumptions fit, whether the error is acceptable, and whether the computational cost is affordable.
- **Formulas**: see §7.
- **After class**: leave 2 thought questions (the effect of ρ; half-space vs circle).

### 5.4 Global layout and controls

- **Top bar**: title, example selector, reset, help, full screen, print.
- **Left column**: station navigation (0–6), current station highlighted; collapsible.
- **Right column**: result card (β/Pf/R), method comparison table, current formulas, teaching notes (collapsible).
- **Bottom bar**: shortcut hints, status ("converged / sampling"), seed.
- **Responsive**: 1920×1080 main design; at 1366×768 the left column is iconified and the right column becomes a drawer; no horizontal scrolling.

---

## 6. Interaction list (by priority)

> P0 = must have before 11/24; P1 = as far as possible; P2 = iterate after class.

| # | Interaction | Location | Effect | Priority |
|---|---|---|---|---|
| 1 | Station switching | left column / number keys 0–6 | keep the current state, fade in | P0 |
| 2 | μ, σ sliders | Stations 1, 2 | dual views recompute in real time, result card updates | P0 |
| 3 | ρ slider | Stations 1, 3 | ellipse tilts, design point moves, β curve synchronized | P0 |
| 4 | Cholesky / PCA switch | Station 1 | U-space rotation animation, β unchanged | P0 |
| 5 | HLRF single-step | Station 3 | tangent → foot → new point, one row added to the iteration table | P0 |
| 6 | HLRF play/pause/speed | Station 3 | 6 automatic steps, 600 ms each | P0 |
| 7 | Click iteration table to replay | Station 3 | jump back to step k, show tangent/foot | P0 |
| 8 | Convergence-chart linkage | Station 3 | current k highlighted on the β_k and abs(g) charts | P0 |
| 9 | Change form | Station 2 | g1/g2 switch, β number comparison | P0 |
| 10 | Curvature magnification | Station 4 | osculating parabola ×1/×2/×5, magnify the difference | P0 |
| 11 | MC batch sampling | Station 5 | sample cloud appears batch by batch, Pf/CI update | P0 |
| 12 | MC fixed seed/reset | Station 5 | reproducible; reset clears | P0 |
| 13 | Method comparison table highlight | right column | hover a row, highlight the corresponding element in the charts | P1 |
| 14 | One-click demo presets | top bar | "effect of ρ / form sensitivity / HLRF convergence / SORM correction / MC convergence" | P1 |
| 15 | Teaching-notes drawer | right column | 3 points + expected numbers per station, N key toggle | P1 |
| 16 | Shortcuts | global | ←/→, Space, S, R, F, ? | P1 |
| 17 | Export current view as PNG | top bar | classroom screenshot/backup | P1 |
| 18 | Print formula card | Station 6 | A4 two pages, readable in black and white | P1 |
| 19 | State memory/URL | global | restore on refresh; shareable configuration | P1 |
| 20 | Dark/projector mode | top bar | increase contrast, enlarge fonts | P2 |
| 21 | Importance sampling IS | Station 5 | proposal distribution at the design point, narrower CI | P2 |
| 22 | Non-normal/R-F | Station 1 | equivalent normalization iteration | P2 |
| 23 | Arbitrary g(x) | top bar | expression parsing + numerical differentiation | P2 |
| 24 | Thought questions/answers | each station | classroom questions, one-click show answer | P2 |

---

## 7. Formula inventory

> The formulas on the page are grouped as "basics → transformation → four methods → simulation"; each has a sentence on "when it can be used / where the pitfalls are". The list below is the inventory; the implementation uses build-time pre-rendered SVG (offline, sharp), and dynamic numbers use HTML variables.

### 7.1 Basics

| # | Formula | Where used | Assumptions / pitfalls |
|---|---|---|---|
| 1 | `Pf = P[g(X)≤0] = ∫_{g(x)≤0} f_X(x) dx` | whole page | definition; multi-dimensional integrals generally cannot be computed, which is why approximations/simulation are needed |
| 2 | `β = −Φ⁻¹(Pf)`, `Pf = Φ(−β)` | result cards, comparison table | β's geometric definition is the nearest distance; `Pf=Φ(−β)` is exact only for a half-space/linear boundary, and is a FORM approximation for nonlinear cases |
| 3 | `Φ(−1)=15.87%`, `Φ(−2)=2.28%`, `Φ(−2.108)=1.75%`, `Φ(−3)=0.135%`, `Φ(−4)=3.17×10⁻⁵` | conversion table | recommended to memorise the three tiers 2.0 / 3.0 / 4.0 |

### 7.2 Transformation

| # | Formula | Where used | Assumptions / pitfalls |
|---|---|---|---|
| 4 | `U_i=(X_i−μ_i)/σ_i` | independent normal | correlated variables cannot be standardized this way directly |
| 5 | `X=μ+LU`, `U=L⁻¹(X−μ)`, `LLᵀ=C` | correlated normal | Cholesky requires C positive definite; L is lower triangular |
| 6 | `X=μ+QΛ^{1/2}U`, `QΛQᵀ=C` | correlated normal (PCA) | differs from Cholesky by an orthogonal rotation; β and Pf unchanged |
| 7 | `(x−μ)ᵀC⁻¹(x−μ)=β²` | X-space equal-probability ellipse | ellipse principal axes = eigenvectors of C; it is not a "circle" |

### 7.3 Mean-point method (MVFOSM)

| # | Formula | Where used | Assumptions / pitfalls |
|---|---|---|---|
| 8 | `g(X)≈g(μ)+∇g(μ)ᵀ(X−μ)` | Station 2 | expanded at the mean point only; large error when strongly nonlinear |
| 9 | `μ_g≈g(μ)`, `σ_g²≈∇gᵀC∇g` | Station 2 | g must be differentiable at the mean point; don't miss the cross term `2∂1g∂2gρσ1σ2` |
| 10 | `β_M=μ_g/σ_g`, `Pf≈Φ(−β_M)` | Station 2 | exact for linear g + normal X; otherwise an approximation |
| 11 | form sensitivity: `g=R−S` vs `g=R/S−1` | Station 2 | same failure surface, MVFOSM's β can differ a lot; FORM is unchanged |

### 7.4 FORM / HLRF

| # | Formula | Where used | Assumptions / pitfalls |
|---|---|---|---|
| 12 | `β = min{‖u‖ : g(u)=0}` | Station 3 | geometric definition of β; U space is standard normal |
| 13 | `u* = β α`, `α = −∇g(u*)/‖∇g(u*)‖` | Station 3 | α points to the design point; `α_i²` is the variance contribution. If a textbook defines α along the gradient, it writes `u*=−βα`, with the opposite sign |
| 14 | `u_{k+1} = [(∇g(u_k)ᵀu_k − g(u_k))/‖∇g(u_k)‖²] ∇g(u_k)` | Station 3 | HLRF iteration; from U=0 the first step = mean-point method |
| 15 | `x* = μ + L u*`, `g(x*)=0` | Station 3 | inverse transformation back to physical space |
| 16 | `Pf ≈ Φ(−β)` | Station 3 | first-order approximation; use SORM/simulation when the boundary curves |
| 17 | `∂β/∂μ = ∇ₓg / ‖Lᵀ∇ₓg‖`; when ρ=0 `∂β/∂μ_i = −α_i/σ_i` | Station 3 (P1) | sensitivity; in this example 0.574 / −0.093 (when correlated, `−α_i/σ_i` cannot be used directly) |

### 7.5 SORM

| # | Formula | Where used | Assumptions / pitfalls |
|---|---|---|---|
| 18 | `Pf ≈ Φ(−β) ∏_{i=1}^{n−1}(1+βκ_i)^(−1/2)` | Station 4 | Breitung; κ_i are principal curvatures, and the sign convention must be stated clearly (if a textbook takes the opposite normal, it is written 1−βκ) |
| 19 | n=2: `Pf ≈ Φ(−β)/√(1+βκ)` | Station 4 | in this example `κ=0.0612`, factor 0.941 |
| 20 | `κ_i` = principal curvatures of the limit state surface at `u*` | Station 4 | κ>0 shrinks the failure domain; the formula fails when κ<−1/β |

### 7.6 Simulation

| # | Formula | Where used | Assumptions / pitfalls |
|---|---|---|---|
| 21 | `Pf≈(1/N)Σ I[g(x_j)≤0]` | Station 5 | unbiased; error ∝ 1/√N |
| 22 | `COV=√((1−Pf)/(N Pf))`, `se=√(Pf(1−Pf)/N)` | Station 5 | when Pf is very small, N must be very large |
| 23 | `Pf≈(1/N)Σ I[g(v_j)≤0] f(v_j)/q(v_j)` | Station 5 (P2) | importance sampling; q chosen near the design point; the weight variance determines the gain |
| 24 | half-space `Pf=Φ(−β)`; n-dimensional ball `Pf=P(χ²_n>β²)` | Stations 4/6 thought question | same β, different boundary shape, different Pf; for n=2 it is `exp(−β²/2)` |

---

## 8. Visual and information design

### 8.1 Palette (following the existing figures, so students recognise them at a glance)

| Colour | Value | Meaning |
|---|---|---|
| Blue | `#1f77b4` | limit state surface / safety boundary / main curve |
| Orange | `#ff7f0e` | mean-point method / mean-point tangent / mean point |
| Red | `#d62728` | FORM / design point / failure domain / failure samples |
| Purple | `#9467bd` | second form / comparison boundary |
| Green | `#2ca02c` | converged tangent / SORM correction |
| Grey | `#7f7f7f` | iteration points / samples / auxiliary lines |
| Background | `#ffffff` | white background, consistent with the existing figures |
| Grid | `#bfbfbf` dotted | coordinate grid |

### 8.2 Font sizes and layout

- At 1920×1080: body 18–20 px, headings 26–32 px, big numbers 48–64 px, canvas labels ≥16 px.
- Projector mode: body 22 px, big numbers 72 px, hide secondary annotations; one-click toggle.
- Lines ≥2 px; dashed lines with a 4-3 rhythm; do not encode by colour alone (also use marker shapes + text labels).
- Chinese/English mixed typesetting: Chinese in Microsoft YaHei UI / Source Han Sans; formulas in a serif mathematical font (Computer Modern style), consistent with the existing figures.

### 8.3 Accessibility and classroom safety

- Do not rely on red/green discrimination: failure points are red filled + "×" marker; safe points are blue hollow.
- Provide a "high-contrast/projector" mode; dark mode as P2.
- Animations can be disabled (`prefers-reduced-motion` + manual switch); single-stepping is always available.
- All numbers have unit/dimension notes (this example is dimensionless); Pf is given both as % and in scientific notation.
- No fonts, icons or CDNs requiring the internet; icons use inline SVG.

### 8.4 Terminology unification

| Chinese | English/abbreviation | Notes |
|---|---|---|
| limit-state function | `g(X)` | also called a performance function or limit-state function |
| limit-state surface | `g=0` | |
| reliability index | `β` | |
| probability of failure | `Pf` | |
| reliability | reliability `R=1−Pf` | |
| mean-point method | MVFOSM | also known as the center-point method |
| design-point method | FORM | also known as the checking-point method |
| second-order reliability method | SORM | "Breitung" noted at first occurrence |
| Monte Carlo | MC | |
| importance sampling | IS | P2 |
| standard normal space | U space | also called standardized space |

---

## 9. Technical approach

### 9.1 Form

- **Delivery**: `structural-reliability-lab.html`, single file, double-click to open.
- **Size**: target < 1.5 MB; formulas use inline SVG, JS/CSS inlined, no external requests.
- **Browsers**: Chrome / Edge 120+ (primary), Firefox 120+ (secondary); IE not supported.
- **Offline**: can be opened from a USB stick, desktop or email attachment; no module-loading problems under `file://` (classic scripts used, not `type="module"`).

### 9.2 Architecture

```
state (example / parameters / station / iteration step / samples)
   │
   ├─ model.js: g, ∇g, Hessian, Cholesky, HLRF, SORM, MC
   ├─ charts.js: X view, U view, convergence charts, sample cloud (Canvas 2D)
   ├─ stations.js: render/update for the 7 stations
   └─ app.js: state, routing, shortcuts, import/export
```

- One-way data flow: change state → recompute derived → redraw; no hidden mutable state.
- Each station only reads state and does not call other stations; stations are linked through state.
- `CONFIG` is placed at the top of the file: example parameters, colours, labels, reference values; change the numbers to change the example.

### 9.3 Numerical kernel (in the browser)

| Function | Method | Accuracy target |
|---|---|---|
| `normCdf` | Cody / Hart double-precision algorithm (no low-precision erf approximation) | absolute error <1e-10 (within the display range) |
| `normInv` | Acklam rational approximation + one Newton correction | relative error <1e-12 |
| Cholesky / 2×2 eigendecomposition | closed form | machine precision |
| HLRF | analytical gradient; `abs(g)<1e-8`, at most 30 steps | difference from the Python baseline <1e-8 |
| SORM curvature | analytical Hessian + finite-difference cross-check | κ difference <1e-6 |
| MC | mulberry32 seed + Box-Muller; Cholesky correlation | reproducible; point-by-point same-seed agreement with Python is not required, statistical agreement is |
| Normal random numbers | Box-Muller (cache the second) | sufficient |

### 9.4 Performance

- Slider input: recompute + redraw < 50 ms; HLRF < 1 ms; SORM < 1 ms.
- MC: 5,000–10,000 samples per frame, 100k samples animated in about 1–2 s; cap at 200k (beyond that use preset reference values).
- Canvas is scaled with `devicePixelRatio` to keep projection sharp; when sample points exceed 20,000, draw with semi-transparent aggregation/thinning.
- All animations use `requestAnimationFrame`; pause when the page is hidden.

### 9.5 Build and source

- Development uses `src/` (HTML/CSS/JS separated for easy editing), and the build script inlines CSS/JS/SVG into `dist/structural-reliability-lab.html`.
- The build script uses Python (standard library is enough), with no npm dependencies; formula SVGs can be pre-generated into `src/formulas/`.
- Deliver both `src/` and `dist/`: to change the example/text later, edit `src` and run the build once; for class use only the single `dist` file.

### 9.6 Extensibility

- New example: add an entry to `CONFIG.examples` (g, grad, hessian, x range, failure-domain test, reference values), and the stations adapt automatically.
- New method: add a `computeXxx(state)` in `model.js` and register it in the comparison table/station; no view changes are needed.
- Arbitrary g(x) (P2): safe expression parsing + central differences for the gradient/Hessian; HLRF/SORM/MC can still be reused.
- Non-normal (P2): add `equivalentNormal(x, dist)`, and update the equivalent mean/standard deviation at each HLRF step.

### 9.7 Testing

- **Numerical self-test**: `?selftest=1` runs 20 assertions (Φ, Cholesky, HLRF, SORM, MC with a fixed seed), and "ready for class" is shown only when all are green.
- **Visual regression**: capture one 1920×1080 PNG per station as backup images; compare after changes.
- **Offline check**: confirm 0 requests in the DevTools Network panel; open once with the network disconnected.
- **Classroom rehearsal**: run through at 1366×768 and 1920×1080; check projection contrast.

---

## 10. Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| 1 | Works offline | With the network disconnected, double-click the single `dist` file; Chrome/Edge opens normally, with 0 network requests |
| 2 | Numerically correct | `?selftest=1` all green; β, Pf and the design point agree with the §4 baseline table (within display precision) |
| 3 | Methods complete | Stations 0–6 are all switchable; MVFOSM/FORM/SORM/MC all have "computed on the spot" results |
| 4 | Linkage correct | Change μ/σ/ρ; X/U views, result card and comparison table update together; no stale values |
| 5 | HLRF can be single-stepped | 6 steps visible; each step's tangent, foot, β and g agree with the iteration table; replayable |
| 6 | SORM explainable | κ, βκ, correction factor and Pf change all visible; comparison with FORM/MC clear |
| 7 | MC reproducible | Same result with a fixed seed; CI narrows correctly with N; failure points marked red |
| 8 | Formulas readable | Legible at 8 m projection; no garbled/missing characters; symbol table complete |
| 9 | No-scroll layout | At 1920×1080 the main view has no horizontal/vertical scrolling; usable at 1366×768 |
| 10 | Classroom operation | Shortcuts work; one-click demo of the 5 presets; reset reliable |
| 11 | Print usable | Formula card within A4 two pages, readable in black and white |
| 12 | Maintainable | `src/` commented; `CONFIG` can change the example; build with one command |

---

## 11. Deliverables and schedule

### 11.1 Deliverables

| # | Deliverable | Description | Priority |
|---|---|---|---|
| 1 | `dist/structural-reliability-lab.html` | single file, for class use | P0 |
| 2 | `src/` + `build.py` | source and build script, easy to modify | P0 |
| 3 | `requirements.md` | this document (repository root, easy to open) | P0 |
| 4 | `reference_values.py` + `docs/benchmark_values.md` | numerical source of truth and recomputation method | P0 |
| 5 | `docs/lecture_script.md` | 45-minute click path, 3-sentence script per station, expected numbers | P1 |
| 6 | `backup/station-0-6.png` | 7 × 1920×1080 backup images (against classroom computer/browser surprises) | P1 |
| 7 | `docs/formula_card.pdf` | printable two-page formula card | P1 |

### 11.2 Schedule (back-scheduled from the 11/24 9:15 class, to be confirmed)

| Date | Work | Output |
|---|---|---|
| 11/19 (today) | requirements review | this document; you approve §12 |
| 11/20 | skeleton + state + dual views + Stations 0–2 | switchable, parameterizable, MVFOSM computable |
| 11/21 | HLRF single-step/animation + Station 3; SORM Station 4 | core demo usable |
| 11/22 | MC Station 5 + formula card + comparison table + printing | features complete |
| 11/23 | self-test, projection/compatibility tests, backup images, lecture script | class-ready version; delivered before 18:00 |
| 11/23 evening | you rehearse once; I fix per feedback | final version |
| 11/24 9:15 | classroom use | — |

> If time is short, the P0 scope can be compressed further: make Station 5 "static comparison + one-click sampling" first, and defer IS/non-normal entirely. The core is the linkage and single-stepping of Stations 1–4.

### 11.3 Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Inconsistent browsers/fonts on the classroom computer | demo failure | test on similar machines before 11/23; backup PNGs; use system fonts only |
| Existing figures disagree with the page's numbers | students question them | use `reference_values.py` as the single source of truth; check Appendix C first |
| Formula rendering unavailable offline | garbled formulas | convert to SVG at build time, no CDN/font dependency |
| Scope creep (non-normal/subset/arbitrary g) | miss 11/24 | freeze v1; add P2 after class |
| MC animation lag | classroom embarrassment | batch + thinning; cap at 200k; use preset reference for large N |
| You change the example at short notice | rework | parameterise `CONFIG`; change numbers, not code |

---

## 12. Open questions (please decide)

### Q1. Use scenario and deadline

- **A (recommended)**: use it for the 11/24 9:15–10:00 "First- and second-order reliability methods" session; back-schedule from an 11/23 18:00 delivery.
- B: for another class/report, with a more relaxed timeline.
- C: build a general version first, without the 11/24 rush.

### Q2. Method scope

- **A (recommended)**: MVFOSM + FORM/HLRF + SORM + MC, plus an "exact value" baseline; enough for 45 minutes, with the focus on geometry and comparison.
- B: A + non-normal/R-F equivalent normalization (one more station/toggle, about 0.5–1 day more).
- C: A + subset simulation/response surface (not recommended: there is a separate course, and 45 minutes cannot cover it).

### Q3. Form

- **A (recommended)**: single-file offline HTML, double-click to open, no backend.
- B: HTML + local Python service (needed only for "entering an arbitrary g(x) live" or "more than 3 dimensions").
- C: static printable pages only (no interaction) — not recommended; it loses the core value of "change parameters and see the linkage".

### Q4. Main example and form sensitivity

- **A (recommended)**: use `g=X1²−2X2` as the main example (fully consistent with the existing 8 figures); use the `R−S` vs `R/S−1` small example for form sensitivity (3.000 vs 2.080).
- B: replace the main example with another problem from your class (please provide g, distributions and target numbers).
- C: main example + one engineering example (beam/column/slope), making the page more "engineering", but 45 minutes may not be enough.

### Q5. One convention in the existing figure (Appendix C)

- **A (recommended)**: explicitly change g2 in `mvfosm_two_forms_comparison.png` to "another linear limit state", or redraw it as `R−S` vs `R/S−1`; the page uses the correct version.
- B: keep the original figure unchanged, don't repeat the "same failure surface" claim on the page, and treat it only as a comparison of "two different boundaries".
- C: you first confirm the original figure's intent, then I decide how to handle it.

### Q6. Visual style

- **A (recommended)**: continue the existing figures' light palette — blue/orange/red/purple/green, white background; clear for projection, seamless with PPT.
- B: dark projector mode (looks better in a dark room, but inconsistent with the white-background figures).
- C: do both (P2, about half a day more).

> You can simply reply "Q1A Q2A Q3A Q4A Q5A Q6A", or only mention the ones you want to change; I will follow the recommendations for the rest.

---

## Appendix A · HLRF iteration table (for the page's single-stepping)

| k | u1 | u2 | β_k | g(U_k) |
|---:|---:|---:|---:|---:|
| 0 | 0.000000 | 0.000000 | 0.000000 | 6.000e+01 |
| 1 | −1.615385 | 0.399704 | 1.664101 | 1.044e+01 |
| 2 | −1.945586 | 0.763207 | 2.089926 | 4.361e−01 |
| 3 | −1.925743 | 0.858099 | 2.108275 | 1.575e−03 |
| 4 | −1.928381 | 0.852313 | 2.108339 | 2.783e−05 |
| 5 | −1.928042 | 0.853082 | 2.108340 | 4.592e−07 |
| 6 | −1.928086 | 0.852983 | 2.108340 | 7.647e−09 |

> Step 1 = the mean-point-method foot; step 2 is 2.0899; step 3 is 2.1083; then it is unchanged within display precision. The page shows 6 iterations and 7 points.

## Appendix B · Reference values and recomputation

- `reference_values.py`: the main example, the ρ sweep, the R−S small example, the SORM curvature and the MC/IS reference values — all re-runnable.
- Run: `python reference_values.py` (only numpy is needed; scipy is not required).
- Key outputs: MVFOSM 1.6641005887 / 4.8046%; FORM 2.1083396823 / 1.75008%; SORM 1.64708%; exact 1.62263%; MC 1.62803%±0.00633%.
- The exact value uses 1-D conditional integration: `Pf=E_X1[Φ((m(X1)−X1²/2)/s_cond)]`, `m(x)=μ2+ρσ2/σ1(x−μ1)`, `s_cond=σ2√(1−ρ²)`; consistent with the 4×10⁶ MC.

## Appendix C · One convention that needs checking: `mvfosm_two_forms_comparison.png`

This figure is titled "the same parabola, two MVFOSM linearizations", but the second line `g2: X2=4X1+10` in the figure is **not the same solution** as the parabola `X2=X1²/2`:

- the parabola passes through `(10,50)`, and the `g2` line also passes through `(10,50)`;
- but at `X1=6`, the parabola has `X2=18` while the `g2` line has `X2=34`; the two boundaries are far apart;
- the `g2` line is also not a tangent to the parabola at any point (tangent slope = `X1`; the `g2` slope of 4 corresponds to the tangent at `X1=4`, which is `X2=4X1−8`, not `+10`).

So `g2` is more like "another linear limit state" than "another form of the same parabola". If class needs to explain "same failure surface, different algebraic forms, MVFOSM's β changes", the cleaner example is:

- `R~N(30,4)`, `S~N(15,3)`, independent;
- `g1=R−S`: MVFOSM `β=3.000`, Pf=0.135%;
- `g2=R/S−1`: MVFOSM `β=2.080`, Pf=1.876%;
- both have zero set `R=S`; FORM gives `β=3.000`, Pf=0.135% for both.

Two options are suggested:

1. Rename g2 in the original figure to "another linear boundary" and do not claim "same failure surface" on the page;
2. Redraw with `R−S` / `R/S−1` and replace the original figure (Station 2 on the page uses the new figure).

> This is not nit-picking; the concern is that students will ask in class "these two lines clearly don't coincide". After you confirm the original intent, I will unify the page and the PPT according to your convention.

---

## Appendix D · Correspondence between the page and the existing figures (for PPT making)

| Page station | Existing figure that can be reused directly | New things added on the page |
|---|---|---|
| 0 Overview | — | five-method Pf comparison bar, method map |
| 1 Variables and U space | `why_u_space_ellipse_circle.png`, `cholesky_vs_pca_u_space.png` | live ρ slider, ellipse/circle linkage |
| 2 Mean-point method | `form_linearization_error.png` | change-form toggle, error shading, R−S small example |
| 3 FORM/HLRF | `hlrf_demo.png`, `u_space_norm_distance.png` | single-step/replay, α contribution bar |
| 4 SORM | — | curvature magnification window, FORM/SORM/MC comparison |
| 5 Simulation | — | sample cloud, running CI, fixed seed |
| 6 Formula card | — | grouped formulas, β↔Pf table, printing |

---

*(End)*

