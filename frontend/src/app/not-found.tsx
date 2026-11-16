import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-20 text-center">
      <p className="text-5xl font-extrabold text-brand">404</p>
      <p className="mt-2 text-muted-foreground">Không tìm thấy trang hoặc sản phẩm bạn cần.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 font-semibold text-white">
        Về trang chủ
      </Link>
    </div>
  );
}
