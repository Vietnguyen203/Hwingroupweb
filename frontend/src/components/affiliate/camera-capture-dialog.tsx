"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

function cameraErrorMessage(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Bạn chưa cho phép dùng camera. Hãy cấp quyền camera cho trang web rồi thử lại, hoặc tải ảnh lên.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Không tìm thấy camera trên thiết bị này. Hãy tải ảnh lên.";
  if (name === "NotReadableError") return "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại, hoặc tải ảnh lên.";
  return "Không mở được camera. Hãy tải ảnh lên.";
}

/**
 * Hộp chụp ảnh bằng camera (máy tính có webcam / trình duyệt hỗ trợ): xem trực tiếp có khung gợi ý căn CCCD,
 * bấm Chụp rồi xem lại, "Chụp lại" hoặc "Dùng ảnh này". Camera luôn được tắt khi đóng hộp.
 * Trên điện thoại nên dùng ô chọn ảnh có thuộc tính capture (camera gốc, nét hơn) – xem IdCardPicker.
 */
export function CameraCaptureDialog({ title, onCapture, onClose }: {
  title: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState<{ url: string; blob: Blob } | null>(null);

  // Mở camera khi hiện hộp, tắt khi đóng
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(cameraErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Thu hồi URL xem trước khi chụp lại / đóng
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => { if (blob) setShot({ url: URL.createObjectURL(blob), blob }); }, "image/jpeg", 0.92);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-neutral-900 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-full p-1.5 hover:bg-white/15"><X className="size-5" /></button>
        </div>

        {error ? (
          <div className="space-y-4 px-5 pt-2 pb-6 text-center">
            <p role="alert" className="text-sm text-red-300">{error}</p>
            <Button type="button" variant="secondary" onClick={onClose}>Đóng</Button>
          </div>
        ) : (
          <>
            <div className="relative aspect-video bg-black">
              {shot ? (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh vừa chụp (blob cục bộ)
                <img src={shot.url} alt="Ảnh vừa chụp" className="size-full object-contain" />
              ) : (
                <>
                  <video ref={videoRef} playsInline muted className="size-full object-contain" />
                  {/* Khung gợi ý căn thẻ (tỉ lệ ~1.586) */}
                  <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="aspect-[1.586] h-[78%] rounded-xl border-2 border-dashed border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                  {!ready && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Đang mở camera...</p>}
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 px-4 py-4">
              {shot ? (
                <>
                  <Button type="button" variant="secondary" onClick={() => setShot(null)}><RotateCcw /> Chụp lại</Button>
                  <Button
                    type="button"
                    onClick={() => onCapture(new File([shot.blob], `anh-chup-${Date.now()}.jpg`, { type: "image/jpeg" }))}
                    className="bg-brand-cta text-white hover:brightness-110"
                  >
                    Dùng ảnh này
                  </Button>
                </>
              ) : (
                <Button type="button" disabled={!ready} onClick={capture} className="h-12 rounded-full bg-white px-8 text-neutral-900 hover:bg-white/90">
                  <Camera /> Chụp
                </Button>
              )}
            </div>
            <p className="px-4 pb-4 text-center text-xs text-white/60">Đặt thẻ nằm gọn trong khung, đủ sáng, không bị lóa.</p>
          </>
        )}
      </div>
    </div>
  );
}
