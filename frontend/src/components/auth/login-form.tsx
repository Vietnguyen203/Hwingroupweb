"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { api, errorMessage } from "@/lib/api";
import type { OtpSent } from "@/lib/account";
import { cn } from "@/lib/utils";

type Channel = "email" | "phone";
const RESEND_SECONDS = 60;

/** Chỉ cho chuyển hướng nội bộ (chặn open redirect qua ?next=https://...). */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

/**
 * Đăng nhập = đăng ký cho khách / CTV: nhập email HOẶC SĐT -> nhận OTP 6 số -> xác thực.
 * Email gửi thật; SMS hiện là giả lập (chỉ dev).
 */
export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const queryClient = useQueryClient();
  const me = useMe();

  const [channel, setChannel] = useState<Channel>("email");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đã đăng nhập (hoặc làm mới phiên thành công) -> đi tiếp
  useEffect(() => {
    if (me.data) router.replace(next);
  }, [me.data, next, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const body = () => (channel === "email" ? { email: contact.trim() } : { phone: contact.trim() });

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setSent(await api<OtpSent>("/api/auth/otp", { method: "POST", body: body() }));
      setOtp("");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await api("/api/auth/otp/verify", { method: "POST", body: { ...body(), otp } });
      queryClient.setQueryData(["me"], user);
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const tab = (c: Channel, label: string, Icon: typeof Mail) => (
    <button
      type="button"
      onClick={() => { setChannel(c); setContact(""); setError(null); }}
      className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium",
        channel === c ? "bg-white text-brand shadow-sm" : "text-neutral-600")}
    >
      <Icon className="size-4" /> {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-md px-3 py-6 md:py-12">
      <div className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-xl font-bold text-brand">Đăng nhập / Đăng ký</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chưa có tài khoản sẽ được tạo tự động.</p>

        {!sent ? (
          <form onSubmit={sendOtp} className="mt-5 space-y-4">
            <div className="flex rounded-xl bg-neutral-100 p-1">
              {tab("email", "Email", Mail)}
              {tab("phone", "Số điện thoại", Smartphone)}
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{channel === "email" ? "Email" : "Số điện thoại"}</span>
              <Input
                autoFocus
                required
                type={channel === "email" ? "email" : "tel"}
                inputMode={channel === "email" ? "email" : "tel"}
                autoComplete={channel === "email" ? "email" : "tel"}
                placeholder={channel === "email" ? "ban@example.com" : "0912 345 678"}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="h-11"
              />
            </label>
            {channel === "phone" && (
              <p className="text-xs text-amber-700">Gửi OTP qua SMS đang chạy thử – nếu không nhận được mã, hãy dùng email.</p>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || !contact.trim()} className="h-11 w-full text-base">
              {busy ? "Đang gửi..." : "Nhận mã OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 space-y-4">
            <button type="button" onClick={() => { setSent(null); setError(null); }} className="flex items-center gap-1 text-sm text-brand-link">
              <ArrowLeft className="size-4" /> Đổi {channel === "email" ? "email" : "số điện thoại"}
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
              className="h-12 text-center text-2xl tracking-[0.5em]"
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || otp.length !== 6} className="h-11 w-full text-base">
              {busy ? "Đang xác thực..." : "Đăng nhập"}
            </Button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => sendOtp()}
              className="w-full text-center text-sm text-brand-link disabled:text-muted-foreground"
            >
              {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
