import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const usesShortSystemTemp = process.platform !== "win32";
const lhciTempDir = usesShortSystemTemp
  ? mkdtempSync(join(tmpdir(), "presidential-lhci-"))
  : join(projectRoot, ".lighthouseci", "tmp");

if (!usesShortSystemTemp) {
  mkdirSync(lhciTempDir, { recursive: true });
}

const lhciBin = join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "lhci.cmd" : "lhci",
);

let result;

try {
  result = spawnSync(lhciBin, ["autorun"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      TEMP: lhciTempDir,
      TMP: lhciTempDir,
      TMPDIR: lhciTempDir,
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  });
} finally {
  if (usesShortSystemTemp) {
    rmSync(lhciTempDir, { recursive: true, force: true });
  }
}

if (result?.error) {
  console.error(result.error);
}

process.exit(result?.status ?? 1);
