import { BarChart3, LayoutDashboard, Link2, Megaphone, Package, Wallet, type LucideIcon } from "lucide-react";

import type { PortalSlug } from "@/lib/portal-path";

export type PortalNavItem = {
  /** Mục của cổng: URL là /affiliate/<id tài khoản>/<slug>. */
  slug: PortalSlug;
  label: string;
  icon: LucideIcon;
  /** Mô tả ở trang "sắp ra mắt" của mục chưa có chức năng riêng. */
  description: string;
  /** Lối đi tạm tới chức năng đã có sẵn ở nơi khác. */
  fallback?: { href: string; label: string };
  /** Hình phác thảo ở trang "sắp ra mắt". */
  preview?: "chart" | "cards";
};

/** Menu cổng CTV – dùng chung cho sidebar và các trang giữ chỗ (Chiến dịch, Sản phẩm, Hiệu suất chưa có chức năng). */
export const PORTAL_NAV: PortalNavItem[] = [
  { slug: "dashboard", label: "Tổng quan", icon: LayoutDashboard, description: "Số liệu tổng quan hoạt động cộng tác viên." },
  {
    slug: "campaigns", label: "Chiến dịch", icon: Megaphone, preview: "cards",
    description: "Các chương trình khuyến mãi, chiến dịch dành riêng cho cộng tác viên.",
  },
  {
    slug: "products", label: "Sản phẩm", icon: Package, preview: "cards",
    description: "Danh mục sản phẩm kèm mức hoa hồng để bạn chọn quảng bá.",
    fallback: { href: "/products", label: "Xem sản phẩm trên cửa hàng" },
  },
  {
    slug: "links", label: "Link Affiliate", icon: Link2,
    description: "Mã giới thiệu và link chia sẻ riêng của bạn.",
  },
  {
    slug: "performance", label: "Hiệu suất", icon: BarChart3, preview: "chart",
    description: "Biểu đồ lượt click, đơn hàng và tỷ lệ chuyển đổi theo thời gian.",
  },
  {
    slug: "earnings", label: "Hoa hồng & Thanh toán", icon: Wallet,
    description: "Chi tiết hoa hồng từng đơn, lịch sử rút tiền và tài khoản ngân hàng.",
  },
];
