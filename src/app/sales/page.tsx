import type { Metadata } from "next";

import { buildSocialMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildWebPageSchema, JsonLd } from "@/lib/seo/schema";
import { createSalesAuthClient } from "@/lib/supabase/sales-server";

import { SalesDashboard } from "./sales-dashboard";
import { SalesApp } from "./sales-app";

export const dynamic = "force-dynamic";

const TITLE = "Presidential Sales";
const DESCRIPTION = "Private Presidential sales call dashboard.";
const CANONICAL = "https://presidentialmoonrocks.com/sales";

// 1014-MR-SEOMATOR: self canonical, OG/Twitter and WebPage + BreadcrumbList; noindex kept.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  ...buildSocialMetadata({ title: TITLE, description: DESCRIPTION, url: CANONICAL }),
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export default async function SalesPage() {
  const auth = await createSalesAuthClient();
  const { data } = await auth.auth.getUser();
  const Dashboard = process.env.PRESIDENTIAL_SALES_UI === "redesign" ? SalesApp : SalesDashboard;
  return (
    <>
      <JsonLd data={buildWebPageSchema({ path: "/sales", name: TITLE, description: DESCRIPTION })} />
      <JsonLd data={buildBreadcrumbSchema([{ name: "Presidential", path: "/" }, { name: "Sales", path: "/sales" }])} />
      <Dashboard initiallyAuthenticated={Boolean(data.user)} />
    </>
  );
}
