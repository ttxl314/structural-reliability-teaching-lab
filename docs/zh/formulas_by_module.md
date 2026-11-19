# 可靠度方法对比实验台 · 按模块公式整理

[English](../formulas_by_module.md)

> 目的：把每个站台“屏幕上出现的数”对应到公式、计算顺序和参考代码。  
> 参考代码在 `code/`；页面运行时源码在 `src/js/`；独立核验见 [verification_report.md](verification_report.md)。

## 0. 共享记号与默认参数

主例题：

\[
g(X_1,X_2)=X_1^2-2X_2,\qquad \text{失效域 }X_2>\frac{X_1^2}{2}
\]

\[
X_1\sim N(10,2),\quad X_2\sim N(20,5),\quad \rho=0.5
\]

协方差矩阵：

\[
C=\begin{bmatrix}\sigma_1^2&\rho\sigma_1\sigma_2\\ \rho\sigma_1\sigma_2&\sigma_2^2\end{bmatrix}
=\begin{bmatrix}4&5\\5&25\end{bmatrix}
\]

页面统一用 Cholesky 变换：

\[
C=LL^T,\qquad
L=\begin{bmatrix}\sigma_1&0\\ \rho\sigma_2&\sigma_2\sqrt{1-\rho^2}\end{bmatrix}
=\begin{bmatrix}2&0\\2.5&4.330127\end{bmatrix}
\]

\[
X=\mu+LU,\qquad U=L^{-1}(X-\mu),\qquad \|U\|=\beta
\]

**代码**：`code/shared/math.js`、`code/shared/example.js`，页面 `src/js/math.js`、`src/js/model.js`。

---

## 1. 站台 0 · 总览

总览不引入新公式，只汇总主例题的 MVFOSM / FORM / SORM / MC / 精确结果。  
页面卡片、总览 β/Pf 条、右栏对比表都从同一份 `app.main` 取数，避免出现“两套数”。

**代码**：`code/00_overview.js`。  
**显示**：`#methodCards`、`#pfBars`、`#compareTable`。

---

## 2. 站台 1 · 变量与变换

### 2.1 四步仿射

\[
Y=X-\mu,\qquad Z=D^{-1}Y,\qquad U=L^{-1}Y
\]

其中 \(D=\operatorname{diag}(\sigma_1,\sigma_2)\)。

矩阵形式（页面右侧卡片 `[A|b]`）：

\[
Y=\begin{bmatrix}1&0\\0&1\end{bmatrix}X-\mu,\quad
Z=\begin{bmatrix}1/\sigma_1&0\\0&1/\sigma_2\end{bmatrix}Y,\quad
U=L^{-1}Y
\]

### 2.2 等概率椭圆 / β 圆

\[
X(\theta)=\mu+rL\begin{bmatrix}\cos\theta\\ \sin\theta\end{bmatrix}
\]

白化后 \(U=r[\cos\theta,\sin\theta]\)，等概率线为圆，半径 \(r=\beta\)。  
设计点 \(x^*\) 与 β 椭圆切点重合；FORM 切线在 \(x^*\) 处。

**代码**：`code/01_transform.js`。  
**显示**：`#transCanvas`、`#transformMatrix`、`#transformFormula`。

---

## 3. 站台 2 · 概率干涉

R、S 独立正态，\(g=R-S\)：

\[
\beta=\frac{\mu_R-\mu_S}{\sqrt{\sigma_R^2+\sigma_S^2}},\qquad P_f=\Phi(-\beta)
\]

失效概率密度：

\[
h(s)=f_S(s)F_R(s),\qquad P_f=\int h(s)\,ds
\]

注意：\(f_R\) 与 \(f_S\) 的**密度重叠面积不是** \(P_f\)。

默认参数 \(\mu_R=30,\mu_S=15,\sigma_R=4,\sigma_S=3\)：

\[
\beta=3.000,\qquad P_f=\Phi(-3)=0.135\%
\]

**代码**：`code/02_interference.js`。  
**显示**：`#intfCanvas`、`#intfFormula`、`#intfTable`。

---

## 4. 站台 3 · 均值一次二阶矩（MVFOSM）

在均值点 \(\mu\) 做一阶泰勒：

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

默认参数：

\[
g(\mu)=60,\quad \nabla g(\mu)=(20,-2),\quad \sigma_g=36.0555
\]

\[
\beta=1.6641,\quad P_f=4.8046\%
\]

均值点切线的垂足：

\[
\nabla g_U=L^T\nabla g,\quad
U_L=-\frac{g(\mu)}{\|\nabla g_U\|^2}\nabla g_U,\quad
X_L=\mu+LU_L
\]

**代码**：`code/03_mvfosm.js`。  
**显示**：`#mvfosmXCanvas`、`#mvfosmUCanvas`、`#mvfosmFormula`、`#compareTable`。

---

## 5. 站台 4 · AFOSM / 验算点法

X 空间方向搜索：

1. 当前点 \(x_k\)，算 \(\nabla g(x_k)\)；
2. 转到 U：\(g_u=L^T\nabla g\)；
3. 方向 \(\alpha=-g_u/\|g_u\|\)，X 空间射线 \(x(\beta)=\mu+\beta L\alpha\)；
4. 沿射线解 \(g(x(\beta))=0\)，得到新的 \(\beta\)；
5. 用新点重算 \(\alpha\)，直到 \(\beta\) 与 \(g\) 收敛。

正态变量下与 FORM 收敛到同一设计点：

\[
\beta=2.10834,\quad x^*=(6.14384,18.87337),\quad P_f=1.7501\%
\]

**代码**：`code/04_afosm.js`（含 `solveBeta` 扫描+二分）。  
**显示**：`#afosmCanvas`、`#afTable`、`#afFormula`。

---

## 6. 站台 5 · FORM / HLRF

U 空间迭代：

\[
x_k=\mu+Lu_k,\quad g_k=g(x_k),\quad g_{u,k}=L^T\nabla g(x_k)
\]

\[
u_{k+1}=
\frac{g_{u,k}^Tu_k-g_k}{\|g_{u,k}\|^2}g_{u,k}
\]

收敛后：

\[
\beta=\|u^*\|,\quad x^*=\mu+Lu^*,\quad P_f\approx\Phi(-\beta)
\]

默认参数 6 次迭代：

\[
\beta=2.10834,\quad u^*=(-1.92808,0.85299)
\]

\[
x^*=(6.14384,18.87337),\quad P_f=1.7501\%
\]

**代码**：`code/05_form_hlrf.js`。  
**显示**：`#formCanvas`、`#formTable`、`#formFormula`、`#alphaBars`。

---

## 7. 站台 6 · SORM（Breitung）

在 FORM 设计点 \(x^*\) 取 Hessian：

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

默认参数：

\[
\kappa=0.061176,\quad \beta\kappa=0.1290,\quad 因子=0.941146
\]

\[
P_{f,\mathrm{SORM}}=1.6471\%
\]

**代码**：`code/06_sorm.js`。  
**显示**：`#sormCanvas`、`#sormFormula`、`#sormBars`。

---

## 8. 站台 7 · 蒙特卡洛

抽样：

\[
U_i\sim N(0,I),\quad X_i=\mu+LU_i
\]

估计：

\[
\hat P_f=\frac{N_f}{N},\qquad
se=\sqrt{\frac{\hat P_f(1-\hat P_f)}{N}},\qquad
CI_{95\%}\approx1.96se
\]

等效可靠指标：

\[
\hat\beta=-\Phi^{-1}(\hat P_f)
\]

固定种子 `20261119`；页面抽样上限 \(10^5\)。

**代码**：`code/07_monte_carlo.js`。  
**显示**：`#mcCanvas`、`#mcChart`、`#mcStats`、`#mcTable`。

---

## 9. 站台 8 · 公式卡与换算

半空间/线性边界、正态变量：

\[
P_f=\Phi(-\beta),\qquad \beta=-\Phi^{-1}(P_f)
\]

非线性时只是“等效换算”，不是精确关系。  
公式卡还汇总 MVFOSM / FORM / SORM / MC 的公式与对比表。

**代码**：`code/08_formulas.js`；页面 `src/js/formulas.js`（构建期生成）、`src/js/ui.js`。

---

## 10. 站台 9 · 同图与切线误差

同一设计点 \(\beta\)，边界形状不同：

\[
\text{线性： }u_1=\beta,\qquad
\text{凸： }u_1=\beta+\frac{\kappa u_2^2}{2},\qquad
\text{凹： }u_1=\beta-\frac{\kappa u_2^2}{2}
\]

\[
\text{圆外（极端）： }r=\beta
\]

\[
P_{f,\text{线性}}=\Phi(-\beta)
\]

\[
P_{f,\text{凸/凹}}=\int \varphi(u_2)\Phi\left[-\left(\beta\pm\frac{\kappa u_2^2}{2}\right)\right]du_2
\]

\[
P_{f,\text{圆外}}=P(\chi_2^2>\beta^2)=e^{-\beta^2/2}
\]

默认 \(\beta=2.108,\kappa=0.5\)：

| 失效域 | Pf | 等效 β |
|---|---:|---:|
| 线性 | 1.752% | 2.108 |
| 凸 | 1.154% | 2.272 |
| 凹 | 4.193% | 1.729 |
| 圆外 | 10.841% | 1.235 |

**代码**：`code/09_tangent_error.js`。  
**显示**：`#allMethodsCanvas`、`#tanCanvas`、`#tanTable`。

---

## 11. 站台 10 · 自定义函数

输入 \(g(x_1,x_2)\)，在正态 \(+\) 相关下：

1. 递归下降解析表达式（不用 `eval`）；
2. 中心差分求 \(\nabla g\) 与 \(H_x\)；
3. 调 MVFOSM / HLRF / SORM / MC 同一套方法；
4. 网格 marching squares 画 \(g=0\)，scanline 填充 \(g<0\)。

任意函数没有解析精确值；FORM/SORM 是数值近似，MC 是参考。

**代码**：`code/10_custom_function.js`；页面 `src/js/custom.js`。  
**显示**：`#customCanvas`、`#customTable`、右栏 `#resBeta/#resPf`。

---

## 12. 显示值与舍入

- `β`：3 位小数；`Pf`：通常 3 位，对比表 2 位；
- 页面 `Φ` 用 A&S 近似（绝对误差约 \(7.5\times10^{-8}\)），与 Python 基准 3 位显示一致；
- MC 是随机量，固定种子可复现，95% CI 描述抽样误差；
- 站台 9 的线性案例用显示值 \(\beta=2.108\)，所以显示 1.752%，与全精度 2.10834 的 1.750% 略有差别，属输入舍入而非算错；
- 站台 10 的自定义函数用有限差分，最后 2–3 位可能随函数尺度变化。
