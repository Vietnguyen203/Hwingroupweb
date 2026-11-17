import { Check, Circle } from "lucide-react";

import { passwordRules } from "@/lib/password-policy";
import { cn } from "@/lib/utils";

/** Danh sách yêu cầu mật khẩu, tick xanh dần khi người dùng nhập. */
export function PasswordChecklist({ password, identifier }: { password: string; identifier: string }) {
  return (
    <ul className="space-y-0.5 text-xs" aria-label="Yêu cầu mật khẩu">
      {passwordRules(password, identifier).map((r) => (
        <li key={r.key} className={cn("flex items-center gap-1.5", r.ok ? "text-green-700" : "text-neutral-500")}>
          {r.ok ? <Check className="size-3.5" /> : <Circle className="size-3" />}
          {r.label}
        </li>
      ))}
    </ul>
  );
}
