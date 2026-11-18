"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Wallet } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/account";
import { api, errorMessage } from "@/lib/api";
import { PAYOUT_STATUS, type AffiliateDashboard, type PayoutResponse } from "@/lib/affiliate";
import { withdrawBlock } from "@/lib/affiliate-stats";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  dash?: AffiliateDashboard;
  /** Yêu cầu rút gần nhất; undefined = đang tải, null = chưa có yêu cầu nào. */
  latest?: PayoutResponse | null;
};

/** Thẻ rút tiền: số dư có thể rút, nút "Yêu cầu rút tiền" (form ngay trong thẻ) và tiến trình yêu cầu gần nhất. */
export function PayoutCard({ dash, latest }: Props) {
  const qc = useQueryClient();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const request = useMutation({
    mutationFn: (value: number) => api<PayoutResponse>("/api/affiliates/me/payouts", { method: "POST", body: { amount: value } }),
    onSuccess: () => {
      setAmount("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["affiliate-payouts"] });
      qc.invalidateQueries({ queryKey: ["affiliate-dashboard"] });
    },
  });

  const block = dash ? withdrawBlock(dash) : null;

  return (
    <section className="flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">Rút tiền</h2>
      <p className="mt-0.5 text-sm text-gray-500">
        Số dư có thể rút
        {dash && <> · tối thiểu {formatVnd(dash.minPayout)}</>}
      </p>

      {dash ? (
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-brand-red tabular-nums">{formatVnd(dash.availableBalance)}</p>
      ) : (
        <Skeleton className="mt-2 h-9 w-40 bg-gray-200" />
      )}

      {open && dash ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            request.mutate(Number(amount));
          }}
          className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5"
        >
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">Số tiền muốn rút (đ)</label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              type="number"
              inputMode="numeric"
              required
              autoFocus
              min={dash.minPayout}
              max={dash.availableBalance}
              step={1000}
              placeholder={String(dash.minPayout)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 bg-white"
            />
            <button
              type="button"
              onClick={() => setAmount(String(dash.availableBalance))}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Rút tối đa
            </button>
          </div>
          {request.error && <p role="alert" className="text-sm text-red-600">{errorMessage(request.error)}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={request.isPending || !amount}
              className="h-10 flex-1 rounded-lg bg-brand-red px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90 disabled:opacity-50"
            >
              {request.isPending ? "Đang gửi…" : "Gửi yêu cầu"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); request.reset(); }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            type="button"
            disabled={!dash || !!block}
            onClick={() => { request.reset(); setOpen(true); }}
            aria-describedby={block ? `${inputId}-why` : undefined}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-red/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <Wallet className="size-4.5" aria-hidden />
            Yêu cầu rút tiền
          </button>
          {block && (
            <p id={`${inputId}-why`} className="mt-2 text-xs text-amber-700">
              {block.reason}{" "}
              {block.needsBank && <Link href="/affiliate" className="font-semibold underline underline-offset-2">Thêm tài khoản</Link>}
            </p>
          )}
          {request.isSuccess && (
            <p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-700">
              <Check className="size-3.5" aria-hidden /> Đã gửi yêu cầu rút tiền, chờ admin duyệt.
            </p>
          )}
        </>
      )}

      <div className="mt-5 border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-900">Yêu cầu gần nhất</h3>
        {latest === undefined ? (
          <Skeleton className="mt-3 h-16 bg-gray-100" />
        ) : latest === null ? (
          <p className="mt-2 text-sm text-gray-500">Bạn chưa có yêu cầu rút tiền nào.</p>
        ) : (
          <LatestPayout p={latest} />
        )}
      </div>
    </section>
  );
}

const STEPS = ["Đã gửi yêu cầu", "Đã duyệt", "Đã chuyển khoản"];

function LatestPayout({ p }: { p: PayoutResponse }) {
  const reached = p.status === "PAID" ? 3 : p.status === "APPROVED" ? 2 : 1;

  return (
    <div className="mt-2 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-bold text-gray-900 tabular-nums">{formatVnd(p.amount)}</p>
          <p className="text-xs text-gray-500">{formatDateTime(p.requestedAt)}{p.transactionRef && ` · Mã GD ${p.transactionRef}`}</p>
        </div>
        <StatusBadge map={PAYOUT_STATUS} value={p.status} />
      </div>

      {p.status === "REJECTED" ? (
        <p role="note" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          Yêu cầu bị từ chối{p.rejectReason ? `: ${p.rejectReason}` : "."} Số tiền vẫn nằm trong số dư của bạn.
        </p>
      ) : (
        <ol className="grid grid-cols-3" aria-label="Tiến trình yêu cầu rút tiền">
          {STEPS.map((label, i) => {
            const done = i < reached;
            return (
              <li key={label} aria-current={i === reached - 1 ? "step" : undefined} className="relative flex flex-col items-center text-center">
                {i > 0 && (
                  <span aria-hidden className={cn("absolute top-3 right-1/2 left-[-50%] h-0.5 -translate-y-1/2", done ? "bg-brand-red" : "bg-gray-200")} />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-6 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                    done ? "border-brand-red bg-brand-red text-white" : "border-gray-300 bg-white text-gray-400",
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                <span className={cn("mt-1.5 text-[11px] leading-tight", done ? "font-semibold text-gray-800" : "text-gray-400")}>{label}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
