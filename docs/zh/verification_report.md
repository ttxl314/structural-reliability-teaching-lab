# 计算核验报告

[English](../verification_report.md)

> 核验对象：`structural-reliability-lab.html`（站台 0–10）  
> 参考实现：`code/`（按模块拆分、带公式注释）  
> 页面源码：`src/js/`  
> 核验日期：2026-11-20

## 1. 核验方法

两条独立路径：

1. **页面自检**：`?selftest=1`（或帮助里的“运行数值自检”）20 项，全部 PASS；
2. **模块级独立复算**：`node code/verify.js`，39 项全部 PASS。

`code/verify.js` 用独立实现重算每个模块，再与页面默认参数下的显示值比较。  
页面 `Φ` 使用 A&S 近似（绝对误差约 \(7.5\times10^{-8}\)），因此 CDF 类检查的容差在 \(10^{-7}\) 量级；β/Pf 的页面显示只到 3 位小数，显示值一致。

```text
node code/verify.js
39/39 passed
```

```text
node tests/test_math.js
20/20 passed
```

## 2. 模块核验结果

| 站台 | 屏幕显示 | 公式结果 | 参考文件 | 结论 |
|---|---|---|---|---|
| 0 总览 | MVFOSM β=1.664、Pf=4.80%；FORM=2.108/1.75%；SORM=2.108/1.65%；MC≈1.6%；精确=1.62% | 与站台 3–8 同一份 `app.main` | `code/00_overview.js` | PASS |
| 1 变换 | Cholesky \(L=[[2,0],[2.5,4.330127]]\)；设计点 \(\|U\|=2.108\) | \(C=LL^T\)，\(X=\mu+LU\) | `code/01_transform.js` | PASS |
| 2 干涉 | β=3.000，Pf=0.135% | \(P_f=\Phi(-3)\)，\(\int h(s)ds\approx P_f\) | `code/02_interference.js` | PASS |
| 3 MVFOSM | β=1.664，Pf=4.80%，σ_g=36.0555 | \(g(\mu)=60\)，\(\sigma_g=36.0555\) | `code/03_mvfosm.js` | PASS |
| 4 AFOSM | β=2.108，Pf=1.75%，x*=(6.144,18.873) | 方向搜索与 FORM 同一设计点 | `code/04_afosm.js` | PASS |
| 5 FORM/HLRF | β=2.108，u*=(-1.928,0.853)，x*=(6.144,18.873) | HLRF 6 次收敛 | `code/05_form_hlrf.js` | PASS |
| 6 SORM | κ=0.0612，因子=0.941，Pf=1.647% | Breitung 修正 | `code/06_sorm.js` | PASS |
| 7 MC | N=100000，Pf≈1.64%，95% CI 约 ±0.08% | 固定种子 20261119 | `code/07_monte_carlo.js` | PASS |
| 8 公式卡 | \(P_f=\Phi(-\beta)\)、β 与 Pf 换算 | 半空间/线性边界关系 | `code/08_formulas.js` | PASS |
| 9 切线误差 | 线性 1.752%、凸 1.154%、凹 4.193%、圆外 10.841% | Simpson 积分 + 圆外解析式 | `code/09_tangent_error.js` | PASS |
| 10 自定义 | 默认 `x1^2-2*x2` 得 MVFOSM 1.664、FORM 2.108、SORM 1.647%、MC≈1.64% | 数值梯度/Hessian + 同一套方法 | `code/10_custom_function.js` | PASS |

## 3. “屏幕上的数”来自哪里

页面没有为各站台维护第二套预置结果：

- **结果卡**：`src/js/stations.js` 的 `updateInspector()` 从 `app.main` / `state.mc` / `tangentErrorCase()` / `RL.Custom.getResult()` 读取数值，再用 `src/js/ui.js` 的 `setResult` 格式化；
- **右栏方法对比**：`U.setCompare(app.main, active, mc)`，数据来自当前参数的 `app.main.mv/af/form/sorm/exact`；
- **站台 1/3/4/5/6/7/9 画布**：使用同一份 `app.main` 结果和 `src/js/model.js` 的公式；
- **站台 2**：`interferenceCurves` 与解析 R−S 结果；
- **站台 9 右表**：`tangentErrorCase(beta,kappa)` 现场积分；
- **站台 10**：`src/js/custom.js` 现场解析、有限差分、HLRF/SORM/MC。

唯一的“预置参考值”是主例题默认参数下的 **MC N=4×10⁶** 参考行（`MC_REF`，页面明确标注“参考 N=4×10⁶”）；改参数后该行会消失，需要到站台 7 重新抽样。

## 4. 舍入与随机性说明

- β 显示 3 位小数；Pf 一般 3 位，方法对比表默认 2 位；
- 页面 `Φ` 与 Python 基准差约 \(10^{-7}\)，3 位显示一致；
- 站台 9 的“线性 1.752%”是用**显示值 β=2.108** 算的；若用全精度 2.10834 则为 1.750%，两者都已在文档中说明；
- MC 结果是随机量，固定种子可复现，95% CI 描述抽样误差；
- 站台 10 的任意函数没有解析精确值；FORM/SORM 为数值近似，MC 为参考，函数不光滑/多失效模式时结果只应作方法演示。

## 5. 结论

- 默认参数下，页面各模块显示的 β、Pf、κ、CI、切点/设计点与独立参考实现一致；
- 计算结果由公式现场计算，不是静态硬编码；
- 页面自检 20/20，模块级核验 39/39。
