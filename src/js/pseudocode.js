/* ============================================================================
 * pseudocode.js — the "typical code" shown for each method station
 * Pseudocode follows the real algorithm; the JS snippets are simplified versions of the functions actually used on the page, kept short for readability.
 * ==========================================================================*/
(function (global) {
  'use strict';
  const RL = (global.RL = global.RL || {});

  const P = {
    overview: {
      title: '方法谱系：同一道题，不同假设',
      note: '先看假设，再看数字；AFOSM 与 FORM 在正态变量下是同一设计点的两种走法。',
      pseudo:
`# 同一道题 g(X) = X1^2 - 2 X2
MVFOSM   在均值点线性化          1 次梯度        快，但依赖 g 的写法
AFOSM    在 X 空间沿 alpha 方向搜索 ~6 次          验算点法，同一设计点
FORM     在 U 空间做切线-垂足      ~6 次          同一设计点，几何解释
SORM     在验算点加曲率修正        1 次 Hessian    beta 不变，Pf 修正
MC       大样本直接数 g < 0        10^4 ~ 10^6    基准，误差 ~ 1/sqrt(N)

# 读法：
#   MVFOSM 的 beta 会随 g 的代数写法变；
#   AFOSM / FORM 收敛到同一个设计点，所以 beta 不变；
#   SORM 不改设计点，只改 Pf 的换算；
#   MC 不假设线性化，用来检验前面所有近似。`,
      js: null,
    },

    transform: {
      title: '空间变换：X → Y → Z → U',
      note: '中心化去位置，标准化去量纲，白化去相关；三步都是仿射变换，不改变“哪个点最可能失效”。',
      pseudo:
`# 逐步变换（相关正态）
Y = X - mu                       # 1. 中心化：均值移到原点
Z = diag(1 / sigma) * Y          # 2. 标准化：每个方向变成“几个 sigma”
R = corr(Z)                      #    相关系数矩阵（对角线为 1）
L = chol(R)                      # 3. Cholesky 分解
U = inv(L) * Z                   #    白化：斜椭圆 -> 同心圆

# 也可以直接用协方差：
#   L = chol(C),  U = inv(L) * (X - mu)
# 等价写法（PCA）：
#   C = Q * Lambda * Q^T,  U = Lambda^(-1/2) * Q^T * (X - mu)
# 两种 U 只差一个正交旋转，beta 不变。`,
      js:
`function toU(x, p) {
  const mu = [p.mu1, p.mu2];
  const L  = RL.Math.chol2(RL.Model.cov(p));
  return RL.Math.solveLower(L, RL.Math.sub(x, mu));
}

function toX(u, p) {
  const mu = [p.mu1, p.mu2];
  const L  = RL.Math.chol2(RL.Model.cov(p));
  return RL.Math.add(mu, RL.Math.matVec(L, u));
}`,
    },

    interference: {
      title: '概率干涉：R 与 S 的 overlap',
      note: '重叠面积只是直观示意；真正的 Pf 是 ∫ fS(s) FR(s) ds。R、S 独立正态时，它等于 Φ(−β)。',
      pseudo:
`# 应力-强度干涉
P_f = ∫ f_S(s) * F_R(s) ds          # 精确积分：S=s 时 R<s 的概率
                                   # 再对 s 的密度加权

# 若 R, S 独立正态：
g    = R - S                       # 安全裕度
mu_g = mu_R - mu_S
sig_g = sqrt(sigma_R^2 + sigma_S^2)
beta  = mu_g / sig_g
P_f   = Phi(-beta)                 # 线性 g、正态变量：精确

# 注意：
#   f_R 与 f_S 的“重叠面积”不是 P_f；
#   它只说明两个分布有多接近，不能直接当概率用。`,
      js:
`function interference(p) {
  const beta = (p.muR - p.muS) / Math.hypot(p.sR, p.sS);
  return { beta, pf: RL.Math.normCdf(-beta) };
}

// 失效积分曲线：h(s) = f_S(s) * F_R(s)
function integrand(s, p) {
  const fS = RL.Math.normPdf((s - p.muS) / p.sS) / p.sS;
  const FR = RL.Math.normCdf((s - p.muR) / p.sR);
  return fS * FR;
}`,
    },

    mvfosm: {
      title: '均值一次二阶矩（MVFOSM / 中心点法）',
      note: '只在均值点取一阶泰勒；对线性 g、正态 X 精确，对非线性 g 误差大，而且换个写法 β 会变。',
      pseudo:
`# 均值一次二阶矩（MVFOSM / 中心点法）
mu_g  = g(mu_X)                    # 均值点取值
grad  = grad_g(mu_X)               # 均值点梯度
sigma_g = sqrt(grad^T C_X grad)    # 考虑相关性；别漏交叉项
beta_M  = mu_g / sigma_g
P_f     = Phi(-beta_M)             # 只有线性 g 才严格

# 等价写法 g2 会给出不同的 beta_M：
#   g1 = R - S       -> beta = 3.000
#   g2 = R/S - 1     -> beta = 2.080
# 但两者的零集都是 R = S；FORM 都是 3.000。`,
      js:
`function mvfosm(example, p) {
  const mu   = [p.mu1, p.mu2];
  const g0   = example.g(mu);
  const grad = example.grad(mu);
  const C    = RL.Model.cov(p);

  const varG = grad[0] * grad[0] * C[0][0]
             + grad[1] * grad[1] * C[1][1]
             + 2 * grad[0] * grad[1] * C[0][1];

  const beta = g0 / Math.sqrt(varG);
  return { beta, pf: RL.Math.normCdf(-beta) };
}`,
    },

    afosm: {
      title: '改进的一次二阶矩（AFOSM / 验算点法）',
      note: '每一步用当前 α 定一条从均值出发的射线，沿射线解 g=0 得 β，再更新 α；与 FORM 同一设计点。',
      pseudo:
`# 改进的一次二阶矩（AFOSM / 验算点法）
x = mu_X
repeat:
    grad   = grad_g(x)
    grad_u = L^T grad
    alpha  = -grad_u / ||grad_u||          # 指向验算点
    d      = L * alpha                     # X 空间搜索方向
    beta   = solve  g(mu_X + beta*d) = 0   # 沿射线找边界
    x      = mu_X + beta * d
until |g(x)| < tol and beta converged

P_f = Phi(-beta)

# 注意：alpha 的定义要与教材统一。
# 本页 alpha 指向验算点，所以 x* = mu + beta * L * alpha。`,
      js:
`function afosm(example, p) {
  const T = RL.Model.transform(p, 'chol');
  let x = T.mu.slice(), beta = 0;

  for (let k = 0; k < 20; k++) {
    const gu    = RL.Math.matVec(RL.Math.transpose(T.L), example.grad(x));
    const alpha = RL.Math.scale(gu, -1 / RL.Math.norm(gu));
    const d     = RL.Math.matVec(T.L, alpha);       // x = mu + beta*d
    const betaNew = solveBeta(example, T.mu, d);    // 沿 d 解 g=0

    x = RL.Math.add(T.mu, RL.Math.scale(d, betaNew));
    if (Math.abs(betaNew - beta) < 1e-8) { beta = betaNew; break; }
    beta = betaNew;
  }
  return { beta, xStar: x, pf: RL.Math.normCdf(-beta) };
}`,
    },

    form: {
      title: 'FORM / HLRF（U 空间切线-垂足）',
      note: '每一步在当前点取切线，再取原点到切线的垂足；6 步收敛，第 1 步正好是均值点法。',
      pseudo:
`# FORM / HLRF（U 空间）
u = 0
repeat:
    g  = g_U(u)
    gr = grad_U(u)
    u  = ((gr^T u - g) / ||gr||^2) * gr    # 切线 -> 垂足
until |g| < tol

beta  = ||u||
alpha = u / beta                            # 指向验算点
P_f   = Phi(-beta)

# 第 1 步：u=0 处的切线就是均值点切线，
#         垂足就是 MVFOSM 的 U_L（本例 beta=1.664）。`,
      js:
`function hlr(example, p) {
  const T = RL.Model.transform(p, 'chol');
  let u = [0, 0];

  for (let k = 0; k < 30; k++) {
    const x  = T.toX(u);
    const g  = example.g(x);
    const gu = RL.Math.matVec(RL.Math.transpose(T.L), example.grad(x));

    if (Math.abs(g) < 1e-8 && k > 0) break;
    u = RL.Math.scale(gu, (RL.Math.dot(gu, u) - g) / RL.Math.dot(gu, gu));
  }

  const beta = RL.Math.norm(u);
  return { beta, uStar: u, pf: RL.Math.normCdf(-beta) };
}`,
    },

    sorm: {
      title: 'SORM / Breitung（n = 2）',
      note: 'β 还是 FORM 的 β；只加一个曲率 κ，把边界从直线改成抛物线，修正 Pf 的换算。',
      pseudo:
`# SORM / Breitung（n = 2）
u_star, beta = FORM()

H_u = L^T * H_x * L                  # U 空间 Hessian
n   = grad_U(u_star) / ||grad_U(u_star)||
e   = [-n2, n1]                      # 切向单位向量
kappa = (e^T H_u e) / ||grad_U(u_star)||

P_f = Phi(-beta) / sqrt(1 + beta * kappa)

# 符号约定：本页 n 指向安全域；
#   kappa > 0 表示边界朝失效域弯，失效域变小，Pf 比 FORM 小。
# 若教材取相反法向，公式写成 1 - beta*kappa。`,
      js:
`function sorm(example, p, form) {
  const T  = RL.Model.transform(p, 'chol');
  const Hx = example.hess(form.xStar);
  const Hu = RL.Math.matMul(RL.Math.matMul(RL.Math.transpose(T.L), Hx), T.L);
  const gu = RL.Math.matVec(RL.Math.transpose(T.L), example.grad(form.xStar));

  const n = RL.Math.scale(gu, 1 / RL.Math.norm(gu));
  const e = [-n[1], n[0]];
  const kappa = RL.Math.dot(e, RL.Math.matVec(Hu, e)) / RL.Math.norm(gu);

  const pf = form.pf / Math.sqrt(1 + form.beta * kappa);
  return { kappa, pf };
}`,
    },

    mc: {
      title: '蒙特卡洛（MC）',
      note: '不线性化；误差 ∝ 1/√N。固定种子可复现，95% CI 用二项标准误。',
      pseudo:
`# 蒙特卡洛
count = 0
for j in 1..N:
    z = randn(2)                  # 标准正态
    x = mu_X + L * z              # 相关正态
    if g(x) < 0: count += 1

P_f = count / N
se  = sqrt(P_f * (1 - P_f) / N)
CI  = P_f +/- 1.96 * se

# Pf 很小时，N 要很大：
#   Pf ~ 1.6%，N=10^4 -> COV ~ 7.8%
#   N=10^5 -> COV ~ 2.5% ; N=4*10^6 -> COV ~ 0.4%`,
      js:
`function mc(example, p, N, rng) {
  const T = RL.Model.transform(p, 'chol');
  let fails = 0;

  for (let i = 0; i < N; i++) {
    const z = [rng.normal(), rng.normal()];
    const x = RL.Math.add(T.mu, RL.Math.matVec(T.L, z));
    if (example.g(x) < 0) fails++;
  }

  const pf = fails / N;
  return { pf, se: Math.sqrt(pf * (1 - pf) / N) };
}`,
    },
  };

  RL.PSEUDO = P;
})(typeof window !== 'undefined' ? window : globalThis);
