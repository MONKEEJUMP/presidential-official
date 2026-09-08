# Website GitHub Review-Debt Audit and Repair

Date: 2026-09-07
Repository: `MONKEEJUMP/presidential-official`
Audit basis: all unresolved Codex review threads recalculated from GitHub against current `main`.

## Result

- Threads audited: 26
- Valid/current P1-P2 findings repaired: 20
- Already fixed/superseded findings: 6
- False positives: 0
- Review findings left unresolved in this branch: 0

## Thread audit

| PR | Priority | Finding | Current evidence and disposition |
|---:|:---:|---|---|
| 48 | P2 | Vapes `pageshow` reset ignored the current hash | Valid; reset now rechecks `window.location.hash`. |
| 47 | P2 | Sales day boundaries used the business zone instead of the device zone | Valid; the validated device zone now travels through the snapshot and shared date-key formatter. |
| 47 | P2 | Closing history could release a log claim | Valid; claim release is limited to active log mode. |
| 46 | P2 | Education film lost playback controls | Valid; education retains controls while blueprint film remains control-free. |
| 44 | P2 | Vapes hero caption was missing | Valid; caption restored. |
| 43 | P1 | Public Vapes video payload exceeded budget | Valid; six films recompressed from about 27.8 MB to 8.65 MB total and inspected. |
| 42 | P1 | Moon Pods and Orbit dropped approved CMS modules | Valid; showroom shell now composes approved CMS modules. |
| 42 | P2 | 96-image archive rendered before use | Valid; archive mounts only after first open. |
| 41 | P2 | Corrupted showroom asset | Superseded; cited component/file is gone and the current LRE showroom asset was visually clean. |
| 39 | P2 | Cannabis meta description exceeded the snippet budget | Valid; description is 140 characters. |
| 35 | P1 | Unapproved September CTR copy inherited an August approval | Valid; title/description reverted to the previously approved wording. |
| 34 | P2 | About-page H1 overflowed narrow screens | Valid; narrow responsive clamp added. |
| 33 | P1 | Unapproved external sources were published as links | Valid; independent sources remain visible as text while their links fail closed. |
| 33 | P2 | CMS Our Story branch omitted authority sources | Valid; authority module is shared by repository and CMS branches. |
| 29 | P2 | New York display font applied to the whole phrase | Valid; subset font wraps only “New York.” |
| 28 | P2 | Hero image lacked eager loading | Superseded; current image already uses eager loading and fetch priority. |
| 28 | P2 | Poster failure prevented video playback | Valid; poster error now releases video mounting. |
| 24 | P2 | Private sales route inherited public robots behavior | Superseded; `/sales` already has explicit noindex behavior and no global leak. |
| 21 | P1 | Runtime H1 override diverged from route truth | Superseded; current slug override and route-owned H1 are aligned. |
| 20 | P2 | Pre-roll description was 179 characters | Valid; description is 143 characters. |
| 19 | P2 | THC Design description was too long | Superseded; current description is 139 characters. |
| 16 | P2 | Blunts description was 193 characters | Valid; description is 152 characters. |
| 11 | P1 | Default social image was not registered/approved | Valid; metadata now uses the approved Presidential banner. |
| 7 | P2 | Global Escape handler could steal focus | Valid; it runs only while navigation is open. |
| 2 | P2 | Homepage described only one Moon Rock finish | Valid; package-identified kief or diamonds finishes are represented. |
| 1 | P1 | Organization `sameAs` lacked owner approval | Superseded by the exact owner-confirmed September 2 whitelist. |

## Additional code-review repairs

- The merge gate now paginates reviews and threads, rejects pending/dismissed reviews, and has three state-transition tests.
- The heavy Vapes explorer JavaScript is dynamically loaded near the viewport.
- CMS smoke fixtures use one direct runtime seam instead of competing preload/global mechanisms.
- Shared authority content and approved-profile truth each have one source.
- Sales date formatting reuses one formatter per active zone.

## Verification

- ESLint: pass
- TypeScript: pass
- Production Next.js build: pass
- Focused review-debt regression: 21/21 pass
- CMS public/private runtime smoke: 810/810 pass
- Outbound/publication gate: pass
- Merge-gate fixtures: 5/5 pass
- Accessibility: 188/192 pass; the four remaining checks are the pre-existing legal/owner age-gate decision.
- Performance: affected Vapes/video budgets pass; 16 pre-existing broad site/static/public-asset budgets remain above target.
- Legacy SEO foundation gate: 68 pass, 11 fail, 4 pending, 6 human/legal. Its remaining failures are pre-existing publication/age-gate/claim doctrine, including wording PAULIEWOOD expressly authorized; they are not new regressions from this repair.

## Operational validation

After merge, verify the production home, Moon Pods, Orbit, Our Story, Learn, sales, and Vapes routes; watch Vercel build/runtime logs for route errors, Sanity timeouts, media playback failures, and sales API failures. Roll back the merge if a repaired route returns an error, CMS fallback breaks, or sales claim/date behavior regresses.
