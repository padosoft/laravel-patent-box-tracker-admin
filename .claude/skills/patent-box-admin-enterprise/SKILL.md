---
name: patent-box-admin-enterprise
description: Use when working in laravel-patent-box-tracker-admin — planning admin features, slicing macro/subtask work, editing project/*.jsx, api-client.jsx, docs/*, or preparing a release. Enforces macro/subtask branch model, mandatory Copilot review loop, v1 HTTP API contract pin to padosoft/laravel-patent-box-tracker, and the read-order for PROGRESS / ENTERPRISE_PLAN / RULES / LESSON before any code change.
---

# Patent Box Admin Enterprise Skill

## When to use

Trigger this skill any time you are about to:

- modify code under `project/` (UI, API client, fixtures);
- modify `docs/PROGRESS.md`, `docs/ENTERPRISE_PLAN.md`, `docs/RULES.md`, `docs/LESSON.md`;
- open a PR, request Copilot review, or run the convergence/auto-merge flow;
- prepare or tag a release of the admin package.

If the task is purely a read-only question with no file write, no PR, and no release action, you can answer without invoking the full workflow — but you still MUST honor the upstream contract section below when describing API behavior.

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
