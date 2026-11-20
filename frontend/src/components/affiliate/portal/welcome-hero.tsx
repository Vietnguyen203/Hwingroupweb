import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ShareLink } from "../affiliate-dashboard";

type Props = {
  name: string;
  referralCode?: string | null;
  /** undefined = đang tải. */
  shareLink?: string;
};

/** Khối chào mừng đầu trang Tổng quan: lời chào, CTA "Khám phá sản phẩm" và mã/link giới thiệu chép 1 chạm. */
export function WelcomeHero({ name, referralCode, shareLink }: Props) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-brand-deep p-5 text-white shadow-lg shadow-brand/20 sm:p-8">
      {/* Trang trí: vầng sáng cam + lưới chấm mờ dần về phía dưới */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />

      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 ring-1 ring-white/20">
            <Sparkles className="size-3.5 text-brand-accent" aria-hidden />
            Cổng cộng tác viên HWIN
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            Chào mừng quay trở lại, <span className="text-brand-accent">{name}</span>!
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">
            Chia sẻ món ngon, theo dõi đơn hàng và hoa hồng của bạn ngay tại đây.
          </p>
          <Link
            href="/products"
            className="group mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-accent px-5 text-sm font-extrabold text-neutral-950 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            <Compass className="size-4.5" aria-hidden />
            Khám phá sản phẩm
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <div className="min-w-0 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm sm:p-5">
          <p className="text-xs font-semibold text-white/70">Mã giới thiệu của bạn</p>
          <p className="mt-1 text-2xl font-black tracking-[0.2em] sm:text-3xl">{referralCode ?? "········"}</p>
          {shareLink ? <ShareLink link={shareLink} /> : <Skeleton className="mt-3 h-12 rounded-xl bg-white/15" />}
        </div>
      </div>
    </section>
  );
}
