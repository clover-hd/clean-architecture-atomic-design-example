import { Order, OrderItem, Product } from '../../../domain/entities';
import {
  OrderResponseDTO,
  OrderItemResponseDTO,
  OrderSummaryResponseDTO,
  OrderListResponseDTO
} from '../response/OrderResponseDTO';

/**
 * 注文DTOマッパー
 */
export class OrderDTOMapper {
  /**
   * OrderエンティティをOrderResponseDTOに変換
   */
  static toResponseDTO(order: Order, products: Product[]): OrderResponseDTO {
    const productMap = new Map(products.map(p => [p.id.value, p]));

    const items: OrderItemResponseDTO[] = order.items.map(item => {
      const product = productMap.get(item.productId.value);
      if (!product) {
        throw new Error(`Product not found: ${item.productId.value}`);
      }

      return {
        productId: item.productId.value.toString(),
        productName: product.name,
        price: item.priceAtTime.value,
        quantity: item.quantity.value,
        subtotal: item.calculateSubtotal().value
      };
    });

    return {
      id: order.id.value.toString(),
      userId: order.userId.value.toString(),
      items,
      totalAmount: order.totalAmount.value,
      status: order.status.value,
      shippingAddress: order.shippingAddress,
      shippingPhone: order.shippingPhone,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    };
  }

  /**
   * OrderエンティティをOrderSummaryResponseDTOに変換
   */
  static toSummaryResponseDTO(order: Order): OrderSummaryResponseDTO {
    return {
      id: order.id.value.toString(),
      totalAmount: order.totalAmount.value,
      status: order.status.value,
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString()
    };
  }

  /**
   * Orderエンティティの配列をOrderListResponseDTOに変換
   */
  static toListResponseDTO(
    orders: Order[],
    page: number,
    limit: number,
    total: number
  ): OrderListResponseDTO {
    return {
      orders: orders.map(order => this.toSummaryResponseDTO(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * OrderItemエンティティとProductエンティティをOrderItemResponseDTOに変換
   */
  static orderItemToResponseDTO(orderItem: OrderItem, product: Product): OrderItemResponseDTO {
    return {
      productId: orderItem.productId.value.toString(),
      productName: product.name,
      price: orderItem.priceAtTime.value,
      quantity: orderItem.quantity.value,
      subtotal: orderItem.calculateSubtotal().value
    };
  }
}