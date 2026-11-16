const vnd = new Intl.NumberFormat("vi-VN");

/** 95000 -> "95.000đ" */
export function formatVnd(amount: number): string {
  return `${vnd.format(amount)}đ`;
}

const SORTS = ["NEWEST", "PRICE_ASC", "PRICE_DESC", "BESTSELLER"] as const;

/** Đọc tham số sort từ URL, giá trị lạ -> NEWEST. */
export function parseSort(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return (SORTS as readonly string[]).includes(v ?? "") ? (v as (typeof SORTS)[number]) : "NEWEST";
}

export function parsePage(value: string | string[] | undefined): number {
  const v = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(v) && v > 0 ? v - 1 : 0;
}
