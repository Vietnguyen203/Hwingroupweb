"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ITEMS = 200;

/**
 * Danh sách yêu thích: chỉ lưu trên trình duyệt (localStorage), chưa có API backend.
 * Chỉ giữ id sản phẩm; tối đa {@code MAX_ITEMS} món (món cũ nhất bị bỏ khi vượt).
 */
type WishlistState = {
  ids: string[];
  /** Đổi trạng thái yêu thích của một sản phẩm; trả về true nếu vừa được thêm. */
  toggle: (productId: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) => {
        const has = get().ids.includes(productId);
        set({ ids: has ? get().ids.filter((id) => id !== productId) : [...get().ids, productId].slice(-MAX_ITEMS) });
        return !has;
      },
    }),
    { name: "hwin-wishlist-v1" },
  ),
);
