import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatePageShell } from "@/components/presidential/modules/state-page-shell";
import {
  getPresidentialState,
  PRESIDENTIAL_STATES,
} from "@/lib/find-us/states";
import { buildStateSeoRoute } from "@/lib/seo/concrete-routes";
import { buildRouteMetadata } from "@/lib/seo/metadata";
import {
  buildRouteShellJsonLd,
  JsonLd,
} from "@/lib/seo/schema";

// 9083-CODE P4 (owner rulings, 2026-07-11): the eight priority-market state
// pages render themed brand experiences. Everything else still 404s, no
// retailer data is read anywhere, and every state page stays noindex until
// per-route publication sign-off.

type FindUsStatePageProps = {
  readonly params: Promise<{
    readonly state: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return PRESIDENTIAL_STATES.map((state) => ({ state: state.slug }));
}

export async function generateMetadata({
  params,
}: FindUsStatePageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getPresidentialState(slug);

  if (!state) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildRouteMetadata({ route: buildStateSeoRoute(state) });
}

export default async function FindUsStatePage({ params }: FindUsStatePageProps) {
  const { state: slug } = await params;
  const state = getPresidentialState(slug);

  if (!state) {
    notFound();
  }

  const route = buildStateSeoRoute(state);
  const jsonLdEntries = buildRouteShellJsonLd(route);

  return (
    <>
      {jsonLdEntries.map((entry) => (
        <JsonLd key={`${route.id}-${entry.id}`} data={entry.data} />
      ))}
      <StatePageShell state={state} />
    </>
  );
}
