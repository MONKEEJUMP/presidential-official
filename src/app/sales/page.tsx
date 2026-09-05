import type { Metadata } from "next";

import { createSalesAuthClient } from "@/lib/supabase/sales-server";

import { SalesDashboard } from "./sales-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Presidential Sales",
  description: "Private Presidential sales call dashboard.",
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
  return <SalesDashboard initiallyAuthenticated={Boolean(data.user)} />;
}
