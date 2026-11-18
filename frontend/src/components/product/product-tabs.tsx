"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { ProductReviews } from "./product-reviews";

type Section = { key: string; label: string; content: React.ReactNode };

/**
 * Nội dung chi tiết dạng tab: Chi tiết sản phẩm · Thành phần · Đặc điểm · Hướng dẫn sử dụng & bảo quản · Đánh giá.
 * Tab không có nội dung thì ẩn; "Đánh giá" luôn có.
 */
export function ProductTabs({ productId, description, ingredients, features, usage, storage, reviewCount }: {
  productId: string;
  description: string | null;
  ingredients: string | null;
  features: string | null;
  usage: string | null;
  storage: string | null;
  reviewCount: number;
}) {
  const text = (s: string) => <p className="text-sm leading-7 whitespace-pre-line">{s}</p>;
  const sections: Section[] = [
    description && { key: "detail", label: "Chi tiết sản phẩm", content: text(description) },
    ingredients && { key: "ingredients", label: "Thành phần", content: text(ingredients) },
    features && { key: "features", label: "Đặc điểm", content: text(features) },
    (usage || storage) && {
      key: "usage",
      label: "Hướng dẫn sử dụng & bảo quản",
      content: (
        <div className="space-y-4">
          {usage && <div><h3 className="mb-1 font-semibold">Hướng dẫn sử dụng</h3>{text(usage)}</div>}
          {storage && <div><h3 className="mb-1 font-semibold">Bảo quản</h3>{text(storage)}</div>}
        </div>
      ),
    },
    { key: "reviews", label: `Đánh giá (${reviewCount})`, content: <ProductReviews productId={productId} /> },
  ].filter(Boolean) as Section[];

  const [active, setActive] = useState(sections[0].key);
  const current = sections.find((s) => s.key === active) ?? sections[0];

  return (
    <section id="chi-tiet" className="mt-6 rounded-3xl bg-white shadow-card ring-1 ring-black/[0.04]">
      <div role="tablist" className="no-scrollbar flex overflow-x-auto border-b">
        {sections.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={s.key === current.key}
            onClick={() => setActive(s.key)}
            className={cn("shrink-0 border-b-[3px] px-4 py-4 text-sm font-bold whitespace-nowrap transition md:px-6 md:text-base",
              s.key === current.key ? "border-brand text-brand" : "border-transparent text-neutral-600 hover:text-brand")}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="p-4 md:p-6">{current.content}</div>
    </section>
  );
}
