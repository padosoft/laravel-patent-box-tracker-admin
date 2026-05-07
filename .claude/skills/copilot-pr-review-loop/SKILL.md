---
name: copilot-pr-review-loop
description: Mandatory loop after each push/PR: Copilot request + CI + comment closure before merging.
---

# Copilot PR Review + CI Loop

Do not close a subtask/macro PR after one push.

## Loop

1. Run local gates.
2. Push branch.
3. Open PR.
4. Request Copilot reviewer.
5. Verify Copilot in requested reviewers.
6. Wait for CI and review.
7. Resolve all actionable comments and failing checks.
8. Re-run tests, repush, re-request if needed.
9. Merge only when all pass and no unresolved actionable comments.

## Primary

```bash
gh pr edit <PR> --add-reviewer @copilot
```

## GraphQL Fallback (if primary fails)

```powershell
$prNodeId = gh pr view <PR> --json id --jq .id

$query = @"
mutation RequestReviewsByLogin(`$pullRequestId: ID!, `$botLogins: [String!], `$union: Boolean!) {
  requestReviewsByLogin(input: {pullRequestId: `$pullRequestId, botLogins: `$botLogins, union: `$union}) {
    clientMutationId
  }
}
"@

gh api graphql -f query="$query" -F pullRequestId="$prNodeId" -F botLogins[]='copilot-pull-request-reviewer[bot]' -F union=true
gh api repos/padosoft/laravel-patent-box-tracker-admin/pulls/<PR>/requested_reviewers
```

The REST payload `reviewers[]=copilot` is not sufficient when Copilot is not shown in reviewer list.
