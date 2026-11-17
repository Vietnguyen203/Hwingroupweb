"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Giỏ hàng khi CHƯA đăng nhập: lưu localStorage.
 * Giá ở đây chỉ để hiển thị – backend luôn tính lại giá khi đặt hàng.
 * Sau khi đăng nhập (Chặng 2) sẽ gộp lên giỏ server qua POST /api/me/cart/merge.
 */
export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

const MAX_QTY = 99;

type CartState = {
  lines: CartLine[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  /** openDrawer=false: thêm mà không mở giỏ nhỏ (khi khách đang ở trang giỏ hàng). */
  add: (line: Omit<CartLine, "quantity">, quantity?: number, openDrawer?: boolean) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isDrawerOpen: false,
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
      add: (line, quantity = 1, openDrawer = true) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + quantity) }
                  : l,
              ),
              isDrawerOpen: openDrawer ? true : s.isDrawerOpen, // mặc định tự mở giỏ nhỏ để khách thấy món đã vào giỏ
            };
          }
          return {
            lines: [...s.lines, { ...line, quantity: Math.min(MAX_QTY, quantity) }],
            isDrawerOpen: openDrawer ? true : s.isDrawerOpen,
          };
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
    {
      name: "hwin-cart-v2",
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0);
