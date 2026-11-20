import Link from "next/link";
import { ArrowUpRight, Flame, Gift, Handshake } from "lucide-react";

const TILES = [
  { title: "Bán chạy", text: "Món ngon được chọn nhiều nhất", href: "/search?sort=BESTSELLER", icon: Flame, bg: "bg-brand-honey/20", color: "text-brand-deep", iconBg: "bg-brand-honey text-neutral-900" },
  { title: "Combo", text: "Mua theo bộ, giá tốt hơn", href: "/categories/combo", icon: Gift, bg: "bg-brand-soft", color: "text-brand-deep", iconBg: "bg-brand text-white" },
  { title: "Cộng tác viên", text: "Hoa hồng 10% mỗi đơn", href: "/affiliate", icon: Handshake, bg: "bg-brand-green/10", color: "text-brand-deep", iconBg: "bg-brand-green text-white" },
];

/** 3 ô truy cập nhanh (desktop): màu nền phẳng, biểu tượng trong ô vuông bo nhỏ; rê chuột thì mũi tên chéo dịch nhẹ. */
export function QuickTiles() {
  return (
    <div className="hidden grid-cols-3 gap-4 pt-6 md:grid">
      {TILES.map(({ title, text, href, icon: Icon, bg, color, iconBg }) => (
        <Link
          key={title}
          href={href}
          className={`group/tile flex items-center justify-between gap-4 rounded-xl p-5 transition-colors hover:brightness-[0.97] ${bg}`}
        >
          <div>
            <p className={`font-display text-xl font-bold ${color}`}>{title}</p>
            <p className="mt-0.5 text-sm text-neutral-700">{text}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline-offset-4 group-hover/tile:underline">
              Xem ngay <ArrowUpRight className="size-4" />
            </span>
          </div>
          <span className={`flex size-14 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className="size-7" />
          </span>
        </Link>
      ))}
    </div>
  );
}
