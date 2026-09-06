# PW7404-0906-005 — Approved Orbit blueprint hero

Owner approval: September 6, 2026. PAULIEWOOD approved the revised TM film as perfect and asked for publication in the vape-page hero. His subsequent correction explicitly requires silent autoplay, infinite looping and no playback buttons over this film.

Scope: `/vapes` hero only. The earlier in-house film remains in the education section. `/moon-pods` and `/orbit` retain their existing hero artwork. No route, SEO, database or dependency settings changed.

Approved master: `J:\presidential-official\motion\0906-003-trademark-repair\v2\presidential-orbit-TM-v2-master.mkv`.

Web files under `public/media/vapes/film`:

- `orbit-blueprint-desktop-tm-v2.mp4`: 1920 × 1080, 7,088,881 bytes.
- `orbit-blueprint-mobile-tm-v2.mp4`: 1280 × 720, 3,212,591 bytes.
- `orbit-blueprint-poster-tm-v2.jpg`: the approved final frame, 179,873 bytes.

Both movies preserve all 361 frames at 24 fps (15.042 seconds). Full 16:9 framing retains the corrected TM and sign on desktop and mobile. The existing visibility and reduced-motion behavior is preserved. The blueprint variant renders zero buttons and no native video controls.

Verification: changed-file ESLint and TypeScript passed; production build passed with 95 generated outputs. Browser checked at desktop and 390 × 844: correct adaptive source, playing, muted, autoplay and loop enabled, no horizontal overflow, zero hero playback controls. Diff inspected for scope and original education-film preservation.

Existing repository checks are not green: broad lint reports 12 errors and one warning in unchanged pop-up, sales and about files; the legacy SEO harness reports the same 12 failures reproduced on clean production commit `6b0c155`; its standalone gate compiler has an existing alias-resolution failure in unchanged `concrete-routes.ts`. Production dependency audit reports four high-severity package advisories on the unchanged lockfile. These were recorded, not fixed or represented as passing inside this media release. The named Next.js 16.2.9 stack was preserved.

Design rule: obtain PAULIEWOOD's agreement before adding visible overlays or controls to approved creative. Do not expand a media placement into unrelated audits or redesign work.
