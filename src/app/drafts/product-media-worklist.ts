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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalRecord(value: Record<string, unknown>, key: string) {
  return value[key] === undefined || isRecord(value[key]);
}

function isOptionalRecordArray(value: Record<string, unknown>, key: string) {
  const entries = value[key];
  return (
    entries === undefined ||
    (Array.isArray(entries) && entries.every(isRecord))
  );
}

function isProductMediaApprovalSummary(
  value: unknown,
): value is ProductMediaApprovalSummary {
  if (!isRecord(value)) return false;

  return (
    ["counts", "queueCounts", "publicBoundary"].every((key) =>
      isOptionalRecord(value, key),
    ) && isOptionalRecordArray(value, "productCatalogItems")
  );
}

function isProductMediaReviewPacketsSummary(
  value: unknown,
): value is ProductMediaReviewPacketsSummary {
  if (!isRecord(value)) return false;

  const counts = value.counts;
  return (
    isOptionalRecord(value, "counts") &&
    (counts === undefined ||
      (isRecord(counts) && isOptionalRecord(counts, "byPlatform"))) &&
    isOptionalRecord(value, "boundaries") &&
    isOptionalRecordArray(value, "gaps")
  );
}

function isAssetSourceBridgeSummary(
  value: unknown,
): value is AssetSourceBridgeSummary {
  if (!isRecord(value)) return false;

  const layers = value.layers;
  return (
    ["totals", "layers", "publicBoundary"].every((key) =>
      isOptionalRecord(value, key),
    ) &&
    (layers === undefined ||
      (isRecord(layers) &&
        [
          "urgentPackage",
          "googleDrive",
          "wixOriginalSite",
          "sanityInternalCandidateDocs",
        ].every((key) => isOptionalRecord(layers, key))))
  );
}

function isProductMediaClientDirectionSummary(
  value: unknown,
): value is ProductMediaClientDirectionSummary {
  if (!isRecord(value)) return false;

  return (
    [
      "counts",
      "queueCounts",
      "laneCounts",
      "countsByDirectionStatus",
      "countsByPriority",
    ].every((key) => isOptionalRecord(value, key)) &&
    isOptionalRecordArray(value, "items")
  );
}

function readJsonFile<T>(
  filePath: string,
  validate: (value: unknown) => value is T,
): T | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const value: unknown = JSON.parse(readFileSync(filePath, "utf8"));
    return validate(value) ? value : undefined;
  } catch {
    return undefined;
  }
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

  const approvalWorklist = readJsonFile(
    SUMMARY_PATHS.approvalWorklist,
    isProductMediaApprovalSummary,
  );
  const reviewPackets = readJsonFile(
    SUMMARY_PATHS.reviewPackets,
    isProductMediaReviewPacketsSummary,
  );
  const assetBridge = readJsonFile(
    SUMMARY_PATHS.assetBridge,
    isAssetSourceBridgeSummary,
  );
  const clientDirection = readJsonFile(
    SUMMARY_PATHS.clientDirection,
    isProductMediaClientDirectionSummary,
  );

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
