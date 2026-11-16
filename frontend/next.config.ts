import type { NextConfig } from "next";

// Địa chỉ Spring Boot mà server Next.js gọi tới (không lộ ra trình duyệt)
const backend = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8088";

const nextConfig: NextConfig = {
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
