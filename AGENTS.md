# Admin Agents File

This repository is Laravel 13.x + React admin companion for `laravel-patent-box-tracker`.

Read order for session handoff:

1. `docs/PROGRESS.md`
2. `docs/ENTERPRISE_PLAN.md`
3. `docs/RULES.md`
4. `docs/LESSON.md`
5. `AGENTS.md`
6. `CLAUDE.md`
7. `.claude/skills/patent-box-admin-enterprise/SKILL.md`
8. `.claude/skills/copilot-pr-review-loop/SKILL.md`

This repo must remain API consumer only and never access tracker internals directly.

Macro-level branches and PR loop:

- Create one macro branch per large initiative (`task/<name>` style in planning files).
- For each subtask, create a branch from the current macro branch.
- Open PRs with scope aligned to that branch.
- Require Copilot review completion before merge.

If environment limits prevent creating branch names with slash, keep canonical naming in docs and use the local equivalent branch naming already in progress.
