import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildRouteMetadata } from "@/lib/seo/metadata";
import { getRouteById } from "@/lib/seo/route-helpers";

import { LocatorTemplateShell } from "../locator-template-shell";

type FindUsStatePageProps = {
  readonly params: Promise<{
    readonly state: string;
  }>;
};

const route = getRouteById("find-us-state");

function normalizeState(value: string): string | null {
  const state = decodeURIComponent(value).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(state) ? state : null;
}

export async function generateMetadata({
  params,
}: FindUsStatePageProps): Promise<Metadata> {
  const state = normalizeState((await params).state);

  if (!route || !state) {
    return {};
  }

  return buildRouteMetadata({
    route,
    canonicalPath: `/find-us/${state.toLowerCase()}`,
    title: `Find Presidential in ${state} | Licensed Retailers`,
    description:
      "Find Presidential through verified licensed retailer records when local data is ready. Availability varies by licensed retailer.",
  });
}

export default async function FindUsStatePage({ params }: FindUsStatePageProps) {
  const state = normalizeState((await params).state);

  if (!route || !state) {
    notFound();
  }

  return (
    <LocatorTemplateShell
      description="This state retail path is ready for verified licensed retailer records. No unverified retailer listings are shown."
      scopeLabel="State"
      scopeValue={state}
      title={`Find Presidential in ${state}`}
    />
  );
}
