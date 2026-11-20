import { Link2, Share2, Wallet } from "lucide-react";

import { AffiliateJoinLink } from "@/components/affiliate/affiliate-join-link";
import { Band } from "@/components/ui/band";

const STEPS = [
  { icon: Link2, title: "Đăng ký miễn phí", text: "Nhận mã giới thiệu và link riêng sau khi được duyệt." },
  { icon: Share2, title: "Chia sẻ sản phẩm", text: "Gửi link cho bạn bè, khách hàng qua Facebook, Zalo, TikTok." },
  { icon: Wallet, title: "Nhận hoa hồng 10%", text: "Hoa hồng tự cộng khi đơn giao thành công, rút về ngân hàng." },
];

/**
 * Khối kêu gọi làm CTV trên trang chủ (web phục vụ affiliate nên đặt nổi bật): dải vàng nhạt tràn trang,
 * con số 10% cỡ rất lớn là điểm nhấn, ba bước là một chuỗi thật nên được đánh số.
 */
export function AffiliateBanner() {
  return (
    <Band id="affiliate" tone="bg-brand-honey/25" className="mt-12 py-10 text-brand-deep md:mt-16 md:py-16">
      <div className="grid items-center gap-8 px-3 md:px-0 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div>
          <p className="font-display text-[5rem] leading-[0.85] font-extrabold tracking-tight text-brand md:text-[8rem]">10%</p>
          <h2 className="mt-4 text-2xl leading-tight font-bold text-balance md:text-3xl">hoa hồng cho mỗi đơn bạn giới thiệu</h2>
          <p className="mt-3 max-w-md text-neutral-700">Bạn chỉ cần chia sẻ món ngon mình thích. Phúc Vị lo sản phẩm, giao hàng và chăm sóc khách giúp bạn.</p>
          <AffiliateJoinLink
            guestLabel="Tham gia cùng Phúc Vị"
            className="mt-6 inline-block rounded-full bg-brand px-7 py-3 font-bold text-white transition duration-200 hover:bg-brand-dark"
          />
        </div>
        <ol className="divide-y divide-brand-deep/15 border-y border-brand-deep/15">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-4 py-5">
              <span className="font-display text-3xl leading-none font-extrabold text-brand tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  {title} <Icon className="size-4 text-brand-deep/50" />
                </h3>
                <p className="mt-1 text-sm text-neutral-700">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  );
}
