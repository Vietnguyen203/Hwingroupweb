"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { formatVnd } from "@/lib/format";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BannerSlide = { product: ProductCardResponse; tag: "Mới" | "Bán chạy" };

const INTERVAL_MS = 3000;
/** Mỗi slide một dải màu riêng (theo bảng màu thương hiệu) để các banner liền nhau dễ phân biệt. */
const BACKGROUNDS = [
  "from-brand-deep via-brand-dark to-brand",
  "from-[#b42a05] via-brand-red to-brand-accent",
  "from-[#0b4f3a] via-[#12805a] to-brand-green",
  "from-[#3a1383] via-[#7a35e8] to-[#d946ef]",
  "from-[#1b1f3b] via-[#352a8a] to-brand",
];

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * Banner chạy: tối đa 5 sản phẩm (mới + bán chạy), tự chuyển mỗi 3 giây. Dừng khi rê chuột / đang focus trong banner,
 * không tự chạy nếu người dùng bật "giảm chuyển động". Bấm vào banner -> trang chi tiết sản phẩm.
 */
export function BannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const count = slides.length;
  const playing = !hovering && !reducedMotion && count > 1;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(t);
  }, [playing, count]);

  if (count === 0) return null;
  const go = (i: number) => setIndex((i + count) % count);
  const arrow = "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-deep shadow-lg backdrop-blur transition hover:scale-110 hover:bg-white md:flex";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Sản phẩm nổi bật"
      className="relative pt-3"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div className="overflow-hidden px-3 md:rounded-2xl md:px-0">
        <div className="flex transition-transform duration-700 ease-out-expo" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map(({ product: p, tag }, i) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              aria-label={p.name}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
              className={cn(
                "group/slide relative flex aspect-[16/9] w-full shrink-0 items-center overflow-hidden rounded-2xl bg-gradient-to-br text-white sm:aspect-[2/1] md:aspect-[12/5] md:rounded-none",
                BACKGROUNDS[i % BACKGROUNDS.length],
              )}
            >
              {/* Nền: chính ảnh sản phẩm làm mờ (phóng to để không lộ mép mờ), phủ lớp tối nhẹ ở bên chữ cho dễ đọc; dải màu bên dưới là dự phòng khi không có ảnh */}
              {p.imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend (cùng URL với ảnh chính nên chỉ tải một lần) */}
                  <img src={p.imageUrl} alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full scale-125 object-cover blur-2xl saturate-150" />
                  <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10" />
                </>
              )}
              {/* Vệt sáng trang trí */}

              <div className="relative z-10 w-[58%] space-y-1.5 pl-5 sm:pl-8 md:w-3/5 md:space-y-4 md:pl-16">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-white/25 backdrop-blur md:px-3.5 md:py-1 md:text-xs">
                  <span className="size-1.5 rounded-full bg-brand-accent" />
                  {tag === "Mới" ? "Sản phẩm mới" : "Bán chạy nhất"}
                </span>
                {/* Chữ hoa tiếng Việt hay chồng 2 dấu (Ề, Ố…): line-clamp cắt phần tràn nên cần giãn dòng + đệm trên/dưới để dấu không bị cắt */}
                <h2 className="line-clamp-2 py-1.5 text-lg leading-[1.3] font-black tracking-tight drop-shadow-sm sm:text-2xl md:py-2 md:text-5xl md:leading-[1.25]">{p.name}</h2>
                <p className="flex items-baseline gap-2 md:gap-3">
                  <span className="text-xl font-black text-[#ffd400] md:text-4xl">{formatVnd(p.price)}</span>
                  {p.compareAtPrice != null && p.compareAtPrice > p.price && (
                    <span className="hidden text-xs text-white/70 line-through sm:inline md:text-lg">{formatVnd(p.compareAtPrice)}</span>
                  )}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-brand-deep shadow-lg transition duration-300 group-hover/slide:gap-3 md:mt-2 md:px-7 md:py-3 md:text-base">
                  Xem chi tiết <ArrowRight className="size-3.5 md:size-4" />
                </span>
              </div>

              {/* Ảnh chính luôn nằm giữa banner theo chiều dọc. Căn giữa bằng khung flex, KHÔNG dùng -translate-y-1/2:
                  Tailwind 4 dịch bằng thuộc tính `translate`, dễ bị thuộc tính `translate` khác ghi đè làm ảnh lệch. */}
              {p.imageUrl && (
                <div className="pointer-events-none absolute inset-y-0 right-[4%] flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend */}
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="aspect-square h-[78%] shrink-0 rotate-2 rounded-2xl object-cover shadow-2xl ring-4 ring-white/25 transition duration-700 ease-out-expo group-hover/slide:rotate-0 group-hover/slide:scale-105 md:h-[85%]"
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Banner trước" onClick={() => go(index - 1)} className={cn(arrow, "left-4")}>
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label="Banner sau" onClick={() => go(index + 1)} className={cn(arrow, "right-4")}>
            <ChevronRight className="size-5" />
          </button>
          <div className="mt-3 flex items-center justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.product.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn("h-2 rounded-full transition-all duration-300", i === index ? "w-7 bg-brand" : "w-2 bg-neutral-300 hover:bg-neutral-400")}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
