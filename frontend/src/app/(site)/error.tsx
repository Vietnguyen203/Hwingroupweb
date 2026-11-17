"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { CloudOff } from "lucide-react";

import { EmptyState, emptyStateButton } from "@/components/ui/empty-state";

/** Lỗi bất ngờ khi tải trang (VD backend không phản hồi): giữ nguyên header / footer, cho thử lại. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <EmptyState
      icon={CloudOff}
      title="Chưa tải được trang"
      description="Có lỗi khi lấy dữ liệu. Bạn thử lại sau vài giây nhé; nếu vẫn lỗi, hãy gọi hotline để được hỗ trợ."
      actions={
        <>
          {/* Lỗi nằm ở dữ liệu phía server nên phải tải lại dữ liệu (refresh) rồi mới vẽ lại */}
          <button type="button" onClick={() => startTransition(() => { router.refresh(); reset(); })} className={emptyStateButton.primary}>Thử lại</button>
          <Link href="/" className={emptyStateButton.secondary}>Về trang chủ</Link>
        </>
      }
    />
  );
}
