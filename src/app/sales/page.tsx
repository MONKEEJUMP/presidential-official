import type { Metadata } from "next";

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

export default function SalesPage() {
  return <SalesDashboard />;
}
