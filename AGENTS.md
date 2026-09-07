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

Never merge while Codex Review is pending. A newly pushed commit invalidates an earlier review until Codex reviews the new head. If repository rules cannot enforce the gate, this instruction remains mandatory and the missing GitHub setting must be reported to PAULIEWOOD.

GitHub Actions does not expose the review-thread `resolved` webhook as a workflow trigger. After resolving the final Codex thread, rerun the failed Codex Review Gate on the unchanged head and require it to pass before merge.
Where branch rules are supported, require both `Codex Review Gate` and `Codex Review Ready`; the latter turns pending when `@codex review` requests another same-head review.
