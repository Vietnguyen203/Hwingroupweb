import { BadgeCheck, Handshake, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "Chính hãng, nguồn gốc rõ ràng", text: "HWIN cam kết hàng chính hãng, nguồn gốc rõ ràng và đầy đủ giấy tờ" },
  { icon: Truck, title: "Giao hàng tận nơi", text: "Đóng gói cẩn thận, giao hàng nhanh chóng" },
  { icon: ShieldCheck, title: "Thanh toán an toàn", text: "Thanh toán khi nhận hàng hoặc chuyển khoản QR, xuất hóa đơn VAT." },
  { icon: Handshake, title: "Phát triển cùng HWIN", text: "Hợp đồng rõ ràng, hoa hồng theo năng lực" },
];

/** Khối "Hãy đồng hành cùng HWIN" (desktop: 4 cột). */
export function WhyHwin() {
  return (
    <div className="grid gap-3 px-3 sm:grid-cols-2 md:px-0 lg:grid-cols-4 lg:gap-5">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="group/why rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-black/[0.04] transition duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-card-hover">
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
