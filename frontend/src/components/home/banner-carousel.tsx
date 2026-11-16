"use client";

import { useEffect, useRef, useState } from "react";

const BANNERS = [
  { src: "/sample/banners/banner-1.svg", alt: "Đặc sản chế biến sẵn – giao nhanh giữ lạnh", href: "/c/cha-gio" },
  { src: "/sample/banners/banner-2.svg", alt: "Combo Tết sum vầy – tiết kiệm", href: "/p/combo-tet-sum-vay" },
  { src: "/sample/banners/banner-3.svg", alt: "Đổi trả trong 7 ngày", href: "/search" },
];

/** Banner chạy tự động (scroll-snap, vuốt được trên điện thoại). */
export function BannerCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % BANNERS.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative px-3 pt-3">
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-xl"
      >
        {BANNERS.map((b) => (
          <a key={b.src} href={b.href} className="aspect-[12/5] w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.src} alt={b.alt} className="size-full object-cover" />
          </a>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((b, i) => (
          <span key={b.src} className={`h-1.5 rounded-full bg-white transition-all ${i === index ? "w-4" : "w-1.5 opacity-60"}`} />
        ))}
      </div>
    </div>
  );
}
