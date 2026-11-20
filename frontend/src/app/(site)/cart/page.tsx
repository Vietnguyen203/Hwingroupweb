"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Minus, Plus, ShieldCheck, ShoppingBag, ShoppingCart, Trash2, Truck } from "lucide-react";

import { CartSuggestions } from "@/components/cart/cart-suggestions";
import { PageHeading } from "@/components/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { showToast } from "@/components/ui/toast";
import { LINE_PROBLEM, useCartQuote } from "@/hooks/use-cart-quote";
import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cartSubtotal, useCart } from "@/stores/cart-store";

/**
 * Trang giỏ hàng chuẩn thương mại điện tử hiện đại của Phúc Vị Foods:
 * - Danh sách sản phẩm dạng bảng rộng thoáng (desktop) / card (mobile)
 * - Tăng giảm số lượng, xóa từng món, xóa tất cả có xác nhận modal
 * - Tính toán giá tự động (backend quote + fallback local an toàn)
 * - Thanh tiến trình Freeship kích thích mua thêm
 * - Khối thanh toán tổng hợp rõ ràng và cam kết dịch vụ uy tín
 */
export default function CartPage() {
  const mounted = useMounted();
  const { lines, setQuantity, remove, clear } = useCart();
  const quote = useCartQuote(lines, mounted);
  const me = useMe();

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!mounted) {
    return (
      <div className="px-3 py-4 md:px-0 md:py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200 mb-6" />
        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl bg-neutral-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-neutral-200" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-neutral-200" />
        </div>
      </div>
    );
  }

  // Giỏ hàng trống
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-brand-soft text-brand">
          <ShoppingCart className="size-12 stroke-[1.5]" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-neutral-800 md:text-2xl">
          Giỏ hàng của bạn còn trống
        </h1>
        <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
          Chưa có món ngon nào trong giỏ. Phúc Vị Foods có rất nhiều đặc sản tươi ngon và combo ưu đãi hấp dẫn đang chờ bạn!
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className={cn(buttonVariants(), "h-11 rounded-full px-8 bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark font-bold")}
          >
            Khám phá thực đơn
          </Link>
          <Link
            href="/search?sort=PRICE_ASC"
            className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full px-8")}
          >
            Xem sản phẩm khuyến mãi
          </Link>
        </div>
      </div>
    );
  }

  const localSubtotal = cartSubtotal(lines);
  const view = quote.data;
  const byId = new Map(view?.lines.map((l) => [l.productId, l]));

  // Tính toán an toàn: Ưu tiên giá quote từ backend, fallback giá lưu tại local nếu mạng trễ
  const finalSubtotal = view?.subtotal ?? localSubtotal;
  const freeshipThreshold = view?.freeShippingThreshold ?? 0; // do backend quyết định; 0 = không có miễn phí ship
  const shippingFee = view?.shippingFee ?? 0;
  const finalTotal = view?.total ?? (finalSubtotal + shippingFee);
  const checkoutReady = view ? view.checkoutReady : lines.length > 0;
  const checkoutHref = me.data ? "/checkout" : "/login?next=/checkout";

  const totalItemCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const remainingForFreeship = Math.max(0, freeshipThreshold - finalSubtotal);
  const freeshipProgress = freeshipThreshold > 0 ? Math.min(100, Math.round((finalSubtotal / freeshipThreshold) * 100)) : 0;

  const handleDeleteItem = (productId: string, name: string) => {
    remove(productId);
    showToast({ message: `Đã xóa "${name}" khỏi giỏ hàng`, type: "info" });
  };

  const handleClearAll = () => {
    clear();
    setClearConfirmOpen(false);
    showToast({ message: "Đã làm trống giỏ hàng", type: "info" });
  };

  return (
    <div>
      <PageHeading title="Giỏ hàng" subtitle={`Bạn đang chọn ${totalItemCount} món`} />
      <div className="space-y-6 px-3 pb-8 md:px-0 md:pb-12">

      {/* Freeship Alert Banner – chỉ hiện khi backend có chương trình miễn phí ship */}
      {freeshipThreshold > 0 && (
      <div className="rounded-xl bg-brand-honey/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-honey text-neutral-900">
              <Truck className="size-4" />
            </div>
            <div>
              {remainingForFreeship > 0 ? (
                <p className="text-sm text-neutral-800">
                  Mua thêm <strong className="text-brand-red font-bold">{formatVnd(remainingForFreeship)}</strong> để được <strong className="text-brand-green font-bold">miễn phí giao hàng</strong> toàn quốc!
                </p>
              ) : (
                <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Đơn hàng của bạn đã đủ điều kiện được Miễn phí giao hàng (Freeship)!
                </p>
              )}
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Mua thêm sản phẩm khác <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-neutral-200/80">
          <div
            className="h-full rounded-full bg-brand-green transition-all duration-500 ease-out"
            style={{ width: `${freeshipProgress}%` }}
          />
        </div>
      </div>
      )}

      {/* Main Grid: Products List & Summary Card */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Products List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-xl font-bold text-neutral-900 md:text-2xl">
              Sản phẩm trong giỏ
            </h2>
            <button
              type="button"
              onClick={() => setClearConfirmOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="size-3.5" />
              Xóa tất cả
            </button>
          </div>

          {/* Table Header for Desktop */}
          <div className="hidden rounded-xl bg-neutral-100/80 px-4 py-2.5 text-xs font-semibold text-neutral-600 md:grid md:grid-cols-[2fr_1fr_1.2fr_1.2fr_40px] md:items-center">
            <span>Sản phẩm</span>
            <span className="text-center">Đơn giá</span>
            <span className="text-center">Số lượng</span>
            <span className="text-right">Thành tiền</span>
            <span />
          </div>

          {/* Item Rows */}
          <div className="space-y-3">
            {lines.map((item) => {
              const v = byId.get(item.productId);
              const unitPrice = v?.unitPrice ?? item.price;
              const lineTotal = unitPrice * item.quantity;

              return (
                <div
                  key={item.productId}
                  className="group relative flex flex-col gap-3 rounded-xl bg-white p-3.5 ring-1 ring-black/[0.06] md:grid md:grid-cols-[2fr_1fr_1.2fr_1.2fr_40px] md:items-center md:gap-4 md:p-4"
                >
                  {/* Product info: Image + Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative size-18 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 md:size-20"
                    >
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="size-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-neutral-300">
                          <ShoppingBag className="size-7" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.slug}`}
                        className="line-clamp-2 text-sm font-semibold text-neutral-800 hover:text-brand transition-colors"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1 md:hidden">
                        <span className="font-display text-sm font-bold text-brand-red">{formatVnd(unitPrice)}</span>
                      </div>
                      {v?.problem && (
                        <p className="mt-1 text-xs text-destructive font-medium">
                          ⚠ {LINE_PROBLEM[v.problem] ?? v.problem}
                          {v.problem === "INSUFFICIENT_STOCK" ? ` (kho còn ${v.stock})` : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Unit price (Desktop) */}
                  <div className="hidden text-center text-sm font-bold text-neutral-700 md:block">
                    {formatVnd(unitPrice)}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between md:justify-center">
                    <span className="text-xs text-neutral-500 md:hidden">Số lượng:</span>
                    <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="flex size-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-white hover:shadow-xs disabled:opacity-30 transition-all"
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        className="flex size-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-white hover:shadow-xs disabled:opacity-30 transition-all"
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    {/* Line total on Mobile */}
                    <div className="text-right md:hidden">
                      <span className="text-sm font-bold text-brand-red">{formatVnd(lineTotal)}</span>
                    </div>
                  </div>

                  {/* Line Total (Desktop) */}
                  <div className="hidden text-right font-display text-base font-bold text-brand-red md:block">
                    {formatVnd(lineTotal)}
                  </div>

                  {/* Remove Button */}
                  <div className="hidden text-right md:block">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.productId, item.name)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Xóa món này"
                      aria-label="Xóa món này"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gợi ý mua thêm (ưu tiên món giúp đủ miễn phí giao hàng) */}
          <CartSuggestions lines={lines} remaining={remainingForFreeship} />

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
            >
              <ArrowLeft className="size-4" />
              Tiếp tục chọn thêm sản phẩm
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-xl bg-white p-5 ring-1 ring-black/[0.06] space-y-4">
            <h2 className="border-b border-neutral-100 pb-3 text-base font-bold text-neutral-900">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Tạm tính ({totalItemCount} sản phẩm)</span>
                <span className="font-semibold text-neutral-800">{formatVnd(finalSubtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span className="flex items-center gap-1">
                  Phí giao hàng
                  <span title={freeshipThreshold > 0 ? `Miễn phí giao hàng cho đơn từ ${formatVnd(freeshipThreshold)}` : "Phí giao hàng cố định"} className="cursor-help text-neutral-400">
                    <HelpCircle className="size-3.5" />
                  </span>
                </span>
                {shippingFee === 0 ? (
                  <span className="font-semibold text-emerald-600">Miễn phí</span>
                ) : (
                  <span className="font-semibold text-neutral-800">{formatVnd(shippingFee)}</span>
                )}
              </div>

              <div className="border-t border-dashed border-neutral-200 pt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-base font-bold text-neutral-900">Tổng thanh toán</span>
                  <p className="text-[11px] text-neutral-400">(Đã bao gồm VAT nếu có)</p>
                </div>
                <span className="font-display text-2xl font-extrabold text-brand-red">
                  {formatVnd(finalTotal)}
                </span>
              </div>
            </div>

            {!checkoutReady && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-destructive">
                Vui lòng xử lý các sản phẩm hết hàng hoặc không đủ tồn kho trước khi thanh toán.
              </div>
            )}

            {/* Checkout Button */}
            <Link
              href={checkoutHref}
              aria-disabled={!checkoutReady}
              className={cn(
                buttonVariants(),
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold bg-brand-cta text-white hover:bg-brand-dark transition-colors active:scale-[0.98]",
                !checkoutReady && "pointer-events-none opacity-50"
              )}
            >
              {me.data ? "Tiến hành đặt hàng" : "Đăng nhập để đặt hàng"}
              <ArrowRight className="size-4" />
            </Link>

            {!me.data && (
              <p className="text-center text-xs text-neutral-500">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="font-semibold text-brand hover:underline">
                  Đăng ký ngay
                </Link>{" "}
                để nhận ưu đãi thành viên.
              </p>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="rounded-xl bg-neutral-100/70 p-4 space-y-3">
            <h3 className="text-xs font-bold text-neutral-600">
              Quyền lợi mua sắm tại Phúc Vị Foods
            </h3>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>100% Thực phẩm sạch, có chứng nhận VSATTP</span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="size-4 text-brand shrink-0" />
                <span>Giao hàng hỏa tốc trong 2h tại khu vực nội thành</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                <span>Đổi trả linh hoạt trong vòng 7 ngày nếu lỗi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal xác nhận làm trống giỏ hàng */}
      <ConfirmModal
        isOpen={clearConfirmOpen}
        title="Làm trống giỏ hàng"
        message="Bạn có chắc chắn muốn xóa toàn bộ sản phẩm đang có trong giỏ hàng không?"
        confirmText="Xóa tất cả"
        cancelText="Giữ lại"
        tone="danger"
        onConfirm={handleClearAll}
        onCancel={() => setClearConfirmOpen(false)}
      />
      </div>
    </div>
  );
}