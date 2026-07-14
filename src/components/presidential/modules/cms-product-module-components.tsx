import Image from "next/image";
import Link from "next/link";

import { MediaSlot } from "../media/media-slot";

import type {
  SanityAssetRecord,
  SanityCard,
  SanityHomepageModule,
  SanityLinkedRecord,
} from "@/lib/cms/homepage";
import {
  isPublicCmsAsset,
  sanitizePublicCmsModule,
} from "@/lib/cms/public-content";

export type CmsProductRouteSlug = "moon-rocks" | "moon-pods" | "orbit";
export type CmsProductRenderMode = "public" | "private";

type CmsProductRouteProfile = {
  readonly slug: CmsProductRouteSlug;
  readonly title: string;
  readonly route: `/${CmsProductRouteSlug}`;
  readonly laneLabel: string;
  readonly mediaLabel: string;
  readonly role: string;
  readonly nextSteps: readonly string[];
};

type CmsProductCardModel = {
  readonly key: string;
  readonly title: string;
  readonly description?: string;
  readonly route?: string;
  readonly sourceStatus?: string;
  readonly routeGate?: string;
  readonly asset?: SanityAssetRecord;
};

const PRODUCT_ROUTE_PROFILES: readonly CmsProductRouteProfile[] = [
  {
    slug: "moon-rocks",
    title: "Moon Rocks",
    route: "/moon-rocks",
    laneLabel: "Flagship product platform",
    mediaLabel: "Moon Rocks media",
    role: "Product story, source-backed education, media candidates, and retail discovery belong to the official Moon Rocks lane.",
    nextSteps: [
      "Attach approved Moon Rocks product media",
      "Connect product facts to source proof",
      "Keep retailer discovery separate from product claims",
    ],
  },
  {
    slug: "moon-pods",
    title: "Moon Pods",
    route: "/moon-pods",
    laneLabel: "Pod product lane",
    mediaLabel: "Moon Pods media",
    role: "Moon Pods content can carry product education, format context, and approved media without merging into Orbit or Moon Rocks.",
    nextSteps: [
      "Resolve direct Moon Pods media mapping",
      "Confirm product naming and format facts",
      "Connect approved Moon Pods education modules",
    ],
  },
  {
    slug: "orbit",
    title: "Orbit",
    route: "/orbit",
    laneLabel: "Technology platform lane",
    mediaLabel: "Orbit media",
    role: "Orbit gets its own product-system lane so device, platform, and Moon Pods relationship facts stay controlled.",
    nextSteps: [
      "Resolve direct Orbit media mapping",
      "Confirm Orbit technology relationship facts",
      "Connect approved platform education modules",
    ],
  },
];

const PRODUCT_ROUTE_HREFS = new Set<string>(PRODUCT_ROUTE_PROFILES.map((profile) => profile.route));
function isPrivateMode(renderMode: CmsProductRenderMode): boolean {
  return renderMode === "private";
}

function canRenderPublicAssetMedia(asset: SanityAssetRecord): boolean {
  return isPublicCmsAsset(asset);
}

function recordTitle(record?: SanityLinkedRecord): string {
  return record?.title || record?.name || record?.guideTopic || record?.slug || "";
}

function recordDescription(record?: SanityLinkedRecord): string {
  return record?.intro || record?.positioningLine || record?.shortDescription || "";
}

function moduleTextSignature(module: SanityHomepageModule): string {
  return [
    module._key,
    module._type,
    module.heading,
    module.headline,
    module.title,
    module.description,
    module.moduleControl?.internalLabel,
    module.platform?.slug,
    recordTitle(module.platform),
    module.format?.slug,
    recordTitle(module.format),
    ...(module.relatedProductLinks || []).flatMap((record) => [record.slug, recordTitle(record)]),
    ...(module.cards || []).flatMap((card) => [
      card.title,
      card.route,
      card.contentRef?.slug,
      recordTitle(card.contentRef),
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getCmsProductRouteProfile(
  module: SanityHomepageModule,
  productRoute?: CmsProductRouteSlug,
): CmsProductRouteProfile | null {
  if (productRoute) {
    return PRODUCT_ROUTE_PROFILES.find((profile) => profile.slug === productRoute) || null;
  }

  const signature = moduleTextSignature(module);
  return PRODUCT_ROUTE_PROFILES.find(
    (profile) => signature.includes(profile.slug) || signature.includes(profile.title.toLowerCase()),
  ) || null;
}

export function collectCmsProductAssets(module: SanityHomepageModule): readonly SanityAssetRecord[] {
  const assets = [
    module.heroAssetRecord,
    module.assetRecord,
    ...(module.assetRecords || []),
    ...(module.assetRecordRefs || []),
    ...(module.cards || []).map((card) => card.assetRecord),
  ].filter((asset): asset is SanityAssetRecord => Boolean(asset));

  const seen = new Set<string>();
  return assets.filter((asset, index) => {
    const key = asset._id || asset.savedFile || asset.assetName || asset.title || `asset-${index}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function linkedRecordToCard(record: SanityLinkedRecord, index: number): CmsProductCardModel {
  return {
    key: record._id || record.slug || `record-${index}`,
    title: recordTitle(record) || "Product reference",
    description: recordDescription(record),
    route: record.slug ? `/${record.slug}` : undefined,
  };
}

function sanityCardToCard(card: SanityCard, index: number): CmsProductCardModel {
  return {
    key: card.contentRef?._id || card.route || card.title || `card-${index}`,
    title: card.title || recordTitle(card.contentRef) || "Product card",
    description: recordDescription(card.contentRef),
    route: card.route || (card.contentRef?.slug ? `/${card.contentRef.slug}` : undefined),
    sourceStatus: card.sourceStatus,
    routeGate: card.routeGate,
    asset: card.assetRecord,
  };
}

export function collectCmsProductCards(
  module: SanityHomepageModule,
  productRoute?: CmsProductRouteSlug,
  renderMode: CmsProductRenderMode = "private",
): readonly CmsProductCardModel[] {
  const profile = getCmsProductRouteProfile(module, productRoute);
  const cards = [
    ...(profile && isPrivateMode(renderMode)
      ? [{
          key: profile.slug,
          title: profile.title,
          description: profile.role,
          route: profile.route,
        }]
      : []),
    ...(module.cards || []).map(sanityCardToCard),
    ...(module.platform ? [linkedRecordToCard(module.platform, 0)] : []),
    ...(module.format ? [linkedRecordToCard(module.format, 1)] : []),
    ...(module.relatedProductLinks || []).map((record, index) => linkedRecordToCard(record, index + 2)),
    ...(module.relatedPlatforms || []).map((record, index) => linkedRecordToCard(record, index + 20)),
  ];

  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = `${card.title}|${card.route || ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  readonly children: string;
  readonly tone?: "ok" | "wait" | "neutral";
}) {
  const toneClass = tone === "ok"
    ? "border-po-brand-line bg-po-brand-soft text-po-brand-ink"
    : tone === "wait"
      ? "border-po-gold bg-po-gold-soft text-po-gold-ink"
      : "border-po-line bg-po-soft text-po-body";

  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold uppercase tracking-normal ${toneClass}`}>
      {children}
    </span>
  );
}

function ProductRouteLink({
  renderMode,
  route,
}: {
  readonly renderMode: CmsProductRenderMode;
  readonly route?: string;
}) {
  if (!route) {
    return null;
  }

  if (PRODUCT_ROUTE_HREFS.has(route)) {
    return (
      <Link
        className="mt-2 w-fit text-sm font-semibold text-po-brand-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-po-brand"
        href={route as `/${CmsProductRouteSlug}`}
      >
        Open route
      </Link>
    );
  }

  return isPrivateMode(renderMode)
    ? <p className="mt-2 break-words text-xs leading-5 text-po-muted">{route}</p>
    : null;
}

export function CmsProductAssetCard({
  asset,
  index,
  renderMode = "public",
}: {
  readonly asset: SanityAssetRecord;
  readonly index?: number;
  readonly renderMode?: CmsProductRenderMode;
}) {
  const isPrivate = isPrivateMode(renderMode);
  const title = asset.title || asset.assetName || `Product asset ${typeof index === "number" ? index + 1 : ""}`.trim();
  const canShowAssetMedia = isPrivate || canRenderPublicAssetMedia(asset);

  if (!canShowAssetMedia) {
    return null;
  }

  return (
    <article className="grid content-start gap-3 border border-po-line bg-po-soft p-4">
      {canShowAssetMedia && asset.assetUrl ? (
        <figure
          aria-label={asset.altText || title}
          className="relative aspect-[4/3] overflow-hidden border border-po-line bg-po-canvas"
          role="img"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="object-contain object-center"
            fill
            sizes="(min-width: 1024px) 35vw, 100vw"
            src={asset.assetUrl}
          />
        </figure>
      ) : (
        <MediaSlot
          aspectClassName="aspect-[4/3]"
          kind="wireframe_media_block"
          label={isPrivate ? asset.sourceSystem || "Product asset" : "Product media"}
          note={title}
        />
      )}
      <div className="grid gap-2">
        <h3 className="text-base font-semibold leading-tight text-po-ink">{title}</h3>
        {isPrivate && asset.savedFile ? (
          <p className="break-words text-xs leading-5 text-po-muted">{asset.savedFile}</p>
        ) : null}
        {isPrivate ? (
          <div className="flex flex-wrap gap-2">
            {asset.provenanceStatus ? <StatusPill tone="wait">{asset.provenanceStatus}</StatusPill> : null}
            {asset.approvalStatus ? <StatusPill>{asset.approvalStatus}</StatusPill> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function CmsProductCard({
  card,
  renderMode = "public",
}: {
  readonly card: CmsProductCardModel;
  readonly renderMode?: CmsProductRenderMode;
}) {
  const isPrivate = isPrivateMode(renderMode);

  return (
    <article className="grid content-start gap-3 border border-po-line bg-po-canvas p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {isPrivate && card.sourceStatus ? <StatusPill tone="wait">{card.sourceStatus}</StatusPill> : null}
        {isPrivate && card.routeGate ? <StatusPill>{card.routeGate}</StatusPill> : null}
        {(!isPrivate || (!card.sourceStatus && !card.routeGate)) ? <StatusPill>Product</StatusPill> : null}
      </div>
      <h3 className="text-lg font-semibold leading-tight text-po-ink">{card.title}</h3>
      {card.description ? (
        <p className="text-sm leading-6 text-po-body">{card.description}</p>
      ) : null}
      <ProductRouteLink renderMode={renderMode} route={card.route} />
      {card.asset ? (
        <p className="text-xs font-semibold text-po-muted">
          {card.asset.title || card.asset.assetName || "Asset attached"}
        </p>
      ) : null}
    </article>
  );
}

export function CmsProductRoutePanel({
  module,
  productRoute,
}: {
  readonly module: SanityHomepageModule;
  readonly productRoute?: CmsProductRouteSlug;
}) {
  const profile = getCmsProductRouteProfile(module, productRoute);

  if (!profile) {
    return null;
  }

  return (
    <aside className="grid gap-4 border border-po-brand-line bg-po-brand-soft p-5">
      <div className="flex flex-wrap gap-2">
        <StatusPill tone="ok">{profile.laneLabel}</StatusPill>
        <StatusPill>{profile.route}</StatusPill>
      </div>
      <div>
        <h3 className="text-xl font-semibold leading-tight text-po-ink">{profile.title} CMS product path</h3>
        <p className="mt-3 text-sm leading-6 text-po-body">{profile.role}</p>
      </div>
      <ol className="grid gap-2">
        {profile.nextSteps.map((step, index) => (
          <li className="flex items-center gap-3 border border-po-brand-line bg-po-canvas p-3 text-sm font-semibold text-po-ink" key={step}>
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center bg-po-brand text-po-on-dark"
            >
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function CmsProductModuleComponents({
  module,
  productRoute,
  renderMode = "public",
}: {
  readonly module: SanityHomepageModule;
  readonly productRoute?: CmsProductRouteSlug;
  readonly renderMode?: CmsProductRenderMode;
}) {
  const isPrivate = isPrivateMode(renderMode);
  const renderableModule = isPrivate ? module : sanitizePublicCmsModule(module);
  const profile = getCmsProductRouteProfile(renderableModule, productRoute);
  const cards = collectCmsProductCards(renderableModule, productRoute, renderMode);
  const assets = collectCmsProductAssets(renderableModule).filter(
    (asset) => isPrivate || canRenderPublicAssetMedia(asset),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.45fr)]">
      <div className="grid gap-4">
        {cards.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <CmsProductCard card={card} key={card.key} renderMode={renderMode} />
            ))}
          </div>
        ) : isPrivate ? (
          <div className="border border-po-line bg-po-canvas p-5">
            <p className="text-sm leading-6 text-po-body">
              Product cards can render here once Sanity modules provide platform, format, related product, or card references.
            </p>
          </div>
        ) : null}
        {isPrivate ? <CmsProductRoutePanel module={renderableModule} productRoute={productRoute} /> : null}
      </div>
      {assets.length || isPrivate ? (
        <div className="grid content-start gap-4 border border-po-line bg-po-soft p-5">
        <p className="text-sm font-semibold uppercase tracking-normal text-po-brand-ink">
          {profile?.mediaLabel || "Product media"}
        </p>
        {assets.length ? (
          <div className="grid gap-4">
            {assets.slice(0, 4).map((asset, index) => (
              <CmsProductAssetCard asset={asset} index={index} key={asset._id || asset.savedFile || asset.assetName || `${profile?.slug || "asset"}-${index}`} renderMode={renderMode} />
            ))}
          </div>
        ) : isPrivate ? (
          <p className="text-sm leading-6 text-po-body">
            Product media cards will appear here when Sanity asset records are attached to the module.
          </p>
        ) : null}
        </div>
      ) : null}
    </div>
  );
}
