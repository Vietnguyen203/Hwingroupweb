"use client";

import Link from "next/link";

import { useMyId } from "@/hooks/use-my-id";
import { portalPath, type PortalSlug } from "@/lib/portal-path";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & { slug: PortalSlug; search?: string };

/** Link tới một mục của cổng CTV, tự gắn id tài khoản vào URL (/affiliate/<id>/<mục>). */
export function PortalLink({ slug, search, ...props }: Props) {
  const id = useMyId();
  return <Link href={portalPath(slug, id, search)} {...props} />;
}
