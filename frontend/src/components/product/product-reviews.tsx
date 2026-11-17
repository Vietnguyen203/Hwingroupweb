"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pager } from "@/components/ui/pager";
import { useMe } from "@/hooks/use-me";
import { formatDateTime } from "@/lib/account";
import { api, errorMessage } from "@/lib/api";
import type { ProductReviewResponse, ProductReviewSummaryResponse, ReviewEligibilityResponse } from "@/lib/reviews";
import type { PageResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";

/** Tab "Đánh giá": tổng hợp số sao, danh sách (phân trang), form viết đánh giá cho khách đã nhận hàng. */
export function ProductReviews({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const summary = useQuery({
    queryKey: ["review-summary", productId],
    queryFn: () => api<ProductReviewSummaryResponse>(`/api/product-reviews/summary?productId=${productId}`),
  });
  const list = useQuery({
    queryKey: ["reviews", productId, page],
    queryFn: () => api<PageResponse<ProductReviewResponse>>(`/api/product-reviews?productId=${productId}&page=${page}&page_size=5`),
    placeholderData: keepPreviousData,
  });
  const s = summary.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl bg-brand-soft p-4 text-center">
          <p className="text-4xl font-black text-brand">{s ? s.average.toFixed(1) : "–"}<span className="text-lg font-semibold">/5</span></p>
          <StarRating value={s?.average ?? 0} size="size-5" className="mt-1" />
          <p className="mt-1 text-sm text-muted-foreground">{s?.total ?? 0} đánh giá</p>
        </div>
        <ul className="space-y-1.5 text-sm">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = s?.countByRating[String(star)] ?? 0;
            const pct = s && s.total > 0 ? (n / s.total) * 100 : 0;
            return (
              <li key={star} className="flex items-center gap-3">
                <span className="flex w-10 items-center gap-0.5">{star}<Star className="size-3.5 fill-[#ffb400] text-[#ffb400]" /></span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200"><span className="block h-full rounded-full bg-[#ffb400]" style={{ width: `${pct}%` }} /></span>
                <span className="w-8 text-right text-muted-foreground">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <WriteReview productId={productId} />

      {list.isPending ? (
        <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
      ) : list.error ? (
        <p className="text-sm text-destructive">{errorMessage(list.error)}</p>
      ) : list.data.content.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
      ) : (
        <>
          <ul className="divide-y">
            {list.data.content.map((r) => (
              <li key={r.id} className="flex gap-3 py-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {r.reviewerName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{r.reviewerName} <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-medium text-green-800">Đã mua hàng</span></p>
                  <StarRating value={r.rating} />
                  {r.comment && <p className="mt-1 text-sm leading-6 whitespace-pre-line">{r.comment}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Pager page={page} totalPages={list.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function WriteReview({ productId }: { productId: string }) {
  const me = useMe();
  const qc = useQueryClient();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const eligibility = useQuery({
    queryKey: ["review-eligibility", productId],
    queryFn: () => api<ReviewEligibilityResponse>(`/api/me/product-reviews/eligibility?productId=${productId}`),
    enabled: !!me.data?.roles.includes("CUSTOMER"),
  });
  const submit = useMutation({
    mutationFn: () => api("/api/me/product-reviews", { method: "POST", body: { productId, rating, comment: comment.trim() || null } }),
    onSuccess: () => {
      setComment("");
      setRating(0);
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["review-summary", productId] });
      qc.invalidateQueries({ queryKey: ["review-eligibility", productId] });
      router.refresh(); // cập nhật điểm sao / số đánh giá render từ server ở đầu trang
    },
  });

  if (me.isPending) return null;
  if (!me.data) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-brand-link">Đăng nhập</Link> để đánh giá sản phẩm bạn đã mua.
      </p>
    );
  }
  if (eligibility.isPending || !eligibility.data) return null;
  if (eligibility.data.alreadyReviewed) {
    return <p className="rounded-xl bg-green-50 p-4 text-center text-sm text-green-800">Cảm ơn bạn! Bạn đã đánh giá sản phẩm này.</p>;
  }
  if (!eligibility.data.canReview) {
    return <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">Chỉ khách đã mua và nhận sản phẩm mới có thể đánh giá.</p>;
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (rating > 0) submit.mutate(); }} className="space-y-3 rounded-xl border p-4">
      <h3 className="font-semibold">Viết đánh giá của bạn</h3>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" aria-label={`${i} sao`} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}>
            <Star className={cn("size-8 transition", (hover || rating) >= i ? "fill-[#ffb400] text-[#ffb400]" : "text-neutral-300")} />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm text-muted-foreground">{["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][rating]}</span>}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (không bắt buộc)"
        className="w-full rounded-lg border border-input p-2.5 text-sm outline-none focus-visible:border-ring"
      />
      {submit.error && <p role="alert" className="text-sm text-destructive">{errorMessage(submit.error)}</p>}
      <Button type="submit" disabled={rating === 0 || submit.isPending}>{submit.isPending ? "Đang gửi..." : "Gửi đánh giá"}</Button>
    </form>
  );
}
