# Reference Values (Verification and Recomputation)

[Chinese original](zh/benchmark_values.md)

> Purpose: student recomputation in class, TA cross-checking, and regression after code changes.
> The numbers come from only three places: `reference_values.py` (Python baseline), `src/js/model.js` (page numerical kernel), `tests/test_math.js` (Node tests).
> The page currently passes self-test **20/20**; this document was reviewed on 2026-11-19.
> Conventions: β and Pf take the Python output as the primary baseline; for last-digit differences between the page's internal implementation values and displayed values see section 12; do not compare digit by digit beyond 5 decimal places.

---

## 1. Main example definition

| Item | Content |
|---|---|
| Limit-state function | g(X) = X₁² − 2X₂ |
| Failure domain | g < 0, i.e. **X₂ > X₁² / 2** |
| Random variables | X₁ ~ N(10, 2²), X₂ ~ N(20, 5²), correlation coefficient ρ₁₂ = 0.5 |
| Mean vector | μ = (10, 20) |
| Standard deviation vector | σ = (2, 5) |
| Covariance matrix | C = [[4, 5], [5, 25]] (off-diagonal = ρσ₁σ₂ = 0.5×2×5 = 5) |
| Cholesky decomposition | L = [[2, 0], [2.5, √18.75]], √18.75 = 4.3301270189 |
| Variable transformation | X = μ + L U, U ~ N(0, I); i.e. U = L⁻¹(X − μ) |
| Gradient | ∇g(X) = (2X₁, −2); at the mean point ∇g(μ) = (20, −2) |
| Hessian | H = [[2, 0], [0, 0]] (linear in X₂, quadratic in X₁) |
| Function value at the mean point | g(μ) = 10² − 2×20 = **60** |

The failure surface is the parabola X₂ = X₁²/2; larger X₁ is more dangerous, the variance of X₂ (σ₂ = 5) is much larger than that of X₁ (σ₁ = 2), and the two are positively correlated.

---

## 2. Method comparison summary (default parameters)

| Method | Information used | β | Pf | Reliability 1 − Pf | Pf relative to exact |
|---|---|---|---|---|---|
| MVFOSM | g(μ), ∇g(μ) | **1.66410** | **4.80462%** | 95.19538% | +196.10% |
| AFOSM | ∇g(x), root finding along the α-ray | **2.10834** | **1.75008%** | 98.24992% | +7.85% |
| FORM / HLRF | ∇g(u), tangent–foot iteration | **2.10834** | **1.75008%** | 98.24992% | +7.85% |
| SORM | FORM design point + Hessian | 2.10834 (β not corrected) | **1.64708%** | 98.35292% | +1.51% |
| MC (reference) | N = 4×10⁶ samples | — | **1.62803%** | 98.37198% | +0.33% |
| Exact (main example) | one-dimensional conditional integration | — | **1.62263%** | 98.37737% | 0 |

Notes:

- AFOSM and FORM converge to **the same design point** under normal variables, with identical β and Pf (the page labels "≡"); they are not two independent accuracy levels.
- SORM follows FORM's β and only multiplies Pf by the curvature correction factor.
- MC's β is shown as "—" in the page's "method comparison" table; the exact row's β is also shown as "—" (station 8's result card borrows FORM's β for display, see section 12.2).
- Relative error is computed as (Pf − Pf_exact)/Pf_exact, with the exact value taken as 1.6226296294×10⁻².

---

## 3. MVFOSM (mean-point first-order second-moment)

| Quantity | Value |
|---|---|
| μ_g = g(μ) | 60 |
| σ_g² = ∇g(μ)ᵀ C ∇g(μ) | 20²×2² + (−2)²×5² + 2×20×(−2)×5 = 1600 + 100 − 400 = **1300** |
| σ_g | **36.055513** (√1300) |
| β_M = μ_g / σ_g | **1.6641005887** |
| Pf ≈ Φ(−β_M) | **4.80462%** (0.0480461647) |
| Cross term 2∂₁g∂₂g·C₁₂ | **−400** (if the cross term were ignored, σ_g would be √1700 = 41.231 and β would be underestimated) |
| Mean-point tangent | X₂ = 10X₁ − 50 (from g(μ) + ∇g(μ)ᵀ(X − μ) = 0) |
| U-space foot U_L | (−1.615385, 0.399704) |
| Corresponding X-space point x_L | (6.769231, 17.692308) |

Key point: MVFOSM's U_L is exactly the **k = 1** step of the HLRF iteration (see section 4), which is why textbooks often say "MVFOSM is step 1 of HLRF".

---

## 4. FORM / HLRF

### 4.1 Iteration process (7 points)

Default parameters, tolerance |g| < 10⁻⁸, at most 30 iterations. k = 0 is the mean point, after which **6 iterations** converge:

| k | u₁ | u₂ | β_k = ‖u_k‖ | g(u_k) |
|---|---|---|---|---|
| 0 | 0.000000 | 0.000000 | 0.000000 | 6.000000×10¹ |
| 1 | −1.615385 | 0.399704 | 1.664101 | 1.044×10¹ |
| 2 | −1.945586 | 0.763207 | 2.089926 | 4.361×10⁻¹ |
| 3 | −1.925743 | 0.858099 | 2.108275 | 1.575×10⁻³ |
| 4 | −1.928381 | 0.852313 | 2.108339 | 2.783×10⁻⁵ |
| 5 | −1.928042 | 0.853082 | 2.108340 | 4.592×10⁻⁷ |
| 6 | −1.928086 | 0.852983 | 2.108340 | 7.647×10⁻⁹ |

The page's iteration table displays 3 decimal places (u, β); the g column uses scientific notation when |g| < 10⁻², otherwise two decimal places. By this rule, g at k = 0, 1, 2 is displayed as 60.00, 10.44, 0.44; g = 1.575×10⁻³ at k = 3 is displayed as **1.6e-3**; k = 4, 5, 6 display 2.8e-5, 4.6e-7, 7.6e-9 respectively.

### 4.2 Design point and direction cosines

| Quantity | Value |
|---|---|
| u* | (−1.928086, 0.852983) |
| x* = μ + L u* | (6.143828, 18.873311) |
| g(x*) | 7.647×10⁻⁹ (≈0) |
| β = ‖u*‖ | **2.1083396823** |
| α = u*/β | (−0.914504, 0.404576) |
| α² (variance contribution in U space) | **83.6318% / 16.3682%** |
| Pf_FORM = Φ(−β) | **1.7500808901×10⁻² = 1.75008%** |

Check: x₁* = 10 + 2×(−1.928086) = 6.143828; x₂* = 20 + 2.5×(−1.928086) + 4.330127×0.852983 = 18.873311.

Page default display: β = 2.108, Pf = 1.750%, α² ≈ 83.6% / 16.4%.

### 4.3 Last-digit differences from the page

After stopping at |g| < 10⁻⁸, the page performs **up to 6 more refinement steps** (continuing with the same HLRF formula), so the page's internal u*, x* differ from `reference_values.py` in the last digits:

| Quantity | reference_values.py | Page internal (model.js) |
|---|---|---|
| u* | (−1.928086, 0.852983) | (−1.928081, 0.852995) |
| x* | (6.143828, 18.873311) | (6.143838, 18.873373) |
| β | 2.1083396823 | 2.1083396826 |
| Pf | 1.7500808901% | 1.7500747% |

Magnitude of differences: u*, x* about 10⁻⁵–10⁻⁴, β about 3×10⁻¹⁰, Pf about 6×10⁻⁸. At 3-decimal display the two are exactly the same; the threshold for x* in the self-test (10⁻⁵) is set against the page's internal values.

---

## 5. AFOSM (directional search in X space)

Under default parameters there are **6 steps** (rows 1–6 of the page's iteration table); each step solves g(μ + βd) = 0 along the current α direction; because it solves for a root along the ray, g at each step is on the order of 10⁻¹³:

| Step | x₁ | x₂ | β | g |
|---|---|---|---|---|
| 1 | 5.835271 | 17.025194 | 2.145163 | −4.3×10⁻¹⁴ |
| 2 | 6.185704 | 19.131466 | 2.109061 | −2.6×10⁻¹³ |
| 3 | 6.138474 | 18.840432 | 2.108351 | −2.8×10⁻¹³ |
| 4 | 6.144530 | 18.877627 | 2.108340 | −6.5×10⁻¹³ |
| 5 | 6.143749 | 18.872824 | 2.108340 | −8.7×10⁻¹³ |
| 6 | 6.143850 | 18.873444 | 2.108340 | +1.4×10⁻¹³ |

Converged result: x* = (6.143850, 18.873444), β = 2.1083396826, Pf = 1.75007% (the page displays 1.750%) — differing from FORM's β by 5×10⁻¹¹ and the design-point coordinates by 10⁻⁵–10⁻⁴, a numerical difference between the two iteration paths.

Teaching point: the first jump (step 1, β≈2.145) overshoots the design point and then swings back; AFOSM searches in X space and FORM in U space, and they end at the same design point.

---

## 6. SORM / Breitung (n = 2)

| Quantity | Value | Explanation |
|---|---|---|
| FORM design point | u* = (−1.928086, 0.852983) | SORM reuses it directly and does not solve for the point again |
| β | 2.1083396823 | same as FORM |
| Principal curvature κ | **0.0611756786** | finite-difference cross-check 0.0611754120 |
| βκ | **0.1289791108** | 2.10834 × 0.0611757 |
| Correction factor 1/√(1 + βκ) | **0.9411460998** | page displays 0.941 |
| Pf_FORM | 1.7500808901% | |
| **Pf_SORM** = Pf_FORM / √(1 + βκ) | **1.6470818041% = 1.64708%** | page displays 1.647% |
| 1/κ (radius of curvature) | 16.3464 | page displays 16.35 |
| Relative error to exact | +1.51% | FORM is +7.85%; SORM reduces the error from +7.9% to +1.5% |

Page internal values: κ = 0.0611753654, βκ = 0.1289784504, factor = 0.9411463751, Pf = 1.6470764% (the difference from Python's κ is 3×10⁻⁷, caused by last-digit differences in the design point; at 4-decimal display 0.0612 they fully agree).

Note: the page's "curvature illustration ×3" and "show osculating circle" only affect drawing and **do not participate in any numerical computation**.

---

## 7. Monte Carlo

### 7.1 Reference value (N = 4×10⁶)

| Quantity | Value |
|---|---|
| Number of samples N | 4,000,000 |
| Random seed | 20261119 |
| Number of failures | 65,121 |
| Pf | **0.01628025 = 1.62803%** |
| Standard error se | 6.328×10⁻⁵ |
| COV = se/Pf | 0.389% |
| 95% confidence interval | ±1.96·se ≈ ±0.0124 percentage points (±0.000124 absolute) |

This value is generated by `reference_values.py` with numpy, and the page hard-codes it as "MC reference N=4×10⁶" (`MC_REF` in `src/js/stations.js`), displayed only under default parameters.

### 7.2 On-page sampling (seed = 20261119, reproducible)

The page uses JS mulberry32 + Box–Muller random numbers; the sequence differs from numpy, but the seed is fixed; the same sequence of operations gives deterministic results:

| Number of samples N | Failures | Pf | COV | 95% CI half-width |
|---|---|---|---|---|
| 10,000 | 158 | **1.580%** | 7.89% | ±0.244 percentage points |
| 100,000 | 1,585 | **1.585%** | 2.49% | ±0.077 percentage points |

- The page's MC limit is 100,000; `per batch` / `target N` are adjustable; `resample to N`, `continuous sampling`, and `draw one batch` all continue from the same seed sequence, and the deterministic result at 100k is 1.585%.
- The difference from the 4M reference 1.62803% is 0.043 percentage points, within the 100k 95% sampling error (±0.077 percentage points), a normal sampling fluctuation.
- Standard error formula: se = √(Pf(1−Pf)/N), 95% CI = ±1.96·se.
- COV magnitude shown by the page: about 7.8% at 10k and about 2.5% at 100k (consistent with the theoretical value computed from the reference Pf).

---

## 8. Exact value (one-dimensional conditional integration of the main example)

The main example can be "conditioned on X₁" and then integrated in one dimension:

Given X₁ = x₁, X₂ | X₁ ~ N(m(x₁), s_cond²), where

- m(x₁) = μ₂ + ρ·σ₂/σ₁·(x₁ − μ₁) = 20 + 1.25(x₁ − 10)
- s_cond = σ₂·√(1 − ρ²) = 5×√0.75 = **4.3301270189**

The failure condition is X₂ > X₁²/2, so

> Pf = ∫ φ((x₁ − μ₁)/σ₁)/σ₁ · Φ((m(x₁) − x₁²/2) / s_cond) dx₁

Numerical implementation:

| Implementation | Method | Interval and points | Result |
|---|---|---|---|
| Python `exact_pf` | trapezoidal integration | [μ₁−8σ₁, μ₁+8σ₁] = [−6, 26], 400,001 points | **0.016226296294 = 1.62263%** |
| Page `exactParabola` | Simpson integration | [−6, 26], 1600 intervals | 0.016226300500 = 1.62263% |

The two independent implementations differ by 4.2×10⁻⁹; at 3 decimal places the page displays 1.623%, the result card shows 1.623%, and the formula-card comparison table shows 1.623%.

---

## 9. Form sensitivity: R−S vs R/S−1

R ~ N(30, 4²), S ~ N(15, 3²), independent (station 2 default parameters).

### 9.1 Two forms (same failure surface R = S)

| Form | g | μ_g | σ_g | MVFOSM β | MVFOSM Pf | FORM β | FORM Pf |
|---|---|---|---|---|---|---|---|
| R − S | R − S | 15 | 5 | **3.000000** | **0.134990%** | 3.000000 | 0.134990% |
| R/S − 1 | R/S − 1 | 1 | 0.480740 | **2.080126** | **1.875700%** | 3.000000 | 0.134990% |

- R−S is linear, and R, S are independent normal, so MVFOSM and FORM are both exact: β = (30−15)/√(4²+3²) = 3, Pf = Φ(−3) = 0.1349898%.
- Derivation for R/S−1: g(μ) = 30/15 − 1 = 1; ∂g/∂R = 1/15, ∂g/∂S = −30/15² = −2/15;
  σ_g² = (1/15)²×4² + (2/15)²×3² = (16+36)/225 = 52/225, σ_g = 0.4807401701; β = 1/0.4807401701 = 2.0801257358;
  Pf = Φ(−2.08013) = 1.87570% (the page computes 1.87569% with the A&S approximation, displayed as 1.876%).
- FORM does not change with the form: still β = 3.000, Pf = 0.134990% — because the zero sets of both forms are R = S.
- If the exact value of R−S is taken as the baseline, the MVFOSM error of R/S−1 is +1289.5%.

### 9.2 Ratio form of the main example

When the same failure surface is written as g₂ = X₁²/(2X₂) − 1 (MVFOSM expanded at the mean point):

- g₂(μ) = 100/40 − 1 = 1.5
- ∂g₂/∂X₁ = X₁/X₂ = 0.5, ∂g₂/∂X₂ = −X₁²/(2X₂²) = −0.125
- σ_g = 0.875, β = 1.5/0.875 = **1.7142857143**
- Pf = Φ(−1.71429) = **4.32381%** (page displays 4.324%)
- while FORM is still β = 2.10834, Pf = 1.75008%

This is exactly the main-example version of "MVFOSM's β depends on the algebraic form of g, while the design-point method does not change".

---

## 10. ρ sweep (FORM, other parameters default)

From the RHO SWEEP section of `reference_values.py` (the page's ρ slider range is −0.8 to 0.9; the table below takes 5 points from it):

| ρ | β | Pf | x₁* | x₂* |
|---|---|---|---|---|
| −0.5 | 1.49516845 | 6.74352% | 7.105269 | 25.242422 |
| 0.0 | 1.71706422 | 4.29837% | 6.778047 | 22.970961 |
| 0.3 | 1.91775379 | 2.75711% | 6.460715 | 20.870421 |
| 0.5 | 2.10833968 | 1.75008% | 6.143828 | 18.873311 |
| 0.8 | 2.61474861 | 0.446466% | 5.251443 | 13.788827 |

Conclusion: the larger ρ, the larger β and the smaller Pf; the design point also moves with ρ. You can compare directly with the ρ slider on the right of the page.

---

## 11. β ↔ Pf conversion (page formula card)

Pf = Φ(−β) (strict only for half-space/linear boundaries; for nonlinear cases it is the FORM approximation). Measured display values of the page's "β ↔ Pf conversion" table:

| β | Φ(−β) reference | Page display |
|---|---|---|
| 1.0 | 15.86553% | 15.87% |
| 1.5 | 6.68072% | 6.68% |
| 2.0 | 2.27501% | 2.28% |
| 2.5 | 0.620967% | 0.621% |
| 3.0 | 0.134990% | 0.135% |
| 3.5 | 0.0232629% | 0.023% |
| 4.0 | 3.16712×10⁻⁵ | 3.17×10⁻⁵ (0.0032%) |
| 4.5 | 3.39767×10⁻⁶ | 3.40×10⁻⁶ (0.0003%) |

The page note suggests memorizing three levels first: β=2.0 → 2.28%; β=3.0 → 0.135%; β=4.0 → 3.17×10⁻⁵.

---

## 12. Page display precision and numerical cross-check

### 12.1 Display digits

| Position | β | Pf |
|---|---|---|
| Right result card | 3 decimal places (2.108) | 3 decimal places (1.750%) |
| Right "method comparison" table | 3 (2.108) | default 2 (1.75%); 3 when less than 1% (0.135%) |
| Station 0 result cards / bar charts | 3 (1.664) | 2 (4.80% / 1.75% / 1.65% / 1.63% / 1.62%) |
| Station 8 formula-card comparison table | 3 (2.108) | 3 (4.805% / 1.750% / 1.647% / 1.628% / 1.623%) |
| Station 5/4 iteration tables | 3 (2.108) | — (shows g) |

### 12.2 Actual rendered values (default parameters, headless-browser measurement)

"Method comparison" table:

| Method | β | Pf |
|---|---|---|
| MVFOSM (mean point) | 1.664 | 4.80% |
| AFOSM (X space ≡) | 2.108 | 1.75% |
| FORM (U space ≡) | 2.108 | 1.75% |
| SORM (curvature) | 2.108 | 1.65% |
| MC (reference N=4×10⁶) | — | 1.63% |
| Exact (integration) | — | 1.62% |

Station 8 formula-card comparison table (including relative errors):

| Method | β | Pf | Pf relative error |
|---|---|---|---|
| MVFOSM | 1.664 | 4.805% | +196.1% |
| AFOSM | 2.108 | 1.750% | +7.9% |
| FORM | 2.108 | 1.750% | +7.9% |
| SORM | 2.108 | 1.647% | +1.5% |
| MC (reference N=4×10⁶) | — | 1.628% | +0.3% |
| Exact | — | 1.623% | +0.0% |

The default station 0 result card shows FORM: β=2.108, Pf=1.750%, reliability=98.250%. The station 8 result card shows "Exact integration": β=2.108 (borrowed from the FORM design point), Pf=1.623% (the exact value).

### 12.3 Last-digit differences between the page (JS) and the Python baseline

Two independent implementations; the differences all come from "the approximation of Φ" and "HLRF refinement" and do not affect display:

| Quantity | Python | Page JS | Absolute difference |
|---|---|---|---|
| MVFOSM Pf | 0.0480461647 | 0.0480461435 | 2.1×10⁻⁸ |
| FORM Pf | 0.0175008089 | 0.0175007467 | 6.2×10⁻⁸ |
| SORM Pf | 0.0164708180 | 0.0164707643 | 5.4×10⁻⁸ |
| R/S−1 MVFOSM Pf | 0.0187570008 | 0.0187569356 | 6.5×10⁻⁸ |
| Exact Pf | 0.0162262963 | 0.0162263005 | 4.2×10⁻⁹ |
| FORM β | 2.1083396823 | 2.1083396826 | 3×10⁻¹⁰ |
| SORM κ | 0.0611756786 | 0.0611753654 | 3.1×10⁻⁷ |

Causes:

1. The page's `math.js` uses the Abramowitz–Stegun 26.2.17 approximation of Φ (absolute error < 7.5×10⁻⁸), while Python uses `math.erf`; all Pf differences are ≤ 7×10⁻⁸.
2. The page HLRF refines up to 6 more steps after convergence, so u*, x* differ from Python in the last digits by 10⁻⁵–10⁻⁴, and β differs by only 10⁻¹⁰.
3. SORM's κ is computed from the Hessian projection at the design point; last-digit differences in the design point propagate to a 3×10⁻⁷ difference in κ.

Conclusion: **at 3-decimal display the two implementations are fully identical**; the self-test tolerances (10⁻¹²–10⁻⁵) cover the differences above.

### 12.4 Station 9 tangent-error case (β=2.108, κ=0.5)

Standard normal in U space, same design point `(β,0)`, comparing four failure domains:

| Failure domain | Pf | Equivalent β | Pf relative to linear | β error |
|---|---:|---:|---:|---:|
| Linear (half-space `u1>β`) | 1.752% | 2.108 | 0.0% | 0.000 |
| Convex (`u1>β+κu2²/2`) | 1.154% | 2.272 | −34.1% | +0.164 |
| Concave (`u1>β−κu2²/2`) | 4.193% | 1.729 | +139.4% | −0.379 |
| Outside circle (extreme `r>β`) | 10.841% | 1.235 | +518.9% | −0.873 |

- Linear: `Pf=Φ(−β)`; convex/concave: 400-segment Simpson numerical integration over `u2`: `∫φ(u2)Φ(−(β±κu2²/2))du2`; extreme: `Pf=exp(−β²/2)`.
- The extreme case is "the failure domain is outside the density contour": β is still 2.108, but Pf changes from 1.752% to 10.841% and the equivalent β is only 1.235 — the straight-line tangent underestimates Pf by about 6.2 times.
- Page implementation: `tangentErrorCase(beta,kappa)` in `src/js/model.js`; the interaction is via the β/κ sliders on station 9.

---

## 13. Self-test checklist (20 items)

The page's "Help → Run numerical self-test" and `?selftest=1` call the same set of assertions (`Model.selfTest()`); `node tests/test_math.js` also prints `20/20 passed` at the end. Currently 20/20 pass:

| # | Group | Check item | Criterion (tolerance) |
|---|---|---|---|
| 1 | Basics | Φ(0)=0.5 | \|Φ(0)−0.5\| < 10⁻⁸ |
| 2 | Basics | Φ(−1)=0.158655 | difference from 0.1586552539 < 10⁻⁷ |
| 3 | Basics | Φ(−2.10834)=1.7501% | difference from 0.0175008089 < 2×10⁻⁷ |
| 4 | Transformation | Cholesky L11=2 | < 10⁻¹² |
| 5 | Transformation | Cholesky L22=√18.75 | < 10⁻¹² |
| 6 | MVFOSM | β=1.66410 | difference from 1.6641005887 < 10⁻⁷ |
| 7 | MVFOSM | Pf=4.8046% | difference from 0.04804616 < 10⁻⁷ |
| 8 | HLRF | β=2.10834 | difference from 2.1083396823 < 10⁻⁷ |
| 9 | HLRF | u₁*=−1.92808 | difference from −1.92808099 < 10⁻⁷ |
| 10 | HLRF | u₂*=0.852995 | difference from 0.85299468 < 10⁻⁷ |
| 11 | HLRF | x₁*=6.14384 | difference from 6.143838 < 10⁻⁵ |
| 12 | HLRF | x₂*=18.87337 | difference from 18.873373 < 10⁻⁵ |
| 13 | FORM | Pf=1.7501% | difference from 0.0175008089 < 2×10⁻⁷ |
| 14 | Transformation | β unchanged under PCA | difference from FORM β < 10⁻¹⁰ |
| 15 | SORM | κ=0.061176 | difference from 0.06117568 < 10⁻⁶ |
| 16 | SORM | Pf=1.64708% | difference from 0.01647082 < 10⁻⁷ |
| 17 | Exact | Pf=1.62263% | difference from 0.0162263 < 5×10⁻⁶ |
| 18 | R−S | β=3.000 | difference from 3 < 10⁻¹² |
| 19 | R/S−1 | MVFOSM β=2.08013 | difference from 2.0801257358 < 10⁻⁷ |
| 20 | Form | ratio form of the main example β=1.71429 | difference from 1.7142857143 < 10⁻⁷ |

---

## 14. Recomputation commands and expected output

Local verification environment: Python 3.11.15 + numpy 2.4.6; Node.js v24.19.0; Chrome 157 (Windows).

### 14.1 `python reference_values.py` (Python baseline)

Expected key lines (values should match the table below):

```
[MVFOSM]  mu_g=60.000000  sigma_g=36.055513  beta=1.6641005887  Pf=4.804616e-02
[HLRF]    iterations = 6
  u* = (-1.9280859828, 0.8529833871), beta = 2.1083396823
  x* = (6.1438280344, 18.8733114542), g(x*) = 7.647e-09
  alpha = [-0.91450443  0.40457588]
  Pf_FORM = 1.7500808901e-02
[SORM]    kappa = 0.0611756786 (fd 0.0611754120); beta*kappa = 0.128979
          Pf_FORM = 1.7500808901e-02; Pf_SORM = 1.6470818041e-02
[EXACT]   Pf (conditional 1-D integration) = 1.6226296294e-02
[MC]      N=4,000,000  Pf=1.6280250000e-02  se=6.328e-05  COV=0.39%
[IS]      N=200,000  Pf=1.6084244369e-02  se=5.715e-05  COV=0.36%
```

The script also prints a 7-row HLRF iteration table, the ρ sweep table, and R−S / R/S−1's β=3.0000000000 and 2.0801257358.

Note: the script uses `numpy.trapezoid` (the new name in numpy ≥ 2.0); on an older numpy, change that line to `numpy.trapz` before running. The 4×10⁶ MC takes some runtime.

### 14.2 `node tests/test_math.js` (Node tests)

Expected at the end of the output:

```
--- SELF TEST ---
PASS …（20 lines, all PASS）
20/20 passed
--- MC --- { n: 1000000, fails: 16334, pf: 0.016334, … }
```

Note: the last line's 1,000,000-sample MC uses JS random numbers (seed 20261119) and is only a kernel sanity check, not the 4M reference value of section 7.

### 14.3 Page self-test

Open `structural-reliability-lab.html?selftest=1` in the browser; the "Help" dialog should pop up automatically and show **20 / 20 passed**; you can also click "Help → Run numerical self-test".

### 14.4 Rebuild

`python tools/build.py` → generates `dist/structural-reliability-lab.html` and copies it to the repository root; the build script checks whether external CSS/JS references remain (there should be none).
