# Claude Instructions For Laravel Patent Box Tracker Admin

Read these in this order before touching application code:

1. `docs/PROGRESS.md`
2. `docs/ENTERPRISE_PLAN.md`
3. `docs/RULES.md`
4. `docs/LESSON.md`
5. `AGENTS.md`
6. `.claude/skills/patent-box-admin-enterprise/SKILL.md`
7. `.claude/skills/copilot-pr-review-loop/SKILL.md`
8. `agents.md`

## Non-Negotiable Rules

- Use macro branches and subtask PRs.
- Update `docs/PROGRESS.md` and `docs/LESSON.md`.
- Request and verify Copilot review for every PR.
- Merge only after local gates pass and CI plus Copilot must-fix comments are clean.
- Keep this repo opt-in admin layer; never ship direct tracker table coupling.

## Skills

- `.claude/skills/patent-box-admin-enterprise/SKILL.md`
- `.claude/skills/copilot-pr-review-loop/SKILL.md`

## Release Rule

Before the final `task/final-release` PR merge:

- docs and API contract are aligned
- `docs/PROGRESS.md` captures final remote blockers/closure
- `docs/LESSON.md` includes Copilot/CI and process learnings
