// Bộ lọc của trang tìm kiếm / danh mục, lưu trên URL: ?min_price=&max_price=&in_stock=1&on_sale=1
// (cùng tên tham số với API backend GET /api/products; giá là giá khách thực trả, đơn vị VND).

export type ProductFilters = {
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  onSale: boolean;
};

export type PricePreset = { label: string; minPrice?: number; maxPrice?: number };

/** Các mức giá chọn nhanh. Mốc dùng chung cho hai đầu (đã gồm cả mốc). */
export const PRICE_PRESETS: readonly PricePreset[] = [
  { label: "Dưới 100k", maxPrice: 100_000 },
  { label: "100k – 300k", minPrice: 100_000, maxPrice: 300_000 },
  { label: "300k – 500k", minPrice: 300_000, maxPrice: 500_000 },
  { label: "Trên 500k", minPrice: 500_000 },
];

type RawParams = Record<string, string | string[] | undefined>;

const MAX_PRICE = 1_000_000_000;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Số nguyên dương hợp lệ; giá trị lạ / 0 / âm -> bỏ qua (không lọc). */
function readPrice(v: string | string[] | undefined): number | undefined {
  const n = Number(first(v));
  return Number.isInteger(n) && n > 0 && n <= MAX_PRICE ? n : undefined;
}

function readFlag(v: string | string[] | undefined): boolean {
  const s = first(v);
  return s === "1" || s === "true";
}

/** Đọc bộ lọc từ searchParams của trang. */
export function parseFilters(sp: RawParams): ProductFilters {
  return {
    minPrice: readPrice(sp.min_price),
    maxPrice: readPrice(sp.max_price),
    inStock: readFlag(sp.in_stock),
    onSale: readFlag(sp.on_sale),
  };
}

/** Tham số URL tương ứng với bộ lọc (bỏ giá trị trống) – để giữ bộ lọc khi đổi sắp xếp / sang trang khác. */
export function filterParams(f: ProductFilters): Record<string, string | undefined> {
  return {
    min_price: f.minPrice?.toString(),
    max_price: f.maxPrice?.toString(),
    in_stock: f.inStock ? "1" : undefined,
    on_sale: f.onSale ? "1" : undefined,
  };
}

export const hasPriceFilter = (f: ProductFilters) => f.minPrice !== undefined || f.maxPrice !== undefined;

export const hasFilters = (f: ProductFilters) => hasPriceFilter(f) || f.inStock || f.onSale;

export const matchesPreset = (f: ProductFilters, p: PricePreset) => f.minPrice === p.minPrice && f.maxPrice === p.maxPrice;
