import { cn } from "@/lib/utils";

/**
 * Dải nền tràn hết bề ngang trang cho một khối của trang chủ, nội dung vẫn nằm trong cột chính.
 * `tone` là class nền (VD "bg-white"); nền nằm sau nội dung (-z-10 trong khối isolate). Cần `overflow-x: clip` ở body (globals.css).
 */
export function Band({ id, tone, className, children }: { id?: string; tone?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("relative isolate", id && "scroll-mt-sticky", className)}>
      {tone && <span aria-hidden className={cn("absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2", tone)} />}
      {children}
    </section>
  );
}
