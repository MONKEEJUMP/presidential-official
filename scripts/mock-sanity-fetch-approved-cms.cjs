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

function pageResult(slug) {
  const routeSlug = slug === "home" ? "home" : "moon-rocks";
  const title = routeSlug === "home" ? "CMS Smoke Home Module" : "CMS Smoke Moon Rocks Module";

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

globalThis.fetch = async function mockedSanityFetch(input, init) {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input?.url || "";

  if (/\.apicdn\.sanity\.io\/v\d{4}-\d{2}-\d{2}\/data\/query\//.test(url)) {
    const slug = parseJsonParam(queryParam(url, "$slug"));
    const result = slug === "home" || slug === "moon-rocks" ? pageResult(slug) : null;

    return new Response(JSON.stringify({result}), {
      status: 200,
      headers: {"content-type": "application/json"},
    });
  }

  return originalFetch(input, init);
};
