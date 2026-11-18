import type { Metadata } from "next";

import { Overview } from "@/components/affiliate/portal/overview";

export const metadata: Metadata = { title: "Tổng quan" };

export default function AffiliateDashboardPage() {
  return <Overview />;
}
