import type { Metadata } from "next";

import { RegisterAffiliateForm } from "@/components/affiliate/register-affiliate-form";

export const metadata: Metadata = { title: "Đăng ký cộng tác viên", robots: { index: false } };

export default function RegisterAffiliatePage() {
  return <RegisterAffiliateForm />;
}
