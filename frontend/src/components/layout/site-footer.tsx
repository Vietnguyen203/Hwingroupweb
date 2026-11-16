import Link from "next/link";

import { siteConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-neutral-900 pb-24 text-sm text-neutral-300">
      <div className="mx-auto grid max-w-screen-lg gap-6 px-4 py-8 sm:grid-cols-3">
        <div>
          <p className="mb-2 text-base font-bold text-white">{siteConfig.name}</p>
          <p>{siteConfig.description}</p>
          <p className="mt-2">Hotline: <a className="text-white" href={`tel:${siteConfig.hotline}`}>{siteConfig.hotline}</a></p>
          <p className="mt-1 text-xs text-neutral-500">Thông tin công ty: (cập nhật sau)</p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white">Chính sách</p>
          <ul className="space-y-1">
            <li>Giao hàng giữ lạnh</li>
            <li>Đổi trả trong 7 ngày</li>
            <li>Bảo mật thông tin</li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white">Cộng tác viên</p>
          <ul className="space-y-1">
            <li><Link href="/ctv" className="hover:text-white">Đăng ký làm CTV</Link></li>
            <li>Hoa hồng 10% mỗi đơn</li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-neutral-500">© {siteConfig.name} – bản demo</p>
    </footer>
  );
}
