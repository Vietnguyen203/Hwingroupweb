"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { platformLink, SHARE_PLATFORMS } from "@/lib/affiliate";
import { cn } from "@/lib/utils";

/**
 * Link riêng cho từng nền tảng (link chia sẻ + ?src=…): đăng đúng link ở đúng nơi thì trang Hiệu suất
 * tách được số click theo nền tảng.
 */
export function PlatformLinks({ shareLink }: { shareLink: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (src: string, link: string) =>
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(src);
        setTimeout(() => setCopied((c) => (c === src ? null : c)), 1500);
      })
      .catch(() => undefined);

  return (
    <>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHARE_PLATFORMS.map(({ src, label }) => {
          const link = platformLink(shareLink, src);
          const done = copied === src;
          return (
            <li key={src} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 ">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-gray-900">{label}</span>
                <button
                  type="button"
                  onClick={() => copy(src, link)}
                  aria-label={`Chép link ${label}`}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                    done ? "bg-green-50 text-green-700" : "bg-brand-soft text-brand hover:bg-brand hover:text-white",
                  )}
                >
                  {done ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
                  {done ? "Đã chép" : "Chép"}
                </button>
              </div>
              <p className="truncate text-xs text-gray-500" title={link}>
                {link}
              </p>
            </li>
          );
        })}
      </ul>
      <span role="status" className="sr-only">
        {copied ? "Đã chép link" : ""}
      </span>
    </>
  );
}
