// Kiểu dữ liệu CTV (khớp DTO backend module affiliate)

export type AffiliateStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type CommissionStatus = "PENDING" | "APPROVED" | "CANCELLED";
export type PayoutStatus = "REQUESTED" | "APPROVED" | "PAID" | "REJECTED";

export type AffiliateResponse = {
  id: string;
  fullName: string;
  phoneMasked: string;
  status: AffiliateStatus;
  referralCode: string | null;
  socialLink: string | null;
  note: string | null;
  statusReason: string | null;
  bankName: string | null;
  bankAccountNoMasked: string | null;
  withdrawLockedUntil: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type CommissionStatusSummary = { count: number; amount: number };

export type AffiliateDashboard = {
  referralCode: string;
  shareLink: string;
  status: AffiliateStatus;
  clicksTotal: number;
  clicks30Days: number;
  boundCustomers: number;
  commissions: Partial<Record<CommissionStatus, CommissionStatusSummary>>;
  availableBalance: number;
  paidOut: number;
  minPayout: number;
  withdrawLockedUntil: string | null;
  hasBankAccount: boolean;
};

export type CommissionResponse = {
  id: string;
  orderCode: string;
  baseAmount: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  createdAt: string;
  eligibleAt: string | null;
  approvedAt: string | null;
  cancelledAt: string | null;
};

export type PayoutResponse = {
  id: string;
  amount: number;
  status: PayoutStatus;
  bankName: string;
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  rejectedAt: string | null;
  transactionRef: string | null;
  rejectReason: string | null;
};

export type BoundCustomer = { phoneMasked: string; boundAt: string };

export const AFFILIATE_STATUS: Record<AffiliateStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Đang hoạt động", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Bị từ chối", className: "bg-red-100 text-red-800" },
  SUSPENDED: { label: "Tạm khóa", className: "bg-neutral-200 text-neutral-700" },
};

export const COMMISSION_STATUS: Record<CommissionStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Đã duyệt", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", className: "bg-neutral-200 text-neutral-700" },
};

export const PAYOUT_STATUS: Record<PayoutStatus, { label: string; className: string }> = {
  REQUESTED: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Đã duyệt – chờ chuyển", className: "bg-blue-100 text-blue-800" },
  PAID: { label: "Đã chuyển", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Từ chối", className: "bg-red-100 text-red-800" },
};

/** Nền tảng chia sẻ của một lượt click (khớp enum ClickSource ở backend). */
export type ClickSource = "FACEBOOK" | "ZALO" | "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "OTHER";
/** Số click của một ngày; `date` dạng yyyy-MM-dd (giờ Việt Nam). */
export type DailyClicks = { date: string; clicks: number };
export type SourceClicks = { source: ClickSource; clicks: number };
/** GET /api/affiliates/me/click-stats: `daily` chỉ gồm ngày có click; `bySource` nhiều click nhất trước. */
export type ClickStats = { days: number; daily: DailyClicks[]; bySource: SourceClicks[] };

/** Nền tảng có link riêng: `src` là giá trị tham số ?src= gắn vào link chia sẻ. */
export const SHARE_PLATFORMS = [
  { source: "FACEBOOK", src: "facebook", label: "Facebook" },
  { source: "ZALO", src: "zalo", label: "Zalo" },
  { source: "TIKTOK", src: "tiktok", label: "TikTok" },
  { source: "YOUTUBE", src: "youtube", label: "YouTube" },
  { source: "INSTAGRAM", src: "instagram", label: "Instagram" },
] as const satisfies readonly { source: ClickSource; src: string; label: string }[];

export const SOURCE_LABELS: Record<ClickSource, string> = {
  FACEBOOK: "Facebook",
  ZALO: "Zalo",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  OTHER: "Khác / chưa gắn nguồn",
};

/** Link chia sẻ kèm nền tảng: <shareLink>&src=facebook (shareLink luôn có sẵn ?ref=). */
export const platformLink = (shareLink: string, src: string) => `${shareLink}${shareLink.includes("?") ? "&" : "?"}src=${src}`;
