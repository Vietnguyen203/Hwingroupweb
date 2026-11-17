// Kiểu dữ liệu trả về từ backend (khớp DTO ở backend/.../catalog/api/dto)

export type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  sortOrder: number;
  active: boolean;
};

export type ProductCardResponse = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  imageUrl: string | null;
  unit: string | null;
  inStock: boolean;
  bestseller: boolean;
};

export type FoodInfoResponse = {
  manufacturer: string | null;
  shelfLife: string | null;
  storageInstructions: string | null;
  declarationNumber: string | null;
  foodSafetyCertNumber: string | null;
  foodSafetyCertUrl: string | null;
};

export type ProductDetailResponse = Omit<ProductCardResponse, "imageUrl"> & {
  shortDescription: string | null;
  description: string | null;
  stock: number;
  images: string[];
  foodInfo: FoodInfoResponse | null;
  category: CategoryResponse | null;
};

/** Kết quả phân trang của API: page bắt đầu từ 1 (tham số request: page, page_size). */
export type PageResponse<T> = {
  content: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
};

export type ProductSort = "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "BESTSELLER";
