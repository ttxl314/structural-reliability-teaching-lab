"""Reference implementation of structural reliability methods (Python 3, standard library only, no third-party dependencies).

Includes:
  - normal PDF/CDF/inverse CDF
  - 2x2 covariance, Cholesky, X<->U
  - MVFOSM
  - AFOSM (direction search)
  - FORM / HLRF
  - SORM (Breitung)
  - Monte Carlo
  - R-S probability interference, h(s)
  - tangent-error cases
  - numerical gradient/Hessian for a custom g

Default main example: g(X)=X1^2-2*X2
  X1~N(10,2), X2~N(20,5), rho=0.5
"""

from __future__ import annotations

import math
import random
from typing import Callable, Dict, List, Sequence, Tuple

SQRT2 = math.sqrt(2.0)
SQRT2PI = math.sqrt(2.0 * math.pi)


# ---------------------------------------------------------------------------
# 1. Math utilities
# ---------------------------------------------------------------------------
def norm_pdf(z: float) -> float:
    return math.exp(-0.5 * z * z) / SQRT2PI


def norm_cdf(z: float) -> float:
    # 0.5*erfc(-z/sqrt2) is more accurate than the Abramowitz-Stegun approximation
    return 0.5 * math.erfc(-z / SQRT2)


def norm_inv(p: float) -> float:
    """Acklam inverse-normal approximation; p in (0,1)."""
    if p <= 0:
        return -math.inf
    if p >= 1:
        return math.inf
    a = [-3.969683028665376e+01, 2.209460984245205e+02,
         -2.759285104469687e+02, 1.383577518672690e+02,
         -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02,
         -1.556989798598866e+02, 6.680131188771972e+01,
         -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01,
         -2.400758277161838e+00, -2.549732539343734e+00,
         4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01,
         2.445134137142996e+00, 3.754408661907416e+00]
    plow, phigh = 0.02425, 1.0 - 0.02425
    if p < plow:
        q = math.sqrt(-2.0 * math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
    if p > phigh:
        q = math.sqrt(-2.0 * math.log(1.0 - p))
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
                ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / \
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)


def cov(p: Dict[str, float]) -> List[List[float]]:
    return [[p["s1"] ** 2, p["rho"] * p["s1"] * p["s2"]],
            [p["rho"] * p["s1"] * p["s2"], p["s2"] ** 2]]


def cholesky(C: Sequence[Sequence[float]]) -> List[List[float]]:
    l11 = math.sqrt(C[0][0])
    l21 = C[1][0] / l11
    l22 = math.sqrt(max(0.0, C[1][1] - l21 * l21))
    return [[l11, 0.0], [l21, l22]]


def mat_vec(A, x):
    return [A[0][0] * x[0] + A[0][1] * x[1],
            A[1][0] * x[0] + A[1][1] * x[1]]


def transpose(A):
    return [[A[0][0], A[1][0]], [A[0][1], A[1][1]]]


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1]


def norm(a):
    return math.sqrt(dot(a, a))


def add(a, b):
    return [a[0] + b[0], a[1] + b[1]]


def sub(a, b):
    return [a[0] - b[0], a[1] - b[1]]


def scale(a, s):
    return [a[0] * s, a[1] * s]


def mat_mul(A, B):
    return [[A[0][0] * B[0][0] + A[0][1] * B[1][0],
             A[0][0] * B[0][1] + A[0][1] * B[1][1]],
            [A[1][0] * B[0][0] + A[1][1] * B[1][0],
             A[1][0] * B[0][1] + A[1][1] * B[1][1]]]


# ---------------------------------------------------------------------------
# 2. Main example and transform
# ---------------------------------------------------------------------------
DEFAULT_P = {"mu1": 10.0, "mu2": 20.0, "s1": 2.0, "s2": 5.0, "rho": 0.5}


def parabola_example():
    def g(x):
        return x[0] * x[0] - 2.0 * x[1]

    def grad(x):
        return [2.0 * x[0], -2.0]

    def hess(x):
        return [[2.0, 0.0], [0.0, 0.0]]

    return {"g": g, "grad": grad, "hess": hess}


def transform(p=None):
    p = dict(DEFAULT_P if p is None else p)
    C = cov(p)
    L = cholesky(C)
    mu = [p["mu1"], p["mu2"]]

    def to_x(u):
        return add(mu, mat_vec(L, u))

    def to_u(x):
        d = sub(x, mu)
        u1 = d[0] / L[0][0]
        u2 = (d[1] - L[1][0] * u1) / L[1][1]
        return [u1, u2]

    return {"p": p, "C": C, "L": L, "mu": mu, "toX": to_x, "toU": to_u}


# ---------------------------------------------------------------------------
# 3. MVFOSM
# ---------------------------------------------------------------------------
def mvfosm(ex=None, p=None):
    ex = parabola_example() if ex is None else ex
    p = dict(DEFAULT_P if p is None else p)
    mu = [p["mu1"], p["mu2"]]
    C = cov(p)
    g0 = ex["g"](mu)
    grad = ex["grad"](mu)
    var_g = (grad[0] ** 2 * C[0][0] + grad[1] ** 2 * C[1][1]
             + 2.0 * grad[0] * grad[1] * C[0][1])
    sigma_g = math.sqrt(max(0.0, var_g))
    beta = g0 / sigma_g
    T = transform(p)
    gu = mat_vec(transpose(T["L"]), grad)
    u_l = scale(gu, -g0 / dot(gu, gu))
    x_l = add(mu, mat_vec(T["L"], u_l))
    return {"g0": g0, "grad": grad, "sigmaG": sigma_g, "beta": beta,
            "pf": norm_cdf(-beta), "uL": u_l, "xL": x_l, "varG": var_g}


# ---------------------------------------------------------------------------
# 4. AFOSM: X-space direction search
# ---------------------------------------------------------------------------
def solve_beta(ex, mu, d, max_beta=60.0, step=0.02):
    f = lambda b: ex["g"]([mu[0] + b * d[0], mu[1] + b * d[1]])
    if not (f(0.0) > 0):
        return math.nan, "mean-failure"
    prev = 0.0
    b = step
    while b <= max_beta + 1e-12:
        if f(b) <= 0:
            lo, hi = prev, b
            for _ in range(80):
                mid = 0.5 * (lo + hi)
                if f(mid) > 0:
                    lo = mid
                else:
                    hi = mid
            return 0.5 * (lo + hi), None
        prev = b
        b += step
    return math.nan, "no-crossing"


def afosm(ex=None, p=None, maxit=20, tol=1e-8):
    ex = parabola_example() if ex is None else ex
    p = dict(DEFAULT_P if p is None else p)
    T = transform(p)
    L, mu = T["L"], T["mu"]
    x = list(mu)
    beta = 0.0
    for _ in range(maxit):
        gu = mat_vec(transpose(L), ex["grad"](x))
        ng = norm(gu)
        if not (ng > 1e-14):
            return {"beta": math.nan, "reason": "bad-gradient"}
        alpha = scale(gu, -1.0 / ng)
        d = mat_vec(L, alpha)
        beta_new, reason = solve_beta(ex, mu, d)
        if not math.isfinite(beta_new):
            return {"beta": math.nan, "reason": reason}
        x = add(mu, scale(d, beta_new))
        done = abs(beta_new - beta) < tol and abs(ex["g"](x)) < 1e-8
        beta = beta_new
        if done:
            break
    gu = mat_vec(transpose(L), ex["grad"](x))
    alpha = scale(gu, -1.0 / norm(gu))
    return {"beta": beta, "pf": norm_cdf(-beta), "xStar": x,
            "uStar": scale(alpha, beta), "alpha": alpha}


# ---------------------------------------------------------------------------
# 5. FORM / HLRF
# ---------------------------------------------------------------------------
def hlr(ex=None, p=None, maxit=30, tol=1e-8):
    ex = parabola_example() if ex is None else ex
    p = dict(DEFAULT_P if p is None else p)
    T = transform(p)
    L, mu = T["L"], T["mu"]
    u = [0.0, 0.0]
    history = []
    for k in range(maxit):
        x = add(mu, mat_vec(L, u))
        g = ex["g"](x)
        gu = mat_vec(transpose(L), ex["grad"](x))
        history.append({"k": k, "u": list(u), "x": x, "g": g,
                        "beta": norm(u)})
        if abs(g) < tol and k > 0:
            break
        den = dot(gu, gu)
        u = scale(gu, (dot(gu, u) - g) / den)
    # Refinement
    for _ in range(6):
        x = add(mu, mat_vec(L, u))
        g = ex["g"](x)
        if abs(g) < 1e-14:
            break
        gu = mat_vec(transpose(L), ex["grad"](x))
        u = scale(gu, (dot(gu, u) - g) / dot(gu, gu))
    beta = norm(u)
    x_star = add(mu, mat_vec(L, u))
    alpha = scale(u, 1.0 / beta) if beta > 0 else [0.0, 0.0]
    return {"uStar": u, "xStar": x_star, "beta": beta,
            "pf": norm_cdf(-beta), "alpha": alpha,
            "history": history}


# ---------------------------------------------------------------------------
# 6. SORM / Breitung
# ---------------------------------------------------------------------------
def sorm(ex=None, p=None, form=None):
    ex = parabola_example() if ex is None else ex
    p = dict(DEFAULT_P if p is None else p)
    form = hlr(ex, p) if form is None else form
    T = transform(p)
    L = T["L"]
    x = form["xStar"]
    gx = ex["grad"](x)
    Hx = ex["hess"](x)
    gu = mat_vec(transpose(L), gx)
    Hu = mat_mul(mat_mul(transpose(L), Hx), L)
    nrm = norm(gu)
    n = scale(gu, 1.0 / nrm)
    e = [-n[1], n[0]]
    kappa = dot(e, mat_vec(Hu, e)) / nrm
    denom = 1.0 + form["beta"] * kappa
    factor = 1.0 / math.sqrt(denom) if denom > 1e-12 else 1.0
    return {"kappa": kappa, "betaKappa": form["beta"] * kappa,
            "factor": factor, "pf": form["pf"] * factor,
            "valid": denom > 0}


# ---------------------------------------------------------------------------
# 7. Monte Carlo
# ---------------------------------------------------------------------------
def monte_carlo(ex=None, p=None, n=100000, seed=20261119):
    ex = parabola_example() if ex is None else ex
    p = dict(DEFAULT_P if p is None else p)
    T = transform(p)
    L, mu = T["L"], T["mu"]
    rng = random.Random(seed)
    fails = 0
    for _ in range(n):
        z1, z2 = rng.gauss(0.0, 1.0), rng.gauss(0.0, 1.0)
        x1 = mu[0] + L[0][0] * z1
        x2 = mu[1] + L[1][0] * z1 + L[1][1] * z2
        if ex["g"]([x1, x2]) < 0:
            fails += 1
    pf = fails / n
    se = math.sqrt(max(0.0, pf * (1.0 - pf) / n))
    beta = -norm_inv(pf) if 0.0 < pf < 1.0 else math.nan
    return {"n": n, "fails": fails, "pf": pf, "se": se,
            "ci": 1.96 * se, "beta": beta}


# ---------------------------------------------------------------------------
# 8. R-S interference
# ---------------------------------------------------------------------------
DEFAULT_RS = {"muR": 30.0, "muS": 15.0, "sR": 4.0, "sS": 3.0}


def interference(p=None):
    p = dict(DEFAULT_RS if p is None else p)
    beta = (p["muR"] - p["muS"]) / math.sqrt(p["sR"] ** 2 + p["sS"] ** 2)
    return {"p": p, "beta": beta, "pf": norm_cdf(-beta)}


def failure_density(s, p=None):
    p = dict(DEFAULT_RS if p is None else p)
    fS = norm_pdf((s - p["muS"]) / p["sS"]) / p["sS"]
    FR = norm_cdf((s - p["muR"]) / p["sR"])
    return fS * FR


def integrate_h(p=None, lo=-20.0, hi=80.0, n=4000):
    p = dict(DEFAULT_RS if p is None else p)
    if n % 2:
        n += 1
    h = (hi - lo) / n
    s = failure_density(lo, p) + failure_density(hi, p)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * failure_density(lo + i * h, p)
    return s * h / 3.0


# ---------------------------------------------------------------------------
# 9. Tangent-error cases
# ---------------------------------------------------------------------------
def _simpson(fn, lo=-12.0, hi=12.0, n=4000):
    if n % 2:
        n += 1
    h = (hi - lo) / n
    s = fn(lo) + fn(hi)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * fn(lo + i * h)
    return s * h / 3.0


def tangent_error(beta=2.108, kappa=0.5):
    linear = norm_cdf(-beta)
    convex = _simpson(lambda u2: norm_pdf(u2) *
                      norm_cdf(-(beta + kappa * u2 * u2 / 2.0)))
    concave = _simpson(lambda u2: norm_pdf(u2) *
                       norm_cdf(-(beta - kappa * u2 * u2 / 2.0)))
    extreme = math.exp(-0.5 * beta * beta)

    def beta_eq(pf):
        return -norm_inv(max(1e-12, min(1.0 - 1e-12, pf)))

    return {"beta": beta, "kappa": kappa, "linear": linear,
            "convex": convex, "concave": concave, "extreme": extreme,
            "betaLinear": beta, "betaConvex": beta_eq(convex),
            "betaConcave": beta_eq(concave), "betaExtreme": beta_eq(extreme)}


# ---------------------------------------------------------------------------
# 10. Numerical gradient/Hessian for a custom g + algorithms
# ---------------------------------------------------------------------------
def numeric_gradient(g: Callable, x: Sequence[float]):
    x = list(x)
    out = []
    for i in range(2):
        h = max(1e-5, abs(x[i]) * 1e-4)
        xp, xm = list(x), list(x)
        xp[i] += h
        xm[i] -= h
        out.append((g(xp) - g(xm)) / (2.0 * h))
    return out


def numeric_hessian(g: Callable, x: Sequence[float]):
    x = list(x)
    h1 = max(1e-4, abs(x[0]) * 2e-4)
    h2 = max(1e-4, abs(x[1]) * 2e-4)
    f0 = g(x)
    fxx = (g([x[0] + h1, x[1]]) - 2.0 * f0 + g([x[0] - h1, x[1]])) / (h1 * h1)
    fyy = (g([x[0], x[1] + h2]) - 2.0 * f0 + g([x[0], x[1] - h2])) / (h2 * h2)
    fxy = (g([x[0] + h1, x[1] + h2]) - g([x[0] + h1, x[1] - h2])
           - g([x[0] - h1, x[1] + h2]) + g([x[0] - h1, x[1] - h2])) / (4.0 * h1 * h2)
    return [[fxx, fxy], [fxy, fyy]]


def custom_compute(g: Callable, p=None, n=100000):
    ex = {"g": g, "grad": lambda x: numeric_gradient(g, x),
          "hess": lambda x: numeric_hessian(g, x)}
    p = dict(DEFAULT_P if p is None else p)
    form = hlr(ex, p, 45, 1e-7)
    return {"mv": mvfosm(ex, p), "form": form,
            "sorm": sorm(ex, p, form),
            "mc": monte_carlo(ex, p, n)}


if __name__ == "__main__":
    print("Run python/run_all.py; reliability.py is a module.")
