import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildRouteMetadata } from "@/lib/seo/metadata";
import { getRouteById } from "@/lib/seo/route-helpers";

import { LocatorTemplateShell } from "../../../locator-template-shell";

type FindUsRetailerPageProps = {
  readonly params: Promise<{
    readonly state: string;
    readonly city: string;
    readonly retailer: string;
  }>;
};

const route = getRouteById("find-us-retailer-detail");

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

  if (!clean || clean.length > 100) return null;

  return clean.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function generateMetadata({
  params,
}: FindUsRetailerPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const state = normalizeState(resolvedParams.state);
  const city = formatSlugSegment(resolvedParams.city);
  const retailer = formatSlugSegment(resolvedParams.retailer);

  if (!route || !state || !city || !retailer) {
    return {};
  }

  return buildRouteMetadata({
    route,
    canonicalPath: `/find-us/${state.toLowerCase()}/${resolvedParams.city}/${resolvedParams.retailer}`,
    title: `Presidential Retailer Record | ${city}, ${state}`,
    description:
      "Verified retailer information for Presidential products appears only after licensed retailer records are confirmed.",
  });
}

export default async function FindUsRetailerPage({
  params,
}: FindUsRetailerPageProps) {
  const resolvedParams = await params;
  const state = normalizeState(resolvedParams.state);
  const city = formatSlugSegment(resolvedParams.city);
  const retailer = formatSlugSegment(resolvedParams.retailer);

  if (!route || !state || !city || !retailer) {
    notFound();
  }

  return (
    <LocatorTemplateShell
      description="This retailer detail path is ready for verified licensed retailer records. No unverified retailer listing is shown."
      scopeLabel="Retailer record"
      scopeValue={`${retailer} - ${city}, ${state}`}
      title="Retailer verification required"
    />
  );
}
