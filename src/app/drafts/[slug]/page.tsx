import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CmsHomepageModuleRenderer,
  PageFrame,
  Scene,
  SceneStack,
} from "@/components/presidential";
import type { SanityAssetRecord, SanityHomepageModule, SanitySitePageRecord } from "@/lib/cms";
import { hasAuthenticatedPrivateDraftRouteAccess } from "@/lib/cms/draft-route-access";
import {
  isDraftSitePageSlug,
  listDraftSitePageSlugs,
  readDraftSitePage,
} from "@/lib/cms/site-page-drafts";

import {readContactLocatorReadiness, type ContactLocatorReadiness} from "../contact-locator-readiness";
import {readProductMediaWorklist, type ProductMediaWorklist} from "../product-media-worklist";
import { draftSitePageFixtures } from "../site-page-fixtures";

type DraftSitePageProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

const PUBLIC_ROUTE_PHASE = "approved_public";
const PUBLIC_MODULE_ELIGIBILITY = "approved_public";
const MODULE_TYPES_EXPECTING_ASSETS = new Set([
  "heroBlock",
  "productPlatformBlock",
  "productFormatBlock",
  "productRailBlock",
  "mediaGalleryBlock",
  "assetProofBlock",
  "storyProofBlock",
]);
const PRODUCT_ROUTE_SLUGS = new Set(["moon-rocks", "moon-pods", "orbit"]);
const SUPPORT_ROUTE_SLUGS = new Set(["contact", "find-us"]);

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return listDraftSitePageSlugs()
    .filter((slug) => slug !== "home")
    .map((slug) => ({slug}));
}

export async function generateMetadata({params}: DraftSitePageProps): Promise<Metadata> {
  const {slug} = await params;
  return {
    title: `Draft Preview: ${slug} | Presidential CMS`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

function uniqueValues(values: readonly (string | undefined)[]): readonly string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function countMatchingModules(
  modules: readonly SanityHomepageModule[],
  predicate: (module: SanityHomepageModule) => boolean,
): number {
  return modules.reduce((count, module) => count + (predicate(module) ? 1 : 0), 0);
}

type DraftAssetEntry = {
  readonly asset: SanityAssetRecord;
  readonly moduleKey: string;
  readonly moduleType: string;
};

function moduleLabel(module: SanityHomepageModule): string {
  return module.moduleControl?.internalLabel || module._key || module._type || "Untitled module";
}

function moduleExpectsAssets(module: SanityHomepageModule): boolean {
  return Boolean(module._type && MODULE_TYPES_EXPECTING_ASSETS.has(module._type));
}

function collectModuleAssets(module: SanityHomepageModule): readonly SanityAssetRecord[] {
  return [
    module.heroAssetRecord,
    module.assetRecord,
    ...(module.assetRecords || []),
    ...(module.assetRecordRefs || []),
    ...(module.cards || []).map((card) => card.assetRecord),
  ].filter((asset): asset is SanityAssetRecord => Boolean(asset));
}

function collectDraftAssets(modules: readonly SanityHomepageModule[]): readonly DraftAssetEntry[] {
  return modules.flatMap((module) =>
    collectModuleAssets(module).map((asset) => ({
      asset,
      moduleKey: moduleLabel(module),
      moduleType: module._type || "unknown_module",
    })),
  );
}

function uniqueAssets(entries: readonly DraftAssetEntry[]): readonly DraftAssetEntry[] {
  const seen = new Set<string>();
  const unique: DraftAssetEntry[] = [];

  for (const entry of entries) {
    const key = entry.asset._id || entry.asset.savedFile || entry.asset.title || entry.asset.assetName || `${entry.moduleKey}-${unique.length}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(entry);
    }
  }

  return unique;
}

function assetStatusTone(value?: string): "ok" | "wait" | "stop" | "neutral" {
  if (!value) {
    return "neutral";
  }

  return /approved|ready/i.test(value)
    ? "ok"
    : /blocked|do_not|no_public|missing|rejected/i.test(value)
      ? "stop"
      : "wait";
}

function getPromotionBlockers(
  record: SanitySitePageRecord,
  modules: readonly SanityHomepageModule[],
  recordSource: string,
): readonly string[] {
  const blockers: string[] = [];
  const routePhase = record.routePhase || "missing_route_phase";
  const readyModuleCount = countMatchingModules(
    modules,
    (module) => module.moduleControl?.renderEligibility === PUBLIC_MODULE_ELIGIBILITY,
  );
  const draftOnlyModuleCount = countMatchingModules(
    modules,
    (module) => module.moduleControl?.renderEligibility !== PUBLIC_MODULE_ELIGIBILITY,
  );

  if (recordSource !== "Live Sanity draft") {
    blockers.push("Live Sanity draft data is not active for this preview request.");
  }

  if (routePhase !== PUBLIC_ROUTE_PHASE) {
    blockers.push(`Route phase is ${routePhase}.`);
  }

  if (!modules.length) {
    blockers.push("No modules are attached to this page.");
  }

  if (draftOnlyModuleCount > 0) {
    blockers.push(`${draftOnlyModuleCount} module(s) are still draft/internal preview only.`);
  }

  if (readyModuleCount === 0) {
    blockers.push("No modules are approved for public rendering.");
  }

  if (modules.some((module) => module._type?.includes("asset") || module.assetRecord || module.assetRecords?.length || module.assetRecordRefs?.length)) {
    blockers.push("Asset/media evidence still needs source, rights, and client review before promotion.");
  }

  return blockers.length ? blockers : ["No preview blockers were detected by this surface."];
}

function ReadinessMetric({
  label,
  value,
  tone = "neutral",
}: {
  readonly label: string;
  readonly value: string | number;
  readonly tone?: "ok" | "wait" | "stop" | "neutral";
}) {
  const toneClass = tone === "ok"
    ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
    : tone === "wait"
      ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
      : tone === "stop"
        ? "border-red-300/40 bg-red-300/10 text-red-100"
        : "border-white/15 bg-white/10 text-zinc-100";

  return (
    <div className={`border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-normal opacity-80">{label}</p>
      <p className="mt-2 text-lg font-semibold leading-tight">{value}</p>
    </div>
  );
}

function DraftRouteReadiness({
  modules,
  record,
  recordSource,
}: {
  readonly modules: readonly SanityHomepageModule[];
  readonly record: SanitySitePageRecord;
  readonly recordSource: string;
}) {
  const routePhase = record.routePhase || "missing_route_phase";
  const moduleTypes = uniqueValues(modules.map((module) => module._type));
  const moduleEligibilities = uniqueValues(modules.map((module) => module.moduleControl?.renderEligibility));
  const readyModuleCount = countMatchingModules(
    modules,
    (module) => module.moduleControl?.renderEligibility === PUBLIC_MODULE_ELIGIBILITY,
  );
  const blockers = getPromotionBlockers(record, modules, recordSource);

  return (
    <section aria-labelledby="draft-route-readiness-title" className="border border-white/15 bg-white/5 p-5">
      <div className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
            Route readiness
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white" id="draft-route-readiness-title">
            Internal promotion status
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessMetric label="Route phase" tone={routePhase === PUBLIC_ROUTE_PHASE ? "ok" : "wait"} value={routePhase} />
          <ReadinessMetric label="Source" tone={recordSource === "Live Sanity draft" ? "ok" : "wait"} value={recordSource} />
          <ReadinessMetric label="Modules" tone={modules.length ? "ok" : "stop"} value={modules.length} />
          <ReadinessMetric label="Ready modules" tone={readyModuleCount ? "ok" : "wait"} value={readyModuleCount} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.55fr)]">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Module families
            </p>
            <div className="flex flex-wrap gap-2">
              {(moduleTypes.length ? moduleTypes : ["none"]).map((type) => (
                <span className="border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-zinc-100" key={type}>
                  {type}
                </span>
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Eligibility states
            </p>
            <div className="flex flex-wrap gap-2">
              {(moduleEligibilities.length ? moduleEligibilities : ["missing"]).map((state) => (
                <span className="border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-zinc-100" key={state}>
                  {state}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Promotion blockers
            </p>
            <ul className="grid gap-2">
              {blockers.map((blocker) => (
                <li className="border border-white/15 bg-zinc-950/40 px-3 py-2 text-sm leading-6 text-zinc-200" key={blocker}>
                  {blocker}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function DraftAssetReadiness({ modules }: { readonly modules: readonly SanityHomepageModule[] }) {
  const assetEntries = uniqueAssets(collectDraftAssets(modules));
  const assetBearingModuleCount = countMatchingModules(modules, (module) => collectModuleAssets(module).length > 0);
  const modulesExpectingAssets = modules.filter(moduleExpectsAssets);
  const modulesMissingAssets = modulesExpectingAssets.filter((module) => collectModuleAssets(module).length === 0);
  const approvalStates = uniqueValues(assetEntries.map((entry) => entry.asset.approvalStatus));
  const provenanceStates = uniqueValues(assetEntries.map((entry) => entry.asset.provenanceStatus));

  return (
    <section aria-labelledby="draft-asset-readiness-title" className="border border-white/15 bg-zinc-950/40 p-5">
      <div className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
            Asset readiness
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white" id="draft-asset-readiness-title">
            Private media mapping status
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessMetric label="Attached assets" tone={assetEntries.length ? "ok" : "wait"} value={assetEntries.length} />
          <ReadinessMetric label="Asset modules" tone={assetBearingModuleCount ? "ok" : "wait"} value={assetBearingModuleCount} />
          <ReadinessMetric label="Expected media modules" tone={modulesExpectingAssets.length ? "neutral" : "wait"} value={modulesExpectingAssets.length} />
          <ReadinessMetric label="Missing media modules" tone={modulesMissingAssets.length ? "wait" : "ok"} value={modulesMissingAssets.length} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.55fr)]">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Attached asset records
            </p>
            {assetEntries.length ? (
              <div className="grid gap-3">
                {assetEntries.map((entry) => {
                  const assetTitle = entry.asset.title || entry.asset.assetName || entry.asset.savedFile || "Untitled asset";

                  return (
                    <article className="grid gap-3 border border-white/15 bg-white/5 p-4" key={entry.asset._id || `${entry.moduleKey}-${assetTitle}`}>
                      <div className="flex flex-wrap gap-2">
                        <span className="border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-zinc-100">
                          {entry.moduleType}
                        </span>
                        {entry.asset.approvalStatus ? (
                          <ReadinessMetric label="Approval" tone={assetStatusTone(entry.asset.approvalStatus)} value={entry.asset.approvalStatus} />
                        ) : null}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{assetTitle}</h3>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">Module: {entry.moduleKey}</p>
                        {entry.asset.savedFile ? (
                          <p className="mt-2 break-words text-xs leading-5 text-zinc-300">{entry.asset.savedFile}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.asset.sourceSystem ? (
                          <span className="border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-zinc-100">
                            {entry.asset.sourceSystem}
                          </span>
                        ) : null}
                        {entry.asset.provenanceStatus ? (
                          <span className="border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-amber-100">
                            {entry.asset.provenanceStatus}
                          </span>
                        ) : null}
                      </div>
                      {entry.asset.pageUsage?.length ? (
                        <p className="text-xs leading-5 text-zinc-400">{entry.asset.pageUsage.join(", ")}</p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="border border-amber-300/40 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                No asset records are attached to this draft route yet.
              </p>
            )}
          </div>
          <div className="grid content-start gap-4">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
                Approval states
              </p>
              <div className="flex flex-wrap gap-2">
                {(approvalStates.length ? approvalStates : ["missing"]).map((state) => (
                  <span className="border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-zinc-100" key={state}>
                    {state}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
                Provenance states
              </p>
              <div className="flex flex-wrap gap-2">
                {(provenanceStates.length ? provenanceStates : ["missing"]).map((state) => (
                  <span className="border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-normal text-zinc-100" key={state}>
                    {state}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
                Missing media modules
              </p>
              <ul className="grid gap-2">
                {(modulesMissingAssets.length ? modulesMissingAssets : []).map((module) => (
                  <li className="border border-white/15 bg-white/5 px-3 py-2 text-sm leading-6 text-zinc-200" key={module._key || moduleLabel(module)}>
                    {moduleLabel(module)} ({module._type || "unknown"})
                  </li>
                ))}
                {!modulesMissingAssets.length ? (
                  <li className="border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-sm leading-6 text-emerald-100">
                    Every media-expected module has at least one attached asset record.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function splitRequestedAssets(value?: string): readonly string[] {
  return value?.split(";").map((item) => item.trim()).filter(Boolean) || [];
}

function topCountEntries(counts?: Record<string, number | undefined>, limit = 5): readonly [string, number][] {
  return Object.entries(counts || {})
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function DraftProductMediaWorklist({
  worklist,
}: {
  readonly worklist: ProductMediaWorklist;
}) {
  if (worklist.status === "not_product_platform") {
    return null;
  }

  const {approvalWorklist, reviewPackets, assetBridge} = worklist.summaries;
  const clientDirection = worklist.summaries.clientDirection;
  const byPlatform = reviewPackets?.counts?.byPlatform || {};
  const platformCandidates = worklist.platform ? byPlatform[worklist.platform] || 0 : 0;
  const requestedAssets = splitRequestedAssets(worklist.directMediaGap?.requestedAssets);
  const topLanes = topCountEntries(clientDirection?.laneCounts);
  const directionRows = worklist.directionItems.slice(0, 6);

  if (worklist.status === "missing_summary") {
    return (
      <section aria-labelledby="draft-product-media-worklist-title" className="border border-red-300/40 bg-red-300/10 p-5">
        <div className="grid gap-3">
          <p className="text-sm font-semibold uppercase tracking-normal text-red-100">
            Product/media worklist
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white" id="draft-product-media-worklist-title">
            Missing local summary artifact
          </h2>
          <p className="text-sm leading-6 text-red-100">
            This private draft route expects the product/media worklist summaries before media decisions can be reviewed here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="draft-product-media-worklist-title" className="border border-white/15 bg-zinc-950/40 p-5">
      <div className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
            Product/media worklist
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white" id="draft-product-media-worklist-title">
            Private candidate media status
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            This panel reads the internal product/media worklist summaries only. It does not approve assets, patch Sanity product refs,
            or authorize public rendering.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessMetric label="Platform" tone="neutral" value={worklist.platform || "missing"} />
          <ReadinessMetric label="Shortlist rows" tone={platformCandidates ? "ok" : "wait"} value={platformCandidates} />
          <ReadinessMetric label="Catalog route items" tone={worklist.routeCatalogItems.length ? "ok" : "wait"} value={worklist.routeCatalogItems.length} />
          <ReadinessMetric label="Direct media gap" tone={worklist.directMediaGap ? "wait" : "ok"} value={worklist.directMediaGap ? "yes" : "no"} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessMetric label="Locked media candidates" tone={approvalWorklist?.counts?.lockedMediaCandidates ? "wait" : "neutral"} value={approvalWorklist?.counts?.lockedMediaCandidates || 0} />
          <ReadinessMetric label="Pending client approval" tone={approvalWorklist?.queueCounts?.mediaPendingClientApproval ? "wait" : "neutral"} value={approvalWorklist?.queueCounts?.mediaPendingClientApproval || 0} />
          <ReadinessMetric label="Missing direct media" tone={approvalWorklist?.queueCounts?.variantMissingDirectMediaCandidate ? "wait" : "ok"} value={approvalWorklist?.queueCounts?.variantMissingDirectMediaCandidate || 0} />
          <ReadinessMetric label="Candidate universe" tone={assetBridge?.totals?.nonDedupedCandidateMediaUniverse ? "wait" : "neutral"} value={assetBridge?.totals?.nonDedupedCandidateMediaUniverse || 0} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessMetric label="Direction items" tone={clientDirection?.counts?.items ? "wait" : "neutral"} value={clientDirection?.counts?.items || 0} />
          <ReadinessMetric label="P1 direction items" tone={clientDirection?.countsByPriority?.P1 ? "wait" : "neutral"} value={clientDirection?.countsByPriority?.P1 || 0} />
          <ReadinessMetric label="Product truth lane" tone={clientDirection?.laneCounts?.client_product_truth ? "wait" : "neutral"} value={clientDirection?.laneCounts?.client_product_truth || 0} />
          <ReadinessMetric label="Legal copy lane" tone={clientDirection?.laneCounts?.legal_claim_text_review ? "wait" : "neutral"} value={clientDirection?.laneCounts?.legal_claim_text_review || 0} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.55fr)]">
          <div className="grid gap-4">
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
                Public boundary
              </p>
              <div className="grid gap-2">
                {[
                  `Packet boundary: ${reviewPackets?.boundaries?.packetBoundary || approvalWorklist?.packetBoundary || "missing"}`,
                  `Approved assets: ${String(reviewPackets?.boundaries?.approvedAssets ?? approvalWorklist?.approvedAssets ?? false)}`,
                  `Public use authorized: ${String(reviewPackets?.boundaries?.publicUseAuthorized ?? approvalWorklist?.publicUseAuthorized ?? false)}`,
                  `Public unlock: ${reviewPackets?.boundaries?.publicUnlock || approvalWorklist?.publicUnlock || "none"}`,
                  `Media promotion: ${reviewPackets?.boundaries?.mediaPromotion || "none"}`,
                  `Product refs patch: ${reviewPackets?.boundaries?.productRefsPatch || "none"}`,
                ].map((item) => (
                  <span className="border border-white/15 bg-white/5 px-3 py-2 text-sm leading-6 text-zinc-200" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {worklist.routeCatalogItems.length ? (
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
                  Route catalog candidates
                </p>
                <div className="grid gap-2">
                  {worklist.routeCatalogItems.map((item, index) => (
                    <article className="border border-white/15 bg-white/5 p-3" key={`${item.productName || item.title || "item"}-${index}`}>
                      <h3 className="text-sm font-semibold text-white">{item.productName || item.title || "Untitled product candidate"}</h3>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {item.routeCandidate || "missing route"} · {item.publicUseStatus || "missing status"}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {topLanes.length ? (
              <div className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
                  Client direction lanes
                </p>
                <div className="grid gap-2">
                  {topLanes.map(([lane, count]) => (
                    <span className="border border-white/15 bg-white/5 px-3 py-2 text-sm leading-6 text-zinc-200" key={lane}>
                      {lane}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid content-start gap-4">
            {worklist.directMediaGap ? (
              <div className="grid gap-3 border border-amber-300/40 bg-amber-300/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-normal text-amber-100">
                  Direct media gap
                </p>
                <h3 className="text-lg font-semibold text-white">{worklist.directMediaGap.platform || worklist.platform}</h3>
                <p className="text-sm leading-6 text-amber-100">
                  {worklist.directMediaGap.gapType || "direct media missing"} · {worklist.directMediaGap.routeScope || "review blocked"}
                </p>
                <ul className="grid gap-2">
                  {requestedAssets.map((asset) => (
                    <li className="border border-amber-300/30 bg-zinc-950/30 px-3 py-2 text-sm leading-6 text-amber-50" key={asset}>
                      {asset}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="border border-emerald-300/40 bg-emerald-300/10 p-4">
                <p className="text-sm leading-6 text-emerald-100">
                  No direct product-media gap is listed for this platform in the current worklist packet.
                </p>
              </div>
            )}

            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
                Source layer counts
              </p>
              <div className="grid gap-2">
                <ReadinessMetric label="Urgent package media" tone="wait" value={assetBridge?.layers?.urgentPackage?.mediaFiles || 0} />
                <ReadinessMetric label="Google Drive assets" tone="wait" value={assetBridge?.layers?.googleDrive?.totalRows || 0} />
                <ReadinessMetric label="Original site candidates" tone="wait" value={assetBridge?.layers?.wixOriginalSite?.totalRows || 0} />
              </div>
            </div>
          </div>
        </div>

        {directionRows.length ? (
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Moon Rocks family decision queue sample
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {directionRows.map((item) => (
                <article className="border border-white/15 bg-white/5 p-4" key={item.reviewGroupKeySnapshot || item.observedCandidateName}>
                  <div className="flex flex-wrap gap-2">
                    <span className="border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-amber-100">
                      {item.directionPriority || "priority missing"}
                    </span>
                    <span className="border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-zinc-100">
                      {item.directionStatus || "status missing"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">{item.observedCandidateName || "Unnamed candidate"}</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    {item.subfamilyBucket || "Unbucketed"} · {item.normalizedStrainOrFlavor || "No normalized name"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">
                    Next: {item.nextInternalAction || "manual review"}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    {item.frictionTier || "friction tier missing"} · locked: {String(item.locked ?? false)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DraftContactLocatorReadiness({
  readiness,
}: {
  readonly readiness: ContactLocatorReadiness;
}) {
  if (readiness.status === "not_contact_locator") {
    return null;
  }

  const {sourceIntake, retailerWorkflow, dryRunImport, contactSubmission} = readiness.summaries;

  if (readiness.status === "missing_summary") {
    return (
      <section aria-labelledby="draft-contact-locator-readiness-title" className="border border-red-300/40 bg-red-300/10 p-5">
        <div className="grid gap-3">
          <p className="text-sm font-semibold uppercase tracking-normal text-red-100">
            {readiness.kind === "locator" ? "Locator readiness" : "Contact readiness"}
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-white" id="draft-contact-locator-readiness-title">
            Missing local readiness artifact
          </h2>
          <p className="text-sm leading-6 text-red-100">
            This private draft route needs its readiness summary before route decisions can be reviewed here.
          </p>
        </div>
      </section>
    );
  }

  if (readiness.kind === "contact") {
    return (
      <section aria-labelledby="draft-contact-locator-readiness-title" className="border border-white/15 bg-zinc-950/40 p-5">
        <div className="grid gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
              Contact readiness
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-white" id="draft-contact-locator-readiness-title">
              Private form/submission boundary
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
              This panel confirms whether the Contact route has cleared form, submission, CRM, official contact detail, and public route gates.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadinessMetric label="Readiness verdict" tone={contactSubmission?.verdict ? "ok" : "wait"} value={contactSubmission?.verdict || "missing"} />
            <ReadinessMetric label="Route handlers" tone={contactSubmission?.routeHandlers?.length ? "stop" : "ok"} value={contactSubmission?.routeHandlers?.length || 0} />
            <ReadinessMetric label="API routes" tone={contactSubmission?.apiRoutes?.length ? "stop" : "ok"} value={contactSubmission?.apiRoutes?.length || 0} />
            <ReadinessMetric label="Form fields" tone={contactSubmission?.sourceFieldMatches?.length ? "stop" : "ok"} value={contactSubmission?.sourceFieldMatches?.length || 0} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadinessMetric label="Contact form cleared" tone={contactSubmission?.contactFormApproved ? "ok" : "wait"} value={String(contactSubmission?.contactFormApproved ?? false)} />
            <ReadinessMetric label="Submission cleared" tone={contactSubmission?.formSubmissionApproved ? "ok" : "wait"} value={String(contactSubmission?.formSubmissionApproved ?? false)} />
            <ReadinessMetric label="CRM cleared" tone={contactSubmission?.crmApproved ? "ok" : "wait"} value={String(contactSubmission?.crmApproved ?? false)} />
            <ReadinessMetric label="Official details cleared" tone={contactSubmission?.officialContactDetailsApproved ? "ok" : "wait"} value={String(contactSubmission?.officialContactDetailsApproved ?? false)} />
          </div>
          <div className="border border-white/15 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Guardrail
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">
              {contactSubmission?.guardrail || "No contact readiness guardrail summary found."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const stateCounts = topCountEntries(retailerWorkflow?.state_counts, 8);
  const serviceZones = topCountEntries(retailerWorkflow?.service_zone_counts, 8);

  return (
    <section aria-labelledby="draft-contact-locator-readiness-title" className="border border-white/15 bg-zinc-950/40 p-5">
      <div className="grid gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
            Locator readiness
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white" id="draft-contact-locator-readiness-title">
            Private retailer source status
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            This panel reads retailer intake and dry-run verification summaries only. It does not import retailer data, publish a locator,
            add LocalBusiness schema, or unlock sitemap/indexing.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessMetric label="Source intake" tone={sourceIntake?.retailer_lane?.status === "pass" ? "ok" : "wait"} value={sourceIntake?.overall_status || "missing"} />
          <ReadinessMetric label="Retailer rows" tone={retailerWorkflow?.retailer_rows_read ? "wait" : "neutral"} value={retailerWorkflow?.retailer_rows_read || 0} />
          <ReadinessMetric label="Dry-run verdict" tone={dryRunImport?.verdict === "PASS_WITH_WARNINGS" ? "wait" : "ok"} value={dryRunImport?.verdict || "missing"} />
          <ReadinessMetric label="Import ready" tone={dryRunImport?.import_ready ? "ok" : "wait"} value={String(dryRunImport?.import_ready ?? false)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessMetric label="Duplicate review rows" tone={retailerWorkflow?.duplicate_review_rows?.length ? "wait" : "ok"} value={retailerWorkflow?.duplicate_review_rows?.length || 0} />
          <ReadinessMetric label="Out-of-state rows" tone={retailerWorkflow?.out_of_state_rows?.length ? "wait" : "ok"} value={retailerWorkflow?.out_of_state_rows?.length || 0} />
          <ReadinessMetric label="Dry-run warnings" tone={dryRunImport?.retailer_warning_rows ? "wait" : "ok"} value={dryRunImport?.retailer_warning_rows || 0} />
          <ReadinessMetric label="Firewall risks" tone={dryRunImport?.approval_firewall_risk_rows ? "stop" : "ok"} value={dryRunImport?.approval_firewall_risk_rows || 0} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              State counts
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {stateCounts.map(([state, count]) => (
                <span className="border border-white/15 bg-white/5 px-3 py-2 text-sm leading-6 text-zinc-200" key={state}>
                  {state}: {count}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
              Top service zones
            </p>
            <div className="grid gap-2">
              {serviceZones.map(([zone, count]) => (
                <span className="border border-white/15 bg-white/5 px-3 py-2 text-sm leading-6 text-zinc-200" key={zone}>
                  {zone}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 border border-white/15 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
            Public boundary
          </p>
          {[
            `Database written: ${String(retailerWorkflow?.database_written ?? dryRunImport?.database_written ?? false)}`,
            `Client data imported: ${String(retailerWorkflow?.client_data_imported ?? dryRunImport?.client_data_imported ?? false)}`,
            `Locator unlocked: ${String(retailerWorkflow?.locator_unlocked ?? false)}`,
            `LocalBusiness schema unlocked: ${String(retailerWorkflow?.localbusiness_schema_unlocked ?? false)}`,
            `Sitemap unlocked: ${String(retailerWorkflow?.sitemap_unlocked ?? false)}`,
            `Indexability unlocked: ${String(retailerWorkflow?.indexability_unlocked ?? false)}`,
          ].map((item) => (
            <span className="text-sm leading-6 text-zinc-200" key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function DraftSitePage({params}: DraftSitePageProps) {
  if (!(await hasAuthenticatedPrivateDraftRouteAccess())) {
    notFound();
  }

  const {slug} = await params;
  if (!isDraftSitePageSlug(slug) || slug === "home") {
    notFound();
  }

  const page = await readDraftSitePage(slug, {
    next: {tags: [`sanity-draft-site-page-${slug}`]},
  });
  const record = page.ok && page.result ? page.result : draftSitePageFixtures[slug];
  const recordSource = page.ok && page.result ? "Live Sanity draft" : "CMS-shaped fixture";
  const modules = record?.modules || [];
  const productMediaWorklist = readProductMediaWorklist(slug);
  const contactLocatorReadiness = readContactLocatorReadiness(slug);

  return (
    <PageFrame>
      <SceneStack>
        <Scene ariaLabelledBy="draft-site-page-title" tone="contrast">
          <div className="mx-auto grid w-full max-w-6xl gap-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
              Presidential CMS draft preview
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl" id="draft-site-page-title">
              {record?.title || slug}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-zinc-300">
              {record?.summary || "Enable the private draft read env and make sure this draft page exists in Sanity."}
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-normal">
              <span className="border border-white/15 bg-white/10 px-3 py-2">
                Slug: {record?.slug || slug}
              </span>
              <span className="border border-white/15 bg-white/10 px-3 py-2">
                Modules: {modules.length}
              </span>
              <span className="border border-white/15 bg-white/10 px-3 py-2">
                Source: {recordSource}
              </span>
              <span className="border border-white/15 bg-white/10 px-3 py-2">
                {page.ok ? "Draft read active" : page.skipped ? page.reason : `${page.status} ${page.statusText}`}
              </span>
            </div>
            <DraftRouteReadiness modules={modules} record={record} recordSource={recordSource} />
            <DraftAssetReadiness modules={modules} />
            <DraftProductMediaWorklist worklist={productMediaWorklist} />
            <DraftContactLocatorReadiness readiness={contactLocatorReadiness} />
          </div>
        </Scene>

        <CmsHomepageModuleRenderer
          heroHeadingLevel="h2"
          modules={modules}
          productRoute={PRODUCT_ROUTE_SLUGS.has(slug) ? slug as "moon-rocks" | "moon-pods" | "orbit" : undefined}
          supportRoute={SUPPORT_ROUTE_SLUGS.has(slug) ? slug as "contact" | "find-us" : undefined}
          renderMode="private"
        />
      </SceneStack>
    </PageFrame>
  );
}
