import { siteConfig } from "@/lib/config";

/** Biểu tượng thương hiệu (vẽ lại đơn giản, đủ nhận diện). */
const ICONS = {
  facebook: (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M13.4 19.5v-6h2l.3-2.4h-2.3V9.6c0-.7.2-1.2 1.2-1.2h1.2V6.3a16 16 0 0 0-1.8-.1c-1.8 0-3 1.1-3 3.1v1.8h-2v2.4h2v6Z" fill="#fff" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="5" fill="#000" />
      <path d="M15.6 5.5c.3 1.5 1.3 2.6 2.9 2.8v2.2a5 5 0 0 1-2.9-.9v4.6a4.2 4.2 0 1 1-4.2-4.2h.5v2.3a1.9 1.9 0 1 0 1.4 1.9V5.5Z" fill="#25F4EE" transform="translate(-.6 -.4)" />
      <path d="M15.6 5.5c.3 1.5 1.3 2.6 2.9 2.8v2.2a5 5 0 0 1-2.9-.9v4.6a4.2 4.2 0 1 1-4.2-4.2h.5v2.3a1.9 1.9 0 1 0 1.4 1.9V5.5Z" fill="#FE2C55" transform="translate(.6 .4)" />
      <path d="M15.6 5.5c.3 1.5 1.3 2.6 2.9 2.8v2.2a5 5 0 0 1-2.9-.9v4.6a4.2 4.2 0 1 1-4.2-4.2h.5v2.3a1.9 1.9 0 1 0 1.4 1.9V5.5Z" fill="#fff" />
    </svg>
  ),
  shopee: (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path d="M4 7.5h16l-1.2 13a1.5 1.5 0 0 1-1.5 1.4H6.7a1.5 1.5 0 0 1-1.5-1.4Z" fill="#EE4D2D" />
      <path d="M8.5 7.5V6a3.5 3.5 0 0 1 7 0v1.5" fill="none" stroke="#EE4D2D" strokeWidth="1.6" />
      <path d="M14.3 11.3c-.6-.5-1.4-.8-2.2-.8-1 0-1.8.6-1.8 1.4 0 1.8 4 1.2 4 3.4 0 1-.9 1.8-2.2 1.8-.9 0-1.8-.3-2.4-.9" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect x="1" y="4.5" width="22" height="15" rx="4" fill="#FF0000" />
      <path d="M10 8.8v6.4l5.5-3.2Z" fill="#fff" />
    </svg>
  ),
};

const LINKS: [keyof typeof ICONS, string, string][] = [
  ["facebook", "Facebook", siteConfig.social.facebook],
  ["tiktok", "Tiktok", siteConfig.social.tiktok],
  ["shopee", "Shopee", siteConfig.social.shopee],
  ["youtube", "Youtube", siteConfig.social.youtube],
];

/** Nút mạng xã hội ở footer (nền trắng, theo mẫu hwingroup.com). */
export function SocialLinks() {
  return (
    <div className="grid max-w-xs grid-cols-2 gap-2.5">
      {LINKS.map(([key, label, href]) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 font-semibold text-brand transition hover:shadow-md">
          {ICONS[key]} {label}
        </a>
      ))}
    </div>
  );
}
