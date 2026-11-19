"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

/** Khối mà các phần tử con trượt vào lần lượt (so le) khi cuộn tới – dùng cho hàng thẻ, ô truy cập nhanh… */
export function RevealGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  const { ref, state } = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-reveal={state} className={cn("scroll-reveal", className)}>
      {children}
    </div>
  );
}
