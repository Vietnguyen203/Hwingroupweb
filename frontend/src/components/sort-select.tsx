import { ArrowUpDown } from "lucide-react";

import { NavSelect } from "@/components/ui/nav-select";
import type { ProductSort } from "@/lib/types";

const OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "NEWEST", label: "Mới nhất" },
  { value: "BESTSELLER", label: "Bán chạy" },
  { value: "PRICE_ASC", label: "Giá thấp" },
  { value: "PRICE_DESC", label: "Giá cao" },
];

/**
 * Sắp xếp sản phẩm dạng combobox. Đổi lựa chọn thì chuyển tới ?sort=… của lựa chọn đó,
 * giữ nguyên các tham số khác (VD từ khóa tìm kiếm) và về trang 1.
 */
export function SortSelect({ basePath, params, current }: {
  basePath: string;
  params: Record<string, string | undefined>;
  current: ProductSort;
}) {
  const options = OPTIONS.map((o) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
    qs.set("sort", o.value);
    return { value: o.value, label: o.label, href: `${basePath}?${qs.toString()}` };
  });
  return <NavSelect label="Sắp xếp" icon={<ArrowUpDown aria-hidden className="size-4" />} value={current} options={options} />;
}
