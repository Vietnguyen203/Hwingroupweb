// Kiểu dữ liệu trả về từ backend (khớp DTO ở backend/.../catalog/api/dto)

export type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  sortOrder: number;
  active: boolean;
  /** Số sản phẩm đang bán trong danh mục. */
  productCount: number;
};

export type ProductCardResponse = {
  id: string;
  name: string;
  slug: string;
  /** Giá khách thực trả (đã gồm giảm giá thêm do admin đặt). */
  price: number;
  /** Giá niêm yết trước khi giảm giá thêm. */
  basePrice: number;
  /** Giảm giá thêm (%) do admin đặt, 0 nếu không có. */
  salePercent: number;
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
  /** Thông tin cơ bản */
  brand: string | null;
  weight: string | null;
  packaging: string | null;
  origin: string | null;
  /** Nội dung chi tiết */
  ingredients: string | null;
  features: string | null;
  usageInstructions: string | null;
  soldCount: number;
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

export type CertificateResponse = {
  id: string;
  title: string | null;
  certNumber: string | null;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  imageUrl: string;
  category: "FOOD_SAFETY" | "ISO_HACCP" | "TEST_REPORT" | "BUSINESS_LICENSE" | string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};
