const originalFetch = globalThis.fetch;

function queryParam(url, key) {
  try {
    return new URL(url).searchParams.get(key);
  } catch {
    return null;
  }
}

function parseJsonParam(value) {
  if (!value) return "";
  try {
    return JSON.parse(value);
  } catch {
    return "";
  }
}

function queryText(url) {
  return queryParam(url, "query") || "";
}

function pageResult(slug) {
  const titles = {
    home: "CMS Smoke Home Module",
    "moon-rocks": "CMS Smoke Moon Rocks Module",
    "our-story": "CMS Smoke Our Story Module",
  };
  const routeSlug = titles[slug] ? slug : "moon-rocks";
  const title = titles[routeSlug];

  return {
    _id: `sitePage.${routeSlug}`,
    _type: "sitePage",
    title,
    slug: routeSlug,
    routePhase: "approved_public",
    summary: "CMS runtime smoke fixture.",
    modules: [
      {
        _key: `${routeSlug}-hero`,
        _type: "heroBlock",
        headline: title,
        description: "CMS runtime smoke fixture rendered from approved public module data.",
        moduleControl: {
          moduleKey: `${routeSlug}-smoke-hero`,
          internalLabel: title,
          componentKey: "heroBlock",
          renderEligibility: "ready_for_implementation_candidate",
          sortIntent: 1,
        },
      },
    ],
  };
}

function learnGuideResult(slug) {
  if (slug !== "what-are-moon-rocks") {
    return null;
  }

  return {
    _id: "learnGuide.what-are-moon-rocks",
    _type: "learnGuide",
    title: "CMS Smoke Learn Guide",
    slug,
    routePhase: "approved_public",
    guideTopic: "Moon Rocks",
    topicTaxonomy: ["moon-rocks"],
    intro: "CMS smoke guide intro rendered from public module data.",
    sourceProofList: ["cms-smoke-fixture"],
    approvalGate: {
      contentApprovalStatus: "approved_public",
      sourceProofStatus: "approved_public",
      legalReviewStatus: "approved_public",
      assetApprovalStatus: "approved_public",
      seoApprovalStatus: "approved_public",
      routePublicationStatus: "blocked_prelaunch",
    },
    bodyModules: [
      {
        _key: "learn-moon-rocks-body",
        _type: "learnGuideBlock",
        heading: "CMS Smoke Learn Guide Body",
        description: "CMS smoke guide body rendered from public module data.",
        callout: "CMS smoke guide callout",
        moduleControl: {
          moduleKey: "learn-moon-rocks-smoke-body",
          internalLabel: "CMS Smoke Learn Guide Body",
          componentKey: "learnGuideBlock",
          renderEligibility: "ready_for_implementation_candidate",
          sortIntent: 1,
        },
      },
    ],
  };
}

globalThis.fetch = async function mockedSanityFetch(input, init) {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input?.url || "";

  if (/\.apicdn\.sanity\.io\/v\d{4}-\d{2}-\d{2}\/data\/query\//.test(url)) {
    const slug = parseJsonParam(queryParam(url, "$slug"));
    const query = queryText(url);
    const result = query.includes('_type == "learnGuide"')
      ? learnGuideResult(slug)
      : ["home", "moon-rocks", "our-story"].includes(slug)
        ? pageResult(slug)
        : null;

    return new Response(JSON.stringify({result}), {
      status: 200,
      headers: {"content-type": "application/json"},
    });
  }

  return originalFetch(input, init);
};
