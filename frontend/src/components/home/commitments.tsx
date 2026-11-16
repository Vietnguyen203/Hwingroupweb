import { BadgeCheck, Headset, ShieldCheck, Snowflake } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "100% rõ nguồn gốc", text: "Đủ giấy công bố & chứng nhận ATTP" },
  { icon: Headset, title: "Dịch vụ tận tâm", text: "Hỗ trợ khách hàng 24/7 từ HWIN" },
  { icon: ShieldCheck, title: "Thanh toán an toàn", text: "COD hoặc chuyển khoản QR" },
  { icon: Snowflake, title: "Giao hàng giữ lạnh", text: "Đổi trả trong 7 ngày nếu lỗi" },
];

/** 4 ô cam kết (đặt phía trên footer). */
export function Commitments() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-3 lg:grid-cols-4">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
          <Icon className="size-8 shrink-0 text-brand" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
