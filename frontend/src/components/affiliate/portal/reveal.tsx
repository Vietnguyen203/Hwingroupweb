import { cn } from "@/lib/utils";

/** Khối hiện dần + trượt nhẹ lên khi vào trang (so le theo `delay` ms). Người dùng bật "giảm chuyển động" thì không có hiệu ứng. */
export function Reveal({ delay = 0, className, children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn("animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500", className)}
    >
      {children}
    </div>
  );
}
