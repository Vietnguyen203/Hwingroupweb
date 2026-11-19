// Số liệu cho cổng CTV: đơn / hoa hồng suy ra từ danh sách hoa hồng, rút tiền;
// click theo ngày lấy từ GET /api/affiliates/me/click-stats (backend chỉ trả ngày có click).

import type { AffiliateDashboard, CommissionResponse, DailyClicks, PayoutResponse } from "@/lib/affiliate";
import { formatVnd } from "@/lib/format";
import type { PageResponse } from "@/lib/types";

const number = new Intl.NumberFormat("vi-VN");
const percent = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export const formatNumber = (n: number) => number.format(n);
export const formatPercent = (n: number) => `${percent.format(n)}%`;

/** "Nguyễn Văn An" -> "VA" (chữ cái đầu của hai từ cuối). */
export function initials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "CT";
  const letters = words.length === 1 ? Array.from(words[0]).slice(0, 2) : words.slice(-2).map((w) => Array.from(w)[0]);
  return letters.join("").toLocaleUpperCase("vi-VN");
}

/** % thay đổi so với kỳ trước; null khi kỳ trước = 0 (không có cơ sở so sánh). */
export function percentChange(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

export type MonthlyTotals = { orders: number; income: number; prevOrders: number; prevIncome: number };

/**
 * Đơn và hoa hồng (không tính đã hủy) từ đầu tháng tới giờ so với CÙNG KHOẢNG THỜI GIAN của tháng trước
 * (so cả tháng trước thì đầu tháng luôn "tụt dốc" – gây hiểu nhầm).
 * Trả null khi danh sách (đã sắp mới → cũ) bị cắt trước điểm bắt đầu kỳ trước, tức không đủ dữ liệu để so.
 */
export function monthlyTotals(list: PageResponse<CommissionResponse>): MonthlyTotals | null {
  const now = new Date();
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const prevEnd = Math.min(prevStart + (now.getTime() - thisStart), thisStart);

  const { content, totalElements } = list;
  const oldest = content.length ? new Date(content[content.length - 1].createdAt).getTime() : Infinity;
  if (content.length < totalElements && oldest >= prevStart) return null;

  const t: MonthlyTotals = { orders: 0, income: 0, prevOrders: 0, prevIncome: 0 };
  for (const c of content) {
    if (c.status === "CANCELLED") continue;
    const at = new Date(c.createdAt).getTime();
    if (at >= thisStart) {
      t.orders += 1;
      t.income += c.amount;
    } else if (at >= prevStart && at < prevEnd) {
      t.prevOrders += 1;
      t.prevIncome += c.amount;
    }
  }
  return t;
}

/** "5 phút trước", "2 giờ trước", "3 ngày trước"; quá 30 ngày thì ghi ngày. */
export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export type ActivityItem = {
  id: string;
  kind: "commission" | "payout";
  tone: "success" | "pending" | "danger";
  title: string;
  amount: number;
  /** in: tiền vào ví hoa hồng; out: tiền rút ra; none: không đổi (đã hủy / bị từ chối). */
  direction: "in" | "out" | "none";
  at: string;
};

/** Gộp hoa hồng + yêu cầu rút tiền thành dòng thời gian, mới nhất trước. */
export function buildActivity(commissions: CommissionResponse[], payouts: PayoutResponse[], limit = 8): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const c of commissions) {
    const base = { id: `c-${c.id}`, kind: "commission" as const, amount: c.amount };
    if (c.status === "PENDING") {
      items.push({ ...base, tone: "pending", direction: "in", title: `Đơn #${c.orderCode} vừa được ghi nhận`, at: c.createdAt });
    } else if (c.status === "APPROVED") {
      items.push({ ...base, tone: "success", direction: "in", title: `Hoa hồng đơn #${c.orderCode} đã được duyệt`, at: c.approvedAt ?? c.createdAt });
    } else {
      items.push({ ...base, tone: "danger", direction: "none", title: `Đơn #${c.orderCode} đã bị hủy`, at: c.cancelledAt ?? c.createdAt });
    }
  }

  for (const p of payouts) {
    const base = { id: `p-${p.id}`, kind: "payout" as const, amount: p.amount };
    if (p.status === "REQUESTED") {
      items.push({ ...base, tone: "pending", direction: "out", title: "Đã gửi yêu cầu rút tiền", at: p.requestedAt });
    } else if (p.status === "APPROVED") {
      items.push({ ...base, tone: "pending", direction: "out", title: "Yêu cầu rút tiền đã được duyệt, chờ chuyển khoản", at: p.approvedAt ?? p.requestedAt });
    } else if (p.status === "PAID") {
      items.push({ ...base, tone: "success", direction: "out", title: "Đã chuyển tiền về tài khoản ngân hàng", at: p.paidAt ?? p.requestedAt });
    } else {
      items.push({ ...base, tone: "danger", direction: "none", title: "Yêu cầu rút tiền bị từ chối", at: p.rejectedAt ?? p.requestedAt });
    }
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}

/** Lý do chưa thể rút tiền (null = rút được). */
export function withdrawBlock(d: AffiliateDashboard): { reason: string; needsBank?: boolean } | null {
  if (!d.hasBankAccount) return { reason: "Cần thêm tài khoản ngân hàng trước khi rút tiền.", needsBank: true };
  if (d.withdrawLockedUntil && new Date(d.withdrawLockedUntil) > new Date()) {
    return { reason: `Vừa đổi tài khoản ngân hàng – được rút sau ${new Date(d.withdrawLockedUntil).toLocaleString("vi-VN")}.` };
  }
  if (d.availableBalance < d.minPayout) {
    return { reason: `Cần tối thiểu ${formatVnd(d.minPayout)} để rút (còn thiếu ${formatVnd(d.minPayout - d.availableBalance)}).` };
  }
  return null;
}

export type DayPoint = { date: Date; clicks: number; orders: number; income: number };

const DAY_MS = 86_400_000;

/**
 * Click, đơn và hoa hồng (không tính đã hủy) theo từng ngày (giờ địa phương) trong `days` ngày gần nhất, cũ -> mới (ngày cuối là hôm nay).
 * `dailyClicks` chỉ gồm ngày có click (yyyy-MM-dd); ngày không có thì là 0.
 */
export function dailySeries(commissions: CommissionResponse[], days: number, dailyClicks: DailyClicks[] = []): DayPoint[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const points: DayPoint[] = Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date, clicks: 0, orders: 0, income: 0 };
  });

  for (const d of dailyClicks) {
    const [y, m, day] = d.date.split("-").map(Number);
    const i = Math.round((new Date(y, m - 1, day).getTime() - start.getTime()) / DAY_MS);
    if (i >= 0 && i < days) points[i].clicks += d.clicks;
  }

  for (const c of commissions) {
    if (c.status === "CANCELLED") continue;
    const at = new Date(c.createdAt);
    at.setHours(0, 0, 0, 0);
    const i = Math.round((at.getTime() - start.getTime()) / DAY_MS);
    if (i >= 0 && i < days) {
      points[i].orders += 1;
      points[i].income += c.amount;
    }
  }
  return points;
}

export type StatusSplit = Record<"PENDING" | "APPROVED" | "CANCELLED", { count: number; amount: number }>;

/** Số hoa hồng và tiền theo trạng thái, tính cho các hoa hồng tạo trong `days` ngày gần nhất. */
export function statusSplit(commissions: CommissionResponse[], days: number): StatusSplit {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const split: StatusSplit = { PENDING: { count: 0, amount: 0 }, APPROVED: { count: 0, amount: 0 }, CANCELLED: { count: 0, amount: 0 } };
  for (const c of commissions) {
    if (new Date(c.createdAt).getTime() < start.getTime()) continue;
    split[c.status].count += 1;
    split[c.status].amount += c.amount;
  }
  return split;
}

/** Số tiền rút gọn cho trục biểu đồ: 500k, 1,2tr. */
export function compactVnd(n: number): string {
  if (n >= 1_000_000) return `${percent.format(n / 1_000_000)}tr`;
  if (n >= 1_000) return `${percent.format(n / 1_000)}k`;
  return String(n);
}

/** Mốc trục tung "tròn" (1, 2, 5 × 10^k, không nhỏ hơn `minStep`): trả về bước và đỉnh trục. */
export function niceScale(maxValue: number, minStep: number, target = 4): { step: number; top: number } {
  const raw = Math.max(maxValue, minStep) / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const step = Math.max((f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow, minStep);
  return { step, top: step * Math.max(Math.ceil(maxValue / step), 1) };
}
