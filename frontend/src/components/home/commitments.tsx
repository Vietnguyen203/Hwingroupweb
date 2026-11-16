import { BadgeCheck, RotateCcw, Snowflake, Truck } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "Chứng nhận ATTP", text: "Đủ giấy công bố, nguồn gốc rõ ràng" },
  { icon: Snowflake, title: "Giao giữ lạnh", text: "Đóng gói hút chân không, thùng đá" },
  { icon: Truck, title: "Giao nhanh", text: "Nội thành 2–4 giờ, toàn quốc 1–3 ngày" },
  { icon: RotateCcw, title: "Đổi trả 7 ngày", text: "Hàng lỗi đổi ngay, hoàn tiền nhanh" },
];

/** Khối cam kết. */
export function Commitments() {
  return (
    <section className="mx-3 grid grid-cols-2 gap-3 rounded-xl bg-brand-soft p-4 sm:grid-cols-4">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex gap-2">
          <Icon className="size-7 shrink-0 text-brand" />
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
