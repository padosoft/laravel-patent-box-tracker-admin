---
name: copilot-pr-review-loop
description: Mandatory loop after each push/PR. Requires Copilot review request, CI green, and comment resolution before merge.
---

# Copilot PR Review + CI Loop

Do not close a subtask/macro PR after a single push.

1. Run local tests.
2. Open PR.
3. Request Copilot reviewer.
4. Verify Copilot is in requested reviewer list.
5. Wait for CI and Copilot feedback.
6. Resolve actionable comments and CI failures.
7. Re-run tests, push, repeat.
8. Merge only when both are clean.

Primary:

```bash
gh pr edit <PR> --add-reviewer @copilot
```

Fallback (GraphQL):

```powershell
$prNodeId = gh pr view <PR> --json id --jq .id

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

The REST endpoint with `reviewers[]=copilot` is not sufficient alone.
