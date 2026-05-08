---
name: patent-box-admin-enterprise
description: Plan and execute Laravel Patent Box admin companion work using macro/subtask PRs, mandatory Copilot loop, and progress/lesson discipline.
---

# Patent Box Admin Enterprise Skill

## Use for

- First step in this admin repo before any implementation change.
- Planning, task slicing, and release preparation for admin + API client UX.

## First Step in Any Session

Read in this exact order:

1. `docs/PROGRESS.md`
2. `docs/ENTERPRISE_PLAN.md`
3. `docs/RULES.md`
4. `docs/LESSON.md`
5. `AGENTS.md`
6. `CLAUDE.md`
7. `agent.md`
8. `agents.md`
9. `.claude/skills/copilot-pr-review-loop/SKILL.md`

## Workflow

1. Confirm active macro/task in `docs/ENTERPRISE_PLAN.md`.
2. Implement one coherent subtask.
3. Run required local gates.
4. Update `docs/PROGRESS.md`.
5. Open PR to the macro branch.
6. Request Copilot review and verify start.
7. Resolve CI + Copilot actions.
8. Merge and continue.

## Mandatory Gates

- Backend/API scoped changes:

```bash
composer validate --strict --no-check-publish
composer test
```

- Admin frontend scoped changes:

```bash
npm run test
npm run build
npm run e2e
```

- For any interaction change in admin UI, add Playwright scenario(s).

## Copilot Review Fallback

Use `.claude/skills/copilot-pr-review-loop/SKILL.md`.

## Design Source

When design is available, implement the admin sections mapped from:

- `index.html`
- embedded README in the provided design package

Keep implementation notes in `docs/LESSON.md` when mapping decisions change component structure.

## Upstream Package Contract

This admin only consumes the public HTTP API of `padosoft/laravel-patent-box-tracker`.

- Track upstream version: latest stable is `v1.0.1` (security patch on top of `v1.0.0`).
- Versioned prefix: `/api/patent-box/v1` (configurable via `PATENT_BOX_API_PREFIX`).
- Envelope: every response is `{data, meta?, error?}` with frozen error taxonomy:
  `validation_failed`, `not_found`, `conflict`, `cost_cap_exceeded`, `internal_error`.
- Auth: optional bearer/header gate via `PATENT_BOX_API_TOKEN`.
- Rate limit: configurable per route stack via `PATENT_BOX_API_RATE_LIMITER`.
- Breaking change vs `v0.1.x`: `POST /v1/repositories/validate` now returns
  `error.code = "validation_failed"` (was `invalid_repository`). The admin client
  keeps an alias for legacy callers but new code MUST emit `validation_failed`.

### Endpoint surface (v1)

- `GET /health`, `GET /capabilities`
- `POST /repositories/validate`
- `POST /tracking-sessions/dry-run`
- `POST /tracking-sessions` (queue) and `GET /tracking-sessions` (list)
- `GET /tracking-sessions/{id}` (detail)
- `GET /tracking-sessions/{id}/commits`
- `GET /tracking-sessions/{id}/evidence`
- `GET /tracking-sessions/{id}/dossiers`
- `POST /tracking-sessions/{id}/dossiers` (queue render)
- `GET /tracking-sessions/{id}/dossiers/{dossier}` (detail)
- `GET /tracking-sessions/{id}/dossiers/{dossier}/download`
- `GET /tracking-sessions/{id}/integrity`

If upstream extends the API, mirror the new method in `project/api-client.jsx`
and document the bump in `docs/PROGRESS.md` and `CHANGELOG`.
