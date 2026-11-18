"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Mail, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { useQueryParam } from "@/hooks/use-query-param";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { MeResponse, OtpSentResponse } from "@/lib/account";
import { isPasswordValid } from "@/lib/password-policy";
import { cn } from "@/lib/utils";

type Channel = "email" | "phone";
const RESEND_SECONDS = 60;

/** Chỉ cho chuyển hướng nội bộ (chặn open redirect qua ?next=https://...). */
type LoginResponseDto = {
  otpRequired: boolean;
  challengeId?: string | null;
  sentTo?: string | null;
  expiresInSeconds?: number;
  user?: MeResponse | null;
};

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

/**
 * Form đăng nhập / đăng ký (2 trang riêng) cho khách / CTV: email HOẶC SĐT -> OTP 6 số.
 * - login: tài khoản phải có sẵn; register: tài khoản phải chưa có, nhập thêm họ tên.
 * Email gửi thật; SMS hiện là giả lập (chỉ dev).
 */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const next = safeNext(useQueryParam("next"));
  const queryClient = useQueryClient();
  const me = useMe();
  /**
   * Đi tiếp SAU KHI vừa đăng nhập / đăng ký xong: tải lại trang thay vì router.replace. Router của Next nhớ kết quả
   * "chuyển hướng về /login hay /register" của các trang cần đăng nhập (/admin, /affiliate) từ lúc còn là khách
   * (VD vừa bấm banner "Đăng ký CTV"), nên chuyển trang kiểu SPA sẽ đứng yên và nút kẹt ở "Đang xác thực...".
   */
  const goNext = (to: string) => window.location.replace(to);

  // Đăng nhập
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Đăng ký
  const [channel, setChannel] = useState<Channel>("email");
  const [contact, setContact] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Chung
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [sent, setSent] = useState<(OtpSentResponse & { challengeId?: string }) | null>(null);
  const [otp, setOtp] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  // Tài khoản quản trị dùng chung trang này nhưng đi qua API đăng nhập admin (mật khẩu + OTP riêng)
  const [adminLogin, setAdminLogin] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đã đăng nhập (hoặc làm mới phiên thành công) -> đi tiếp (Admin tự chuyển sang trang quản trị)
  useEffect(() => {
    if (me.data) {
      if (me.data.roles?.includes("ADMIN") && (!next || next === "/account")) {
        router.replace("/admin/orders");
      } else {
        router.replace(next);
      }
    }
  }, [me.data, next, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const body = () => (channel === "email" ? { email: contact.trim() } : { phone: contact.trim() });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<LoginResponseDto>("/api/auth/login", {
        method: "POST",
        body: { identifier: identifier.trim(), password: loginPassword },
      });
      if (res.otpRequired && res.challengeId) {
        setSent({
          channel: "SMS",
          sentTo: res.sentTo || identifier,
          expiresInSeconds: res.expiresInSeconds || 300,
          challengeId: res.challengeId,
        });
        setOtp("");
        setCooldown(RESEND_SECONDS);
      } else if (res.user) {
        queryClient.setQueryData(["me"], res.user);
        if (res.user.roles?.includes("ADMIN") && (!next || next === "/account")) {
          goNext("/admin/orders");
        } else {
          goNext(next);
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "ADMIN_USE_ADMIN_LOGIN") {
        await loginAsAdmin();
        return;
      }
      setError(errorMessage(err));
      setErrorCode(err instanceof ApiError ? err.code : undefined);
    } finally {
      setBusy(false);
    }
  }

  /** Tài khoản quản trị: cùng form, nhưng gọi API admin (backend vẫn bắt mật khẩu + OTP như trước). */
  async function loginAsAdmin() {
    try {
      const res = await api<LoginResponseDto>("/api/admin/auth/login", {
        method: "POST",
        body: { email: identifier.trim(), password: loginPassword },
      });
      setAdminLogin(true);
      if (res.otpRequired && res.challengeId) {
        setSent({ channel: "EMAIL", sentTo: res.sentTo || identifier, expiresInSeconds: res.expiresInSeconds || 300, challengeId: res.challengeId });
        setOtp("");
        setCooldown(RESEND_SECONDS);
      } else if (res.user) {
        queryClient.setQueryData(["me"], res.user);
        goNext(next === "/account" ? "/admin/orders" : next);
      }
    } catch (err) {
      setError(errorMessage(err));
      setErrorCode(err instanceof ApiError ? err.code : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (isRegister) {
      if (!fullName.trim()) {
        setError("Vui lòng nhập họ và tên.");
        return;
      }
      if (!dateOfBirth) {
        setError("Vui lòng chọn ngày sinh.");
        return;
      }
      if (dateOfBirth >= new Date().toISOString().split("T")[0]) {
        setError("Ngày sinh phải ở quá khứ.");
        return;
      }
      if (!address.trim()) {
        setError("Vui lòng nhập địa chỉ.");
        return;
      }
      if (citizenId.trim().length !== 12) {
        setError("Số CCCD / CMND phải gồm đúng 12 chữ số.");
        return;
      }
      if (!isPasswordValid(password, contact)) {
        setError("Mật khẩu chưa đạt yêu cầu, xem danh sách bên dưới ô mật khẩu.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setBusy(true);
    try {
      setSent(await api<OtpSentResponse>("/api/auth/otp", { method: "POST", body: { ...body(), purpose: isRegister ? "REGISTER" : "LOGIN" } }));
      setOtp("");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(errorMessage(err));
      setErrorCode(err instanceof ApiError ? err.code : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isRegister) {
        const user = await api("/api/auth/register", {
          method: "POST",
          body: {
            ...body(),
            otp,
            fullName: fullName.trim(),
            dateOfBirth,
            address: address.trim(),
            citizenId: citizenId.trim(),
            password,
          },
        });
        queryClient.setQueryData(["me"], user);
      } else if (adminLogin) {
        const user = await api("/api/admin/auth/login/verify", {
          method: "POST",
          body: { challengeId: sent?.challengeId || "", otp },
        });
        queryClient.setQueryData(["me"], user);
        goNext(next === "/account" ? "/admin/orders" : next);
        return;
      } else {
        const user = await api("/api/auth/login/verify", {
          method: "POST",
          body: { challengeId: sent?.challengeId || "", otp, rememberDevice },
        });
        queryClient.setQueryData(["me"], user);
      }
      goNext(next);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const tab = (c: Channel, label: string, Icon: typeof Mail) => (
    <button
      type="button"
      onClick={() => { setChannel(c); setContact(""); setError(null); setErrorCode(undefined); }}
      className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium",
        channel === c ? "bg-white text-brand shadow-sm" : "text-neutral-600")}
    >
      <Icon className="size-4" /> {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-md px-3 py-6 md:py-12">
      <div className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
        <h1 className="text-xl font-bold text-brand">{isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRegister
            ? next === "/affiliate/register"
              ? ""
              : "Điền đầy đủ thông tin và xác thực bằng mã OTP."
            : "Nhập tên đăng nhập và mật khẩu để tiếp tục."}
        </p>

        {!isRegister ? (
          /* FORM ĐĂNG NHẬP: CHỈ CẦN TÊN ĐĂNG NHẬP VÀ MẬT KHẨU */
          !sent ? (
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Tên đăng nhập</span>
                <Input
                  autoFocus
                  required
                  autoComplete="username"
                  placeholder="Email hoặc số điện thoại"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Mật khẩu</span>
                <div className="relative">
                  <Input
                    required
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}{" "}
                  {errorCode === "ACCOUNT_NOT_FOUND" && (
                    <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-link">
                      Đăng ký ngay
                    </Link>
                  )}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy || !identifier.trim() || !loginPassword}
                className="h-11 w-full text-base"
              >
                {busy ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          ) : (
            /* Bước 2 nếu tài khoản yêu cầu OTP dự phòng */
            <form onSubmit={verify} className="mt-5 space-y-4">
              <button type="button" onClick={() => { setSent(null); setError(null); setAdminLogin(false); }} className="flex items-center gap-1 text-sm text-brand-link">
                <ArrowLeft className="size-4" /> Đăng nhập lại
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
              <label className={cn("flex items-center gap-2 text-sm", adminLogin && "hidden")}>
                <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} />
                Ghi nhớ đăng nhập 30 ngày (không hỏi OTP lại trên thiết bị này)
              </label>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy || otp.length !== 6} className="h-11 w-full text-base">
                {busy ? "Đang xác thực..." : "Xác thực & Đăng nhập"}
              </Button>
            </form>
          )
        ) : !sent ? (
          /* FORM ĐĂNG KÝ BƯỚC 1 */
          <form onSubmit={sendOtp} className="mt-5 space-y-4">
            <div className="flex rounded-xl bg-neutral-100 p-1">
              {tab("email", "Email", Mail)}
              {tab("phone", "Số điện thoại", Smartphone)}
            </div>

            {channel === "phone" && (
              <p className="text-xs text-amber-700">Gửi OTP qua SMS đang chạy thử – nếu không nhận được mã, hãy dùng email.</p>
            )}

            {/* Khối Thông tin tài khoản gom chung toàn bộ */}
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Thông tin tài khoản</p>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Họ và tên</span>
                <Input
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 bg-white"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{channel === "email" ? "Email" : "Số điện thoại"}</span>
                <Input
                  required
                  type={channel === "email" ? "email" : "tel"}
                  inputMode={channel === "email" ? "email" : "tel"}
                  autoComplete={channel === "email" ? "email" : "tel"}
                  placeholder={channel === "email" ? "ban@example.com" : "0912 345 678"}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="h-11 bg-white"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Ngày sinh</span>
                <Input
                  required
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-11 bg-white"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Địa chỉ</span>
                <Input
                  required
                  maxLength={255}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 bg-white"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Số CCCD / CMND</span>
                <Input
                  required
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12 chữ số"
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  className="h-11 bg-white"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Mật khẩu</span>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={64}
                    placeholder="Tạo mật khẩu mạnh"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10 bg-white"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <PasswordChecklist password={password} identifier={contact} />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Xác nhận mật khẩu</span>
                <div className="relative">
                  <Input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={64}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 pr-10 bg-white"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Mật khẩu xác nhận không khớp.</p>
                )}
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}{" "}
                {errorCode === "ACCOUNT_NOT_FOUND" && <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-link">Đăng ký ngay</Link>}
                {errorCode === "ACCOUNT_EXISTS" && <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-link">Đăng nhập</Link>}
              </p>
            )}
            <Button
              type="submit"
              disabled={
                busy ||
                !contact.trim() ||
                !fullName.trim() ||
                !dateOfBirth ||
                !address.trim() ||
                citizenId.trim().length !== 12 ||
                !isPasswordValid(password, contact) ||
                password !== confirmPassword
              }
              className="h-11 w-full text-base"
            >
              {busy ? "Đang gửi..." : "Nhận mã OTP"}
            </Button>
          </form>
        ) : (
          /* FORM ĐĂNG KÝ BƯỚC 2: NHẬP OTP */
          <form onSubmit={verify} className="mt-5 space-y-4">
            <button type="button" onClick={() => { setSent(null); setError(null); }} className="flex items-center gap-1 text-sm text-brand-link">
              <ArrowLeft className="size-4" /> Đổi {channel === "email" ? "email" : "số điện thoại"} / Sửa thông tin
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
            <Button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="h-11 w-full text-base"
            >
              {busy ? "Đang xác thực..." : "Tạo tài khoản"}
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
        <p className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
          {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <Link href={`${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-link">
            {isRegister ? "Đăng nhập" : "Đăng ký"}
          </Link>
        </p>
      </div>
    </div>
  );
}
