import type {
  ApprovalOwner,
  DesignPublicUseStatus,
  DesignSourceStatus,
} from "./source-status";

export type DesignTokenFamily =
  | "color"
  | "typography"
  | "spacing"
  | "layout"
  | "motion"
  | "media"
  | "interaction"
  | "accessibility";

export type DesignTokenRecord = {
  readonly family: DesignTokenFamily;
  readonly name: string;
  readonly blueprintRole: string;
  readonly candidateValue: string | null;
  readonly sourceStatus: DesignSourceStatus;
  readonly publicUseStatus: DesignPublicUseStatus;
  readonly requiredSource: string;
  readonly requiredApprovalOwner: ApprovalOwner;
  readonly implementationNote: string;
  readonly publicUnlock: false;
};

export const PRESIDENTIAL_DESIGN_TOKENS = [
  {
    family: "color",
    name: "color.brand.presidential_teal",
    blueprintRole: "Master brand accent",
    candidateValue: null,
    sourceStatus: "candidate",
    publicUseStatus: "blocked_pending_client_confirmation",
    requiredSource: "Official brand book or exact color value",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Use the role token only until the exact value is confirmed by the client.",
    publicUnlock: false,
  },
  {
    family: "color",
    name: "color.base.black",
    blueprintRole: "Canvas/background",
    candidateValue: null,
    sourceStatus: "candidate",
    publicUseStatus: "blocked_pending_client_confirmation",
    requiredSource: "Official brand book or exact color value",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Keep neutral scaffold values separate from final brand approval.",
    publicUnlock: false,
  },
  {
    family: "color",
    name: "color.base.white",
    blueprintRole: "Clarity/text",
    candidateValue: null,
    sourceStatus: "candidate",
    publicUseStatus: "blocked_pending_client_confirmation",
    requiredSource: "Official brand book or exact color value",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Final use still requires contrast checks and brand confirmation.",
    publicUnlock: false,
  },
  {
    family: "color",
    name: "color.series.silver",
    blueprintRole: "Product-line role",
    candidateValue: null,
    sourceStatus: "candidate",
    publicUseStatus: "blocked_pending_product_line_confirmation",
    requiredSource: "Official product-line mapping and color value",
    requiredApprovalOwner: "brand_product",
    implementationNote:
      "Do not imply final product-line taxonomy until catalog approval exists.",
    publicUnlock: false,
  },
  {
    family: "color",
    name: "color.series.gold",
    blueprintRole: "Product-line role",
    candidateValue: null,
    sourceStatus: "candidate",
    publicUseStatus: "blocked_pending_product_line_confirmation",
    requiredSource: "Official product-line mapping and color value",
    requiredApprovalOwner: "brand_product",
    implementationNote:
      "Do not imply final product-line taxonomy until catalog approval exists.",
    publicUnlock: false,
  },
  {
    family: "color",
    name: "color.series.rose_gold",
    blueprintRole: "Product-line role",
    candidateValue: null,
    sourceStatus: "candidate",
    publicUseStatus: "blocked_pending_product_line_confirmation",
    requiredSource: "Official product-line mapping and color value",
    requiredApprovalOwner: "brand_product",
    implementationNote:
      "Do not imply final product-line taxonomy until catalog approval exists.",
    publicUnlock: false,
  },
  {
    family: "typography",
    name: "type.display",
    blueprintRole: "Large cinematic headlines",
    candidateValue: null,
    sourceStatus: "font_pending",
    publicUseStatus: "blocked_pending_font_license",
    requiredSource: "Official font choice or licensed font files",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Use readable scaffold typography until font and license approval exists.",
    publicUnlock: false,
  },
  {
    family: "typography",
    name: "type.body",
    blueprintRole: "Minimal body copy",
    candidateValue: null,
    sourceStatus: "font_pending",
    publicUseStatus: "blocked_pending_font_license",
    requiredSource: "Official font choice or licensed font files",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Body text must remain readable and mobile-first before final type approval.",
    publicUnlock: false,
  },
  {
    family: "spacing",
    name: "space.scene",
    blueprintRole: "Immersive scene spacing",
    candidateValue: null,
    sourceStatus: "candidate_structure_only",
    publicUseStatus: "internal_planning_only",
    requiredSource: "Design-system approval",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Foundation-only spacing role; not final public visual implementation.",
    publicUnlock: false,
  },
  {
    family: "layout",
    name: "layout.scene_height",
    blueprintRole: "Scene rhythm",
    candidateValue: null,
    sourceStatus: "candidate_structure_only",
    publicUseStatus: "internal_planning_only",
    requiredSource: "Design-system approval plus mobile QA",
    requiredApprovalOwner: "accessibility_ux",
    implementationNote:
      "Future scenes must avoid trapping mobile users in slow scroll sequences.",
    publicUnlock: false,
  },
  {
    family: "motion",
    name: "motion.scene_transition",
    blueprintRole: "Premium transitions",
    candidateValue: null,
    sourceStatus: "candidate_structure_only",
    publicUseStatus: "blocked_pending_motion_policy",
    requiredSource: "Motion guidance and reduced-motion policy",
    requiredApprovalOwner: "accessibility_ux",
    implementationNote:
      "Every motion treatment needs a reduced-motion equivalent.",
    publicUnlock: false,
  },
  {
    family: "media",
    name: "media.hero_aspect",
    blueprintRole: "Homepage hero media slots",
    candidateValue: null,
    sourceStatus: "asset_pending",
    publicUseStatus: "blocked_pending_asset_approval",
    requiredSource: "Approved hero media with desktop and mobile crops",
    requiredApprovalOwner: "asset_rights",
    implementationNote:
      "Stable dimensions only; no public media until rights and route use are approved.",
    publicUnlock: false,
  },
  {
    family: "media",
    name: "media.product_macro",
    blueprintRole: "Product macro photography slots",
    candidateValue: null,
    sourceStatus: "asset_pending",
    publicUseStatus: "blocked_pending_asset_approval",
    requiredSource: "Approved product photography and route-use approval",
    requiredApprovalOwner: "asset_rights",
    implementationNote:
      "Public use requires approved alt text and captions before launch.",
    publicUnlock: false,
  },
  {
    family: "interaction",
    name: "interaction.cta_primary",
    blueprintRole: "Primary product or locator actions",
    candidateValue: null,
    sourceStatus: "candidate_structure_only",
    publicUseStatus: "blocked_pending_route_publication",
    requiredSource: "Approved route targets and copy",
    requiredApprovalOwner: "seo_route",
    implementationNote:
      "CTA primitives may render real anchors, but they do not publish routes.",
    publicUnlock: false,
  },
  {
    family: "accessibility",
    name: "a11y.reduced_motion",
    blueprintRole: "Reduced-motion behavior",
    candidateValue: null,
    sourceStatus: "required_foundation",
    publicUseStatus: "internal_planning_only",
    requiredSource: "WCAG/accessibility decision",
    requiredApprovalOwner: "accessibility_ux",
    implementationNote:
      "Required for future cinematic experiences and motion-heavy components.",
    publicUnlock: false,
  },
] as const satisfies readonly DesignTokenRecord[];

export function getDesignToken(name: string): DesignTokenRecord | undefined {
  return PRESIDENTIAL_DESIGN_TOKENS.find((token) => token.name === name);
}
