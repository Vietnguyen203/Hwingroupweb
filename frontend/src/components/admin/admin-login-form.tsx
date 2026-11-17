"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryParam } from "@/hooks/use-query-param";
import { api, errorMessage } from "@/lib/api";
import type { MeResponse } from "@/lib/account";

type AdminLoginResponse = { otpRequired: boolean; challengeId: string | null; sentTo: string | null; expiresInSeconds: number; user: MeResponse | null };

function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/orders";
}

/** Đăng nhập quản trị 2 bước: email / tên đăng nhập + mật khẩu -> OTP (riêng tài khoản dev admin/admin miễn OTP). */
export function AdminLoginForm() {
  const router = useRouter();
  const next = safeNext(useQueryParam("next"));
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<AdminLoginResponse | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function done(user: MeResponse) {
    qc.setQueryData(["me"], user);
    router.replace(next);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<AdminLoginResponse>("/api/admin/auth/login", { method: "POST", body: { email, password } });
      if (r.otpRequired) setChallenge(r);
      else if (r.user) return done(r.user);
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      done(await api<MeResponse>("/api/admin/auth/login/verify", { method: "POST", body: { challengeId: challenge!.challengeId, otp } }));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-3 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-brand">Đăng nhập quản trị</h1>
        {!challenge ? (
          <form onSubmit={login} className="mt-4 space-y-3">
            <Input required autoFocus autoComplete="username" placeholder="Email / tên đăng nhập" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            <Input required type="password" autoComplete="current-password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-11 w-full text-base">{busy ? "Đang kiểm tra..." : "Tiếp tục"}</Button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-4 space-y-3">
            <p className="text-sm">Nhập mã OTP đã gửi tới <b>{challenge.sentTo}</b>.</p>
            <Input required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
                   onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="h-12 text-center text-2xl tracking-[0.5em]" />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || otp.length !== 6} className="h-11 w-full text-base">Đăng nhập</Button>
            <button type="button" className="w-full text-sm text-brand-link" onClick={() => { setChallenge(null); setOtp(""); setError(null); }}>
              Nhập lại mật khẩu
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
