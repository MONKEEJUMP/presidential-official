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

export type RuntimeDesignTokenBinding = {
  readonly tokenName: string;
  readonly cssVariable: `--${string}`;
  readonly themeVariable: `--${string}`;
  readonly scaffoldValue: string;
  readonly finalApprovalRequired: true;
};

export const PRESIDENTIAL_RUNTIME_TOKEN_BINDINGS = [
  {
    tokenName: "color.brand.presidential_teal",
    cssVariable: "--po-color-brand",
    themeVariable: "--color-po-brand",
    scaffoldValue: "#58c3b6",
    finalApprovalRequired: true,
  },
  {
    tokenName: "color.base.black",
    cssVariable: "--po-color-ink",
    themeVariable: "--color-po-ink",
    scaffoldValue: "#09090b",
    finalApprovalRequired: true,
  },
  {
    tokenName: "color.base.white",
    cssVariable: "--po-color-canvas",
    themeVariable: "--color-po-canvas",
    scaffoldValue: "#ffffff",
    finalApprovalRequired: true,
  },
  {
    tokenName: "color.series.silver",
    cssVariable: "--po-color-silver",
    themeVariable: "--color-po-silver",
    scaffoldValue: "#e5e7eb",
    finalApprovalRequired: true,
  },
  {
    tokenName: "color.series.gold",
    cssVariable: "--po-color-gold",
    themeVariable: "--color-po-gold",
    scaffoldValue: "#fbbf24",
    finalApprovalRequired: true,
  },
  {
    tokenName: "color.series.rose_gold",
    cssVariable: "--po-color-rose-gold",
    themeVariable: "--color-po-rose-gold",
    scaffoldValue: "#f4c7b8",
    finalApprovalRequired: true,
  },
  {
    tokenName: "type.display",
    cssVariable: "--po-font-display",
    themeVariable: "--font-display",
    scaffoldValue: "var(--font-clash-display), Arial, Helvetica, sans-serif",
    finalApprovalRequired: true,
  },
  {
    tokenName: "type.body",
    cssVariable: "--po-font-body",
    themeVariable: "--font-sans",
    scaffoldValue: "var(--font-source-serif-4), Arial, Helvetica, sans-serif",
    finalApprovalRequired: true,
  },
] as const satisfies readonly RuntimeDesignTokenBinding[];

export const PRESIDENTIAL_DESIGN_TOKENS = [
  {
    family: "color",
    name: "color.brand.presidential_teal",
    blueprintRole: "Master brand accent",
    candidateValue: "#58c3b6",
    sourceStatus: "candidate",
    publicUseStatus: "approved_public",
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
    candidateValue: "Clash Display (local Fontshare FFL files)",
    sourceStatus: "font_pending",
    publicUseStatus: "approved_public",
    requiredSource: "Official font choice or licensed font files",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Keep the licensed local display face behind the role token until final brand approval.",
    publicUnlock: false,
  },
  {
    family: "typography",
    name: "type.body",
    blueprintRole: "Minimal body copy",
    candidateValue: "Source Serif 4 (local SIL OFL files)",
    sourceStatus: "font_pending",
    publicUseStatus: "approved_public",
    requiredSource: "Official font choice or licensed font files",
    requiredApprovalOwner: "brand_design",
    implementationNote:
      "Keep the licensed local body face behind the role token until final brand approval.",
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
