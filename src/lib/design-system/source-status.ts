export type DesignSourceStatus =
  | "candidate"
  | "candidate_structure_only"
  | "asset_pending"
  | "font_pending"
  | "required_foundation"
  | "not_allowed";

export type DesignPublicUseStatus =
  | "internal_planning_only"
  | "blocked_pending_client_confirmation"
  | "blocked_pending_product_line_confirmation"
  | "blocked_pending_font_license"
  | "blocked_pending_motion_policy"
  | "blocked_pending_asset_approval"
  | "blocked_pending_route_publication"
  | "blocked_pending_catalog"
  | "blocked_pending_verification"
  | "not_allowed"
  | "approved_public";

export type ApprovalOwner =
  | "brand_design"
  | "brand_product"
  | "asset_rights"
  | "accessibility_ux"
  | "seo_route"
  | "legal_compliance"
  | "product_truth";

export const BLOCKED_PUBLIC_USE_STATUSES = [
  "blocked_pending_client_confirmation",
  "blocked_pending_product_line_confirmation",
  "blocked_pending_font_license",
  "blocked_pending_motion_policy",
  "blocked_pending_asset_approval",
  "blocked_pending_route_publication",
  "blocked_pending_catalog",
  "blocked_pending_verification",
  "not_allowed",
] as const satisfies readonly DesignPublicUseStatus[];

export function isPublicUseApproved(status: DesignPublicUseStatus): boolean {
  return status === "approved_public";
}

export function isBlockedForPublicUse(status: DesignPublicUseStatus): boolean {
  return (
    status !== "internal_planning_only" &&
    status !== "approved_public"
  );
}
