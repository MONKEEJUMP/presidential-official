import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const webRoot = process.cwd();
const tokenPath = path.join(webRoot, "src", "lib", "design-system", "tokens.ts");
const globalsPath = path.join(webRoot, "src", "app", "globals.css");
const scanRoots = [
  path.join(webRoot, "src", "app"),
  path.join(webRoot, "src", "components"),
];

const forbiddenPaletteClassPattern =
  /(?:^|\s)(?:bg|text|border|from|to|via|ring|outline|decoration|accent)-(?:white|black|emerald|zinc|amber|slate|stone|neutral|gray|grey|blue|purple|yellow|cyan|red|green|orange|lime|pink|indigo|violet|fuchsia|sky|teal)(?:[-/:\w.[\]]*)?(?=\s|$)/;

const textExtensions = new Set([".tsx", ".ts"]);

function read(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function stripBlockComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function rel(filePath) {
  return toPosix(path.relative(webRoot, filePath));
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
    const fullPath = path.join(targetPath, entry.name);
    const relativePath = rel(fullPath);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        relativePath.startsWith("src/app/drafts")
      ) {
        continue;
      }
      files.push(...walkTextFiles(fullPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractRuntimeBindings(source) {
  const arrayMatch = source.match(
    /export const PRESIDENTIAL_RUNTIME_TOKEN_BINDINGS\s*=\s*\[([\s\S]*?)\]\s*as const satisfies readonly RuntimeDesignTokenBinding\[\];/,
  );
  const arraySource = arrayMatch?.[1] ?? "";

  return Array.from(arraySource.matchAll(/\{\s*tokenName:\s*"([^"]+)",\s*cssVariable:\s*"([^"]+)",\s*themeVariable:\s*"([^"]+)",\s*scaffoldValue:\s*"([^"]+)",\s*finalApprovalRequired:\s*true,\s*\}/g)).map(
    (match) => ({
      tokenName: match[1],
      cssVariable: match[2],
      themeVariable: match[3],
      scaffoldValue: match[4],
    }),
  );
}

function extractRuntimeBindingArraySource(source) {
  const arrayMatch = source.match(
    /export const PRESIDENTIAL_RUNTIME_TOKEN_BINDINGS\s*=\s*\[([\s\S]*?)\]\s*as const satisfies readonly RuntimeDesignTokenBinding\[\];/,
  );
  return arrayMatch?.[1] ?? "";
}

function addCheck(rows, check, passed, details) {
  rows.push({
    check,
    status: passed ? "pass" : "fail",
    details,
    public_unlock: "no",
  });
}

const rows = [];
const tokenSource = read(tokenPath);
const globalsSource = read(globalsPath);
const runtimeBindingArraySource = extractRuntimeBindingArraySource(tokenSource);
const runtimeBindings = extractRuntimeBindings(tokenSource);
const runtimeBindingTokenNameCount = Array.from(runtimeBindingArraySource.matchAll(/\btokenName:\s*"/g)).length;
const runtimeBindingFinalApprovalCount = Array.from(
  runtimeBindingArraySource.matchAll(/\bfinalApprovalRequired:\s*true\b/g),
).length;
const missingCssVariables = runtimeBindings.filter(
  (binding) => !stripBlockComments(globalsSource).includes(`${binding.cssVariable}: ${binding.scaffoldValue}`),
);
const missingThemeVariables = runtimeBindings.filter(
  (binding) => !stripBlockComments(globalsSource).includes(`${binding.themeVariable}: var(${binding.cssVariable})`),
);
const launchedSurfaceFiles = scanRoots.flatMap(walkTextFiles);
const paletteDrift = [];

for (const file of launchedSurfaceFiles) {
  const relativePath = rel(file);
  const lines = read(file).split(/\r?\n/);

  for (const [lineIndex, line] of lines.entries()) {
    if (forbiddenPaletteClassPattern.test(line)) {
      paletteDrift.push(`${relativePath}:${lineIndex + 1}:${line.trim()}`);
    }
  }
}

addCheck(rows, "designTokens.filesExist", Boolean(tokenSource && globalsSource), "tokens.ts and globals.css exist");
addCheck(
  rows,
  "designTokens.runtimeBindings.present",
  runtimeBindings.length >= 8,
  `${runtimeBindings.length} runtime binding(s) found`,
);
addCheck(
  rows,
  "designTokens.cssVariables.boundToScaffoldValues",
  missingCssVariables.length === 0,
  missingCssVariables.map((binding) => `${binding.tokenName}:${binding.cssVariable}`).join(" | ") || "all runtime CSS variables have scaffold values",
);
addCheck(
  rows,
  "designTokens.themeVariables.boundToCssVariables",
  missingThemeVariables.length === 0,
  missingThemeVariables.map((binding) => `${binding.tokenName}:${binding.themeVariable}`).join(" | ") || "all runtime theme variables reference CSS variables",
);
addCheck(
  rows,
  "designTokens.finalApprovalRequired",
  runtimeBindings.length === runtimeBindingTokenNameCount &&
    runtimeBindingFinalApprovalCount === runtimeBindingTokenNameCount &&
    runtimeBindings.every((binding) => binding.tokenName && binding.cssVariable && binding.themeVariable),
  `${runtimeBindingFinalApprovalCount}/${runtimeBindingTokenNameCount} runtime token binding(s) stay marked finalApprovalRequired:true`,
);
addCheck(
  rows,
  "launchedSurfaces.noRawTailwindPaletteClasses",
  paletteDrift.length === 0,
  paletteDrift.slice(0, 20).join(" | ") || "no raw Tailwind palette classes on launched public surfaces outside private drafts",
);
addCheck(
  rows,
  "designTokens.noPublicUnlock",
  !/public seo unlocked|route publication approved|sitemap inclusion approved|index,\s*follow approved|deployment approved/i.test(
    `${tokenSource}\n${globalsSource}`,
  ),
  "design token runtime verifier does not unlock public SEO",
);

const failed = rows.filter((row) => row.status === "fail");
const payload = {
  verdict: failed.length
    ? "FAIL_DESIGN_TOKEN_RUNTIME_REVIEW_REQUIRED"
    : "PASS_DESIGN_TOKEN_RUNTIME_NO_PUBLIC_UNLOCK",
  checks: rows,
  scannedLaunchedSurfaceFileCount: launchedSurfaceFiles.length,
  runtimeBindingCount: runtimeBindings.length,
  publicSeoUnlocked: false,
  routePublicationApproved: false,
  sitemapUnlocked: false,
  indexabilityUnlocked: false,
};

console.log(JSON.stringify(payload, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
