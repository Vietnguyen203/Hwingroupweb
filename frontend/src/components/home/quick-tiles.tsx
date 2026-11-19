import Link from "next/link";
import { ArrowUpRight, Flame, Gift, Handshake } from "lucide-react";

import { RevealGroup } from "@/components/ui/reveal-group";

const TILES = [
  { title: "Bán chạy", text: "Món ngon được chọn nhiều nhất", href: "/search?sort=BESTSELLER", icon: Flame, bg: "bg-gradient-to-br from-brand-accent/20 to-brand-accent/5", color: "text-brand-red", iconBg: "bg-brand-accent" },
  { title: "Combo", text: "Mua theo bộ – giá tốt hơn", href: "/categories/combo", icon: Gift, bg: "bg-gradient-to-br from-brand/15 to-brand/5", color: "text-brand-dark", iconBg: "bg-brand" },
  { title: "Cộng tác viên", text: "Hoa hồng 10% mỗi đơn", href: "/affiliate", icon: Handshake, bg: "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5", color: "text-emerald-800", iconBg: "bg-emerald-600" },
];

/** 3 ô truy cập nhanh (desktop): biểu tượng nổi trong ô màu, rê chuột ô nổi lên và mũi tên chéo hiện ra. */
export function QuickTiles() {
  return (
    <RevealGroup className="hidden grid-cols-3 gap-5 pt-6 md:grid">
      {TILES.map(({ title, text, href, icon: Icon, bg, color, iconBg }) => (
        <Link
          key={title}
          href={href}
          className={`group/tile relative flex items-center justify-between overflow-hidden rounded-3xl p-6 ring-1 ring-black/[0.04] transition duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover ${bg}`}
        >
          <div>
            <p className={`text-lg font-black tracking-wide uppercase ${color}`}>{title}</p>
            <p className="mt-0.5 text-sm text-neutral-600">{text}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-900 shadow-sm transition group-hover/tile:gap-2">
              Xem ngay <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <span className={`flex size-16 items-center justify-center rounded-2xl text-white shadow-lg transition duration-300 ease-spring group-hover/tile:rotate-6 group-hover/tile:scale-110 ${iconBg}`}>
            <Icon className="size-8" />
          </span>
        </Link>
      ))}
    </RevealGroup>
  );
}
