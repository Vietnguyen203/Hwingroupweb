"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatVnd } from "@/lib/format";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BannerSlide = { product: ProductCardResponse; tag: "Mới" | "Bán chạy" };

const INTERVAL_MS = 3000;
const BACKGROUNDS = [
  "from-[#243c84] to-[#3b5fc4]",
  "from-[#e5322d] to-[#ff7a00]",
  "from-[#0f766e] to-[#2fa84f]",
  "from-[#7c3aed] to-[#c026d3]",
  "from-[#b45309] to-[#f59e0b]",
];

/**
 * Banner chạy: tối đa 5 sản phẩm (mới + bán chạy), tự chuyển mỗi 3 giây, dừng khi rê chuột.
 * Bấm vào banner -> trang chi tiết sản phẩm.
 */
export function BannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, count]);

  if (count === 0) return null;
  const go = (i: number) => setIndex((i + count) % count);

  return (
    <div className="relative pt-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden px-3 md:rounded-2xl md:px-0">
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map(({ product: p, tag }, i) => (
            <Link key={p.id} href={`/products/${p.slug}`} aria-label={p.name}
                  className={cn("relative flex aspect-[12/5] w-full shrink-0 items-center overflow-hidden rounded-2xl bg-gradient-to-r text-white md:rounded-none",
                    BACKGROUNDS[i % BACKGROUNDS.length])}>
              <div className="z-10 w-3/5 space-y-1.5 pl-5 md:space-y-3 md:pl-14">
                <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase md:px-3 md:py-1 md:text-xs">
                  {tag === "Mới" ? "Sản phẩm mới" : "Bán chạy nhất"}
                </span>
                <h2 className="line-clamp-2 text-lg leading-tight font-black uppercase md:text-5xl">{p.name}</h2>
                <p className="flex items-baseline gap-2 md:gap-3">
                  <span className="text-xl font-black text-[#ffd400] md:text-4xl">{formatVnd(p.price)}</span>
                  {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                    <span className="text-xs text-white/70 line-through md:text-lg">{formatVnd(p.compareAtPrice)}</span>
                  )}
                </p>
                <span className="mt-1 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold text-brand shadow md:mt-3 md:px-7 md:py-3 md:text-base">
                  Xem chi tiết ›
                </span>
              </div>
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="absolute top-1/2 right-[4%] aspect-square h-[85%] -translate-y-1/2 rounded-3xl object-cover shadow-2xl" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Banner trước" onClick={() => go(index - 1)}
                  className="absolute top-1/2 left-3 hidden size-10 items-center justify-center rounded-full bg-white/80 text-brand shadow hover:bg-white md:flex">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label="Banner sau" onClick={() => go(index + 1)}
                  className="absolute top-1/2 right-3 hidden size-10 items-center justify-center rounded-full bg-white/80 text-brand shadow hover:bg-white md:flex">
            <ChevronRight className="size-5" />
          </button>
          <div className="mt-2 flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button key={s.product.id} type="button" aria-label={`Banner ${i + 1}`} onClick={() => go(i)}
                      className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-brand-link" : "w-1.5 bg-neutral-300")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
