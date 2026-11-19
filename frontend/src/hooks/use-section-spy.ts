"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Mục "đang đọc" là mục cuối cùng (theo thứ tự trang) có phần đầu chạm dải này: từ ngay dưới thanh dính tới 35% chiều cao màn hình. */
const READING_BAND_BOTTOM = "-65%";
/** Sau khi bấm nhảy tới mục, bỏ qua IntersectionObserver trong lúc trang đang cuộn (tránh tab nhấp nháy qua các mục đi ngang). */
const JUMP_LOCK_MS = 1500;
/** Khoảng hở (px) giữa thanh dính và đầu mục sau khi nhảy tới. */
const JUMP_GAP = 8;

/**
 * Theo dõi các mục (theo id) trên trang:
 * - present: id nào đang có thật trong DOM (mục có điều kiện như Combo có thể không có; mục về trễ do streaming sẽ tự được thêm vào).
 * - active: mục đang được xem, tính bằng IntersectionObserver.
 * - jump(id): cuộn mượt tới mục (tôn trọng "giảm chuyển động") và đặt active ngay. Vị trí cuộn do JS tự tính từ chiều cao
 *   thanh dính đo trực tiếp lúc bấm (không dựa vào CSS scroll-margin) để tiêu đề của mục luôn nằm dưới thanh, không bị che.
 *
 * `ids` phải là mảng cố định (hằng số ở module); `topOffset` là chiều cao các thanh dính phía trên (px) dùng cho dải "đang đọc";
 * `measureTopOffset` đo lại đúng chiều cao đó ngay lúc bấm.
 * `alwaysPresent`: id chắc chắn có – hiện ngay từ lần render đầu (khớp HTML server); id còn lại chỉ hiện khi tìm thấy trong DOM.
 */
export function useSectionSpy(
  ids: readonly string[],
  alwaysPresent: readonly string[],
  topOffset: number,
  measureTopOffset: () => number,
) {
  const [present, setPresent] = useState<readonly string[]>(alwaysPresent);
  const [active, setActive] = useState<string | null>(null);
  const lockUntil = useRef(0);

  // 1) Quét xem mục nào có trong DOM; DOM đổi (streaming, mục có điều kiện) thì quét lại.
  useEffect(() => {
    const scan = () => {
      const found = ids.filter((id) => document.getElementById(id));
      setPresent((prev) => (prev.length === found.length && prev.every((v, i) => v === found[i]) ? prev : found));
    };
    const first = requestAnimationFrame(scan);
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(first);
      mo.disconnect();
    };
  }, [ids]);

  // 2) Mục nào đang nằm trong dải "đang đọc" thì là active.
  useEffect(() => {
    const els = present.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id);
          else inBand.delete(e.target.id);
        }
        if (performance.now() < lockUntil.current) return;
        const last = [...present].reverse().find((id) => inBand.has(id));
        if (last) setActive(last);
        // Không mục nào trong dải: đang ở phía trên mục đầu tiên (banner…) thì bỏ chọn, còn lại giữ mục cũ
        else if (els[0].getBoundingClientRect().top > window.innerHeight * 0.35) setActive(null);
      },
      { rootMargin: `-${topOffset + 8}px 0px ${READING_BAND_BOTTOM} 0px`, threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [present, topOffset]);

  const jump = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Đầu mục nằm ngay dưới thanh dính (+ JUMP_GAP); phần đệm của tiêu đề mục làm tiêu đề hiện rõ bên dưới
      const targetTop = () => el.getBoundingClientRect().top + window.scrollY - measureTopOffset() - JUMP_GAP;

      lockUntil.current = performance.now() + JUMP_LOCK_MS;
      setActive(id);
      window.scrollTo({ top: targetTop(), behavior: reduced ? "auto" : "smooth" });
      // Cuộn xong thì mở khóa sớm (trình duyệt hỗ trợ scrollend; nếu không thì hết JUMP_LOCK_MS tự mở)
      // và nếu bố cục đổi giữa chừng (ảnh tải xong…) làm lệch thì cuộn bù một lần.
      window.addEventListener(
        "scrollend",
        () => {
          lockUntil.current = 0;
          if (Math.abs(targetTop() - window.scrollY) > 3) window.scrollTo({ top: targetTop(), behavior: "auto" });
        },
        { once: true },
      );
    },
    [measureTopOffset],
  );

  return { present, active, jump };
}
