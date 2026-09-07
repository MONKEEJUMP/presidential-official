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
    const reviewsSecond = variables.reviewsCursor === "reviews-2";
    const threadsThird = variables.threadsCursor === "threads-3";
    return response({
      headRefOid: "head",
      reviews: {
        nodes: reviewsSecond ? [{ author: { login: CODEX_LOGIN }, commit: { oid: "head" }, state: "COMMENTED", submittedAt: "2026-09-07T00:00:00Z" }] : [],
        pageInfo: { hasNextPage: !reviewsSecond, endCursor: reviewsSecond ? null : "reviews-2" },
      },
      reviewThreads: {
        nodes: threadsThird ? [{ isResolved: false, comments: { nodes: [{ author: { login: CODEX_LOGIN }, url: "https://example.test/thread" }] } }] : [],
        pageInfo: {
          hasNextPage: !threadsThird,
          endCursor: variables.threadsCursor === null ? "threads-2" : threadsThird ? null : "threads-3",
        },
      },
    });
  };
  const state = await readReviewState({ fetchImpl, name: "repo", owner: "owner", pullRequestNumber: 1, token: "token" });
  assert.equal(calls.length, 3);
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

test("pending same-head rerun vetoes an earlier completed review", () => {
  const result = evaluateReviewState({
    headRefOid: "head",
    reviews: [
      { author: { login: CODEX_LOGIN }, commit: { oid: "head" }, state: "COMMENTED", submittedAt: "2026-09-07T00:00:00Z" },
      { author: { login: CODEX_LOGIN }, commit: { oid: "head" }, state: "PENDING", submittedAt: null },
    ],
    reviewThreads: [],
  });
  assert.equal(result.currentReview, false);
});
