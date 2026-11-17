"use client";

import { useEffect } from "react";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";

import { Button } from "./button";

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Hộp thoại xác nhận hiện đại thay thế cho window.confirm xấu xí của trình duyệt.
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận xóa",
  cancelText = "Hủy bỏ",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Lắng nghe phím ESC để đóng
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Lớp nền mờ */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={loading ? undefined : onCancel}
      />

      {/* Thẻ hộp thoại */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Đóng"
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
              tone === "danger"
                ? "bg-rose-100 text-rose-600 ring-8 ring-rose-50"
                : tone === "warning"
                ? "bg-amber-100 text-amber-600 ring-8 ring-amber-50"
                : "bg-sky-100 text-sky-600 ring-8 ring-sky-50"
            }`}
          >
            {tone === "danger" ? (
              <Trash2 className="size-6" />
            ) : tone === "warning" ? (
              <AlertTriangle className="size-6" />
            ) : (
              <Info className="size-6" />
            )}
          </div>

          <div className="flex-1 pt-0.5">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <div className="mt-2 text-sm leading-relaxed text-slate-600">{message}</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-xl px-4 font-semibold text-slate-700 hover:bg-slate-50 border-slate-200"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-10 rounded-xl px-5 font-semibold text-white shadow-sm transition-all ${
              tone === "danger"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-brand hover:bg-brand-hover shadow-brand/20"
            }`}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
