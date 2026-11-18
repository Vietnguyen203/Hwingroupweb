import Link from "next/link";
import { Link2, Share2, Wallet } from "lucide-react";

const STEPS = [
  { icon: Link2, title: "Đăng ký miễn phí", text: "Nhận mã giới thiệu và link riêng sau khi được duyệt." },
  { icon: Share2, title: "Chia sẻ sản phẩm", text: "Gửi link cho bạn bè, khách hàng qua Facebook, Zalo, TikTok." },
  { icon: Wallet, title: "Nhận hoa hồng 10%", text: "Hoa hồng tự cộng khi đơn giao thành công, rút về ngân hàng." },
];

/** Khối kêu gọi làm CTV trên trang chủ (web phục vụ affiliate nên đặt nổi bật). */
export function AffiliateBanner() {
  return (
    <section className="mx-3 mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-brand-deep p-6 text-white shadow-[0_24px_50px_-20px_rgb(108_59_255/0.6)] md:mx-0 md:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-sm font-semibold tracking-widest text-brand-accent uppercase">Cộng tác viên HWIN</p>
          <h2 className="mt-2 text-2xl leading-tight font-black md:text-4xl">Chia sẻ món ngon,<br />nhận hoa hồng mỗi đơn</h2>
          <p className="mt-3 text-white/80">Không cần vốn, không cần ôm hàng – HWIN lo sản phẩm, giao hàng và chăm sóc khách.</p>
          <Link href="/affiliate" className="mt-6 inline-block rounded-full bg-brand-accent px-7 py-3 font-extrabold text-neutral-950 shadow-lg shadow-brand-accent/30 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
            Đăng ký CTV ngay
          </Link>
        </div>
        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15">
              <span className="flex items-center gap-2 text-sm font-bold text-brand-accent">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-accent text-white">{i + 1}</span>
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-white/75">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
