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
        <div key={title} className="group/why rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-black/[0.04] transition duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand transition duration-300 ease-spring group-hover/why:scale-110 group-hover/why:rotate-6 group-hover/why:bg-brand group-hover/why:text-white">
            <Icon className="size-7" />
          </span>
          <h3 className="mt-4 font-extrabold text-neutral-900">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
      ))}
    </div>
  );
}
