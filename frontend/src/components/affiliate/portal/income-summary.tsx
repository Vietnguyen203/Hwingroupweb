import { Skeleton } from "@/components/ui/skeleton";
import type { AffiliateDashboard } from "@/lib/affiliate";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Thẻ tổng hợp thu nhập: chờ xác nhận / đã duyệt / có thể rút (+ đã nhận ở chân bảng). */
export function IncomeSummary({ dash, loading }: { dash?: AffiliateDashboard; loading?: boolean }) {
  const rows = dash && [
    { label: "Chờ xác nhận", dot: "bg-amber-400", count: dash.commissions.PENDING?.count ?? 0, amount: dash.commissions.PENDING?.amount ?? 0 },
    { label: "Đã duyệt", dot: "bg-green-500", count: dash.commissions.APPROVED?.count ?? 0, amount: dash.commissions.APPROVED?.amount ?? 0 },
    { label: "Có thể rút", dot: "bg-brand-red", count: null, amount: dash.availableBalance, strong: true },
  ];

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">Thu nhập của bạn</h2>
      <p className="mt-0.5 text-sm text-gray-500">Hoa hồng được duyệt sau 7 ngày kể từ khi giao hàng thành công.</p>

      {loading || !rows || !dash ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 bg-gray-100" />)}
        </div>
      ) : (
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">Tổng hợp thu nhập hoa hồng</caption>
          <thead className="sr-only">
            <tr><th scope="col">Khoản</th><th scope="col">Số đơn</th><th scope="col">Số tiền</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="py-3 pr-3 text-left font-medium text-gray-700">
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden className={cn("size-2.5 rounded-full", r.dot)} />
                    {r.label}
                  </span>
                </th>
                <td className="px-3 py-3 text-right text-gray-500">{r.count === null ? "" : `${r.count} đơn`}</td>
                <td className={cn("py-3 text-right text-base font-bold tabular-nums", r.strong ? "text-brand-red" : "text-gray-900")}>
                  {formatVnd(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <th scope="row" className="pt-3 text-left text-xs font-medium text-gray-500">Đã nhận về tài khoản</th>
              <td />
              <td className="pt-3 text-right text-sm font-semibold text-gray-600 tabular-nums">{formatVnd(dash.paidOut)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
