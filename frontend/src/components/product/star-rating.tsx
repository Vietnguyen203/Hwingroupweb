import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Hàng 5 sao, tô theo điểm (hỗ trợ lẻ: 4.3 sao). */
export function StarRating({ value, size = "size-4", className }: { value: number; size?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className={cn("relative inline-block", size)}>
            <Star className={cn("absolute inset-0 text-neutral-300", size)} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn("fill-[#ffb400] text-[#ffb400]", size)} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
