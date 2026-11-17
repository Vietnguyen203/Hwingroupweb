"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

import { showToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatVnd } from "@/lib/format";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart, type CartLine } from "@/stores/cart-store";

/**
 * Gợi ý món bán chạy chưa có trong giỏ. Khi còn thiếu tiền để được miễn phí giao hàng, ưu tiên các món
 * (rẻ nhất trước) mà chỉ cần thêm 1 món là đủ; ngược lại gợi ý các món bán chạy bình thường.
 */
function useSuggestions(lines: CartLine[], remaining: number, limit: number, enabled: boolean) {
  const query = useQuery({
    queryKey: ["bestsellers", "cart-suggestions"],
    queryFn: () => api<ProductCardResponse[]>("/api/products/bestsellers?limit=16"),
    enabled,
    staleTime: 5 * 60_000,
  });
  const inCart = new Set(lines.map((l) => l.productId));
  const pool = (query.data ?? []).filter((p) => p.inStock && !inCart.has(p.id));
  if (remaining <= 0) return pool.slice(0, limit);
  const enough = pool.filter((p) => p.price >= remaining).sort((a, b) => a.price - b.price);
  const rest = pool.filter((p) => p.price < remaining);
  return [...enough, ...rest].slice(0, limit);
}

export function CartSuggestions({ lines, remaining, variant = "page", className }: {
  lines: CartLine[];
  /** Số tiền còn thiếu để được miễn phí giao hàng (0 = đã đủ hoặc không có chương trình). */
  remaining: number;
  variant?: "page" | "drawer";
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const items = useSuggestions(lines, remaining, variant === "page" ? 4 : 3, lines.length > 0);
  if (items.length === 0) return null;

  const addSilently = (p: ProductCardResponse) => {
    // Không mở lại giỏ nhỏ: khách đang ở giỏ hàng nên chỉ báo đã thêm
    add({ productId: p.id, slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl }, 1, false);
    window.dispatchEvent(new CustomEvent("hwin:cart-added"));
    showToast({ type: "success", message: `Đã thêm "${p.name}" vào giỏ hàng` });
  };

  const title = remaining > 0 ? "Mua thêm để được miễn phí giao hàng" : "Có thể bạn cũng thích";
  const drawer = variant === "drawer";

  return (
    <section className={cn(drawer ? "" : "rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs md:p-5", className)}>
      <h3 className={cn("flex items-center gap-2 font-bold text-neutral-900", drawer ? "mb-2 text-sm" : "mb-3 text-base")}>
        <Sparkles className="size-4 text-brand-red" /> {title}
      </h3>
      {remaining > 0 && (
        <p className="mb-3 text-xs text-neutral-500">Bạn còn thiếu <b className="text-brand-red">{formatVnd(remaining)}</b> để được miễn phí giao hàng.</p>
      )}
      <ul className={cn(drawer ? "space-y-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4")}>
        {items.map((p) => {
          const enough = remaining > 0 && p.price >= remaining;
          return (
            <li key={p.id} className={cn("flex gap-3 rounded-xl border border-neutral-200 p-2.5", drawer ? "items-center" : "flex-col")}>
              <Link href={`/products/${p.slug}`} className={cn("relative shrink-0 overflow-hidden rounded-lg bg-neutral-50", drawer ? "size-14" : "aspect-square w-full")}>
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- ảnh gợi ý nhỏ
                  <img src={p.imageUrl} alt={p.name} loading="lazy" className="size-full object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-medium text-neutral-800 hover:text-brand">{p.name}</Link>
                <p className="mt-0.5 text-sm font-bold text-brand-red">{formatVnd(p.price)}</p>
                {enough && <span className="mt-0.5 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">Thêm món này là đủ freeship</span>}
              </div>
              <button
                type="button"
                onClick={() => addSilently(p)}
                aria-label={`Thêm ${p.name} vào giỏ`}
                className={cn("flex shrink-0 items-center justify-center gap-1 rounded-lg bg-brand text-xs font-semibold text-white transition hover:brightness-110 active:scale-95",
                  drawer ? "size-9" : "h-9 w-full")}
              >
                <Plus className="size-4" />{!drawer && "Thêm vào giỏ"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
