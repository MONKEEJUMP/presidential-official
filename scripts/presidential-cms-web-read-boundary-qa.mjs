import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const root = path.resolve(webRoot, "..");
const cmsRoot = path.join(webRoot, "src", "lib", "cms");
const clientPath = path.join(cmsRoot, "sanity-read-client.ts");
const indexPath = path.join(cmsRoot, "index.ts");
const packageJsonPath = path.join(webRoot, "package.json");
const appRoot = path.join(webRoot, "src", "app");
const componentsRoot = path.join(webRoot, "src", "components");
const seoRoot = path.join(webRoot, "src", "lib", "seo");
const designSystemRoot = path.join(webRoot, "src", "lib", "design-system");
const routePublicationPath = path.join(
  webRoot,
  "src",
  "lib",
  "seo",
  "source-records",
  "route-publication.ts",
);
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "398-step-cms-web-read-boundary-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "cms-web-read-boundary");
const statusJsonPath = path.join(workRoot, "cms-web-read-boundary-status.json");
const statusMdPath = path.join(workRoot, "cms-web-read-boundary-status.md");

const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const publicUnlockPattern =
  /public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved|schema approved|metadata approved|product page approved|locator page approved/i;
const mutationPattern =
  /\b(createIfNotExists|createOrReplace|create|mutate|mutation|patch|delete|publish|transaction|commit|listen|live)\b/i;
const secretSurfacePattern =
  /\b(Authorization|Bearer|SANITY_API_KEY|SANITY_API_TOKEN|SANITY_AUTH_TOKEN|SANITY_WRITE_TOKEN|NEXT_PUBLIC_[A-Z0-9_]*(?:TOKEN|SECRET|KEY|AUTH)[A-Z0-9_]*)\b/i;

const rows = [];

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function rel(filePath) {
  return toPosix(path.relative(root, filePath));
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function walkTextFiles(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return textExtensions.has(path.extname(targetPath).toLowerCase()) ? [targetPath] : [];
  }

  const files = [];
  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", ".lighthouseci"].includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTextFiles(fullPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function addCheck(check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

function collectMatches(files, pattern) {
  const matches = [];

  for (const file of files) {
    const text = readIfExists(file);
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      matches.push(rel(file));
    }
  }

  return matches;
}

function main() {
  const clientSource = readIfExists(clientPath);
  const indexSource = readIfExists(indexPath);
  const packageJson = readIfExists(packageJsonPath);
  const routePublicationSource = readIfExists(routePublicationPath);
  const publicSurfaceFiles = [
    ...walkTextFiles(appRoot),
    ...walkTextFiles(componentsRoot),
    ...walkTextFiles(seoRoot),
    ...walkTextFiles(designSystemRoot),
  ];
  const cmsFiles = walkTextFiles(cmsRoot);
  const cmsFileNames = cmsFiles.map((file) => rel(file)).sort();
  const publicCmsImports = publicSurfaceFiles
    .map((file) => ({ file, text: readIfExists(file) }))
    .filter(({ text }) => /from\s+["']@\/lib\/cms|from\s+["'][^"']*\/lib\/cms|import\(["'][^"']*\/lib\/cms/.test(text))
    .map(({ file }) => rel(file));
  const cmsMutationMatches = collectMatches(cmsFiles, mutationPattern);
  const cmsSecretMatches = collectMatches(cmsFiles, secretSurfacePattern);
  const publicUnlockMatches = collectMatches(cmsFiles, publicUnlockPattern);

  addCheck("cms.directory.exists", existsSync(cmsRoot), rel(cmsRoot));
  addCheck("cms.client.exists", existsSync(clientPath), rel(clientPath));
  addCheck("cms.index.exists", existsSync(indexPath), rel(indexPath));
  addCheck(
    "cms.files.allowedSetOnly",
    cmsFileNames.join("|") === "web/src/lib/cms/index.ts|web/src/lib/cms/sanity-read-client.ts",
    cmsFileNames.join(" | "),
  );
  addCheck("client.serverOnly", /import\s+["']server-only["'];/.test(clientSource), "read client is server-only");
  addCheck("client.projectId.current", /SANITY_PROJECT_ID\s*=\s*["']4bl3xvem["']/.test(clientSource), "project id is 4bl3xvem");
  addCheck("client.dataset.production", /SANITY_DATASET\s*=\s*["']production["']/.test(clientSource), "dataset is production");
  addCheck("client.queryEndpoint", /\.apicdn\.sanity\.io/.test(clientSource) && /\/data\/query\//.test(clientSource), "uses Sanity CDN Query API endpoint");
  addCheck("client.publishedPerspective", /defaultPerspective:\s*["']published["']/.test(clientSource) && /perspective/.test(clientSource), "published perspective is explicit");
  addCheck("client.defaultDisabled", /PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED/.test(clientSource) && /===\s*["']true["']/.test(clientSource), "read fetch is opt-in and disabled by default");
  addCheck("client.noDraftQueries", /drafts\\\./.test(clientSource) && /draft documents/.test(clientSource), "draft query guard exists");
  addCheck("client.noSecretSurface", cmsSecretMatches.length === 0, cmsSecretMatches.join(" | ") || "no secret or auth header references");
  addCheck("client.noMutationSurface", cmsMutationMatches.length === 0, cmsMutationMatches.join(" | ") || "no mutation/write/live API references");
  addCheck("client.noPublicRouteImports", publicCmsImports.length === 0, publicCmsImports.join(" | ") || "no app/component imports of cms client");
  addCheck("client.publicRenderingDisabled", /publicRouteRenderingEnabled:\s*false/.test(clientSource), "public route rendering remains disabled");
  addCheck("client.routeApprovalsEmpty", /APPROVED_ROUTE_PUBLICATIONS\s*=\s*\[\]\s+as\s+const/.test(routePublicationSource), "route publication approvals remain empty");
  addCheck("index.exportsReadOnlyClient", /readPublishedSanity/.test(indexSource) && /SANITY_READ_CLIENT_CONFIG/.test(indexSource), "index exports read-only boundary");
  addCheck("package.scriptWired", /"cms:web-read:verify"\s*:\s*"node scripts\/presidential-cms-web-read-boundary-qa\.mjs"/.test(packageJson), "cms:web-read:verify is wired");
  addCheck("cms.noPublicUnlockSignals", publicUnlockMatches.length === 0, publicUnlockMatches.join(" | ") || "no public-unlock wording");

  const passCount = rows.filter((row) => row.status === "pass").length;
  const failCount = rows.length - passCount;
  const verdict = failCount === 0
    ? "PASS_CMS_WEB_READ_BOUNDARY_NO_PUBLIC_UNLOCK"
    : "FAIL_CMS_WEB_READ_BOUNDARY_REVIEW_REQUIRED";

  mkdirSync(path.dirname(docsResultsPath), { recursive: true });
  mkdirSync(workRoot, { recursive: true });
  writeFileSync(
    docsResultsPath,
    [
      "check,status,details,public_unlock",
      ...rows.map((row) => [row.check, row.status, row.details, row.public_unlock].map(csvEscape).join(",")),
    ].join("\n") + "\n",
  );

  const payload = {
    verdict,
    passCount,
    failCount,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    schemaUnlocked: false,
    sanityMutationEnabled: false,
    sanityPublicRenderingEnabled: false,
    rows,
  };

  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2) + "\n");
  writeFileSync(
    statusMdPath,
    [
      "# CMS Web Read Boundary Status",
      "",
      `Verdict: ${verdict}`,
      `Checks: ${passCount}/${rows.length}`,
      "Public unlock: no",
      "Sanity mutation: no",
      "Public route rendering: no",
      "",
    ].join("\n"),
  );

  console.log(verdict);
  console.log(`Checks passed: ${passCount}/${rows.length}`);
  if (failCount > 0) {
    console.error(rows.filter((row) => row.status === "fail").map((row) => `${row.check}: ${row.details}`).join("\n"));
    process.exit(1);
  }
}

main();
