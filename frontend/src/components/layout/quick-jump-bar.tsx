"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Flame, Gift, HandCoins, LayoutGrid, ShieldCheck, Sparkles, Zap, type LucideIcon } from "lucide-react";

import { useSectionSpy } from "@/hooks/use-section-spy";
import { cn } from "@/lib/utils";

/**
 * Các mục của trang chủ mà thanh "đi nhanh" nhảy tới. `id` PHẢI khớp id gắn trên từng khối ở app/(site)/page.tsx
 * (và trong sale-strip / affiliate-banner). `optional`: khối có thể không có (không có hàng giảm giá / combo) -> tab tự ẩn.
 */
const HOME_SECTIONS: readonly { id: string; label: string; icon: LucideIcon; optional?: boolean }[] = [
  { id: "categories", label: "Danh mục", icon: LayoutGrid },
  { id: "on-sale", label: "Đang giảm giá", icon: Zap, optional: true },
  { id: "combos", label: "Combo", icon: Gift, optional: true },
  { id: "bestsellers", label: "Bán chạy", icon: Flame },
  { id: "affiliate", label: "Cộng tác viên", icon: HandCoins },
  { id: "newest", label: "Sản phẩm mới", icon: Sparkles },
  { id: "why-hwin", label: "Đồng hành cùng Phúc Vị", icon: ShieldCheck },
];
const ALL_IDS = HOME_SECTIONS.map((s) => s.id);
const ALWAYS_IDS = HOME_SECTIONS.filter((s) => !s.optional).map((s) => s.id);

export interface QuickJumpBarProps {
  /** Có danh mục nào để hiện không (trang khác trang chủ không có danh mục thì ẩn cả thanh). */
  hasCategories?: boolean;
  /** Đang chờ tải danh mục: trang chủ hiện luôn các tab, trang khác giữ chỗ để không giật bố cục. */
  loading?: boolean;
  /** Danh sách danh mục (render sẵn ở server) – chỉ hiện ngoài trang chủ. */
  children?: React.ReactNode;
}

/**
 * Hàng dưới header (kiêm "thanh đi nhanh").
 * - Trang chủ: DÍNH ngay dưới header (mọi cỡ màn hình); các tab nhảy mượt tới từng khối của trang và tự tô sáng khối đang xem.
 * - Trang khác: hàng danh mục như cũ (desktop / tablet, không dính để không đè các cột dính của giỏ hàng, thanh toán…).
 * Tab trượt ngang (ẩn thanh cuộn) khi không đủ chỗ.
 */
export function QuickJumpBar({ hasCategories = false, loading = false, children }: QuickJumpBarProps) {
  const isHome = usePathname() === "/";
  const navRef = useRef<HTMLElement>(null);
  const { stickyHeight, measureStack } = useStickyOffsets(navRef, isHome);

  if (!isHome && !hasCategories) {
    return loading ? <div className="hidden h-[3.25rem] border-b border-gray-100 bg-white md:block" aria-hidden /> : null;
  }

  return (
    <nav
      ref={navRef}
      aria-label={isHome ? "Đi nhanh tới các mục trang chủ" : "Danh mục sản phẩm"}
      // top = chiều cao header (do useStickyOffsets đo); giá trị dự phòng dùng cho lần vẽ đầu tiên
      style={isHome ? { top: "var(--header-h, 4.5rem)" } : undefined}
      className={cn(
        "border-b border-gray-100 bg-white/95 backdrop-blur-md",
        isHome ? "sticky z-30 shadow-xs" : "hidden md:block",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
        <Link
          href="/search"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand transition-colors duration-200 hover:bg-brand hover:text-white",
            isHome && "max-md:hidden",
          )}
        >
          <LayoutGrid className="size-4" /> Tất cả
        </Link>

        {isHome ? <HomeTabs topOffset={stickyHeight} measureTopOffset={measureStack} /> : children}

        <Link
          href="/videos"
          className="hidden shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-semibold text-brand transition duration-200 hover:bg-brand hover:text-white md:inline-flex"
        >
          <Clapperboard className="size-4" /> Video
        </Link>

        <Link
          href="/search?sort=PRICE_ASC"
          className="hidden shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-bold text-orange-800 ring-1 ring-orange-200 transition duration-200 hover:from-orange-100 hover:to-orange-200 lg:inline-flex"
        >
          <Flame className="size-4 fill-orange-400 text-orange-500" /> Khuyến mãi hot
        </Link>
      </div>
    </nav>
  );
}

/** Các tab nhảy tới khối trang chủ + tô sáng khối đang xem (IntersectionObserver, xem useSectionSpy). */
function HomeTabs({ topOffset, measureTopOffset }: { topOffset: number; measureTopOffset: () => number }) {
  const { present, active, jump } = useSectionSpy(ALL_IDS, ALWAYS_IDS, topOffset, measureTopOffset);
  const listRef = useRef<HTMLUListElement>(null);

  // Tab đang sáng được đưa vào giữa hàng (khi hàng phải trượt ngang, ví dụ trên điện thoại)
  useEffect(() => {
    const list = listRef.current;
    const tab = active ? list?.querySelector<HTMLElement>(`[data-id="${active}"]`) : null;
    if (!list || !tab) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
  }, [active]);

  return (
    <ul ref={listRef} className="no-scrollbar relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {HOME_SECTIONS.filter((s) => present.includes(s.id)).map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <li key={id} className="shrink-0">
            {/* href="#id" để vẫn dùng được khi chưa có JS; onClick thay bằng cuộn mượt có chừa chỗ cho thanh dính */}
            <a
              href={`#${id}`}
              data-id={id}
              aria-current={isActive ? "location" : undefined}
              onClick={(e) => {
                e.preventDefault();
                jump(id);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                isActive ? "bg-brand text-white shadow-sm shadow-brand/30" : "text-gray-700 hover:bg-gray-100 hover:text-brand",
              )}
            >
              <Icon className="size-4" />
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Đo chiều cao header và header + thanh này, ghi ra biến CSS để định vị thanh dính và chừa chỗ khi cuộn tới mục:
 * --header-h (đặt `top` cho thanh này), --sticky-h (dùng trong .scroll-mt-sticky cho liên kết #id khi chưa có JS).
 * Trả về stickyHeight (để tính dải "đang đọc") và measureStack (đo lại tức thì khi bấm tab, không phụ thuộc CSS).
 */
function useStickyOffsets(navRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [stickyHeight, setStickyHeight] = useState(0);

  const measureStack = useCallback(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    return (header?.offsetHeight ?? 0) + (navRef.current?.offsetHeight ?? 0);
  }, [navRef]);

  useEffect(() => {
    const nav = navRef.current;
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!enabled || !nav || !header) return;

    const root = document.documentElement;
    const measure = () => {
      const total = measureStack();
      root.style.setProperty("--header-h", `${header.offsetHeight}px`);
      root.style.setProperty("--sticky-h", `${total}px`);
      setStickyHeight(total);
    };
    const ro = new ResizeObserver(measure); // gọi ngay lần đầu khi bắt đầu quan sát, rồi mỗi khi đổi cỡ
    ro.observe(header);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [enabled, navRef, measureStack]);

  return { stickyHeight, measureStack };
}
