/** Các mục của cổng CTV; URL dạng /affiliate/<id tài khoản>/<mục>. */
export const PORTAL_SLUGS = ["dashboard", "campaigns", "products", "links", "performance", "earnings"] as const;
export type PortalSlug = (typeof PORTAL_SLUGS)[number];

/**
 * Đường dẫn tới một mục của cổng CTV. Chưa biết id (trước khi mount / chưa đăng nhập) thì dùng link cũ
 * /affiliate/<mục> – trang đó tự chuyển sang link có id ngay khi biết người dùng (xem OwnIdRedirect).
 */
export function portalPath(slug: PortalSlug, id?: string | null, search = ""): string {
  return `/affiliate/${id ? `${id}/` : ""}${slug}${search}`;
}

/** Mục đang mở, suy ra từ pathname: /affiliate/<id>/<mục> hoặc link cũ /affiliate/<mục>. */
export function activeSlug(pathname: string): PortalSlug | null {
  const segs = pathname.split("/"); // ["", "affiliate", "<id>" | "<mục>", "<mục>"?]
  const found = [segs[3], segs[2]].find((s) => (PORTAL_SLUGS as readonly string[]).includes(s));
  return (found as PortalSlug | undefined) ?? null;
}
