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
 * Banner dọc hai bên, chỉ có từ màn 2xl (>= 1536px) trở lên – lúc đó hai bên nội dung (max-w-6xl) có lề trống >= 192px.
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
        <SideBanner side="left" tone="from-brand-accent via-brand-red to-[#b42a05]" onClose={() => closeBanner("freeship")}>
          <span className="fx-float flex size-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
            <Truck className="size-6" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-90">Miễn phí</p>
            <p className="text-2xl leading-none font-black uppercase">Ship</p>
            <p className="mt-2 text-xs leading-snug text-white/85">Giao hàng giữ lạnh tận nơi cho đơn đủ điều kiện</p>
          </div>
          <Link
            href="/search"
            className="fx-shine inline-block rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-red shadow transition hover:scale-105 active:scale-95"
          >
            Mua ngay
          </Link>
        </SideBanner>
      )}

      {!closed.has("affiliate") && (
        <SideBanner side="right" tone="from-brand via-brand-dark to-brand-deep" onClose={() => closeBanner("affiliate")}>
          <span className="fx-float flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <HandCoins className="size-6 text-brand-accent" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-accent uppercase">Cộng tác viên</p>
            <p className="text-3xl leading-none font-black">{Math.round(siteConfig.commissionRate * 100)}%</p>
            <p className="mt-2 text-xs leading-snug text-white/85">Hoa hồng cho mỗi đơn giao thành công</p>
          </div>
          <AffiliateJoinLink
            guestLabel="Đăng ký CTV"
            className="fx-shine inline-block rounded-full bg-brand-accent px-3.5 py-1.5 text-xs font-extrabold text-neutral-950 shadow transition hover:scale-105 active:scale-95"
          />
        </SideBanner>
      )}
    </>
  );
}

/**
 * Khung banner 130 x 340. Căn giữa trong phần lề trống bên trái / phải của nội dung:
 * lề = 50% - 36rem (nửa của max-w-6xl) nên vị trí = (lề - rộng banner) / 2.
 */
function SideBanner({
  side,
  tone,
  onClose,
  children,
}: {
  side: "left" | "right";
  tone: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label="Khuyến mãi"
      style={{ [side]: "calc((50% - 36rem - 130px) / 2)" }}
      className="fixed top-48 z-30 hidden h-[340px] max-h-[calc(100dvh-24rem)] w-[130px] 2xl:flex"
    >
      <div
        className={cn(
          "fx-gradient-flow relative flex size-full flex-col items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-b px-3 pt-8 pb-4 text-center text-white shadow-[0_14px_30px_-12px_rgb(0_0_0/0.45)] ring-1 ring-white/20 transition duration-300 ease-out-expo hover:-translate-y-1",
          tone,
        )}
      >
        <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/15 blur-2xl" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng banner"
          className="absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-black/25 text-white/90 transition hover:bg-black/50 hover:text-white"
        >
          <X className="size-3" />
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
