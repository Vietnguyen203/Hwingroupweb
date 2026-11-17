"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, LogOut, MapPin, Package, Pencil, Plus, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { api, errorMessage } from "@/lib/api";
import {
  formatDateTime, ORDER_STATUS,
  type AddressResponse, type SaveAddressRequest, type OrderSummaryResponse, type ProfileResponse,
} from "@/lib/account";
import type { PageResponse } from "@/lib/types";
import { formatVnd } from "@/lib/format";

/** Trang tài khoản khách: hồ sơ, sổ địa chỉ, đơn hàng gần đây, đăng xuất. */
export function AccountView() {
  const router = useRouter();
  const me = useMe();

  useEffect(() => {
    if (me.data === null) router.replace("/dang-nhap?next=/tai-khoan");
  }, [me.data, router]);

  if (!me.data) return <div className="m-3 h-64 animate-pulse rounded-2xl bg-neutral-200" />;

  return (
    <div className="space-y-3 p-3 md:grid md:grid-cols-[320px_1fr] md:gap-4 md:space-y-0 md:py-6">
      <div className="space-y-3">
        <ProfileCard />
        <LogoutButton />
      </div>
      <div className="space-y-3">
        <OrdersCard />
        <AddressesCard />
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, action, children }: {
  title: string; icon: typeof UserRound; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-brand"><Icon className="size-5" />{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------ hồ sơ

function ProfileCard() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => api<ProfileResponse>("/api/me/profile") });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const save = useMutation({
    mutationFn: () => api<ProfileResponse>("/api/me/profile", { method: "PUT", body: { fullName: name } }),
    onSuccess: (p) => {
      qc.setQueryData(["profile"], p);
      qc.invalidateQueries({ queryKey: ["me"] });
      setEditing(false);
    },
  });

  const p = profile.data;
  return (
    <Card
      title="Tài khoản"
      icon={UserRound}
      action={p && !editing && (
        <button onClick={() => { setName(p.fullName ?? ""); setEditing(true); }} className="flex items-center gap-1 text-sm text-brand-link">
          <Pencil className="size-3.5" /> Sửa tên
        </button>
      )}
    >
      {!p ? (
        <div className="h-24 animate-pulse rounded-lg bg-neutral-100" />
      ) : (
        <div className="space-y-2 text-sm">
          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Họ và tên" className="h-10" autoFocus />
              {save.error && <p className="text-destructive">{errorMessage(save.error)}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={save.isPending}>Lưu</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
              </div>
            </form>
          ) : (
            <p className="text-base font-semibold">{p.fullName || "Chưa có tên"}</p>
          )}
          {p.email && <p className="text-muted-foreground">Email: {p.email}</p>}
          {p.phone && <p className="text-muted-foreground">SĐT: {p.phone}</p>}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="rounded-xl bg-brand-soft p-3"><p className="text-xs text-muted-foreground">Đơn hàng</p><p className="text-lg font-bold text-brand">{p.totalOrders}</p></div>
            <div className="rounded-xl bg-brand-soft p-3"><p className="text-xs text-muted-foreground">Đã chi tiêu</p><p className="text-lg font-bold text-brand">{formatVnd(p.totalSpent)}</p></div>
          </div>
        </div>
      )}
    </Card>
  );
}

function LogoutButton() {
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      className="h-11 w-full bg-white"
      onClick={async () => {
        setBusy(true);
        await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        qc.clear();
        qc.setQueryData(["me"], null);
        router.replace("/");
      }}
    >
      <LogOut /> Đăng xuất
    </Button>
  );
}

// ------------------------------------------------------------------ đơn hàng

export function OrdersCard({ pageSize = 10 }: { pageSize?: number }) {
  const orders = useQuery({ queryKey: ["orders", pageSize], queryFn: () => api<PageResponse<OrderSummaryResponse>>(`/api/me/orders?page_size=${pageSize}`) });
  return (
    <Card title="Đơn hàng của tôi" icon={Package}>
      {orders.isPending ? (
        <div className="h-24 animate-pulse rounded-lg bg-neutral-100" />
      ) : orders.error ? (
        <p className="text-sm text-destructive">{errorMessage(orders.error)}</p>
      ) : orders.data.content.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Chưa có đơn hàng. <Link href="/" className="font-semibold text-brand-link">Mua sắm ngay</Link>
        </p>
      ) : (
        <ul className="divide-y">
          {orders.data.content.map((o) => {
            const st = ORDER_STATUS[o.status];
            return (
              <li key={o.code}>
                <Link href={`/tai-khoan/don-hang/${o.code}`} className="flex items-center gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {o.firstItemImage ? <img src={o.firstItemImage} alt="" className="size-14 rounded-lg object-cover" /> : <div className="size-14 rounded-lg bg-neutral-100" />}
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{o.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${st.className}`}>{st.label}</span>
                    </div>
                    <p className="truncate text-muted-foreground">
                      {o.firstItemName}{o.itemCount > 1 ? ` và ${o.itemCount - 1} sản phẩm khác` : ""}
                    </p>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{formatDateTime(o.placedAt)}</span>
                      <span className="font-bold text-brand-red">{formatVnd(o.total)}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ sổ địa chỉ

const EMPTY: SaveAddressRequest = { recipientName: "", recipientPhone: "", province: "", district: "", ward: "", street: "", makeDefault: false };

function AddressesCard() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["addresses"], queryFn: () => api<AddressResponse[]>("/api/me/addresses") });
  const [form, setForm] = useState<SaveAddressRequest | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  const add = useMutation({
    mutationFn: (a: SaveAddressRequest) => api<AddressResponse>("/api/me/addresses", { method: "POST", body: a }),
    onSuccess: () => { setForm(null); refresh(); },
  });
  const setDefault = useMutation({
    mutationFn: (id: string) => api(`/api/me/addresses/${id}/default`, { method: "POST" }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/me/addresses/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });

  const field = (key: keyof Omit<SaveAddressRequest, "makeDefault">, label: string, props: React.ComponentProps<"input"> = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <Input required value={form![key]} onChange={(e) => setForm({ ...form!, [key]: e.target.value })} className="h-10" {...props} />
    </label>
  );

  return (
    <Card
      title="Sổ địa chỉ"
      icon={MapPin}
      action={!form && (
        <button onClick={() => setForm(EMPTY)} className="flex items-center gap-1 text-sm text-brand-link"><Plus className="size-4" /> Thêm</button>
      )}
    >
      {form && (
        <form onSubmit={(e) => { e.preventDefault(); add.mutate(form); }} className="mb-4 space-y-2 rounded-xl border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {field("recipientName", "Người nhận", { maxLength: 100, autoComplete: "name" })}
            {field("recipientPhone", "Số điện thoại", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
            {field("province", "Tỉnh / Thành phố", { maxLength: 100 })}
            {field("district", "Quận / Huyện", { maxLength: 100 })}
            {field("ward", "Phường / Xã", { maxLength: 100 })}
            {field("street", "Số nhà, đường", { maxLength: 255, autoComplete: "street-address" })}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.makeDefault} onChange={(e) => setForm({ ...form, makeDefault: e.target.checked })} />
            Đặt làm địa chỉ mặc định
          </label>
          {add.error && <p className="text-sm text-destructive">{errorMessage(add.error)}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={add.isPending}>Lưu địa chỉ</Button>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>Hủy</Button>
          </div>
        </form>
      )}

      {list.isPending ? (
        <div className="h-16 animate-pulse rounded-lg bg-neutral-100" />
      ) : list.data?.length === 0 && !form ? (
        <p className="py-2 text-sm text-muted-foreground">Chưa có địa chỉ. Bạn có thể lưu địa chỉ khi thanh toán.</p>
      ) : (
        <ul className="space-y-2">
          {list.data?.map((a) => (
            <li key={a.id} className="rounded-xl border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  {a.recipientName} · {a.recipientPhone}
                  {a.isDefault && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">Mặc định</span>}
                </p>
                <button aria-label="Xóa địa chỉ" onClick={() => remove.mutate(a.id)} className="text-muted-foreground"><Trash2 className="size-4" /></button>
              </div>
              <p className="text-muted-foreground">{a.fullText}</p>
              {!a.isDefault && (
                <button onClick={() => setDefault.mutate(a.id)} className="mt-1 text-xs text-brand-link">Đặt làm mặc định</button>
              )}
            </li>
          ))}
        </ul>
      )}
      {(remove.error || setDefault.error) && <p className="mt-2 text-sm text-destructive">{errorMessage(remove.error ?? setDefault.error)}</p>}
    </Card>
  );
}
