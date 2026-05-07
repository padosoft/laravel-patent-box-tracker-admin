---
name: patent-box-admin-enterprise
description: Use for planning and executing Laravel Patent Box Tracker admin companion work with mandatory macro/subtask PR loop, Copilot review gate, and progress/lesson discipline.
---

# Patent Box Admin Enterprise Skill

## First Step in Any Session

Read in order:

1. `docs/PROGRESS.md`
2. `docs/ENTERPRISE_PLAN.md`
3. `docs/RULES.md`
4. `docs/LESSON.md`
5. `AGENTS.md`
6. `CLAUDE.md`
7. `agent.md` (compat)
8. `AGENTS.md` (for `agents.md` naming compatibility)

## Mandatory Workflow

1. Confirm branch and plan stage.
2. Implement one coherent slice.
3. Run local gates for that slice.
4. Update `docs/PROGRESS.md`.
5. Open PR for subtask.
6. Request Copilot review.
7. Verify Copilot trigger.
8. Fix all actionable feedback and CI failures.
9. Merge and proceed.

## Mandatory Gates

- API tasks: `composer validate --strict --no-check-publish`, `vendor/bin/phpunit` (or `composer test` if configured).
- Frontend tasks: `npm run test`, `npm run build`, `npm run e2e`.
- UI interactions added/changed: required Playwright scenario coverage.
- Never close a subtask before all gates pass and Copilot comments are resolved.

## Copilot Request Fallback

If `gh pr edit <PR> --add-reviewer @copilot` fails (scope/read:project or resolver issue), use GraphQL with:

- botLogin: `copilot-pull-request-reviewer[bot]`
- `union=true`

Verify via `requested_reviewers`.

REST `reviewers[]=copilot` is not equivalent if Copilot is not visible in reviewers.

## Documentation Discipline

- Keep `docs/LESSON.md` updated with reusable findings.
- Keep `docs/PROGRESS.md` updated with branch/PR/CI/Copilot state.
- Sync discovered process improvements into `docs/RULES.md` and skills.
