import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src", "lib", "seo");

export function routeStateMatchesMode(routeState, strictReleaseMode) {
  return strictReleaseMode
    ? routeState.approvedRoutes.length > 0 &&
        routeState.approvedRoutes.every((route) => route.sitemapEligible)
    : routeState.approvedRecordCount === 0 &&
        routeState.approvedRoutes.length === 0 &&
        routeState.sitemapEligibleRoutes.length === 0;
}

export function expectedRouteIsPublic(routeState, routePath) {
  const route = routeState.routes.find((candidate) => candidate.path === routePath);
  return Boolean(route?.publicationApproved && route?.sitemapEligible);
}

export function sitemapStateMatchesMode(
  routeState,
  builtSitemapUrls,
  strictReleaseMode,
) {
  const built = new Set(builtSitemapUrls);
  const expected = new Set(
    routeState.sitemapEligibleRoutes.map((route) => route.canonicalUrl),
  );
  const exact =
    built.size === expected.size && [...expected].every((url) => built.has(url));

  return routeStateMatchesMode(routeState, strictReleaseMode) &&
    exact &&
    (strictReleaseMode ? expected.size > 0 : expected.size === 0);
}

function collectTypeScriptFiles(directory) {
  const files = [];

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  walk(directory);
  return files;
}

function compileSeoLibrary(outDir) {
  mkdirSync(outDir, { recursive: true });
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
    throw new Error(
      `Route publication runtime compile failed:\n${ts.formatDiagnosticsWithColorAndContext(
        diagnostics,
        {
          getCanonicalFileName: (fileName) => fileName,
          getCurrentDirectory: () => projectRoot,
          getNewLine: () => "\n",
        },
      )}`,
    );
  }
}

export function getRoutePublicationRuntimeState() {
  const outDir = path.join(
    os.tmpdir(),
    `presidential-route-publication-state-${process.pid}-${Date.now()}`,
  );

  try {
    compileSeoLibrary(outDir);
    const require = createRequire(import.meta.url);
    const distRoot = path.join(outDir, "lib", "seo");
    const requiredPaths = {
      routes: path.join(distRoot, "routes.js"),
      indexability: path.join(distRoot, "indexability.js"),
      helpers: path.join(distRoot, "route-helpers.js"),
      publication: path.join(distRoot, "source-records", "route-publication.js"),
    };

    for (const requiredPath of Object.values(requiredPaths)) {
      if (!existsSync(requiredPath)) {
        throw new Error(`Compiled route publication module missing: ${requiredPath}`);
      }
    }

    const { ROUTE_REGISTRY } = require(requiredPaths.routes);
    const { isSitemapEligible } = require(requiredPaths.indexability);
    const { buildRouteCanonicalUrl, isRouteTemplate } = require(requiredPaths.helpers);
    const {
      APPROVED_ROUTE_PUBLICATIONS,
      isRoutePublicationApprovedForSeo,
    } = require(requiredPaths.publication);

    const routes = ROUTE_REGISTRY.map((route) => {
      const routeTemplate = isRouteTemplate(route);
      return {
        routeId: route.id,
        path: route.path,
        canonicalUrl: routeTemplate ? null : buildRouteCanonicalUrl(route),
        publicationApproved: isRoutePublicationApprovedForSeo(route),
        sitemapEligible: isSitemapEligible(route) && !routeTemplate,
      };
    });

    return {
      approvedRecordCount: APPROVED_ROUTE_PUBLICATIONS.length,
      routes,
      approvedRoutes: routes.filter((route) => route.publicationApproved),
      sitemapEligibleRoutes: routes.filter((route) => route.sitemapEligible),
    };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}
