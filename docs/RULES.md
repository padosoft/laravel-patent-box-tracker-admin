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

## Upstream Package Pin

- Track stable cut: **`padosoft/laravel-patent-box-tracker` v1.0.1**.
- API base contract: `/api/patent-box/v1/...` with `{data, meta?, error?}` envelope.
- Frozen error taxonomy: `validation_failed`, `not_found`, `conflict`,
  `cost_cap_exceeded`, `internal_error`.
- Any new admin feature MUST be expressible against the public v1 surface.
  Never reach into package internals or private migrations from this repo.

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
4. Verify via `requested_reviewers` REST endpoint (NOT GraphQL `reviewRequests`).
5. Apply fix → push → re-request → wait → repeat until convergence.

### Auto-merge convergence rule (preferred path)

**If ALL of the following are true, MERGE WITHOUT ASKING and continue with the next task:**

1. Local gates pass on the latest pushed commit (e.g. `node scripts/structure-check.mjs`, `composer test`, etc.).
2. **All** CI checks on the PR head commit are `SUCCESS` (no `pending`, no `failure`, no required-but-skipped).
3. The latest Copilot review has **0 inline review comments** AND its body indicates no new comments (e.g. "generated no new comments"), OR Copilot has approved the PR.
4. The PR's REST `mergeable` field is `MERGEABLE` and `mergeStateStatus` is `CLEAN`.

When all four are met, run the squash merge with `--delete-branch`, log the merge SHA in `docs/PROGRESS.md`, and proceed to the next macro/subtask without pausing for human authorisation.

**Do NOT auto-merge if:**

- Any prior review still has unresolved actionable comments.
- The PR touches secrets, credentials, infrastructure, deletions of historical commits, or anything that changes shared external systems beyond the repo itself.
- The user has explicitly said "wait" or "do not merge" anywhere in the active conversation.
- The branch base is not `main` (release branches still require explicit confirmation).

When the rule applies but you bypass it for any of the above reasons, log the bypass reason in `docs/PROGRESS.md` so the audit trail is intact.

### Wait discipline (mandatory)

- A background monitor is a helper, not a guarantee. After re-requesting Copilot following a fix push, ALWAYS cross-check the review state by REST every 5–10 minutes of conversation activity. The exact query is in `.claude/skills/copilot-pr-review-loop/SKILL.md`.
- **Soft cap: 15 minutes** after the most recent re-request — if Copilot has not submitted, run the REST query, do not assume "still in flight".
- **Hard cap: 30 minutes** — escalate to the user, run the REST query, decide between re-request or proceeding with merge per explicit user authorisation.
- When the user pings asking "what's happening?", treat it as a forced manual-check trigger: run the REST query before answering, do not summarise from the last monitor event.

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
