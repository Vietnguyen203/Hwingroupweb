"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import type { MeResponse, OtpSentResponse } from "@/lib/account";

const RESEND_SECONDS = 60;

/**
 * Thêm số điện thoại cho tài khoản chưa có (đăng ký bằng email): nhập SĐT -> nhận OTP -> xác nhận.
 * Sau khi thêm, SĐT dùng được làm tên đăng nhập và để đăng ký CTV. SMS hiện là giả lập ở môi trường dev.
 */
export function AddPhoneForm() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState<OtpSentResponse | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = useMutation({
    mutationFn: () => api<OtpSentResponse>("/api/me/phone/otp", { method: "POST", body: { phone: phone.trim() } }),
    onSuccess: (res) => {
      setSent(res);
      setOtp("");
      setCooldown(RESEND_SECONDS);
    },
  });

  const confirm = useMutation({
    mutationFn: () => api<MeResponse>("/api/me/phone", { method: "PUT", body: { phone: phone.trim(), otp } }),
    onSuccess: (me) => {
      qc.setQueryData(["me"], me);
      qc.invalidateQueries({ queryKey: ["profile"] });
      setOpen(false);
    },
  });

  function reset() {
    setOpen(false);
    setSent(null);
    setPhone("");
    setOtp("");
    sendOtp.reset();
    confirm.reset();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-brand-link">
        <Phone className="size-3.5" /> Thêm số điện thoại
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border bg-neutral-50 p-3">
      {!sent ? (
        <form onSubmit={(e) => { e.preventDefault(); sendOtp.mutate(); }} className="space-y-2">
          <p className="text-sm font-medium">Thêm số điện thoại</p>
          <Input
            autoFocus
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-10 bg-white"
          />
          <p className="text-xs text-muted-foreground">Chúng tôi gửi mã OTP 6 số để xác nhận bạn là chủ số này. SMS đang chạy thử – nếu không nhận được mã, báo hỗ trợ.</p>
          {sendOtp.error && <p role="alert" className="text-sm text-destructive">{errorMessage(sendOtp.error)}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={sendOtp.isPending || phone.replace(/\D/g, "").length < 9}>
              {sendOtp.isPending ? "Đang gửi..." : "Gửi mã OTP"}
            </Button>
            <Button type="button" variant="outline" onClick={reset}>Hủy</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); confirm.mutate(); }} className="space-y-2">
          <button type="button" onClick={() => { setSent(null); confirm.reset(); }} className="flex items-center gap-1 text-sm text-brand-link">
            <ArrowLeft className="size-4" /> Đổi số điện thoại
          </button>
          <p className="text-sm">
            Mã gồm 6 số đã gửi tới <b>{sent.sentTo}</b>, hiệu lực {Math.round(sent.expiresInSeconds / 60)} phút.
          </p>
          <Input
            autoFocus
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="h-11 bg-white text-center text-xl tracking-[0.5em]"
          />
          {confirm.error && <p role="alert" className="text-sm text-destructive">{errorMessage(confirm.error)}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={confirm.isPending || otp.length !== 6}>
              {confirm.isPending ? "Đang xác nhận..." : "Xác nhận"}
            </Button>
            <button
              type="button"
              disabled={cooldown > 0 || sendOtp.isPending}
              onClick={() => sendOtp.mutate()}
              className="text-sm text-brand-link disabled:text-muted-foreground"
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
