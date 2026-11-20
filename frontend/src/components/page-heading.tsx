import { Band } from "@/components/ui/band";

/**
 * Đầu trang (danh mục, tìm kiếm, giỏ hàng, thanh toán...): dải tím đêm tràn trang, tiêu đề lớn bằng phông tiêu đề,
 * dòng phụ nhỏ bên dưới (`subtitle`, hoặc `count` thì hiện "N sản phẩm"). Cùng ngôn ngữ với các dải nền của trang chủ.
 */
export function PageHeading({ title, count, subtitle }: { title: string; count?: number; subtitle?: string }) {
  const sub = subtitle ?? (count != null ? `${count} sản phẩm` : null);
  return (
    <Band tone="bg-brand-deep" className="mb-5 py-7 text-white md:py-10">
      <div className="px-3 md:px-0">
        <h1 className="font-display text-3xl leading-tight font-extrabold text-balance md:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-white/75">{sub}</p>}
      </div>
    </Band>
  );
}
