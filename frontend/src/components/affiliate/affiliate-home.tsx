"use client";

import Link from "next/link";
import { BadgePercent, Link2, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useAffiliateProfile } from "@/hooks/use-affiliate-profile";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AffiliateDashboardView } from "./affiliate-dashboard";

/**
 * /affiliate – theo trạng thái người xem:
 * chưa đăng nhập -> giới thiệu chương trình; chưa đăng ký -> mời đăng ký; PENDING / REJECTED / SUSPENDED -> thông báo;
 * APPROVED -> dashboard CTV.
 */
export function AffiliateHome() {
  const { me, profile, needsRole } = useAffiliateProfile();

  if (me.isPending || (me.data && profile.isPending) || needsRole) {
    return <div className="m-3 h-64 animate-pulse rounded-2xl bg-neutral-200" />;
  }
  if (!me.data) return <Landing />;
  if (profile.error) return <p className="m-3 rounded-2xl bg-white p-4 text-sm text-destructive">{errorMessage(profile.error)}</p>;
  const a = profile.data;
  if (!a) return <Landing />;
  if (a.status === "APPROVED") return <AffiliateDashboardView profile={a} />;

  const notice = {
    PENDING: { title: "Hồ sơ đang chờ duyệt", text: "Chúng tôi sẽ duyệt hồ sơ trong 1–2 ngày làm việc." },
    REJECTED: { title: "Hồ sơ chưa được duyệt", text: a.statusReason ? `Lý do: ${a.statusReason}` : "Bạn có thể bổ sung thông tin và đăng ký lại." },
    SUSPENDED: { title: "Tài khoản CTV đang tạm khóa", text: a.statusReason ? `Lý do: ${a.statusReason}` : "Vui lòng liên hệ hotline để được hỗ trợ." },
  }[a.status];
  return (
    <div className="mx-auto max-w-lg space-y-3 p-3 md:py-10">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-lg font-bold text-brand">{notice.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{notice.text}</p>
        {a.status === "REJECTED" && (
          <Link href="/affiliate/register" className={cn(buttonVariants(), "mt-4 h-11 w-full text-base")}>Đăng ký lại</Link>
        )}
      </div>
    </div>
  );
}

function Landing() {
  const perks = [
    { icon: Link2, title: "Chia sẻ link riêng", text: "Mỗi CTV có mã giới thiệu và link riêng, theo dõi lượt click." },
    { icon: BadgePercent, title: "Hoa hồng 10%", text: "Tính trên giá trị đơn (trước phí ship), khách gắn với bạn vĩnh viễn." },
    { icon: Wallet, title: "Rút tiền về ngân hàng", text: "Hoa hồng được duyệt sau 7 ngày kể từ khi giao hàng thành công." },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-3 md:py-10">
      <section className="rounded-2xl bg-brand p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Cộng tác viên HWIN</h1>
        <p className="mt-1 text-white/85">Phát triển cùng HWIN – giới thiệu thực phẩm sạch, nhận hoa hồng trên mỗi đơn thành công.</p>
        {/* Chưa có tài khoản: proxy đưa thẳng tới đăng ký tài khoản rồi tự quay lại form CTV */}
        <Link href="/affiliate/register" className="mt-4 inline-block rounded-full bg-brand-cta px-6 py-2.5 font-semibold">
          Đăng ký làm CTV
        </Link>
      </section>
      <div className="grid gap-3 md:grid-cols-3">
        {perks.map((p) => (
          <div key={p.title} className="rounded-2xl bg-white p-4 shadow-sm">
            <p.icon className="size-6 text-brand" />
            <h2 className="mt-2 font-bold">{p.title}</h2>
            <p className="text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
