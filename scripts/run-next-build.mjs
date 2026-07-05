import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const lockPath = join(projectRoot, ".next", "lock");
const nextBuildBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");

function commandHasActiveNextBuild(commandLine) {
  return /\bnext\b/i.test(commandLine) && /\bbuild\b/i.test(commandLine);
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

const build = spawnSync(process.execPath, [nextBuildBin, "build"], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (build.status === 0) {
  removeGeneratedBuildLock("post-build cleanup");
}

process.exit(build.status ?? 1);
