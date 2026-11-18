import { formatVnd } from "@/lib/format";

/** Một thông báo do backend trả về (REST và WebSocket dùng chung). Backend chỉ gửi `type` + `data`; chữ tiếng Việt dựng ở đây. */
export type NotificationItem = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  link: string | null;
  createdAt: string;
  read: boolean;
};

export type NotificationPage = {
  content: NotificationItem[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

/** Tin đẩy qua WebSocket. */
export type RealtimeMessage =
  | { type: "hello" }
  | { type: "pong" }
  | { type: "unread"; unreadCount: number }
  | { type: "notification"; notification: NotificationItem; unreadCount: number };

export type Tone = "success" | "info" | "warning" | "danger" | "accent";

const str = (v: unknown, fallback = "") => (typeof v === "string" || typeof v === "number" ? String(v) : fallback);
const money = (v: unknown) => formatVnd(Number(v) || 0);

const CANCEL_REASON: Record<string, string> = {
  ADMIN: "do cửa hàng hủy",
  OUT_OF_STOCK: "do hết hàng",
  PAYMENT_TIMEOUT: "do quá hạn thanh toán",
};

/** Tiêu đề + nội dung tiếng Việt của một thông báo, theo loại (enum backend). Loại lạ thì hiện nội dung chung. */
export function describeNotification(n: Pick<NotificationItem, "type" | "data">): { title: string; body: string; tone: Tone } {
  const d = n.data ?? {};
  const code = str(d.orderCode);
  switch (n.type) {
    case "ORDER_PLACED":
      return { title: "Đơn hàng mới", body: `Đơn ${code} – ${money(d.total)} đang chờ xử lý.`, tone: "success" };
    case "ORDER_CONFIRMED":
      return { title: "Đơn hàng đã được xác nhận", body: `Đơn ${code} đã được cửa hàng xác nhận và đang chuẩn bị hàng.`, tone: "info" };
    case "ORDER_SHIPPED":
      return { title: "Đơn hàng đang được giao", body: `Đơn ${code} đã giao cho đơn vị vận chuyển.`, tone: "info" };
    case "ORDER_DELIVERED":
      return { title: "Giao hàng thành công", body: `Đơn ${code} đã được giao. Cảm ơn bạn đã mua sắm tại HWIN!`, tone: "success" };
    case "ORDER_CANCELLED": {
      const why = CANCEL_REASON[str(d.reason)] ?? "";
      return { title: "Đơn hàng đã bị hủy", body: `Đơn ${code} đã bị hủy${why ? " " + why : ""}.`, tone: "danger" };
    }
    case "ORDER_RETURNED":
      return { title: "Đã ghi nhận trả hàng", body: `Đơn ${code} đã được ghi nhận trả hàng.`, tone: "warning" };
    case "COMMISSION_EARNED":
      return {
        title: "Có đơn mới qua link của bạn",
        body: `Đơn ${code}: hoa hồng dự kiến ${money(d.amount)} (chờ duyệt sau khi giao hàng thành công).`,
        tone: "accent",
      };
    case "COMMISSION_APPROVED":
      return { title: "Hoa hồng đã được duyệt", body: `+${money(d.amount)} từ đơn ${code} đã cộng vào số dư có thể rút.`, tone: "success" };
    case "PAYOUT_REQUESTED":
      return { title: "Yêu cầu rút tiền mới", body: `${str(d.fullName, "Một CTV")} yêu cầu rút ${money(d.amount)}.`, tone: "warning" };
    case "PAYOUT_APPROVED":
      return { title: "Yêu cầu rút tiền đã được duyệt", body: `Yêu cầu rút ${money(d.amount)} đã được duyệt, đang chờ chuyển khoản.`, tone: "info" };
    case "PAYOUT_PAID":
      return { title: "Đã chuyển tiền cho bạn", body: `${money(d.amount)} đã được chuyển vào tài khoản ngân hàng của bạn.`, tone: "success" };
    case "PAYOUT_REJECTED":
      return { title: "Yêu cầu rút tiền bị từ chối", body: `Yêu cầu rút ${money(d.amount)} không được duyệt. Số tiền đã trả về số dư.`, tone: "danger" };
    case "AFFILIATE_APPLIED":
      return { title: "CTV mới chờ duyệt", body: `${str(d.fullName, "Một người dùng")} vừa gửi hồ sơ đăng ký cộng tác viên.`, tone: "info" };
    case "AFFILIATE_APPROVED":
      return { title: "Hồ sơ CTV đã được duyệt", body: "Chúc mừng! Bạn đã là cộng tác viên HWIN. Hãy chia sẻ link giới thiệu để nhận hoa hồng.", tone: "success" };
    case "AFFILIATE_REJECTED":
      return {
        title: "Hồ sơ CTV chưa được duyệt",
        body: d.reason ? `Lý do: ${str(d.reason)}` : "Bạn có thể bổ sung thông tin và đăng ký lại.",
        tone: "danger",
      };
    default:
      return { title: "Thông báo mới", body: "", tone: "info" };
  }
}

/** Các truy vấn cần tải lại khi có thông báo loại này (để trang đang mở tự cập nhật, không cần F5). */
export function queryKeysToRefresh(n: Pick<NotificationItem, "type" | "data">): (readonly unknown[])[] {
  const code = str(n.data?.orderCode);
  switch (n.type) {
    case "ORDER_PLACED":
      return [["admin", "/api/admin/orders"]];
    case "AFFILIATE_APPLIED":
      return [["admin", "/api/admin/affiliates"]];
    case "PAYOUT_REQUESTED":
      return [["admin", "/api/admin/payouts"]];
    case "ORDER_CONFIRMED":
    case "ORDER_SHIPPED":
    case "ORDER_DELIVERED":
    case "ORDER_CANCELLED":
    case "ORDER_RETURNED":
      return [["orders"], ["order", code], ["profile"]];
    case "COMMISSION_EARNED":
    case "COMMISSION_APPROVED":
    case "PAYOUT_APPROVED":
    case "PAYOUT_PAID":
    case "PAYOUT_REJECTED":
      return [["affiliate-dashboard"], ["affiliate-payouts"]];
    case "AFFILIATE_APPROVED":
    case "AFFILIATE_REJECTED":
      return [["affiliate-me"], ["affiliate-dashboard"]];
    default:
      return [];
  }
}

/** "vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước", sau đó là ngày tháng. */
export function timeAgo(iso: string, now = Date.now()): string {
  const sec = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (sec < 45) return "vừa xong";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hour = Math.round(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  const day = Math.round(hour / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
