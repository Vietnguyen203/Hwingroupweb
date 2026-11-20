"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandCoins, Truck, X } from "lucide-react";

import { AffiliateJoinLink } from "@/components/affiliate/affiliate-join-link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

type BannerId = "freeship" | "affiliate";

/** Chỉ hiện ở các trang xem hàng; trang thanh toán, tài khoản, đăng nhập… cần tập trung nên không có banner. */
const SHOW_ON = /^\/(?:$|(?:categories|products|search)(?:\/|$))/;

/**
 * Banner dọc hai bên, chỉ có từ màn 2xl (>= 1536px) trở lên – lúc đó hai bên nội dung (max-w-6xl) có lề trống >= 192px;
 * banner rộng ra theo lề (130 – 240px, xem SideBanner).
 * Nằm giữa phần lề của mỗi bên, cố định khi cuộn; chừa phía dưới (24rem tính từ đáy) cho cụm nút nổi Zalo / Hotline ở góc trái.
 * Mỗi banner có nút X để đóng (nhớ trong phiên làm việc).
 */
export function StickySideBanners() {
  const pathname = usePathname();
  const closed = useClosedBanners();
  if (!SHOW_ON.test(pathname) || closed === null) return null; // closed === null: chưa hydrate xong, chưa biết đã đóng chưa

  return (
    <>
      {!closed.has("freeship") && (
        <SideBanner side="left" tone="from-brand-red via-brand to-brand-deep" image="/images/freeship-bg.svg" onClose={() => closeBanner("freeship")}>
          <span className="flex size-12 @min-[12rem]:size-16 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
            <Truck className="size-6 @min-[12rem]:size-8" />
          </span>
          <div>
            <p className="text-xs @min-[12rem]:text-sm font-bold opacity-90">Miễn phí</p>
            <p className="text-2xl @min-[12rem]:text-5xl leading-none font-black uppercase">Ship</p>
            <p className="mt-2 @min-[12rem]:mt-3 text-xs @min-[12rem]:text-sm leading-snug text-white/85">Giao hàng giữ lạnh tận nơi cho đơn đủ điều kiện</p>
          </div>
          <Link
            href="/search"
            className="inline-block rounded-full bg-white px-3.5 py-1.5 @min-[12rem]:px-6 @min-[12rem]:py-2.5 text-xs @min-[12rem]:text-sm font-bold text-brand-red shadow transition hover:scale-105 active:scale-95"
          >
            Mua ngay
          </Link>
        </SideBanner>
      )}

      {!closed.has("affiliate") && (
        <SideBanner side="right" tone="from-brand-dark via-brand-deep to-[#2a0507]" image="/images/cong-tac-vien-bg.jpg" scrim="from-brand-deep/90 via-brand-deep/45 to-brand-deep/90" onClose={() => closeBanner("affiliate")}>
          <span className="flex size-12 @min-[12rem]:size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <HandCoins className="size-6 @min-[12rem]:size-8 text-brand-accent" />
          </span>
          <div>
            <p className="text-xs @min-[12rem]:text-sm font-bold text-brand-accent">Cộng tác viên</p>
            <p className="text-3xl @min-[12rem]:text-6xl leading-none font-black">{Math.round(siteConfig.commissionRate * 100)}%</p>
            <p className="mt-2 @min-[12rem]:mt-3 text-xs @min-[12rem]:text-sm leading-snug text-white/85">Hoa hồng cho mỗi đơn giao thành công</p>
          </div>
          <AffiliateJoinLink
            guestLabel="Đăng ký CTV"
            className="inline-block rounded-full bg-brand-accent px-3.5 py-1.5 @min-[12rem]:px-6 @min-[12rem]:py-2.5 text-xs @min-[12rem]:text-sm font-extrabold text-neutral-950 shadow transition hover:scale-105 active:scale-95"
          />
        </SideBanner>
      )}
    </>
  );
}

/**
 * Rộng banner = lề trống của nội dung (50% - 36rem, nửa của max-w-6xl) trừ 24px mỗi bên, giữ trong khoảng 130 – 240px:
 * màn 1536px rộng 144px, màn 1920px rộng 240px. Cao theo tỉ lệ 13:34, thấp hơn khi màn thấp (chừa chỗ cho nút nổi Zalo / Hotline).
 * Căn giữa trong phần lề: vị trí = (lề - rộng banner) / 2. Là container nên chữ, icon, nút to lên khi banner đủ rộng (>= 12rem).
 */
const BANNER_WIDTH = "clamp(130px, calc(50% - 39rem), 240px)";

function SideBanner({
  side,
  tone,
  image,
  scrim = "from-black/10 via-black/25 to-black/10",
  onClose,
  children,
}: {
  side: "left" | "right";
  /** Dải màu nền (cũng là nền dự phòng khi có `image`). */
  tone: string;
  /** Ảnh nền phủ kín banner (đường dẫn trong public/), có lớp tối nhẹ phía trên để chữ dễ đọc. */
  image?: string;
  /** Lớp tối phủ lên ảnh (gradient Tailwind, từ trên xuống) để chữ trắng đọc được; ảnh sáng như ảnh người thật cần lớp đậm hơn. */
  scrim?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label="Khuyến mãi"
      style={{ "--bw": BANNER_WIDTH, width: "var(--bw)", [side]: "calc((50% - 36rem - var(--bw)) / 2)" } as React.CSSProperties}
      className="@container fixed top-48 z-30 hidden aspect-[13/34] max-h-[calc(100dvh-24rem)] 2xl:flex"
    >
      <div
        className={cn(
          "relative isolate flex w-full flex-col items-center justify-between overflow-hidden rounded-2xl @min-[12rem]:rounded-2xl bg-gradient-to-b px-3 @min-[12rem]:px-5 pt-8 @min-[12rem]:pt-12 pb-4 @min-[12rem]:pb-7 text-center text-white shadow-[0_14px_30px_-12px_rgb(0_0_0/0.45)] ring-1 ring-white/20 transition duration-300 ease-out-expo hover:-translate-y-1",
          tone,
        )}
      >
        {image && (
          <>
            {/* Ảnh nền nằm dưới nội dung: khung có `isolate` (tự lập lớp xếp chồng) nên -z-10 vẫn nằm trên màu nền của khung.
                eslint-disable-next-line bên dưới: ảnh nền tĩnh trong public/ */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full object-cover" />
            <span aria-hidden className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b ${scrim}`} />
          </>
        )}
        <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-32 @min-[12rem]:size-48 rounded-full bg-white/15 blur-2xl" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng banner"
          className="absolute top-1.5 right-1.5 @min-[12rem]:top-2.5 @min-[12rem]:right-2.5 z-10 flex size-5 @min-[12rem]:size-7 items-center justify-center rounded-full bg-black/25 text-white/90 transition hover:bg-black/50 hover:text-white"
        >
          <X className="size-3 @min-[12rem]:size-4" />
        </button>
        {children}
      </div>
    </aside>
  );
}

// ---- Nhớ banner đã đóng (sessionStorage; vẫn đóng được khi trình duyệt chặn lưu trữ) ----

const STORAGE_KEY = "hwin.side-banners.closed";
const listeners = new Set<() => void>();
let memory: string | null = null; // giá trị trong bộ nhớ, ưu tiên hơn sessionStorage khi có

function readClosed(): string {
  if (memory !== null) return memory;
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function closeBanner(id: BannerId) {
  const next = [...readClosed().split(",").filter(Boolean), id].join(",");
  memory = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, next);
  } catch {
    // không lưu được thì chỉ đóng trong lần xem này
  }
  listeners.forEach((l) => l());
}

function subscribeClosed(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Tập banner đã đóng; null khi còn ở server / đang hydrate (chưa biết). */
function useClosedBanners(): Set<string> | null {
  const raw = useSyncExternalStore(subscribeClosed, readClosed, () => null);
  return raw === null ? null : new Set(raw.split(","));
}
