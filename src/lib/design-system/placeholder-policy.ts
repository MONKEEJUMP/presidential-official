import type { DesignPublicUseStatus } from "./source-status";

export type PlaceholderKind =
  | "wireframe_media_block"
  | "neutral_aspect_ratio_box"
  | "candidate_color_token"
  | "candidate_font_token"
  | "internal_claim_slot"
  | "product_visual_placeholder"
  | "product_card_placeholder"
  | "retail_locator_placeholder"
  | "ai_packaging_mock"
  | "fake_product_data"
  | "fake_retailer_data"
  | "unapproved_logo_redraw";

export type PlaceholderPolicyRecord = {
  readonly kind: PlaceholderKind;
  readonly allowedNow: boolean;
  readonly requiredStatus:
    | "internal_placeholder"
    | "candidate"
    | "blocked_pending_proof_legal"
    | "blocked_pending_asset_approval"
    | "blocked_pending_catalog"
    | "blocked_pending_verification"
    | "not_allowed";
  readonly forbiddenPublicSurfaces: readonly PublicSurface[];
  readonly requiredBeforePublicUse: string;
  readonly publicUnlock: false;
};

export type PublicSurface =
  | "public_page"
  | "metadata"
  | "open_graph"
  | "twitter_card"
  | "schema"
  | "sitemap"
  | "image_sitemap"
  | "product_row"
  | "retailer_row"
  | "route_publication"
  | "locator"
  | "localbusiness_schema";

export const PUBLIC_SEO_SURFACES = [
  "public_page",
  "metadata",
  "open_graph",
  "twitter_card",
  "schema",
  "sitemap",
  "image_sitemap",
  "product_row",
  "retailer_row",
  "route_publication",
  "locator",
  "localbusiness_schema",
] as const satisfies readonly PublicSurface[];

export const PUBLIC_SEO_SURFACE_GUARD_LABEL =
  "metadata, Open Graph, schema, sitemap, product, retailer, locator";

export const PLACEHOLDER_POLICIES = [
  {
    kind: "wireframe_media_block",
    allowedNow: true,
    requiredStatus: "internal_placeholder",
    forbiddenPublicSurfaces: [
      "metadata",
      "open_graph",
      "schema",
      "sitemap",
      "image_sitemap",
    ],
    requiredBeforePublicUse: "Approved source asset and rights",
    publicUnlock: false,
  },
  {
    kind: "neutral_aspect_ratio_box",
    allowedNow: true,
    requiredStatus: "internal_placeholder",
    forbiddenPublicSurfaces: [
      "metadata",
      "open_graph",
      "schema",
      "sitemap",
      "image_sitemap",
    ],
    requiredBeforePublicUse: "Approved source asset and dimensions",
    publicUnlock: false,
  },
  {
    kind: "candidate_color_token",
    allowedNow: true,
    requiredStatus: "candidate",
    forbiddenPublicSurfaces: ["metadata", "schema", "route_publication"],
    requiredBeforePublicUse: "Official color value and brand approval",
    publicUnlock: false,
  },
  {
    kind: "candidate_font_token",
    allowedNow: true,
    requiredStatus: "candidate",
    forbiddenPublicSurfaces: ["metadata", "schema", "route_publication"],
    requiredBeforePublicUse: "Official font choice and license",
    publicUnlock: false,
  },
  {
    kind: "internal_claim_slot",
    allowedNow: true,
    requiredStatus: "blocked_pending_proof_legal",
    forbiddenPublicSurfaces: ["public_page", "metadata", "schema"],
    requiredBeforePublicUse: "Proof, legal, and compliance approval",
    publicUnlock: false,
  },
  {
    kind: "product_visual_placeholder",
    allowedNow: true,
    requiredStatus: "blocked_pending_asset_approval",
    forbiddenPublicSurfaces: [
      "public_page",
      "open_graph",
      "schema",
      "sitemap",
      "image_sitemap",
    ],
    requiredBeforePublicUse:
      "Asset rights, product relationship, route use, alt text, and caption approval",
    publicUnlock: false,
  },
  {
    kind: "product_card_placeholder",
    allowedNow: true,
    requiredStatus: "blocked_pending_catalog",
    forbiddenPublicSurfaces: [
      "public_page",
      "product_row",
      "schema",
      "route_publication",
    ],
    requiredBeforePublicUse: "Official catalog and product approval",
    publicUnlock: false,
  },
  {
    kind: "retail_locator_placeholder",
    allowedNow: true,
    requiredStatus: "blocked_pending_verification",
    forbiddenPublicSurfaces: [
      "public_page",
      "retailer_row",
      "locator",
      "localbusiness_schema",
      "sitemap",
    ],
    requiredBeforePublicUse: "Verified store data and locator publication approval",
    publicUnlock: false,
  },
  {
    kind: "ai_packaging_mock",
    allowedNow: false,
    requiredStatus: "not_allowed",
    forbiddenPublicSurfaces: PUBLIC_SEO_SURFACES,
    requiredBeforePublicUse: "Do not use as source truth",
    publicUnlock: false,
  },
  {
    kind: "fake_product_data",
    allowedNow: false,
    requiredStatus: "not_allowed",
    forbiddenPublicSurfaces: PUBLIC_SEO_SURFACES,
    requiredBeforePublicUse: "Official catalog required",
    publicUnlock: false,
  },
  {
    kind: "fake_retailer_data",
    allowedNow: false,
    requiredStatus: "not_allowed",
    forbiddenPublicSurfaces: PUBLIC_SEO_SURFACES,
    requiredBeforePublicUse: "Verified store data required",
    publicUnlock: false,
  },
  {
    kind: "unapproved_logo_redraw",
    allowedNow: false,
    requiredStatus: "not_allowed",
    forbiddenPublicSurfaces: PUBLIC_SEO_SURFACES,
    requiredBeforePublicUse: "Official logo files and usage approval",
    publicUnlock: false,
  },
] as const satisfies readonly PlaceholderPolicyRecord[];

export function getPlaceholderPolicy(
  kind: PlaceholderKind,
): PlaceholderPolicyRecord {
  const policy = PLACEHOLDER_POLICIES.find((entry) => entry.kind === kind);

  if (!policy) {
    throw new Error(`Unknown Presidential placeholder policy: ${kind}`);
  }

  return policy;
}

export function isPlaceholderAllowedForInternalUse(
  kind: PlaceholderKind,
): boolean {
  return getPlaceholderPolicy(kind).allowedNow;
}

export function canPlaceholderFeedPublicSurface(
  kind: PlaceholderKind,
  surface: PublicSurface,
  publicUseStatus: DesignPublicUseStatus,
): boolean {
  const policy = getPlaceholderPolicy(kind);

  return (
    policy.allowedNow &&
    publicUseStatus === "approved_public" &&
    !policy.forbiddenPublicSurfaces.includes(surface)
  );
}
