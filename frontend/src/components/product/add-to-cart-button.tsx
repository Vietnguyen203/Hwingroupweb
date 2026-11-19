"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import type { CartLine } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

type Props = {
  product: Omit<CartLine, "quantity">;
  disabled?: boolean;
  /**
   * icon: nút tròn nhỏ; pill: nút chữ "Thêm vào giỏ" (thẻ sản phẩm, đủ rộng để chạm trên điện thoại);
   * full: có chọn số lượng (trang chi tiết, hộp xem nhanh).
   */
  variant?: "icon" | "pill" | "full";
  className?: string;
};

export function AddToCartButton({ product, disabled, variant = "icon", className }: Props) {
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Ảnh sản phẩm bay vào giỏ rồi mới mở giỏ; sự kiện "hwin:cart-added" (giỏ nảy số) do hiệu ứng bắn ra
  const onAdd = (e: React.MouseEvent<HTMLElement>) => {
    addToCart(product, variant === "full" ? qty : 1, e.currentTarget);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        aria-label={disabled ? "Hết hàng" : `Thêm ${product.name} vào giỏ`}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition duration-200 ease-spring hover:scale-110 hover:shadow-md active:scale-90 disabled:opacity-40 disabled:hover:scale-100",
          added ? "bg-emerald-600 shadow-emerald-600/30" : "bg-brand-cta hover:bg-brand-dark",
          className,
        )}
      >
        {added ? <Check className="size-4 animate-in zoom-in-50 duration-200" /> : <ShoppingCart className="size-4" />}
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        aria-label={disabled ? "Hết hàng" : `Thêm ${product.name} vào giỏ`}
        className={cn(
          "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold whitespace-nowrap text-white @min-[13.5rem]:px-3 @min-[13.5rem]:text-sm shadow-sm transition duration-200 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
          added ? "bg-emerald-600" : "bg-brand-cta hover:bg-brand-dark",
          className,
        )}
      >
        {added ? <Check className="size-4 shrink-0 animate-in zoom-in-50 duration-200" /> : <ShoppingCart className="size-4 shrink-0" />}
        {/* Thẻ hẹp (< 13,5rem, nhờ container query của thẻ sản phẩm) dùng nhãn ngắn để không bị cắt chữ */}
        <span aria-live="polite" className="truncate">
          {added ? "Đã thêm" : (<><span className="@max-[13.5rem]:hidden">Thêm vào giỏ</span><span className="hidden @max-[13.5rem]:inline">Thêm giỏ</span></>)}
        </span>
      </button>
    );
  }

  if (disabled) {
    return <Button disabled variant="secondary" className="h-12 w-full rounded-full text-base">Hết hàng</Button>;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-12 items-center rounded-full border border-neutral-200 bg-white">
        <button type="button" className="px-3.5 text-neutral-600 transition hover:text-brand" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
        <button type="button" className="px-3.5 text-neutral-600 transition hover:text-brand" aria-label="Tăng" onClick={() => setQty((q) => Math.min(99, q + 1))}>
          <Plus className="size-4" />
        </button>
      </div>
      <Button onClick={onAdd} className={cn("h-12 flex-1 rounded-full text-base font-bold shadow-sm transition active:scale-[0.98]", added ? "bg-emerald-600 hover:bg-emerald-600" : "bg-brand-cta hover:bg-brand-dark")}>
        {added ? <Check /> : <ShoppingCart />}
        {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
      </Button>
    </div>
  );
}
