"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist-store";

/**
 * Nút trái tim yêu thích: nảy lên + tia sáng loang ra khi thêm. Luôn hiện (không cần rê chuột) nên dùng được trên cảm ứng;
 * có aria-pressed cho trình đọc màn hình. Trạng thái lưu cục bộ (xem wishlist-store).
 */
export function WishlistButton({ productId, name, className }: { productId: string; name: string; className?: string }) {
  const mounted = useMounted();
  const active = useWishlist((s) => s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  const [burst, setBurst] = useState(0);
  const on = mounted && active; // lần render đầu luôn "chưa thích" để khớp HTML server

  return (
    <button
      type="button"
      onClick={() => {
        if (toggle(productId)) setBurst((n) => n + 1);
      }}
      aria-pressed={on}
      aria-label={on ? `Bỏ ${name} khỏi danh sách yêu thích` : `Thêm ${name} vào danh sách yêu thích`}
      title={on ? "Bỏ yêu thích" : "Yêu thích"}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-sm ring-1 ring-black/5 backdrop-blur transition duration-200 hover:scale-110 hover:text-brand-red active:scale-95",
        on && "text-brand-red",
        className,
      )}
    >
      {burst > 0 && <span key={burst} aria-hidden className="animate-heart-ring pointer-events-none absolute inset-0 rounded-full bg-brand-red/40" />}
      <Heart key={`h${burst}`} className={cn("relative size-[18px] transition-colors", on && "animate-heart-pop fill-current")} />
    </button>
  );
}
