import type { Metadata } from "next";

import { AdminVideos } from "@/components/admin/admin-videos";

export const metadata: Metadata = {
  title: "Quản lý video",
};

export default function AdminVideosPage() {
  return <AdminVideos />;
}
