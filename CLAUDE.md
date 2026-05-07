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
