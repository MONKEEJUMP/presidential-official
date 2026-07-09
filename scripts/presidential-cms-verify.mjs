import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const webRoot = process.cwd();
const repoRoot = resolve(webRoot, "..");
const workRoot = join(repoRoot, "sources", "spud", "work", "cms-web-verify");
const statusJsonPath = join(workRoot, "cms-web-verify-status.json");
const statusMdPath = join(workRoot, "cms-web-verify-status.md");
const readBoundaryStatusPath = join(
  repoRoot,
  "sources",
  "spud",
  "work",
  "cms-web-read-boundary",
  "cms-web-read-boundary-status.json",
);
const runtimeSmokeStatusPath = join(
  repoRoot,
  "sources",
  "spud",
  "work",
  "cms-private-preview-smoke",
  "cms-runtime-smoke-results.json",
);

const commands = [
  {
    name: "cms:module-renderer:verify",
    script: join(webRoot, "scripts", "presidential-cms-module-renderer-coverage-qa.mjs"),
    statusPath: join(
      repoRoot,
      "sources",
      "spud",
      "work",
      "cms-module-renderer-coverage",
      "cms-module-renderer-coverage-status.json",
    ),
  },
  {
    name: "cms:web-read:verify",
    script: join(webRoot, "scripts", "presidential-cms-web-read-boundary-qa.mjs"),
    statusPath: readBoundaryStatusPath,
  },
  {
    name: "cms:runtime-smoke:verify",
    script: join(webRoot, "scripts", "presidential-cms-runtime-smoke-qa.mjs"),
    statusPath: runtimeSmokeStatusPath,
  },
];

function readJsonIfExists(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function runCommand(commandSpec) {
  const startedAt = new Date().toISOString();
  const run = spawnSync(process.execPath, [commandSpec.script], {
    cwd: webRoot,
    env: process.env,
    stdio: "inherit",
  });
  const endedAt = new Date().toISOString();
  const status = run.status ?? 1;

  return {
    name: commandSpec.name,
    status,
    ok: status === 0,
    error: run.error?.message,
    startedAt,
    endedAt,
    statusPath: commandSpec.statusPath,
    statusPayload: readJsonIfExists(commandSpec.statusPath),
  };
}

const results = commands.map(runCommand);
const failed = results.filter((result) => !result.ok);
const verdict = failed.length
  ? "FAIL_CMS_VERIFY_REVIEW_REQUIRED"
  : "PASS_CMS_VERIFY_STATIC_AND_RUNTIME_BOUNDARY";

mkdirSync(workRoot, { recursive: true });

const payload = {
  verdict,
  generatedAt: new Date().toISOString(),
  commandsPassed: results.length - failed.length,
  commandsTotal: results.length,
  results,
};

writeFileSync(statusJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(
  statusMdPath,
  [
    "# CMS Web Verify Status",
    "",
    `- Verdict: \`${verdict}\``,
    `- Commands: \`${payload.commandsPassed}/${payload.commandsTotal}\``,
    "",
    "| Command | Status | Status artifact |",
    "| --- | --- | --- |",
    ...results.map((result) => `| ${result.name} | ${result.ok ? "pass" : "fail"} | ${result.statusPath} |`),
    "",
  ].join("\n"),
);

console.log(verdict);
console.log(`Commands passed: ${payload.commandsPassed}/${payload.commandsTotal}`);

if (failed.length) {
  for (const result of failed) {
    console.error(`${result.name}: exited ${result.status}`);
  }
  process.exit(1);
}
