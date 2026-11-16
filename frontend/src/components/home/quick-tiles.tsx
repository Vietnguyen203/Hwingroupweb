import Link from "next/link";
import { Flame, Gift, Handshake } from "lucide-react";

const TILES = [
  { title: "Bán chạy", text: "Món ngon được chọn nhiều nhất", href: "/search?sort=BESTSELLER", icon: Flame, bg: "bg-[#fdeee9]", color: "text-brand-red" },
  { title: "Combo", text: "Mua theo bộ – giá tốt hơn", href: "/c/combo", icon: Gift, bg: "bg-[#e8f1fd]", color: "text-brand" },
  { title: "Cộng tác viên", text: "Hoa hồng 10% mỗi đơn", href: "/ctv", icon: Handshake, bg: "bg-[#fdecef]", color: "text-[#d6336c]" },
];

/** 3 ô truy cập nhanh (desktop) – tương tự Flash sale / Voucher / Combo của hwingroup.com. */
export function QuickTiles() {
  return (
    <div className="hidden grid-cols-3 gap-4 pt-6 md:grid">
      {TILES.map(({ title, text, href, icon: Icon, bg, color }) => (
        <Link key={title} href={href} className={`flex items-center justify-between rounded-xl p-5 ${bg}`}>
          <div>
            <p className={`text-lg font-bold uppercase ${color}`}>{title}</p>
            <p className="text-sm text-neutral-600">{text}</p>
            <span className="mt-3 inline-block rounded-full border border-neutral-800 px-3 py-1 text-xs">Xem ngay</span>
          </div>
          <Icon className={`size-14 ${color} opacity-80`} />
        </Link>
      ))}
    </div>
  );
}
