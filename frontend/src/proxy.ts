import { NextResponse, type NextRequest } from "next/server";

/**
 * Chặn /admin và /affiliate theo vai trò (Next.js 16 đổi tên middleware.ts -> proxy.ts).
 * Chỉ giải mã payload JWT để điều hướng giao diện – backend mới là nơi kiểm quyền thật.
 * Access token hết hạn -> chuyển tới trang đăng nhập, trang đó sẽ thử /api/auth/refresh trước.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const loginPath = "/login"; // một trang đăng nhập chung; admin đi qua API đăng nhập admin
  // Link cũ /admin/login -> trang đăng nhập chung
  if (pathname === "/admin/login") return NextResponse.redirect(new URL(`${loginPath}?next=/admin/orders`, request.url));
  // /affiliate là trang giới thiệu công khai (dashboard CTV hiển thị ở đây khi đã đăng nhập)
  if (pathname === loginPath || pathname === "/affiliate") return NextResponse.next();

  const roles = readRoles(request.cookies.get("hwin_at")?.value);
  const required = isAdmin ? "ADMIN" : null; // trang CTV khác chỉ cần đăng nhập; quyền AFFILIATE do backend kiểm tra
  const loggedIn = roles !== null;

  if (!loggedIn || (required && !roles.includes(required))) {
    const url = request.nextUrl.clone();
    if (pathname === "/affiliate/register") {
      // Khách bấm "Đăng ký CTV": vào thẳng form đăng ký tài khoản (xong tự sang form CTV), không vòng qua trang đăng nhập.
      url.pathname = "/register";
      url.search = `?next=${encodeURIComponent(pathname)}`;
    } else {
      url.pathname = loginPath;
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
    }
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

/** @returns danh sách role nếu token còn hạn, null nếu không có/hết hạn/lỗi. */
function readRoles(token: string | undefined): string[] | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return Array.isArray(payload.roles) ? payload.roles : [];
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/affiliate/:path*"],
};
