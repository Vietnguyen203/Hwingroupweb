/** Kiểm tra nhanh ở trình duyệt để báo lỗi ngay tại ô nhập; backend vẫn là nơi kiểm tra chính thức. */

/** Số điện thoại Việt Nam: 0xxxxxxxxx, +84xxxxxxxxx (cho phép khoảng trắng, dấu chấm, gạch ngang). */
export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return "Vui lòng nhập số điện thoại";
  if (!/^[0-9+ .\-]{9,16}$/.test(v)) return "Số điện thoại chỉ gồm chữ số (có thể có +, khoảng trắng)";
  const digits = v.replace(/[\s.\-]/g, "");
  if (!/^(\+84|84|0)\d{8,10}$/.test(digits)) return "Số điện thoại chưa đúng định dạng (VD 0912 345 678)";
  return null;
}

export function validateRequired(value: string, label: string, max = 255): string | null {
  const v = value.trim();
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}`;
  if (v.length > max) return `${label} tối đa ${max} ký tự`;
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Vui lòng nhập email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Email chưa đúng định dạng";
  return null;
}

/** Mã số thuế: 10 số, hoặc 10 số-3 số (chi nhánh). */
export function validateTaxCode(value: string): string | null {
  const v = value.trim();
  if (!v) return "Vui lòng nhập mã số thuế";
  if (!/^\d{10}(-\d{3})?$/.test(v)) return "Mã số thuế gồm 10 số (hoặc 10 số-3 số)";
  return null;
}
