"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BadgePercent,
  Bell,
  BellOff,
  CheckCheck,
  CircleCheck,
  CircleX,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Truck,
  Undo2,
  UserPlus,
  UserX,
  Volume2,
  VolumeX,
  Wallet,
} from "lucide-react";

import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { useMarkRead, useNotificationList, useUnreadCount } from "@/hooks/use-notifications";
import { describeNotification, timeAgo, type NotificationItem, type Tone } from "@/lib/notifications";
import { unlockAudio } from "@/lib/notification-sound";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/stores/realtime-store";

const ICONS: Record<string, typeof Bell> = {
  ORDER_PLACED: ShoppingBag,
  ORDER_CONFIRMED: PackageCheck,
  ORDER_SHIPPED: Truck,
  ORDER_DELIVERED: CircleCheck,
  ORDER_CANCELLED: CircleX,
  ORDER_RETURNED: Undo2,
  COMMISSION_EARNED: BadgePercent,
  COMMISSION_APPROVED: BadgePercent,
  PAYOUT_REQUESTED: Wallet,
  PAYOUT_APPROVED: Wallet,
  PAYOUT_PAID: Wallet,
  PAYOUT_REJECTED: Wallet,
  AFFILIATE_APPLIED: UserPlus,
  AFFILIATE_APPROVED: BadgeCheck,
  AFFILIATE_REJECTED: UserX,
};

const TONE: Record<Tone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  info: "bg-sky-100 text-sky-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  accent: "bg-violet-100 text-violet-700",
};

/**
 * Chuông thông báo: số chưa đọc + bảng danh sách (bấm để mở, đọc, đánh dấu đã đọc, bật/tắt âm báo).
 * Chỉ hiện khi đã đăng nhập; dùng chung cho header cửa hàng ({@code variant="site"}) và thanh admin ({@code "admin"}).
 */
export function NotificationBell({ variant = "site" }: { variant?: "site" | "admin" }) {
  const mounted = useMounted();
  const me = useMe().data;
  const router = useRouter();
  const unread = useUnreadCount();
  const soundEnabled = useRealtime((s) => s.soundEnabled);
  const toggleSound = useRealtime((s) => s.toggleSound);
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useNotificationList(open);
  const { markRead, markAllRead, markingAll } = useMarkRead();

  // Chuông lắc mỗi khi số chưa đọc tăng
  const lastUnread = useRef(unread);
  useEffect(() => {
    if (unread > lastUnread.current) {
      setRinging(true); // phản ứng với thay đổi từ máy chủ (đẩy qua WebSocket)
      const t = setTimeout(() => setRinging(false), 900);
      lastUnread.current = unread;
      return () => clearTimeout(t);
    }
    lastUnread.current = unread;
  }, [unread]);

  // Bấm ra ngoài hoặc Esc thì đóng bảng
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted || !me) return null;

  const items = list.data?.pages.flatMap((p) => p.content) ?? [];
  const admin = variant === "admin";

  function openItem(n: NotificationItem) {
    if (!n.read) markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          setOpen((v) => !v);
        }}
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-full transition hover:scale-105 active:scale-95",
          admin ? "size-9 border border-slate-200 text-slate-600 hover:bg-slate-100" : "size-10 text-neutral-800 hover:bg-neutral-100",
          open && (admin ? "bg-slate-100" : "bg-neutral-100"),
        )}
      >
        <Bell className={cn(admin ? "size-5" : "size-6", ringing && "animate-bell-ring")} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[11px] leading-[18px] font-bold text-white shadow-sm ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className="fixed inset-x-2 top-16 z-50 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl md:absolute md:inset-x-auto md:top-12 md:right-0 md:w-[400px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-neutral-900">
              Thông báo
              {unread > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">{unread} mới</span>}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundEnabled}
                title={soundEnabled ? "Đang bật âm báo – bấm để tắt" : "Đang tắt âm báo – bấm để bật"}
                className="inline-flex size-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              >
                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                <span className="sr-only">{soundEnabled ? "Tắt âm báo" : "Bật âm báo"}</span>
              </button>
              <button
                type="button"
                onClick={() => markAllRead()}
                disabled={unread === 0 || markingAll}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-brand-link hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent"
              >
                <CheckCheck className="size-4" /> Đọc tất cả
              </button>
            </div>
          </div>

          <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
            {list.isPending ? (
              <div className="space-y-3 p-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="size-10 animate-pulse rounded-full bg-neutral-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-200" />
                      <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : list.isError ? (
              <p role="alert" className="p-6 text-center text-sm text-destructive">
                Không tải được thông báo. <button type="button" onClick={() => list.refetch()} className="font-semibold underline">Thử lại</button>
              </p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-neutral-500">
                <BellOff className="size-10 text-neutral-300" />
                <p className="text-sm font-medium text-neutral-700">Chưa có thông báo nào</p>
                <p className="text-xs">Thông báo về đơn hàng{admin ? " và yêu cầu cần xử lý" : " và hoa hồng"} sẽ hiện ở đây.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((n) => (
                  <NotificationRow key={n.id} n={n} onOpen={openItem} />
                ))}
              </ul>
            )}
            {list.hasNextPage && (
              <div className="border-t border-neutral-100 p-2 text-center">
                <button
                  type="button"
                  onClick={() => list.fetchNextPage()}
                  disabled={list.isFetchingNextPage}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-brand-link hover:bg-neutral-100 disabled:opacity-60"
                >
                  {list.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />} Xem thêm
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onOpen }: { n: NotificationItem; onOpen: (n: NotificationItem) => void }) {
  const { title, body, tone } = describeNotification(n);
  const Icon = ICONS[n.type] ?? Bell;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(n)}
        className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-neutral-50", !n.read && "bg-sky-50/60")}
      >
        <span className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full", TONE[tone])}>
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm", n.read ? "font-medium text-neutral-800" : "font-bold text-neutral-900")}>{title}</span>
          {body && <span className="mt-0.5 block text-[13px] leading-snug text-neutral-600">{body}</span>}
          <span className={cn("mt-1 block text-xs", n.read ? "text-neutral-400" : "font-semibold text-brand-link")}>{timeAgo(n.createdAt)}</span>
        </span>
        {!n.read && <span aria-label="Chưa đọc" className="mt-2 size-2.5 shrink-0 rounded-full bg-brand-link" />}
      </button>
    </li>
  );
}
