# Changelog

All notable changes to `padosoft/laravel-patent-box-tracker-admin` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_No unreleased changes._

## [1.0.1] - 2026-05-09

### Changed

- Community `README.md` polish: aligned the **Roadmap** snapshot with the actual `v1.0.1` cut (Macro 0–7 closed, integrity-check button + dossier detail drawer noted as shipped, post-1.0 backlog made explicit), added an **Admin release** badge row entry, replaced "Macro 6 polish slice" forward-references with neutral "v1.0.x follow-up" wording in the Settings, Configuration reference, Security and Testing sections, and removed the stale "(drawer planned)" annotation from the v1 endpoint table now that `getDossier` powers a live drawer.
- `.claude/skills/patent-box-admin-enterprise/SKILL.md`: rewrote the YAML `description` in the "Use when…" trigger style required by the Claude skill conventions so the agent picks the skill up reliably for code edits, doc edits, PR work and release prep; added an explicit "When to use" section that enumerates the trigger surfaces.
- `.claude/skills/copilot-pr-review-loop/SKILL.md`: rewrote the YAML `description` to spell out the exact behaviour (request reviewer → REST verify → poll with 15min/30min caps → run the five-condition convergence gate → auto-merge with `--squash --delete-branch`), so the skill is recoverable from intent like "after I push, what do I do?".

### Notes

- No runtime code changes — the v1 API surface in `project/api-client.jsx`, the integrity-check button and the dossier drawer (both shipped in `v1.0.0` via PRs #5 and #6) are unchanged.
- Tracker compatibility floor remains `>= v1.0.1`.

## [1.0.0] - 2026-05-09

### Added

- Community-grade `README.md` with badge row, hero screenshot, full TOC, "Why this panel exists", architecture diagram, responsibility matrix, screenshots gallery covering every operator surface under `resources/screenshoots/`, install paths (drop-in static + Composer), quick start, configuration reference, operator workflows, full v1 endpoint mapping, security model, dedicated section for the included Claude Code vibe-coding pack, project layout, testing matrix, roadmap snapshot, contributing, license & credits.
- `package.json` + `scripts/structure-check.mjs` baseline gate that validates the static prototype's required files, the `api-client.jsx` endpoint surface, the `invalid_repository → validation_failed` alias and the `index.html` script-tag wiring.
- `scripts/serve.mjs` — zero-dep static server for local + Playwright runs.
- `playwright.config.ts` + `tests/e2e/smoke.spec.ts` — minimal smoke harness asserting the shell boots without console errors and exposes the full `TrackerApi` surface on `window`.
- `.github/workflows/ci.yml` — two-stage CI: structure check + Playwright smoke (Chromium) with report artefact.
- `.gitignore` covering `node_modules/`, `playwright-report/`, `test-results/`.
- Upstream package contract section in `.claude/skills/patent-box-admin-enterprise/SKILL.md` and `docs/RULES.md` pinning `padosoft/laravel-patent-box-tracker` `v1.0.1`, listing the full v1 endpoint surface, and freezing the error taxonomy.
- `composer.json` package manifest for `padosoft/laravel-patent-box-tracker-admin` with Laravel auto-discovery.
- `src/PatentBoxTrackerAdminServiceProvider.php` with publish tag `patent-box-admin-assets`.
- Composer install path for host apps: `php artisan vendor:publish --tag=patent-box-admin-assets` publishes static panel assets to `public/vendor/patent-box-admin`.
- Macro 6.4 polish: integrity-check button bound to `TrackerApi.verifySessionIntegrity` on the session detail header (toast + banner with verified-at timestamp), and a dossier detail drawer (`DossierDrawer`) consuming `TrackerApi.getDossier` (format/locale, full SHA-256, byte size, generated_at, storage path, parent session id, session-scoped download).

### Changed

- Macro 7.4 closure documented across `README.md`, `docs/ENTERPRISE_PLAN.md`, and `docs/PROGRESS.md`.
- Macro status now marked 100% complete (Macro 0–7).

## [1.0.0] - 2026-05-09

### Added

- `composer.json` package manifest for `padosoft/laravel-patent-box-tracker-admin` with Laravel auto-discovery.
- `src/PatentBoxTrackerAdminServiceProvider.php` with publish tag `patent-box-admin-assets`.
- Composer install path for host apps: `php artisan vendor:publish --tag=patent-box-admin-assets` publishes static panel assets to `public/vendor/patent-box-admin`.

### Changed

- Macro 7.4 closure documented across `README.md`, `docs/ENTERPRISE_PLAN.md`, and `docs/PROGRESS.md`.
- Macro status now marked 100% complete (Macro 0–7).
