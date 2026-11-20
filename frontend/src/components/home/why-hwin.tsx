import { BadgeCheck, Handshake, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "Chính hãng, nguồn gốc rõ ràng", text: "HWIN cam kết hàng chính hãng, nguồn gốc rõ ràng và đầy đủ giấy tờ" },
  { icon: Truck, title: "Giao hàng tận nơi", text: "Đóng gói cẩn thận, giao hàng nhanh chóng" },
  { icon: ShieldCheck, title: "Thanh toán an toàn", text: "Thanh toán khi nhận hàng hoặc chuyển khoản QR, xuất hóa đơn VAT." },
  { icon: Handshake, title: "Phát triển cùng HWIN", text: "Hợp đồng rõ ràng, hoa hồng theo năng lực" },
];

/** Khối "Hãy đồng hành cùng HWIN": bốn cam kết trình bày phẳng, ngăn bằng đường kẻ, không đóng khung từng ô. */
export function WhyHwin() {
  return (
    <div className="grid gap-x-8 gap-y-6 px-3 pb-12 sm:grid-cols-2 md:px-0 md:pb-16 lg:grid-cols-4">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="border-t-2 border-brand-deep pt-4">
          <Icon className="size-7 text-brand" />
          <h3 className="mt-3 text-lg leading-snug font-bold text-neutral-900">{title}</h3>
          <p className="mt-1 text-sm text-neutral-600">{text}</p>
        </div>
      ))}
    </div>
  );
}
