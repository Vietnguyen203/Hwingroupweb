"use client";

import { api } from "@/lib/api";
import { useCart, type CartLine } from "@/stores/cart";

/**
 * Đồng bộ giỏ localStorage <-> giỏ server khi đã đăng nhập.
 * - Đăng nhập lần đầu trên trình duyệt: gộp giỏ local lên server (POST /api/cart/merge), rồi lấy giỏ server về.
 * - Sau đó mọi thay đổi giỏ local được đẩy lên server (thêm / đổi số lượng / xóa).
 * - Đăng xuất: xóa giỏ local (giỏ server vẫn giữ cho lần đăng nhập sau).
 * Giá hiển thị luôn lấy từ backend (POST /api/cart/quote); backend tính lại giá khi đặt hàng.
 */
const OWNER_KEY = "hwin-cart-owner";

export type ServerCart = {
  lines: { productId: string; slug: string; name: string; imageUrl: string | null; unitPrice: number; quantity: number; lineTotal: number; stock: number; problem: string | null }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  itemCount: number;
  checkoutReady: boolean;
};

let online = false; // true khi đã đăng nhập và đã gộp giỏ
let silent = false; // đang thay giỏ local bằng dữ liệu server -> không đẩy ngược lên

const toLocal = (c: ServerCart): CartLine[] =>
  c.lines.map((l) => ({ productId: l.productId, slug: l.slug, name: l.name, price: l.unitPrice, imageUrl: l.imageUrl, quantity: l.quantity }));

/** Thay giỏ local mà không đẩy thay đổi lên server. */
export function replaceLocalCart(lines: CartLine[]) {
  silent = true;
  useCart.setState({ lines });
  silent = false;
}

function readOwner() {
  try { return localStorage.getItem(OWNER_KEY); } catch { return null; }
}
function writeOwner(v: string | null) {
  try { if (v) localStorage.setItem(OWNER_KEY, v); else localStorage.removeItem(OWNER_KEY); } catch { /* bỏ qua */ }
}

/** Gọi khi biết trạng thái đăng nhập (userId hoặc null). */
export async function syncCartForUser(userId: string | null) {
  if (!userId) {
    online = false;
    if (readOwner()) { // vừa đăng xuất / hết phiên
      writeOwner(null);
      replaceLocalCart([]);
    }
    return;
  }
  const local = useCart.getState().lines;
  const server = readOwner() === userId
    ? await api<ServerCart>("/api/cart")
    : await api<ServerCart>("/api/cart/merge", { method: "POST", body: { items: local.map((l) => ({ productId: l.productId, quantity: l.quantity })) } });
  writeOwner(userId);
  replaceLocalCart(toLocal(server));
  online = true;
}

/** Đưa giỏ server về đúng giỏ local (gọi ngay trước khi đặt hàng để chắc chắn khớp). */
export async function reconcileServerCart(lines: CartLine[]) {
  const server = await api<ServerCart>("/api/cart");
  const have = new Map(server.lines.map((l) => [l.productId, l.quantity]));
  const want = new Map(lines.map((l) => [l.productId, l.quantity]));
  for (const [id] of have) if (!want.has(id)) await api(`/api/cart/items/${id}`, { method: "DELETE" });
  for (const [id, q] of want) {
    if (!have.has(id)) await api("/api/cart/items", { method: "POST", body: { productId: id, quantity: q } });
    else if (have.get(id) !== q) await api(`/api/cart/items/${id}`, { method: "PATCH", body: { quantity: q } });
  }
}

// Đẩy thay đổi giỏ local lên server (chỉ khi đã đăng nhập)
if (typeof window !== "undefined") {
  useCart.subscribe((state, prev) => {
    if (!online || silent) return;
    const before = new Map(prev.lines.map((l) => [l.productId, l.quantity]));
    const after = new Map(state.lines.map((l) => [l.productId, l.quantity]));
    const calls: Promise<unknown>[] = [];
    for (const [id, q] of after) {
      if (!before.has(id)) calls.push(api("/api/cart/items", { method: "POST", body: { productId: id, quantity: q } }));
      else if (before.get(id) !== q) calls.push(api(`/api/cart/items/${id}`, { method: "PATCH", body: { quantity: q } }));
    }
    for (const [id] of before) if (!after.has(id)) calls.push(api(`/api/cart/items/${id}`, { method: "DELETE" }));
    Promise.allSettled(calls); // lỗi bỏ qua: trước khi đặt hàng luôn reconcileServerCart
  });
}
