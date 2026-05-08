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

- Prefer **`Bash` with `run_in_background`** over `Monitor` for a one-shot "tell me when Copilot reviewed" wait. The `until <copilot-submitted>; do sleep 60; done` pattern emits exactly one completion notification on exit and cannot deadlock on a missed transition.
- If you do use `Monitor`, exit on **the single signal you actually need** (Copilot review submitted), and watch CI separately on demand. Compound `AND` exit conditions can stall when one side fails to update the captured variable.
- Always emit a heartbeat line every N polls so a stalled monitor is visible (e.g. `[heartbeat] no events; ci=$ci_state; cop_after=$cop_after`).
- Echo `cop_after` and `ci_state` on every iteration so you can grep the monitor's output file for the missed transition after the fact.
- Do not rely on the monitor for the only notification of a Copilot review. Cross-check at the cap timings above.

## Closing the loop

1. Apply every actionable comment (or document why it is non-actionable in a PR comment).
2. Push the fix commit.
3. Post a resolution map as a PR comment, mapping each comment id/path to the resolution.
4. **Mark addressed threads as resolved via GraphQL.** The `isResolved` flag does not flip automatically when a fix lands — after a green push + resolution map post, mark every unresolved-not-outdated thread as resolved so the convergence gate can fire. Use the snippet below. If Copilot disagrees with a resolution, it will re-raise the concern as a new thread on the next review. The fetch is paginated with the same cap-and-fail-closed pattern as the convergence gate (5 windows × 100 nodes = 500 threads); if your PR has more, the script aborts with an explicit instruction to handle pagination, so the gate can still trust its own input.

   ```bash
   PR=<n>; REPO=<owner/repo>
   RESOLVE_QUERY='
     query($owner:String!,$repo:String!,$pr:Int!,$cursor:String){
       repository(owner:$owner,name:$repo){
         pullRequest(number:$pr){
           reviewThreads(first:100, after:$cursor){
             nodes{ id isResolved isOutdated }
             pageInfo{ hasNextPage endCursor }
           }
         }
       }
     }'
   THREAD_IDS=""
   RESOLVE_CURSOR=""
   RESOLVE_PAGES=0
   while :; do
     RESOLVE_PAGES=$((RESOLVE_PAGES + 1))
     if [ "$RESOLVE_PAGES" -gt 5 ]; then
       echo "[abort] reviewThreads exceeded 5 pages of 100; resolve manually or extend the cap" >&2
       THREAD_IDS=""
       break
     fi
     if [ -z "$RESOLVE_CURSOR" ]; then
       PAGE_JSON=$(gh api graphql -F owner="${REPO%/*}" -F repo="${REPO#*/}" -F pr="$PR" -f query="$RESOLVE_QUERY")
     else
       PAGE_JSON=$(gh api graphql -F owner="${REPO%/*}" -F repo="${REPO#*/}" -F pr="$PR" -F cursor="$RESOLVE_CURSOR" -f query="$RESOLVE_QUERY")
     fi
     PAGE_IDS=$(echo "$PAGE_JSON" | jq -r '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false and .isOutdated==false) | .id')
     if [ -n "$PAGE_IDS" ]; then
       THREAD_IDS="$THREAD_IDS"$'\n'"$PAGE_IDS"
     fi
     HAS_NEXT=$(echo "$PAGE_JSON" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
     RESOLVE_CURSOR=$(echo "$PAGE_JSON" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor // ""')
     [ "$HAS_NEXT" = "true" ] || break
   done
   for tid in $THREAD_IDS; do
     [ -z "$tid" ] && continue
     gh api graphql -F threadId="$tid" -f query='
       mutation($threadId:ID!){
         resolveReviewThread(input:{threadId:$threadId}){ thread{ id isResolved } }
       }' --jq '.data.resolveReviewThread.thread | "resolved \(.id)"'
   done
   ```

5. Re-request Copilot via the primary command and verify in `requested_reviewers`.
6. Restart the wait.
7. **Auto-merge when convergence is reached** (default path — see below). Do NOT pause to ask for authorisation when the **five** convergence conditions all hold (local gates green, CI green, Copilot quiet on HEAD with the full filter, PR mergeable+clean, no unresolved review threads); pausing the loop is a bug, not caution.

## Convergence detection (when to auto-merge)

The loop is converged — and you MUST merge automatically — when ALL five of these hold on the same PR head commit:

1. **Local gates green** — the gates declared in this repo (e.g. `node scripts/structure-check.mjs`, `composer test`, `npm run e2e`) pass when run against the latest pushed commit.
2. **CI green** — every check in `gh pr checks <PR>` is `pass`/`SUCCESS`. No `pending`, no `failure`, no required-but-skipped.
3. **Copilot quiet — for the current head commit only** — the latest review whose `.user.login == "copilot-pull-request-reviewer[bot]"` AND `.commit_id == headRefOid` AND `.state` is `APPROVED` or `COMMENTED` (never `PENDING`, never `DISMISSED`) has **0 inline review comments** AND its review body indicates no new comments (e.g. `"generated no new comments"`), OR that head-anchored review state is `APPROVED`. The login filter is non-negotiable: a human or third-party bot review on HEAD MUST NOT be treated as the Copilot quiet/approval signal. A Copilot review submitted against an older commit MUST also be ignored, even if it is the most recent one returned by the API.
4. **PR mergeable** — `gh pr view <PR> --json mergeable,mergeStateStatus` returns `mergeable=MERGEABLE` and `mergeStateStatus=CLEAN`.
5. **No unresolved review threads** — `repository.pullRequest.reviewThreads` (GraphQL) has zero nodes with `isResolved=false AND isOutdated=false`. Outdated threads (no longer applying to the current diff after a force/rebase push) are safe to ignore; non-outdated unresolved threads from any prior review (Copilot, codex bot, human) MUST block auto-merge per the canonical bypass list in `docs/RULES.md`.

Detection query:

```bash
PR=<n>; REPO=<owner/repo>
echo "=== local gates ==="
# repo-specific — replace as needed
node scripts/structure-check.mjs
echo "=== CI ==="
gh pr checks $PR --repo $REPO
echo "=== PR head SHA ==="
# Anchor the Copilot signal to the current PR head. A review submitted
# against an older commit MUST NOT satisfy the gate after a new push.
HEAD_SHA=$(gh pr view "$PR" --repo "$REPO" --json headRefOid --jq '.headRefOid')
echo "head: $HEAD_SHA"
echo "=== latest Copilot review for HEAD ==="
# IMPORTANT: `gh api --paginate --jq '...'` applies the jq filter PER PAGE
# and emits one result per page, which would concatenate JSON objects (for
# `LATEST`) or produce multiple length integers (for `COPILOT_COMMENTS`).
# Drop --jq from the gh call and slurp all pages into a single array via
# `jq -s 'add'` first, then run the actual filter once on the merged array.
# Filter by both login AND commit_id == HEAD_SHA so a stale review of an
# older commit cannot satisfy the gate.
LATEST=$(gh api --paginate "repos/$REPO/pulls/$PR/reviews" \
  | jq -s --arg sha "$HEAD_SHA" \
      'add
       | [.[]
           | select(.user.login=="copilot-pull-request-reviewer[bot]")
           | select(.commit_id==$sha)
           | select(.state=="APPROVED" or .state=="COMMENTED")]
       | sort_by(.submitted_at) | last // empty')
# State whitelist: only APPROVED or COMMENTED count as a quiet/approval
# signal. PENDING is in-flight; DISMISSED has been explicitly invalidated
# by a maintainer and MUST NOT satisfy the convergence gate; other future
# states (CHANGES_REQUESTED) are by definition non-quiet.
if [ -z "$LATEST" ] || [ "$LATEST" = "null" ]; then
  echo "[gate] no eligible Copilot review for HEAD ($HEAD_SHA) yet — convergence NOT reached"
  COPILOT_COMMENTS="unknown"
  COPILOT_STATE="absent"
  COPILOT_BODY=""
else
  echo "$LATEST" | jq '{state, body, id, submitted_at, commit_id}'
  REVIEW_ID=$(echo "$LATEST" | jq -r '.id')
  COPILOT_STATE=$(echo "$LATEST" | jq -r '.state')
  COPILOT_BODY=$(echo "$LATEST" | jq -r '.body // ""')
  # Slurp every page of comments into one array, then filter and count once.
  COPILOT_COMMENTS=$(gh api --paginate "repos/$REPO/pulls/$PR/comments" \
    | jq -s "add | [.[] | select(.pull_request_review_id==$REVIEW_ID)] | length")
fi
echo "Copilot inline comments on latest HEAD review: $COPILOT_COMMENTS"
echo "Copilot review state: $COPILOT_STATE"
echo "=== mergeability ==="
gh pr view $PR --repo $REPO --json mergeable,mergeStateStatus,headRefOid
```

Convergence is reached **only when ALL of these hold simultaneously**:

- local gates pass on the current `HEAD_SHA`;
- every `gh pr checks` row is `pass` on the current `HEAD_SHA`;
- `gh pr view --json mergeable,mergeStateStatus` reports `mergeable=MERGEABLE` AND `mergeStateStatus=CLEAN`;
- the Copilot quiet/approval signal applies to a review **whose `commit_id` equals the current `HEAD_SHA`** (a stale review of an older commit MUST be ignored), and at least one of the following holds:
  - `COPILOT_STATE=APPROVED`, OR
  - `COPILOT_COMMENTS=0` AND `$COPILOT_BODY` matches the "no new comments" sentinel (e.g. `grep -q "no new comments" <<<"$COPILOT_BODY"` returns true).

A bare `COPILOT_COMMENTS=0` is **not** sufficient — Copilot can submit a `COMMENTED` review with zero inline comments while still leaving substantive feedback in the body, or it can post a review where the inline comments arrive in a follow-up event. Always inspect both the inline count and the body/state.

## Auto-merge command (default path)

Run this only after the convergence checks above have all passed — including the explicit body/approval signal, not just `COPILOT_COMMENTS == 0`. Treat the merge command as the final action of the convergence detector, not a shortcut. The snippet below is self-contained: it computes every gate variable — including the Copilot signals — from `gh` so it can be copy-pasted as-is, with `$PR`, `$REPO`, and the local-gate command as the only inputs from the caller. (The earlier "Detection query" is a prose-friendly walkthrough; this one is the executable form and does not depend on variables it does not set.)

```bash
# Inputs: $PR, $REPO. Replace `node scripts/structure-check.mjs` with the
# repo's local gate command (e.g. composer test, npm run test, ...).
PR=<n>; REPO=<owner/repo>

# 1. Local gates
if node scripts/structure-check.mjs >/dev/null 2>&1; then
  LOCAL_GATES_OK=1
else
  LOCAL_GATES_OK=0
fi

# 2. PR head SHA — every other gate is evaluated against THIS commit. A
#    Copilot review of an older commit does not satisfy the gate.
HEAD_SHA=$(gh pr view "$PR" --repo "$REPO" --json headRefOid --jq '.headRefOid')

# 3. Copilot signal — anchored to HEAD_SHA via commit_id, state-whitelisted
#    (APPROVED or COMMENTED only — PENDING is in-flight, DISMISSED has been
#    explicitly invalidated, CHANGES_REQUESTED is non-quiet by definition),
#    paginated, slurped.
LATEST=$(gh api --paginate "repos/$REPO/pulls/$PR/reviews" \
  | jq -s --arg sha "$HEAD_SHA" \
      'add
       | [.[]
           | select(.user.login=="copilot-pull-request-reviewer[bot]")
           | select(.commit_id==$sha)
           | select(.state=="APPROVED" or .state=="COMMENTED")]
       | sort_by(.submitted_at) | last // empty')
if [ -z "$LATEST" ] || [ "$LATEST" = "null" ]; then
  COPILOT_COMMENTS="unknown"
  COPILOT_STATE="absent"
  COPILOT_BODY=""
else
  REVIEW_ID=$(echo "$LATEST" | jq -r '.id')
  COPILOT_STATE=$(echo "$LATEST" | jq -r '.state')
  COPILOT_BODY=$(echo "$LATEST" | jq -r '.body // ""')
  COPILOT_COMMENTS=$(gh api --paginate "repos/$REPO/pulls/$PR/comments" \
    | jq -s "add | [.[] | select(.pull_request_review_id==$REVIEW_ID)] | length")
fi

# 4. CI rollup — every entry must be COMPLETED + SUCCESS, and the array
#    must be non-empty (a PR with zero checks must not satisfy the gate).
CI_ALL_PASS=$(gh pr view "$PR" --repo "$REPO" --json statusCheckRollup \
  --jq '(.statusCheckRollup | length > 0)
        and ([.statusCheckRollup[] | (.status=="COMPLETED" and .conclusion=="SUCCESS")] | all)' \
  | grep -q '^true$' && echo 1 || echo 0)

# 5. Mergeability (GraphQL via `gh pr view --json`)
MERGEABLE=$(gh pr view "$PR" --repo "$REPO" --json mergeable --jq '.mergeable')
MERGE_STATE=$(gh pr view "$PR" --repo "$REPO" --json mergeStateStatus --jq '.mergeStateStatus')

# 6. Unresolved review threads — the canonical bypass list in docs/RULES.md
#    says "any prior review still has unresolved actionable comments" must
#    block auto-merge. Enforce it executable-side via GraphQL: count threads
#    where isResolved=false AND isOutdated=false (outdated threads no longer
#    apply to the current diff and are safe to ignore).
#
#    The query below pages through reviewThreads with a 100-node window, and
#    sets UNRESOLVED_THREADS to "paginated" (a non-zero non-numeric sentinel
#    that fails the gate) if pagination did not exhaust within 5 pages. Five
#    windows = 500 threads, which is well above any realistic PR; if your
#    PR truly has more, the safe default is to refuse the auto-merge and
#    fall back to manual review.
THREADS_QUERY='
  query($owner:String!,$repo:String!,$pr:Int!,$cursor:String){
    repository(owner:$owner,name:$repo){
      pullRequest(number:$pr){
        reviewThreads(first:100, after:$cursor){
          nodes{ isResolved isOutdated }
          pageInfo{ hasNextPage endCursor }
        }
      }
    }
  }'
THREADS_UNRESOLVED_TOTAL=0
THREADS_CURSOR=""
THREADS_PAGES=0
THREADS_OVERFLOW=0
while :; do
  THREADS_PAGES=$((THREADS_PAGES + 1))
  if [ "$THREADS_PAGES" -gt 5 ]; then
    THREADS_OVERFLOW=1
    break
  fi
  if [ -z "$THREADS_CURSOR" ]; then
    PAGE_JSON=$(gh api graphql -F owner="${REPO%/*}" -F repo="${REPO#*/}" -F pr="$PR" -f query="$THREADS_QUERY" 2>/dev/null)
  else
    PAGE_JSON=$(gh api graphql -F owner="${REPO%/*}" -F repo="${REPO#*/}" -F pr="$PR" -F cursor="$THREADS_CURSOR" -f query="$THREADS_QUERY" 2>/dev/null)
  fi
  PAGE_COUNT=$(echo "$PAGE_JSON" | jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false and .isOutdated==false)] | length')
  THREADS_UNRESOLVED_TOTAL=$((THREADS_UNRESOLVED_TOTAL + PAGE_COUNT))
  HAS_NEXT=$(echo "$PAGE_JSON" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  THREADS_CURSOR=$(echo "$PAGE_JSON" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor // ""')
  [ "$HAS_NEXT" = "true" ] || break
done
if [ "$THREADS_OVERFLOW" = "1" ]; then
  UNRESOLVED_THREADS="paginated"
else
  UNRESOLVED_THREADS="$THREADS_UNRESOLVED_TOTAL"
fi

# Final guard — re-evaluate every condition as one expression.
if [ "$LOCAL_GATES_OK" = "1" ] \
   && [ "$CI_ALL_PASS" = "1" ] \
   && [ "$MERGEABLE" = "MERGEABLE" ] \
   && [ "$MERGE_STATE" = "CLEAN" ] \
   && [ "$UNRESOLVED_THREADS" = "0" ] \
   && { [ "$COPILOT_STATE" = "APPROVED" ] \
        || { [ "$COPILOT_COMMENTS" = "0" ] && grep -q "no new comments" <<<"$COPILOT_BODY"; }; }; then
  # Drop --subject/--body so the merge commit reuses the PR title and body
  # set on GitHub. Override only if the caller has a derived subject ready.
  gh pr merge "$PR" --repo "$REPO" --squash --delete-branch
else
  echo "[gate] convergence not reached — do not merge"
  printf '  HEAD_SHA=%s\n  LOCAL_GATES_OK=%s\n  CI_ALL_PASS=%s\n  MERGEABLE=%s\n  MERGE_STATE=%s\n  UNRESOLVED_THREADS=%s\n  COPILOT_STATE=%s\n  COPILOT_COMMENTS=%s\n' \
    "$HEAD_SHA" "$LOCAL_GATES_OK" "$CI_ALL_PASS" "$MERGEABLE" "$MERGE_STATE" "$UNRESOLVED_THREADS" "$COPILOT_STATE" "$COPILOT_COMMENTS"
fi
```

After the merge:

1. Confirm with `gh pr view <PR> --json state,mergedAt,mergeCommit` (state must be `MERGED`).
2. Append a one-line entry to `docs/PROGRESS.md` with the merge commit SHA and a 1-sentence outcome.
3. Continue with the next macro/subtask. Do **not** stop the session for confirmation — the convergence rule already authorised the action.

## When NOT to auto-merge (bypass conditions)

Auto-merge is the default. The canonical bypass list lives in [`docs/RULES.md` "Auto-merge convergence rule (preferred path)" → "Do NOT auto-merge if"](../../../docs/RULES.md). Read that list and treat it as the single source of truth — do not maintain a duplicate enumeration here. The list covers, at minimum:

- unresolved actionable comments from any prior review;
- PRs that touch secrets, credentials, infrastructure, destructive history operations, or external systems beyond the repo;
- explicit user instructions to halt (`"wait"`, `"stop"`, `"hold off"`, `"pause"`, `"do not merge"`, `"don't merge"`, or any clear synonym in the active conversation since the PR opened);
- a base branch that is not `main`.

When you bypass auto-merge for any of those reasons, log the bypass reason in `docs/PROGRESS.md` (one line, including PR number and the specific bypass that fired) so the audit trail is intact.

## Common failures observed

- Background monitor stops emitting after a successful CI event but before a delayed Copilot review. **Mitigation:** the manual check at the 15-minute cap above.
- `gh pr edit --add-reviewer @copilot` returns success but the reviewer is not actually attached. **Mitigation:** REST `requested_reviewers` verification immediately after the call.
- Copilot review arrives within seconds of CI completing, batched into one Monitor notification, and only the `[ci] pass` line is shown. **Mitigation:** always run the manual review query when CI flips terminal.
