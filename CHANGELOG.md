# Changelog

All notable changes to this teaching lab are documented here.

The project uses semantic versioning (`MAJOR.MINOR.PATCH`) and tags releases as `vX.Y.Z`.
Iteration policy:

- **PATCH** — fixes, wording, documentation corrections, no numerical/UI contract change.
- **MINOR** — new station, new method, new language, or backwards-compatible UI feature.
- **MAJOR** — incompatible information architecture, URL contract, or rebuilt numerical model.

## 1.0.0 — 2026-11-20

First versioned release.

### Added

- Single-file offline structural-reliability teaching page with 11 stations (0–10):
  overview, X→Y→Z→U transform, R–S interference, MVFOSM, AFOSM, FORM/HLRF,
  SORM/Breitung, Monte Carlo, formulas/code card, all-methods + tangent-error
  comparison, and a custom `g(x₁,x₂)` lab.
- Bilingual UI (Chinese/English) with a top-bar switch, browser-language default,
  `?lang=zh|en`, and remembered manual choice.
- Automatic mobile layout (≤760 px, or touch landscape) with horizontal station rail,
  single-column cards, full-width canvases, scrollable tables, and a compact top bar.
- Station 9 fixed 1:1 combined plot with zoom/pan and tangent-error cases.
- Independent reference implementations: module-by-module JavaScript (`code/`),
  standard-library Python (`python/`), and base MATLAB (`matlab/`).
- Verification: 20/20 page math checks, 39/39 independent module checks, Python assertions.
- English reports and a 3-page A4 English formula card; Chinese originals under `docs/zh/`.
- English-primary repository naming, comments, README, requirements, and delivery docs.
- `AGENTS.md` AI-agent repository map, package ZIPs, and reproducible build script.

### Changed

- Main HTML renamed to `structural-reliability-lab.html`.
- Documentation renamed to English filenames; Chinese originals moved to `docs/zh/`.
- Generated root and `dist/` HTML kept byte-identical.

### Notes

- Teaching/demo software; not certified engineering software.
- The page uses an Abramowitz–Stegun normal-CDF approximation; the Python reference is more precise.
- MC seed `20261119` affects Monte Carlo only and is shown on Stations 7/10.
