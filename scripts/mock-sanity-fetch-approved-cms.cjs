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

const approvedRecordGate = {
  contentApprovalStatus: "approved_public",
  sourceProofStatus: "approved_public",
  legalReviewStatus: "approved_public",
  assetApprovalStatus: "approved_public",
  seoApprovalStatus: "approved_public",
  routePublicationStatus: "index_follow_approved",
};

const approvedNestedGate = {
  contentApprovalStatus: "approved_public",
  sourceProofStatus: "approved_public",
  legalReviewStatus: "approved_public",
};

function approvedAsset(routeSlug, moduleType, index) {
  return {
    _id: `assetRecord.${routeSlug}.${moduleType}.${index}`,
    title: `${moduleTitleByType[moduleType] || moduleType} approved media`,
    altText: `${moduleTitleByType[moduleType] || moduleType} approved media`,
    assetName: `${routeSlug}-${moduleType}-${index}`,
    assetUrl: `https://cdn.sanity.io/images/4bl3xvem/production/${routeSlug}-${moduleType}-${index}.jpg`,
    assetWidth: 1600,
    assetHeight: 1200,
    approvalStatus: "approved_public",
    provenanceStatus: "approved_public",
    pageUsage: [routeSlug],
  };
}

function approvedLinkedRecord(type, slug, title) {
  return {
    _id: `${type}.${slug}`,
    _type: type,
    title,
    name: title,
    slug,
    intro: `${title} approved summary.`,
    positioningLine: `${title} approved positioning.`,
    shortDescription: `${title} approved description.`,
    publicStatus: "approved_public",
    legalReviewStatus: "approved_public",
    approvalGate: approvedRecordGate,
  };
}

function moduleFixture(routeSlug, moduleType, index, titleOverride) {
  const title = titleOverride || moduleTitleByType[moduleType] || `CMS Smoke ${moduleType} Module`;
  const asset = approvedAsset(routeSlug, moduleType, index);
  const productRecord = approvedLinkedRecord("productPlatform", "moon-rocks", "Moon Rocks");
  const guideRecord = approvedLinkedRecord("learnGuide", "cms-smoke-extra-guide", "CMS Smoke Extra Guide");

  return {
    _key: `${routeSlug}-${moduleType}-${index}`,
    _type: moduleType,
    headline: title,
    heading: title,
    title,
    description: "CMS runtime smoke fixture rendered from approved public module data.",
    body: moduleType === "learnGuideBlock"
      ? [{_type: "block", children: [{text: "CMS smoke guide block body."}]}]
      : undefined,
    callout: moduleType === "learnGuideBlock" ? "CMS smoke guide callout." : undefined,
    actNumber: moduleType === "homepageActBlock" ? 1 : undefined,
    actTitle: moduleType === "homepageActBlock" ? title : undefined,
    beliefStatement: moduleType === "homepageActBlock" ? "CMS smoke act belief." : undefined,
    formIntent: moduleType === "contactBlock" ? "official_contact_routing" : undefined,
    retailerDataStatus: moduleType === "locatorShellBlock" ? "verified_records_required" : undefined,
    legalGateStatus: "approved_public",
    heroAssetRecord: moduleType === "heroBlock" ? asset : undefined,
    assetRecords: moduleType === "mediaGalleryBlock" ? [asset] : undefined,
    assetRecordRefs: ["homepageActBlock", "productPlatformBlock", "productFormatBlock", "productRailBlock"].includes(moduleType)
      ? [asset]
      : undefined,
    primaryCta: moduleType === "heroBlock"
      ? {label: "Explore Moon Rocks", href: "/moon-rocks", intent: "explore_moon_rocks", visibilityStatus: "approved_public"}
      : undefined,
    visibleCta: ["contactBlock", "locatorShellBlock"].includes(moduleType)
      ? {label: "Contact Presidential", href: "/contact", intent: "contact", visibilityStatus: "approved_public"}
      : undefined,
    contactProfile: moduleType === "contactBlock"
      ? {
          _id: "contactProfile.cms-smoke",
          _type: "contactProfile",
          title: "Official Presidential contact",
          displayEmail: "contact@example.invalid",
          emailConflictStatus: "approved_public",
          publicUseStatus: "approved_public",
        }
      : undefined,
    events: moduleType === "timelineBlock"
      ? [{
          label: "CMS smoke timeline event",
          dateOrSequence: "Act 1",
          body: [{_type: "block", children: [{text: "CMS smoke timeline body."}]}],
        }]
      : undefined,
    facts: moduleType === "productFactsBlock"
      ? [{ label: "CMS smoke fact", value: "18 blocks", publicUseStatus: "approved_public" }]
      : undefined,
    columns: moduleType === "comparisonBlock"
      ? [{
          title: "CMS smoke comparison column",
          body: [{_type: "block", children: [{text: "CMS smoke comparison body."}]}],
          contentRef: productRecord,
        }]
      : undefined,
    items: moduleType === "faqBlock"
      ? [{
          _key: "cms-smoke-faq-item",
          question: "CMS Smoke FAQ Question?",
          answer: [{_type: "block", children: [{text: "CMS Smoke FAQ Answer."}]}],
          approvalGate: approvedNestedGate,
        }]
      : moduleType === "relatedContentBlock"
        ? [guideRecord]
      : undefined,
    cards: moduleType === "productRailBlock"
      ? [{
          title: "CMS Smoke Approved Product Card",
          route: "/moon-rocks",
          sourceStatus: "approved_public",
          routeGate: "index_follow_approved",
          assetRecord: asset,
          contentRef: productRecord,
        }]
      : undefined,
    featuredGuides: moduleType === "guideHubBlock" ? [guideRecord] : undefined,
    relatedPlatforms: ["guideHubBlock", "productPlatformBlock"].includes(moduleType) ? [productRecord] : undefined,
    relatedProductLinks: moduleType === "learnGuideBlock" ? [productRecord] : undefined,
    platform: moduleType === "productPlatformBlock" ? productRecord : undefined,
    format: moduleType === "productFormatBlock"
      ? approvedLinkedRecord("productFormat", "moon-rocks", "Moon Rocks Format")
      : undefined,
    moduleControl: {
      moduleKey: `${routeSlug}-${moduleType}-smoke`,
      internalLabel: title,
      componentKey: moduleType,
      renderEligibility: "approved_public",
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
    : moduleType === "heroBlock"
      ? [moduleFixture(routeSlug, "heroBlock", 0, title)]
      : [
          moduleFixture(routeSlug, "heroBlock", 0, title),
          moduleFixture(routeSlug, moduleType, 1),
        ];

  return {
    _id: `sitePage.${routeSlug}`,
    _type: "sitePage",
    title,
    slug: routeSlug,
    routePhase: "approved_public",
    summary: "CMS runtime smoke fixture.",
    approvalGate: approvedRecordGate,
    modules,
  };
}

function learnGuideResult(slug) {
  if (!["what-are-moon-rocks", "cms-smoke-extra-guide"].includes(slug)) {
    return null;
  }

  return {
    _id: "learnGuide.what-are-moon-rocks",
    _type: "learnGuide",
    title: slug === "cms-smoke-extra-guide" ? "CMS Smoke Extra Guide" : "CMS Smoke Learn Guide",
    slug,
    routePhase: "approved_public",
    guideTopic: "Moon Rocks",
    topicTaxonomy: ["moon-rocks"],
    intro: "CMS smoke guide intro rendered from public module data.",
    sourceProofList: ["cms-smoke-fixture"],
    approvalGate: approvedRecordGate,
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
          renderEligibility: "approved_public",
          sortIntent: 1,
        },
      },
      moduleFixture(slug, "faqBlock", 1),
      moduleFixture(slug, "productFactsBlock", 2),
      moduleFixture(slug, "relatedContentBlock", 3),
    ],
  };
}

function learnGuideSlugResults() {
  return [
    {slug: "what-are-moon-rocks"},
    {slug: "cms-smoke-extra-guide"},
  ];
}

async function mockedSanityFetch(input, init) {
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
}

module.exports = {mockedSanityFetch};
