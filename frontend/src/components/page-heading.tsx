import { Band } from "@/components/ui/band";

/**
 * Đầu trang (danh mục, tìm kiếm, giỏ hàng, thanh toán...): dải kem vàng nhạt tràn trang, tiêu đề lớn bằng phông tiêu đề,
 * dòng phụ nhỏ bên dưới (`subtitle`, hoặc `count` thì hiện "N sản phẩm"). Cùng ngôn ngữ với các dải nền của trang chủ.
 */
export function PageHeading({ title, count, subtitle }: { title: string; count?: number; subtitle?: string }) {
  const sub = subtitle ?? (count != null ? `${count} món đang chờ bạn` : null);
  return (
    <Band tone="bg-brand-honey/20" className="mb-5 py-7 text-brand-deep md:py-10">
      <div className="px-3 md:px-0">
        <h1 className="font-display text-3xl leading-tight font-bold text-balance md:text-4xl">{title}</h1>
        {sub && <p className="mt-2 text-neutral-700">{sub}</p>}
      </div>
    </Band>
  );
}
