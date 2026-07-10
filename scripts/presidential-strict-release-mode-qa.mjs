import assert from "node:assert/strict";

import {
  expectedRouteIsPublic,
  routeStateMatchesMode,
  sitemapStateMatchesMode,
} from "./lib/route-publication-runtime-state.mjs";

function state(routes, approvedRecordCount) {
  return {
    approvedRecordCount,
    routes,
    approvedRoutes: routes.filter((route) => route.publicationApproved),
    sitemapEligibleRoutes: routes.filter((route) => route.sitemapEligible),
  };
}

const locked = state([
  {
    routeId: "home",
    path: "/",
    canonicalUrl: "https://presidentialmoonrocks.com/",
    publicationApproved: false,
    sitemapEligible: false,
  },
], 0);
assert.equal(routeStateMatchesMode(locked, false), true);
assert.equal(sitemapStateMatchesMode(locked, [], false), true);
assert.equal(expectedRouteIsPublic(locked, "/"), false);

const approved = state([
  {
    routeId: "home",
    path: "/",
    canonicalUrl: "https://presidentialmoonrocks.com/",
    publicationApproved: true,
    sitemapEligible: true,
  },
  {
    routeId: "moon-rocks",
    path: "/moon-rocks",
    canonicalUrl: "https://presidentialmoonrocks.com/moon-rocks",
    publicationApproved: false,
    sitemapEligible: false,
  },
], 1);
assert.equal(routeStateMatchesMode(approved, true), true);
assert.equal(
  sitemapStateMatchesMode(
    approved,
    ["https://presidentialmoonrocks.com/"],
    true,
  ),
  true,
);
assert.equal(expectedRouteIsPublic(approved, "/"), true);
assert.equal(expectedRouteIsPublic(approved, "/moon-rocks"), false);

const registryNotOpened = state([
  {
    routeId: "home",
    path: "/",
    canonicalUrl: "https://presidentialmoonrocks.com/",
    publicationApproved: true,
    sitemapEligible: false,
  },
], 1);
assert.equal(routeStateMatchesMode(registryNotOpened, true), false);
assert.equal(
  sitemapStateMatchesMode(registryNotOpened, [], true),
  false,
);
assert.equal(
  sitemapStateMatchesMode(
    approved,
    [
      "https://presidentialmoonrocks.com/",
      "https://presidentialmoonrocks.com/unapproved",
    ],
    true,
  ),
  false,
);

console.log("PASS_STRICT_RELEASE_MODE_FIXTURES");
