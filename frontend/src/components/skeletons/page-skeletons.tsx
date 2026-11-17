import { Skeleton } from "@/components/ui/skeleton";

const bone = "bg-neutral-200";

/** Skeleton trang sản phẩm: ảnh vuông + dải ảnh nhỏ bên trái, tiêu đề / giá / thông số / nút bên phải. */
export function ProductPageSkeleton() {
  return (
    <div className="pb-6" aria-busy="true" aria-label="Đang tải sản phẩm">
      <Skeleton className={`mx-3 my-3 h-4 w-64 md:mx-0 ${bone}`} />
      <div className="gap-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3 bg-white p-3 md:rounded-2xl md:p-5">
          <Skeleton className={`aspect-square w-full rounded-2xl ${bone}`} />
          <div className="flex gap-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className={`size-16 rounded-xl ${bone}`} />)}</div>
        </div>
        <div className="space-y-4 bg-white p-4 md:rounded-2xl md:p-6">
          <Skeleton className={`h-7 w-4/5 ${bone}`} />
          <Skeleton className={`h-4 w-1/2 ${bone}`} />
          <Skeleton className={`h-16 w-full rounded-xl ${bone}`} />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className={`h-4 w-3/4 ${bone}`} />)}
          <Skeleton className={`h-11 w-48 rounded-full ${bone}`} />
          <div className="flex gap-3"><Skeleton className={`h-12 flex-1 rounded-full ${bone}`} /><Skeleton className={`h-12 flex-1 rounded-full ${bone}`} /></div>
        </div>
      </div>
      <Skeleton className={`mx-3 mt-6 h-64 rounded-2xl md:mx-0 ${bone}`} />
    </div>
  );
}

/** Skeleton trang thanh toán: 3 khối bên trái + khối tóm tắt đơn bên phải. */
export function CheckoutSkeleton() {
  return (
    <div className="px-3 py-4 md:px-0 md:py-8" aria-busy="true" aria-label="Đang tải trang thanh toán">
      <Skeleton className={`mb-5 h-4 w-56 ${bone}`} />
      <Skeleton className={`mb-6 h-8 w-40 ${bone}`} />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Skeleton className={`h-56 rounded-2xl ${bone}`} />
          <Skeleton className={`h-40 rounded-2xl ${bone}`} />
          <Skeleton className={`h-44 rounded-2xl ${bone}`} />
        </div>
        <Skeleton className={`h-96 rounded-2xl ${bone}`} />
      </div>
    </div>
  );
}

/** Skeleton trang chi tiết đơn: thẻ đầu, thanh tiến trình, rồi hai cột. */
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 px-3 py-4 md:px-0 md:py-8" aria-busy="true" aria-label="Đang tải đơn hàng">
      <Skeleton className={`h-4 w-60 ${bone}`} />
      <Skeleton className={`h-24 rounded-2xl ${bone}`} />
      <Skeleton className={`h-20 rounded-2xl ${bone}`} />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4"><Skeleton className={`h-56 rounded-2xl ${bone}`} /><Skeleton className={`h-28 rounded-2xl ${bone}`} /></div>
        <Skeleton className={`h-64 rounded-2xl ${bone}`} />
      </div>
    </div>
  );
}
