/**
 * カート商品アイテムレスポンスDTO
 */
export interface CartItemResponseDTO {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  isAvailable: boolean;
  imageUrl?: string | undefined;
}

/**
 * カートレスポンスDTO
 */
export interface CartResponseDTO {
  items: CartItemResponseDTO[];
  totalItems: number;
  totalAmount: number;
  isEmpty: boolean;
}

/**
 * カートサマリレスポンスDTO（ヘッダー表示用）
 */
export interface CartSummaryResponseDTO {
  totalItems: number;
  totalAmount: number;
}