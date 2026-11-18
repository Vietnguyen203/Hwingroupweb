"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, Loader2, X } from "lucide-react";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Price } from "@/components/product/price";
import { WishlistButton } from "@/components/product/wishlist-button";
import { useProductDetail } from "@/hooks/use-product-detail";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Xem nhanh sản phẩm ngay trên trang (không rời trang đang xem): ảnh, giá, mô tả ngắn, chọn số lượng và thêm vào giỏ.
 * Chi tiết lấy từ API sản phẩm có sẵn; trong lúc tải vẫn hiện ngay dữ liệu của thẻ. Desktop: hộp giữa màn hình;
 * mobile: tấm trượt từ dưới lên. Esc / bấm nền để đóng, Tab quay vòng trong hộp, trả lại focus cho nút đã mở.
 * Render qua portal để không bị thẻ (đang transform khi hover) làm lệch vị trí.
 */
export function QuickViewDialog({ product, onClose }: { product: ProductCardResponse; onClose: () => void }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const detail = useProductDetail(product.slug, true);
  const [picked, setPicked] = useState(0);

  const images = detail.data?.images?.length ? detail.data.images : product.imageUrl ? [product.imageUrl] : [];
  const main = images[Math.min(picked, images.length - 1)];
  const stock = detail.data?.stock;
  const specs: [string, string | null | undefined][] = [
    ["Thương hiệu", detail.data?.brand],
    ["Khối lượng", detail.data?.weight],
    ["Đóng gói", detail.data?.packaging],
    ["Xuất xứ", detail.data?.origin],
  ];

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-neutral-950/55 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up relative grid max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-pop sm:max-h-[90vh] sm:grid-cols-2 sm:rounded-3xl"
      >
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Đóng xem nhanh"
          className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow ring-1 ring-black/5 transition hover:scale-105 hover:bg-white"
        >
          <X className="size-5" />
        </button>

        {/* Ảnh */}
        <div className="bg-neutral-50 p-4 sm:p-5">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend
              <img src={main} alt={product.name} className="size-full object-cover" />
            ) : (
              <div className="size-full animate-pulse bg-neutral-200" />
            )}
            {product.discountPercent > 0 && (
              <span className="absolute top-3 left-3 rounded-lg bg-brand-red px-2 py-0.5 text-xs font-extrabold text-white">-{product.discountPercent}%</span>
            )}
          </div>
          {images.length > 1 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.slice(0, 5).map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    onClick={() => setPicked(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                    aria-pressed={i === picked}
                    className={cn("block size-14 overflow-hidden rounded-xl border-2 transition", i === picked ? "border-brand" : "border-transparent opacity-70 hover:opacity-100")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Thông tin */}
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="pr-8">
            <h2 id={titleId} className="text-lg leading-snug font-extrabold text-neutral-900 sm:text-xl">{product.name}</h2>
            {product.unit && <p className="mt-0.5 text-sm text-neutral-500">{product.unit}</p>}
          </div>

          <div className="rounded-2xl bg-brand-soft/70 p-4">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            {product.salePercent > 0 && <p className="mt-1 text-xs font-semibold text-brand-red">Đã gồm giảm thêm {product.salePercent}%</p>}
          </div>

          {detail.isPending ? (
            <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="size-4 animate-spin" /> Đang tải mô tả…</p>
          ) : (
            <>
              {detail.data?.shortDescription && <p className="line-clamp-4 text-sm leading-6 text-neutral-700">{detail.data.shortDescription}</p>}
              <dl className="grid grid-cols-[96px_1fr] gap-y-1.5 text-sm">
                {specs.map(([k, v]) => v && (
                  <div key={k} className="contents">
                    <dt className="text-neutral-500">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
                <dt className="text-neutral-500">Tình trạng</dt>
                <dd className={cn("font-semibold", product.inStock ? "text-emerald-700" : "text-brand-red")}>
                  {product.inStock ? (stock != null ? `Còn hàng (${stock})` : "Còn hàng") : "Hết hàng"}
                </dd>
              </dl>
            </>
          )}

          <div className="mt-auto space-y-3 pt-1">
            <AddToCartButton
              variant="full"
              disabled={!product.inStock}
              product={{ productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl }}
            />
            <div className="flex items-center justify-between gap-3">
              <Link href={`/products/${product.slug}`} onClick={onClose} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-link hover:underline">
                Xem trang chi tiết <ArrowRight className="size-4" />
              </Link>
              <WishlistButton productId={product.id} name={product.name} className="bg-neutral-100 shadow-none ring-0" />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
