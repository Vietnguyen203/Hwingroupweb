import { cn } from "@/lib/utils";

/**
 * Khối nội dung của cổng CTV. Trước đây hiện dần + trượt lên khi vào trang; nay hiển thị ngay (hiệu ứng vào trang ở mọi khối
 * là kiểu mặc định của trang tạo sẵn). Giữ nguyên chữ ký (`delay` không còn tác dụng) để các nơi dùng không phải đổi.
 */
export function Reveal({ className, children }: { delay?: number; className?: string; children: React.ReactNode }) {
  return <div className={cn(className)}>{children}</div>;
}
