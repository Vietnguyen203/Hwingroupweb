"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "@/stores/cart-store";

type Props = {
  product: Omit<CartLine, "quantity">;
  disabled?: boolean;
  /** icon: nút tròn trên thẻ sản phẩm; full: có chọn số lượng (trang chi tiết). */
  variant?: "icon" | "full";
};

export function AddToCartButton({ product, disabled, variant = "icon" }: Props) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add(product, variant === "full" ? qty : 1);
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
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eeeefc] text-[#6c64d9] transition active:scale-95 disabled:opacity-40"
      >
        {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
      </button>
    );
  }

  if (disabled) {
    return <Button disabled variant="secondary" className="h-12 w-full rounded-full text-base">Hết hàng</Button>;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 items-center rounded-full border bg-white">
        <button type="button" className="px-3" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
        <button type="button" className="px-3" aria-label="Tăng" onClick={() => setQty((q) => Math.min(99, q + 1))}>
          <Plus className="size-4" />
        </button>
      </div>
      <Button onClick={onAdd} className="h-12 flex-1 rounded-full text-base">
        {added ? <Check /> : <ShoppingCart />}
        {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
      </Button>
    </div>
  );
}
