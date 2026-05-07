# Laravel Patent Box Tracker Admin Rules

## Source Of Truth

- Master plan: `docs/ENTERPRISE_PLAN.md`
- Handoff log: `docs/PROGRESS.md`
- Discoveries: `docs/LESSON.md`
- Agent files: `AGENTS.md`, `CLAUDE.md`, `agents.md`
- Skills: `.claude/skills/patent-box-admin-enterprise/SKILL.md`, `.claude/skills/copilot-pr-review-loop/SKILL.md`

## Task Completion Definition

Un task/subtask è completo solo se vale:

1. Test locali della superficie toccata passano.
2. PR aperta sul branch corretto (subtask→macro, macro→main).
3. Copilot review richiesto e confermato.
4. CI (checks visibili da GitHub) verde per quel PR.
5. Tutti i commenti azionabili di Copilot sono risolti.

## Copilot Request Pattern

Primary:

```bash
gh pr edit <PR_NUMBER> --add-reviewer @copilot
```

Fallback:

```powershell
$prNodeId = gh pr view <PR_NUMBER> --json id --jq .id
$query = @'
mutation RequestReviewsByLogin($pullRequestId: ID!, $botLogins: [String!], $union: Boolean!) {
  requestReviewsByLogin(input: {pullRequestId: $pullRequestId, botLogins: $botLogins, union: $union}) {
    clientMutationId
  }
}
'@
gh api graphql -f query="$query" -F pullRequestId="$prNodeId" -F botLogins[]='copilot-pull-request-reviewer[bot]' -F union=true
gh api repos/padosoft/laravel-patent-box-tracker-admin/pulls/<PR>/requested_reviewers
```

Do not treat REST `reviewers[]=copilot` as proof by itself.

## Testing Rules

- Backend/API task: `composer validate --strict --no-check-publish` and relevant PHPUnit.
- Frontend task: `npm run test`, `npm run build`, `npm run e2e`.
- UI/UX path changed: almeno uno scenario Playwright per interaction critica.
- No local PR closure with green-only-local tests; remote CI check is required.

## Design And UX Rules

- Desktop-first operational style, non-marketing.
- Max border radius: 8px.
- No decorative home page hero.
- Icon-only actions require accessible label/tooltips.
- No overflow, no text clipping at 125% and 150% zoom on main workflow screens.

## Security and Scope Rules

- No direct tracker internals from this repo.
- Do not expose file paths, secrets, or raw credentials in API or UI payloads.
- Dossier download must always be authorized by dossier id/session ownership checks.
- Long-running operations must use async model or explicit queueing simulation if same process.
