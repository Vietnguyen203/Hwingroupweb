"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { api, errorMessage } from "@/lib/api";
import { PAYMENT_METHOD, type Address, type OrderDetail } from "@/lib/account";
import { reconcileServerCart, replaceLocalCart } from "@/lib/cart-sync";
import { formatVnd } from "@/lib/format";
import { useCart } from "@/stores/cart";

type AddressForm = { recipientName: string; recipientPhone: string; province: string; district: string; ward: string; street: string };
type Vat = { companyName: string; taxCode: string; address: string; email: string };
const EMPTY_ADDRESS: AddressForm = { recipientName: "", recipientPhone: "", province: "", district: "", ward: "", street: "" };
const NEW = "new";

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
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: () => api<Address[]>("/api/me/addresses"), enabled: !!me.data });

  const [picked, setPicked] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<"COD" | "BANK_QR">("COD");
  const [vatOn, setVatOn] = useState(false);
  const [vat, setVat] = useState<Vat>({ companyName: "", taxCode: "", address: "", email: "" });
  const [note, setNote] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID()); // bấm 2 lần / mạng chập chờn không tạo 2 đơn
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me.data === null) router.replace("/login?next=/checkout");
  }, [me.data, router]);

  const book = addresses.data ?? [];
  const selected = picked ?? (book.find((a) => a.isDefault)?.id ?? (book.length ? book[0].id : NEW));

  if (!mounted || !me.data) return <div className="m-3 h-64 animate-pulse rounded-2xl bg-neutral-200" />;
  if (lines.length === 0) {
    return <p className="px-4 py-16 text-center text-muted-foreground">Giỏ hàng trống. <Link href="/" className="text-brand-link">Mua sắm ngay</Link></p>;
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const chosen = book.find((a) => a.id === selected);
      const shippingAddress = chosen
        ? { recipientName: chosen.recipientName, recipientPhone: chosen.recipientPhone, province: chosen.province, district: chosen.district, ward: chosen.ward, street: chosen.street }
        : form;
      if (!chosen && saveAddress) {
        await api("/api/me/addresses", { method: "POST", body: { ...form, makeDefault: book.length === 0 } }).catch(() => undefined);
      }
      await reconcileServerCart(lines);
      const order = await api<OrderDetail>("/api/checkout/orders", {
        method: "POST",
        body: { shippingAddress, paymentMethod: method, vatInvoice: vatOn ? vat : null, note: note.trim() || null, idempotencyKey },
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

  const input = (key: keyof AddressForm, label: string, props: React.ComponentProps<"input"> = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <Input required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-10" {...props} />
    </label>
  );
  const vatInput = (key: keyof Vat, label: string, props: React.ComponentProps<"input"> = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <Input required value={vat[key]} onChange={(e) => setVat({ ...vat, [key]: e.target.value })} className="h-10" {...props} />
    </label>
  );
  const view = quote.data;

  return (
    <form onSubmit={placeOrder} className="space-y-3 p-3 md:grid md:grid-cols-[1fr_340px] md:items-start md:gap-4 md:space-y-0 md:py-6">
      <div className="space-y-3">
        <h1 className="text-lg font-bold">Thanh toán</h1>

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-bold text-brand">Địa chỉ nhận hàng</h2>
          {book.map((a) => (
            <label key={a.id} className="flex gap-2 rounded-xl border p-3 text-sm has-checked:border-brand has-checked:bg-brand-soft">
              <input type="radio" name="address" checked={selected === a.id} onChange={() => setPicked(a.id)} className="mt-1" />
              <span><b>{a.recipientName} · {a.recipientPhone}</b><br /><span className="text-muted-foreground">{a.fullText}</span></span>
            </label>
          ))}
          {book.length > 0 && (
            <label className="flex items-center gap-2 rounded-xl border p-3 text-sm has-checked:border-brand has-checked:bg-brand-soft">
              <input type="radio" name="address" checked={selected === NEW} onChange={() => setPicked(NEW)} /> Giao tới địa chỉ khác
            </label>
          )}
          {selected === NEW && (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {input("recipientName", "Người nhận", { maxLength: 100, autoComplete: "name" })}
                {input("recipientPhone", "Số điện thoại", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
                {input("province", "Tỉnh / Thành phố", { maxLength: 100 })}
                {input("district", "Quận / Huyện", { maxLength: 100 })}
                {input("ward", "Phường / Xã", { maxLength: 100 })}
                {input("street", "Số nhà, đường", { maxLength: 255, autoComplete: "street-address" })}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Lưu vào sổ địa chỉ
              </label>
            </div>
          )}
        </section>

        <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-bold text-brand">Phương thức thanh toán</h2>
          {(["COD", "BANK_QR"] as const).map((m) => (
            <label key={m} className="flex items-center gap-2 rounded-xl border p-3 text-sm has-checked:border-brand has-checked:bg-brand-soft">
              <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
              <span>{PAYMENT_METHOD[m]}{m === "BANK_QR" && <span className="block text-xs text-muted-foreground">Quét mã QR sau khi đặt; đơn tự hủy nếu chưa chuyển khoản trong 24 giờ.</span>}</span>
            </label>
          ))}
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={vatOn} onChange={(e) => setVatOn(e.target.checked)} /> Xuất hóa đơn VAT
          </label>
          {vatOn && (
            <div className="grid gap-2 sm:grid-cols-2">
              {vatInput("companyName", "Tên công ty", { maxLength: 255 })}
              {vatInput("taxCode", "Mã số thuế", { inputMode: "numeric", placeholder: "0123456789", pattern: "\\d{10}(-\\d{3})?", title: "10 số hoặc 10 số-3 số" })}
              {vatInput("address", "Địa chỉ công ty", { maxLength: 500 })}
              {vatInput("email", "Email nhận hóa đơn", { type: "email", maxLength: 255 })}
            </div>
          )}
          <label className="block space-y-1">
            <span className="text-xs font-medium">Ghi chú cho đơn hàng</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
                      className="w-full rounded-lg border border-input p-2.5 text-sm outline-none focus-visible:border-ring" placeholder="Ví dụ: giao giờ hành chính" />
          </label>
        </section>
      </div>

      <aside className="space-y-2 rounded-2xl bg-white p-4 text-sm shadow-sm md:sticky md:top-32">
        <h2 className="font-bold text-brand">Đơn hàng ({lines.reduce((n, l) => n + l.quantity, 0)} sản phẩm)</h2>
        <ul className="max-h-60 space-y-1 overflow-auto">
          {(view?.lines ?? []).map((l) => (
            <li key={l.productId} className="flex justify-between gap-2"><span className="line-clamp-1">{l.quantity} × {l.name}</span><span>{formatVnd(l.lineTotal)}</span></li>
          ))}
        </ul>
        {view && (
          <div className="space-y-1 border-t pt-2">
            <div className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(view.subtotal)}</span></div>
            <div className="flex justify-between"><span>Phí giao hàng</span><span>{formatVnd(view.shippingFee)}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Tổng cộng</span><span className="text-brand-red">{formatVnd(view.total)}</span></div>
          </div>
        )}
        {view && !view.checkoutReady && <p className="text-destructive">Giỏ có sản phẩm hết hàng / ngừng bán. <Link href="/cart" className="text-brand-link">Sửa giỏ</Link></p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || !view?.checkoutReady} className="h-12 w-full text-base">
          {busy ? "Đang đặt hàng..." : "Đặt hàng"}
        </Button>
      </aside>
    </form>
  );
}
