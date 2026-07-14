import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

const BUILD_INPUT_DIRECTORIES = ["public", "src"];
const BUILD_INPUT_FILES = [
  "eslint.config.mjs",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.js",
  "postcss.config.mjs",
  "tailwind.config.js",
  "tailwind.config.ts",
  "tsconfig.json",
];
const BUILD_RELEVANT_ENVIRONMENT_NAMES = new Set([
  "PRESIDENTIAL_ANALYTICS_ENABLED",
  "PRESIDENTIAL_CONTACT_INBOX_EMAIL",
  "PRESIDENTIAL_CONTACT_MAILTO_ENABLED",
  "PRESIDENTIAL_GA_MEASUREMENT_ID",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION",
  "PRESIDENTIAL_GOOGLE_SITE_VERIFICATION_ENABLED",
  "PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED",
  "PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED",
  "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED",
  "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED",
  "PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED",
]);

function toPosix(filePath) {
  return filePath.replaceAll("\\", "/");
}

function walkFiles(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }

  return readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(targetPath, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

function buildInputFiles(projectRoot) {
  const environmentFiles = readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\.env(?:\.|$)/.test(entry.name))
    .map((entry) => path.join(projectRoot, entry.name));

  return [
    ...BUILD_INPUT_DIRECTORIES.flatMap((directory) =>
      walkFiles(path.join(projectRoot, directory)),
    ),
    ...BUILD_INPUT_FILES.map((file) => path.join(projectRoot, file)).filter(existsSync),
    ...environmentFiles,
  ].sort((left, right) => left.localeCompare(right));
}

function relevantEnvironment(environment) {
  return Object.keys(environment)
    .filter(
      (name) =>
        name.startsWith("NEXT_PUBLIC_") ||
        BUILD_RELEVANT_ENVIRONMENT_NAMES.has(name),
    )
    .sort()
    .map((name) => [name, environment[name] ?? ""]);
}

export function computeBuildInputFingerprint(
  projectRoot,
  environment = process.env,
) {
  const hash = createHash("sha256");
  const files = buildInputFiles(projectRoot);
  let totalBytes = 0;

  for (const file of files) {
    const relativePath = toPosix(path.relative(projectRoot, file));
    const contents = readFileSync(file);
    totalBytes += contents.length;
    hash.update(`file:${relativePath}\0${contents.length}\0`);
    hash.update(contents);
    hash.update("\0");
  }

  const environmentEntries = relevantEnvironment(environment);
  for (const [name, value] of environmentEntries) {
    hash.update(`env:${name}\0${value}\0`);
  }

  return {
    schemaVersion: "presidential.build-input.v1",
    algorithm: "sha256",
    sha256: hash.digest("hex"),
    fileCount: files.length,
    totalBytes,
    environmentNames: environmentEntries.map(([name]) => name),
  };
}
