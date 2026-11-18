"use client";

import { cn } from "@/lib/utils";

/** Khối giao diện dùng chung của trang admin: tiêu đề to rõ ràng, khu vực thao tác nhanh. */
export function AdminPage({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">{title}</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">Bảng quản trị hệ thống Hwin Group</p>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Thanh lọc dữ liệu chuyên nghiệp: khoảng cách rộng, nền trắng, viền tinh tế */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
      {children}
    </div>
  );
}

/** Dropdown lựa chọn được tùy biến đồng bộ với hệ thống */
export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-xs outline-none transition hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20",
        className
      )}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

/** Bảng dữ liệu chuẩn Enterprise: viền bo tròn, màu nền tương phản dịu mắt, cuộn ngang an toàn */
/** `leading`: ô đầu tiên của hàng tiêu đề (VD ô tích chọn tất cả); các hàng tự thêm ô tương ứng. */
export function Table({ head, leading, children }: { head: string[]; leading?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              {leading !== undefined && <th className="w-10 px-4 py-3.5">{leading}</th>}
              {head.map((h) => (
                <th key={h} className="px-4 py-3.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/** Nút hành động nhanh trong bảng dữ liệu hoặc form quản trị */
export function ActionButton({
  children,
  onClick,
  tone = "default",
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger" | "primary";
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all duration-150 disabled:opacity-40",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
          : tone === "primary"
          ? "border-transparent bg-brand text-white hover:bg-brand-hover shadow-sm shadow-brand/20"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {children}
    </button>
  );
}

/** Nút chỉ có biểu tượng cho cột thao tác (gọn); `label` vừa là chú thích khi rê chuột vừa là tên cho trình đọc màn hình. */
export function IconButton({
  label,
  onClick,
  tone = "default",
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg border shadow-xs transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100"
          : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:bg-brand-soft hover:text-brand"
      )}
    >
      {children}
    </button>
  );
}

/** Hiệu ứng skeleton loading mô phỏng cấu trúc bảng dữ liệu */
export function Loading() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
      <div className="space-y-3 pt-2">
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-50" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-50" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-slate-50" />
      </div>
    </div>
  );
}
