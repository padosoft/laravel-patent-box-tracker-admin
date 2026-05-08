# Laravel Patent Box Tracker Admin Rules

## Source Of Truth

- Enterprise plan: `docs/ENTERPRISE_PLAN.md`
- Handoff summary: `docs/PROGRESS.md`
- Lessons: `docs/LESSON.md`
- Runtime rules: `AGENTS.md`, `CLAUDE.md`, `agent.md`, `agents.md`
- Skills: `.claude/skills/patent-box-admin-enterprise/SKILL.md`, `.claude/skills/copilot-pr-review-loop/SKILL.md`

## Scope

- This repo delivers the operator admin layer for `laravel-patent-box-tracker`.
- Backend package internals remain in the package repo and are consumed through documented API contracts.
- Release policy follows the root package release cadence and release branches.

## Task Completion Criteria (Absolute)

A task/subtask is closed only when all conditions below are true:

1. All required local gates are green.
2. Subtask PR is open against the correct macro branch (or macro PR against `main`).
3. Copilot reviewer request is sent and confirmed in PR payload.
4. All CI checks for that PR are green.
5. No unresolved actionable Copilot comments.

If remote review or CI cannot be verified in-session, the item stays open with explicit blocker notes in `docs/PROGRESS.md`.

## Branch and PR Model

- Macro branch: one branch per macro task.
- Subtask branch: created from macro branch.
- PR target: subtask PR -> macro branch; macro PR -> `main`.
- Canonical branch names use `task/<name>`.
- If local FS blocks slash names, document canonical naming and use local equivalent names.

## Copilot Loop

1. Open PR.
2. Request Copilot via:

```bash
gh pr edit <PR> --add-reviewer @copilot
```

3. If that command fails (scope/resolution), use GraphQL fallback in `.claude/skills/copilot-pr-review-loop/SKILL.md`.
4. Verify via `requested_reviewers` endpoint.
5. Do not merge before review+CI clearance.

## Test Standards

### API/backend-related work

```bash
composer validate --strict --no-check-publish
composer test
```

### Full package regression slices

- `php artisan test` equivalent commands from repo conventions.
- Add feature tests for endpoint behavior and status transitions.

### Admin frontend work

- `npm run test`
- `npm run build`
- `npm run e2e`

### UI/UX change guardrail

If any interaction changes, add at least one Playwright scenario covering the new flow.

## Design Rule

- Follow the design source from the provided admin design file once available.
- Keep admin UI operational: dashboard, sessions, detail, run wizard, integrity/execution states.
- No marketing landing hero.
- Avoid hidden coupling to repository internals.

## Security Rule

- API base URLs, auth tokens, secrets, and raw file paths must not be exposed in logs.
- Download actions must only resolve dossier identifiers by ownership and session context.
- Error payloads for validation/authorization failures must be explicit and stable.

## Documentation Discipline

- Append reusable findings to `docs/LESSON.md`.
- Keep `docs/PROGRESS.md` current with branch, PR, CI, and Copilot state.
- Before macro close, fold discoveries into:
  - `docs/RULES.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `.claude/skills/patent-box-admin-enterprise/SKILL.md`
  - `.claude/skills/copilot-pr-review-loop/SKILL.md`

## Release Rule

No final merge before:

- macro PR gate closure,
- release docs refreshed,
- tag created from `main` (`v.x.x.x`),
- release notes drafted.
