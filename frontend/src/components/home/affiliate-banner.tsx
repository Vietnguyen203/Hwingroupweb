import { Link2, Share2, Wallet } from "lucide-react";

import { AffiliateJoinLink } from "@/components/affiliate/affiliate-join-link";
import { Band } from "@/components/ui/band";

const STEPS = [
  { icon: Link2, title: "Đăng ký miễn phí", text: "Nhận mã giới thiệu và link riêng sau khi được duyệt." },
  { icon: Share2, title: "Chia sẻ sản phẩm", text: "Gửi link cho bạn bè, khách hàng qua Facebook, Zalo, TikTok." },
  { icon: Wallet, title: "Nhận hoa hồng 10%", text: "Hoa hồng tự cộng khi đơn giao thành công, rút về ngân hàng." },
];

/**
 * Khối kêu gọi làm CTV trên trang chủ (web phục vụ affiliate nên đặt nổi bật): dải tím đêm tràn trang,
 * con số 10% cỡ rất lớn là điểm nhấn, ba bước là một chuỗi thật nên được đánh số.
 */
export function AffiliateBanner() {
  return (
    <Band id="affiliate" tone="bg-brand-deep" className="mt-12 py-10 text-white md:mt-16 md:py-16">
      <div className="grid items-center gap-8 px-3 md:px-0 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div>
          <p className="font-display text-[5.5rem] leading-[0.85] font-extrabold tracking-tight text-brand-honey md:text-[9rem]">10%</p>
          <h2 className="mt-4 text-2xl leading-tight font-bold text-balance md:text-4xl">hoa hồng cho mỗi đơn bạn giới thiệu</h2>
          <p className="mt-3 max-w-md text-white/80">Không cần vốn, không cần ôm hàng. HWIN lo sản phẩm, giao hàng và chăm sóc khách.</p>
          <AffiliateJoinLink
            guestLabel="Đăng ký làm cộng tác viên"
            className="mt-6 inline-block rounded-full bg-brand-honey px-7 py-3 font-bold text-neutral-900 transition duration-200 hover:brightness-105"
          />
        </div>
        <ol className="divide-y divide-white/15 border-y border-white/15">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-4 py-5">
              <span className="font-display text-3xl leading-none font-extrabold text-brand-honey tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  {title} <Icon className="size-4 text-white/60" />
                </h3>
                <p className="mt-1 text-sm text-white/75">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}
