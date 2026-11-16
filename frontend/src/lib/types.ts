// Kiểu dữ liệu trả về từ backend (khớp DTO ở backend/.../catalog/api/dto)

export type Category = {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  sortOrder: number;
  active: boolean;
};

export type ProductCard = {
  id: number;
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

export type FoodInfo = {
  manufacturer: string | null;
  shelfLife: string | null;
  storageInstructions: string | null;
  declarationNumber: string | null;
  foodSafetyCertNumber: string | null;
  foodSafetyCertUrl: string | null;
};

export type ProductDetail = Omit<ProductCard, "imageUrl"> & {
  shortDescription: string | null;
  description: string | null;
  stock: number;
  images: string[];
  foodInfo: FoodInfo | null;
  category: Category | null;
};

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ProductSort = "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "BESTSELLER";
