"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { api, errorMessage } from "@/lib/api";
import type { AffiliateResponse } from "@/lib/affiliate";

/** Đăng ký làm CTV (cần đăng nhập). Tài khoản đăng ký bằng email phải nhập thêm SĐT liên hệ. */
export function RegisterAffiliateForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const mounted = useMounted();
  const [form, setForm] = useState({ fullName: "", socialLink: "", note: "", phone: "", acceptTerms: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mounted || !me.data) return <div className="mx-auto my-6 h-72 max-w-md animate-pulse rounded-2xl bg-neutral-200" />;
  const needsPhone = !me.data.phoneMasked;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const a = await api<AffiliateResponse>("/api/affiliates/me", {
        method: "POST",
        body: { ...form, socialLink: form.socialLink || null, note: form.note || null, phone: needsPhone ? form.phone : null },
      });
      qc.setQueryData(["affiliate-me"], a);
      router.replace("/ctv");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-3 py-6 md:py-10">
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-brand">Đăng ký cộng tác viên</h1>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Họ và tên</span>
          <Input required maxLength={100} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11" />
        </label>
        {needsPhone && (
          <label className="block space-y-1">
            <span className="text-sm font-medium">Số điện thoại liên hệ</span>
            <Input required type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" />
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-sm font-medium">Link Facebook / Zalo / TikTok (không bắt buộc)</span>
          <Input type="url" maxLength={500} placeholder="https://..." value={form.socialLink} onChange={(e) => setForm({ ...form, socialLink: e.target.value })} className="h-11" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Bạn định giới thiệu sản phẩm thế nào? (không bắt buộc)</span>
          <textarea maxLength={1000} rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full rounded-lg border border-input p-2.5 text-sm outline-none focus-visible:border-ring" />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} />
          <span>Tôi đồng ý điều khoản cộng tác viên: hoa hồng 10% đơn thành công, không tự mua qua link của mình, không quảng cáo sai sự thật.</span>
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || !form.acceptTerms} className="h-11 w-full text-base">
          {busy ? "Đang gửi..." : "Gửi đăng ký"}
        </Button>
      </form>
    </div>
  );
}
