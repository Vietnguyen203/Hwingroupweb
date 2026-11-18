import { BadgeCheck, Banknote, CircleX, ShoppingBag, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo, type ActivityItem } from "@/lib/affiliate-stats";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PortalLink } from "./portal-link";

const TONE = {
  success: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
} as const;

function iconOf(a: ActivityItem): LucideIcon {
  if (a.kind === "payout") return Banknote;
  return a.tone === "danger" ? CircleX : a.tone === "success" ? BadgeCheck : ShoppingBag;
}

/** Dòng thời gian hoạt động gần đây: đơn mới ghi nhận, hoa hồng được duyệt, yêu cầu rút tiền. */
export function RecentActivity({ items, loading }: { items?: ActivityItem[]; loading?: boolean }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900">Hoạt động gần đây</h2>
        <PortalLink slug="earnings" className="text-sm font-semibold text-brand-link hover:underline">Xem tất cả</PortalLink>
      </div>

      {loading || !items ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 bg-gray-100" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Chưa có hoạt động nào. Hãy chia sẻ link giới thiệu để nhận đơn đầu tiên!</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100">
          {items.map((a) => {
            const Icon = iconOf(a);
            return (
              <li key={a.id} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hoverable:hover:bg-gray-50">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", TONE[a.tone])}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500">{timeAgo(a.at)}</p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-sm font-bold tabular-nums",
                    a.direction === "in" ? "text-green-600" : a.direction === "out" ? "text-gray-700" : "text-gray-400 line-through",
                  )}
                >
                  {a.direction === "in" ? "+" : a.direction === "out" ? "−" : ""}
                  {formatVnd(a.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
