"""Reference values for the reliability teaching page.

Main example (same as the existing figures):
    g(X) = X1^2 - 2*X2
    X1 ~ N(10, 2), X2 ~ N(20, 5), rho_12 = 0.5
Units: X2 = X1^2 / 2 is the limit state surface.

Only numpy + math are used, so the same formulas can be ported to JS.
"""

import math

import numpy as np

# ---------------------------------------------------------------- basics
SQ3 = math.sqrt(3.0)


def ncdf(z):
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def npdf(z):
    return math.exp(-0.5 * z * z) / math.sqrt(2.0 * math.pi)


def phi_inv(p):
    """Acklam's rational approximation, |rel err| < 1.2e-9."""
    a = [-3.969683028665376e01, 2.209460984245205e02, -2.759285104469687e02,
         1.383577518672690e02, -3.066479806614716e01, 2.506628277459239e00]
    b = [-5.447609879822406e01, 1.615858368580409e02, -1.556989798598866e02,
         6.680131188771972e01, -1.328068155288572e01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e00,
         -2.549732539343734e00, 4.374664141464968e00, 2.938163982698783e00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e00,
         3.754408661907416e00]
    plow, phigh = 0.02425, 1 - 0.02425
    if p < plow:
        q = math.sqrt(-2 * math.log(p))
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    if p > phigh:
        q = math.sqrt(-2 * math.log(1 - p))
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / \
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    q = p - 0.5
    r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / \
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)


# ---------------------------------------------------------------- main data
MU = np.array([10.0, 20.0])
SIG = np.array([2.0, 5.0])
RHO = 0.5


def g(x):
    return x[0] ** 2 - 2.0 * x[1]


def grad_g(x):
    return np.array([2.0 * x[0], -2.0])


def g_u(u, mu=MU, sig=SIG, rho=RHO):
    """Limit state in U space with Cholesky whitening."""
    c = rho * sig[0] * sig[1]
    x1 = mu[0] + sig[0] * u[0]
    x2 = mu[1] + c / sig[0] * u[0] + math.sqrt(sig[1] ** 2 - c ** 2 / sig[0] ** 2) * u[1]
    return x1 ** 2 - 2.0 * x2


def grad_g_u(u, mu=MU, sig=SIG, rho=RHO):
    c = rho * sig[0] * sig[1]
    l21 = c / sig[0]
    l22 = math.sqrt(sig[1] ** 2 - l21 ** 2)
    x1 = mu[0] + sig[0] * u[0]
    # dg/dx = [2 x1, -2]; dx/du = [[s1, 0], [l21, l22]]
    return np.array([2.0 * x1 * sig[0] + (-2.0) * l21, -2.0 * l22])


def hlr(u0=None, mu=MU, sig=SIG, rho=RHO, tol=1e-8, maxit=30):
    u = np.zeros(2) if u0 is None else np.array(u0, dtype=float)
    hist = []
    for _ in range(maxit):
        gu = g_u(u, mu, sig, rho)
        gr = grad_g_u(u, mu, sig, rho)
        hist.append((u.copy(), gu, float(np.linalg.norm(u)), gr.copy()))
        if abs(gu) < tol and len(hist) > 1:
            break
        u = ((gr @ u - gu) / (gr @ gr)) * gr
    return u, hist


# ---------------------------------------------------------------- MVFOSM
def mvfosm_parabola():
    mu_g = g(MU)
    gr = grad_g(MU)
    var_g = gr[0] ** 2 * SIG[0] ** 2 + gr[1] ** 2 * SIG[1] ** 2 + \
        2 * gr[0] * gr[1] * RHO * SIG[0] * SIG[1]
    beta = mu_g / math.sqrt(var_g)
    return beta, mu_g, math.sqrt(var_g), gr


# ---------------------------------------------------------------- exact Pf
def exact_pf(mu=MU, sig=SIG, rho=RHO, n=400001):
    """1-D conditional integration: Pf = E_X1[Phi((m(X1)-X1^2/2)/s_cond)]."""
    c = rho * sig[0] * sig[1]
    m = lambda x1: mu[1] + c / sig[0] ** 2 * (x1 - mu[0])
    s_cond = math.sqrt(sig[1] ** 2 - c ** 2 / sig[0] ** 2)
    z = np.linspace(mu[0] - 8 * sig[0], mu[0] + 8 * sig[0], n)
    w = np.exp(-0.5 * ((z - mu[0]) / sig[0]) ** 2) / (sig[0] * math.sqrt(2 * math.pi))
    inner = np.array([ncdf((m(x) - 0.5 * x * x) / s_cond) for x in z])
    return float(np.trapezoid(w * inner, z))


# ---------------------------------------------------------------- SORM
def sorm_breitung(u_star, mu=MU, sig=SIG, rho=RHO, eps=1e-5):
    """Principal-curvature SORM (Breitung) at the design point, n=2."""
    gr = grad_g_u(u_star, mu, sig, rho)
    nrm = float(np.linalg.norm(gr))
    n = gr / nrm                                   # toward safe side (+g)
    e = np.array([-n[1], n[0]])                    # tangent unit vector
    H = np.zeros((2, 2))                           # exact Hessian in U
    H[0, 0] = 2.0 * sig[0] ** 2
    # finite-difference Hessian as a cross-check
    h = 1e-5
    Hfd = np.zeros((2, 2))
    for i in range(2):
        for j in range(2):
            ei, ej = np.zeros(2), np.zeros(2)
            ei[i] = h
            ej[j] = h
            Hfd[i, j] = (g_u(u_star + ei + ej, mu, sig, rho)
                         - g_u(u_star + ei - ej, mu, sig, rho)
                         - g_u(u_star - ei + ej, mu, sig, rho)
                         + g_u(u_star - ei - ej, mu, sig, rho)) / (4 * h * h)
    kappa = float(e @ H @ e / nrm)                 # n=2: one principal curvature
    kappa_fd = float(e @ Hfd @ e / nrm)
    beta = float(np.linalg.norm(u_star))
    pf_form = ncdf(-beta)
    if 1.0 + beta * kappa > 0:
        pf_sorm = pf_form / math.sqrt(1.0 + beta * kappa)
    else:
        pf_sorm = float("nan")
    return beta, kappa, kappa_fd, pf_form, pf_sorm, H, Hfd


# ---------------------------------------------------------------- simulation
def crude_mc(n=4_000_000, seed=20261119):
    rng = np.random.default_rng(seed)
    c = RHO * SIG[0] * SIG[1]
    l21 = c / SIG[0]
    l22 = math.sqrt(SIG[1] ** 2 - l21 ** 2)
    z = rng.standard_normal((n, 2))
    x1 = MU[0] + SIG[0] * z[:, 0]
    x2 = MU[1] + l21 * z[:, 0] + l22 * z[:, 1]
    fail = (x1 ** 2 - 2.0 * x2) < 0.0
    p = fail.mean()
    se = math.sqrt(p * (1 - p) / n)
    return float(p), float(se), n


def importance_sampling(n=200_000, seed=7):
    """IS with standard-normal proposal centred at the FORM design point."""
    u_star, _ = hlr()
    rng = np.random.default_rng(seed)
    v = rng.standard_normal((n, 2))
    u = u_star + v
    gu = np.array([g_u(x) for x in u])
    # weight f(u)/q(u) = exp(-0.5|u|^2 + 0.5|u-u*|^2)
    logw = -0.5 * np.sum(u ** 2, axis=1) + 0.5 * np.sum(v ** 2, axis=1)
    w = np.exp(logw - logw.max())
    ind = (gu < 0.0).astype(float)
    p = float(np.sum(w * ind) / np.sum(w))
    # delta-method standard error
    se = float(np.std(w * ind) / np.mean(w) / math.sqrt(n))
    return p, se, n, u_star


# ---------------------------------------------------------------- run all
if __name__ == "__main__":
    print("=" * 70)
    print("MAIN EXAMPLE  g = X1^2 - 2 X2,  N(10,2), N(20,5), rho=0.5")
    print("=" * 70)

    b_mv, mu_g, sd_g, gr = mvfosm_parabola()
    print(f"[MVFOSM]  mu_g={mu_g:.6f}  sigma_g={sd_g:.6f}  beta={b_mv:.10f}  Pf={ncdf(-b_mv):.6e}")
    print(f"          grad at mean = {gr}")

    u_star, hist = hlr()
    beta = float(np.linalg.norm(u_star))
    x_star = np.array([MU[0] + SIG[0] * u_star[0],
                       MU[1] + RHO * SIG[1] * u_star[0] + math.sqrt(SIG[1] ** 2 * (1 - RHO ** 2)) * u_star[1]])
    print(f"\n[HLRF]    iterations = {len(hist) - 1}")
    print("   k        u1            u2            beta          g(u)")
    for k, (uk, gk, bk, grk) in enumerate(hist):
        print(f"  {k:2d}  {uk[0]: .10f}  {uk[1]: .10f}  {bk: .10f}  {gk: .3e}")
    print(f"  u* = ({u_star[0]:.10f}, {u_star[1]:.10f}), beta = {beta:.10f}")
    print(f"  x* = ({x_star[0]:.10f}, {x_star[1]:.10f}), g(x*) = {g(x_star):.3e}")
    print(f"  alpha = {u_star / beta}")
    print(f"  Pf_FORM = {ncdf(-beta):.10e}")
    gu = grad_g_u(u_star)
    gx = np.array([2.0 * x_star[0], -2.0])
    db_dmu = gx / np.linalg.norm(gu)
    print(f"  dbeta/dmu = {db_dmu}  (correlated; -alpha/sigma = {-u_star / beta / SIG})")

    b_s, kappa, kappa_fd, pf_form, pf_sorm, H, Hfd = sorm_breitung(u_star)
    print(f"\n[SORM]    kappa = {kappa:.10f} (fd {kappa_fd:.10f}); beta*kappa = {b_s * kappa:.6f}")
    print(f"          Pf_FORM = {pf_form:.10e}; Pf_SORM = {pf_sorm:.10e}")
    print(f"          H exact =\n{H}\n          H fd =\n{Hfd}")

    pf_exact = exact_pf()
    print(f"\n[EXACT]   Pf (conditional 1-D integration) = {pf_exact:.10e}")

    p_mc, se_mc, n_mc = crude_mc()
    print(f"[MC]      N={n_mc:,}  Pf={p_mc:.10e}  se={se_mc:.3e}  COV={se_mc / p_mc:.2%}")
    p_is, se_is, n_is, us = importance_sampling()
    print(f"[IS]      N={n_is:,}  Pf={p_is:.10e}  se={se_is:.3e}  COV={se_is / p_is:.2%}")

    print(f"\n[CHI2]    P(chi2_2 > beta^2) = exp(-beta^2/2) = {math.exp(-0.5 * beta ** 2):.6e}"
          f"  (compare Phi(-beta) = {ncdf(-beta):.6e})")

    # ------------------------------------------------------------ rho sweep
    print("\n" + "=" * 70)
    print("RHO SWEEP (FORM)")
    print("=" * 70)
    print("  rho      beta        Pf          x1*         x2*")
    for rho in [-0.5, 0.0, 0.3, 0.5, 0.8]:
        us, _ = hlr(rho=rho)
        bb = float(np.linalg.norm(us))
        xs = np.array([MU[0] + SIG[0] * us[0],
                       MU[1] + rho * SIG[1] * us[0] + math.sqrt(SIG[1] ** 2 * (1 - rho ** 2)) * us[1]])
        print(f"  {rho: .1f}  {bb: .8f}  {ncdf(-bb):.6e}  {xs[0]: .6f}  {xs[1]: .6f}")

    # ------------------------------------------------------------ R-S example
    print("\n" + "=" * 70)
    print("LINEAR BENCHMARK  R ~ N(30,4), S ~ N(15,3), independent")
    print("=" * 70)
    b_rs = (30 - 15) / math.sqrt(4 ** 2 + 3 ** 2)
    print(f"  g1=R-S: beta={b_rs:.10f}, Pf={ncdf(-b_rs):.10e}")
    # g2 = R/S - 1 (same failure surface R=S), MVFOSM at the mean
    g2 = 30 / 15 - 1
    d1, d2 = 1 / 15, -30 / 15 ** 2
    sd2 = math.sqrt(d1 ** 2 * 16 + d2 ** 2 * 9)
    b2 = g2 / sd2
    print(f"  g2=R/S-1 MVFOSM: g={g2:.6f}, sigma_g={sd2:.6f}, beta={b2:.10f}, Pf={ncdf(-b2):.6e}")
    print(f"  FORM for g2 (same zero set R=S) is exactly beta={b_rs:.6f}")
