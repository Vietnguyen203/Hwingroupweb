import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { GuestOnly } from "@/components/affiliate/affiliate-join-link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/lib/config";
import { SocialLinks } from "./social-links";

/** Cuối trang: dải đăng ký CTV (chỉ cho khách) · footer navy nhiều cột. */
export function SiteFooter() {
  return (
    <footer className="mt-10 pb-16 md:pb-0">
      <GuestOnly>
      <section className="bg-brand text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-bold">Đăng ký cộng tác viên Phúc Vị</p>
            <p className="text-sm text-white/80">Phát triển cùng Phúc Vị</p>
          </div>
          {/* Vào thẳng form đăng ký CTV (chưa có tài khoản thì tự sang đăng ký tài khoản) */}
          <Link href="/affiliate/register"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-brand-accent px-8 text-sm font-extrabold text-neutral-950 shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0">
            Đăng ký ngay
          </Link>
        </div>
      </section>
      </GuestOnly>

      <section className="bg-brand-deep text-sm text-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo tone="light" full className="max-w-52" />
            <p className="leading-relaxed">Hệ sinh thái sản phẩm nhập khẩu chính hãng, mang đến cuộc sống chất lượng hơn cho mọi gia đình Việt.</p>
            <p className="font-bold text-white">Theo dõi Phúc Vị trên mạng xã hội</p>
            <SocialLinks />
          </div>
          <FooterCol title="Chính sách & Pháp lý" links={[
            ["Giấy chứng nhận VSATTP", "/chinh-sach?tab=vsattp"],
            ["Chính sách đổi trả 7 ngày", "/chinh-sach?tab=doi-tra"],
            ["Chính sách bảo mật", "/chinh-sach?tab=bao-mat"],
            ["Kiểm hàng & Vận chuyển", "/chinh-sach?tab=kiem-hang"],
            ["Điều khoản giao dịch TMĐT", "/chinh-sach?tab=dieu-khoan"],
          ]} />
          <FooterCol title="Về Phúc Vị" links={[
            ["Giới thiệu", siteConfig.aboutUrl], ["Cộng tác viên", "/affiliate"], ["Tài khoản của tôi", "/account"], ["Tìm sản phẩm", "/search"],
          ]} />
          <div>
            <p className="mb-3 font-semibold text-white">Công ty CP Tập đoàn HWIN</p>
            <ul className="space-y-2">
              <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />Địa chỉ: Khu đô thị The Manor Central Park, Phường Định Công, TP Hà Nội</li>
              <li className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0" />Hotline: <a href={`tel:${siteConfig.hotline}`} className="text-white">{siteConfig.hotline}</a></li>
              <li className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0" />Email: CeoHwinGroup@gmail.com</li>
            </ul>
            {/* Logo đã thông báo website TMĐT với Bộ Công Thương (online.gov.vn) */}
            <a href={siteConfig.bctUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block" title="Đã thông báo Bộ Công Thương">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/bct-da-thong-bao.png" alt="Đã thông báo Bộ Công Thương" width={150} height={50} className="h-auto w-[150px]" />
            </a>
          </div>
        </div>
        <p className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/60">Copyright © 2026 HWINGROUP</p>
      </section>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 font-semibold text-white">{title}</p>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}><Link href={href} className="transition-colors hover:text-brand-accent">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
