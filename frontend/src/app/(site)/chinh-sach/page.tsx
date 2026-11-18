import { Suspense } from "react";
import type { Metadata } from "next";

import { PolicyHubView } from "@/components/policy/policy-hub-view";

export const metadata: Metadata = {
  title: "Chính sách pháp lý & Hồ sơ Chứng nhận VSATTP | HWIN Food",
  description:
    "Hồ sơ pháp lý, giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm, tiêu chuẩn ISO 22000, HACCP và các chính sách bảo mật, đổi trả, kiểm hàng của Hwin Food.",
};

export default function PolicyPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl p-8 animate-pulse text-center">Đang tải trang chính sách...</div>}>
      <PolicyHubView />
    </Suspense>
  );
}
