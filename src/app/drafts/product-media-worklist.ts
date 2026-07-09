import "server-only";

import {existsSync, readFileSync} from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(process.cwd(), "..");

const SUMMARY_PATHS = {
  approvalWorklist: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "sanity-product-media-approval-worklist",
    "product-media-approval-worklist-summary.json",
  ),
  reviewPackets: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "product-media-review-packets",
    "product-media-review-packets-summary.json",
  ),
  assetBridge: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "sanity-asset-source-inventory-bridge",
    "asset-source-inventory-bridge-summary.json",
  ),
  clientDirection: path.join(
    REPO_ROOT,
    "sources",
    "spud",
    "work",
    "sanity-product-media-client-direction-workflow",
    "product-media-client-direction-worklist-summary.json",
  ),
} as const;

const PRODUCT_PLATFORM_BY_SLUG: Record<string, string | undefined> = {
  "moon-rocks": "Moon Rocks",
  "moon-pods": "Moon Pods",
  orbit: "Orbit",
};

type Counts = Record<string, number | undefined>;

type ProductCatalogItem = {
  readonly title?: string;
  readonly productName?: string;
  readonly routeCandidate?: string;
  readonly publicUseStatus?: string;
};

type DirectMediaGap = {
  readonly platform?: string;
  readonly routeCandidate?: string;
  readonly routeScope?: string;
  readonly gapType?: string;
  readonly requestedAssets?: string;
};

type ProductMediaApprovalSummary = {
  readonly status?: string;
  readonly counts?: Counts;
  readonly queueCounts?: Counts;
  readonly publicBoundary?: {
    readonly publishedPresidentialDocs?: number;
    readonly unlockCount?: number;
  };
  readonly packetBoundary?: string;
  readonly approvedAssets?: boolean;
  readonly publicUseAuthorized?: boolean;
  readonly publicUnlock?: string;
  readonly productCatalogItems?: readonly ProductCatalogItem[];
};

type ProductMediaReviewPacketsSummary = {
  readonly status?: string;
  readonly counts?: Counts & {
    readonly byPlatform?: Counts;
  };
  readonly gaps?: readonly DirectMediaGap[];
  readonly boundaries?: {
    readonly packetBoundary?: string;
    readonly approvedAssets?: boolean;
    readonly publicUseAuthorized?: boolean;
    readonly approvalEffect?: string;
    readonly publicUnlock?: string;
    readonly mediaPromotion?: string;
    readonly productRefsPatch?: string;
    readonly nextSafeUse?: string;
  };
};

type AssetSourceBridgeSummary = {
  readonly status?: string;
  readonly totals?: Counts;
  readonly layers?: {
    readonly urgentPackage?: {
      readonly mediaFiles?: number;
      readonly images?: number;
      readonly videos?: number;
    };
    readonly googleDrive?: {
      readonly totalRows?: number;
      readonly images?: number;
      readonly videos?: number;
    };
    readonly wixOriginalSite?: {
      readonly totalRows?: number;
      readonly images?: number;
      readonly videos?: number;
    };
    readonly sanityInternalCandidateDocs?: Counts;
  };
  readonly publicBoundary?: {
    readonly publishedPresidentialDocs?: number;
    readonly unlockCount?: number;
  };
};

type ClientDirectionItem = {
  readonly reviewGroupKeySnapshot?: string;
  readonly observedCandidateName?: string;
  readonly subfamilyBucket?: string;
  readonly normalizedStrainOrFlavor?: string;
  readonly directionStatus?: string;
  readonly directionPriority?: string;
  readonly nextInternalAction?: string;
  readonly frictionTier?: string;
  readonly locked?: boolean;
};

type ProductMediaClientDirectionSummary = {
  readonly status?: string;
  readonly counts?: Counts;
  readonly queueCounts?: Counts;
  readonly laneCounts?: Counts;
  readonly countsByDirectionStatus?: Counts;
  readonly countsByPriority?: Counts;
  readonly packetBoundary?: string;
  readonly approvedAssets?: boolean;
  readonly publicUseAuthorized?: boolean;
  readonly publicUnlock?: string;
  readonly sanityMutation?: string;
  readonly items?: readonly ClientDirectionItem[];
};

export type ProductMediaWorklist = {
  readonly platform?: string;
  readonly status: "available" | "not_product_platform" | "missing_summary";
  readonly summaries: {
    readonly approvalWorklist?: ProductMediaApprovalSummary;
    readonly reviewPackets?: ProductMediaReviewPacketsSummary;
    readonly assetBridge?: AssetSourceBridgeSummary;
    readonly clientDirection?: ProductMediaClientDirectionSummary;
  };
  readonly routeCatalogItems: readonly ProductCatalogItem[];
  readonly directMediaGap?: DirectMediaGap;
  readonly directionItems: readonly ClientDirectionItem[];
};

function readJsonFile<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function readProductMediaWorklist(slug: string): ProductMediaWorklist {
  const platform = PRODUCT_PLATFORM_BY_SLUG[slug];

  if (!platform) {
    return {
      status: "not_product_platform",
      summaries: {},
      routeCatalogItems: [],
      directionItems: [],
    };
  }

  const approvalWorklist = readJsonFile<ProductMediaApprovalSummary>(SUMMARY_PATHS.approvalWorklist);
  const reviewPackets = readJsonFile<ProductMediaReviewPacketsSummary>(SUMMARY_PATHS.reviewPackets);
  const assetBridge = readJsonFile<AssetSourceBridgeSummary>(SUMMARY_PATHS.assetBridge);
  const clientDirection = readJsonFile<ProductMediaClientDirectionSummary>(SUMMARY_PATHS.clientDirection);

  if (!approvalWorklist || !reviewPackets || !assetBridge || !clientDirection) {
    return {
      platform,
      status: "missing_summary",
      summaries: {
        approvalWorklist,
        reviewPackets,
        assetBridge,
        clientDirection,
      },
      routeCatalogItems: [],
      directionItems: [],
    };
  }

  const route = `/${slug}`;
  const routeCatalogItems = (approvalWorklist.productCatalogItems || []).filter(
    (item) => item.routeCandidate === route,
  );
  const directMediaGap = (reviewPackets.gaps || []).find(
    (gap) => gap.platform === platform || gap.routeCandidate === route,
  );

  return {
    platform,
    status: "available",
    summaries: {
      approvalWorklist,
      reviewPackets,
      assetBridge,
      clientDirection,
    },
    routeCatalogItems,
    directMediaGap,
    directionItems: slug === "moon-rocks" ? clientDirection.items || [] : [],
  };
}
