"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavSelectOption = { value: string; label: string; href: string };

/**
 * Combobox (thẻ select gốc: bàn phím, trình đọc màn hình và bộ chọn của điện thoại dùng được ngay) mà khi đổi lựa chọn
 * thì chuyển sang đường dẫn của lựa chọn đó. Dùng cho bộ lọc / sắp xếp lưu trên URL (VD ?sort=, danh mục).
 * Server component tính sẵn `href` cho từng lựa chọn rồi truyền xuống (hàm không truyền được qua ranh giới server -> client).
 */
export function NavSelect({ label, icon, value, options, className }: {
  label: string;
  icon?: ReactNode;
  value: string;
  options: NavSelectOption[];
  className?: string;
}) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Giá trị đang hiển thị: đổi ngay khi chọn (không giật về giá trị cũ trong lúc chờ chuyển trang), đồng bộ lại khi URL / props đổi
  const [shown, setShown] = useState({ prop: value, value });
  if (shown.prop !== value) setShown({ prop: value, value });

  return (
    <div
      aria-busy={pending}
      className={cn(
        "inline-flex max-w-full items-center rounded-full bg-white pl-4 shadow-card ring-1 ring-black/[0.08] transition duration-200 focus-within:ring-2 focus-within:ring-brand hover:ring-brand/40",
        pending && "opacity-70",
        className,
      )}
    >
      <label htmlFor={id} className="flex shrink-0 items-center gap-1.5 text-sm text-neutral-500">
        {icon}
        {label}:
      </label>
      <div className="relative min-w-0">
        <select
          id={id}
          value={shown.value}
          onChange={(e) => {
            const option = options.find((o) => o.value === e.target.value);
            if (!option) return;
            setShown((s) => ({ ...s, value: option.value }));
            startTransition(() => router.push(option.href));
          }}
          className="h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full bg-transparent pr-10 pl-2 text-sm font-bold text-neutral-900 outline-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-neutral-500" />
      </div>
    </div>
  );
}
