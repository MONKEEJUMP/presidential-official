import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const webRoot = process.cwd();
const nextConfigPath = path.join(webRoot, "next.config.ts");
const publicRoot = path.join(webRoot, "public");
const builtAppRoot = path.join(webRoot, ".next", "server", "app");
const docsResultsPath = path.join(
  root,
  "docs",
  "phase1-seo-artifacts",
  "255-step10i-remote-image-source-readiness-results.csv",
);
const workRoot = path.join(root, "sources", "spud", "work", "step10i-remote-image-source-readiness");
const statusJsonPath = path.join(workRoot, "step10i-remote-image-source-readiness-status.json");
const statusMdPath = path.join(workRoot, "step10i-remote-image-source-readiness-status.md");

const sourceRoots = [
  path.join(webRoot, "src", "app"),
  path.join(webRoot, "src", "components"),
  path.join(webRoot, "src", "lib", "design-system"),
  path.join(webRoot, "src", "lib", "seo"),
  nextConfigPath,
  path.join(webRoot, "package.json"),
];

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".rsc",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
]);

const imageExtensions = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?:[?#][^\s"'<>)]*)?$/i;
const allowedPublicImageFiles = new Set([
  "apple-touch-icon.png",
  "brand/banner-about-us-contact-header.webp",
  "brand/banner-palms-teal.webp",
  "brand/og-social-share-image.avif",
  "brand/og-social-share-image.png",
  "brand/og-social-share-image.webp",
  "brand/presidential-logo.webp",
  "favicon.ico",
  "favicon.png",
  "media/brand/presidential-banner.png",
  "media/gems/presidential-p.png",
  "media/posters/crest-spinning.jpg",
  "media/posters/flavor-blunts.jpg",
  "media/posters/moon-rocks-film.jpg",
  "media/posters/nationwide-map.jpg",
  "media/posters/strains-horizontal.jpg",
  "media/posters/strains-vertical.jpg",
  "media/states/az-hero.webp",
  "media/states/ca-hero.webp",
  "media/states/fl-hero.webp",
  "media/states/mi-hero.webp",
  "media/states/nv-hero.webp",
  "media/states/ny-hero.webp",
  "media/states/ok-hero.webp",
  "media/states/wa-hero.webp",
]);
const remoteImageUrlPattern = /https?:\/\/[^\s"'<>)]*\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?:[?#][^\s"'<>)]*)?/gi;
const cssRemoteUrlPattern = /url\(\s*["']?https?:\/\/[^)"']+["']?\s*\)/gi;
const blockedHostPattern =
  /\b(?:static\.)?wixstatic\.com\b|\bwixsite\.com\b|\bwix\.com\b|\bdrive\.google\.com\b|\bdocs\.google\.com\b|\bgoogleusercontent\.com\b|\bvercel\.app\b|\bvercel\.com\b|\bwww\.presidentialmoonrocks\.com\b|\bpresidentialca\.com\b|\bpresidential\.vip\b|\bpresidential\.rocks\b|\bpresidential\.online\b|\bpresidential\.us\b|\blocalhost\b|\b127\.0\.0\.1\b/i;
const publicUnlockPattern =
  /image sitemap approved|schema image approved|og image approved|twitter image approved|asset approved for public|public image unlocked|public seo unlocked|sitemap inclusion approved|route publication approved/i;

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
  return passed;
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
  const entries = readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) {
        continue;
      }
      files.push(...walkTextFiles(fullPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function walkFiles(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }

  const files = [];
  const entries = readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) {
        continue;
      }
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function collectTextMatches(files, patterns) {
  const matches = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const found = text.match(pattern) ?? [];
      for (const value of found) {
        matches.push({
          file: path.relative(root, file),
          value,
        });
      }
    }
  }
  return matches;
}

function publicAssetFiles() {
  if (!existsSync(publicRoot)) {
    return [];
  }
  return walkFiles(publicRoot)
    .map((file) => path.relative(publicRoot, file).replaceAll(path.sep, "/"))
    .filter((file) => imageExtensions.test(file));
}

function collectLocalImageUsage(files) {
  const nextImageSources = [];
  const staticImageImports = [];
  const cmsNextImageSources = [];
  let nextImageComponentCount = 0;

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const relativeFile = path.relative(root, file);
    const importsNextImage = /from\s+["']next\/image["']|require\(["']next\/image["']\)/.test(text);

    for (const pattern of [
      /\bfrom\s+["']([^"']+\.(?:avif|gif|ico|jpe?g|png|svg|webp))["']/gi,
      /\brequire\(\s*["']([^"']+\.(?:avif|gif|ico|jpe?g|png|svg|webp))["']\s*\)/gi,
      /\bimport\s+["']([^"']+\.(?:avif|gif|ico|jpe?g|png|svg|webp))["']/gi,
    ]) {
      for (const match of text.matchAll(pattern)) {
        staticImageImports.push({ file: relativeFile, value: match[1] });
      }
    }

    if (!importsNextImage) {
      continue;
    }

    const imageTags = text.match(/<Image\b[\s\S]*?\/?>/g) ?? [];
    nextImageComponentCount += imageTags.length;
    // Dynamic image sources are limited to approval-gated CMS asset URLs or
    // the audited local poster/state/media manifests below.
    for (const imageTag of imageTags) {
      const literalSource = imageTag.match(/\bsrc\s*=\s*["']([^"']+)["']/);
      if (literalSource) {
        nextImageSources.push({ file: relativeFile, value: literalSource[1] });
        continue;
      }

      const dynamicSource = imageTag.match(/\bsrc\s*=\s*\{([^}]+)\}/);
      if (dynamicSource) {
        const expression = dynamicSource[1].trim();
        cmsNextImageSources.push({
          file: relativeFile,
          value: expression,
          governed:
            /\.assetUrl!?\s*$/.test(expression) ||
            /^(?:CREST_SPINNING_POSTER|NATIONWIDE_MAP_POSTER|backgroundImagePath|heroImage\.src|activePreview\.product\.imageUrl)$/.test(
              expression,
            ),
        });
      }
    }
  }

  return {
    nextImageComponentCount,
    nextImageSources,
    staticImageImports,
    cmsNextImageSources,
  };
}

function main() {
  const rows = [];
  const nextConfigText = existsSync(nextConfigPath) ? readFileSync(nextConfigPath, "utf8") : "";
  const sourceFiles = sourceRoots.flatMap(walkTextFiles);
  const builtFiles = walkTextFiles(builtAppRoot);
  const publicImages = publicAssetFiles();
  const sourceText = sourceFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  const builtText = builtFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  const nextImageImportCount = (
    sourceText.match(/from\s+["']next\/image["']|require\(["']next\/image["']\)/g) ?? []
  ).length;

  const sourceRemoteImageUrls = collectTextMatches(sourceFiles, [remoteImageUrlPattern, cssRemoteUrlPattern]);
  const builtRemoteImageUrls = collectTextMatches(builtFiles, [remoteImageUrlPattern, cssRemoteUrlPattern]);
  const sourceBlockedHostMatches = collectTextMatches(sourceFiles, [blockedHostPattern]);
  const builtBlockedHostMatches = collectTextMatches(builtFiles, [blockedHostPattern]);
  const unexpectedPublicImages = publicImages.filter((file) => !allowedPublicImageFiles.has(file));
  const missingAllowedPublicImages = [...allowedPublicImageFiles].filter((file) => !publicImages.includes(file));
  const {
    nextImageComponentCount,
    nextImageSources,
    staticImageImports,
    cmsNextImageSources,
  } = collectLocalImageUsage(sourceFiles);
  const invalidNextImageSources = nextImageSources.filter(({ value }) => {
    if (!value.startsWith("/")) {
      return true;
    }
    const publicPath = value.slice(1).split(/[?#]/, 1)[0];
    return !allowedPublicImageFiles.has(publicPath) || !publicImages.includes(publicPath);
  });
  const governedCmsImageSources = cmsNextImageSources.filter(({ governed }) => governed);
  const ungovernedCmsImageSources = cmsNextImageSources.filter(({ governed }) => !governed);
  const unresolvedNextImageComponents =
    nextImageComponentCount - nextImageSources.length - cmsNextImageSources.length;

  const hasImagesConfig = /\bimages\s*:/.test(nextConfigText);
  const hasRemotePatterns = /\bremotePatterns\s*:/.test(nextConfigText);
  const hasDomains = /\bdomains\s*:/.test(nextConfigText);
  const hasCustomLoader = /\bloader\s*:|\bloaderFile\s*:/.test(nextConfigText);

  // 9083-CODE P2.1 (owner directive, 2026-07-10) + AUTH-1 asset records:
  // exactly one remote image scope is approved — the project's own Sanity CDN
  // path. Anything broader (other hosts, wildcards, domains, loaders) fails.
  const APPROVED_REMOTE_IMAGE_HOSTNAME = "cdn.sanity.io";
  const APPROVED_REMOTE_IMAGE_PATHNAME = "/images/4bl3xvem/production/**";
  const configHostnames = [...nextConfigText.matchAll(/hostname:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
  const configPathnames = [...nextConfigText.matchAll(/pathname:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
  const remotePatternsApprovedScopeOnly =
    hasRemotePatterns &&
    configHostnames.length === 1 &&
    configHostnames[0] === APPROVED_REMOTE_IMAGE_HOSTNAME &&
    configPathnames.length === 1 &&
    configPathnames[0] === APPROVED_REMOTE_IMAGE_PATHNAME &&
    /protocol:\s*"https"/.test(nextConfigText);
  const remoteImageScopeSafe = !hasRemotePatterns || remotePatternsApprovedScopeOnly;
  const imagesConfigSafe = !hasImagesConfig || remotePatternsApprovedScopeOnly;

  const checks = [
    addCheck(rows, "nextConfig.exists", existsSync(nextConfigPath), nextConfigPath),
    addCheck(
      rows,
      "builtOutput.exists",
      builtFiles.length > 0,
      `${builtFiles.length} built text file(s) scanned`,
    ),
    addCheck(
      rows,
      "nextImage.remotePatternsDeferred",
      remoteImageScopeSafe,
      "next/image remotePatterns are absent or scoped exactly to the approved Presidential Sanity CDN path (9083-CODE P2.1, AUTH-1 asset records)",
    ),
    addCheck(
      rows,
      "nextImage.domainsDeprecatedAbsent",
      !hasDomains,
      "No legacy images.domains allowlist is configured",
    ),
    addCheck(
      rows,
      "nextImage.customLoaderDeferred",
      !hasCustomLoader,
      "No custom image loader is configured until an approved image pipeline exists",
    ),
    addCheck(
      rows,
      "nextImage.noImageConfigWithoutApproval",
      imagesConfigSafe,
      "Image optimization config is absent or limited to the approved Sanity CDN scope backed by uploaded, owner-approved asset records",
    ),
    addCheck(
      rows,
      "source.noRemoteImageUrls",
      sourceRemoteImageUrls.length === 0,
      `${sourceRemoteImageUrls.length} remote image URL(s) found in source surfaces`,
    ),
    addCheck(
      rows,
      "built.noRemoteImageUrls",
      builtRemoteImageUrls.length === 0,
      `${builtRemoteImageUrls.length} remote image URL(s) found in built route output`,
    ),
    addCheck(
      rows,
      "source.noBlockedImageHosts",
      sourceBlockedHostMatches.length === 0,
      `${sourceBlockedHostMatches.length} blocked host match(es) found in source surfaces`,
    ),
    addCheck(
      rows,
      "built.noBlockedImageHosts",
      builtBlockedHostMatches.length === 0,
      `${builtBlockedHostMatches.length} blocked host match(es) found in built route output`,
    ),
    addCheck(
      rows,
      "public.hasOnlyApprovedLocalBrandAssets",
      unexpectedPublicImages.length === 0 && missingAllowedPublicImages.length === 0,
      `${publicImages.length} local public image file(s); unexpected=${unexpectedPublicImages.length}; missing=${missingAllowedPublicImages.length}`,
    ),
    addCheck(
      rows,
      "source.noStaticImageImports",
      staticImageImports.length === 0,
      `${staticImageImports.length} static image import(s) found outside the approved public asset path boundary`,
    ),
    addCheck(
      rows,
      "source.nextImageLocalAssetBoundary",
      sourceRemoteImageUrls.length === 0 &&
        remoteImageScopeSafe &&
        !hasDomains &&
        !hasCustomLoader &&
        staticImageImports.length === 0 &&
        invalidNextImageSources.length === 0 &&
        ungovernedCmsImageSources.length === 0 &&
        unresolvedNextImageComponents === 0,
      `${nextImageImportCount} next/image import(s), ${nextImageComponentCount} component use(s), ${nextImageSources.length} approved local literal source(s), ${governedCmsImageSources.length} governed CMS assetUrl source(s), ${invalidNextImageSources.length} invalid source(s), ${ungovernedCmsImageSources.length} ungoverned dynamic source(s), ${unresolvedNextImageComponents} unresolved component source(s)`,
    ),
    addCheck(
      rows,
      "built.noOgOrTwitterImage",
      !/(?:og:image|twitter:image)/i.test(builtText),
      "Built output does not emit social image metadata",
    ),
    addCheck(
      rows,
      "built.noImageSchemaUnlock",
      !/"(?:image|logo|photo)"\s*:/.test(builtText),
      "Built output does not emit JSON-LD image, logo, or photo fields",
    ),
    addCheck(
      rows,
      "noPublicUnlockSignals",
      !publicUnlockPattern.test([nextConfigText, sourceText, builtText].join("\n")),
      "Remote image readiness does not approve assets, social images, schema images, sitemap inclusion, route publication, or public SEO",
    ),
  ];

  const verdict = checks.every(Boolean)
    ? "PASS_REMOTE_IMAGE_SOURCE_READINESS_NO_PUBLIC_UNLOCK"
    : "FAIL_REMOTE_IMAGE_SOURCE_READINESS_REVIEW_REQUIRED";

  mkdirSync(path.dirname(docsResultsPath), { recursive: true });
  writeFileSync(
    docsResultsPath,
    [
      "check,status,details,public_unlock",
      ...rows.map((row) =>
        [row.check, row.status, row.details, row.public_unlock].map(csvEscape).join(","),
      ),
    ].join("\n") + "\n",
  );

  const payload = {
    verdict,
    officialSourcePosture: {
      nextImageRemotePatterns:
        "Next.js remotePatterns should allow only specific approved external image sources and paths.",
      googleImageSeo:
        "Google recommends descriptive filenames, titles, alt text, relevant surrounding text, and high-quality images.",
    },
    sourceTextFileCount: sourceFiles.length,
    builtTextFileCount: builtFiles.length,
    nextImageImportCount,
    publicImageFiles: publicImages,
    unexpectedPublicImages,
    missingAllowedPublicImages,
    nextImageComponentCount,
    nextImageSources,
    invalidNextImageSources,
    governedDynamicImageSources: governedCmsImageSources,
    ungovernedDynamicImageSources: ungovernedCmsImageSources,
    unresolvedNextImageComponents,
    staticImageImports,
    sourceRemoteImageUrls,
    builtRemoteImageUrls,
    sourceBlockedHostMatches,
    builtBlockedHostMatches,
    checks: Object.fromEntries(rows.map((row) => [row.check, row.status === "pass"])),
    localBrandAssetsPrepared: true,
    assetApproved: false,
    remoteImageHostsApproved: false,
    schemaImageUnlocked: false,
    openGraphImageUnlocked: false,
    imageSitemapUnlocked: false,
    publicSeoUnlocked: false,
    routePublicationApproved: false,
    sitemapUnlocked: false,
    indexabilityUnlocked: false,
    deploymentApproved: false,
    guardrail:
      "Step 10I is remote image/source host readiness only. It allows only the audited local public image inventory, while keeping remote image hosts, next/image config, social images, schema images, and image sitemap behavior blocked until asset source/proof/approval records exist.",
  };

  mkdirSync(workRoot, { recursive: true });
  writeFileSync(statusJsonPath, JSON.stringify(payload, null, 2));
  writeFileSync(
    statusMdPath,
    [
      "# Step 10I Remote Image Source Readiness Status",
      "",
      `Verdict: \`${verdict}\``,
      "",
      "## Checks",
      "",
      ...rows.map((row) => `- \`${row.check}\`: ${row.status.toUpperCase()} - ${row.details}`),
      "",
      "## Guardrail",
      "",
      payload.guardrail,
      "",
      "Final signal: `STEP_10I_REMOTE_IMAGE_SOURCE_READINESS_COMPLETE_NO_PUBLIC_UNLOCK`",
    ].join("\n") + "\n",
  );

  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = verdict.startsWith("PASS_") ? 0 : 1;
}

main();
