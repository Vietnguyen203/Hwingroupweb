"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Upload, X } from "lucide-react";

import { CameraCaptureDialog } from "@/components/affiliate/camera-capture-dialog";
import { IMAGE_ACCEPT, prepareImage, validateImage } from "@/lib/image";

export const ID_CARD_MAX_BYTES = 5 * 1024 * 1024;

/** Kiểm tra nhanh ở trình duyệt (backend vẫn kiểm tra lại định dạng và dung lượng). */
export const idCardFileError = validateImage;

/**
 * Ô nhận 1 mặt CCCD: CHỤP TẠI CHỖ hoặc TẢI ẢNH LÊN.
 * - Điện thoại: "Chụp ảnh" mở thẳng camera của máy (input capture) – nét và nhanh nhất.
 * - Máy tính: "Chụp ảnh" mở hộp camera (webcam) có khung căn thẻ; không có camera / bị chặn thì báo và gợi ý tải ảnh lên.
 * Ảnh quá lớn (thường là ảnh điện thoại) được tự thu nhỏ trước khi gửi. Ảnh chỉ được gửi lên khi bấm "Gửi đăng ký".
 */
export function IdCardPicker({ label, file, onChange, onError }: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  onError: (message: string | null) => void;
}) {
  const uploadInput = useRef<HTMLInputElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Tạo/hủy URL xem trước theo file đang chọn (tránh rò bộ nhớ).
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ URL xem trước với file, cần state
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /** Nhận ảnh từ ô chọn tệp / camera: thu nhỏ nếu cần rồi kiểm tra. */
  async function accept(picked: File) {
    setProcessing(true);
    try {
      const prepared = await prepareImage(picked);
      const err = validateImage(prepared);
      onError(err);
      if (!err) onChange(prepared);
    } finally {
      setProcessing(false);
    }
  }

  function takePhoto() {
    onError(null);
    const hasCamera = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
    const touchDevice = window.matchMedia("(pointer: coarse)").matches;
    // Điện thoại / máy tính bảng: camera gốc qua input capture. Máy tính: hộp camera. Không có API camera: input capture (điện thoại) hoặc báo lỗi.
    if (touchDevice || !hasCamera) captureInput.current?.click();
    else setCameraOpen(true);
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (f) void accept(f);
  };

  const action = "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition";

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium">{label} <span className="text-destructive">*</span></span>
      <div className="relative aspect-[1.6] w-full overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50">
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước cục bộ (blob:) */}
            <img src={preview} alt={label} className="size-full object-contain" />
            <button type="button" aria-label={`Xóa ${label}`} onClick={() => onChange(null)} className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white">
              <X className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-2">
              <button type="button" onClick={takePhoto} className={`${action} bg-white/90 text-neutral-800 hover:bg-white`}><Camera className="size-3.5" /> Chụp lại</button>
              <button type="button" onClick={() => uploadInput.current?.click()} className={`${action} bg-white/90 text-neutral-800 hover:bg-white`}><Upload className="size-3.5" /> Chọn ảnh khác</button>
            </div>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-2 text-neutral-500">
            {processing ? (
              <span className="text-sm">Đang xử lý ảnh...</span>
            ) : (
              <>
                <ImagePlus className="size-7" />
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={takePhoto} className={`${action} bg-brand text-white hover:brightness-110`}><Camera className="size-3.5" /> Chụp ảnh</button>
                  <button type="button" onClick={() => uploadInput.current?.click()} className={`${action} border border-neutral-300 bg-white text-neutral-700 hover:border-brand`}><Upload className="size-3.5" /> Tải ảnh lên</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={uploadInput} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={onFile} />
      {/* capture: trên điện thoại mở thẳng camera sau */}
      <input ref={captureInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />

      {cameraOpen && (
        <CameraCaptureDialog
          title={`Chụp CCCD – ${label.toLowerCase()}`}
          onClose={() => setCameraOpen(false)}
          onCapture={(f) => { setCameraOpen(false); void accept(f); }}
        />
      )}
    </div>
  );
}
