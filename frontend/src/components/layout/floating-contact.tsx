import { Phone } from "lucide-react";

import { siteConfig } from "@/lib/config";

/**
 * Nút nổi: Zalo, Messenger và nút vàng "Gọi miễn phí". Máy tính nằm bên trái; điện thoại nằm bên phải và thu gọn
 * (Zalo đã có ở thanh tab dưới) để không che giá và nội dung ở bên trái.
 */
export function FloatingContact() {
  const circle = "flex size-10 md:size-11 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-neutral-200";
  return (
    <div className="fixed right-3 bottom-20 z-40 flex flex-col items-end gap-2.5 md:right-auto md:bottom-6 md:left-3 md:items-start">
      <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat Zalo" className={`${circle} hidden text-[11px] font-bold text-[#0068ff] md:flex`}>
        Zalo
      </a>
      <a href={siteConfig.messengerUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat Messenger" className={circle}>
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <defs>
            <linearGradient id="msg" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#0099ff" /><stop offset="1" stopColor="#a033ff" />
            </linearGradient>
          </defs>
          <path fill="url(#msg)" d="M12 2C6.4 2 2 6.1 2 11.6c0 2.9 1.2 5.4 3.2 7.1V22l3-1.7c1.2.3 2.4.5 3.8.5 5.6 0 10-4.1 10-9.2S17.6 2 12 2Zm1 12.4-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.5 5.8Z" />
        </svg>
      </a>
      <a href={`tel:${siteConfig.hotline}`} aria-label="Gọi hotline" className="flex items-center gap-2 rounded-full bg-brand-accent p-1.5 text-neutral-900 shadow-md md:pr-3.5">
        <span className="flex size-7 animate-pulse items-center justify-center rounded-full bg-white/25"><Phone className="size-4" /></span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-[10px] opacity-90">Gọi miễn phí</span>
          <span className="block text-sm font-bold">{siteConfig.hotline}</span>
        </span>
      </a>
    </div>
  );
}
