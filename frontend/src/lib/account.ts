// Kiểu dữ liệu tài khoản / đơn hàng (khớp DTO backend identity, customer, ordering)

export type MeResponse = { id: string; phoneMasked: string | null; email: string | null; fullName: string | null; roles: string[] };

export type OtpSentResponse = { channel: "SMS" | "EMAIL"; sentTo: string; expiresInSeconds: number };

export type ProfileResponse = {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  totalOrders: number;
  totalSpent: number;
};

export type AddressResponse = {
  id: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  fullText: string;
  isDefault: boolean;
};

export type SaveAddressRequest = Omit<AddressResponse, "id" | "fullText" | "isDefault"> & { makeDefault: boolean };

export type OrderSummaryResponse = {
  code: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  firstItemName: string;
  firstItemImage: string | null;
  placedAt: string;
};

export type OrderDetailResponse = Omit<OrderSummaryResponse, "itemCount" | "firstItemName" | "firstItemImage"> & {
  subtotal: number;
  discount: number;
  shippingFee: number;
  shippingAddress: { recipientName: string; recipientPhone: string; fullText: string };
  note: string | null;
  items: { productId: string; productName: string; productSlug: string; imageUrl: string | null; unitPrice: number; quantity: number; lineTotal: number }[];
  cancelReason: string | null;
  cancellable: boolean;
  /** Khách bấm được "Đã nhận được hàng" (đơn đang giao). */
  receivable: boolean;
  /** Hướng dẫn chuyển khoản – chỉ có khi BANK_QR chưa thanh toán. */
  payment: { qrImageUrl: string; bankBin: string; accountNo: string; accountName: string; amount: number; transferContent: string } | null;
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "RETURNED";

export const ORDER_STATUS: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ xác nhận", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-800" },
  SHIPPING: { label: "Đang giao", className: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Đã giao", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Hoàn tất", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", className: "bg-neutral-200 text-neutral-700" },
  RETURNED: { label: "Đã trả hàng", className: "bg-neutral-200 text-neutral-700" },
};

export const PAYMENT_METHOD: Record<string, string> = { COD: "Thanh toán khi nhận hàng", BANK_QR: "Chuyển khoản (QR)" };

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
export const formatDateTime = (iso: string) => dateFmt.format(new Date(iso));
