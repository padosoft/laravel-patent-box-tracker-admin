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
2. **All** CI checks on the PR head commit are passing — `gh pr checks <PR>` reports each row as `pass` (no `pending`, no `fail`, no required-but-`skipping`). The equivalent JSON form is `gh pr view <PR> --json statusCheckRollup` returning a **non-empty** array where every entry has `status=="COMPLETED"` and `conclusion=="SUCCESS"`. The `length > 0` guard is non-negotiable: `[ ] | all` evaluates to `true` in jq, so an empty rollup would otherwise satisfy the check vacuously. Use the full expression `(.statusCheckRollup | length > 0) and ([.statusCheckRollup[] | (.status=="COMPLETED" and .conclusion=="SUCCESS")] | all)` and require the result to be `true`.
3. The latest Copilot review **for the current PR head commit** has **0 inline review comments** AND its body indicates no new comments (e.g. "generated no new comments"), OR Copilot has explicitly approved the PR (review state `APPROVED`). The filter applied to `gh api .../pulls/{n}/reviews` is non-negotiable and has three predicates that must all hold:
   - **login**: `.user.login == "copilot-pull-request-reviewer[bot]"` (or whatever login is canonical for the repo) — a human reviewer or a third-party bot on HEAD MUST NOT be treated as the Copilot quiet/approval signal;
   - **head-SHA anchor**: `.commit_id == headRefOid` — a stale review of an older commit MUST NOT satisfy this gate after a new push;
   - **state whitelist**: `.state == "APPROVED" or .state == "COMMENTED"` — never `PENDING` (in-flight), never `DISMISSED` (explicitly invalidated by a maintainer).

   Apply all three before sorting by `submitted_at` and taking the last. The inline-count / body / state evaluation runs only on the row that survives all three filters.
4. The PR is mergeable. Use `gh pr view <PR> --json mergeable,mergeStateStatus` (which surfaces GitHub's GraphQL fields) and require `mergeable=MERGEABLE` and `mergeStateStatus=CLEAN`. The REST endpoint exposes the same signal under different names (`mergeable: true` and `mergeable_state: "clean"`); pick one API and match the field names to it.
5. **Zero unresolved review threads.** Query `repository.pullRequest.reviewThreads` via GraphQL and count nodes where `isResolved == false AND isOutdated == false`. The count must be `0` (with pagination handled — see the executable form in `.claude/skills/copilot-pr-review-loop/SKILL.md`, which fails the gate if more pages remain than the cap allows). Outdated threads (no longer applying to the current diff after a force/rebase push) are safe to ignore; non-outdated unresolved threads from any prior reviewer (Copilot, codex bot, human) MUST block auto-merge. Threads that were addressed in a fix commit are NOT auto-resolved by GitHub — the SKILL's "Closing the loop" step requires programmatically marking them resolved via the `resolveReviewThread` mutation after each fix push so this gate can fire.

When all five are met, run the squash merge with `--delete-branch`, log the merge SHA in `docs/PROGRESS.md`, and proceed to the next macro/subtask without pausing for human authorisation.

**Do NOT auto-merge if any of the following hold (canonical bypass list — `.claude/skills/copilot-pr-review-loop/SKILL.md` defers to this list):**

- Any actionable comment from any prior review remains unaddressed (no fix commit posted, no resolution-map note explaining why it is non-actionable). Note that this is distinct from condition #5 above: condition #5 fails when a thread's `isResolved` flag is still `false` regardless of whether the underlying issue was actually addressed; this bypass fires when the issue itself was not addressed (or was rejected without justification).
- The PR touches secrets, credentials, infrastructure, deletions of historical commits, or anything that changes shared external systems beyond the repo itself (deploys, cron jobs, third-party API keys).
- The user has said any of the following — or a clear synonym — anywhere in the active conversation since the PR opened: `"wait"`, `"do not merge"`, `"don't merge"`, `"stop"`, `"hold off"`, `"pause"`, or an equivalent imperative to halt the loop.
- The branch base is not `main` (release branches and stacked PR chains still require explicit user confirmation per the macro/subtask rules).

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
