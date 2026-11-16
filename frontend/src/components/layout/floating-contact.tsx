import { MessageCircle, Phone } from "lucide-react";

import { siteConfig } from "@/lib/config";

/** Nút nổi góc phải: Zalo, Messenger, Gọi. */
export function FloatingContact() {
  const item = "flex size-12 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white/60";
  return (
    <div className="fixed right-3 bottom-4 z-50 flex flex-col gap-3">
      <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat Zalo"
         className={`${item} bg-[#0068ff] text-xs font-bold`}>
        Zalo
      </a>
      <a href={siteConfig.messengerUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat Messenger"
         className={`${item} bg-gradient-to-br from-[#00b2ff] to-[#a033ff]`}>
        <MessageCircle className="size-6" />
      </a>
      <a href={`tel:${siteConfig.hotline}`} aria-label="Gọi hotline"
         className={`${item} animate-pulse bg-green-600`}>
        <Phone className="size-6" />
      </a>
    </div>
  );
}
