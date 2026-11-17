import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Commitments } from "@/components/home/commitments";
import { siteConfig } from "@/lib/config";

/** Cuối trang: dải đăng ký CTV (navy) · 4 ô cam kết · footer navy nhiều cột. */
export function SiteFooter() {
  return (
    <footer className="mt-10 pb-16 md:pb-0">
      <section className="bg-brand text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold uppercase">Đăng ký cộng tác viên HWIN</p>
            <p className="text-sm text-white/80">Phát triển cùng HWIN</p>
          </div>
          <form action="/ctv" method="get" className="flex w-full max-w-md gap-2">
            <input name="phone" type="tel" inputMode="numeric" placeholder="Số điện thoại của bạn" maxLength={15}
                   className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-sm text-neutral-900 outline-none" />
            <button className="h-11 shrink-0 rounded-full bg-[#6c64d9] px-5 text-sm font-semibold">Đăng ký ngay</button>
          </form>
        </div>
      </section>

      <div className="bg-white py-6">
        <Commitments />
      </div>

      <section className="bg-brand text-sm text-white/85">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-3 text-xl font-black text-white">HWIN</p>
            <p>Thực phẩm chế biến sẵn – ngon, sạch, rõ nguồn gốc, giao nhanh giữ lạnh đến mọi gia đình Việt.</p>
          </div>
          <FooterCol title="Hỗ trợ khách hàng" links={[
            ["Chính sách đổi trả", "#"], ["Chính sách bảo mật", "#"], ["Hướng dẫn mua hàng", "#"],
            ["Thanh toán & vận chuyển", "#"], ["Câu hỏi thường gặp", "#"],
          ]} />
          <FooterCol title="Về HWIN" links={[
            ["Giới thiệu", "#"], ["Cộng tác viên", "/ctv"], ["Tài khoản của tôi", "/account"], ["Tìm sản phẩm", "/search"],
          ]} />
          <div>
            <p className="mb-3 font-semibold text-white uppercase">Công ty CP Tập đoàn HWIN</p>
            <ul className="space-y-2">
              <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />Địa chỉ: Khu đô thị The Manor Central Park, Phường Định Công, TP Hà Nội</li>
              <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" />Hotline: 0961 008 971 <a href={`tel:${siteConfig.hotline}`} className="text-white">{siteConfig.hotline}</a></li>
              <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" />Email: CeoHwinGroup@gmail.com</li>
            </ul>
          </div>
        </div>
        <p className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/60">Copyright © 2026 HWINGROUP – bản demo</p>
      </section>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 font-semibold text-white uppercase">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}><Link href={href} className="hover:text-white">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
