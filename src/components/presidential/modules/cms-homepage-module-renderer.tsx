import Link from "next/link";

import { getRouteByPath } from "@/lib/seo/route-helpers";
import type { SeoRoutePath } from "@/lib/seo/route-types";

import { Scene } from "../layout/scene";
import { CtaLink } from "../primitives/cta-link";
import { SectionHeading } from "../primitives/section-heading";
import { CmsProductModuleComponents } from "./cms-product-module-components";

type CmsHomepageModuleRendererProps = {
  readonly modules: readonly SanityHomepageModule[];
  readonly productRoute?: ProductRouteSlug;
  readonly renderMode?: CmsRenderMode;
  readonly supportRoute?: SupportRouteSlug;
};

type CmsRenderMode = "public" | "private";
type ProductRouteSlug = "moon-rocks" | "moon-pods" | "orbit";
type SupportRouteSlug = "contact" | "find-us";
type ContactModuleVariant = "contact" | "locator";

type SanityHomepageModule = {
  readonly _key?: string;
  readonly _type?: string;
  readonly eyebrow?: string;
  readonly headline?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly subheadline?: string;
  readonly actTitle?: string;
  readonly actNumber?: number;
  readonly beliefStatement?: string;
  readonly positioningLine?: string;
  readonly shortExplanation?: string;
  readonly description?: string;
  readonly legalTitle?: string;
  readonly intro?: string;
  readonly body?: string | readonly SanityPortableTextBlock[];
  readonly supportingCopy?: readonly SanityPortableTextBlock[];
  readonly storyCopy?: readonly SanityPortableTextBlock[];
  readonly callout?: string;
  readonly sourceNote?: string;
  readonly title?: string;
  readonly proofType?: string;
  readonly proofSource?: string;
  readonly sourceSystem?: string;
  readonly originalPathOrRoute?: string;
  readonly assetCategory?: string;
  readonly provenanceStatus?: string;
  readonly approvalStatus?: string;
  readonly allowedUsage?: string;
  readonly blockedUsage?: string;
  readonly fallbackLanguage?: string;
  readonly formIntent?: string;
  readonly stateCandidates?: readonly string[];
  readonly retailerDataStatus?: string;
  readonly legalGateStatus?: string;
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
  readonly primaryCta?: SanityCta;
  readonly secondaryCta?: SanityCta;
  readonly cta?: SanityCta;
  readonly visibleCta?: SanityCta;
  readonly heroAssetRecord?: SanityAssetRecord;
  readonly assetRecord?: SanityAssetRecord;
  readonly assetRecords?: readonly SanityAssetRecord[];
  readonly assetRecordRefs?: readonly SanityAssetRecord[];
  readonly platform?: SanityLinkedRecord;
  readonly format?: SanityLinkedRecord;
  readonly contactProfile?: SanityContactProfile;
  readonly linkedLocatorRegion?: SanityLinkedRecord;
  readonly cards?: readonly SanityCard[];
  readonly featuredGuides?: readonly SanityLinkedRecord[];
  readonly relatedPlatforms?: readonly SanityLinkedRecord[];
  readonly relatedProductLinks?: readonly SanityLinkedRecord[];
  readonly events?: readonly SanityTimelineEvent[];
  readonly facts?: readonly SanityFact[];
  readonly columns?: readonly SanityColumn[];
  readonly question?: string;
  readonly answer?: string;
  readonly items?: readonly {
    readonly _id?: string;
    readonly _type?: string;
    readonly title?: string;
    readonly name?: string;
    readonly label?: string;
    readonly description?: string;
    readonly slug?: string;
  }[];
  readonly moduleControl?: {
    readonly moduleKey?: string;
    readonly internalLabel?: string;
    readonly componentKey?: string;
    readonly renderEligibility?: string;
    readonly sortIntent?: number;
  };
};

type SanityCta = {
  readonly label?: string;
  readonly href?: string;
  readonly intent?: string;
};

type SanityAssetRecord = {
  readonly _id?: string;
  readonly title?: string;
  readonly assetName?: string;
  readonly savedFile?: string;
  readonly sourceSystem?: string;
  readonly approvalStatus?: string;
  readonly provenanceStatus?: string;
  readonly pageUsage?: readonly string[];
};

type SanityLinkedRecord = {
  readonly _id?: string;
  readonly _type?: string;
  readonly title?: string;
  readonly name?: string;
  readonly slug?: string;
  readonly guideTopic?: string;
  readonly intro?: string;
  readonly positioningLine?: string;
  readonly shortDescription?: string;
  readonly description?: string;
  readonly publicStatus?: string;
};

type SanityContactProfile = {
  readonly _id?: string;
  readonly _type?: "contactProfile";
  readonly title?: string;
  readonly phone?: string;
  readonly displayEmail?: string;
  readonly mailtoEmail?: string;
  readonly emailConflictStatus?: string;
  readonly publicUseStatus?: string;
};

type SanityCard = {
  readonly title?: string;
  readonly route?: string;
  readonly sourceStatus?: string;
  readonly routeGate?: string;
  readonly assetRecord?: SanityAssetRecord;
  readonly contentRef?: SanityLinkedRecord;
};

type SanityTimelineEvent = {
  readonly label?: string;
  readonly dateOrSequence?: string;
  readonly body?: readonly SanityPortableTextBlock[];
};

type SanityFact = {
  readonly label?: string;
  readonly value?: string;
  readonly publicUseStatus?: string;
};

type SanityColumn = {
  readonly title?: string;
  readonly body?: readonly SanityPortableTextBlock[];
  readonly contentRef?: SanityLinkedRecord;
};

type SanityPortableTextBlock = {
  readonly children?: readonly {
    readonly text?: string;
  }[];
};

function asSeoRoutePath(href?: string): SeoRoutePath | null {
  if (!href?.startsWith("/")) {
    return null;
  }

  const routePath = href as SeoRoutePath;
  return getRouteByPath(routePath) ? routePath : null;
}

function moduleDomId(module: SanityHomepageModule, fallback: string): string {
  return `cms-${module._key || module.moduleControl?.moduleKey || module._type || fallback}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");
}

function isPrivateRenderMode(renderMode: CmsRenderMode): boolean {
  return renderMode === "private";
}

function moduleTitle(module: SanityHomepageModule, fallback: string, renderMode: CmsRenderMode): string {
  return (
    (isPrivateRenderMode(renderMode) ? module.moduleControl?.internalLabel : undefined) ||
    module.headline ||
    module.heading ||
    module.title ||
    module.actTitle ||
    module.positioningLine ||
    module.legalTitle ||
    module.question ||
    fallback
  );
}

function portableTextToPlainText(value?: string | readonly SanityPortableTextBlock[]): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value
    .map((block) => block.children?.map((child) => child.text || "").join("") || "")
    .filter(Boolean)
    .join("\n\n");
}

function moduleBody(module: SanityHomepageModule): string {
  return (
    module.description ||
    module.shortExplanation ||
    module.intro ||
    portableTextToPlainText(module.body) ||
    portableTextToPlainText(module.supportingCopy) ||
    portableTextToPlainText(module.storyCopy) ||
    module.beliefStatement ||
    module.callout ||
    module.subheadline ||
    module.subheading ||
    module.answer ||
    ""
  );
}

function firstCta(module: SanityHomepageModule): SanityCta {
  return module.primaryCta || module.cta || module.visibleCta || {
    label: module.ctaLabel,
    href: module.ctaHref,
  };
}

function secondCta(module: SanityHomepageModule): SanityCta {
  return module.secondaryCta || {};
}

function moduleAssets(module: SanityHomepageModule): readonly SanityAssetRecord[] {
  return [
    module.heroAssetRecord,
    module.assetRecord,
    ...(module.assetRecords || []),
    ...(module.assetRecordRefs || []),
    ...(module.cards || []).map((card) => card.assetRecord),
  ].filter((asset): asset is SanityAssetRecord => Boolean(asset));
}

function linkedRecordTitle(record: SanityLinkedRecord): string {
  return record.title || record.name || record.guideTopic || record.slug || "Untitled reference";
}

function linkedRecordBody(record: SanityLinkedRecord): string {
  return record.intro || record.positioningLine || record.shortDescription || record.description || "";
}

function StatusPill({ children, tone = "neutral" }: { readonly children: string; readonly tone?: "ok" | "wait" | "neutral" }) {
  const toneClass = tone === "ok"
    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
    : tone === "wait"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold uppercase tracking-normal ${toneClass}`}>
      {children}
    </span>
  );
}

function ModuleHeading({
  module,
  fallback,
  id,
  kicker,
  renderMode,
}: {
  readonly module: SanityHomepageModule;
  readonly fallback: string;
  readonly id: string;
  readonly kicker?: string;
  readonly renderMode: CmsRenderMode;
}) {
  const body = moduleBody(module);

  return (
    <div className="grid gap-4">
      <ModuleMeta module={module} renderMode={renderMode} />
      <SectionHeading
        description={body || undefined}
        id={id}
        kicker={kicker || module.eyebrow || (isPrivateRenderMode(renderMode) ? module.moduleControl?.internalLabel : undefined)}
        title={moduleTitle(module, fallback, renderMode)}
      />
    </div>
  );
}

function RouteLabel({ route }: { readonly route?: string }) {
  const href = asSeoRoutePath(route);

  if (!route) {
    return null;
  }

  if (href) {
    return (
      <CtaLink className="mt-4 w-fit" href={href} variant="text">
        {route}
      </CtaLink>
    );
  }

  return <p className="mt-3 text-xs leading-5 text-zinc-600">{route}</p>;
}

function ReferenceCard({
  record,
  label,
  renderMode,
}: {
  readonly record: SanityLinkedRecord;
  readonly label?: string;
  readonly renderMode: CmsRenderMode;
}) {
  const isPrivate = isPrivateRenderMode(renderMode);

  return (
    <article className="grid content-start gap-3 border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
        {label || record._type || (isPrivate ? record.publicStatus : undefined) || "Reference"}
      </p>
      <h3 className="text-lg font-semibold text-zinc-950">{linkedRecordTitle(record)}</h3>
      {linkedRecordBody(record) ? (
        <p className="text-sm leading-6 text-zinc-700">{linkedRecordBody(record)}</p>
      ) : null}
      {isPrivate && record.publicStatus ? (
        <StatusPill tone="wait">{record.publicStatus}</StatusPill>
      ) : null}
      {isPrivate && record.slug ? (
        <p className="text-xs leading-5 text-zinc-600">Slug: {record.slug}</p>
      ) : null}
    </article>
  );
}

function KeyValueList({ entries }: { readonly entries: readonly [string, string | undefined][] }) {
  const visibleEntries = entries.filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (!visibleEntries.length) {
    return null;
  }

  return (
    <dl className="grid gap-3 border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {visibleEntries.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-normal text-zinc-500">{label}</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-zinc-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CardGrid({ module, renderMode }: { readonly module: SanityHomepageModule; readonly renderMode: CmsRenderMode }) {
  const cards = module.cards || [];
  const isPrivate = isPrivateRenderMode(renderMode);

  if (!cards.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => (
        <article className="grid content-start gap-3 border border-zinc-200 bg-white p-5 shadow-sm" key={`${card.title || card.route || "card"}-${index}`}>
          <div className="flex flex-wrap gap-2">
            {isPrivate && card.sourceStatus ? <StatusPill tone="wait">{card.sourceStatus}</StatusPill> : null}
            {isPrivate && card.routeGate ? <StatusPill>{card.routeGate}</StatusPill> : null}
            {(!isPrivate || (!card.sourceStatus && !card.routeGate)) ? <StatusPill>{`Card ${index + 1}`}</StatusPill> : null}
          </div>
          <h3 className="text-xl font-semibold text-zinc-950">
            {card.title || (card.contentRef ? linkedRecordTitle(card.contentRef) : "Untitled")}
          </h3>
          {card.contentRef && linkedRecordBody(card.contentRef) ? (
            <p className="text-sm leading-6 text-zinc-700">{linkedRecordBody(card.contentRef)}</p>
          ) : null}
          <RouteLabel route={card.route} />
          {card.assetRecord ? (
            <p className="text-xs font-semibold text-zinc-500">
              {card.assetRecord.title || card.assetRecord.assetName || (isPrivate ? card.assetRecord.savedFile : undefined) || "Asset attached"}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function FeaturedGuides({ guides, renderMode }: { readonly guides?: readonly SanityLinkedRecord[]; readonly renderMode: CmsRenderMode }) {
  const isPrivate = isPrivateRenderMode(renderMode);

  if (!guides?.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {guides.map((guide, index) => {
        const guideHref = asSeoRoutePath(guide.slug ? `/learn/${guide.slug}` : undefined);

        return (
          <article className="grid content-start gap-3 border border-zinc-200 bg-white p-5 shadow-sm" key={guide._id || `${guide.slug || "guide"}-${index}`}>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
              {guide.guideTopic || "Featured guide"}
            </p>
            <h3 className="text-lg font-semibold text-zinc-950">{linkedRecordTitle(guide)}</h3>
            {linkedRecordBody(guide) ? (
              <p className="text-sm leading-6 text-zinc-700">{linkedRecordBody(guide)}</p>
            ) : null}
            {isPrivate && guide.publicStatus ? (
              <StatusPill tone="wait">{guide.publicStatus}</StatusPill>
            ) : null}
            {guideHref ? (
              <Link className="mt-2 w-fit text-sm font-semibold text-emerald-900 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900" href={guideHref}>
                Open guide
              </Link>
            ) : isPrivate && guide.slug ? (
              <p className="text-xs leading-5 text-zinc-600">Slug: {guide.slug}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function TimelineEvents({ events }: { readonly events?: readonly SanityTimelineEvent[] }) {
  if (!events?.length) {
    return null;
  }

  return (
    <ol className="grid gap-4">
      {events.map((event, index) => (
        <li className="border-l-4 border-emerald-700 bg-white p-5 shadow-sm" key={`${event.label || "event"}-${index}`}>
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
            {event.dateOrSequence || `Event ${index + 1}`}
          </p>
          <h3 className="mt-3 text-lg font-semibold text-zinc-950">{event.label || "Untitled event"}</h3>
          {portableTextToPlainText(event.body) ? (
            <p className="mt-3 text-sm leading-6 text-zinc-700">{portableTextToPlainText(event.body)}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function FactGrid({ facts }: { readonly facts?: readonly SanityFact[] }) {
  if (!facts?.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((fact, index) => (
        <article className="border border-zinc-200 bg-white p-5 shadow-sm" key={`${fact.label || "fact"}-${index}`}>
          <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
            {fact.label || `Fact ${index + 1}`}
          </p>
          {fact.value ? (
            <p className="mt-3 text-2xl font-semibold leading-tight text-zinc-950">{fact.value}</p>
          ) : null}
          {fact.publicUseStatus ? (
            <p className="mt-3 text-xs font-semibold text-zinc-500">{fact.publicUseStatus}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ColumnGrid({ columns }: { readonly columns?: readonly SanityColumn[] }) {
  if (!columns?.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {columns.map((column, index) => (
        <article className="border border-zinc-200 bg-white p-5 shadow-sm" key={`${column.title || "column"}-${index}`}>
          <h3 className="text-xl font-semibold text-zinc-950">{column.title || "Untitled column"}</h3>
          {portableTextToPlainText(column.body) ? (
            <p className="mt-3 text-sm leading-6 text-zinc-700">{portableTextToPlainText(column.body)}</p>
          ) : null}
          {column.contentRef ? (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
                {column.contentRef._type || "Referenced content"}
              </p>
              <p className="mt-2 text-sm font-semibold text-zinc-950">{linkedRecordTitle(column.contentRef)}</p>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function RelatedContent({ module, renderMode }: { readonly module: SanityHomepageModule; readonly renderMode: CmsRenderMode }) {
  const records = [
    ...(module.platform ? [module.platform] : []),
    ...(module.format ? [module.format] : []),
    ...(module.relatedPlatforms || []),
    ...(module.relatedProductLinks || []),
  ];

  if (!records.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {records.map((record, index) => (
        <ReferenceCard key={record._id || `${record.slug || "reference"}-${index}`} record={record} renderMode={renderMode} />
      ))}
    </div>
  );
}

function AssetCards({ assets, renderMode }: { readonly assets: readonly SanityAssetRecord[]; readonly renderMode: CmsRenderMode }) {
  const isPrivate = isPrivateRenderMode(renderMode);

  if (!assets.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {assets.map((asset, index) => (
        <article className="grid content-start gap-3 border border-zinc-200 bg-zinc-50 p-4" key={asset._id || `${asset.title || "asset"}-${index}`}>
          <div className="aspect-[4/3] border border-zinc-200 bg-white p-4">
            <div className="flex h-full items-end border border-dashed border-zinc-300 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
                {(isPrivate ? asset.sourceSystem : undefined) || "Asset preview"}
              </p>
            </div>
          </div>
          <h3 className="text-base font-semibold text-zinc-950">{asset.title || asset.assetName || "Untitled asset"}</h3>
          {isPrivate && asset.savedFile ? (
            <p className="break-words text-xs leading-5 text-zinc-600">{asset.savedFile}</p>
          ) : null}
          {isPrivate ? (
            <div className="flex flex-wrap gap-2">
              {asset.provenanceStatus ? <StatusPill tone="wait">{asset.provenanceStatus}</StatusPill> : null}
              {asset.approvalStatus ? <StatusPill>{asset.approvalStatus}</StatusPill> : null}
            </div>
          ) : null}
          {isPrivate && asset.pageUsage?.length ? (
            <p className="text-xs leading-5 text-zinc-600">{asset.pageUsage.join(", ")}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function PlatformSummary({ module, renderMode }: { readonly module: SanityHomepageModule; readonly renderMode: CmsRenderMode }) {
  const records = [module.platform, module.format].filter((record): record is SanityLinkedRecord => Boolean(record));

  if (!records.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {records.map((record) => (
        <ReferenceCard key={record._id || record.slug || linkedRecordTitle(record)} label={record._type || "Platform"} record={record} renderMode={renderMode} />
      ))}
    </div>
  );
}

function ProductPlatformModule({
  module,
  productRoute,
  renderMode,
}: {
  readonly module: SanityHomepageModule;
  readonly productRoute?: ProductRouteSlug;
  readonly renderMode: CmsRenderMode;
}) {
  const id = moduleDomId(module, "product-platform");

  return (
    <Scene ariaLabelledBy={id} tone="default">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <ModuleHeading fallback="Product platform" id={id} kicker="Product platform" module={module} renderMode={renderMode} />
        <CmsProductModuleComponents module={module} productRoute={productRoute} renderMode={renderMode} />
        <PlatformSummary module={module} renderMode={renderMode} />
        <FactGrid facts={module.facts} />
        <RelatedContent module={module} renderMode={renderMode} />
      </div>
    </Scene>
  );
}

function ProductRailModule({
  module,
  productRoute,
  renderMode,
}: {
  readonly module: SanityHomepageModule;
  readonly productRoute?: ProductRouteSlug;
  readonly renderMode: CmsRenderMode;
}) {
  const id = moduleDomId(module, "product-rail");

  return (
    <Scene ariaLabelledBy={id} tone="quiet">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <ModuleHeading fallback="Product rail" id={id} kicker="Product rail" module={module} renderMode={renderMode} />
        <CmsProductModuleComponents module={module} productRoute={productRoute} renderMode={renderMode} />
        <CardGrid module={module} renderMode={renderMode} />
        <AssetCards assets={moduleAssets(module)} renderMode={renderMode} />
      </div>
    </Scene>
  );
}

function LearnHubModule({ module, renderMode }: { readonly module: SanityHomepageModule; readonly renderMode: CmsRenderMode }) {
  const id = moduleDomId(module, "learn-hub");
  const guideCount = module.featuredGuides?.length || module.cards?.length || module.items?.length || 0;

  return (
    <Scene ariaLabelledBy={id} tone="default">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <ModuleHeading fallback="Learn hub" id={id} kicker="Education" module={module} renderMode={renderMode} />
        <div className="grid gap-4 border border-emerald-200 bg-emerald-50 p-5 md:grid-cols-[minmax(0,0.8fr)_minmax(260px,0.4fr)] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
              Learn CMS path
            </p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-950">
              Guide cards route into approved Learn URLs
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              The Learn hub can list Sanity guide references while each guide route keeps its own source, claim, and module review path.
            </p>
          </div>
          <div className="grid gap-2 border border-emerald-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Rendered guide candidates</p>
            <p className="text-3xl font-semibold text-zinc-950">{guideCount}</p>
          </div>
        </div>
        <FeaturedGuides guides={module.featuredGuides} renderMode={renderMode} />
        <CardGrid module={module} renderMode={renderMode} />
      </div>
    </Scene>
  );
}

function TimelineModule({ module, renderMode }: { readonly module: SanityHomepageModule; readonly renderMode: CmsRenderMode }) {
  const id = moduleDomId(module, "timeline");

  return (
    <Scene ariaLabelledBy={id} tone="quiet">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <ModuleHeading fallback="Story timeline" id={id} kicker="Story" module={module} renderMode={renderMode} />
        <TimelineEvents events={module.events} />
      </div>
    </Scene>
  );
}

function ProofModule({ module, renderMode }: { readonly module: SanityHomepageModule; readonly renderMode: CmsRenderMode }) {
  if (!isPrivateRenderMode(renderMode)) {
    return null;
  }

  const id = moduleDomId(module, "proof");
  const proofEntries: readonly [string, string | undefined][] = [
    ["Proof type", module.proofType],
    ["Proof source", module.proofSource],
    ["Source system", module.sourceSystem],
    ["Original path or route", module.originalPathOrRoute],
    ["Asset category", module.assetCategory],
    ["Provenance", module.provenanceStatus],
    ["Approval", module.approvalStatus],
    ["Allowed usage", module.allowedUsage],
    ["Blocked usage", module.blockedUsage],
    ["Fallback language", module.fallbackLanguage],
    ["Source note", module.sourceNote],
  ];

  return (
    <Scene ariaLabelledBy={id} tone="internal">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <ModuleHeading fallback="Source proof" id={id} kicker="Internal proof" module={module} renderMode={renderMode} />
        <KeyValueList entries={proofEntries} />
        <AssetCards assets={moduleAssets(module)} renderMode={renderMode} />
      </div>
    </Scene>
  );
}

function ModuleMeta({ module, renderMode }: { readonly module: SanityHomepageModule; readonly renderMode: CmsRenderMode }) {
  if (!isPrivateRenderMode(renderMode)) {
    return null;
  }

  const label = module.moduleControl?.componentKey || module._type || "cms_module";
  const eligibility = module.moduleControl?.renderEligibility;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal">
      <span className="text-emerald-700">{label}</span>
      {eligibility ? <span className="text-zinc-500">{eligibility}</span> : null}
    </div>
  );
}

function HeroModule({ module, index, renderMode }: { readonly module: SanityHomepageModule; readonly index: number; readonly renderMode: CmsRenderMode }) {
  const isPrivate = isPrivateRenderMode(renderMode);
  const primaryCta = firstCta(module);
  const secondaryCta = secondCta(module);
  const primaryHref = asSeoRoutePath(primaryCta.href);
  const secondaryHref = asSeoRoutePath(secondaryCta.href);
  const assets = moduleAssets(module);
  const id = moduleDomId(module, `hero-${index + 1}`);

  return (
    <Scene ariaLabelledBy={id} className="py-20" tone="contrast">
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(340px,0.62fr)] lg:items-center">
        <div className="grid gap-6">
          <ModuleMeta module={module} renderMode={renderMode} />
          {module.eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
              {module.eyebrow}
            </p>
          ) : null}
          <h2 className="text-5xl font-semibold leading-none sm:text-6xl" id={id}>
            {moduleTitle(module, "Official Presidential", renderMode)}
          </h2>
          {moduleBody(module) ? (
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">{moduleBody(module)}</p>
          ) : null}
          {primaryHref || secondaryHref ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {primaryHref && primaryCta.label ? (
                <CtaLink href={primaryHref} variant="primary">
                  {primaryCta.label}
                </CtaLink>
              ) : null}
              {secondaryHref && secondaryCta.label ? (
                <CtaLink href={secondaryHref} variant="contrast">
                  {secondaryCta.label}
                </CtaLink>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="min-h-96 border border-white/15 bg-white/10 p-5">
          <div className="flex h-full min-h-80 items-end border border-emerald-300/30 bg-emerald-300/10 p-5">
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-emerald-100">
                {assets[0]?.title || assets[0]?.assetName || "CMS-driven hero media slot"}
              </p>
              {isPrivate && assets[0]?.savedFile ? (
                <p className="text-xs leading-5 text-emerald-50">{assets[0].savedFile}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function HomepageActModule({ module, index, renderMode }: { readonly module: SanityHomepageModule; readonly index: number; readonly renderMode: CmsRenderMode }) {
  const actNumber = module.actNumber || index + 1;
  const cta = firstCta(module);
  const ctaHref = asSeoRoutePath(cta.href);
  const id = moduleDomId(module, `homepage-act-${actNumber}`);

  return (
    <Scene ariaLabelledBy={id} tone={actNumber % 2 === 0 ? "quiet" : "default"}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(300px,0.58fr)] lg:items-center">
        <div className="grid gap-5">
          <ModuleMeta module={module} renderMode={renderMode} />
          <p className="text-sm font-black uppercase tracking-normal text-emerald-800">
            Act {actNumber}
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-zinc-950 sm:text-4xl" id={id}>
            {moduleTitle(module, `Homepage act ${actNumber}`, renderMode)}
          </h2>
          {moduleBody(module) ? (
            <p className="max-w-2xl text-base leading-7 text-zinc-700">{moduleBody(module)}</p>
          ) : null}
          {ctaHref && cta.label ? (
            <div>
              <CtaLink href={ctaHref} variant="secondary">
                {cta.label}
              </CtaLink>
            </div>
          ) : null}
        </div>
        <div className="aspect-[4/3] border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex h-full items-end border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-700">CMS act media slot</p>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function ProductOrListModule({
  module,
  productRoute,
  renderMode,
}: {
  readonly module: SanityHomepageModule;
  readonly productRoute?: ProductRouteSlug;
  readonly renderMode: CmsRenderMode;
}) {
  const items = module.items || [];
  const id = moduleDomId(module, "list");

  return (
    <Scene ariaLabelledBy={id} tone="default">
      <div className="mx-auto grid w-full max-w-7xl gap-8">
        <ModuleHeading fallback="Presidential module" id={id} module={module} renderMode={renderMode} />
        {productRoute ? (
          <CmsProductModuleComponents module={module} productRoute={productRoute} renderMode={renderMode} />
        ) : null}
        {items.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((item, index) => (
              <article className="border border-zinc-200 bg-white p-5 shadow-sm" key={`${item._id || item.title || item.name || item.label || "item"}-${index}`}>
                <p className="text-xs font-semibold uppercase tracking-normal text-emerald-800">
                  {item.label || item._type || `Item ${index + 1}`}
                </p>
                <h3 className="mt-4 text-xl font-semibold text-zinc-950">{item.title || item.name || "Untitled"}</h3>
                {item.description ? (
                  <p className="mt-3 text-sm leading-6 text-zinc-700">{item.description}</p>
                ) : null}
                {item.slug ? (
                  <p className="mt-3 text-xs leading-5 text-zinc-600">Slug: {item.slug}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
        <CardGrid module={module} renderMode={renderMode} />
        <FeaturedGuides guides={module.featuredGuides} renderMode={renderMode} />
        <TimelineEvents events={module.events} />
        <FactGrid facts={module.facts} />
        <ColumnGrid columns={module.columns} />
        <RelatedContent module={module} renderMode={renderMode} />
        <AssetCards assets={moduleAssets(module)} renderMode={renderMode} />
      </div>
    </Scene>
  );
}

function statusLabel(value?: string): string | undefined {
  return value?.replace(/_/g, " ");
}

function isApprovedPublicStatus(value?: string): boolean {
  return value === "approved_public";
}

function canShowPublicContactProfile(profile?: SanityContactProfile): boolean {
  return Boolean(profile && isApprovedPublicStatus(profile.publicUseStatus));
}

function getContactModuleCta(
  module: SanityHomepageModule,
  resolvedVariant: ContactModuleVariant,
): SanityCta {
  const cta = firstCta(module);

  if (cta.href && cta.label) {
    return cta;
  }

  return resolvedVariant === "locator"
    ? { label: "Contact Presidential", href: "/contact", intent: "contact" }
    : { label: "Find Presidential", href: "/find-us", intent: "find_presidential" };
}

function ContactDetailPanel({
  contactProfile,
  renderMode,
}: {
  readonly contactProfile?: SanityContactProfile;
  readonly renderMode: CmsRenderMode;
}) {
  const isPrivate = isPrivateRenderMode(renderMode);
  const canShowPublic = canShowPublicContactProfile(contactProfile);
  const showContactDetails = isPrivate || canShowPublic;
  const displayEmail = contactProfile?.displayEmail;
  const mailtoEmail = contactProfile?.mailtoEmail || displayEmail;

  if (!contactProfile) {
    return (
      <div className="grid gap-3 border border-white/15 bg-white/10 p-4">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-100">
          Official contact details
        </p>
        <p className="text-sm leading-6 text-zinc-300">
          Contact details will appear here after the official contact profile is connected.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border border-white/15 bg-white/10 p-4">
      <p className="text-sm font-semibold uppercase tracking-normal text-emerald-100">
        {contactProfile.title || "Official contact details"}
      </p>
      {showContactDetails && contactProfile.phone ? (
        <a className="text-base font-semibold text-white underline-offset-4 hover:underline" href={`tel:${contactProfile.phone.replace(/[^\d+]/g, "")}`}>
          {contactProfile.phone}
        </a>
      ) : null}
      {showContactDetails && displayEmail ? (
        <a className="break-words text-base font-semibold text-white underline-offset-4 hover:underline" href={`mailto:${mailtoEmail}`}>
          {displayEmail}
        </a>
      ) : null}
      {!showContactDetails ? (
        <p className="text-sm leading-6 text-zinc-300">
          Official contact details are held for client confirmation before public display.
        </p>
      ) : null}
      {isPrivate ? (
        <KeyValueList
          entries={[
            ["Email status", statusLabel(contactProfile.emailConflictStatus)],
            ["Public use", statusLabel(contactProfile.publicUseStatus)],
          ]}
        />
      ) : null}
    </div>
  );
}

function ContactRouteCards({
  module,
  resolvedVariant,
  renderMode,
}: {
  readonly module: SanityHomepageModule;
  readonly resolvedVariant: ContactModuleVariant;
  readonly renderMode: CmsRenderMode;
}) {
  const isPrivate = isPrivateRenderMode(renderMode);
  const fallbackLanguage = module.fallbackLanguage || "Availability varies by licensed retailer.";
  const panels = resolvedVariant === "locator"
    ? [
        {
          title: "Licensed retailer path",
          body: "Find authentic Presidential products through licensed retailer discovery built from verified records.",
        },
        {
          title: "Availability context",
          body: fallbackLanguage,
        },
        {
          title: "Contact handoff",
          body: "Brand, wholesale, and retailer questions can move through the official Presidential contact path.",
        },
      ]
    : [
        {
          title: "Inquiry routing",
          body: "Customer care, wholesale, press, and brand inquiries can move through the official Presidential contact path.",
        },
        {
          title: "Adult-use context",
          body: "For adults 21+ where legal.",
        },
        {
          title: "Submission boundary",
          body: "This shell does not collect inquiry details until official form handling is confirmed.",
        },
      ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {panels.map((panel) => (
        <article className="border border-white/15 bg-white/10 p-4" key={panel.title}>
          <h3 className="text-lg font-semibold leading-tight text-white">{panel.title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{panel.body}</p>
        </article>
      ))}
      {isPrivate && resolvedVariant === "locator" && module.stateCandidates?.length ? (
        <article className="border border-white/15 bg-white/10 p-4 md:col-span-3">
          <h3 className="text-lg font-semibold leading-tight text-white">State candidates</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{module.stateCandidates.join(", ")}</p>
        </article>
      ) : null}
    </div>
  );
}

function ContactModule({
  module,
  renderMode,
  supportRoute,
  variant = "contact",
}: {
  readonly module: SanityHomepageModule;
  readonly renderMode: CmsRenderMode;
  readonly supportRoute?: SupportRouteSlug;
  readonly variant?: ContactModuleVariant;
}) {
  const isPrivate = isPrivateRenderMode(renderMode);
  const resolvedVariant: ContactModuleVariant = supportRoute === "find-us"
    ? "locator"
    : supportRoute === "contact"
      ? "contact"
      : variant;
  const cta = getContactModuleCta(module, resolvedVariant);
  const ctaHref = asSeoRoutePath(cta.href);
  const id = moduleDomId(module, resolvedVariant);
  const entries: readonly [string, string | undefined][] = isPrivate
    ? [
        ["Intent", module.formIntent],
        ["Retailer data", statusLabel(module.retailerDataStatus)],
        ["Legal review", statusLabel(module.legalGateStatus)],
        ["Fallback", module.fallbackLanguage],
        ["Source note", module.sourceNote],
      ]
    : [];

  return (
    <Scene ariaLabelledBy={id} tone="contrast">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.45fr)] lg:items-start">
          <div className="grid gap-5">
            <ModuleMeta module={module} renderMode={renderMode} />
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-200">
              {resolvedVariant === "locator" ? "Retail discovery" : "Contact routing"}
            </p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl" id={id}>
              {moduleTitle(module, resolvedVariant === "locator" ? "Find Presidential" : "Connect with Presidential", renderMode)}
            </h2>
            {moduleBody(module) ? (
              <p className="max-w-2xl text-base leading-7 text-zinc-300">{moduleBody(module)}</p>
            ) : null}
            {ctaHref && cta.label ? (
              <CtaLink href={ctaHref} variant="primary">
                {cta.label}
              </CtaLink>
            ) : null}
          </div>
          <div className="grid gap-4 border border-white/15 bg-white/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-100">
              {resolvedVariant === "locator" ? "Locator shell" : "Contact shell"}
            </p>
            <KeyValueList entries={entries} />
            {resolvedVariant === "locator" ? (
              <p className="text-sm leading-6 text-zinc-300">
                Retailer listings appear only after licensed retailer records are verified.
              </p>
            ) : (
              <p className="text-sm leading-6 text-zinc-300">
                Contact routing can be shown without activating a public form.
              </p>
            )}
          </div>
        </div>
        <ContactRouteCards module={module} renderMode={renderMode} resolvedVariant={resolvedVariant} />
        {resolvedVariant === "contact" ? (
          <ContactDetailPanel contactProfile={module.contactProfile} renderMode={renderMode} />
        ) : null}
      </div>
    </Scene>
  );
}

function FallbackModule({ module, index, renderMode }: { readonly module: SanityHomepageModule; readonly index: number; readonly renderMode: CmsRenderMode }) {
  const id = moduleDomId(module, `module-${index + 1}`);

  return (
    <Scene ariaLabelledBy={id} tone="quiet">
      <div className="mx-auto max-w-5xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ModuleMeta module={module} renderMode={renderMode} />
        <h2 className="mt-3 text-2xl font-semibold text-zinc-950" id={id}>
          {moduleTitle(module, `CMS module ${index + 1}`, renderMode)}
        </h2>
        {moduleBody(module) ? (
          <p className="mt-4 text-base leading-7 text-zinc-700">{moduleBody(module)}</p>
        ) : null}
      </div>
    </Scene>
  );
}

function renderModule(
  module: SanityHomepageModule,
  index: number,
  renderMode: CmsRenderMode,
  productRoute?: ProductRouteSlug,
  supportRoute?: SupportRouteSlug,
) {
  switch (module._type) {
    case "heroBlock":
      return <HeroModule index={index} key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} />;
    case "homepageActBlock":
      return <HomepageActModule index={index} key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} />;
    case "productPlatformBlock":
      return <ProductPlatformModule key={module._key || `${module._type}-${index}`} module={module} productRoute={productRoute} renderMode={renderMode} />;
    case "productFormatBlock":
      return <ProductPlatformModule key={module._key || `${module._type}-${index}`} module={module} productRoute={productRoute} renderMode={renderMode} />;
    case "productRailBlock":
      return <ProductRailModule key={module._key || `${module._type}-${index}`} module={module} productRoute={productRoute} renderMode={renderMode} />;
    case "productFactsBlock":
      return <ProductPlatformModule key={module._key || `${module._type}-${index}`} module={module} productRoute={productRoute} renderMode={renderMode} />;
    case "guideHubBlock":
      return <LearnHubModule key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} />;
    case "learnGuideBlock":
      return <LearnHubModule key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} />;
    case "timelineBlock":
      return <TimelineModule key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} />;
    case "assetProofBlock":
    case "storyProofBlock":
    case "legalUtilityBlock":
      return <ProofModule key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} />;
    case "faqBlock":
    case "mediaGalleryBlock":
    case "comparisonBlock":
    case "relatedContentBlock":
      return <ProductOrListModule key={module._key || `${module._type}-${index}`} module={module} productRoute={productRoute} renderMode={renderMode} />;
    case "contactBlock":
      return <ContactModule key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} supportRoute={supportRoute} />;
    case "locatorShellBlock":
      return <ContactModule key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} supportRoute={supportRoute} variant="locator" />;
    default:
      return <FallbackModule index={index} key={module._key || `${module._type}-${index}`} module={module} renderMode={renderMode} />;
  }
}

export function CmsHomepageModuleRenderer({
  modules,
  productRoute,
  renderMode = "public",
  supportRoute,
}: CmsHomepageModuleRendererProps) {
  if (!modules.length) {
    return (
      <Scene ariaLabelledBy="cms-empty-homepage-modules" tone="quiet">
        <div className="mx-auto max-w-4xl border border-zinc-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-zinc-950" id="cms-empty-homepage-modules">
            No homepage modules found
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Add modules in Sanity and this route will render them here.
          </p>
        </div>
      </Scene>
    );
  }

  return <>{modules.map((module, index) => renderModule(module, index, renderMode, productRoute, supportRoute))}</>;
}
