import type { NextConfig } from "next";

// Địa chỉ Spring Boot mà server Next.js gọi tới (dùng 127.0.0.1 để tránh delay DNS IPv6 ::1 trên Windows)
const backend = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8088";

const nextConfig: NextConfig = {
  // Cho phép mở dev server qua IP mạng LAN (điện thoại/máy khác) mà vẫn có hot reload
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // Ẩn nút công cụ dev của Next (góc dưới trái) khi chạy npm run dev
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Trình duyệt chỉ gọi /api/* trên cùng domain frontend -> cookie JWT là first-party
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
