/** Xử lý ảnh phía trình duyệt trước khi tải lên: kiểm tra định dạng / dung lượng và tự thu nhỏ ảnh quá lớn (ảnh chụp từ điện thoại). */

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

/** Cạnh dài tối đa sau khi thu nhỏ (đủ nét cho CCCD / ảnh sản phẩm). */
const MAX_EDGE = 2400;
/** Ảnh nặng hơn mức này cũng được nén lại dù kích thước không quá lớn. */
const RESIZE_ABOVE_BYTES = 4 * 1024 * 1024;

/** @returns thông báo lỗi tiếng Việt nếu ảnh không hợp lệ, null nếu hợp lệ. Backend vẫn kiểm tra lại (cả chữ ký file). */
export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Chỉ nhận ảnh JPG, PNG hoặc WebP";
  if (file.size > IMAGE_MAX_BYTES) return "Ảnh tối đa 5MB (đã thử thu nhỏ nhưng vẫn quá lớn)";
  return null;
}

/**
 * Thu nhỏ ảnh quá lớn (cạnh dài > 2400px hoặc > 4MB), giữ nguyên định dạng và chiều xoay theo EXIF.
 * Ảnh vừa đủ hoặc không xử lý được thì trả lại bản gốc.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!IMAGE_TYPES.includes(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const longEdge = Math.max(bitmap.width, bitmap.height);
    if (longEdge <= MAX_EDGE && file.size <= RESIZE_ABOVE_BYTES) {
      bitmap.close();
      return file;
    }
    const scale = Math.min(1, MAX_EDGE / longEdge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.9));
    if (!blob || blob.size >= file.size) return file; // không nhỏ hơn thì giữ bản gốc
    const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ext, { type: file.type });
  } catch {
    return file;
  }
}

/** Tải một ảnh lên endpoint (multipart, trường "file"); @returns URL do backend trả về. */
export async function uploadImage(file: File, endpoint: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: fd });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? "Tải ảnh thất bại");
  return (body.url ?? body.key) as string;
}
