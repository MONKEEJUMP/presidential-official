import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatePageShell } from "@/components/presidential/modules/state-page-shell";
import {
  getPresidentialState,
  PRESIDENTIAL_STATES,
} from "@/lib/find-us/states";

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

  return {
    title: `Presidential in ${state.name} | Official Presidential Site`,
    description: state.seoLine,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function FindUsStatePage({ params }: FindUsStatePageProps) {
  const { state: slug } = await params;
  const state = getPresidentialState(slug);

  if (!state) {
    notFound();
  }

  return <StatePageShell state={state} />;
}
