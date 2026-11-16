/** Cấu hình hiển thị của website (giá trị tạm, đổi qua biến môi trường). */
export const siteConfig = {
  name: "HWIN Food",
  description: "Thực phẩm chế biến sẵn – ngon, sạch, giao nhanh giữ lạnh",
  hotline: process.env.NEXT_PUBLIC_HOTLINE ?? "0900000000",
  zaloUrl: process.env.NEXT_PUBLIC_ZALO_URL ?? "https://zalo.me/0900000000",
  messengerUrl: process.env.NEXT_PUBLIC_MESSENGER_URL ?? "https://m.me/",
};

/** Địa chỉ backend cho code chạy trên server Next.js. */
export const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8088";
