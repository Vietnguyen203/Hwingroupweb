"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { useMounted } from "@/hooks/use-mounted";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Cổng kiểm tra từng trang trong cổng CTV: chỉ CTV đã duyệt thấy nội dung, người khác thấy thông báo kèm lối đi.
 * Đặt ở TỪNG TRANG (không đặt ở layout) để layout luôn render `children` – Next.js cần segment trang có
 * khung tĩnh để kiểm tra "điều hướng tức thì"; layout mà bỏ children khi đang tải sẽ bị cảnh báo "dropped from rendering".
 * Đây cũng là nơi duy nhất làm mới phiên khi vừa được duyệt (xem useAffiliateProfile).
 */
export function PortalGate({ children }: { children: React.ReactNode }) {
  const { me, profile, needsRole } = useAffiliateProfile();
  const mounted = useMounted();
  const a = profile.data;

  // Chưa mounted: luôn skeleton để khớp HTML server (React hydrate từng phần, lúc đó cache đăng nhập có thể đã có sẵn)
  if (!mounted || me.isPending || (me.data && profile.isPending) || needsRole) return <PortalSkeleton />;
  if (!me.data) {
    return <Notice title="Mời bạn đăng nhập" text="Đăng nhập để vào cổng cộng tác viên của bạn." href="/login?next=%2Faffiliate%2Fdashboard" action="Đăng nhập" />;
  }
  if (profile.error) {
    return <Notice title="Chưa tải được hồ sơ của bạn" text={errorMessage(profile.error)} href="/affiliate" action="Về trang CTV" />;
  }
  if (!a) {
    return <Notice title="Bạn chưa là cộng tác viên" text="Tham gia chương trình để nhận link giới thiệu riêng và hoa hồng cho mỗi đơn bạn giới thiệu." href="/affiliate/register" action="Đăng ký làm CTV" />;
  }
  if (a.status !== "APPROVED") {
    return <Notice title="Hồ sơ của bạn chưa được kích hoạt" text="Hồ sơ đang chờ duyệt hoặc chưa hoạt động. Bạn xem chi tiết ở trang CTV nhé." href="/affiliate" action="Xem trạng thái hồ sơ" />;
  }
  return children;
}

export function PortalSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-10 w-2/3 bg-gray-200" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-gray-200" />)}
      </div>
      <Skeleton className="h-64 rounded-xl bg-gray-200" />
    </div>
  );
}

function Notice({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white p-6 text-center ">
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      <p className="mt-1.5 text-sm text-gray-500">{text}</p>
      <Link href={href} className={cn(buttonVariants(), "mt-5 h-10 bg-brand-red px-5 text-sm font-semibold text-white hover:bg-brand-red/90")}>
        {action}
      </Link>
    </div>
  );
}
