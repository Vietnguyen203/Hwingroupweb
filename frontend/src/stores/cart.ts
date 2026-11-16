"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Giỏ hàng khi CHƯA đăng nhập: lưu localStorage.
 * Giá ở đây chỉ để hiển thị – backend luôn tính lại giá khi đặt hàng.
 * Sau khi đăng nhập (Chặng 2) sẽ gộp lên giỏ server qua POST /api/cart/merge.
 */
export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

const MAX_QTY = 99;

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + quantity) }
                  : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, quantity: Math.min(MAX_QTY, quantity) }] };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l,
          ),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "hwin-cart" },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0);
