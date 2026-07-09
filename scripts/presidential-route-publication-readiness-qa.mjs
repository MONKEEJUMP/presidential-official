import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src", "lib", "seo");
const outDir = path.join(os.tmpdir(), "presidential-route-publication-readiness");
const expectedLaunchSequence = [
  "home",
  "moon-rocks",
  "our-story",
  "learn",
  "find-us",
  "contact",
];

function collectTypeScriptFiles(directory) {
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, {withFileTypes: true})) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  walk(directory);
  return files;
}

function compileSeoLibrary() {
  rmSync(outDir, {recursive: true, force: true});
  mkdirSync(outDir, {recursive: true});

  const program = ts.createProgram(collectTypeScriptFiles(sourceRoot), {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmitOnError: true,
    outDir,
    rootDir: path.join(projectRoot, "src"),
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  });

  const emitResult = program.emit();
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);

  if (diagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => "\n",
    });
    throw new Error(`Route publication readiness compile failed:\n${formatted}`);
  }
}

function check(rows, name, passed, details) {
  rows.push({
    check: name,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

function main() {
  compileSeoLibrary();

  const require = createRequire(import.meta.url);
  const distRoot = path.join(outDir, "lib", "seo");
  const routesPath = path.join(distRoot, "routes.js");
  const indexabilityPath = path.join(distRoot, "indexability.js");
  const publicationPath = path.join(distRoot, "source-records", "route-publication.js");

  for (const requiredPath of [routesPath, indexabilityPath, publicationPath]) {
    if (!existsSync(requiredPath)) {
      throw new Error(`Compiled route publication readiness module missing: ${requiredPath}`);
    }
  }

  const {ROUTE_REGISTRY} = require(routesPath);
  const {getSitemapBlockReasons, isSitemapEligible} = require(indexabilityPath);
  const {
    APPROVED_ROUTE_PUBLICATIONS,
    ROUTE_PUBLICATION_APPROVAL_SEQUENCE,
    getRoutePublicationGateBlockReasons,
    isRoutePublicationApprovedForSeo,
  } = require(publicationPath);

  const rows = [];
  const launchRoutes = expectedLaunchSequence.map((routeId) =>
    ROUTE_REGISTRY.find((route) => route.id === routeId),
  );
  const missingLaunchRoutes = expectedLaunchSequence.filter(
    (_routeId, index) => !launchRoutes[index],
  );
  const actualSequence = [...ROUTE_PUBLICATION_APPROVAL_SEQUENCE];
  const routeReports = launchRoutes
    .filter(Boolean)
    .map((route) => {
      const publicationBlockReasons = getRoutePublicationGateBlockReasons(route);
      const sitemapBlockReasons = getSitemapBlockReasons(route);

      return {
        routeId: route.id,
        path: route.path,
        publicationApproved: isRoutePublicationApprovedForSeo(route),
        sitemapEligible: isSitemapEligible(route),
        publicationBlockReasons,
        sitemapBlockReasons,
      };
    });

  check(
    rows,
    "routePublicationReadiness.sequence.matchesLaunchOrder",
    JSON.stringify(actualSequence) === JSON.stringify(expectedLaunchSequence),
    actualSequence.join(" -> "),
  );
  check(
    rows,
    "routePublicationReadiness.launchRoutes.present",
    missingLaunchRoutes.length === 0,
    missingLaunchRoutes.length === 0
      ? "home, moon-rocks, our-story, learn, find-us, contact routes are registered"
      : `missing launch route ids: ${missingLaunchRoutes.join(", ")}`,
  );
  check(
    rows,
    "routePublicationReadiness.approvedRecords.empty",
    APPROVED_ROUTE_PUBLICATIONS.length === 0,
    `approved route-publication record count: ${APPROVED_ROUTE_PUBLICATIONS.length}`,
  );
  check(
    rows,
    "routePublicationReadiness.launchRoutes.closed",
    routeReports.every(
      (report) =>
        !report.publicationApproved &&
        report.publicationBlockReasons.includes("source_record:route_publication_missing"),
    ),
    "each launch route remains blocked on a missing route-publication source record",
  );
  check(
    rows,
    "routePublicationReadiness.launchRoutes.notSitemapEligible",
    routeReports.every((report) => !report.sitemapEligible),
    "no launch route is sitemap-eligible before route-publication approval",
  );
  check(
    rows,
    "routePublicationReadiness.routeReports.nonempty",
    routeReports.length === expectedLaunchSequence.length,
    `route reports: ${routeReports.length}`,
  );

  const failCount = rows.filter((row) => row.status === "fail").length;
  const verdict =
    failCount === 0
      ? "PASS_ROUTE_PUBLICATION_READINESS_CLOSED_NO_PUBLIC_UNLOCK"
      : "FAIL_ROUTE_PUBLICATION_READINESS_REVIEW_REQUIRED";

  const payload = {
    verdict,
    passCount: rows.length - failCount,
    failCount,
    launchSequence: expectedLaunchSequence,
    approvedRoutePublicationCount: APPROVED_ROUTE_PUBLICATIONS.length,
    routeReports,
    checks: rows,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    schemaUnlocked: false,
    publicSeoUnlocked: false,
    deploymentExecuted: false,
    providerMutated: false,
    secretsPrinted: false,
    guardrail:
      "This verifier reads the compiled SEO route-publication gate only. It creates no route-publication records, changes no route registry values, submits no sitemap, indexes no route, and performs no provider action.",
  };

  console.log(JSON.stringify(payload, null, 2));

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
