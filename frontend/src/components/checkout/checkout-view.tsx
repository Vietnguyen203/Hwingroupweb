"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Check, ChevronRight, Lock, MapPin, QrCode, ShoppingBag, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { api, errorMessage } from "@/lib/api";
import { PAYMENT_METHOD, type AddressResponse, type OrderDetailResponse } from "@/lib/account";
import { reconcileServerCart, replaceLocalCart } from "@/lib/cart-sync";
import { formatVnd } from "@/lib/format";
import { validateEmail, validatePhone, validateRequired, validateTaxCode } from "@/lib/validation";
import { CheckoutSkeleton } from "@/components/skeletons/page-skeletons";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";

type AddressForm = { recipientName: string; recipientPhone: string; province: string; district: string; ward: string; street: string };
type Vat = { companyName: string; taxCode: string; address: string; email: string };
const EMPTY_ADDRESS: AddressForm = { recipientName: "", recipientPhone: "", province: "", district: "", ward: "", street: "" };
const NEW = "new";
const VALIDATION_MESSAGE = "Vui lòng kiểm tra lại các ô báo đỏ.";

/**
 * Thanh toán: địa chỉ (chọn từ sổ hoặc nhập mới) -> phương thức (COD / chuyển khoản QR) -> VAT (tùy chọn) -> đặt hàng.
 * Trước khi đặt, giỏ server được đưa về đúng giỏ đang hiển thị. Mã CTV do backend đọc từ cookie.
 */
export function CheckoutView() {
  const router = useRouter();
  const qc = useQueryClient();
  const mounted = useMounted();
  const me = useMe();
  const lines = useCart((s) => s.lines);
  const quote = useCartQuote(lines, mounted);
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api<AddressResponse[]>("/api/me/addresses"), enabled: !!me.data });

  const [picked, setPicked] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<"COD" | "BANK_QR">("COD");
  const [vatOn, setVatOn] = useState(false);
  const [vat, setVat] = useState<Vat>({ companyName: "", taxCode: "", address: "", email: "" });
  const [note, setNote] = useState("");
  const idempotencyKey = useRef<string | null>(null); // bấm 2 lần / mạng chập chờn không tạo 2 đơn
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Lỗi từng ô, báo ngay khi rời ô (blur) hoặc khi bấm Đặt hàng; khóa là tên ô (VD recipientPhone, vat.taxCode)
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (me.data === null) router.replace("/login?next=/checkout");
  }, [me.data, router]);

  const book = addresses.data ?? [];
  const selected = picked ?? (book.find((a) => a.isDefault)?.id ?? (book.length ? book[0].id : NEW));

  if (!mounted || !me.data) return <CheckoutSkeleton />;
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShoppingBag className="mx-auto size-14 stroke-[1.5] text-neutral-300" />
        <p className="mt-4 text-neutral-600">Giỏ hàng của bạn đang trống.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand-link hover:underline">Mua sắm ngay</Link>
      </div>
    );
  }

  /** Quy tắc kiểm tra từng ô; chỉ kiểm tra địa chỉ khi đang nhập địa chỉ mới, và VAT khi bật xuất hóa đơn. */
  function ruleFor(key: string, value: string): string | null {
    switch (key) {
      case "recipientName": return validateRequired(value, "Người nhận", 100);
      case "recipientPhone": return validatePhone(value);
      case "province": return validateRequired(value, "Tỉnh / Thành phố", 100);
      case "district": return validateRequired(value, "Quận / Huyện", 100);
      case "ward": return validateRequired(value, "Phường / Xã", 100);
      case "street": return validateRequired(value, "Số nhà, đường", 255);
      case "vat.companyName": return validateRequired(value, "Tên công ty", 255);
      case "vat.taxCode": return validateTaxCode(value);
      case "vat.address": return validateRequired(value, "Địa chỉ công ty", 500);
      case "vat.email": return validateEmail(value);
      default: return null;
    }
  }
  /** Giá trị hiện tại của một ô theo khóa (vat.* nằm trong form VAT). */
  const valueOf = (key: string) => (key.startsWith("vat.") ? vat[key.slice(4) as keyof Vat] : form[key as keyof AddressForm]);
  const fieldRule = (key: string) => ruleFor(key, valueOf(key));
  const ADDRESS_KEYS = ["recipientName", "recipientPhone", "province", "district", "ward", "street"];
  const VAT_KEYS = ["vat.companyName", "vat.taxCode", "vat.address", "vat.email"];
  const activeKeys = () => [...(selected === NEW ? ADDRESS_KEYS : []), ...(vatOn ? VAT_KEYS : [])];
  /** Đặt / xóa lỗi của một ô theo giá trị truyền vào (dùng khi rời ô và khi đang gõ vào ô đang báo lỗi). */
  const recheck = (key: string, value: string) => setErrors((prev) => {
    const msg = ruleFor(key, value);
    const next = { ...prev };
    if (msg) next[key] = msg; else delete next[key];
    // Hết lỗi ở mọi ô thì tắt dòng cảnh báo chung
    if (Object.keys(next).length === 0) setError((e) => (e === VALIDATION_MESSAGE ? null : e));
    return next;
  });
  const blurCheck = (key: string) => recheck(key, valueOf(key));

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    // Kiểm tra tất cả ô đang dùng; có lỗi thì hiện ngay và nhảy tới ô lỗi đầu tiên
    const found: Record<string, string> = {};
    for (const k of activeKeys()) {
      const msg = fieldRule(k);
      if (msg) found[k] = msg;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setError(VALIDATION_MESSAGE);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(true);
    setError(null);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const chosen = book.find((a) => a.id === selected);
      const shippingAddress = chosen
        ? { recipientName: chosen.recipientName, recipientPhone: chosen.recipientPhone, province: chosen.province, district: chosen.district, ward: chosen.ward, street: chosen.street }
        : form;
      if (!chosen && saveAddress) {
        await api("/api/me/addresses", { method: "POST", body: { ...form, makeDefault: book.length === 0 } }).catch(() => undefined);
      }
      await reconcileServerCart(lines);
      const order = await api<OrderDetailResponse>("/api/checkout/orders", {
        method: "POST",
        body: { shippingAddress, paymentMethod: method, vatInvoice: vatOn ? vat : null, note: note.trim() || null, idempotencyKey: idempotencyKey.current },
      });
      replaceLocalCart([]); // backend tự xóa giỏ server sau khi đặt
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["addresses"] });
      qc.setQueryData(["order", order.code], order);
      router.replace(`/account/orders/${order.code}?placed=1`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  /** Ô nhập có nhãn + thông báo lỗi ngay bên dưới (đỏ, kèm aria-invalid cho trình đọc màn hình). */
  const field = (errKey: string, label: string, control: (p: { "aria-invalid": boolean; onBlur: () => void; className: string }) => React.ReactNode) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-neutral-700">{label} <span className="text-destructive">*</span></span>
      {control({ "aria-invalid": !!errors[errKey], onBlur: () => blurCheck(errKey), className: cn("h-11", errors[errKey] && "border-destructive focus-visible:ring-destructive/30") })}
      {errors[errKey] && <span role="alert" className="block text-xs text-destructive">{errors[errKey]}</span>}
    </label>
  );
  const input = (key: keyof AddressForm, label: string, props: React.ComponentProps<"input"> = {}) =>
    field(key, label, (p) => (
      <Input value={form[key]} onChange={(e) => { setForm({ ...form, [key]: e.target.value }); if (errors[key]) recheck(key, e.target.value); }} {...p} {...props} />
    ));
  const vatInput = (key: keyof Vat, label: string, props: React.ComponentProps<"input"> = {}) =>
    field(`vat.${key}`, label, (p) => (
      <Input value={vat[key]} onChange={(e) => { setVat({ ...vat, [key]: e.target.value }); if (errors[`vat.${key}`]) recheck(`vat.${key}`, e.target.value); }} {...p} className={cn(p.className, "bg-white")} {...props} />
    ));
  const view = quote.data;

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  /** Thẻ lựa chọn (địa chỉ / phương thức): viền + nền nổi bật khi đang chọn. */
  const optionCard = "flex cursor-pointer gap-3 rounded-xl border border-neutral-200 p-3.5 text-sm transition hover:border-brand/50 has-checked:border-brand has-checked:bg-brand-soft has-checked:shadow-xs";
  const section = (step: number, title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs md:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-bold text-neutral-900 md:text-lg">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{step}</span>
        {title}
        <span className="ml-auto text-neutral-300">{icon}</span>
      </h2>
      {children}
    </section>
  );

  return (
    <div className="px-3 py-4 md:px-0 md:py-8">
      {/* Breadcrumb + các bước */}
      <nav aria-label="Các bước đặt hàng" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 md:text-sm">
        <Link href="/cart" className="hover:text-brand">Giỏ hàng</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-semibold text-neutral-900">Thanh toán</span>
        <ChevronRight className="size-3.5" />
        <span>Hoàn tất</span>
      </nav>
      <h1 className="mb-4 text-xl font-bold text-neutral-900 md:mb-6 md:text-2xl">Thanh toán</h1>

      <form onSubmit={placeOrder} noValidate className="grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          {section(1, "Địa chỉ nhận hàng", <MapPin className="size-5" />, (
            <div className="space-y-3">
              {book.map((a) => (
                <label key={a.id} className={optionCard}>
                  <input type="radio" name="address" checked={selected === a.id} onChange={() => setPicked(a.id)} className="mt-1 accent-brand" />
                  <span className="min-w-0">
                    <b className="text-neutral-900">{a.recipientName} · {a.recipientPhone}</b>
                    {a.isDefault && <span className="ml-2 rounded bg-brand/10 px-1.5 py-0.5 text-[11px] font-semibold text-brand">Mặc định</span>}
                    <br />
                    <span className="text-neutral-600">{a.fullText}</span>
                  </span>
                </label>
              ))}
              {book.length > 0 && (
                <label className={cn(optionCard, "items-center")}>
                  <input type="radio" name="address" checked={selected === NEW} onChange={() => setPicked(NEW)} className="accent-brand" />
                  <span className="font-medium text-neutral-800">Giao tới địa chỉ khác</span>
                </label>
              )}
              {selected === NEW && (
                <div className="space-y-3 pt-1">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {input("recipientName", "Người nhận", { maxLength: 100, autoComplete: "name" })}
                    {input("recipientPhone", "Số điện thoại", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
                    {input("province", "Tỉnh / Thành phố", { maxLength: 100 })}
                    {input("district", "Quận / Huyện", { maxLength: 100 })}
                    {input("ward", "Phường / Xã", { maxLength: 100 })}
                    {input("street", "Số nhà, đường", { maxLength: 255, autoComplete: "street-address" })}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-neutral-700">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-brand" /> Lưu vào sổ địa chỉ
                  </label>
                </div>
              )}
            </div>
          ))}

          {section(2, "Phương thức thanh toán", <Banknote className="size-5" />, (
            <div className="grid gap-3 sm:grid-cols-2">
              {(["COD", "BANK_QR"] as const).map((m) => (
                <label key={m} className={cn(optionCard, "items-start")}>
                  <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-brand" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                      {m === "COD" ? <Truck className="size-4 text-brand" /> : <QrCode className="size-4 text-brand" />}
                      {PAYMENT_METHOD[m]}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {m === "COD" ? "Trả tiền mặt cho nhân viên giao hàng khi nhận hàng." : "Quét mã QR sau khi đặt; đơn tự hủy nếu chưa chuyển khoản trong 24 giờ."}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ))}

          {section(3, "Hóa đơn & ghi chú", <ShoppingBag className="size-5" />, (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                <input type="checkbox" checked={vatOn} onChange={(e) => setVatOn(e.target.checked)} className="accent-brand" /> Xuất hóa đơn VAT
              </label>
              {vatOn && (
                <div className="grid gap-3 rounded-xl bg-neutral-50 p-3 sm:grid-cols-2">
                  {vatInput("companyName", "Tên công ty", { maxLength: 255 })}
                  {vatInput("taxCode", "Mã số thuế", { inputMode: "numeric", placeholder: "0123456789" })}
                  {vatInput("address", "Địa chỉ công ty", { maxLength: 500 })}
                  {vatInput("email", "Email nhận hóa đơn", { type: "email", maxLength: 255 })}
                </div>
              )}
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-700">Ghi chú cho đơn hàng</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
                          className="w-full rounded-lg border border-input p-2.5 text-sm outline-none focus-visible:border-ring" placeholder="Ví dụ: giao giờ hành chính" />
              </label>
            </div>
          ))}
        </div>

        {/* Tóm tắt đơn hàng */}
        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 text-sm shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900">Đơn hàng ({itemCount} sản phẩm)</h2>
              <Link href="/cart" className="text-xs font-semibold text-brand hover:underline">Sửa giỏ hàng</Link>
            </div>

            <ul className="max-h-72 space-y-3 overflow-auto pr-1">
              {(view?.lines ?? []).map((l) => (
                <li key={l.productId} className="flex items-center gap-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                    {l.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ trong tóm tắt đơn
                      <img src={l.imageUrl} alt="" className="size-full object-cover" />
                    )}
                    <span className="absolute -top-0 -right-0 rounded-bl-lg bg-brand px-1.5 text-[11px] font-bold text-white">{l.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium text-neutral-800">{l.name}</span>
                    <span className="text-xs text-neutral-500">{formatVnd(l.unitPrice)} × {l.quantity}</span>
                  </span>
                  <span className="font-semibold text-neutral-800">{formatVnd(l.lineTotal)}</span>
                </li>
              ))}
            </ul>

            {view && (
              <div className="space-y-2.5 border-t border-dashed border-neutral-200 pt-4">
                <div className="flex justify-between text-neutral-600"><span>Tạm tính</span><span className="font-semibold text-neutral-800">{formatVnd(view.subtotal)}</span></div>
                <div className="flex justify-between text-neutral-600">
                  <span>Phí giao hàng</span>
                  {view.shippingFee === 0 ? <span className="font-semibold text-emerald-600">Miễn phí</span> : <span className="font-semibold text-neutral-800">{formatVnd(view.shippingFee)}</span>}
                </div>
                {view.freeShippingThreshold > 0 && view.subtotal < view.freeShippingThreshold && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Mua thêm <b>{formatVnd(view.freeShippingThreshold - view.subtotal)}</b> để được miễn phí giao hàng.
                  </p>
                )}
                <div className="flex items-baseline justify-between border-t border-neutral-100 pt-3">
                  <span className="text-base font-bold text-neutral-900">Tổng cộng</span>
                  <span className="text-2xl font-black text-brand-red">{formatVnd(view.total)}</span>
                </div>
              </div>
            )}

            {view && !view.checkoutReady && (
              <p className="rounded-lg bg-red-50 p-3 text-xs text-destructive">Giỏ có sản phẩm hết hàng / ngừng bán. <Link href="/cart" className="font-semibold underline">Sửa giỏ</Link></p>
            )}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={busy || !view?.checkoutReady} className="h-12 w-full rounded-xl bg-brand-cta text-base font-bold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:bg-brand-dark">
              {busy ? "Đang đặt hàng..." : <>Đặt hàng · {view ? formatVnd(view.total) : ""}</>}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-neutral-500">
              <Lock className="size-3.5" /> Thông tin được bảo mật. Bấm &ldquo;Đặt hàng&rdquo; nghĩa là bạn đồng ý điều khoản mua hàng.
            </p>
          </div>

          <ul className="space-y-2 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4 text-xs text-neutral-600">
            <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> 100% thực phẩm có chứng nhận VSATTP</li>
            <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> Đổi trả trong 7 ngày nếu sản phẩm lỗi</li>
          </ul>
        </aside>
      </form>
    </div>
  );
}
