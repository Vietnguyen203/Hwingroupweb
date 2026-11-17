/**
 * Chép văn bản vào clipboard. Dùng Clipboard API khi có (HTTPS / localhost); nếu bị chặn hoặc không có
 * (VD mở site qua IP mạng LAN dạng http) thì dùng cách cũ với ô nhập tạm. Trả về true nếu chép được.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* thử cách dự phòng bên dưới */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
