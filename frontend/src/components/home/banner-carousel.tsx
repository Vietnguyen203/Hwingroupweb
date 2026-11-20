"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { PriceTag } from "@/components/ui/price-tag";
import type { ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BannerSlide = { product: ProductCardResponse; tag: "Mới" | "Bán chạy" };

const INTERVAL_MS = 4500;
/** Nền dự phòng (theo bảng màu thương hiệu) khi sản phẩm chưa có ảnh; mỗi slide một màu để các banner liền nhau dễ phân biệt. */
const BACKGROUNDS = ["bg-brand-deep", "bg-brand-red", "bg-[#12805a]", "bg-brand-dark", "bg-[#352a8a]"];

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * Banner chạy: tối đa 5 sản phẩm (mới + bán chạy). Ảnh sản phẩm phủ kín khung, tiêu đề cỡ rất lớn nằm đè lên ảnh
 * ở góc dưới trái, tem giá đỏ nghiêng ở góc dưới phải. Tự chuyển mỗi 4,5 giây; dừng khi rê chuột / đang focus trong banner,
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
      <div className="overflow-hidden rounded-2xl mx-3 md:mx-0">
        <div className="flex transition-transform duration-700 ease-out-expo" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map(({ product: p, tag }, i) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              aria-label={p.name}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
              className={cn(
                "group/slide relative isolate flex h-[26rem] w-full shrink-0 items-end overflow-hidden text-white md:h-[30rem]",
                BACKGROUNDS[i % BACKGROUNDS.length],
              )}
            >
              {/* Ảnh sản phẩm phủ kín khung; lớp tối dần từ dưới lên và từ trái sang để tiêu đề đè lên ảnh vẫn đọc được */}
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend
                <img src={p.imageUrl} alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover transition duration-1000 ease-out-expo group-hover/slide:scale-105" />
              )}
              <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/5 md:bg-gradient-to-r md:from-black/75 md:via-black/30 md:to-transparent" />

              <div className="flex w-full flex-col items-start gap-4 p-5 sm:p-8 md:flex-row md:items-end md:justify-between md:p-14">
                <div className="min-w-0 md:max-w-[60%]">
                  <p className="inline-block border-l-4 border-brand-honey pl-2.5 text-sm font-semibold md:text-base">
                    {tag === "Mới" ? "Sản phẩm mới" : "Bán chạy nhất"}
                  </p>
                  {/* line-clamp cắt phần tràn nên cần giãn dòng + đệm trên/dưới để dấu tiếng Việt (ế, ộ, ữ…) không bị cắt; text-balance chia đều dòng */}
                  <h2 className="mt-3 line-clamp-3 py-1 font-display text-[2rem] leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl md:text-7xl md:leading-[1.04]">
                    {p.name}
                  </h2>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-deep transition duration-300 group-hover/slide:gap-3 md:mt-6 md:px-7 md:py-3 md:text-base">
                    Xem chi tiết <ArrowRight className="size-4" />
                  </span>
                </div>
                <PriceTag price={p.price} compareAt={p.compareAtPrice} unit={p.unit} size="lg" className="absolute top-5 right-5 -rotate-6 transition duration-500 ease-out-expo group-hover/slide:-rotate-3 md:static" />
              </div>
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
