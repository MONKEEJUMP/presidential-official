import assert from "node:assert/strict";
import test from "node:test";
import { CODEX_LOGIN, evaluateReviewState, readReviewState } from "./codex-review-gate.mjs";

function response(pullRequest) {
  return { ok: true, json: async () => ({ data: { repository: { pullRequest } } }) };
}

test("paginates reviews and review threads", async () => {
  const calls = [];
  const fetchImpl = async (_url, init) => {
    const variables = JSON.parse(init.body).variables;
    calls.push(variables);
    const second = variables.reviewsCursor === "reviews-2";
    return response({
      headRefOid: "head",
      reviews: {
        nodes: second ? [{ author: { login: CODEX_LOGIN }, commit: { oid: "head" }, state: "COMMENTED", submittedAt: "2026-09-07T00:00:00Z" }] : [],
        pageInfo: { hasNextPage: !second, endCursor: second ? null : "reviews-2" },
      },
      reviewThreads: {
        nodes: second ? [{ isResolved: false, comments: { nodes: [{ author: { login: CODEX_LOGIN }, url: "https://example.test/thread" }] } }] : [],
        pageInfo: { hasNextPage: !second, endCursor: second ? null : "threads-2" },
      },
    });
  };
  const state = await readReviewState({ fetchImpl, name: "repo", owner: "owner", pullRequestNumber: 1, token: "token" });
  assert.equal(calls.length, 2);
  assert.equal(state.reviews.length, 1);
  assert.equal(state.reviewThreads.length, 1);
});
test("dismissed and pending reviews do not satisfy the gate", () => {
  for (const state of ["DISMISSED", "PENDING"]) {
    const result = evaluateReviewState({
      headRefOid: "head",
      reviews: [{ author: { login: CODEX_LOGIN }, commit: { oid: "head" }, state, submittedAt: "2026-09-07T00:00:00Z" }],
      reviewThreads: [],
    });
    assert.equal(result.currentReview, false);
  }
});

test("submitted current-head review passes only with resolved threads", () => {
  const pullRequest = {
    headRefOid: "head",
    reviews: [{ author: { login: CODEX_LOGIN }, commit: { oid: "head" }, state: "COMMENTED", submittedAt: "2026-09-07T00:00:00Z" }],
    reviewThreads: [{ isResolved: true, comments: { nodes: [{ author: { login: CODEX_LOGIN }, url: "https://example.test/thread" }] } }],
  };
  assert.deepEqual(evaluateReviewState(pullRequest), { currentReview: true, unresolved: [] });
});
