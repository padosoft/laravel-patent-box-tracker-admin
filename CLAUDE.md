# Claude Instructions For Laravel Patent Box Tracker Admin

Read these first before code work:

1. `docs/PROGRESS.md`
2. `docs/ENTERPRISE_PLAN.md`
3. `docs/RULES.md`
4. `docs/LESSON.md`
5. `AGENTS.md`
6. `.claude/skills/patent-box-admin-enterprise/SKILL.md`
7. `.claude/skills/copilot-pr-review-loop/SKILL.md`

## Non-Negotiable Rules

- Use macro/subtask branch model.
- Update `docs/PROGRESS.md` during work and `docs/LESSON.md` for reusable learnings.
- Request Copilot review on every PR and keep loop active until unresolved comments and CI are clean.
- **Auto-merge on convergence — DO NOT pause to ask.** Run the squash merge with `--delete-branch` immediately, log the merge commit in `docs/PROGRESS.md`, and continue with the next subtask the moment all five conditions below hold simultaneously on the current PR head:
  1. local gates pass on the current PR head;
  2. every CI check is `pass` on that same head;
  3. the latest Copilot review on HEAD has the quiet/approval signal — see the three non-negotiables below;
  4. the PR is `mergeable=MERGEABLE` + `mergeStateStatus=CLEAN`;
  5. no review thread is unresolved-and-not-outdated.

  **Three non-negotiables on the Copilot signal (condition #3):**
  - (a) a bare "0 inline comments" is NOT enough — the review state must be `APPROVED`, OR the body must match the "no new comments" sentinel;
  - (b) the review must be against the current head SHA — stale or older-commit reviews MUST NOT satisfy this gate;
  - (c) the review must be from the canonical Copilot bot login (`copilot-pull-request-reviewer[bot]`) AND in the `APPROVED`/`COMMENTED` state whitelist — a human review, a third-party bot, a `PENDING`, or a `DISMISSED` row MUST NOT satisfy the gate.

  Pausing the loop at convergence is a process bug. Full convergence definition, bypass conditions, and the merge command are in `docs/RULES.md` and `.claude/skills/copilot-pr-review-loop/SKILL.md`.
- Never mark a task complete without:
  - all local gates passing
  - PR with requested reviewers, active CI checks, and no unresolved actionable comments
  - merge completed.

## Mandatory Process

1. Confirm current macro/subtask in `docs/ENTERPRISE_PLAN.md`.
2. Implement one bounded subtask.
3. Run required gates for scope.
4. Update `docs/PROGRESS.md` with status/branch/PR details.
5. Open scoped PR.
6. Request Copilot review (primary command + GraphQL fallback if needed).
7. Verify Copilot started before proceeding.
8. Fix, retest, repush, repeat until clean.
9. Merge and continue.

## Release Rule

Final merge and release only after:

- all macro subtasks closed,
- README and API contract docs updated,
- lessons folded back into rules/skills/AGENTS/CLAUDE.

## References

- `docs/RULES.md`
- `.claude/skills/patent-box-admin-enterprise/SKILL.md`
- `.claude/skills/copilot-pr-review-loop/SKILL.md`
- `agent.md` and `agents.md` (compatibility naming)
