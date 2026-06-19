import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const lhciTempDir = join(projectRoot, ".lighthouseci", "tmp");
mkdirSync(lhciTempDir, { recursive: true });

const lhciBin = join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "lhci.cmd" : "lhci",
);

const result = spawnSync(lhciBin, ["autorun"], {
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

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
