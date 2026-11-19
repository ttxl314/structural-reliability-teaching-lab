# Structural Reliability Lab — Delivery Package

This repository / package contains one offline teaching page, its source code,
module-by-module reference implementations, Python and MATLAB versions, and the
verification reports.

## Quick start

1. Open `structural-reliability-lab.html` in Chrome, Edge, or Firefox.
2. No server and no network are required.
3. Use the **language switch** (EN / Chinese) in the top-right corner to change UI language.
   The first visit follows the browser language; manual choice is remembered.
4. For mobile, the page switches automatically at ≤760 px (or touch landscape):
   horizontal station bar, single-column cards, full-width canvases, scrollable
   tables.

## Python

```powershell
python python\run_all.py
```

Standard library only; NumPy/SciPy not required.

## MATLAB

```matlab
cd matlab
rel_run_all
```

Base MATLAB (R2025a tested); Statistics Toolbox not required.

## Verification

```powershell
node tests\test_math.js     # 20/20
node code\verify.js         # 39/39
```

Page self-test: `structural-reliability-lab.html?selftest=1` → 20/20.

## Documentation

English primary:

- `docs/user_guide.md`
- `docs/formulas_by_module.md`
- `docs/verification_report.md`
- `docs/benchmark_values.md`
- `docs/lecture_script.md`
- `docs/review_fixes.md`
- `docs/review_report.md`
- `docs/formula_card.pdf`

Chinese originals: `docs/zh/` (Chinese content, English filenames).

## Repository layout

```text
structural-reliability-lab.html   single-file build
README.md                         project overview
requirements.md                   requirements / design decisions
PACKAGE_README.md                 this file
AGENTS.md                         AI-agent repository map (not a human README)
src/                              page source
code/                             module-by-module JS reference
python/                           Python reference
matlab/                           MATLAB reference
docs/                             English reports and PDF card
docs/zh/                          Chinese originals
tests/                            Node regression
tools/                            build and formula tools
dist/                             HTML-only and complete ZIPs
```

## Notes

- The page is a teaching/demo tool, not certified engineering software.
- The normal CDF uses an A&S approximation; the Python reference is more precise.
- MC seed is `20261119`, shown only on Stations 7/10; deterministic methods are
  unaffected by it.
- The custom-function example with multiple disconnected failure regions is
  intentionally included to demonstrate the limits of single-design-point
  FORM/SORM; the page reports the number of components and recommends MC.
