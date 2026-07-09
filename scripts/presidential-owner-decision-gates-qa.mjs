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
  addCheck(
    rows,
    "ownerGates.publicRoutesStillClosed",
    /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]/.test(routePublicationSource),
    "route publication list remains empty until per-route approvals are added",
  );
  addCheck(
    rows,
    "ownerGates.sameAsStillClosed",
    /APPROVED_SAME_AS\s*=\s*\[\]/.test(schemaConstantsSource) &&
      sameAsSource.includes("APPROVED_SAME_AS.length > 0") &&
      sameAsSource.includes("sameAs: [...APPROVED_SAME_AS]"),
    "sameAs whitelist remains empty until official profile ownership is confirmed",
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
