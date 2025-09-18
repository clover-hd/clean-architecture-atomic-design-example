/**
 * 注文商品アイテムレスポンスDTO
 */
export interface OrderItemResponseDTO {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/**
 * 注文レスポンスDTO
 */
export interface OrderResponseDTO {
  id: string;
  userId: string;
  items: OrderItemResponseDTO[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  shippingPhone: string;
  notes?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

/**
 * 注文サマリレスポンスDTO（一覧表示用）
 */
export interface OrderSummaryResponseDTO {
  id: string;
  totalAmount: number;
  status: string;
  itemCount: number;
  createdAt: string;
}

/**
 * 注文リストレスポンスDTO（ページネーション付き）
 */
export interface OrderListResponseDTO {
  orders: OrderSummaryResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}