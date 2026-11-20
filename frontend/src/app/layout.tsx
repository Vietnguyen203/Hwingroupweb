import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque, Dancing_Script, Playfair_Display } from "next/font/google";

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

// Chữ trong logo Phúc Vị: chữ đậm có chân (tên thương hiệu) và chữ viết tay (khẩu hiệu); cả hai có subset tiếng Việt
const logoSerif = Playfair_Display({ variable: "--font-logo-serif", subsets: ["vietnamese", "latin"], weight: ["800", "900"] });
const logoScript = Dancing_Script({ variable: "--font-logo-script", subsets: ["vietnamese", "latin"], weight: ["500"] });

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} – Thực phẩm chế biến sẵn`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4a0a0d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${font.variable} ${display.variable} ${logoSerif.variable} ${logoScript.variable} h-full antialiased`}>
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
