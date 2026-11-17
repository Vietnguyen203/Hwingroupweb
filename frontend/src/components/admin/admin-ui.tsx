"use client";

import { cn } from "@/lib/utils";

/** Khối giao diện dùng chung của trang admin. */
export function AdminPage({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-brand">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">{children}</div>;
}

export function Select({ value, onChange, options, className }: {
  value: string; onChange: (v: string) => void; options: [string, string][]; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
            className={cn("h-9 rounded-lg border border-input bg-white px-2 text-sm", className)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

/** Bảng cuộn ngang trên mobile. */
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b bg-neutral-50 text-left text-xs text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function ActionButton({ children, onClick, tone = "default", disabled }: {
  children: React.ReactNode; onClick: () => void; tone?: "default" | "danger"; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
            className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-40",
              tone === "danger" ? "border-red-200 text-red-700 hover:bg-red-50" : "bg-white hover:bg-brand-soft")}>
      {children}
    </button>
  );
}

export function Loading() {
  return <div className="h-40 animate-pulse rounded-2xl bg-neutral-200" />;
}
