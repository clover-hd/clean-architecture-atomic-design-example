import { UserId, OrderId, Price } from '../../../domain/value-objects';
import { Order, OrderItem } from '../../../domain/entities';
import { IOrderRepository, ICartRepository, IProductRepository } from '../../../domain/repositories';
import { OrderDomainService } from '../../../domain/services';
import { CreateOrderCommand, CreateOrderCommandResult } from '../../commands';
import { OrderResponseDTO } from '../../dto/response';
import { OrderDTOMapper } from '../../dto/mappers';

/**
 * 注文作成ユースケース
 */
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly orderDomainService: OrderDomainService
  ) {}

  /**
   * 注文を作成
   */
  async execute(command: CreateOrderCommand): Promise<{
    order?: OrderResponseDTO;
    result: CreateOrderCommandResult;
  }> {
    try {
      // コマンドの検証
      const validationErrors = command.validate();
      if (validationErrors.length > 0) {
        return {
          result: {
            orderId: '',
            success: false,
            message: validationErrors.join(', ')
          }
        };
      }

      // ユーザーのカートを取得
      const userId = new UserId(command.userId);
      const cart = await this.cartRepository.findByUserId(userId);

      if (!cart || cart.isEmpty) {
        return {
          result: {
            orderId: '',
            success: false,
            message: 'Cart is empty'
          }
        };
      }

      // カート内の商品を取得し、在庫チェック
      const cartProducts = await this.validateCartProducts(cart);

      // 注文商品の作成
      const orderItems = await this.createOrderItems(cart, cartProducts);

      // 注文の作成
      const orderId = new OrderId();
      const order = Order.create(
        orderId,
        userId,
        orderItems,
        command.shippingAddress,
        command.contactEmail,
        command.contactPhone,
        command.paymentMethod,
        command.notes
      );

      // ドメインサービスで注文を検証
      await this.orderDomainService.validateOrder(order);

      // 注文を保存
      const savedOrder = await this.orderRepository.create(order);

      // カートをクリア
      await this.cartRepository.clear(userId);

      // DTOに変換して返却
      const orderResponseDTO = OrderDTOMapper.toResponseDTO(savedOrder);

      return {
        order: orderResponseDTO,
        result: {
          orderId: savedOrder.id.value,
          success: true,
          message: 'Order created successfully',
          totalAmount: savedOrder.totalAmount.value
        }
      };

    } catch (error) {
      console.error('Error in CreateOrderUseCase:', error);
      return {
        result: {
          orderId: '',
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create order'
        }
      };
    }
  }

  /**
   * カート内商品の検証
   */
  private async validateCartProducts(cart: any) {
    const products = [];
    for (const item of cart.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId.value}`);
      }
      if (!product.isAvailable) {
        throw new Error(`Product is not available: ${product.name}`);
      }
      if (product.stock.value < item.quantity.value) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }
      products.push(product);
    }
    return products;
  }

  /**
   * 注文商品の作成
   */
  private async createOrderItems(cart: any, products: any[]): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (let i = 0; i < cart.items.length; i++) {
      const cartItem = cart.items[i];
      const product = products[i];

      const orderItem = OrderItem.create(
        cartItem.productId,
        product.name,
        new Price(product.price.value),
        cartItem.quantity
      );

      orderItems.push(orderItem);
    }

    return orderItems;
  }
}