---
name: copilot-pr-review-loop
description: Mandatory loop after each push/PR. Request Copilot, verify it landed, watch for the review with a cap, never assume the monitor caught it.
---

# Copilot PR Review + CI Loop

Do not close a subtask/macro PR after one push.

## Loop

1. Run local gates.
2. Push branch.
3. Open PR.
4. Request Copilot reviewer.
5. Verify Copilot in requested reviewers (REST `requested_reviewers`, not GraphQL `reviewRequests`).
6. Wait for CI and review **with discipline** (see below).
7. Resolve all actionable comments and failing checks.
8. Re-run tests, repush, re-request Copilot, restart the wait.
9. Merge only when all pass and no unresolved actionable comments.

## Primary request

```bash
gh pr edit <PR> --add-reviewer @copilot
```

## Verify the request landed (REST is the truth)

```bash
gh api repos/<owner>/<repo>/pulls/<PR>/requested_reviewers --jq '.users[].login'
```

The `Copilot` login (or `copilot-pull-request-reviewer[bot]` in older repos) must appear. The GraphQL `reviewRequests` field has different semantics (it returns review *requests*, but a re-requested review after a push may not appear there) — always cross-check with REST.

## GraphQL fallback (if `gh pr edit --add-reviewer @copilot` fails)

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
gh api repos/<owner>/<repo>/pulls/<PR>/requested_reviewers
```

The REST payload `reviewers[]=copilot` is not sufficient when Copilot is not shown in reviewer list.

## Wait discipline (NON-NEGOTIABLE)

A background monitor is a *helper*, not a guarantee. Background scripts can stall, hit rate limits, or batch events in a way that swallows a notification. The wait pattern below is mandatory:

1. **Active first poll, immediately after re-request.** Wait ~60s, then run the manual check below. Don't trust the monitor's first event to be the only signal.
2. **Manual check pattern, every 5–10 minutes you are still active in the conversation:**

   ```bash
   gh api repos/<owner>/<repo>/pulls/<PR>/reviews \
     --jq '.[] | select(.user.type=="Bot") | {login: .user.login, state, submitted_at, id}'
   ```

   Note the latest `submitted_at` per bot. If a Copilot row appears with `submitted_at` newer than the last fix-push commit, the review landed — read it now, do not wait for the monitor.

3. **Soft cap: 15 minutes after the most recent re-request.** If Copilot has not submitted by 15 minutes, the monitor is suspect — run the manual check, do not assume "still in flight" for hours.
4. **Hard cap: 30 minutes.** If Copilot has not responded by 30 minutes, escalate: tell the user, run the manual check one more time, and either re-request Copilot or proceed with merge per user authorisation.
5. **Never wait silently across a user turn.** If the user comes back and asks "what's happening", treat that as a forced manual-check trigger — you must run the REST query before answering, never just look at the last monitor event.

## Reading a Copilot review

```bash
# All bot reviews on the PR
gh api repos/<owner>/<repo>/pulls/<PR>/reviews \
  --jq '.[] | select(.user.type=="Bot") | {login: .user.login, state, submitted_at, id}'

# Inline comments from a specific review
gh api "repos/<owner>/<repo>/pulls/<PR>/comments?per_page=100" \
  --jq --argjson rid <REVIEW_ID> '.[] | select(.pull_request_review_id==$rid) |
    "---\n[\(.path):\(.line // .original_line // "?")] (id=\(.id))\n\(.body)"'
```

The Copilot login on this account is **`copilot-pull-request-reviewer[bot]`**. Filter on `.user.login` directly, not on heuristics.

## Background monitor (use as a helper, not a substitute)

If you arm a background monitor:

- Its exit condition must be **"CI terminal OR Copilot submitted (whichever comes second)"**, not AND. AND can deadlock if one side fails to update the captured variable.
- Always emit a heartbeat line every N polls so a stalled monitor is visible (e.g. `[heartbeat] no events; ci=$ci_state; cop_after=$cop_after`).
- Echo `cop_after` and `ci_state` on every iteration so you can grep the monitor's output file for the missed transition after the fact.
- Do not rely on the monitor for the only notification of a Copilot review. Cross-check at the cap timings above.

## Closing the loop

1. Apply every actionable comment (or document why it is non-actionable in a PR comment).
2. Push the fix commit.
3. Post a resolution map as a PR comment, mapping each comment id/path to the resolution.
4. Re-request Copilot via the primary command and verify in `requested_reviewers`.
5. Restart the wait.
6. Merge only when:
   - all actionable comments are addressed,
   - all CI checks are green on the latest commit,
   - the user has authorised merge (do not auto-merge from a destructive-action standpoint).

## Common failures observed

- Background monitor stops emitting after a successful CI event but before a delayed Copilot review. **Mitigation:** the manual check at the 15-minute cap above.
- `gh pr edit --add-reviewer @copilot` returns success but the reviewer is not actually attached. **Mitigation:** REST `requested_reviewers` verification immediately after the call.
- Copilot review arrives within seconds of CI completing, batched into one Monitor notification, and only the `[ci] pass` line is shown. **Mitigation:** always run the manual review query when CI flips terminal.
