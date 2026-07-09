import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildRouteMetadata } from "@/lib/seo/metadata";
import { getRouteById } from "@/lib/seo/route-helpers";

import { LocatorTemplateShell } from "../../locator-template-shell";

type FindUsCityPageProps = {
  readonly params: Promise<{
    readonly state: string;
    readonly city: string;
  }>;
};

const route = getRouteById("find-us-city");

function normalizeState(value: string): string | null {
  const state = decodeURIComponent(value).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(state) ? state : null;
}

function formatSlugSegment(value: string): string | null {
  const clean = decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/[^a-zA-Z0-9 ]+/g, "")
    .trim()
    .replace(/\s+/g, " ");

  if (!clean || clean.length > 80) return null;

  return clean.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function generateMetadata({
  params,
}: FindUsCityPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const state = normalizeState(resolvedParams.state);
  const city = formatSlugSegment(resolvedParams.city);

  if (!route || !state || !city) {
    return {};
  }

  return buildRouteMetadata({
    route,
    canonicalPath: `/find-us/${state.toLowerCase()}/${resolvedParams.city}`,
    title: `Find Presidential in ${city}, ${state} | Licensed Retailers`,
    description:
      "Find Presidential through verified licensed retailer records when city data is ready. Availability varies by licensed retailer.",
  });
}

export default async function FindUsCityPage({ params }: FindUsCityPageProps) {
  const resolvedParams = await params;
  const state = normalizeState(resolvedParams.state);
  const city = formatSlugSegment(resolvedParams.city);

  if (!route || !state || !city) {
    notFound();
  }

  return (
    <LocatorTemplateShell
      description="This city retail path is ready for verified licensed retailer records. No unverified retailer listings are shown."
      scopeLabel="City"
      scopeValue={`${city}, ${state}`}
      title={`Find Presidential in ${city}`}
    />
  );
}
