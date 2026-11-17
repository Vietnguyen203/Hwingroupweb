"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastMessage = {
  id: string;
  type?: "success" | "error" | "info";
  title?: string;
  message: string;
};

let addToastGlobal: ((toast: Omit<ToastMessage, "id">) => void) | null = null;

/** Hàm gọi thông báo toast từ bất kỳ component nào: showToast({ type: "success", message: "..." }) */
export function showToast(toast: Omit<ToastMessage, "id">) {
  if (addToastGlobal) {
    addToastGlobal(toast);
  }
}

/** Container hiển thị các thông báo nổi ở góc phải màn hình */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastGlobal = (toast) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastGlobal = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            t.type === "error"
              ? "border-rose-200 bg-white/95 text-rose-950"
              : t.type === "info"
              ? "border-sky-200 bg-white/95 text-sky-950"
              : "border-emerald-200 bg-white/95 text-emerald-950"
          }`}
        >
          <div className="pt-0.5">
            {t.type === "error" ? (
              <AlertCircle className="size-5 text-rose-500" />
            ) : t.type === "info" ? (
              <Info className="size-5 text-sky-500" />
            ) : (
              <CheckCircle2 className="size-5 text-emerald-500" />
            )}
          </div>
          <div className="flex-1 text-xs">
            {t.title && <div className="font-bold mb-0.5">{t.title}</div>}
            <div className="text-slate-600 leading-relaxed font-medium">{t.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-slate-400 hover:text-slate-700 transition -mr-1 -mt-1 p-1"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
