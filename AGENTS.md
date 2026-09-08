<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


## Pull Request Review Gate

Creating a pull request is not permission to merge it.

Required order for every PR:

1. Open the PR.
2. Wait for tests, CI, and Vercel preview to reach terminal results.
3. Wait for Codex Review to complete on the current head commit.
4. Inspect every Codex thread against current code.
5. Fix every valid finding and resolve superseded or false-positive threads with concise evidence.
6. Re-run affected checks and Codex Review after any correction.
7. Merge only when required checks are green and no unresolved valid P1/P2 thread remains.
8. Verify the resulting main commit and production deployment.

Never merge while Codex Review is pending. A newly pushed commit invalidates an earlier review until Codex reviews the new head. This instruction remains mandatory until GitHub branch protection can require current-head review checks; report that missing paid-plan setting to PAULIEWOOD.
