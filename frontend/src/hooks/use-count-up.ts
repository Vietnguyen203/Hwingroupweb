"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Số chạy từ giá trị đang hiển thị tới `target` (giảm tốc cuối). Giảm chuyển động -> nhảy thẳng tới đích.
 * Giá trị trung gian là số thực: nơi dùng tự làm tròn khi định dạng.
 */
export function useCountUp(target: number, duration = 900): number {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const total = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    const origin = from.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = total > 0 ? Math.min((now - start) / total, 1) : 1;
      const value = origin + (target - origin) * (1 - Math.pow(1 - t, 4));
      from.current = value;
      setShown(value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return shown;
}
