import { BarChart3, LayoutDashboard, Link2, Megaphone, Package, Wallet, type LucideIcon } from "lucide-react";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Mô tả ở trang "sắp ra mắt" của mục chưa có chức năng riêng. */
  description: string;
  /** Lối đi tạm tới chức năng đã có sẵn ở nơi khác. */
  fallback?: { href: string; label: string };
};

/** Menu cổng CTV – dùng chung cho sidebar và các trang giữ chỗ (Chiến dịch, Sản phẩm, Hiệu suất chưa có chức năng). */
export const PORTAL_NAV: PortalNavItem[] = [
  { href: "/affiliate/dashboard", label: "Tổng quan", icon: LayoutDashboard, description: "Số liệu tổng quan hoạt động cộng tác viên." },
  {
    href: "/affiliate/campaigns", label: "Chiến dịch", icon: Megaphone,
    description: "Các chương trình khuyến mãi, chiến dịch dành riêng cho cộng tác viên.",
  },
  {
    href: "/affiliate/products", label: "Sản phẩm", icon: Package,
    description: "Danh mục sản phẩm kèm mức hoa hồng để bạn chọn quảng bá.",
    fallback: { href: "/products", label: "Xem sản phẩm trên cửa hàng" },
  },
  {
    href: "/affiliate/links", label: "Link Affiliate", icon: Link2,
    description: "Mã giới thiệu và link chia sẻ riêng của bạn.",
  },
  {
    href: "/affiliate/performance", label: "Hiệu suất", icon: BarChart3,
    description: "Biểu đồ lượt click, đơn hàng và tỷ lệ chuyển đổi theo thời gian.",
  },
  {
    href: "/affiliate/earnings", label: "Hoa hồng & Thanh toán", icon: Wallet,
    description: "Chi tiết hoa hồng từng đơn, lịch sử rút tiền và tài khoản ngân hàng.",
  },
];
