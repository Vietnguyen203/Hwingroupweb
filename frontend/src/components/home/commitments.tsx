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
        <div key={title} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon className="size-6" /></span>
          <div>
            <p className="text-sm font-bold text-neutral-900">{title}</p>
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
