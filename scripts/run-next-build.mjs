import {
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { computeBuildInputFingerprint } from "./lib/build-input-fingerprint.mjs";

const projectRoot = process.cwd();
const nextRoot = join(projectRoot, ".next");
const lockPath = join(nextRoot, "lock");
const buildIdPath = join(nextRoot, "BUILD_ID");
const buildFingerprintPath = join(
  nextRoot,
  "presidential-build-fingerprint.json",
);
const nextBuildBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");

function commandHasActiveNextBuild(commandLine) {
  return /(?:node_modules[\\/]next[\\/]dist[\\/]bin[\\/]next(?:\.js)?|next\.cmd)["']?\s+build(?:\s|$)/i.test(
    commandLine,
  );
}

function hasActiveNextBuildProcess() {
  if (process.platform !== "win32") {
    return false;
  }

  const powershell = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      [
        "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\"",
        "| Select-Object -ExpandProperty CommandLine",
      ].join(" "),
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (powershell.status !== 0) {
    return false;
  }

  return powershell.stdout
    .split(/\r?\n/)
    .some((line) => commandHasActiveNextBuild(line));
}

function removeGeneratedBuildLock(stage) {
  if (!existsSync(lockPath)) {
    return;
  }

  if (hasActiveNextBuildProcess()) {
    console.error(
      `Refusing to remove .next lock during ${stage}; another Next build process appears active.`,
    );
    process.exit(1);
  }

  rmSync(lockPath, { force: true });
  console.log(`Removed stale generated .next lock before ${stage}.`);
}

removeGeneratedBuildLock("build");
rmSync(buildFingerprintPath, { force: true });

const inputFingerprint = computeBuildInputFingerprint(projectRoot);

const build = spawnSync(process.execPath, [nextBuildBin, "build"], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (build.status === 0) {
  removeGeneratedBuildLock("post-build cleanup");

  const postBuildFingerprint = computeBuildInputFingerprint(projectRoot);
  if (postBuildFingerprint.sha256 !== inputFingerprint.sha256) {
    console.error(
      "Build inputs changed while Next was building; refusing to write a current-build fingerprint.",
    );
    process.exit(1);
  }

  if (!existsSync(buildIdPath)) {
    console.error("Next build completed without a .next/BUILD_ID.");
    process.exit(1);
  }

  writeFileSync(
    buildFingerprintPath,
    `${JSON.stringify(
      {
        ...postBuildFingerprint,
        buildId: readFileSync(buildIdPath, "utf8").trim(),
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}

process.exit(build.status ?? 1);
