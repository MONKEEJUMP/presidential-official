import { spawnSync } from "node:child_process";

export const strictReleaseCommands = [
  "production:release-readiness:verify",
  "production:release-mode:verify",
  "lint",
  "typecheck",
  "build",
  "security:headers:verify",
  "security:headers:readiness",
  "security:environment:verify",
  "security:deployment:verify",
  "security:dependencies:verify",
  "security:public-surface:verify",
  "design:tokens:verify",
  "security:remote-images:verify",
  "security:third-party:verify",
  "security:browser-storage:verify",
  "security:outbound-links:verify",
  "security:contact-forms:verify",
  "security:contact-find-us:verify",
  "security:error-fallbacks:verify",
  "security:accessibility:verify",
  "security:performance-budget:verify",
  "cms:module-renderer:verify",
  "cms:web-read:verify",
  "cms:runtime-smoke:verify",
  "seo:gate-test",
  "production:env-contract:verify",
  "production:provider-readiness:verify",
  "production:canonical-host:verify",
  "db:live:strict-release",
  "production:postdeploy-smoke:verify",
  "production:sitemap-submission:verify",
  "production:live-action-boundary:verify",
  "production:measurement-rendering:verify",
  "production:lockfile-reproducibility:verify",
  "production:launch-readiness:verify",
];

function main() {
  const env = {
    ...process.env,
    PRESIDENTIAL_RELEASE_VERIFY_MODE: "strict-release",
  };

  for (const scriptName of strictReleaseCommands) {
    console.log(`\n[strict-release] npm run ${scriptName}`);
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(command, ["run", scriptName], {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
    });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

main();
