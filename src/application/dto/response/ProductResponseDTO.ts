/**
 * 商品レスポンスDTO
 */
export interface ProductResponseDTO {
  id: string;
  name: string;
  description?: string | undefined;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string | undefined;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 商品サマリレスポンスDTO（一覧表示用）
 */
export interface ProductSummaryResponseDTO {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string | undefined;
  isAvailable: boolean;
}

/**
 * 商品リストレスポンスDTO（ページネーション付き）
 */
export interface ProductListResponseDTO {
  products: ProductSummaryResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: {
    query?: string | undefined;
    category?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: string | undefined;
  } | undefined;
}