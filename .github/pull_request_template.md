## Scope

- [ ] This PR contains one bounded change set.
- [ ] Unrelated user work is excluded.

## Verification

- [ ] Applicable local tests and builds pass.
- [ ] Vercel/CI checks reached a terminal result.
- [ ] Codex Review completed on the current head commit.
- [ ] Every valid Codex finding is fixed and every superseded/false-positive thread has evidence.
- [ ] No unresolved valid P1/P2 review thread remains.

## Merge gate

Do not merge merely because the PR exists. Merge only after checks are green, Codex Review has completed on the current head, valid findings are addressed, and the Codex Review Gate passes.

After resolving the final Codex thread, comment `@codex gate` on the unchanged head; GitHub Actions does not expose thread resolution as a workflow trigger.
Repository rules should require both `Codex Review Gate` and `Codex Review Ready`.
