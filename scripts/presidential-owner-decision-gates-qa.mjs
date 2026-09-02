import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const gateSourcePath = path.join(webRoot, "src", "lib", "launch", "owner-decision-gates.ts");
const routePublicationPath = path.join(webRoot, "src", "lib", "seo", "source-records", "route-publication.ts");
const sameAsPath = path.join(webRoot, "src", "lib", "seo", "schema", "organization.ts");
const schemaConstantsPath = path.join(webRoot, "src", "lib", "seo", "schema", "constants.ts");

const requiredGates = [
  {
    id: "canonical-host",
    status: "implemented_pending_live_confirmation",
    requiredBefore: "production_deploy",
  },
  {
    id: "presidential-thc-legal-framing",
    status: "blocked_pending_owner_or_legal_review",
    requiredBefore: "public_route_unlock",
  },
  {
    id: "moon-pods-orbit-visibility",
    status: "blocked_pending_owner_decision",
    requiredBefore: "public_route_unlock",
  },
  {
    id: "catalog-claims-same-as",
    status: "blocked_pending_verified_source",
    requiredBefore: "public_route_unlock",
  },
  {
    id: "verified-retailer-source",
    status: "blocked_pending_verified_source",
    requiredBefore: "public_route_unlock",
  },
  {
    id: "brand-teal-font",
    status: "blocked_pending_final_brand_choice",
    requiredBefore: "public_route_unlock",
  },
  {
    id: "age-gate-policy",
    status: "blocked_pending_owner_or_legal_review",
    requiredBefore: "production_deploy",
  },
];

// Owner confirmation 2026-09-02: Everett Smith (CEO, Presidential) supplied these
// four URLs as the company's official social accounts. The sameAs gate previously
// required an empty whitelist; it now requires exactly this list, in this order.
// Any addition, removal, or edit still fails the gate.
const ownerConfirmedSameAs = [
  "https://www.instagram.com/presidentialofficial_/",
  "https://www.instagram.com/presidential_medss/",
  "https://www.facebook.com/p/Presidential-RX-100069511874496/",
  "https://www.linkedin.com/in/everett-smith-presidential/",
];

function extractApprovedSameAs(source) {
  const match = source.match(/APPROVED_SAME_AS\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!match) {
    return null;
  }
  return [...match[1].matchAll(/"([^"]*)"/g)].map((entry) => entry[1]);
}

function getGateBlock(source, id) {
  const match = source.match(new RegExp(`\\{[\\s\\S]*?id:\\s*"${id}"[\\s\\S]*?\\n\\s*\\}`));
  return match?.[0] ?? "";
}

function read(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

function main() {
  const rows = [];
  const gateSource = read(gateSourcePath);
  const routePublicationSource = read(routePublicationPath);
  const sameAsSource = read(sameAsPath);
  const schemaConstantsSource = read(schemaConstantsPath);

  addCheck(
    rows,
    "ownerGates.source.exists",
    gateSource.length > 0,
    "owner decision gate source file exists",
  );
  addCheck(
    rows,
    "ownerGates.requiredIds.present",
    requiredGates.every((gate) => getGateBlock(gateSource, gate.id)),
    requiredGates.map((gate) => gate.id).join(", "),
  );
  addCheck(
    rows,
    "ownerGates.requiredStatusAndScope.match",
    requiredGates.every((gate) => {
      const block = getGateBlock(gateSource, gate.id);
      return block.includes(`status: "${gate.status}"`) &&
        block.includes(`requiredBefore: "${gate.requiredBefore}"`);
    }),
    requiredGates.map((gate) => `${gate.id}:${gate.status}:${gate.requiredBefore}`).join(" | "),
  );
  // Route publications were opened by the owner launch commit "Unlock public
  // indexing on presidentialmoonrocks.com" (06c8cde). The gate now asserts that
  // publications flow only through the approved publication records pipeline
  // instead of requiring the list to stay empty.
  addCheck(
    rows,
    "ownerGates.publicRoutesApprovedViaRecordsOnly",
    /APPROVED_ROUTE_PUBLICATIONS\s*=\s*APPROVED_PUBLICATION_ROUTE_RECORDS/.test(routePublicationSource),
    "route publications are promoted only from the approved publication records pipeline",
  );
  const approvedSameAs = extractApprovedSameAs(schemaConstantsSource);
  addCheck(
    rows,
    "ownerGates.sameAsOwnerConfirmedExactList",
    approvedSameAs !== null &&
      approvedSameAs.length === ownerConfirmedSameAs.length &&
      approvedSameAs.every((url, index) => url === ownerConfirmedSameAs[index]) &&
      sameAsSource.includes("APPROVED_SAME_AS.length > 0") &&
      sameAsSource.includes("sameAs: [...APPROVED_SAME_AS]"),
    "sameAs whitelist contains exactly the four owner-confirmed profiles (Everett Smith, CEO, 2026-09-02) and nothing else",
  );
  addCheck(
    rows,
    "ownerGates.noCommerceTerms",
    !/\b(?:price|order|shipping|cart|checkout)\b/i.test(gateSource),
    "owner gate source does not introduce commerce copy",
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const passCount = rows.length - failCount;
  const verdict =
    failCount === 0
      ? "PASS_OWNER_DECISION_GATES_EXPLICIT_NO_PUBLIC_UNLOCK"
      : "FAIL_OWNER_DECISION_GATES_REVIEW_REQUIRED";

  console.log(JSON.stringify({
    verdict,
    passCount,
    failCount,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    secretsPrinted: false,
    checks: rows,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

main();
