import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";

import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingContact } from "@/components/layout/floating-contact";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { SessionSync } from "@/components/session-sync";
import { siteConfig } from "@/lib/config";

const font = Roboto({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} – Thực phẩm chế biến sẵn`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${font.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-page-bg text-neutral-900">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 md:px-3">{children}</main>
          <SiteFooter />
          <FloatingContact />
          <Suspense fallback={<div className="fixed inset-x-0 bottom-0 h-14 border-t bg-white md:hidden" />}>
            <BottomNav />
          </Suspense>
          <Suspense fallback={null}>
            <SessionSync />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
