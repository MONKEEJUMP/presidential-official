export type OwnerDecisionGateStatus =
  | "implemented_pending_live_confirmation"
  | "blocked_pending_owner_decision"
  | "blocked_pending_owner_or_legal_review"
  | "blocked_pending_verified_source"
  | "blocked_pending_final_brand_choice";

export type OwnerDecisionGate = {
  readonly id: string;
  readonly label: string;
  readonly status: OwnerDecisionGateStatus;
  readonly requiredBefore: "public_route_unlock" | "production_deploy" | "post_launch_expansion";
  readonly currentPosture: string;
};

export const OWNER_DECISION_GATES = [
  {
    id: "canonical-host",
    label: "Canonical apex versus www",
    status: "implemented_pending_live_confirmation",
    requiredBefore: "production_deploy",
    currentPosture: "Code redirects www to apex and HTTP apex to HTTPS apex; live DNS/provider state still needs production confirmation.",
  },
  {
    id: "presidential-thc-legal-framing",
    label: "Public Presidential THC legal framing",
    status: "blocked_pending_owner_or_legal_review",
    requiredBefore: "public_route_unlock",
    currentPosture: "Public metadata and route copy stay conservative until legal wording is confirmed.",
  },
  {
    id: "moon-pods-orbit-visibility",
    label: "Moon Pods and Orbit visibility plus assets/copy",
    status: "blocked_pending_owner_decision",
    requiredBefore: "public_route_unlock",
    currentPosture: "Moon Pods and Orbit remain shell/draft surfaces until visibility, assets, and copy are approved.",
  },
  {
    id: "catalog-claims-same-as",
    label: "Product catalog, claim proofs, and sameAs profiles",
    status: "blocked_pending_verified_source",
    requiredBefore: "public_route_unlock",
    currentPosture: "No product catalog rows, claim proofs, or sameAs profile URLs are promoted from candidate data.",
  },
  {
    id: "verified-retailer-source",
    label: "Verified retailer data source for locator",
    status: "blocked_pending_verified_source",
    requiredBefore: "public_route_unlock",
    currentPosture: "Customer/account rows are not locator data; Find Us remains informational until verified retailer records exist.",
  },
  {
    id: "brand-teal-font",
    label: "Master Presidential Teal hex and final font family",
    status: "blocked_pending_final_brand_choice",
    requiredBefore: "public_route_unlock",
    currentPosture: "Design tokens and surfaces must keep provisional styling until the final teal and font are chosen.",
  },
  {
    id: "age-gate-policy",
    label: "Age-gate legal and DOB policy",
    status: "blocked_pending_owner_or_legal_review",
    requiredBefore: "production_deploy",
    currentPosture: "Current implementation stores adult confirmation only and collects no DOB; final policy still needs confirmation.",
  },
] as const satisfies readonly OwnerDecisionGate[];

export function getOpenOwnerDecisionGates(): readonly OwnerDecisionGate[] {
  return OWNER_DECISION_GATES.filter((gate) => gate.status !== "implemented_pending_live_confirmation");
}
