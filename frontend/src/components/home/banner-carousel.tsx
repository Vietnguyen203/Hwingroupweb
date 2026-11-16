"use client";

import { useEffect, useRef, useState } from "react";

const BANNERS = [
  { src: "/sample/banners/banner-1.svg", alt: "Đặc sản chế biến sẵn – giao nhanh giữ lạnh", href: "/c/cha-gio" },
  { src: "/sample/banners/banner-2.svg", alt: "Combo Tết sum vầy – tiết kiệm", href: "/p/combo-tet-sum-vay" },
  { src: "/sample/banners/banner-3.svg", alt: "Đổi trả trong 7 ngày", href: "/search" },
];

/** Banner chạy tự động, bo tròn, lộ một phần banner kế bên (vuốt được trên điện thoại). */
export function BannerCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (i: number) => {
    const el = ref.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    if (el && slide) el.scrollTo({ left: slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2, behavior: "smooth" });
  };

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => {
      const next = (i + 1) % BANNERS.length;
      go(next);
      return next;
    }), 4500);
    return () => clearInterval(timer);
  }, []);

  const onScroll = (el: HTMLDivElement) => {
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    Array.from(el.children).forEach((c, i) => {
      const s = c as HTMLElement;
      if (Math.abs(s.offsetLeft + s.clientWidth / 2 - center) < Math.abs((el.children[best] as HTMLElement).offsetLeft + (el.children[best] as HTMLElement).clientWidth / 2 - center)) best = i;
    });
    setIndex(best);
  };

  return (
    <div className="pt-3">
      <div
        ref={ref}
        onScroll={(e) => onScroll(e.currentTarget)}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-[4%] md:px-0"
      >
        {BANNERS.map((b) => (
          <a key={b.src} href={b.href} className="aspect-[12/5] w-[92%] shrink-0 snap-center overflow-hidden rounded-2xl md:w-full md:rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.src} alt={b.alt} className="size-full object-cover" />
          </a>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {BANNERS.map((b, i) => (
          <button key={b.src} aria-label={`Banner ${i + 1}`} onClick={() => { setIndex(i); go(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-brand-link" : "w-1.5 bg-neutral-300"}`} />
        ))}
      </div>
    </div>
  );
}
