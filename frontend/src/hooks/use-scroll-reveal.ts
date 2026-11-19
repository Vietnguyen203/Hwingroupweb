"use client";

import { useCallback, useState } from "react";

export type RevealState = "visible" | "hidden" | "shown";

/**
 * Hiện dần khi cuộn tới: gắn `ref` vào khối và đặt `data-reveal={state}` (CSS .scroll-reveal trong globals.css lo hiệu ứng).
 * - HTML ban đầu luôn hiện đủ ("visible"): JS lỗi / chưa chạy thì nội dung không bị ẩn.
 * - Khối đã nằm trong màn hình lúc tải thì không làm gì (tránh nhấp nháy); khối ở dưới mới ẩn rồi hiện khi cuộn tới.
 * - Người dùng bật "giảm chuyển động" thì bỏ qua.
 */
export function useScrollReveal<T extends HTMLElement>() {
  const [state, setState] = useState<RevealState>("visible");

  const ref = useCallback((el: T | null) => {
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, state };
}
