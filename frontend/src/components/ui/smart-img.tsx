"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Ảnh tải mượt: ảnh chưa tải xong thì trong suốt (nền có hiệu ứng lấp lánh của khung chứa hiện ra), tải xong thì hiện dần.
 * Ảnh đã có sẵn trong bộ nhớ đệm hiện ngay; HTML ban đầu (SSR) luôn hiện ảnh nên không bao giờ bị ẩn nếu JS chưa chạy.
 */
export function SmartImg({ className, onLoad, onError, alt = "", ...props }: React.ComponentProps<"img">) {
  const [pending, setPending] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm từ backend / thư mục public
    <img
      ref={(el) => {
        if (el && !el.complete) setPending(true);
      }}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={(e) => {
        setPending(false);
        onLoad?.(e);
      }}
      onError={(e) => {
        setPending(false);
        onError?.(e);
      }}
      className={cn("transition-opacity duration-500", pending ? "opacity-0" : "opacity-100", className)}
      {...props}
    />
  );
}
