"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { SmartImg } from "@/components/ui/smart-img";
import { formatVnd } from "@/lib/format";
import type { PageResponse, ProductCardResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const MIN_CHARS = 2; // gõ từ 2 ký tự mới gợi ý
const DEBOUNCE_MS = 250;
const LIMIT = 6;

type Status = "idle" | "loading" | "done" | "error";

/**
 * Ô tìm kiếm ở header kèm gợi ý sản phẩm khi gõ (combobox):
 * - Vẫn là form GET /search?q= nên Enter / nút "Tìm kiếm" hoạt động cả khi chưa có JS.
 * - Gợi ý lấy từ GET /api/products?q=&page_size=6 (tìm không dấu), chờ 250ms sau lần gõ cuối, hủy lời gọi cũ.
 * - Bàn phím: ↑ ↓ chọn, Enter mở mục đang chọn (không chọn gì thì tìm theo từ khóa), Esc đóng.
 */
export function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLFormElement>(null);
  const cache = useRef(new Map<string, ProductCardResponse[]>());

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ProductCardResponse[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [active, setActive] = useState(-1);

  const q = value.trim();
  const ready = q.length >= MIN_CHARS;
  const showList = open && ready;
  // Mục thứ items.length là dòng "Xem tất cả kết quả"
  const total = items.length + 1;
  const searchHref = `/search?q=${encodeURIComponent(q)}`;
  const hrefAt = (i: number) => (i < items.length ? `/products/${items[i].slug}` : searchHref);

  // Lấy gợi ý sau khi ngừng gõ; lời gọi cũ bị hủy khi gõ tiếp
  useEffect(() => {
    if (q.length < MIN_CHARS) return;
    const key = q.toLowerCase();
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      const cached = cache.current.get(key);
      if (cached) {
        setItems(cached);
        setStatus("done");
        setActive(-1);
        return;
      }
      setStatus("loading");
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&page_size=${LIMIT}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const page = (await res.json()) as PageResponse<ProductCardResponse>;
        cache.current.set(key, page.content);
        setItems(page.content);
        setStatus("done");
        setActive(-1);
      } catch {
        if (!ctrl.signal.aborted) setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  // Bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && ready && items.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % total : (a - 1 + total) % total));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(hrefAt(active));
    }
  };

  return (
    <form
      ref={wrapRef}
      action="/search"
      method="get"
      role="search"
      onSubmit={() => setOpen(false)}
      // Không `relative` trên mobile: khung gợi ý bám theo cả thanh header (ô tìm kiếm ở đó rất hẹp khi đã đăng nhập)
      className="mx-2 min-w-0 max-w-xl flex-1 sm:relative lg:max-w-2xl"
    >
      <label className="flex h-11 items-center overflow-hidden rounded-full border-2 border-brand bg-white pr-0 pl-4 shadow-2xs transition focus-within:border-brand-dark focus-within:shadow-[0_0_0_4px_rgb(108_59_255/0.12)]">
        <input
          name="q"
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Tìm sản phẩm: nem chua, tôm khô, thịt gác bếp, lạp xưởng..."
          maxLength={100}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="flex h-full shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark active:scale-95 sm:px-6"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Tìm kiếm</span>
        </button>
      </label>

      {showList && (
        <div className="absolute inset-x-2 top-full z-50 mt-1 overflow-hidden rounded-2xl sm:inset-x-0 sm:mt-2 bg-white text-left shadow-2xl ring-1 shadow-black/10 ring-black/[0.06]">
          <ul id={listId} role="listbox" aria-label="Gợi ý sản phẩm">
            {items.map((p, i) => (
              <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
                <Link
                  href={`/products/${p.slug}`}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex items-center gap-3 px-3 py-2 transition-colors", active === i ? "bg-brand-soft" : "hover:bg-neutral-50")}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {p.imageUrl && <SmartImg src={p.imageUrl} className="absolute inset-0 size-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold text-neutral-900">{p.name}</span>
                    <span className="text-xs text-neutral-500">
                      <strong className="font-bold text-brand-red">{formatVnd(p.price)}</strong>
                      {p.unit ? ` / ${p.unit}` : ""}
                      {!p.inStock && <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 font-semibold text-neutral-600">Hết hàng</span>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}

            {status === "done" && items.length === 0 && (
              <li role="presentation" className="px-4 py-3 text-sm text-neutral-500">
                Không có sản phẩm nào khớp “{q}”.
              </li>
            )}
            {status === "error" && (
              <li role="presentation" className="px-4 py-3 text-sm text-neutral-500">
                Chưa tải được gợi ý. Nhấn Enter để tìm “{q}”.
              </li>
            )}
            {status === "loading" && items.length === 0 && (
              <li role="presentation" className="space-y-2 px-3 py-3" aria-busy="true">
                {[0, 1].map((n) => (
                  <span key={n} className="block h-11 animate-pulse rounded-lg bg-neutral-100" />
                ))}
              </li>
            )}

            <li id={`${listId}-${items.length}`} role="option" aria-selected={active === items.length} className="border-t border-neutral-100">
              <Link
                href={searchHref}
                prefetch={false}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActive(items.length)}
                className={cn(
                  "flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-bold text-brand transition-colors",
                  active === items.length ? "bg-brand-soft" : "hover:bg-neutral-50",
                )}
              >
                <span className="line-clamp-1">Xem tất cả kết quả cho “{q}”</span>
                <ArrowRight aria-hidden className="size-4 shrink-0" />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </form>
  );
}
