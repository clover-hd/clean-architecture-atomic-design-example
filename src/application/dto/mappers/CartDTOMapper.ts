import { Cart, CartItem, Product } from '../../../domain/entities';
import {
  CartResponseDTO,
  CartItemResponseDTO,
  CartSummaryResponseDTO
} from '../response/CartResponseDTO';

/**
 * カートDTOマッパー
 */
export class CartDTOMapper {
  /**
   * CartエンティティをCartResponseDTOに変換
   */
  static toResponseDTO(cart: Cart, products: Product[]): CartResponseDTO {
    const productMap = new Map(products.map(p => [p.id.value, p]));

    const items: CartItemResponseDTO[] = cart.items.map(item => {
      const product = productMap.get(item.productId.value);
      if (!product) {
        throw new Error(`Product not found: ${item.productId.value}`);
      }

      return {
        productId: item.productId.value.toString(),
        productName: product.name,
        productPrice: product.price.value,
        quantity: item.quantity.value,
        subtotal: item.calculateSubtotal(product).value,
        isAvailable: item.isAvailable(product),
        imageUrl: product.imageUrl || undefined
      };
    });

    return {
      items,
      totalItems: cart.getTotalQuantity(),
      totalAmount: cart.getTotalAmount(products).value,
      isEmpty: cart.isEmpty()
    };
  }

  /**
   * CartエンティティをCartSummaryResponseDTOに変換
   */
  static toSummaryResponseDTO(cart: Cart, products: Product[]): CartSummaryResponseDTO {
    return {
      totalItems: cart.getTotalQuantity(),
      totalAmount: cart.getTotalAmount(products).value
    };
  }

  /**
   * CartItemエンティティとProductエンティティをCartItemResponseDTOに変換
   */
  static cartItemToResponseDTO(cartItem: CartItem, product: Product): CartItemResponseDTO {
    return {
      productId: cartItem.productId.value.toString(),
      productName: product.name,
      productPrice: product.price.value,
      quantity: cartItem.quantity.value,
      subtotal: cartItem.calculateSubtotal(product).value,
      isAvailable: cartItem.isAvailable(product),
      imageUrl: product.imageUrl
    };
  }
}