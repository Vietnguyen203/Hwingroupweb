import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto my-6 h-72 max-w-md animate-pulse rounded-2xl bg-neutral-200" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
