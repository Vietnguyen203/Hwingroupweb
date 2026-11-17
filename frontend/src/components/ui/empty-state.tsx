import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Trạng thái rỗng / lỗi thống nhất: biểu tượng tròn, tiêu đề, mô tả ngắn, nút hành động. */
export function EmptyState({ icon: Icon, title, description, actions, className }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center md:py-20", className)}>
      <span className="flex size-20 items-center justify-center rounded-full bg-red-50 text-brand-red">
        <Icon className="size-10 stroke-[1.5]" />
      </span>
      <h1 className="mt-5 text-xl font-bold text-neutral-900 md:text-2xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-neutral-500">{description}</p>}
      {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );
}

/** Nút hành động dùng trong EmptyState (chính = nền thương hiệu, phụ = viền). */
export const emptyStateButton = {
  primary: "inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:brightness-110",
  secondary: "inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50",
};
