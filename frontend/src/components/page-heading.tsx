import { Band } from "@/components/ui/band";

/**
 * Đầu trang danh sách (danh mục, tìm kiếm): dải tím đêm tràn trang, tiêu đề lớn bằng phông tiêu đề, số sản phẩm nhỏ bên dưới.
 * Cùng ngôn ngữ với các dải nền của trang chủ.
 */
export function PageHeading({ title, count }: { title: string; count: number }) {
  return (
    <Band tone="bg-brand-deep" className="mb-5 py-7 text-white md:py-10">
      <div className="px-3 md:px-0">
        <h1 className="font-display text-3xl leading-tight font-extrabold text-balance md:text-5xl">{title}</h1>
        <p className="mt-2 text-white/75">{count} sản phẩm</p>
      </div>
    </Band>
  );
}
