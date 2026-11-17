/** Cấu hình hiển thị của website (giá trị tạm, đổi qua biến môi trường). */
export const siteConfig = {
  name: "HWIN Food",
  description: "Thực phẩm chế biến sẵn – ngon, sạch, giao nhanh giữ lạnh",
  hotline: process.env.NEXT_PUBLIC_HOTLINE ?? "0961008971",
  zaloUrl: process.env.NEXT_PUBLIC_ZALO_URL ?? "https://zalo.me/0900000000",
  messengerUrl: process.env.NEXT_PUBLIC_MESSENGER_URL ?? "https://m.me/",
  /** Mạng xã hội ở footer – đổi qua biến môi trường. */
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/",
    shopee: process.env.NEXT_PUBLIC_SHOPEE_URL ?? "https://shopee.vn/",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/",
  },
  /** Trang xác nhận đã thông báo website với Bộ Công Thương. */
  bctUrl: process.env.NEXT_PUBLIC_BCT_URL ?? "https://online.gov.vn/nen-tang/ff8a4c18-53de-46d7-9267-c9f492a33c48",
};

/** Địa chỉ backend cho code chạy trên server Next.js. */
export const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8088";
