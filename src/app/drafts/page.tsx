import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { CmsHomepageModuleRenderer } from "@/components/presidential";
import { readDraftHomepage } from "@/lib/cms/homepage-drafts";
import { readPublishedHomepage } from "@/lib/cms";
import type { SanityHomepageModule, SanitySitePageRecord } from "@/lib/cms";
import { listDraftSitePageSlugs, readDraftSitePage } from "@/lib/cms/site-page-drafts";
import { buildStaticRouteMetadata, getStaticRouteRecord } from "@/lib/seo/route-page";

import { readContactLocatorReadiness, type ContactLocatorReadiness } from "./contact-locator-readiness";
import { draftHomepageFixture } from "./homepage-fixture";
import { readProductMediaWorklist, type ProductMediaWorklist } from "./product-media-worklist";
import { draftSitePageFixtures } from "./site-page-fixtures";

const ROUTE_PATH = "/drafts" as const;
const PRIVATE_DRAFTS_ROUTE_ENABLE_ENV = "PRESIDENTIAL_PRIVATE_DRAFTS_ROUTE_ENABLED";
const draftReviewRoutes = listDraftSitePageSlugs().filter((slug) => slug !== "home");

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return buildStaticRouteMetadata(ROUTE_PATH);
}

function isPrivateDraftsRouteEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env[PRIVATE_DRAFTS_ROUTE_ENABLE_ENV] === "true";
}

function StatusPill({ children, tone }: { readonly children: ReactNode; readonly tone: "ok" | "wait" | "stop" }) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
      : tone === "wait"
        ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
        : "border-red-300/50 bg-red-300/15 text-red-100";

  return (
    <span className={`inline-flex border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${toneClass}`}>
      {children}
    </span>
  );
}

type DraftRouteBoardItem = {
  readonly slug: string;
  readonly record: SanitySitePageRecord;
  readonly recordSource: "Live Sanity draft" | "CMS-shaped fixture";
  readonly modules: readonly SanityHomepageModule[];
  readonly productMedia: ProductMediaWorklist;
  readonly contactLocator: ContactLocatorReadiness;
};

const PUBLIC_ROUTE_PHASE = "approved_public";
const PUBLIC_MODULE_ELIGIBILITY = "ready_for_implementation_candidate";

function uniqueValues(values: readonly (string | undefined)[]): readonly string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function moduleFamilies(modules: readonly SanityHomepageModule[]): string {
  const families = uniqueValues(modules.map((module) => module._type));

  return families.length ? families.join(", ") : "none";
}

function routeReadinessTone(item: DraftRouteBoardItem): "ok" | "wait" | "stop" {
  if (!item.modules.length) {
    return "stop";
  }

  if (item.record.routePhase === PUBLIC_ROUTE_PHASE) {
    return "ok";
  }

  return "wait";
}

function countReadyModules(modules: readonly SanityHomepageModule[]): number {
  return modules.filter((module) => module.moduleControl?.renderEligibility === PUBLIC_MODULE_ELIGIBILITY).length;
}

function getProductMediaLabel(worklist: ProductMediaWorklist): string {
  if (worklist.status === "not_product_platform") {
    return "not product route";
  }

  if (worklist.status === "missing_summary") {
    return "missing summary";
  }

  const candidateCount = worklist.platform
    ? worklist.summaries.reviewPackets?.counts?.byPlatform?.[worklist.platform] || 0
    : 0;
  const gapLabel = worklist.directMediaGap ? "gap" : "no direct gap";

  return `${worklist.platform}: ${candidateCount} candidates, ${gapLabel}`;
}

function getContactLocatorLabel(readiness: ContactLocatorReadiness): string {
  if (readiness.status === "not_contact_locator") {
    return "not contact/locator";
  }

  if (readiness.status === "missing_summary") {
    return "missing summary";
  }

  if (readiness.kind === "locator") {
    return `${readiness.summaries.retailerWorkflow?.retailer_rows_read || 0} retailer rows, import ready ${String(readiness.summaries.dryRunImport?.import_ready ?? false)}`;
  }

  return `form approved ${String(readiness.summaries.contactSubmission?.contactFormApproved ?? false)}, submissions ${String(readiness.summaries.contactSubmission?.formSubmissionApproved ?? false)}`;
}

function getNextCue(item: DraftRouteBoardItem): string {
  if (item.productMedia.status === "available" && item.productMedia.directMediaGap) {
    return item.productMedia.directMediaGap.gapType || "Resolve direct product media gap.";
  }

  if (item.productMedia.status === "available" && item.productMedia.directionItems.length) {
    return `${item.productMedia.directionItems.length} Moon Rocks family direction items need review.`;
  }

  if (item.contactLocator.kind === "locator" && item.contactLocator.status === "available") {
    return "Retailer locator remains candidate-only until verification/import/public gates are approved.";
  }

  if (item.contactLocator.kind === "contact" && item.contactLocator.status === "available") {
    return "Contact remains shell-only until official contact/form/submission approvals exist.";
  }

  if (item.slug === "learn") {
    return "Review guide cards, source proof, and article readiness.";
  }

  if (item.recordSource !== "Live Sanity draft") {
    return "Create or enable live Sanity draft record for this route.";
  }

  return "Review modules, source proof, and promotion eligibility.";
}

function DraftRouteBoard({ items }: { readonly items: readonly DraftRouteBoardItem[] }) {
  const liveCount = items.filter((item) => item.recordSource === "Live Sanity draft").length;
  const productRouteCount = items.filter((item) => item.productMedia.status !== "not_product_platform").length;
  const contactLocatorCount = items.filter((item) => item.contactLocator.status !== "not_contact_locator").length;
  const totalModules = items.reduce((sum, item) => sum + item.modules.length, 0);

  return (
    <section className="grid gap-5" aria-labelledby="draft-route-control-board-title">
      <div className="grid gap-3">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
          Route control board
        </p>
        <h2 className="text-3xl font-semibold leading-tight" id="draft-route-control-board-title">
          Top-level draft route readiness
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-zinc-300">
          Private editor board for deciding what to review next. This board reads draft route shape and local readiness summaries only.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-white/15 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">Routes</p>
          <p className="mt-2 text-2xl font-semibold">{items.length}</p>
        </div>
        <div className="border border-white/15 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">Live draft reads</p>
          <p className="mt-2 text-2xl font-semibold">{liveCount}</p>
        </div>
        <div className="border border-white/15 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">Modules</p>
          <p className="mt-2 text-2xl font-semibold">{totalModules}</p>
        </div>
        <div className="border border-white/15 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">Special queues</p>
          <p className="mt-2 text-2xl font-semibold">{productRouteCount + contactLocatorCount}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => {
          const readyModules = countReadyModules(item.modules);
          const routeTone = routeReadinessTone(item);

          return (
            <article className="grid gap-4 border border-white/15 bg-white/5 p-5" key={item.slug}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-2">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={routeTone}>{item.record.routePhase || "missing phase"}</StatusPill>
                    <StatusPill tone={item.recordSource === "Live Sanity draft" ? "ok" : "wait"}>{item.recordSource}</StatusPill>
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight">{item.record.title || item.slug}</h3>
                  <p className="max-w-4xl text-sm leading-6 text-zinc-300">{item.record.summary || "No summary provided."}</p>
                </div>
                <Link
                  className="border border-emerald-300/50 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
                  href={`/drafts/${item.slug}`}
                >
                  Open draft route
                </Link>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="border border-white/15 bg-zinc-950/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">Modules</p>
                  <p className="mt-2 text-xl font-semibold">{item.modules.length} total / {readyModules} ready</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{moduleFamilies(item.modules)}</p>
                </div>
                <div className="border border-white/15 bg-zinc-950/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">Product/media</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-100">{getProductMediaLabel(item.productMedia)}</p>
                </div>
                <div className="border border-white/15 bg-zinc-950/35 p-4">
                  <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">Contact/locator</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-100">{getContactLocatorLabel(item.contactLocator)}</p>
                </div>
              </div>

              <div className="border border-amber-300/30 bg-amber-300/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-100">Next cue</p>
                <p className="mt-2 text-sm leading-6 text-amber-50">{getNextCue(item)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default async function DraftsPage() {
  if (!isPrivateDraftsRouteEnabled()) {
    notFound();
  }

  const route = getStaticRouteRecord(ROUTE_PATH);
  const routeReads = await Promise.all(
    draftReviewRoutes.map(async (slug) => {
      const page = await readDraftSitePage(slug, {
        next: { tags: [`sanity-draft-site-page-${slug}`] },
      });
      const record = page.ok && page.result ? page.result : draftSitePageFixtures[slug];

      return {
        slug,
        record,
        recordSource: page.ok && page.result ? "Live Sanity draft" : "CMS-shaped fixture",
        modules: record.modules || [],
        productMedia: readProductMediaWorklist(slug),
        contactLocator: readContactLocatorReadiness(slug),
      } satisfies DraftRouteBoardItem;
    }),
  );
  const draftHomepage = await readDraftHomepage({ next: { tags: ["sanity-draft-homepage"] } });
  const homepage = draftHomepage.ok
    ? null
    : await readPublishedHomepage({ next: { tags: ["sanity-homepage"] } });

  const renderedHomepage = draftHomepage.ok && draftHomepage.result
    ? draftHomepage.result
    : homepage?.ok && homepage.result
      ? homepage.result
      : draftHomepageFixture;
  const homepageSource = draftHomepage.ok && draftHomepage.result
    ? "Draft"
    : homepage?.ok && homepage.result
      ? "Published"
      : "Fixture";
  const isUsingFixture = homepageSource === "Fixture";
  const moduleCount = renderedHomepage.modules?.length ?? 0;
  const standbyMessage = draftHomepage.ok
    ? "No draft homepage record is available yet."
    : draftHomepage.skipped
      ? draftHomepage.reason === "missing_draft_read_token"
        ? "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED is on, but SANITY_AUTH_TOKEN is not available to the web app."
        : "PRESIDENTIAL_SANITY_DRAFT_READ_ENABLED is not enabled; draft reads remain off by default."
      : `Sanity draft read returned ${draftHomepage.status} ${draftHomepage.statusText}.`;
  const publishedStandbyMessage = homepage
    ? homepage.ok
      ? "No published homepage record is available yet."
      : homepage.skipped
        ? "PRESIDENTIAL_SANITY_READ_CLIENT_ENABLED is not enabled; published CMS reads remain off by default."
        : `Published Sanity read returned ${homepage.status} ${homepage.statusText}.`
    : "Published read skipped because the draft homepage record was found.";
  const cmsReadTone = draftHomepage.ok || homepage?.ok
    ? "ok"
    : draftHomepage.skipped || homepage?.skipped
      ? "wait"
      : "stop";
  const cmsReadLabel = draftHomepage.ok
    ? "Draft read active"
    : homepage?.ok
      ? "Published read active"
      : draftHomepage.skipped || homepage?.skipped
        ? "CMS read disabled"
        : "CMS read failed";

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="grid gap-5 border-b border-white/15 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone="wait">Private route</StatusPill>
            <StatusPill tone={cmsReadTone}>
              {cmsReadLabel}
            </StatusPill>
          </div>
          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
              Presidential CMS bridge
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              {route.h1}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-zinc-300">
              Internal Sanity read surface for checking the homepage content path
              before public rendering is connected.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="CMS bridge status">
          <div className="border border-white/15 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Route
            </p>
            <p className="mt-3 text-xl font-semibold">{route.path}</p>
          </div>
          <div className="border border-white/15 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Homepage record
            </p>
            <p className="mt-3 text-xl font-semibold">
              {homepageSource}
            </p>
          </div>
          <div className="border border-white/15 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Modules
            </p>
            <p className="mt-3 text-xl font-semibold">{moduleCount}</p>
          </div>
        </section>

        <section className="grid gap-4" aria-label="Top-level CMS draft pages">
          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
              Top-level draft pages
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {draftReviewRoutes.map((slug) => (
                <Link
                  className="border border-white/15 bg-white/5 p-4 text-sm font-semibold text-white transition hover:border-emerald-300/60 hover:bg-emerald-300/10"
                  href={`/drafts/${slug}`}
                  key={slug}
                >
                  {slug.replaceAll("-", " ")}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <DraftRouteBoard items={routeReads} />

        <section className="grid gap-4" aria-label="Homepage modules from Sanity shape">
          {isUsingFixture ? (
            <div className="border border-amber-300/30 bg-amber-300/10 p-5">
              <p className="text-sm font-semibold text-amber-100">
                Rendering CMS-shaped fixture data until the Sanity homepage record exists.
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{standbyMessage}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{publishedStandbyMessage}</p>
            </div>
          ) : null}
          <div className="border border-emerald-300/30 bg-emerald-300/10 p-5">
            <p className="text-sm font-semibold text-emerald-100">
              {renderedHomepage.title || "Homepage"}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {renderedHomepage.summary || "No summary provided."}
            </p>
          </div>
          <CmsHomepageModuleRenderer modules={renderedHomepage.modules || []} renderMode="private" />
        </section>
      </div>
    </main>
  );
}
