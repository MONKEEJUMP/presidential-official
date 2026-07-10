import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const webRoot = process.cwd();
const repoRoot = resolve(webRoot, "..");
const studioEnvPath = join(repoRoot, "studio", ".env.local");
const nextBin = join(webRoot, "node_modules", "next", "dist", "bin", "next");
const buildDir = join(webRoot, ".next");
const workRoot = join(repoRoot, "sources", "spud", "work", "cms-live-draft-smoke");
const resultsJsonPath = join(workRoot, "cms-live-draft-smoke-results.json");
const resultsMdPath = join(workRoot, "cms-live-draft-smoke-results.md");
const host = "127.0.0.1";
const portWasExplicit = Boolean(process.env.PRESIDENTIAL_CMS_LIVE_DRAFT_SMOKE_PORT);
const preferredPort = Number(process.env.PRESIDENTIAL_CMS_LIVE_DRAFT_SMOKE_PORT || "3335");
const previewAccessToken = "cms-live-draft-smoke-preview-access";
let port = preferredPort;
let baseUrl = `http://${host}:${port}`;
const results = [];
const serverErrorChunks = [];
const draftRoutes = [
  {
    slug: "moon-rocks",
    requiredMarkers: ["Route readiness", "Product/media worklist"],
  },
  {
    slug: "moon-pods",
    requiredMarkers: ["Route readiness", "Product/media worklist"],
  },
  {
    slug: "orbit",
    requiredMarkers: ["Route readiness", "Product/media worklist"],
  },
  {
    slug: "our-story",
    requiredMarkers: ["Route readiness"],
  },
  {
    slug: "learn",
    requiredMarkers: ["Route readiness", "Learn CMS path"],
  },
  {
    slug: "find-us",
    requiredMarkers: ["Route readiness", "Locator readiness"],
  },
  {
    slug: "contact",
    requiredMarkers: ["Route readiness", "Contact readiness"],
  },
];
let server;

function parseDotEnvValue(rawValue) {
  const trimmed = rawValue.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function readStudioDraftToken() {
  if (process.env.SANITY_AUTH_TOKEN?.trim()) {
    return process.env.SANITY_AUTH_TOKEN.trim();
  }

  if (!existsSync(studioEnvPath)) {
    return "";
  }

  const envText = readFileSync(studioEnvPath, "utf8");
  const line = envText
    .split(/\r?\n/)
    .find((candidate) => candidate.trim().startsWith("SANITY_AUTH_TOKEN="));

  if (!line) {
    return "";
  }

  return parseDotEnvValue(line.split("=").slice(1).join("="));
}

function addCheck(name, ok, details) {
  results.push({
    name,
    ok: Boolean(ok),
    details,
  });
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${previewAccessToken}` },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return text;
}

function isPortAvailable(targetPort) {
  return new Promise((resolveAvailability) => {
    const probe = createServer();

    probe.once("error", () => resolveAvailability(false));
    probe.once("listening", () => {
      probe.close(() => resolveAvailability(true));
    });
    probe.listen(targetPort, host);
  });
}

async function choosePort() {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }

  if (portWasExplicit) {
    throw new Error(`Refusing occupied explicitly configured live-draft port ${preferredPort}.`);
  }

  for (let offset = 1; offset <= 40; offset += 1) {
    if (await isPortAvailable(preferredPort + offset)) {
      return preferredPort + offset;
    }
  }

  throw new Error(`No available live-draft smoke port found after ${preferredPort}.`);
}

async function waitForServer() {
  let lastError;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await fetchText("/drafts");
      return;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }

  throw lastError || new Error("Next server did not become ready.");
}

function startServer(token) {
  if (!existsSync(nextBin)) {
    throw new Error("Next.js binary not found. Run npm install first.");
  }

  if (!existsSync(buildDir)) {
    throw new Error("Built .next directory not found. Run npm run build before cms:live-draft:verify.");
  }

  server = spawn(process.execPath, [nextBin, "start", "--hostname", host, "--port", String(port)], {
    cwd: webRoot,
    env: {
      ...process.env,
      PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED: "true",
      PRESIDENTIAL_PRIVATE_DRAFTS_ACCESS_TOKEN: previewAccessToken,
      PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED: "true",
      SANITY_AUTH_TOKEN: token,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => {
    const message = chunk.toString();
    serverErrorChunks.push(message);
    process.stderr.write(chunk);
  });
}

async function stopServer() {
  if (!server || server.killed) {
    return;
  }

  await new Promise((resolveStop) => {
    const timeout = setTimeout(() => {
      server.kill("SIGKILL");
      resolveStop();
    }, 4000);

    server.once("exit", () => {
      clearTimeout(timeout);
      resolveStop();
    });

    server.kill("SIGTERM");
  });
}

async function assertNoListener() {
  try {
    await fetchText("/drafts");
    addCheck("runtime server stopped", false, `server still responded on ${baseUrl}`);
  } catch {
    addCheck("runtime server stopped", true, `no response from ${baseUrl} after shutdown`);
  }
}

async function runSmoke() {
  const unauthenticatedResponse = await fetch(`${baseUrl}/drafts`);
  addCheck(
    "private drafts route rejects missing bearer access",
    unauthenticatedResponse.status === 404,
    `unauthenticated /drafts returned ${unauthenticatedResponse.status}`,
  );
  const html = await fetchText("/drafts");
  addCheck("private drafts route active", html.includes("Presidential CMS bridge"), "private /drafts route rendered");
  addCheck("homepage draft read active", html.includes("Draft read active"), "live Sanity draft read marker visible");
  addCheck("homepage record is draft", html.includes("Homepage record") && html.includes("Draft"), "homepage source reports Draft");
  addCheck(
    "homepage not fixture fallback",
    !html.includes("Rendering CMS-shaped fixture data until the Sanity homepage record exists."),
    "fixture fallback banner absent",
  );
  addCheck("homepage modules rendered", !html.includes("No homepage modules found"), "homepage module renderer has module content");

  for (const route of draftRoutes) {
    const routePath = `/drafts/${route.slug}`;
    const routeHtml = await fetchText(routePath);
    const hasLiveSource = routeHtml.includes("Live Sanity draft");
    const hasDraftRead = routeHtml.includes("Draft read active");
    const hasSlug = routeHtml.includes(route.slug);
    const missingMarkers = route.requiredMarkers.filter((marker) => !routeHtml.includes(marker));

    addCheck(
      `${route.slug} route live draft active`,
      hasLiveSource && hasDraftRead && hasSlug,
      `${routePath} source=${hasLiveSource ? "live" : "not-live"} draftRead=${String(hasDraftRead)} slugVisible=${String(hasSlug)}`,
    );
    addCheck(
      `${route.slug} route readiness panels rendered`,
      missingMarkers.length === 0,
      missingMarkers.length
        ? `${routePath} missing markers: ${missingMarkers.join(", ")}`
        : `${routePath} rendered markers: ${route.requiredMarkers.join(", ")}`,
    );
  }

  await sleep(250);
  const errorLog = serverErrorChunks.join("\n");
  addCheck(
    "runtime server error log clean",
    !/(\u2a2f|⨯|\bError:)/u.test(errorLog),
    errorLog.trim()
      ? "server stderr contained render errors; review terminal output"
      : "no server render errors detected during live draft smoke",
  );
}

function writeResults() {
  mkdirSync(workRoot, { recursive: true });

  const failed = results.filter((row) => !row.ok);
  const payload = {
    verdict: failed.length ? "FAIL_CMS_LIVE_DRAFT_SMOKE_REVIEW_REQUIRED" : "PASS_CMS_LIVE_DRAFT_TOP_LEVEL_ROUTES_ACTIVE",
    baseUrl,
    generatedAt: new Date().toISOString(),
    checksPassed: results.length - failed.length,
    checksTotal: results.length,
    routesChecked: draftRoutes.map((route) => route.slug),
    tokenSource: process.env.SANITY_AUTH_TOKEN?.trim() ? "process.env" : "studio/.env.local",
    tokenPresent: true,
    results,
  };

  writeFileSync(resultsJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(
    resultsMdPath,
    [
      "# CMS Live Draft Smoke",
      "",
      `- Verdict: \`${payload.verdict}\``,
      `- Base URL: \`${baseUrl}\``,
      `- Checks: \`${payload.checksPassed}/${payload.checksTotal}\``,
      `- Token source: \`${payload.tokenSource}\``,
      "",
      "| Check | Status | Details |",
      "| --- | --- | --- |",
      ...results.map((row) => `| ${row.name} | ${row.ok ? "pass" : "fail"} | ${row.details} |`),
      "",
    ].join("\n"),
  );

  return payload;
}

async function main() {
  const token = readStudioDraftToken();
  if (!token) {
    mkdirSync(workRoot, { recursive: true });
    const payload = {
      verdict: "FAIL_CMS_LIVE_DRAFT_TOKEN_MISSING",
      generatedAt: new Date().toISOString(),
      tokenPresent: false,
      tokenSource: "missing",
      results: [
        {
          name: "draft token present",
          ok: false,
          details: "SANITY_AUTH_TOKEN was not found in process.env or studio/.env.local",
        },
      ],
    };
    writeFileSync(resultsJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.error(payload.verdict);
    process.exit(1);
  }

  try {
    port = await choosePort();
    baseUrl = `http://${host}:${port}`;
    startServer(token);
    await waitForServer();
    await runSmoke();
  } finally {
    await stopServer();
    await assertNoListener();
  }

  const payload = writeResults();
  console.log(payload.verdict);
  console.log(`Checks passed: ${payload.checksPassed}/${payload.checksTotal}`);

  if (payload.verdict.startsWith("FAIL")) {
    for (const row of payload.results.filter((result) => !result.ok)) {
      console.error(`${row.name}: ${row.details}`);
    }
    process.exit(1);
  }
}

await main();
