# AGENTS.md — AI Agent Repository Card

> **Audience:** AI coding agents.  
> **Humans:** read `README.md` instead. This file is a machine-oriented map, not a user manual.  
> **Repo:** structural-reliability-teaching-lab  
> **Version:** 1.0.0  
> **Primary language:** English source/comments/docs; Chinese is a runtime locale and is preserved in `docs/zh/`.

## 0. One-paragraph model

This is a **single-file, offline structural-reliability teaching page**. One concrete limit-state
example is solved by several methods side by side, with synchronized Canvas plots, formulas,
pseudocode, and independent Python/MATLAB/JS reference implementations. The page is built from
`src/` into one self-contained HTML file. It has **no backend, no network requests, no framework,
and no runtime dependencies**. A Chinese/English UI switch is implemented by a source-string
catalog plus a DOM/Canvas translation layer.

## 1. Read order (fast path)

1. `AGENTS.md` (this file).
2. Task-specific source from §4.
3. Run §6 tests before changing numerical code.
4. For UI text changes, read §7 (i18n) — **do not translate source strings directly**.
5. For build/package changes, read §8.

Do not read the whole `docs/` tree unless the task is about documentation or verification.

## 2. Golden invariants (do not break)

- **One HTML file, fully offline**: no external CSS/JS/fonts, no fetch/XHR, no backend.
- **Generated artifact**: `structural-reliability-lab.html` and `dist/structural-reliability-lab.html`
  are build outputs. Edit `src/`, then run `python tools/build.py`. Never hand-edit either HTML.
- **Top bar**: only `Reset` and the language switch. Projector mode is URL-only (`?projector=1`).
- **Seed**: `20261119` is shown only on Station 7 and Station 10; it affects MC only.
- **Station 9** is always a 1:1 square plot. There is no aspect-ratio toggle. Zoom/pan use
  `−`, `+`, `⟲` and pointer drag.
- **Mobile**: automatic layout at `max-width: 760px` or `(max-height: 500px) and (pointer: coarse)`.
  Desktop layout must remain unchanged.
- **Bilingual UI**: Chinese source strings are the i18n keys for Chinese mode. English is added in
  `src/js/i18n-data.js`. Existing Chinese strings must not be rewritten to English.
- **Language default**: URL `?lang=` → `localStorage` (`structural-reliability-lab.lang`) → browser
  language (`zh*` → Chinese, otherwise English).
- **Numerical display contract**: β and Pf are displayed to 3 decimals (Pf in tables often 2);
  Python/MATLAB print more digits. Do not “fix” display precision without checking docs.
- **Station 10** is the only place arbitrary `g(x1,x2)` is parsed. It always warns that FORM/SORM
  use one design point and MC is the multi-region reference.
- **Docs split**: English primary in `docs/`; Chinese originals in `docs/zh/` with English filenames.

## 3. Entry points and generated files

| Path | Role | Edit? |
|---|---|---|
| `src/index.html` | page skeleton, all station markup, dialogs, top bar | yes |
| `src/styles.css` | full layout, responsive rules, print CSS | yes |
| `src/js/*.js` | runtime source | yes |
| `tools/build.py` | inlines CSS + 11 JS files into single HTML | yes |
| `structural-reliability-lab.html` | root build artifact, classroom file | **no** |
| `dist/structural-reliability-lab.html` | identical build artifact | **no** |
| `dist/structural-reliability-lab-html.zip` | HTML-only transfer ZIP | regenerate |
| `dist/structural-reliability-lab-complete.zip` | full delivery ZIP | regenerate |
| `docs/formula_card.pdf` | English A4 formula card | regenerate if formulas change |
| `docs/zh/formula_card_zh.pdf` | Chinese formula card | preserve |

Build command:

```powershell
python tools/build.py
# output: dist/structural-reliability-lab.html
# copy:   structural-reliability-lab.html (byte-identical)
# inlined: 1 CSS + 11 JS
```

## 4. File map by responsibility

### Runtime core

| File | Responsibility |
|---|---|
| `src/js/math.js` | normal PDF/CDF/inverse CDF, 2×2 linear algebra, covariance, Cholesky |
| `src/js/model.js` | transform, MVFOSM, AFOSM, FORM/HLRF, SORM, MC, R–S interference, tangent error, exact integral |
| `src/js/charts.js` | Canvas 2D plot primitives and all station drawings; font scaling |
| `src/js/ui.js` | number formatting, rail/inspector/table DOM, toast/status helpers |
| `src/js/stations.js` | station definitions, render/activation, step animations, per-station controls |
| `src/js/custom.js` | Station 10 parser, evaluator, finite-difference solver, custom drawing; `custom.plot.redraw = draw` |
| `src/js/formulas.js` | generated inline-SVG formula content and β↔Pf table |
| `src/js/pseudocode.js` | pseudocode payloads shown in the code drawer |
| `src/js/app.js` | state, boot, URL parameters, keyboard, reset, mobile/projector mode |
| `src/js/i18n.js` | DOM/Canvas translator, language switch, MutationObserver, audit helpers |
| `src/js/i18n-data.js` | Chinese→English catalog: `exact` map + `phrases` list |

### Independent references

| Path | Responsibility | Command |
|---|---|---|
| `code/00_overview.js` … `code/10_custom_function.js` | module-by-module JS recomputation, independent of page runtime | `node code/verify.js` |
| `code/shared/math.js`, `code/shared/example.js` | shared reference math/example | — |
| `python/reliability.py` | standard-library Python implementation | `python python/run_all.py` |
| `python/run_all.py` | default case + assertions | above |
| `matlab/rel_*.m` | base MATLAB implementation, no toolbox | `matlab -batch "cd('matlab'); rel_run_all"` |
| `tests/test_math.js` | numerical regression of the page math | `node tests/test_math.js` |
| `reference_values.py` | standalone reference-value generator/check | `python reference_values.py` |

### Content / delivery

| Path | Responsibility |
|---|---|
| `docs/user_guide.md` | UI, URLs, keys, print, self-test |
| `docs/formulas_by_module.md` | formulas → code → displayed values |
| `docs/verification_report.md` | independent verification (39 checks) |
| `docs/benchmark_values.md` | reference values, iterations, exact integral |
| `docs/lecture_script.md` | 45-minute classroom route |
| `docs/review_fixes.md`, `docs/review_report.md` | review history |
| `docs/zh/*.md` | Chinese originals, English filenames |
| `requirements.md` | requirements/design decisions |
| `PACKAGE_README.md` | delivery-package instructions |
| `README.md` | human-facing project overview |

## 5. Station map

| # | Station | Main source | Reference module |
|---|---|---|---|
| 0 | Overview | `stations.js`, `ui.js`, `charts.js` | `00_overview.js` |
| 1 | Variable transform X→Y→Z→U | `stations.js`, `charts.js` | `01_transform.js` |
| 2 | R–S probability interference | `stations.js`, `charts.js` | `02_interference.js` |
| 3 | MVFOSM | `stations.js`, `charts.js` | `03_mvfosm.js` |
| 4 | AFOSM / design point | `stations.js`, `model.js` | `04_afosm.js` |
| 5 | FORM / HLRF | `stations.js`, `model.js` | `05_form_hlrf.js` |
| 6 | SORM / Breitung | `stations.js`, `model.js` | `06_sorm.js` |
| 7 | Monte Carlo | `stations.js`, `model.js` | `07_monte_carlo.js` |
| 8 | Formulas & code card | `formulas.js`, `ui.js` | `08_formulas.js` |
| 9 | All methods + tangent error | `stations.js`, `charts.js` | `09_tangent_error.js` |
| 10 | Custom function lab | `custom.js` | `10_custom_function.js` |

## 6. Verification contract

Run after any numerical or source change:

```powershell
node tests/test_math.js
# expect: 20/20 passed

node code/verify.js
# expect: 39/39 passed

python python/run_all.py
# expect: all assertions passed
```

Optional MATLAB:

```powershell
matlab -batch "cd('matlab'); rel_run_all"
# expect: all assertions passed (base MATLAB, R2025a tested)
```

Page self-test:

```text
structural-reliability-lab.html?selftest=1
# expect: 20/20 PASS
```

Expected default values (do not silently change):

| Method | β | Pf |
|---|---:|---:|
| MVFOSM | 1.664 | 4.8046% |
| AFOSM / FORM | 2.10834 | 1.7501% |
| SORM (Breitung) | 2.10834 | 1.6471% |
| MC reference | — | ≈1.63% |
| Exact 1D integral | 2.108 | 1.6226% |
| R–S interference | 3.000 | 0.135% |
| Tangent: linear/convex/concave/outside-circle | 2.108/2.272/1.729/1.235 | 1.752/1.154/4.193/10.841% |

## 7. i18n rules (important)

Architecture:

```text
Chinese strings in src/index.html and src/js/*
        ↓
src/js/i18n-data.js: exact[zh] = en, phrases[]
        ↓
src/js/i18n.js:
  - walks DOM text + title/placeholder/aria-label
  - MutationObserver translates dynamically inserted DOM
  - patches CanvasRenderingContext2D.fillText/strokeText
  - restores Chinese from WeakMap on switch back
        ↓
top-bar #langToggle → EN / 中文
```

Rules:

1. **Do not replace Chinese UI source strings with English.** They are the Chinese locale and the
   i18n keys.
2. When adding a Chinese UI string, add an English entry to `exact` (or a reusable phrase to
   `phrases`) in `src/js/i18n-data.js`.
3. Dynamic strings built from numbers and Chinese fragments need a phrase entry, not only a full
   exact entry.
4. Canvas labels are translated through the patched `fillText`; add catalog entries for new canvas
   labels.
5. Audit in the browser console after an English change:

```js
RL.I18N.lang
RL.I18N.untranslated()        // DOM Chinese remaining
RL.I18N.untranslatedCanvas()  // Canvas Chinese remaining
RL.I18N.setLang('zh')         // round-trip test
RL.I18N.setLang('en')
```

Expected English audit: only the language button’s `中文` target-language label should remain.

6. Do not add CSS that changes the top-bar layout without re-testing both languages and 390px
   mobile width. `#langToggle` is intentionally kept visible at ≤1024px.

## 8. Build, package, docs

- Build only through `tools/build.py`. It inlines the 11 scripts in the order listed in
  `src/index.html`.
- `src/js/formulas.js` is generated by `tools/gen_formulas.cjs`; edit `tools/formulas.json` or the
  generator, then regenerate. Do not hand-edit generated SVG unless unavoidable.
- The complete package is assembled manually from the repository root; it contains
  HTML + `src/` + `code/` + `python/` + `matlab/` + `docs/` + `tests/` + `tools/` + READMEs.
- After changing any shipped file, regenerate both zips:

```powershell
# conceptual; package assembly is manual
dist/structural-reliability-lab-html.zip
dist/structural-reliability-lab-complete.zip
```

- English docs go in `docs/`; Chinese originals go in `docs/zh/` with the same English basenames.
- English PDF: `docs/formula_card.pdf`; Chinese PDF: `docs/zh/formula_card_zh.pdf`.
- Do not edit files under `backup/`, `_tmp/`, `dist/structural-reliability-lab-package/`;
  they are local/temporary/ignored.

## 9. Common task recipes

### Change a UI label

1. Edit the Chinese source in `src/index.html` / `src/js/*`.
2. Add/update the English entry in `src/js/i18n-data.js`.
3. `python tools/build.py`.
4. Test `?lang=zh` and `?lang=en`; run the i18n audit.
5. If packaged artifacts changed, regenerate zips.

### Change a formula or number

1. Update `src/js/model.js` and any affected station drawing.
2. Update independent references: `code/`, `python/`, `matlab/`.
3. Update `docs/*.md` and `docs/zh/*.md` if displayed values are documented.
4. Run all §6 checks; rebuild; regenerate PDF/zips if needed.

### Change layout / responsive behavior

1. Edit `src/styles.css` and, if needed, `src/js/app.js` / `stations.js`.
2. Verify desktop 1920×1080 and true mobile 390×844 (not just a resized desktop window).
3. Keep the desktop layout unchanged when the change is mobile-only.
4. Rebuild and re-test both languages.

### Change Station 10

- Parser/evaluator/solver/drawing: `src/js/custom.js`.
- The `.plot.redraw = draw` assignment is required; removing it makes the canvas blank.
- Test at least: default parabola, clean sine (`sin(x1) + x2 - 19`), multimodal example
  (`sin(x1) + 2*cos(x2) + 1`), invalid input, and a function with no zero in view.
- Keep the “single design point; MC is the multi-region reference” warning.

## 10. Known pitfalls

- Horizontal mobile overflow is usually caused by the rail/card flex chain; keep
  `width/min-width/max-width: 0` discipline on `.rail`, `.shell`, `.stage`.
- Canvas labels are not DOM: `untranslated()` cannot see them; use `untranslatedCanvas()`.
- The i18n layer uses a WeakMap for originals; do not clone/replace DOM subtrees in a way that
  bypasses `setOriginal` without re-running the audit.
- `document.title` is translated separately from body text.
- Station 9’s 1:1 aspect and zoom transform are intentional; do not reintroduce an aspect toggle.
- `?auto=0` disables first-entry auto-play/auto-sampling; keep it working.
- The page has no analytics, no API key, no external service; do not add one without explicit user
  approval.
- Do not add an npm/pip dependency for the page runtime. Python/MATLAB references are
  standard-library/base-toolbox only.

## 11. Definition of done

A change is complete only when:

- `src/` is the edited source of truth;
- `python tools/build.py` succeeds and root/dist HTML are updated;
- `node tests/test_math.js` → 20/20;
- `node code/verify.js` → 39/39;
- Python assertions pass;
- if UI text changed: English audit is clean except the `中文` toggle label;
- if layout changed: desktop and 390px mobile screenshots checked;
- docs (English + `docs/zh/`) and package zips are updated if affected.

## 12. Versioning and release

- `VERSION` contains the current semantic version; `CHANGELOG.md` is the source of release notes.
- Git tags/releases use `vMAJOR.MINOR.PATCH` (current: `v1.0.0`).
- PATCH = fixes/docs/wording; MINOR = new station/method/language/UI feature;
  MAJOR = incompatible URL/layout/numerical contract.
- Every release should ship these assets:
  - `structural-reliability-lab.html`
  - `dist/structural-reliability-lab-html.zip`
  - `dist/structural-reliability-lab-complete.zip`
  - `docs/formula_card.pdf`
- Before tagging: run §6, rebuild, refresh package ZIPs, check `git status` and the
  privacy scan, then update `VERSION` + `CHANGELOG.md` and create the GitHub release.
