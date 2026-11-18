"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useMyId } from "@/hooks/use-my-id";

const NO_SLUGS: readonly string[] = [];

type Props = {
  /** Phần đường dẫn trước id, ví dụ "/account" hoặc "/affiliate". */
  base: string;
  /** Các mục hợp lệ của link cũ không có id (/affiliate/links …) – được chèn id vào giữa. */
  slugs?: readonly string[];
  /** Mục mặc định khi URL chỉ có id (/affiliate/<id>); bỏ trống nếu trang id là trang đích (như /account/<id>). */
  fallbackTail?: string;
};

/**
 * Giữ id tài khoản trên URL luôn là id của CHÍNH người đang đăng nhập: dữ liệu vẫn lấy theo phiên đăng nhập,
 * id trên URL chỉ để hiển thị. Link không có id (/account, /affiliate/links) hoặc id của người khác sẽ được
 * chuyển sang id của mình, giữ nguyên phần đuôi và query. Không render gì.
 */
export function OwnIdRedirect({ base, slugs = NO_SLUGS, fallbackTail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const mine = useMyId();

  useEffect(() => {
    if (!mine) return;
    const [first, ...others] = pathname.slice(base.length).split("/").filter(Boolean);

    let tail: string[];
    if (first && slugs.includes(first)) tail = [first, ...others]; // link cũ không có id
    else if (first?.toLowerCase() === mine.toLowerCase()) {
      if (others.length > 0 || !fallbackTail) return; // đã đúng id
      tail = [fallbackTail];
    } else {
      tail = others.length > 0 ? others : fallbackTail ? [fallbackTail] : []; // id của người khác / chưa có id
    }
    router.replace(`${base}/${[mine, ...tail].join("/")}${window.location.search}`);
  }, [mine, pathname, base, slugs, fallbackTail, router]);

  return null;
}
