# 可靠度方法对比教学页

[English README](../../README.md)

一个**单文件、离线、双击即开**的结构可靠度教学"实验台"：围绕主例题 `g(X) = X₁² − 2X₂`（`X₁ ~ N(10, 2)`、`X₂ ~ N(20, 5)`、`ρ = 0.5`），在同一道题上并排对比 **MVFOSM / AFOSM / FORM / SORM / 蒙特卡洛**，并与一维积分精确值对照。改一个参数，所有方法同时重算；按"单步"，切线、垂足、验算点一步一步长出来。

默认参数下的答案（页面当场计算）：

| 方法 | β | Pf | 说明 |
|---|---:|---:|---|
| MVFOSM | 1.664 | 4.805% | 均值点切线 |
| AFOSM = FORM | 2.108 | 1.750% | 同一设计点，两种走法 |
| SORM | 2.108 | 1.647% | β 不变，曲率修正 Pf |
| 蒙特卡洛（参考 N=4×10⁶） | — | 1.628% | 大样本基准 |
| 精确（一维条件积分） | — | 1.623% | 真值参考 |

> 关键现象：同一失效面换个代数写法，MVFOSM 的 β 会变（`R−S` 得 3.000，`R/S−1` 得 2.080），而 FORM 不变；SORM 不重新找验算点，只修正 Pf 的换算。

## 快速开始

1. **双击**根目录的 [structural-reliability-lab.html](../../structural-reliability-lab.html)。Chrome / Edge 直接打开，无需服务器、无需联网；可拷到 U 盘带走。
2. `F` 全屏；`?` 打开帮助；`←/→` 切换站台，数字键 `0–9` 直达，`C` 打开自定义函数；`Space` 播放、`S` 单步（站台 1/4/5/7 有效）；`R` 重置；顶栏只保留 `重置`。首次进入站台 4/5 会自动播放一次，站台 7 会自动连续抽样到 10 万；想关闭自动演示加 `?auto=0`。
3. **验证数字**：`?` → "运行数值自检"（20 项），或打开 `structural-reliability-lab.html?selftest=1`。
4. **打印公式卡**：站台 8 右上角"打印公式卡"；打印样式只输出站台 8（A4）。顶栏的打印入口已移除。
5. **复现某一步**：在地址后加参数，例如 `?station=5&hlr=2`（FORM 第 3 行）、`?station=7&mc=100000`（预抽 10 万）。

## 11 个站台

| # | 站台 | 一句话 | 关键交互 |
|---|---|---|---|
| 0 | 总览 | 同一道题，六种假设，答案差约 3 倍 | 六张方法卡 + log 轴 Pf 对比条；点卡跳站 |
| 1 | 变量与变换 | X → 中心化 → 标准化 → 白化，β 是到原点的距离 | 4 步平滑仿射动画（2→3 先缩放视窗再 Y 缩放）、播放；β 椭圆/圆与切点切线；轴加粗；Cholesky / PCA 切换；ρ 滑块 |
| 2 | 概率干涉 | 密度重叠 ≠ Pf；真正的 Pf 是失效概率密度 h(s)=f_S·F_R 的积分 | R、S 四个滑块；h(s) 与 f_R/f_S 同一绝对密度轴 / h(s) 面积 / 安全裕度三图；形式敏感小表 |
| 3 | 均值一次二阶矩 | 在均值点画一条切线；换写法 β 会变 | X/U 双视图；切线、垂足、误差对比卡 |
| 4 | 改进的一次二阶矩（AFOSM） | 沿当前 α 方向搜索边界；与 FORM 同设计点 | 首次进入自动播放一次；播放 / 单步 / 点迭代表回放；`≡` 对比卡；不可解时回退 FORM 并标注 |
| 5 | FORM / HLRF | 切线 → 垂足 → 再切线，通常 6 次收敛（参数不同会更多） | 首次进入自动播放一次；单步 / 播放；α² 贡献；β 与残差收敛小图 |
| 6 | SORM | β 不变，Pf 因曲率修正 | 曲率示意放大 ×3；密切圆；Pf 对比条 |
| 7 | 蒙特卡洛 | 大样本做基准，误差 ∝ 1/√N | 首次进入自动连续抽样到 10 万；每批 / 目标 N 可调、重抽到 N；X/U 样本云；95% CI |
| 8 | 公式与代码 | 7 组公式 + 方法对比 + β↔Pf 表，可打印 | 打印公式卡；7 个方法代码入口 |
| 9 | 同图与切线误差 | 所有方法叠在一张图；线性/凸/凹/圆外失效的 β→Pf 误差 | X/Y/Z/U 切换 + 固定 1:1 同比例方窗；滚轮缩放 / 拖动平移 / 双击复位；等概率椭圆/圆；方法点旁标 β 距离；MVFOSM g=0 与过 μ 平行线；β/κ 滑块 + 失效域高亮；切线图边界无截断 |
| 10 | 自定义函数实验室 | 输入任意 g(x₁,x₂)，现算 β/Pf | 表达式解析（不用 eval）+ 数值梯度/Hessian；MVFOSM / FORM(AFOSM) / SORM / MC 勾选；μ/σ/ρ 滑块；现场画 g=0、失效域、切线与设计点 |

每个方法站台右上角都有 **"看伪代码"** 抽屉（伪代码 / JS 实现两页签，可复制）；站台 0 的对应入口叫"算法地图"。右栏还有各站 3 条"讲解要点"、主例题参数滑块与结果卡（站台 2、8 时参数卡自动隐藏）。

> **统一方法配色**：MVFOSM 橙、AFOSM 蓝、FORM 红、SORM 绿、MC 紫、精确灰。总览的“同题对比：β / Pf”图带图例与每行 β/Pf 值；右栏对比表、公式卡对比表、站台 3 误差条、站台 6 Pf 条、站台 9 同图都用同一套颜色。各方法切线也按方法色：MVFOSM 橙、AFOSM 蓝、FORM 红、SORM 绿；极限状态面用中性蓝，设计点仍是红星。

## 文档

- [docs/讲课脚本.md](lecture_script.md) —— 45 分钟主路线 + 20 分钟压缩路线，逐段写了时间、点击路径、讲解要点、预期数字、常见问题。
- [docs/使用说明.md](user_guide.md) —— 界面、快捷键、URL 参数、代码抽屉、打印、自检、构建与源码说明。
- [docs/公式整理_按模块.md](formulas_by_module.md) —— 按站台整理公式、计算顺序、代码文件与显示位置。
- [docs/计算核验报告.md](verification_report.md) —— 页面显示值与独立复算的逐模块核验（39/39）。
- [code/README.md](../../code/README.md) —— 按模块拆分的参考代码；`node code/verify.js` 可复算。
- [docs/基准数值.md](benchmark_values.md) —— 全部基准数字：方法对比、HLRF 迭代表、SORM、形式敏感、精确积分、复算命令。
- [docs/公式卡.pdf](../formula_card.pdf) —— 最终构建导出的 A4 公式卡（3 页）。
- [docs/复核报告.md](review_report.md) —— 独立复核（修复前快照）；修复结果见 [docs/复核修复记录.md](review_fixes.md)。
- [需求说明_可靠度方法对比教学页.md](requirements.md) —— 设计背景与取舍（注意：正文站台清单是早期 v0.9 的 `0–6`，实现按 v1.0 增补为 `0–10`，以页面为准）。

## 构建与测试

```bash
python tools/build.py        # src/ → dist/structural-reliability-lab.html，并复制一份到根目录（会覆盖同名产物）
node tests/test_math.js      # 数值内核/模型回归，输出里应出现 20/20 passed
python reference_values.py   # 独立 Python 基准（numpy），复算全部关键数字
```

- 修改 `src/` 后**必须重跑构建**；根目录 HTML 与 `dist/` 都是生成物，不要手改。
- 改公式：编辑 `tools/formulas.json` → `node tools/gen_formulas.cjs`（构建期依赖 `_tmp/mathjax` 下的 MathJax）→ `python tools/build.py`。
- 页面内自检：`structural-reliability-lab.html?selftest=1`（20 项，当前 20/20 通过）。

## 目录结构

```
structural-reliability-lab.html   ← 构建产物（双击使用；勿手改）
dist/                        ← 构建产物副本
src/
  index.html                 ← 页面骨架（11 个站台 + 对话框）
  styles.css                 ← 全部样式（含打印与响应式）
  js/
    math.js                  ← 正态分布、2×2 线代、RNG、格式化
    model.js                 ← MVFOSM / HLRF / AFOSM / SORM / 精确积分 / MC
    charts.js                ← Canvas 2D 绘图（无第三方库）
    formulas.js              ← 构建期生成的公式 SVG（勿手改）
    pseudocode.js            ← 各方法伪代码 / JS 片段
    ui.js                    ← 滑块、代码抽屉、结果栏、自检
    custom.js                ← 站台 10：表达式解析 + 自定义 g 计算
    stations.js              ← 站台 0–10 的绘制与事件
    app.js                   ← 状态、导航、快捷键、URL、启动
code/                        ← 按模块整理的参考实现 + verify.js
tools/
  build.py                   ← 单文件内联构建
  gen_formulas.cjs           ← formulas.json → src/js/formulas.js
  formulas.json              ← 24 条公式的 TeX 源
tests/test_math.js           ← Node 数值回归（20/20）
docs/                        ← 使用说明、基准数值、讲课脚本
reference_values.py          ← 独立 Python 基准（单一真源）
需求说明_可靠度方法对比教学页.md
plot_*.py / *.png            ← 早期 8 张静态图与绘图脚本（历史资料，页面不依赖）
```

> 其余为临时/历史文件（`_tmp/`、`__pycache__/`、`论文杂项/`、`_*_check.py`、JCSS 培训通知等），不参与页面构建。

## 技术要点

- **零运行时依赖**：原生 JS + Canvas 2D + SVG，无框架、无 CDN、无网络请求；单文件 HTML 约 0.4 MB。
- **单文件构建**：[tools/build.py](../../tools/build.py) 把 `styles.css` 与 8 个脚本内联进 `src/index.html` 的副本，产出 `dist/` 与根目录的单文件 HTML；公式 SVG 在构建期由 MathJax 预生成并内嵌，运行时不需要字体服务器。
- **数字全部现场计算**：[src/js/model.js](../../src/js/model.js) 实现各方法（不是贴图）；MC 用固定种子 `20261119` 可复现，页脚仅在站台 7/10 显示 `MC seed`；确定性方法不受种子影响。
- **20 项内置数值自检**：覆盖正态 CDF、Cholesky、MVFOSM/FORM/SORM 的 β/Pf、PCA 下 β 不变、R−S 形式敏感等。
- **状态可分享**：`?station=N&trans=k&hlr=k&af=k&mc=N&rho=…&mode=pca&code=…&selftest=1&fn=…` 及主例题/干涉参数都可由 URL 恢复。
- **课堂友好**：1920×1080 投屏设计；≤1500px 左栏收成数字图标；≤1024px 隐藏右侧结果栏；≤760px（或手机横屏）自动切换手机布局：横向站台条、单列卡片、全宽画布、可滑动表格；桌面布局不受影响。打印只输出站台 8。

## 已知边界

- 只有 **2 维正态**主例题（抛物线极限状态）与 `R−S` 干涉小例；不支持任意 `g(x)`、非正态 / 相关非正态 / R-F 当量正态化、子集模拟、重要性抽样。
- 解析梯度与 Hessian 写死在 `model.js` 的 `EXAMPLES` 中，是教学演示而不是通用可靠度软件。
- 页面 MC 抽样上限 **10 万**；`4×10⁶` 是预置参考值（默认参数下才显示，参数一变即消失）。
- 打印只覆盖公式卡（站台 8），A4 实测 **3 页**（24 条公式 + 两张表，为保证可读性接受 3 页）。
- 滑块允许把均值点调进失效域；此时顶部出现黄色警告，MVFOSM 的 β 会变负、AFOSM 回退 FORM——这是定义域问题，不是数值 bug。
- 移动端未适配；投屏建议 1920×1080 + Chrome / Edge 最新版，必要时用 URL `?projector=1`。
