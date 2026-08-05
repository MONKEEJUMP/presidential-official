import type { Metadata } from "next";

import {
  buildTermPageMetadata,
  PresidentialTermPage,
} from "@/components/presidential/modules/presidential-term-page";
import { getApprovedTermSeoRoute } from "@/lib/seo/approved-public-routes";

const TERM_SLUG = "presidential-blunts" as const;

export function generateMetadata(): Metadata {
  return buildTermPageMetadata(getApprovedTermSeoRoute(TERM_SLUG));
}

export default function PresidentialBluntsPage() {
  return <PresidentialTermPage route={getApprovedTermSeoRoute(TERM_SLUG)} />;
}

