import Link from "next/link";

import type {
  SanityAssetRecord,
  SanityColumn,
  SanityContactProfile,
  SanityCta,
  SanityFact,
  SanityHomepageModule,
  SanityLinkedRecord,
  SanityPortableTextBlock,
  SanityTimelineEvent,
} from "@/lib/cms/homepage";
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
    ? "border-po-brand-line bg-po-brand-soft text-po-brand"
    : tone === "wait"
      ? "border-po-gold bg-po-gold-soft text-po-gold-ink"
      : "border-po-line bg-po-soft text-po-muted";

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

  return <p className="mt-3 text-xs leading-5 text-po-muted">{route}</p>;
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
    <article className="grid content-start gap-3 border border-po-line bg-po-canvas p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
        {label || record._type || (isPrivate ? record.publicStatus : undefined) || "Reference"}
      </p>
      <h3 className="text-lg font-semibold text-po-ink">{linkedRecordTitle(record)}</h3>
      {linkedRecordBody(record) ? (
        <p className="text-sm leading-6 text-po-body">{linkedRecordBody(record)}</p>
      ) : null}
      {isPrivate && record.publicStatus ? (
        <StatusPill tone="wait">{record.publicStatus}</StatusPill>
      ) : null}
      {isPrivate && record.slug ? (
        <p className="text-xs leading-5 text-po-muted">Slug: {record.slug}</p>
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
    <dl className="grid gap-3 border border-po-line bg-po-soft p-5 sm:grid-cols-2 lg:grid-cols-3">
      {visibleEntries.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-normal text-po-muted">{label}</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-po-ink">{value}</dd>
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
        <article className="grid content-start gap-3 border border-po-line bg-po-canvas p-5 shadow-sm" key={`${card.title || card.route || "card"}-${index}`}>
          <div className="flex flex-wrap gap-2">
            {isPrivate && card.sourceStatus ? <StatusPill tone="wait">{card.sourceStatus}</StatusPill> : null}
            {isPrivate && card.routeGate ? <StatusPill>{card.routeGate}</StatusPill> : null}
            {(!isPrivate || (!card.sourceStatus && !card.routeGate)) ? <StatusPill>{`Card ${index + 1}`}</StatusPill> : null}
          </div>
          <h3 className="text-xl font-semibold text-po-ink">
            {card.title || (card.contentRef ? linkedRecordTitle(card.contentRef) : "Untitled")}
          </h3>
          {card.contentRef && linkedRecordBody(card.contentRef) ? (
            <p className="text-sm leading-6 text-po-body">{linkedRecordBody(card.contentRef)}</p>
          ) : null}
          <RouteLabel route={card.route} />
          {card.assetRecord ? (
            <p className="text-xs font-semibold text-po-muted">
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
          <article className="grid content-start gap-3 border border-po-line bg-po-canvas p-5 shadow-sm" key={guide._id || `${guide.slug || "guide"}-${index}`}>
            <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
              {guide.guideTopic || "Featured guide"}
            </p>
            <h3 className="text-lg font-semibold text-po-ink">{linkedRecordTitle(guide)}</h3>
            {linkedRecordBody(guide) ? (
              <p className="text-sm leading-6 text-po-body">{linkedRecordBody(guide)}</p>
            ) : null}
            {isPrivate && guide.publicStatus ? (
              <StatusPill tone="wait">{guide.publicStatus}</StatusPill>
            ) : null}
            {guideHref ? (
              <Link className="mt-2 w-fit text-sm font-semibold text-po-brand underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand" href={guideHref}>
                Open guide
              </Link>
            ) : isPrivate && guide.slug ? (
              <p className="text-xs leading-5 text-po-muted">Slug: {guide.slug}</p>
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
        <li className="border-l-4 border-po-brand bg-po-canvas p-5 shadow-sm" key={`${event.label || "event"}-${index}`}>
          <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
            {event.dateOrSequence || `Event ${index + 1}`}
          </p>
          <h3 className="mt-3 text-lg font-semibold text-po-ink">{event.label || "Untitled event"}</h3>
          {portableTextToPlainText(event.body) ? (
            <p className="mt-3 text-sm leading-6 text-po-body">{portableTextToPlainText(event.body)}</p>
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
        <article className="border border-po-line bg-po-canvas p-5 shadow-sm" key={`${fact.label || "fact"}-${index}`}>
          <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
            {fact.label || `Fact ${index + 1}`}
          </p>
          {fact.value ? (
            <p className="mt-3 text-2xl font-semibold leading-tight text-po-ink">{fact.value}</p>
          ) : null}
          {fact.publicUseStatus ? (
            <p className="mt-3 text-xs font-semibold text-po-muted">{fact.publicUseStatus}</p>
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
        <article className="border border-po-line bg-po-canvas p-5 shadow-sm" key={`${column.title || "column"}-${index}`}>
          <h3 className="text-xl font-semibold text-po-ink">{column.title || "Untitled column"}</h3>
          {portableTextToPlainText(column.body) ? (
            <p className="mt-3 text-sm leading-6 text-po-body">{portableTextToPlainText(column.body)}</p>
          ) : null}
          {column.contentRef ? (
            <div className="mt-4 border-t border-po-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
                {column.contentRef._type || "Referenced content"}
              </p>
              <p className="mt-2 text-sm font-semibold text-po-ink">{linkedRecordTitle(column.contentRef)}</p>
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
        <article className="grid content-start gap-3 border border-po-line bg-po-soft p-4" key={asset._id || `${asset.title || "asset"}-${index}`}>
          <div className="aspect-[4/3] border border-po-line bg-po-canvas p-4">
            <div className="flex h-full items-end border border-dashed border-po-subtle bg-po-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-po-muted">
                {(isPrivate ? asset.sourceSystem : undefined) || "Asset preview"}
              </p>
            </div>
          </div>
          <h3 className="text-base font-semibold text-po-ink">{asset.title || asset.assetName || "Untitled asset"}</h3>
          {isPrivate && asset.savedFile ? (
            <p className="break-words text-xs leading-5 text-po-muted">{asset.savedFile}</p>
          ) : null}
          {isPrivate ? (
            <div className="flex flex-wrap gap-2">
              {asset.provenanceStatus ? <StatusPill tone="wait">{asset.provenanceStatus}</StatusPill> : null}
              {asset.approvalStatus ? <StatusPill>{asset.approvalStatus}</StatusPill> : null}
            </div>
          ) : null}
          {isPrivate && asset.pageUsage?.length ? (
            <p className="text-xs leading-5 text-po-muted">{asset.pageUsage.join(", ")}</p>
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
        <div className="grid gap-4 border border-po-brand-line bg-po-brand-soft p-5 md:grid-cols-[minmax(0,0.8fr)_minmax(260px,0.4fr)] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
              Learn CMS path
            </p>
            <h3 className="mt-2 text-xl font-semibold text-po-ink">
              Guide cards route into approved Learn URLs
            </h3>
            <p className="mt-3 text-sm leading-6 text-po-body">
              The Learn hub can list Sanity guide references while each guide route keeps its own source, claim, and module review path.
            </p>
          </div>
          <div className="grid gap-2 border border-po-brand-line bg-po-canvas p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-po-muted">Rendered guide candidates</p>
            <p className="text-3xl font-semibold text-po-ink">{guideCount}</p>
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
      <span className="text-po-brand">{label}</span>
      {eligibility ? <span className="text-po-muted">{eligibility}</span> : null}
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
            <p className="text-sm font-semibold uppercase tracking-normal text-po-brand-line">
              {module.eyebrow}
            </p>
          ) : null}
          <h2 className="text-5xl font-semibold leading-none sm:text-6xl" id={id}>
            {moduleTitle(module, "Official Presidential", renderMode)}
          </h2>
          {moduleBody(module) ? (
            <p className="max-w-2xl text-lg leading-8 text-po-on-dark-muted">{moduleBody(module)}</p>
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
        <div className="min-h-96 border border-po-on-dark/15 bg-po-canvas/10 p-5">
          <div className="flex h-full min-h-80 items-end border border-po-brand-line bg-po-brand-soft p-5">
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-po-brand-strong">
                {assets[0]?.title || assets[0]?.assetName || "CMS-driven hero media slot"}
              </p>
              {isPrivate && assets[0]?.savedFile ? (
                <p className="text-xs leading-5 text-po-muted">{assets[0].savedFile}</p>
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
          <p className="text-sm font-black uppercase tracking-normal text-po-brand">
            Act {actNumber}
          </p>
          <h2 className="text-3xl font-semibold leading-tight text-po-ink sm:text-4xl" id={id}>
            {moduleTitle(module, `Homepage act ${actNumber}`, renderMode)}
          </h2>
          {moduleBody(module) ? (
            <p className="max-w-2xl text-base leading-7 text-po-body">{moduleBody(module)}</p>
          ) : null}
          {ctaHref && cta.label ? (
            <div>
              <CtaLink href={ctaHref} variant="secondary">
                {cta.label}
              </CtaLink>
            </div>
          ) : null}
        </div>
        <div className="aspect-[4/3] border border-po-line bg-po-canvas p-4 shadow-sm">
          <div className="flex h-full items-end border border-po-line bg-po-soft p-4">
            <p className="text-sm font-semibold text-po-body">CMS act media slot</p>
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
              <article className="border border-po-line bg-po-canvas p-5 shadow-sm" key={`${item._id || item.title || item.name || item.label || "item"}-${index}`}>
                <p className="text-xs font-semibold uppercase tracking-normal text-po-brand">
                  {item.label || item._type || `Item ${index + 1}`}
                </p>
                <h3 className="mt-4 text-xl font-semibold text-po-ink">{item.title || item.name || "Untitled"}</h3>
                {item.description ? (
                  <p className="mt-3 text-sm leading-6 text-po-body">{item.description}</p>
                ) : null}
                {item.slug ? (
                  <p className="mt-3 text-xs leading-5 text-po-muted">Slug: {item.slug}</p>
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
  return Boolean(
    profile &&
      isApprovedPublicStatus(profile.publicUseStatus) &&
      (!profile.emailConflictStatus ||
        isApprovedPublicStatus(profile.emailConflictStatus)),
  );
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

  if (!contactProfile) {
    return (
      <div className="grid gap-3 border border-po-on-dark/15 bg-po-canvas/10 p-4">
        <p className="text-sm font-semibold uppercase tracking-normal text-po-brand-line">
          Official contact details
        </p>
        <p className="text-sm leading-6 text-po-on-dark-muted">
          Contact details will appear here after the official contact profile is connected.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border border-po-on-dark/15 bg-po-canvas/10 p-4">
      <p className="text-sm font-semibold uppercase tracking-normal text-po-brand-line">
        {contactProfile.title || "Official contact details"}
      </p>
      {showContactDetails && contactProfile.phone ? (
        <p className="text-base font-semibold text-po-on-dark">
          {contactProfile.phone}
        </p>
      ) : null}
      {showContactDetails && displayEmail ? (
        <p className="break-words text-base font-semibold text-po-on-dark">
          {displayEmail}
        </p>
      ) : null}
      {!showContactDetails ? (
        <p className="text-sm leading-6 text-po-on-dark-muted">
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
        <article className="border border-po-on-dark/15 bg-po-canvas/10 p-4" key={panel.title}>
          <h3 className="text-lg font-semibold leading-tight text-po-on-dark">{panel.title}</h3>
          <p className="mt-3 text-sm leading-6 text-po-on-dark-muted">{panel.body}</p>
        </article>
      ))}
      {isPrivate && resolvedVariant === "locator" && module.stateCandidates?.length ? (
        <article className="border border-po-on-dark/15 bg-po-canvas/10 p-4 md:col-span-3">
          <h3 className="text-lg font-semibold leading-tight text-po-on-dark">State candidates</h3>
          <p className="mt-3 text-sm leading-6 text-po-on-dark-muted">{module.stateCandidates.join(", ")}</p>
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
            <p className="text-sm font-semibold uppercase tracking-normal text-po-brand-line">
              {resolvedVariant === "locator" ? "Retail discovery" : "Contact routing"}
            </p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl" id={id}>
              {moduleTitle(module, resolvedVariant === "locator" ? "Find Presidential" : "Connect with Presidential", renderMode)}
            </h2>
            {moduleBody(module) ? (
              <p className="max-w-2xl text-base leading-7 text-po-on-dark-muted">{moduleBody(module)}</p>
            ) : null}
            {ctaHref && cta.label ? (
              <CtaLink href={ctaHref} variant="primary">
                {cta.label}
              </CtaLink>
            ) : null}
          </div>
          <div className="grid gap-4 border border-po-on-dark/15 bg-po-canvas/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-po-brand-line">
              {resolvedVariant === "locator" ? "Locator shell" : "Contact shell"}
            </p>
            <KeyValueList entries={entries} />
            {resolvedVariant === "locator" ? (
              <p className="text-sm leading-6 text-po-on-dark-muted">
                Retailer listings appear only after licensed retailer records are verified.
              </p>
            ) : (
              <p className="text-sm leading-6 text-po-on-dark-muted">
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
      <div className="mx-auto max-w-5xl border border-po-line bg-po-canvas p-6 shadow-sm">
        <ModuleMeta module={module} renderMode={renderMode} />
        <h2 className="mt-3 text-2xl font-semibold text-po-ink" id={id}>
          {moduleTitle(module, `CMS module ${index + 1}`, renderMode)}
        </h2>
        {moduleBody(module) ? (
          <p className="mt-4 text-base leading-7 text-po-body">{moduleBody(module)}</p>
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
        <div className="mx-auto max-w-4xl border border-po-line bg-po-canvas p-6">
          <h2 className="text-2xl font-semibold text-po-ink" id="cms-empty-homepage-modules">
            No homepage modules found
          </h2>
          <p className="mt-3 text-sm leading-6 text-po-body">
            Add modules in Sanity and this route will render them here.
          </p>
        </div>
      </Scene>
    );
  }

  return <>{modules.map((module, index) => renderModule(module, index, renderMode, productRoute, supportRoute))}</>;
}
