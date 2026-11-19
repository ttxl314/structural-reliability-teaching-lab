# Structural Reliability Method Comparison Lab · Formulas by Module

[Chinese original](zh/formulas_by_module.md)

> Purpose: map the "numbers on screen" of each station to formulas, computation order, and reference code.  
> Reference code is in `code/`; page runtime source is in `src/js/`; independent verification is in `docs/verification_report.md`.

## 0. Shared notation and default parameters

Main example:

\[
g(X_1,X_2)=X_1^2-2X_2,\qquad \text{failure domain }X_2>\frac{X_1^2}{2}
\]

\[
X_1\sim N(10,2),\quad X_2\sim N(20,5),\quad \rho=0.5
\]

Covariance matrix:

\[
C=\begin{bmatrix}\sigma_1^2&\rho\sigma_1\sigma_2\\ \rho\sigma_1\sigma_2&\sigma_2^2\end{bmatrix}
=\begin{bmatrix}4&5\\5&25\end{bmatrix}
\]

The page uniformly uses the Cholesky transform:

\[
C=LL^T,\qquad
L=\begin{bmatrix}\sigma_1&0\\ \rho\sigma_2&\sigma_2\sqrt{1-\rho^2}\end{bmatrix}
=\begin{bmatrix}2&0\\2.5&4.330127\end{bmatrix}
\]

\[
X=\mu+LU,\qquad U=L^{-1}(X-\mu),\qquad \|U\|=\beta
\]

**Code**: `code/shared/math.js`, `code/shared/example.js`; page `src/js/math.js`, `src/js/model.js`.

---

## 1. Station 0 · Overview

The overview introduces no new formulas; it only aggregates the MVFOSM / FORM / SORM / MC / exact results of the main example.  
The page cards, the overview β/Pf bars, and the right-panel comparison table all draw from the same `app.main`, so that "two sets of numbers" cannot appear.

**Code**: `code/00_overview.js`.  
**Display**: `#methodCards`, `#pfBars`, `#compareTable`.

---

## 2. Station 1 · Variables and transformations

### 2.1 Four affine steps

\[
Y=X-\mu,\qquad Z=D^{-1}Y,\qquad U=L^{-1}Y
\]

where \(D=\operatorname{diag}(\sigma_1,\sigma_2)\).

Matrix form (right-hand card `[A|b]`):

\[
Y=\begin{bmatrix}1&0\\0&1\end{bmatrix}X-\mu,\quad
Z=\begin{bmatrix}1/\sigma_1&0\\0&1/\sigma_2\end{bmatrix}Y,\quad
U=L^{-1}Y
\]

### 2.2 Iso-probability ellipses / β-circles

\[
X(\theta)=\mu+rL\begin{bmatrix}\cos\theta\\ \sin\theta\end{bmatrix}
\]

After whitening, \(U=r[\cos\theta,\sin\theta]\); iso-probability lines become circles with radius \(r=\beta\).  
The design point \(x^*\) coincides with the tangent point of the β-ellipse; the FORM tangent line is drawn at \(x^*\).

**Code**: `code/01_transform.js`.  
**Display**: `#transCanvas`, `#transformMatrix`, `#transformFormula`.

---

## 3. Station 2 · Probability interference

R and S independent normal, \(g=R-S\):

\[
\beta=\frac{\mu_R-\mu_S}{\sqrt{\sigma_R^2+\sigma_S^2}},\qquad P_f=\Phi(-\beta)
\]

Failure probability density:

\[
h(s)=f_S(s)F_R(s),\qquad P_f=\int h(s)\,ds
\]

Note: the **density overlap area** of \(f_R\) and \(f_S\) is **not** \(P_f\).

Default parameters \(\mu_R=30,\mu_S=15,\sigma_R=4,\sigma_S=3\):

\[
\beta=3.000,\qquad P_f=\Phi(-3)=0.135\%
\]

**Code**: `code/02_interference.js`.  
**Display**: `#intfCanvas`, `#intfFormula`, `#intfTable`.

---

## 4. Station 3 · Mean-value first-order second-moment (MVFOSM)

First-order Taylor expansion at the mean point \(\mu\):

\[
g(X)\approx g(\mu)+\nabla g(\mu)^T(X-\mu)
\]

\[
\sigma_g^2=\nabla g^T C\nabla g
=g_1^2\sigma_1^2+g_2^2\sigma_2^2+2g_1g_2\rho\sigma_1\sigma_2
\]

\[
\beta=\frac{g(\mu)}{\sigma_g},\qquad P_f\approx\Phi(-\beta)
\]

Default parameters:

\[
g(\mu)=60,\quad \nabla g(\mu)=(20,-2),\quad \sigma_g=36.0555
\]

\[
\beta=1.6641,\quad P_f=4.8046\%
\]

Foot of the perpendicular from the origin to the mean-point tangent line:

\[
\nabla g_U=L^T\nabla g,\quad
U_L=-\frac{g(\mu)}{\|\nabla g_U\|^2}\nabla g_U,\quad
X_L=\mu+LU_L
\]

**Code**: `code/03_mvfosm.js`.  
**Display**: `#mvfosmXCanvas`, `#mvfosmUCanvas`, `#mvfosmFormula`, `#compareTable`.

---

## 5. Station 4 · AFOSM / design-point method

Directional search in X space:

1. At the current point \(x_k\), compute \(\nabla g(x_k)\);
2. Transform to U: \(g_u=L^T\nabla g\);
3. Direction \(\alpha=-g_u/\|g_u\|\), ray in X space \(x(\beta)=\mu+\beta L\alpha\);
4. Solve \(g(x(\beta))=0\) along the ray to obtain the new \(\beta\);
5. Recompute \(\alpha\) from the new point until \(\beta\) and \(g\) converge.

Under normal variables it converges to the same design point as FORM:

\[
\beta=2.10834,\quad x^*=(6.14384,18.87337),\quad P_f=1.7501\%
\]

**Code**: `code/04_afosm.js` (includes `solveBeta` scan + bisection).  
**Display**: `#afosmCanvas`, `#afTable`, `#afFormula`.

---

## 6. Station 5 · FORM / HLRF

Iteration in U space:

\[
x_k=\mu+Lu_k,\quad g_k=g(x_k),\quad g_{u,k}=L^T\nabla g(x_k)
\]

\[
u_{k+1}=
\frac{g_{u,k}^Tu_k-g_k}{\|g_{u,k}\|^2}g_{u,k}
\]

After convergence:

\[
\beta=\|u^*\|,\quad x^*=\mu+Lu^*,\quad P_f\approx\Phi(-\beta)
\]

Default parameters, 6 iterations:

\[
\beta=2.10834,\quad u^*=(-1.92808,0.85299)
\]

\[
x^*=(6.14384,18.87337),\quad P_f=1.7501\%
\]

**Code**: `code/05_form_hlrf.js`.  
**Display**: `#formCanvas`, `#formTable`, `#formFormula`, `#alphaBars`.

---

## 7. Station 6 · SORM (Breitung)

Take the Hessian at the FORM design point \(x^*\):

\[
H_u=L^TH_xL,\qquad
n=\frac{g_u}{\|g_u\|},\qquad
e=(-n_2,n_1)
\]

\[
\kappa=\frac{e^TH_ue}{\|g_u\|}
\]

\[
P_{f,\mathrm{SORM}}=\frac{P_{f,\mathrm{FORM}}}{\sqrt{1+\beta\kappa}}
\]

Default parameters:

\[
\kappa=0.061176,\quad \beta\kappa=0.1290,\quad \text{factor}=0.941146
\]

\[
P_{f,\mathrm{SORM}}=1.6471\%
\]

**Code**: `code/06_sorm.js`.  
**Display**: `#sormCanvas`, `#sormFormula`, `#sormBars`.

---

## 8. Station 7 · Monte Carlo

Sampling:

\[
U_i\sim N(0,I),\quad X_i=\mu+LU_i
\]

Estimation:

\[
\hat P_f=\frac{N_f}{N},\qquad
se=\sqrt{\frac{\hat P_f(1-\hat P_f)}{N}},\qquad
CI_{95\%}\approx1.96se
\]

Equivalent reliability index:

\[
\hat\beta=-\Phi^{-1}(\hat P_f)
\]

Fixed seed `20261119`; page sampling limit \(10^5\).

**Code**: `code/07_monte_carlo.js`.  
**Display**: `#mcCanvas`, `#mcChart`, `#mcStats`, `#mcTable`.

---

## 9. Station 8 · Formula card and conversions

Half-space/linear boundary, normal variables:

\[
P_f=\Phi(-\beta),\qquad \beta=-\Phi^{-1}(P_f)
\]

For nonlinear cases this is only an "equivalent conversion", not an exact relation.  
The formula card also aggregates the formulas and comparison table of MVFOSM / FORM / SORM / MC.

**Code**: `code/08_formulas.js`; page `src/js/formulas.js` (generated at build time), `src/js/ui.js`.

---

## 10. Station 9 · All methods in one figure and tangent error

Same design point \(\beta\), different boundary shapes:

\[
\text{linear: }u_1=\beta,\qquad
\text{convex: }u_1=\beta+\frac{\kappa u_2^2}{2},\qquad
\text{concave: }u_1=\beta-\frac{\kappa u_2^2}{2}
\]

\[
\text{outside circle (extreme): }r=\beta
\]

\[
P_{f,\text{linear}}=\Phi(-\beta)
\]

\[
P_{f,\text{convex/concave}}=\int \varphi(u_2)\Phi\left[-\left(\beta\pm\frac{\kappa u_2^2}{2}\right)\right]du_2
\]

\[
P_{f,\text{outside circle}}=P(\chi_2^2>\beta^2)=e^{-\beta^2/2}
\]

Default \(\beta=2.108,\kappa=0.5\):

| Failure domain | Pf | Equivalent β |
|---|---:|---:|
| Linear | 1.752% | 2.108 |
| Convex | 1.154% | 2.272 |
| Concave | 4.193% | 1.729 |
| Outside circle | 10.841% | 1.235 |

**Code**: `code/09_tangent_error.js`.  
**Display**: `#allMethodsCanvas`, `#tanCanvas`, `#tanTable`.

---

## 11. Station 10 · Custom function

Input \(g(x_1,x_2)\), under normal + correlated variables:

1. Recursive-descent parse of the expression (no `eval`);
2. Central differences for \(\nabla g\) and \(H_x\);
3. Call the same MVFOSM / HLRF / SORM / MC method set;
4. Grid-based marching squares to draw \(g=0\), scanline fill for \(g<0\).

An arbitrary function has no analytical exact value; FORM/SORM are numerical approximations and MC is the reference.

**Code**: `code/10_custom_function.js`; page `src/js/custom.js`.  
**Display**: `#customCanvas`, `#customTable`, right panel `#resBeta/#resPf`.

---

## 12. Displayed values and rounding

- `β`: 3 decimal places; `Pf`: usually 3, comparison table 2;
- The page's `Φ` uses the A&S approximation (absolute error about \(7.5\times10^{-8}\)), and agrees with the Python baseline at 3-decimal display;
- MC is a random quantity; a fixed seed makes it reproducible, and the 95% CI describes the sampling error;
- Station 9's linear case uses the displayed value \(\beta=2.108\), hence displays 1.752%, slightly different from the 1.750% of full-precision 2.10834; this is input rounding, not a computation error;
- Station 10's custom functions use finite differences, so the last 2–3 digits may vary with the function scale.
