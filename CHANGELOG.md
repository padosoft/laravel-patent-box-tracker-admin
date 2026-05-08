# Changelog

All notable changes to `padosoft/laravel-patent-box-tracker-admin` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Community-grade `README.md` with badge row, hero screenshot, full TOC, "Why this panel exists", architecture diagram, responsibility matrix, screenshots gallery (9 surfaces under `resources/screenshoots/`), install paths (drop-in static + planned Composer), quick start, configuration reference, operator workflows, full v1 endpoint mapping, security model, dedicated section for the included Claude Code vibe-coding pack, project layout, testing matrix, roadmap snapshot, contributing, license & credits.
- `package.json` + `scripts/structure-check.mjs` baseline gate that validates the static prototype's required files, the `api-client.jsx` endpoint surface, the `invalid_repository → validation_failed` alias and the `index.html` script-tag wiring.
- `scripts/serve.mjs` — zero-dep static server for local + Playwright runs.
- `playwright.config.ts` + `tests/e2e/smoke.spec.ts` — minimal smoke harness asserting the shell boots without console errors and exposes the full `TrackerApi` surface on `window`.
- `.github/workflows/ci.yml` — two-stage CI: structure check + Playwright smoke (Chromium) with report artefact.
- `.gitignore` covering `node_modules/`, `playwright-report/`, `test-results/`.
- `docs/ENTERPRISE_PLAN.md` completion table snapshot (Macro 0–5 ✅, Macro 6 🟡, Macro 7 🟡 with explicit polish gaps).
- Upstream package contract section in `.claude/skills/patent-box-admin-enterprise/SKILL.md` and `docs/RULES.md` pinning `padosoft/laravel-patent-box-tracker` `v1.0.1`, listing the full v1 endpoint surface, and freezing the error taxonomy.

### Changed
- Internal session log (`docs/PROGRESS.md`) and reusable findings (`docs/LESSON.md`) updated with this session's audit and conclusions.

### Notes
- No code changes to `project/*.jsx` were required: the existing API client already covers the full `v1.0.1` surface, including the `invalid_repository → validation_failed` legacy alias and bearer-token support.
- Two UX polish gaps remain explicitly tracked in `docs/ENTERPRISE_PLAN.md`: integrity-check button binding and dossier detail drawer.

## Tag candidate

A `v1.0.0` tag will be cut once:

1. CI is green on `main` (structure check + Playwright smoke);
2. the two Macro 6.4 polish gaps are landed (integrity button + dossier drawer);
3. release notes are signed off and a Composer install path is in place.

Until then, this repo stays on rolling `main` with the snapshot table in `docs/ENTERPRISE_PLAN.md` as the source of truth for completion state.
