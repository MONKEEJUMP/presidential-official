import process from "node:process";
import { pathToFileURL } from "node:url";

export const CODEX_LOGIN = "chatgpt-codex-connector";
const query = `
  query($owner: String!, $name: String!, $number: Int!, $reviewsCursor: String, $threadsCursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        headRefOid
        reviews(first: 100, after: $reviewsCursor) {
          nodes { author { login } commit { oid } state submittedAt }
          pageInfo { hasNextPage endCursor }
        }
        reviewThreads(first: 100, after: $threadsCursor) {
          nodes { isResolved comments(first: 1) { nodes { author { login } url } } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }
`;

async function requestGraphql(fetchImpl, token, variables) {
  const response = await fetchImpl("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "presidential-codex-review-gate",
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(JSON.stringify(payload.errors ?? payload, null, 2));
  }
  return payload.data?.repository?.pullRequest ?? null;
}

export async function readReviewState({ fetchImpl = fetch, name, owner, pullRequestNumber, token }) {
  let reviewsCursor = null;
  let threadsCursor = null;
  let reviewsComplete = false;
  let threadsComplete = false;
  let headRefOid = null;
  const reviews = [];
  const reviewThreads = [];

  do {
    const pullRequest = await requestGraphql(fetchImpl, token, {
      owner,
      name,
      number: pullRequestNumber,
      reviewsCursor,
      threadsCursor,
    });
    if (!pullRequest) return null;
    headRefOid ??= pullRequest.headRefOid;
    if (!reviewsComplete) {
      reviews.push(...pullRequest.reviews.nodes);
      reviewsComplete = !pullRequest.reviews.pageInfo.hasNextPage;
      if (!reviewsComplete) reviewsCursor = pullRequest.reviews.pageInfo.endCursor;
    }
    if (!threadsComplete) {
      reviewThreads.push(...pullRequest.reviewThreads.nodes);
      threadsComplete = !pullRequest.reviewThreads.pageInfo.hasNextPage;
      if (!threadsComplete) threadsCursor = pullRequest.reviewThreads.pageInfo.endCursor;
    }
  } while (!reviewsComplete || !threadsComplete);

  return { headRefOid, reviews, reviewThreads };
}

export function evaluateReviewState(pullRequest) {
  const currentHeadReviews = pullRequest.reviews.filter(
    (review) =>
      review.author?.login === CODEX_LOGIN &&
      review.commit?.oid === pullRequest.headRefOid,
  );
  const pendingCurrentReview = currentHeadReviews.some(
    (review) => review.state === "PENDING" || !review.submittedAt,
  );
  const currentReview = !pendingCurrentReview && currentHeadReviews.some(
    (review) =>
      review.state !== "DISMISSED" &&
      review.state !== "PENDING" &&
      Boolean(review.submittedAt),
  );
  const unresolved = pullRequest.reviewThreads.filter(
    (thread) =>
      !thread.isResolved &&
      thread.comments.nodes[0]?.author?.login === CODEX_LOGIN,
  );
  return { currentReview, unresolved };
}

export async function main(env = process.env, fetchImpl = fetch) {
  const token = env.GITHUB_TOKEN;
  const repository = env.GITHUB_REPOSITORY;
  const pullRequestNumber = Number(env.PR_NUMBER);
  if (!token || !repository || !Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
    console.error("Codex Review Gate requires GITHUB_TOKEN, GITHUB_REPOSITORY, and PR_NUMBER.");
    return 1;
  }

  const [owner, name] = repository.split("/");
  let pullRequest;
  try {
    pullRequest = await readReviewState({ fetchImpl, name, owner, pullRequestNumber, token });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  if (!pullRequest) {
    console.error(`Pull request #${pullRequestNumber} was not found.`);
    return 1;
  }

  const { currentReview, unresolved } = evaluateReviewState(pullRequest);
  console.log(JSON.stringify({
    pullRequest: pullRequestNumber,
    headRefOid: pullRequest.headRefOid,
    currentCodexReviewCompleted: currentReview,
    unresolvedCodexThreads: unresolved.map((thread) => thread.comments.nodes[0]?.url).filter(Boolean),
  }, null, 2));

  if (!currentReview) {
    console.error("Codex Review has not completed on the current PR head commit.");
    return 1;
  }
  if (unresolved.length) {
    console.error(`Codex Review has ${unresolved.length} unresolved thread(s).`);
    return 1;
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) process.exitCode = await main();
