import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync, spawn, spawnSync } from "node:child_process";

const webRoot = process.cwd();
const repoRoot = resolve(webRoot, "..");
const nextBin = join(webRoot, "node_modules", "next", "dist", "bin", "next");
const buildScriptPath = join(webRoot, "scripts", "run-next-build.mjs");
const buildDir = join(webRoot, ".next");
const sanityFailureMockPath = join(webRoot, "scripts", "mock-sanity-fetch-failure.cjs");
const sanityApprovedMockPath = join(webRoot, "scripts", "mock-sanity-fetch-approved-cms.cjs");
const workRoot = join(repoRoot, "sources", "spud", "work", "cms-private-preview-smoke");
const resultsJsonPath = join(workRoot, "cms-runtime-smoke-results.json");
const resultsMdPath = join(workRoot, "cms-runtime-smoke-results.md");
const host = "127.0.0.1";
const basePort = Number(process.env.PRESIDENTIAL_CMS_RUNTIME_SMOKE_PORT || "3334");
let activePort = basePort;
let activeBaseUrl = `http://${host}:${activePort}`;

const publicCmsSmokeEnv = {
  PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED: "true",
  PRESIDENTIAL_HOMEPAGE_CMS_RENDERING_ENABLED: "true",
  PRESIDENTIAL_SITE_PAGE_CMS_RENDERING_ENABLED: "true",
  PRESIDENTIAL_LEARN_GUIDE_CMS_RENDERING_ENABLED: "true",
};
const disabledPublicCmsSmokeEnv = Object.fromEntries(
  Object.keys(publicCmsSmokeEnv).map((key) => [key, "false"]),
);
const learnGuideSlugs = [
  "what-are-moon-rocks",
  "what-is-live-resin",
  "what-is-live-rosin",
  "what-are-liquid-diamonds",
  "flavor-science",
  "infusion-science",
  "different-extracts-need-different-heat",
];
const publicPaths = [
  "/",
  "/moon-rocks",
  "/moon-pods",
  "/orbit",
  "/our-story",
  "/learn",
  ...learnGuideSlugs.map((slug) => `/learn/${slug}`),
  "/contact",
  "/find-us",
];
const publicDenyMarkers = [
  "Route control board",
  "Product/media worklist",
  "savedFile",
  "Private candidate media status",
  "Private form/submission boundary",
  "Private retailer source status",
  "Live Sanity draft",
  "Proof source",
  "Source system",
  "Original path or route",
  "Asset category",
  "Provenance",
  "Approval",
  "Allowed usage",
  "Blocked usage",
  "Fallback language",
  "Source note",
  "sourceStatus",
  "routeGate",
  "publicStatus",
  "pageUsage",
];
const fallbackExpectations = [
  {
    path: "/",
    markers: ["Official Presidential Cannabis", "Enter Moon Rocks"],
  },
  {
    path: "/moon-rocks",
    markers: ["Presidential Moon Rocks"],
  },
  {
    path: "/moon-pods",
    markers: ["Presidential Moon Pods"],
  },
  {
    path: "/orbit",
    markers: ["Presidential Orbit"],
  },
  {
    path: "/our-story",
    markers: ["The Presidential Story"],
  },
  {
    path: "/learn",
    markers: ["Learn Presidential"],
  },
  {
    path: "/learn/what-are-moon-rocks",
    markers: ["What Are Moon Rocks", "Guide foundation"],
  },
  {
    path: "/learn/what-is-live-resin",
    markers: ["What Is Live Resin", "Guide foundation"],
  },
  {
    path: "/learn/what-is-live-rosin",
    markers: ["What Is Live Rosin", "Guide foundation"],
  },
  {
    path: "/learn/what-are-liquid-diamonds",
    markers: ["What Are Liquid Diamonds", "Guide foundation"],
  },
  {
    path: "/learn/flavor-science",
    markers: ["Flavor Science", "Guide foundation"],
  },
  {
    path: "/learn/infusion-science",
    markers: ["Infusion Science", "Guide foundation"],
  },
  {
    path: "/learn/different-extracts-need-different-heat",
    markers: ["Different Extracts Need Different Heat", "Guide foundation"],
  },
  {
    path: "/contact",
    markers: ["Contact Presidential"],
  },
  {
    path: "/find-us",
    markers: ["Find Presidential Near You"],
  },
];
const privateChecks = [
  {
    path: "/drafts",
    checks: [
      ["private /drafts has route board", "Route control board"],
      ["private /drafts has top-level readiness", "Top-level draft route readiness"],
    ],
  },
  {
    path: "/drafts/moon-rocks",
    checks: [
      ["private /drafts/moon-rocks has product worklist", "Product/media worklist"],
      ["private /drafts/moon-rocks has route readiness", "Route readiness"],
    ],
  },
  {
    path: "/drafts/find-us",
    checks: [
      ["private /drafts/find-us has locator readiness", "Locator readiness"],
      ["private /drafts/find-us has retailer source status", "Private retailer source status"],
    ],
  },
  {
    path: "/drafts/contact",
    checks: [
      ["private /drafts/contact has contact readiness", "Contact readiness"],
      ["private /drafts/contact has form boundary", "Private form/submission boundary"],
    ],
  },
];

const results = [];
let serverErrorChunks = [];
let server;

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
  const response = await fetch(`${activeBaseUrl}${path}`);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return text;
}

async function waitForServer() {
  let lastError;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await fetchText("/contact");
      return;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }

  throw lastError || new Error("Next server did not become ready.");
}

function killPortListeners(targetPort) {
  if (process.platform !== "win32") {
    return;
  }

  const command = [
    `$connections = @(Get-NetTCPConnection -LocalPort ${targetPort} -State Listen -ErrorAction SilentlyContinue)`,
    "foreach ($connection in $connections) {",
    "  Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue",
    "}",
  ].join("; ");

  try {
    execFileSync("powershell.exe", ["-NoProfile", "-Command", command], {stdio: "ignore"});
  } catch {
    // Best-effort cleanup before the smoke starts its own local Next server.
  }
}

function hasPortListener(targetPort) {
  if (process.platform !== "win32") {
    return null;
  }

  try {
    const output = execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `(Get-NetTCPConnection -LocalPort ${targetPort} -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count`,
      ],
      {encoding: "utf8"},
    );

    return Number(output.trim()) > 0;
  } catch {
    return null;
  }
}

function buildNodeOptions(preload = "") {
  return [process.env.NODE_OPTIONS, preload ? `--require=${preload}` : ""]
    .filter(Boolean)
    .join(" ");
}

function rebuildForScenario({
  name,
  env = {},
  preload = "",
} = {}) {
  if (!existsSync(buildScriptPath)) {
    throw new Error("Build script not found. Cannot rebuild CMS runtime smoke scenario.");
  }

  const nodeOptions = buildNodeOptions(preload);
  const build = spawnSync(process.execPath, [buildScriptPath], {
    cwd: webRoot,
    env: {
      ...process.env,
      ...env,
      ...(nodeOptions ? { NODE_OPTIONS: nodeOptions } : {}),
    },
    stdio: "inherit",
  });

  addCheck(
    `${name} production build completed`,
    build.status === 0,
    build.status === 0
      ? "Next production build completed for CMS runtime smoke scenario"
      : `Next production build exited ${build.status ?? 1}`,
  );

  if (build.status !== 0) {
    throw new Error(`${name} production build failed.`);
  }
}

function startServer({
  port,
  env = {},
  preload = "",
} = {}) {
  if (!existsSync(nextBin)) {
    throw new Error("Next.js binary not found. Run npm install first.");
  }

  if (!existsSync(buildDir)) {
    throw new Error("Built .next directory not found. Run npm run build before cms:runtime-smoke:verify.");
  }

  if (preload && !existsSync(preload)) {
    throw new Error(`Required preload script is missing: ${preload}`);
  }

  activePort = port || basePort;
  activeBaseUrl = `http://${host}:${activePort}`;
  killPortListeners(activePort);
  serverErrorChunks = [];
  const nodeOptions = buildNodeOptions(preload);

  server = spawn(process.execPath, [nextBin, "start", "--hostname", host, "--port", String(activePort)], {
    cwd: webRoot,
    env: {
      ...process.env,
      ...env,
      PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED: "true",
      ...(nodeOptions ? { NODE_OPTIONS: nodeOptions } : {}),
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
      if (process.platform === "win32" && server?.pid) {
        try {
          execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {stdio: "ignore"});
        } catch {
          server.kill("SIGKILL");
        }
      } else {
        server.kill("SIGKILL");
      }
      resolveStop();
    }, 1500);

    server.once("exit", () => {
      clearTimeout(timeout);
      resolveStop();
    });

    if (process.platform === "win32" && server.pid) {
      try {
        execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {stdio: "ignore"});
      } catch {
        server.kill("SIGTERM");
      }
    } else {
      server.kill("SIGTERM");
    }
  });
}

async function assertNoListener() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const hasListener = hasPortListener(activePort);
    if (hasListener === false) {
      addCheck("runtime server stopped", true, `no listener on ${activeBaseUrl} after shutdown`);
      return;
    }

    if (hasListener === true) {
      await sleep(250);
      continue;
    }

    try {
      await fetchText("/contact");
      await sleep(250);
    } catch {
      addCheck("runtime server stopped", true, `no response from ${activeBaseUrl} after shutdown`);
      return;
    }
  }

  addCheck("runtime server stopped", false, `server still responded on ${activeBaseUrl}`);
}

function addPublicLeakChecks(scenarioName, routePath, html) {
  for (const marker of publicDenyMarkers) {
    addCheck(
      `${scenarioName} public ${routePath} no ${marker}`,
      !html.includes(marker),
      `public HTML does not expose "${marker}"`,
    );
  }
}

async function assertPublicFallbackScenario(scenarioName) {
  for (const path of publicPaths) {
    const html = await fetchText(path);
    addPublicLeakChecks(scenarioName, path, html);
  }

  for (const route of fallbackExpectations) {
    const html = await fetchText(route.path);
    const missingMarkers = route.markers.filter((marker) => !html.includes(marker));
    addCheck(
      `${scenarioName} public ${route.path} fallback/current page content rendered`,
      missingMarkers.length === 0,
      missingMarkers.length
        ? `missing markers: ${missingMarkers.join(", ")}`
        : `rendered markers: ${route.markers.join(", ")}`,
    );
  }
}

async function assertPublicLeakOnlyScenario(scenarioName) {
  for (const path of publicPaths) {
    const html = await fetchText(path);
    addPublicLeakChecks(scenarioName, path, html);
  }
}

async function assertPrivatePreviewChecks(scenarioName) {
  for (const route of privateChecks) {
    const html = await fetchText(route.path);
    for (const [name, needle] of route.checks) {
      addCheck(`${scenarioName} ${name}`, html.includes(needle), `${needle} visible`);
    }
  }
}

async function assertApprovedCmsRenderScenario(scenarioName) {
  const homeHtml = await fetchText("/");
  const moonRocksHtml = await fetchText("/moon-rocks");
  const ourStoryHtml = await fetchText("/our-story");
  const learnGuideHtml = await fetchText("/learn/what-are-moon-rocks");
  const findUsHtml = await fetchText("/find-us");
  const contactHtml = await fetchText("/contact");

  addCheck(
    `${scenarioName} public home renders approved CMS module`,
    homeHtml.includes("CMS Smoke Home Module"),
    "approved public homepage module fixture rendered behind flags",
  );
  addCheck(
    `${scenarioName} public moon-rocks renders approved CMS module`,
    moonRocksHtml.includes("CMS Smoke Moon Rocks Module"),
    "approved public Moon Rocks module fixture rendered behind flags",
  );
  addCheck(
    `${scenarioName} public our-story renders approved CMS module`,
    ourStoryHtml.includes("CMS Smoke Our Story Module"),
    "approved public Our Story module fixture rendered behind flags",
  );
  addCheck(
    `${scenarioName} public learn guide renders approved CMS body`,
    learnGuideHtml.includes("CMS Smoke Learn Guide Body"),
    "approved public Learn guide fixture rendered behind flags",
  );
  addCheck(
    `${scenarioName} public find-us renders approved CMS shell`,
    findUsHtml.includes("CMS Smoke Find Us Module"),
    "approved public Find Us shell fixture rendered behind flags",
  );
  addCheck(
    `${scenarioName} public contact renders approved CMS shell`,
    contactHtml.includes("CMS Smoke Contact Module"),
    "approved public Contact shell fixture rendered behind flags",
  );
}

async function assertCleanServerLog(scenarioName) {
  await sleep(250);
  const errorLog = serverErrorChunks.join("\n");
  addCheck(
    `${scenarioName} runtime server error log clean`,
    !/(\u2a2f|⨯|\bError:)/u.test(errorLog),
    errorLog.trim()
      ? "server stderr contained render errors; review terminal output"
      : "no server render errors detected during CMS runtime smoke",
  );
}

async function runServerScenario({
  name,
  port,
  env,
  preload = "",
  rebuild = false,
  privatePreview = false,
  fallbackExpected = true,
  afterPublicChecks,
}) {
  try {
    if (rebuild) {
      rebuildForScenario({name, env, preload});
    }
    startServer({port, env, preload});
    await waitForServer();
    if (fallbackExpected) {
      await assertPublicFallbackScenario(name);
    } else {
      await assertPublicLeakOnlyScenario(name);
    }
    if (afterPublicChecks) {
      await afterPublicChecks(name);
    }
    if (privatePreview) {
      await assertPrivatePreviewChecks(name);
    }
    await assertCleanServerLog(name);
  } finally {
    await stopServer();
    await assertNoListener();
  }
}

async function runSmoke() {
  addCheck(
    "public cms read flags enabled for smoke",
    Object.values(publicCmsSmokeEnv).every((value) => value === "true"),
    Object.keys(publicCmsSmokeEnv).join(", "),
  );
  addCheck(
    "public cms read flags disabled scenario configured",
    Object.values(disabledPublicCmsSmokeEnv).every((value) => value === "false"),
    Object.keys(disabledPublicCmsSmokeEnv).join(", "),
  );

  await runServerScenario({
    name: "disabled-cms",
    port: basePort,
    env: disabledPublicCmsSmokeEnv,
  });
  await runServerScenario({
    name: "enabled-cms",
    port: basePort + 1,
    env: publicCmsSmokeEnv,
    rebuild: true,
    privatePreview: true,
  });
  await runServerScenario({
    name: "approved-cms",
    port: basePort + 2,
    env: publicCmsSmokeEnv,
    preload: sanityApprovedMockPath,
    rebuild: true,
    fallbackExpected: false,
    afterPublicChecks: assertApprovedCmsRenderScenario,
  });
  await runServerScenario({
    name: "sanity-failure",
    port: basePort + 3,
    env: publicCmsSmokeEnv,
    preload: sanityFailureMockPath,
    rebuild: true,
  });
  rebuildForScenario({
    name: "restore-disabled-cms",
    env: disabledPublicCmsSmokeEnv,
  });
}

function writeResults() {
  mkdirSync(workRoot, { recursive: true });

  const failed = results.filter((row) => !row.ok);
  const payload = {
    verdict: failed.length ? "FAIL_CMS_RUNTIME_SMOKE_REVIEW_REQUIRED" : "PASS_CMS_RUNTIME_SMOKE_PUBLIC_PRIVATE_BOUNDARY",
    baseUrl: `http://${host}:${basePort}`,
    scenarioPorts: {
      "disabled-cms": basePort,
      "enabled-cms": basePort + 1,
      "approved-cms": basePort + 2,
      "sanity-failure": basePort + 3,
    },
    generatedAt: new Date().toISOString(),
    checksPassed: results.length - failed.length,
    checksTotal: results.length,
    publicCmsSmokeEnv,
    disabledPublicCmsSmokeEnv,
    publicPaths,
    publicDenyMarkers,
    results,
  };

  writeFileSync(resultsJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(
    resultsMdPath,
    [
      `# CMS Runtime Smoke`,
      "",
      `- Verdict: \`${payload.verdict}\``,
      `- Base URL: \`${payload.baseUrl}\``,
      `- Checks: \`${payload.checksPassed}/${payload.checksTotal}\``,
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
  await runSmoke();

  const payload = writeResults();
  console.log(payload.verdict);
  console.log(`Checks passed: ${payload.checksPassed}/${payload.checksTotal}`);

  if (payload.verdict.startsWith("FAIL")) {
    for (const row of payload.results.filter((result) => !result.ok)) {
      console.error(`${row.name}: ${row.details}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

await main();
