import { BadgeCheck, Handshake, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "Chính hãng, rõ nguồn gốc", text: "Đủ giấy tự công bố và chứng nhận an toàn thực phẩm cho từng sản phẩm." },
  { icon: Truck, title: "Giao nhanh, giữ lạnh", text: "Đóng gói giữ lạnh, giao tận nơi; đổi trả trong 7 ngày nếu lỗi." },
  { icon: ShieldCheck, title: "Thanh toán an toàn", text: "Thanh toán khi nhận hàng hoặc chuyển khoản QR, xuất hóa đơn VAT." },
  { icon: Handshake, title: "Cùng phát triển với CTV", text: "Hoa hồng 10% mỗi đơn thành công, khách gắn với CTV vĩnh viễn." },
];

/** Khối "Vì sao chọn HWIN" (desktop: 4 cột). */
export function WhyHwin() {
  return (
    <div className="grid gap-3 px-3 sm:grid-cols-2 md:px-0 lg:grid-cols-4 lg:gap-5">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="rounded-2xl bg-white p-5 text-center shadow-[0_2px_10px_rgba(36,60,132,0.08)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon className="size-7" />
          </span>
          <h3 className="mt-3 font-bold text-brand">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
      ))}
    </div>
  );
}
