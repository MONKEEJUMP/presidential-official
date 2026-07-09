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

const allHomeModuleTypes = [
  "heroBlock",
  "homepageActBlock",
  "productPlatformBlock",
  "productFormatBlock",
  "productRailBlock",
  "learnGuideBlock",
  "storyProofBlock",
  "locatorShellBlock",
  "legalUtilityBlock",
  "assetProofBlock",
  "contactBlock",
  "faqBlock",
  "guideHubBlock",
  "productFactsBlock",
  "mediaGalleryBlock",
  "comparisonBlock",
  "timelineBlock",
  "relatedContentBlock",
];

const moduleTitleByType = {
  heroBlock: "CMS Smoke Home Module",
  homepageActBlock: "CMS Smoke Homepage Act Module",
  productPlatformBlock: "CMS Smoke Product Platform Module",
  productFormatBlock: "CMS Smoke Product Format Module",
  productRailBlock: "CMS Smoke Product Rail Module",
  learnGuideBlock: "CMS Smoke Learn Guide Block Module",
  storyProofBlock: "CMS Smoke Story Proof Module",
  locatorShellBlock: "CMS Smoke Locator Shell Module",
  legalUtilityBlock: "CMS Smoke Legal Utility Module",
  assetProofBlock: "CMS Smoke Asset Proof Module",
  contactBlock: "CMS Smoke Contact Block Module",
  faqBlock: "CMS Smoke FAQ Module",
  guideHubBlock: "CMS Smoke Guide Hub Module",
  productFactsBlock: "CMS Smoke Product Facts Module",
  mediaGalleryBlock: "CMS Smoke Media Gallery Module",
  comparisonBlock: "CMS Smoke Comparison Module",
  timelineBlock: "CMS Smoke Timeline Module",
  relatedContentBlock: "CMS Smoke Related Content Module",
};

function moduleFixture(routeSlug, moduleType, index, titleOverride) {
  const title = titleOverride || moduleTitleByType[moduleType] || `CMS Smoke ${moduleType} Module`;

  return {
    _key: `${routeSlug}-${moduleType}-${index}`,
    _type: moduleType,
    headline: title,
    heading: title,
    title,
    description: "CMS runtime smoke fixture rendered from approved public module data.",
    actNumber: moduleType === "homepageActBlock" ? 1 : undefined,
    actTitle: moduleType === "homepageActBlock" ? title : undefined,
    beliefStatement: moduleType === "homepageActBlock" ? "CMS smoke act belief." : undefined,
    formIntent: moduleType === "contactBlock" ? "official_contact_routing" : undefined,
    retailerDataStatus: moduleType === "locatorShellBlock" ? "verified_records_required" : undefined,
    legalGateStatus: "blocked_prelaunch",
    question: moduleType === "faqBlock" ? title : undefined,
    answer: moduleType === "faqBlock" ? "CMS smoke answer." : undefined,
    events: moduleType === "timelineBlock"
      ? [{ label: "CMS smoke timeline event", dateOrSequence: "Act 1" }]
      : undefined,
    facts: moduleType === "productFactsBlock"
      ? [{ label: "CMS smoke fact", value: "18 blocks", publicUseStatus: "approved_public" }]
      : undefined,
    columns: moduleType === "comparisonBlock"
      ? [{ title: "CMS smoke comparison column" }]
      : undefined,
    items: ["mediaGalleryBlock", "relatedContentBlock"].includes(moduleType)
      ? [{ title: "CMS smoke related item", description: "CMS smoke item body." }]
      : undefined,
    moduleControl: {
      moduleKey: `${routeSlug}-${moduleType}-smoke`,
      internalLabel: title,
      componentKey: moduleType,
      renderEligibility: "ready_for_implementation_candidate",
      sortIntent: index + 1,
    },
  };
}

function pageResult(slug) {
  const titles = {
    home: "CMS Smoke Home Module",
    "moon-rocks": "CMS Smoke Moon Rocks Module",
    "moon-pods": "CMS Smoke Moon Pods Module",
    orbit: "CMS Smoke Orbit Module",
    "our-story": "CMS Smoke Our Story Module",
    "find-us": "CMS Smoke Find Us Module",
    contact: "CMS Smoke Contact Module",
  };
  const routeSlug = titles[slug] ? slug : "moon-rocks";
  const title = titles[routeSlug];
  const moduleTypes = {
    "find-us": "locatorShellBlock",
    contact: "contactBlock",
  };
  const moduleType = moduleTypes[routeSlug] || "heroBlock";
  const modules = routeSlug === "home"
    ? allHomeModuleTypes.map((type, index) => moduleFixture(routeSlug, type, index))
    : [moduleFixture(routeSlug, moduleType, 0, title)];

  return {
    _id: `sitePage.${routeSlug}`,
    _type: "sitePage",
    title,
    slug: routeSlug,
    routePhase: "approved_public",
    summary: "CMS runtime smoke fixture.",
    approvalGate: {
      contentApprovalStatus: "approved_public",
      sourceProofStatus: "approved_public",
      legalReviewStatus: "approved_public",
    },
    modules,
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

function learnGuideSlugResults() {
  return [
    {slug: "what-are-moon-rocks"},
    {slug: "cms-smoke-extra-guide"},
  ];
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
      ? query.includes("defined(slug.current)") && !slug
        ? learnGuideSlugResults()
        : learnGuideResult(slug)
      : ["home", "moon-rocks", "moon-pods", "orbit", "our-story", "find-us", "contact"].includes(slug)
        ? pageResult(slug)
        : null;

    return new Response(JSON.stringify({result}), {
      status: 200,
      headers: {"content-type": "application/json"},
    });
  }

  return originalFetch(input, init);
};
