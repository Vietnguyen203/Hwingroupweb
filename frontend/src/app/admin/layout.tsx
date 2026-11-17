import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Quản trị", template: "%s | Quản trị HWIN" }, robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
