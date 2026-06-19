# Presidential Official Web

Private Next.js app repository for the official Presidential web rebuild.

## Purpose

This repository contains the production web application code only. Internal strategy documents, source PDFs, intelligence reports, threat research, Obsidian memory, and client-private artifacts stay outside this app repository.

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- `schema-dts` for type-safe JSON-LD
- Lighthouse CI health tooling
- Custom Presidential SEO QA harness

## Scripts

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run lhci:health
npm run seo:qa
```

## SEO Guardrails

- `https://presidentialmoonrocks.com` is the current canonical production origin until a formal site move is approved.
- Public SEO surfaces must not contain preview, staging, localhost, alternate-domain, or threat-domain URLs.
- Product schema is informational only unless explicit client/legal approval changes that.
- `sameAs` profile links are whitelist-only.
- Public copy must avoid accusation language, unsupported claims, medical/effect claims, direct-ordering/shipping/pricing/inventory language, and youth-coded language.

## Current State

This app is still in the SEO engineering foundation phase. Public route buildout, sitemap, robots, age gate, database/CMS, visual design, and deployment are not complete yet.
