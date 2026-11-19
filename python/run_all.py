"""Run the Python reference implementation and print results consistent with the page's default parameters.

Run:
    python run_all.py
No third-party packages are required.
"""

import math
import reliability as R


def pct(x, n=3):
    return f"{100.0 * x:.{n}f}%"


def main():
    p = R.DEFAULT_P
    ex = R.parabola_example()
    T = R.transform(p)
    mv = R.mvfosm(ex, p)
    form = R.hlr(ex, p)
    af = R.afosm(ex, p)
    so = R.sorm(ex, p, form)
    mc = R.monte_carlo(ex, p, 100000)
    rs = R.interference()
    h_int = R.integrate_h()
    tan = R.tangent_error()

    print("=" * 74)
    print("Main example: g(X)=X1^2-2*X2, X1~N(10,2), X2~N(20,5), rho=0.5")
    print("=" * 74)
    print(f"Cholesky L = [[{T['L'][0][0]:.6f}, 0], [{T['L'][1][0]:.6f}, {T['L'][1][1]:.6f}]]")
    print(f"MVFOSM     beta={mv['beta']:.6f}  Pf={pct(mv['pf'])}  sigma_g={mv['sigmaG']:.6f}")
    print(f"AFOSM      beta={af['beta']:.6f}  Pf={pct(af['pf'])}")
    print(f"FORM/HLRF  beta={form['beta']:.6f}  Pf={pct(form['pf'])}")
    print(f"  u* = ({form['uStar'][0]:.6f}, {form['uStar'][1]:.6f})")
    print(f"  x* = ({form['xStar'][0]:.6f}, {form['xStar'][1]:.6f})")
    print(f"SORM       kappa={so['kappa']:.6f}  factor={so['factor']:.6f}  Pf={pct(so['pf'])}")
    print(f"MC         N={mc['n']}  fails={mc['fails']}  Pf={pct(mc['pf'])}  95%CI=±{pct(mc['ci'])}")
    print()
    print(f"R-S interference beta={rs['beta']:.6f}  Pf={pct(rs['pf'])}  ∫h(s)ds={pct(h_int)}")
    print()
    print("Tangent error (beta=2.108, kappa=0.5)")
    for k in ("linear", "convex", "concave", "extreme"):
        print(f"  {k:8s} Pf={pct(tan[k])}")
    print()

    # Simple assertions for regression checks
    assert abs(mv["beta"] - 1.6641005887) < 1e-8
    assert abs(form["beta"] - 2.1083396823) < 1e-7
    assert abs(form["uStar"][0] + 1.92808099) < 1e-6
    assert abs(form["uStar"][1] - 0.85299468) < 1e-6
    assert abs(so["kappa"] - 0.06117568) < 1e-6
    assert abs(so["pf"] - 0.01647082) < 1e-7
    assert abs(rs["beta"] - 3.0) < 1e-12
    assert abs(tan["convex"] - 0.011540) < 2e-3
    assert abs(tan["concave"] - 0.041930) < 3e-3
    assert 0.014 < mc["pf"] < 0.019
    print("Python reference implementation: all assertions passed.")


if __name__ == "__main__":
    main()
