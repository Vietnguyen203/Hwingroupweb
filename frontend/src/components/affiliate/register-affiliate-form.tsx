"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { IdCardPicker } from "@/components/affiliate/id-card-picker";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { useMounted } from "@/hooks/use-mounted";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { AffiliateResponse } from "@/lib/affiliate";

/** Đăng ký làm CTV (cần đăng nhập). Tài khoản đăng ký bằng email phải nhập thêm SĐT liên hệ. */
export function RegisterAffiliateForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const mounted = useMounted();
  const [form, setForm] = useState({ fullName: "", socialLink: "", note: "", phone: "", acceptTerms: false });
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mounted || !me.data) return <div className="mx-auto my-6 h-72 max-w-md animate-pulse rounded-2xl bg-neutral-200" />;
  const needsPhone = !me.data.phoneMasked;

  /** Ảnh CCCD vào kho riêng tư của backend; chỉ nhận lại khóa file để đính kèm phiếu đăng ký. */
  async function uploadIdCard(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/affiliates/id-card-uploads", { method: "POST", body: fd });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body.messageCode, body.message ?? "Tải ảnh CCCD thất bại");
    return body.key as string;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!front || !back) {
      setError("Vui lòng tải lên ảnh CCCD mặt trước và mặt sau.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const [idCardFrontKey, idCardBackKey] = [await uploadIdCard(front), await uploadIdCard(back)];
      const a = await api<AffiliateResponse>("/api/affiliates/me", {
        method: "POST",
        body: { ...form, idCardFrontKey, idCardBackKey, socialLink: form.socialLink || null, note: form.note || null, phone: needsPhone ? form.phone : null },
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
        <div className="space-y-2 rounded-xl bg-neutral-50 p-3">
          <p className="text-sm font-medium">Ảnh căn cước công dân (CCCD)</p>
          <p className="text-xs text-muted-foreground">Dùng để xác minh danh tính khi chi trả hoa hồng. Ảnh được lưu riêng tư, chỉ quản trị viên xem được. JPG/PNG/WebP, tối đa 5MB.</p>
          <div className="grid grid-cols-2 gap-3">
            <IdCardPicker label="Mặt trước" file={front} onChange={setFront} onError={setError} />
            <IdCardPicker label="Mặt sau" file={back} onChange={setBack} onError={setError} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} />
          <span>Tôi đồng ý điều khoản cộng tác viên: hoa hồng 10% đơn thành công, không tự mua qua link của mình, không quảng cáo sai sự thật.</span>
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || !form.acceptTerms || !front || !back} className="h-11 w-full text-base">
          {busy ? "Đang tải ảnh và gửi..." : "Gửi đăng ký"}
        </Button>
      </form>
    </div>
  );
}
