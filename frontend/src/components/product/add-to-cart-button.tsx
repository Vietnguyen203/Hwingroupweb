"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "@/stores/cart";

type Props = {
  product: Omit<CartLine, "quantity">;
  disabled?: boolean;
  /** compact: nút nhỏ trên thẻ sản phẩm; full: có chọn số lượng (trang chi tiết). */
  variant?: "compact" | "full";
};

export function AddToCartButton({ product, disabled, variant = "compact" }: Props) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add(product, variant === "full" ? qty : 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (disabled) {
    return (
      <Button disabled variant="secondary" className={variant === "full" ? "h-12 w-full text-base" : "w-full"}>
        Hết hàng
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button onClick={onAdd} className="w-full" aria-label={`Thêm ${product.name} vào giỏ`}>
        {added ? <Check /> : <ShoppingCart />}
        {added ? "Đã thêm" : "Thêm"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 items-center rounded-lg border bg-white">
        <button type="button" className="px-3" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
        <button type="button" className="px-3" aria-label="Tăng" onClick={() => setQty((q) => Math.min(99, q + 1))}>
          <Plus className="size-4" />
        </button>
      </div>
      <Button onClick={onAdd} className="h-12 flex-1 text-base">
        {added ? <Check /> : <ShoppingCart />}
        {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
      </Button>
    </div>
  );
}
