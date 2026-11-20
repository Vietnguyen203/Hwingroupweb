import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";
import { SessionSync } from "@/components/session-sync";
import { ToastContainer } from "@/components/ui/toast";
import { siteConfig } from "@/lib/config";

// Be Vietnam Pro: phông hiện đại thiết kế riêng cho tiếng Việt, tiêu đề đậm gọn
const font = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Bricolage Grotesque: phông tiêu đề và giá, nét có cá tính hơn nội dung; subset vietnamese để không rơi về phông dự phòng
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["vietnamese", "latin"],
});

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} – Thực phẩm chế biến sẵn`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6c3bff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${font.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full font-sans antialiased">
        <Providers>
          {children}
          <ToastContainer />
          <Suspense fallback={null}>
            <SessionSync />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
