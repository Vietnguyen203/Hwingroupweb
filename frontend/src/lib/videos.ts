import { backendUrl } from "./config";
import type { PageResponse, ProductCardResponse } from "./types";

/** Kiểu dữ liệu và tiện ích cho thư viện video mạng xã hội (khớp DTO backend module content). */

export type VideoPlatform = "FACEBOOK" | "TIKTOK" | "YOUTUBE";
export type VideoStatus = "PUBLISHED" | "HIDDEN";

export type VideoProductResponse = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  inStock: boolean;
  active: boolean;
};

export type VideoCategoryResponse = { id: string; name: string; slug: string };

export type VideoResponse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  platform: VideoPlatform;
  sourceUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  category: VideoCategoryResponse | null;
  displayOrder: number;
  status: VideoStatus;
  createdAt: string;
  updatedAt: string;
  products: VideoProductResponse[];
};

export type VideoPreviewResponse = {
  platform: VideoPlatform;
  externalId: string;
  sourceUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
};

export const PLATFORM_LABEL: Record<VideoPlatform, string> = { FACEBOOK: "Facebook", TIKTOK: "TikTok", YOUTUBE: "YouTube" };

/** Chấm màu nhận diện nền tảng (không dùng logo của bên thứ ba). */
export const PLATFORM_DOT: Record<VideoPlatform, string> = { FACEBOOK: "bg-[#1877f2]", TIKTOK: "bg-neutral-900", YOUTUBE: "bg-[#ff0000]" };

/**
 * Host được phép nhúng (khớp danh sách backend). Frontend kiểm tra lại trước khi dựng iframe: dù backend đã tự dựng
 * địa chỉ nhúng, ta không bao giờ gắn vào iframe một địa chỉ ngoài danh sách này.
 */
const EMBED_HOST: Record<VideoPlatform, string> = {
  YOUTUBE: "www.youtube-nocookie.com",
  TIKTOK: "www.tiktok.com",
  FACEBOOK: "www.facebook.com",
};

const SOURCE_HOSTS: Record<VideoPlatform, string[]> = {
  YOUTUBE: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  TIKTOK: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"],
  FACEBOOK: ["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com"],
};

function parseHttps(url: string): URL | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password ? u : null;
  } catch {
    return null;
  }
}

/** Địa chỉ nhúng an toàn: https + đúng host của nền tảng; không thì null (hiện phương án dự phòng, không dựng iframe). */
export function safeEmbedUrl(platform: VideoPlatform, embedUrl: string): string | null {
  const u = parseHttps(embedUrl);
  return u && u.hostname === EMBED_HOST[platform] ? u.toString() : null;
}

/** Link bài gốc an toàn để mở ở tab mới: https + host của nền tảng; không thì null (không hiện link). */
export function safeSourceUrl(platform: VideoPlatform, sourceUrl: string): string | null {
  const u = parseHttps(sourceUrl);
  return u && SOURCE_HOSTS[platform].includes(u.hostname) ? u.toString() : null;
}

/** Ảnh bìa an toàn cho thẻ img: ảnh tải lên của web hoặc https; không thì null. */
export function safeThumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/") && !url.includes("..")) return url;
  return parseHttps(url) ? url : null;
}

/** Video dọc (TikTok, Facebook reel) khung 9:16; còn lại 16:9. */
export function isVertical(v: Pick<VideoResponse, "platform" | "sourceUrl">): boolean {
  return v.platform === "TIKTOK" || (v.platform === "FACEBOOK" && v.sourceUrl.includes("/reel/"));
}

/**
 * Gợi ý nền tảng từ link ngay khi gõ (chỉ để giao diện nhanh; backend mới là nơi quyết định và kiểm tra).
 */
export function guessPlatform(url: string): VideoPlatform | null {
  const u = parseHttps(url.trim());
  if (!u) return null;
  return (Object.keys(SOURCE_HOSTS) as VideoPlatform[]).find((p) => SOURCE_HOSTS[p].includes(u.hostname)) ?? null;
}

/** Chuyển sản phẩm gắn kèm video sang kiểu ProductCardResponse để dùng chung thẻ ProductCard. */
export function toProductCard(p: VideoProductResponse): ProductCardResponse {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    basePrice: p.price,
    salePercent: 0,
    compareAtPrice: null,
    discountPercent: 0,
    imageUrl: p.imageUrl,
    unit: null,
    inStock: p.inStock,
    bestseller: false,
  };
}

// -----------------------------------------------------------------------------
// Gọi API video từ Server Component (SSR), có nhớ ngắn giống catalog.ts
// -----------------------------------------------------------------------------

const SHORT_TTL_MS = 60_000;
const MAX_ENTRIES = 50;
const shortCache = new Map<string, { at: number; value: Promise<unknown> }>();

async function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined") {
    try {
      const { connection } = await import("next/server");
      await connection();
    } catch {
      // Bỏ qua khi gọi ngoài môi trường Next server component
    }
  }
  const hit = shortCache.get(key);
  if (hit && Date.now() - hit.at < SHORT_TTL_MS) return hit.value as Promise<T>;

  const value = load();
  if (shortCache.size >= MAX_ENTRIES) shortCache.delete(shortCache.keys().next().value!);
  shortCache.set(key, { at: Date.now(), value });
  value.catch(() => {
    if (shortCache.get(key)?.value === value) shortCache.delete(key);
  });
  return value;
}

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${backendUrl}${path}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend ${res.status} khi gọi ${path}`);
  return (await res.json()) as T;
}

export type VideoSearchParams = {
  q?: string;
  platform?: VideoPlatform;
  category?: string;
  page?: number; // 0-based trong frontend
  size?: number;
};

/** Lấy danh sách video đã đăng (có lọc theo từ khóa, nền tảng, danh mục, phân trang). */
export async function listVideos(params: VideoSearchParams = {}): Promise<PageResponse<VideoResponse>> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.platform) qs.set("platform", params.platform);
  if (params.category) qs.set("category", params.category);
  qs.set("page", String((params.page ?? 0) + 1)); // API backend: trang bắt đầu từ 1
  qs.set("page_size", String(params.size ?? 12));

  const key = `videos:list:${qs.toString()}`;
  return remember(key, async () => {
    const page = await get<PageResponse<VideoResponse>>(`/api/videos?${qs.toString()}`);
    return page ? { ...page, page: page.page - 1 } : { content: [], page: 0, pageSize: params.size ?? 12, totalElements: 0, totalPages: 0 };
  });
}

/** Lấy chi tiết một video theo slug (chỉ video đã đăng). Không thấy hoặc ẩn -> null. */
export async function getVideo(slug: string): Promise<VideoResponse | null> {
  const key = `videos:get:${slug}`;
  return remember(key, () => get<VideoResponse>(`/api/videos/${encodeURIComponent(slug)}`));
}
