/** Chính sách mật khẩu khách – phải khớp backend `PasswordPolicy.validateCustomer`. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export type PasswordRule = { key: string; label: string; ok: boolean };

/** Phần định danh (email trước @ / 9 số cuối SĐT) không được xuất hiện trong mật khẩu. */
function containsIdentifier(password: string, identifier: string): boolean {
  const id = identifier.trim().toLowerCase();
  if (!id) return false;
  const at = id.indexOf("@");
  const part = at > 0 ? id.slice(0, at) : id.replace(/\D/g, "");
  if (part.length < 4) return false;
  return password.toLowerCase().includes(part.length > 9 ? part.slice(-9) : part);
}

export function passwordRules(password: string, identifier = ""): PasswordRule[] {
  return [
    { key: "length", label: `${PASSWORD_MIN}–${PASSWORD_MAX} ký tự, không có khoảng trắng`,
      ok: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX && !/\s/.test(password) },
    { key: "case", label: "Có chữ hoa và chữ thường", ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { key: "digit", label: "Có ít nhất 1 chữ số", ok: /\d/.test(password) },
    { key: "special", label: "Có ít nhất 1 ký tự đặc biệt (! @ # $ %...)", ok: /[^A-Za-z0-9]/.test(password) },
    { key: "identifier", label: "Không chứa email / số điện thoại của bạn", ok: !containsIdentifier(password, identifier) },
  ];
}

export const isPasswordValid = (password: string, identifier = "") => passwordRules(password, identifier).every((r) => r.ok);
