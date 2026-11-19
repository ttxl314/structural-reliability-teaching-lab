# Independent Review Report · Structural Reliability Method Comparison Lab

- Reviewer: reviewer (independent review; did not modify `src/`, the HTML, `dist/`, `backup/`, or any other person's documentation)
- Reviewed object: the root `structural-reliability-lab.html` (**419,504 B, 2026-11-19 23:08:29**, SHA256 prefix `9614545775F195C4E212`) and `dist/structural-reliability-lab.html` (**byte-identical** to the root copy); source `src/`.
- Conclusion: **needs fixes before delivery**. 1 blocker, 5 major, 6 minor.
- **Status after fixes (2026-11-19 23:20)**: B1/M1/M2/M3 are fixed; M4/M5 have been handled per `docs/review_fixes.md`; this report keeps the pre-fix snapshot, and acceptance is based on the fix record and the final build.
- Note: this report is based on measurements of the latest build (after the root agent's fixes at 23:08) under Edge 157 headless with `file://`; items already fixed by the root agent (Station 5 iteration-table g threshold, route "several numbers", `reference_values.py` sensitivity output, Station 2 margin chart including 0, Station 2 form-sensitivity table updating with the sliders) are no longer listed as issues. File paths and line numbers cited as `file:line` refer to the reviewed version at the time of review.

---

## Review method (directly reproducible)

| Means | Command / method | Result |
|---|---|---|
| Node numerical tests | `node tests/test_math.js` | **20/20 passed**, main values match the task specification |
| Python baseline | `python reference_values.py` | 1.6641005887/4.8046%, 2.1083396823/1.75008%, κ=0.0611757, SORM 1.64708%, exact 1.62263%, MC(N=4e6) 1.62803%, R−S 3.000, R/S−1 2.08013% all reproduced |
| Page self-test | `?selftest=1` / Help → Run numerical self-test | **20 / 20 passed** (no FAIL item) |
| Interaction automation | injected scripts driving the DOM, 53 assertions | all real interactions passed (see "Verified items") |
| Parameter variant probes | `?station=3&mu1=15`, `?station=6&mu1=15`, `?station=4&mu1=12&mu2=12`, `?station=3&mu1=5&mu2=30`, `?station=3&mu1=15&s1=3&rho=-0.2` | exposed M1/M3 and B1 in this report |
| Layout measurement | `scrollWidth/scrollHeight` measured at 1920×1080 / 1366×768 viewports | 1920: no horizontal overflow; 1366: no horizontal overflow, vertical scrolling allowed |
| Print | `--print-to-pdf --no-pdf-header-footer` + `pdfinfo`/`pdftotext` | A4 **3 pages**, code area hidden, only Station 8 |
| Offline / single file | inspect inline artifacts + `file://` load | 0 `<script src>`/`<link>`/`@import`/`url(`; no external requests; root and dist share the same hash |
| Visual regression | 9-station 1920×1080 screenshots vs `backup/` | **8/9 byte-identical** (Station 7 differs because the backup image is a post-sampling state; not a defect) |

---

## BLOCKER (1 item; must be fixed before delivery)

### B1. AFOSM crashes under legal slider parameters: shows β=0.000 / Pf=50.000%, with an entire NaN column in the iteration table

- **Symptom**: with the main-example parameters set to e.g. `μ1=12, μ2=12, σ1=2, σ2=5, ρ=0.5` (all within slider ranges: μ1∈[5,15], μ2∈[10,30]), Station 4 displays:
  - result panel `β = 0.000`, `Pf = 50.000%`, while the note still says "same design point as FORM (≡)";
  - `afStepTag` = `Step 20 / 20 · β = 0.000 · g = NaN`;
  - all 20 rows of the iteration table are `NaN` (70 occurrences of `NaN` in the DOM text);
  - comparison table FORM β=4.100 (correct; independently brute-force verified as 4.09958), yet the "same design point" conclusion contradicts itself;
  - overview station AFOSM card shows 0.000/50.00%, and the AFOSM bar in `pfBars` jumps to 50%.
- **Reproduction**: `structural-reliability-lab.html?station=4&mu1=12&mu2=12`
- **Scope**: scanning the slider grid (μ1×μ2×σ1×σ2×ρ = 2800 combinations), **256 combinations (about 9%)** return NaN/0; among two-slider combinations (36000), 48 fail, e.g. `(μ1=11,μ2=10)`, `(μ1=13,μ2=16)`. Default parameters and common `?station=5&rho=0.8` etc. do not trigger it.
- **Root cause**:
  - `src/js/model.js:160-174` `solveBeta()` assumes g decreases monotonically along the ray: `while (fhi > 0 && n < 30) hi *= 2`; if no sign change is found it does `return NaN`; the quadratic g under strong correlation / large β may have two positive roots or non-monotonic stretches along the ray, and then fails outright.
  - `src/js/model.js:176-211` `afosm()` has no NaN guard: after `betaNew = NaN` the point `x` becomes NaN, subsequent `solveBeta(NaN)` collapses the bisection interval, ending with `beta≈4e-28` (displayed as 0.000), while `xStar` stays NaN.
- **Suggested fix**:
  1. Change `solveBeta` to "scan for the first +→− interval and then bisect" (e.g. step 0.05 up to 50), and return `null` when unsolvable;
  2. Have `afosm` detect unsolvable/NaN and **fall back to FORM's design point and β** (same design point, values still correct), or at least display "AFOSM did not converge under this parameter set; see the FORM result", and **not output 0.000/50%**;
  3. Add 2–3 "stress parameter" cases to `?selftest=1` (e.g. μ1=12,μ2=12; μ1=15,σ1=3,ρ=-0.2) to prevent regression.

---

## MAJOR (5 items)

### M1. Five residual static numbers/texts at parameter-linked places, which contradict the dynamic results after a parameter change

| # | Location (source) | Display under default parameters | Measured after parameter change | Suggestion |
|---|---|---|---|---|
| a | `src/js/stations.js:566` | `tangent X₂ = 10X₁ − 50` | `?station=3&mu1=15` → β_M=3.323, the tangent still says `10X₁ − 50` (it should be `X₂ = 15X₁ − 112.5`; on this page the tangent always has `X₂ = μ1·X₁ − μ1²/2`) | build the formula dynamically from μ1: `'tangent X₂ = ' + p.mu1 + 'X₁ − ' + (p.mu1*p.mu1/2)` |
| b | `src/js/stations.js:849` (SORM comparison card), `src/js/stations.js:1127` (right result panel) | "SORM brings the error from **+7.9%** down to **+1.5%**", "**1.5%** above the exact value" | `?station=6&mu1=15` → the same card's dynamic bars already compute FORM +17.2%, SORM +1.4%, while the text still says 7.9%/1.5% | generate the text dynamically with `(form.pf-ex)/ex*100`, `(so.pf-ex)/ex*100` |
| c | `src/js/stations.js:987` (MC formula card) | "COV is about **7.8%** for 10k samples and **2.5%** for 100k" | COV=√((1−Pf)/(N·Pf)) varies with Pf: with μ1=15, Pf≈0.045%, and the COV at 10k is ≈47% | compute the COV for both tiers from the current `main.exact`, or change it to "at 10k, COV≈√(1/(N·Pf)); see the measured value on the right" |
| d | `src/js/stations.js:1019` (formula-card comparison table), `src/js/stations.js:1049` (overview card) | "U-space HLRF; **6 steps**", "tangent–foot, **6 steps**" | `?station=4&mu1=12&mu2=12` shows FORM **15** iterations in the comparison table; the HLRF iteration count ranges from 4 to 29 steps within the slider range | use `main.form.history.length-1` dynamically; the overview card can say "HLRF iterations" |
| e | `src/js/stations.js:568-572` | "the cross term **−400.0** makes σ_g **fall** from 41.231 to 36.056" | `?station=3&mu1=15&s1=3&rho=-0.2` → the cross term is **+360.0**, σ_g **rises** from 90.554 to 92.520, while the text still says "falls to" | branch on `cross >= 0 ? 'rises to' : 'falls to'`; the numbers are already dynamic and correct |

- **Assessment**: all 5 places are immediately exposed by "changing one slider" in class, and a/e teach a wrong formula and conclusion, so they are major.
- **General suggestion**: change these places to compute from `main`; for any example numbers, uniformly add the "under default parameters" qualifier (some already have it, e.g. the NOTES/Station 6 intro; follow that convention).

### M2. The formula card (Station 8) comparison table shows the string `null` in the MC row after a parameter change (and it can be printed)

- **Symptom**: after changing any main parameter, the Station 8 "method comparison" table MC row becomes `MC | — | null | go sample on Station 7`; that table goes into the A4 PDF with "Print formula card", meaning `null` gets printed.
- **Location**: `src/js/stations.js:1021` (`mcLive ? mcLive.pf : null`) and `:1031` (`typeof r[2] === 'number' ? ... : r[2]`, where null is concatenated into the string "null").
- **Reproduction**: `?station=3&mu1=15` and then view Station 8; or `?station=8&mu1=15`.
- **Suggested**: route column values uniformly through `r[2] == null ? '—' : ...`; put "go sample on Station 7" in the description column.
- **Comparison**: the same logic already handles `—` correctly in the overview card / comparison table; only this table missed it.

### M3. Parameter sliders allow the mean point to fall into the failure domain (g(μ)<0), the page gives no warning at all, and outputs a negative β and 97.8% failure probability as normal results

- **Symptom**: `?station=3&mu1=5&mu2=30` (reachable by sliders: μ1=5, μ2=30) → `g(μ)=−35`; the page shows MVFOSM `β_M = −2.021`, `Pf = 97.835%`, AFOSM `0.000 / 50.00%`, FORM `1.552 / 6.04%`, exact `93.79%`, and the error bars show `AFOSM/FORM −93.6%`; there is no warning throughout, and the negative β is neither hidden nor explained.
- **Scope**: among 2800 slider-grid combinations, **480 (17%)** have `g(μ)<0` (e.g. μ1=5 with μ2≥13 triggers it), which is within the normally draggable area.
- **Location**: `src/js/model.js:98-117` (MVFOSM) and `:120-157` (HLRF) do no domain check; `src/js/stations.js:1093-1153` result panel does not discriminate either.
- **Suggested**: when `main.mv.muG <= 0`, show a prominent prompt in the result panel/top ("Mean point already in the failure domain: Φ(−β) and first-order methods are not applicable; adjust μ or use MC"), and grey out the AFOSM/FORM/SORM rows or add "—"; at the very least, do not show "same design point as FORM" and `β=0.000` on the same screen.

### M4. The printed formula card measures 3 A4 pages, exceeding the acceptance criterion "within two pages"

- **Symptom**: `--print-to-pdf` outputs **3 A4 pages**; page 3 contains only the "β ↔ Pf conversion" section (about 5 lines), while pages 1 and 2 each leave large blank areas at the bottom. The code area is correctly hidden (the `algorithm pseudocode` text is not in the PDF), and only Station 8 is printed — both of these pass.
- **Evidence**: `pdfinfo` → Pages: 3; `pdftotext` page 3 contains only `β ↔ Pf conversion` + `β=2.0 → 2.28%…`.
- **Location**: `src/styles.css:626-649` print block; `:639` `.fs-section{break-inside:avoid}` moves whole large sections to a new page; `:643` `.fi-formula svg{max-height:34mm}` is too large.
- **Suggested**: lower the SVG cap to ~26–28 mm, tighten the `.fs-item` padding further, and allow breaking inside later sections (remove `break-inside:avoid` for `.fs-section:nth-of-type(n+4)`), targeting 2 pages.
- **Note**: `docs/user_guide.md:209` already says "measured 3 A4 pages on this machine", which conflicts with requirements §10 #11 "within two pages". **Either fix it to 2 pages, or change the acceptance/docs wording after confirmation by the owner**; the two cannot both stand.

### M5. Projector font sizes are overall smaller than requirements §8.2 (measured at 1920×1080)

- **Measured** (headless 1920×1080, `getComputedStyle`): body `.lede` **14px** (requirements 18–20px), body default 14px, card title 11px, canvas coordinates/labels **10.5–11px** (requirements "canvas labels ≥16px"), large result numbers **42px** (requirements 48–64px). The requirements also mention "projector mode: body 22px, large numbers 72px, one-click toggle"; the current page **has no projector-mode toggle**.
- **Impact**: in an 8 m projection, 10.5px canvas labels (β axis, U*, legend) are strenuous; this risks acceptance #8 "readable from 8 m".
- **Suggested**: add a "projector mode" (top bar or help) that uniformly enlarges: root font 14→16–17px, canvas font 10.5→13px, tag 11→13px, big numbers 42→56px; or at least tie the `charts.js` `FONT` sizes to the page root font size.
- **Note**: this needs a product decision (if the current compact layout is accepted, update the requirements/docs in sync to avoid disputes at acceptance).

---

## MINOR (6 items; suggested but not blocking delivery)

1. **Station 5 has 8px of vertical scrolling at 1920×1080**: `stageScrollH=986 > clientH=978` (the other stations fit within 978; the long Station 8 formula-card page is expected). Acceptance #9 requires "no vertical scrolling". Location: `src/styles.css:394` `.two-mini-charts{margin-top:14px}` / `.stage` padding; reducing that margin or the bottom padding by 8px is enough.
2. **Redundant formatting for very small Pf**: `?station=2&muR=40` → `Pf = 2.87×10⁻⁷ (0.0000%)`, where the 0.0000% in parentheses is uninformative. Location: `src/js/math.js:182-188` `fmt.pct`'s `<0.01%` branch; suggested to return scientific notation only.
3. **Misleading MC empty-state legend**: on Station 7 before any sampling, the "running estimate and 95% CI" chart still shows the "running estimate" legend item but no data. Location: `src/js/stations.js:964-968`; suggested to keep only "exact/FORM" when `m.hist.length===0`, or add a "click to sample" empty state.
4. **Overview-page MC card and formula card disagree**: after changing parameters and sampling on Station 7, the overview card still shows `—`/go sample (`stations.js:1051`), while Station 8's MC row shows this sampling's value (`stations.js:1021`). Suggested to unify (both use `mcArg()`).
5. **Documentation wording**: `docs/user_guide.md:48` says AFOSM "converges in 6 steps" without "under default parameters" (after a parameter change it can be 5–20 steps); `:209` print 3 pages conflicts with requirements 2 pages (see M4). Documented-number spot checks: 1.664/2.108/1.750/1.647/1.623/1.628, 196%, 83.6%, 0.0612/0.941, stations 0–8, `?station/trans/mode/hlr/af/mc/code/selftest` are all consistent with the implementation (`?station=5&hlr=2`, `?station=5&code=form`, `?selftest=1` etc. verified working).
6. **Deliverable gaps**: requirements §11.1's `docs/formula_card.pdf` (P1) and the root `README.md` currently do not exist; `docs/user_guide.md`, `docs/benchmark_values.md` and `docs/lecture_script.md` appeared during the review (spot-checked consistent). Just add the PDF (export from the current 3-page version, or after fixing it to 2 pages).
   - Also: `backup/station7_monte_carlo.png` differs from the "default open" screenshot (the backup image is a post-sampling state containing the sample cloud); as a backup image it is actually better, but please be aware it is not the default state; the other 8 are **byte-identical** to the current build.

---

## Verified items (no need to re-check)

- **Numerics**: `node tests/test_math.js` 20/20; all `reference_values.py` baselines reproduced; the page's `?selftest=1` UI shows **20 / 20 passed**; AFOSM and FORM share the design point under default parameters (β equal to 1e-10, x* differs by 7e-5, visible only at the 4th decimal); PCA whitening leaves β unchanged (2.10834); FORM β for both R−S and R/S−1 is 3.000, MVFOSM 3.000→2.080; MC reference N=4×10⁶, Pf=1.628025%, se=6.328e-5 matches `reference_values.py`; sampling with the fixed seed 20261119 is reproducible.
- **Interaction** (injected scripts, all 53 assertions passed): switching between the 9 stations and active highlighting; keyboard ←/→, 0–8, Space, S, R, ?; 5 parameter sliders recompute in real time; reset; HLRF single-step/play/pause/back-to-start/click-a-row replay (table 7 rows, k=0–6); AFOSM single-step/play/back-to-start (table 6 rows); SORM "magnify ×3" and "osculating circle" checkboxes; MC +1k/continuous sampling/sample to 100k/reset/X↔U toggle (at 100k, N=100,000 and the CI narrows normally); Station 1 four-step transform and Cholesky/PCA switch; Station 2 R/S sliders linked to the form-sensitivity table; code drawer (pseudocode/JS tabs, copy, close); help + self-test; 45-minute route (9 rows, click to jump); teaching-notes collapse; no `#errorBanner` throughout.
- **Offline / single file**: the root HTML has **0** `script src`/`link`/`@import`/`url(`; 8 inline `<script>` and 1 inline `<style>`; 24 formula SVGs all inline; `http://` appears only in the SVG `xmlns` namespace (produces no request); double-clicking works under `file://`; root and dist are byte-identical; `src/index.html` rendered directly and the build artifact have identical screenshot hashes (proving the build is lossless).
- **Layout**: at 1920×1080, horizontal overflow is 0 for all 9 stations; at 1366×768 the left column is iconified (74px), with no horizontal overflow and usable vertical scrolling (meets "vertical scrolling allowed").
- **Print**: only Station 8 is printed; the top bar/navigation/right panel/status bar/dialogs/pseudocode area are all hidden; the A4 layout is the formula-card content (page-count issue see M4).
- **Visual regression**: new 9-station 1920×1080 screenshots were compared with `backup/`; 8/9 are byte-identical, showing that the backup images are in sync with the current build and that no silent visual regression occurred.

---

## Suggested fix order

1. **B1** AFOSM NaN (including the fallback and stress tests) — otherwise "change a slider and NaN appears", which is uncontrollable in class.
2. **M2** formula-card `null` (smallest change, affects the printout) → **M1** the 5 static texts → **M4** print page count.
3. **M3** mean-point failure-domain prompt (can be done together with the B1 fallback logic).
4. **M5** projector font sizes (a product-decision item; can be scheduled together with the M4 print layout).
5. For the minor items, prioritise items 1 and 2 (about 10 minutes each).

> Assessment scope: this report records only "user-visible, reproducible" issues; fixed items and verified items are no longer counted. After fixing B1 + M1/M2, re-run `?selftest=1`, the 5 parameter-probe URLs in this report, and `?station=4&mu1=12&mu2=12` to confirm there is no regression.
