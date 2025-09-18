import { OrderId, UserId } from '../../../domain/value-objects';
import { IOrderRepository } from '../../../domain/repositories';
import { OrderResponseDTO, OrderListResponseDTO } from '../../dto/response';
import { OrderDTOMapper } from '../../dto/mappers';
import { GetOrderQuery, GetUserOrderListQuery, GetOrderListQuery } from '../../queries';

/**
 * 注文取得ユースケース
 */
export class GetOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  /**
   * 注文詳細を取得
   */
  async execute(query: GetOrderQuery): Promise<{
    success: boolean;
    message: string;
    data?: OrderResponseDTO;
  }> {
    try {
      // クエリの検証
      const validationErrors = query.validate();
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: validationErrors.join(', ')
        };
      }

      // 注文を取得
      const orderId = new OrderId(query.orderId);
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        return {
          success: false,
          message: 'Order not found'
        };
      }

      // DTOに変換して返却
      const orderResponseDTO = OrderDTOMapper.toResponseDTO(order);

      return {
        success: true,
        message: 'Order retrieved successfully',
        data: orderResponseDTO
      };

    } catch (error) {
      console.error('Error in GetOrderUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get order'
      };
    }
  }

  /**
   * ユーザーの注文一覧を取得
   */
  async getUserOrders(query: GetUserOrderListQuery): Promise<{
    success: boolean;
    message: string;
    data?: OrderListResponseDTO;
  }> {
    try {
      // クエリの検証
      const validationErrors = query.validate();
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: validationErrors.join(', ')
        };
      }

      // 注文を検索
      const userId = new UserId(query.userId);
      const orders = await this.orderRepository.findByUserId(
        userId,
        query.limit,
        (query.page - 1) * query.limit,
        query.status
      );

      // 総件数を取得
      const totalCount = await this.orderRepository.countByUserId(userId, query.status);

      // DTOに変換
      const orderListResponse = OrderDTOMapper.toListResponseDTO(
        orders,
        query.page,
        query.limit,
        totalCount
      );

      return {
        success: true,
        message: 'User orders retrieved successfully',
        data: orderListResponse
      };

    } catch (error) {
      console.error('Error in GetOrderUseCase.getUserOrders:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user orders'
      };
    }
  }

  /**
   * 全注文一覧を取得（管理者用）
   */
  async getAllOrders(query: GetOrderListQuery): Promise<{
    success: boolean;
    message: string;
    data?: OrderListResponseDTO;
  }> {
    try {
      // クエリの検証
      const validationErrors = query.validate();
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: validationErrors.join(', ')
        };
      }

      // 検索条件を構築
      const searchCriteria = {
        status: query.status,
        userId: query.userId ? new UserId(query.userId) : undefined
      };

      // 注文を検索
      const orders = await this.orderRepository.findAll(
        query.limit,
        (query.page - 1) * query.limit,
        searchCriteria
      );

      // 総件数を取得
      const totalCount = await this.orderRepository.count(searchCriteria);

      // DTOに変換
      const orderListResponse = OrderDTOMapper.toListResponseDTO(
        orders,
        query.page,
        query.limit,
        totalCount
      );

      return {
        success: true,
        message: 'All orders retrieved successfully',
        data: orderListResponse
      };

    } catch (error) {
      console.error('Error in GetOrderUseCase.getAllOrders:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get all orders'
      };
    }
  }
}