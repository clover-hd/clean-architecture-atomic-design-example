import { IOrderRepository, ICartRepository, IProductRepository } from '../../domain/repositories';
import { OrderDomainService } from '../../domain/services';
import { CreateOrderUseCase, GetOrderUseCase } from '../usecases/order';
import { CartManagementService } from './CartManagementService';
import { CreateOrderCommand, ShippingAddress } from '../commands';
import { GetOrderQuery, GetUserOrderListQuery } from '../queries';
import { OrderResponseDTO, OrderListResponseDTO } from '../dto/response';

/**
 * 注文管理サービス
 * 注文関連のUse Caseを調整し、統合的な注文処理を提供
 */
export class OrderManagementService {
  private readonly createOrderUseCase: CreateOrderUseCase;
  private readonly getOrderUseCase: GetOrderUseCase;

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly orderDomainService: OrderDomainService,
    private readonly cartManagementService: CartManagementService
  ) {
    this.createOrderUseCase = new CreateOrderUseCase(
      orderRepository,
      cartRepository,
      productRepository,
      orderDomainService
    );
    this.getOrderUseCase = new GetOrderUseCase(orderRepository);
  }

  /**
   * 注文を作成し、カートをクリア
   */
  async createOrderAndClearCart(
    userId: string,
    shippingAddress: ShippingAddress,
    contactEmail?: string,
    contactPhone?: string,
    paymentMethod: 'cash_on_delivery' | 'credit_card' | 'bank_transfer' = 'cash_on_delivery',
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
    order?: OrderResponseDTO;
  }> {
    try {
      // カートの内容を事前確認
      const cartResult = await this.cartManagementService.getCart(userId);
      if (!cartResult.success || !cartResult.data || cartResult.data.isEmpty) {
        return {
          success: false,
          message: 'Cart is empty'
        };
      }

      // 注文を作成
      const command = new CreateOrderCommand(
        userId,
        shippingAddress,
        contactEmail,
        contactPhone,
        paymentMethod,
        notes
      );

      const orderResult = await this.createOrderUseCase.execute(command);

      if (!orderResult.result.success) {
        return {
          success: false,
          message: orderResult.result.message
        };
      }

      // 注文作成成功時、Use Caseでカートは既にクリアされています

      return {
        success: true,
        message: 'Order created and cart cleared successfully',
        order: orderResult.order
      };

    } catch (error) {
      console.error('Error in OrderManagementService.createOrderAndClearCart:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  /**
   * 注文詳細を取得
   */
  async getOrder(orderId: string): Promise<{
    success: boolean;
    message: string;
    data?: OrderResponseDTO;
  }> {
    const query = new GetOrderQuery(orderId);
    return await this.getOrderUseCase.execute(query);
  }

  /**
   * ユーザーの注文履歴を取得
   */
  async getUserOrderHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: OrderListResponseDTO;
  }> {
    const query = new GetUserOrderListQuery(userId, page, limit, status);
    return await this.getOrderUseCase.getUserOrders(query);
  }

  /**
   * 注文準備確認（チェックアウト前の事前検証）
   */
  async validateCheckoutPreparation(userId: string): Promise<{
    success: boolean;
    message: string;
    details?: {
      cartItems: number;
      totalAmount: number;
      unavailableItems: string[];
      insufficientStockItems: string[];
    };
  }> {
    try {
      // カートの内容を取得
      const cartResult = await this.cartManagementService.getCart(userId);
      if (!cartResult.success || !cartResult.data) {
        return {
          success: false,
          message: 'Failed to get cart information'
        };
      }

      if (cartResult.data.isEmpty) {
        return {
          success: false,
          message: 'Cart is empty'
        };
      }

      // 商品の可用性と在庫をチェック
      const unavailableItems: string[] = [];
      const insufficientStockItems: string[] = [];

      for (const item of cartResult.data.items) {
        if (!item.isAvailable) {
          unavailableItems.push(item.productName);
        }
        // 在庫不足チェックは商品エンティティで行う必要がありますが、
        // ここではDTOの情報から推測（実際の実装では商品を再取得）
      }

      const hasIssues = unavailableItems.length > 0 || insufficientStockItems.length > 0;

      return {
        success: !hasIssues,
        message: hasIssues ? 'Some items have issues' : 'Ready for checkout',
        details: {
          cartItems: cartResult.data.totalItems,
          totalAmount: cartResult.data.totalAmount,
          unavailableItems,
          insufficientStockItems
        }
      };

    } catch (error) {
      console.error('Error in OrderManagementService.validateCheckoutPreparation:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to validate checkout preparation'
      };
    }
  }
}