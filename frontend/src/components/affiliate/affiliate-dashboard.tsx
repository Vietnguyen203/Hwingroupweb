"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
import { StatusBadge } from "@/components/ui/status-badge";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/account";
import {
  COMMISSION_STATUS, PAYOUT_STATUS,
  type AffiliateDashboard, type AffiliateResponse, type BoundCustomer, type CommissionResponse, type PayoutResponse,
} from "@/lib/affiliate";
import { formatVnd } from "@/lib/format";
import type { PageResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "commissions" | "customers" | "payouts" | "bank";
const TABS: { key: Tab; label: string }[] = [
  { key: "commissions", label: "Hoa hồng" },
  { key: "customers", label: "Khách của tôi" },
  { key: "payouts", label: "Rút tiền" },
  { key: "bank", label: "Ngân hàng" },
];

/** Dashboard CTV đang hoạt động: link chia sẻ, số liệu, hoa hồng, khách, rút tiền, tài khoản ngân hàng. */
export function AffiliateDashboardView({ profile }: { profile: AffiliateResponse }) {
  const dash = useQuery({ queryKey: ["affiliate-dashboard"], queryFn: () => api<AffiliateDashboard>("/api/affiliates/me/dashboard") });
  const [tab, setTab] = useState<Tab>("commissions");
  const d = dash.data;

  return (
    <div className="space-y-3 p-3 md:py-6">
      <section className="rounded-2xl bg-brand p-4 text-white shadow-sm">
        <p className="text-sm text-white/80">Xin chào {profile.fullName} · Mã giới thiệu</p>
        <p className="text-2xl font-bold tracking-wider">{profile.referralCode}</p>
        {d && <ShareLink link={d.shareLink} />}
      </section>

      {d ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Số dư khả dụng" value={formatVnd(d.availableBalance)} strong />
          <Stat label="Đã nhận" value={formatVnd(d.paidOut)} />
          <Stat label="Khách đã gắn" value={String(d.boundCustomers)} />
          <Stat label="Lượt click (30 ngày)" value={`${d.clicks30Days} / ${d.clicksTotal}`} />
          {(["PENDING", "APPROVED", "CANCELLED"] as const).map((s) => (
            <Stat key={s} label={`Hoa hồng ${COMMISSION_STATUS[s].label.toLowerCase()}`}
                  value={`${formatVnd(d.commissions[s]?.amount ?? 0)} (${d.commissions[s]?.count ?? 0})`} />
          ))}
        </div>
      ) : (
        <div className="h-28 animate-pulse rounded-2xl bg-neutral-200" />
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn("shrink-0 rounded-full px-4 py-2 text-sm", tab === t.key ? "bg-brand text-white" : "bg-white")}>
            {t.label}
          </button>
        ))}
      </div>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        {tab === "commissions" && <Commissions />}
        {tab === "customers" && <Customers />}
        {tab === "payouts" && d && <Payouts dash={d} />}
        {tab === "bank" && <Bank profile={profile} />}
      </section>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-bold", strong ? "text-lg text-brand-red" : "text-brand")}>{value}</p>
    </div>
  );
}

function ShareLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/15 p-2">
      <span className="min-w-0 flex-1 truncate text-sm">{link}</span>
      <button
        onClick={() => navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-brand"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Đã chép" : "Chép link"}
      </button>
    </div>
  );
}

function usePaged<T>(key: string, path: string) {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: [key, page],
    queryFn: () => api<PageResponse<T>>(`${path}?page=${page}&page_size=20`),
    placeholderData: keepPreviousData,
  });
  return { q, page, setPage };
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function Commissions() {
  const { q, page, setPage } = usePaged<CommissionResponse>("affiliate-commissions", "/api/affiliates/me/commissions");
  if (q.isPending) return <div className="h-24 animate-pulse rounded-lg bg-neutral-100" />;
  if (q.error) return <p className="text-sm text-destructive">{errorMessage(q.error)}</p>;
  if (!q.data.content.length) return <Empty text="Chưa có hoa hồng. Hãy chia sẻ link của bạn!" />;
  return (
    <>
      <ul className="divide-y text-sm">
        {q.data.content.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
            <div>
              <p className="font-semibold">Đơn {c.orderCode}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(c.createdAt)} · {Math.round(Number(c.rate) * 100)}% × {formatVnd(c.baseAmount)}
                {c.status === "PENDING" && c.eligibleAt && ` · duyệt từ ${formatDateTime(c.eligibleAt)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-red">{formatVnd(c.amount)}</p>
              <StatusBadge map={COMMISSION_STATUS} value={c.status} />
            </div>
          </li>
        ))}
      </ul>
      <Pager page={page} totalPages={q.data.totalPages} onChange={setPage} />
    </>
  );
}

function Customers() {
  const { q, page, setPage } = usePaged<BoundCustomer>("affiliate-customers", "/api/affiliates/me/customers");
  if (q.isPending) return <div className="h-24 animate-pulse rounded-lg bg-neutral-100" />;
  if (q.error) return <p className="text-sm text-destructive">{errorMessage(q.error)}</p>;
  if (!q.data.content.length) return <Empty text="Chưa có khách nào mua qua link của bạn." />;
  return (
    <>
      <ul className="divide-y text-sm">
        {q.data.content.map((c, i) => (
          <li key={i} className="flex justify-between py-2.5"><span>{c.phoneMasked}</span><span className="text-muted-foreground">{formatDateTime(c.boundAt)}</span></li>
        ))}
      </ul>
      <Pager page={page} totalPages={q.data.totalPages} onChange={setPage} />
    </>
  );
}

function Payouts({ dash }: { dash: AffiliateDashboard }) {
  const qc = useQueryClient();
  const { q, page, setPage } = usePaged<PayoutResponse>("affiliate-payouts", "/api/affiliates/me/payouts");
  const [amount, setAmount] = useState("");
  const request = useMutation({
    mutationFn: () => api<PayoutResponse>("/api/affiliates/me/payouts", { method: "POST", body: { amount: Number(amount) } }),
    onSuccess: () => {
      setAmount("");
      qc.invalidateQueries({ queryKey: ["affiliate-payouts"] });
      qc.invalidateQueries({ queryKey: ["affiliate-dashboard"] });
    },
  });
  const locked = dash.withdrawLockedUntil && new Date(dash.withdrawLockedUntil) > new Date();

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); request.mutate(); }} className="space-y-2 rounded-xl border p-3">
        <p className="text-sm">Số dư khả dụng: <b className="text-brand-red">{formatVnd(dash.availableBalance)}</b> · tối thiểu {formatVnd(dash.minPayout)}</p>
        {!dash.hasBankAccount && <p className="text-sm text-amber-700">Cập nhật tài khoản ngân hàng (tab Ngân hàng) trước khi rút.</p>}
        {locked && <p className="text-sm text-amber-700">Vừa đổi tài khoản ngân hàng – được rút sau {formatDateTime(dash.withdrawLockedUntil!)}.</p>}
        <div className="flex gap-2">
          <Input type="number" min={dash.minPayout} step={1000} required placeholder="Số tiền muốn rút" value={amount}
                 onChange={(e) => setAmount(e.target.value)} className="h-10" />
          <Button type="submit" disabled={request.isPending || !amount} className="h-10">Yêu cầu rút</Button>
        </div>
        {request.error && <p className="text-sm text-destructive">{errorMessage(request.error)}</p>}
        {request.isSuccess && <p className="text-sm text-green-700">Đã gửi yêu cầu rút tiền, chờ admin duyệt.</p>}
      </form>
      {q.data?.content.length ? (
        <ul className="divide-y text-sm">
          {q.data.content.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2.5">
              <div>
                <p className="font-semibold">{formatVnd(p.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(p.requestedAt)}{p.transactionRef && ` · Mã GD ${p.transactionRef}`}{p.rejectReason && ` · ${p.rejectReason}`}
                </p>
              </div>
              <StatusBadge map={PAYOUT_STATUS} value={p.status} />
            </li>
          ))}
        </ul>
      ) : q.isPending ? null : <Empty text="Chưa có yêu cầu rút tiền." />}
      {q.data && <Pager page={page} totalPages={q.data.totalPages} onChange={setPage} />}
    </div>
  );
}

function Bank({ profile }: { profile: AffiliateResponse }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ bankName: "", accountNo: "", accountHolder: "", otp: "" });
  const [sentTo, setSentTo] = useState(false);
  const sendOtp = useMutation({
    mutationFn: () => api<{ expiresInSeconds: number }>("/api/affiliates/me/bank-account/otp", { method: "POST" }),
    onSuccess: () => setSentTo(true),
  });
  const save = useMutation({
    mutationFn: () => api<AffiliateResponse>("/api/affiliates/me/bank-account", { method: "PUT", body: form }),
    onSuccess: (a) => {
      qc.setQueryData(["affiliate-me"], a);
      qc.invalidateQueries({ queryKey: ["affiliate-dashboard"] });
      setForm({ bankName: "", accountNo: "", accountHolder: "", otp: "" });
      setSentTo(false);
    },
  });
  const field = (k: keyof typeof form, label: string, props: React.ComponentProps<"input"> = {}) => (
    <label className="block space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <Input required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-10" {...props} />
    </label>
  );
  return (
    <div className="space-y-3 text-sm">
      <p>
        Tài khoản hiện tại:{" "}
        {profile.bankName ? <b>{profile.bankName} · {profile.bankAccountNoMasked}</b> : <span className="text-muted-foreground">chưa có</span>}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-2 rounded-xl border p-3">
        <p className="font-medium">{profile.bankName ? "Đổi tài khoản ngân hàng" : "Thêm tài khoản ngân hàng"}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {field("bankName", "Ngân hàng", { maxLength: 100, placeholder: "Vietcombank" })}
          {field("accountNo", "Số tài khoản", { inputMode: "numeric", maxLength: 30 })}
          {field("accountHolder", "Chủ tài khoản (không dấu)", { maxLength: 100, placeholder: "NGUYEN VAN A" })}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">{field("otp", "Mã OTP xác nhận", { inputMode: "numeric", maxLength: 6, autoComplete: "one-time-code" })}</div>
          <Button type="button" variant="outline" className="h-10" disabled={sendOtp.isPending} onClick={() => sendOtp.mutate()}>
            {sentTo ? "Gửi lại OTP" : "Gửi OTP"}
          </Button>
        </div>
        {sentTo && <p className="text-xs text-muted-foreground">Đã gửi OTP tới email / SĐT của bạn.</p>}
        {profile.bankName && <p className="text-xs text-amber-700">Đổi tài khoản sẽ tạm khóa rút tiền 48 giờ để bảo vệ bạn.</p>}
        {(save.error || sendOtp.error) && <p className="text-destructive">{errorMessage(save.error ?? sendOtp.error)}</p>}
        {save.isSuccess && <p className="text-green-700">Đã cập nhật tài khoản ngân hàng.</p>}
        <Button type="submit" disabled={save.isPending} className="h-10">Lưu tài khoản</Button>
      </form>
    </div>
  );
}
