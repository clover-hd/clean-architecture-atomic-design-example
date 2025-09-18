import { UserId } from '../../../domain/value-objects';
import { ICartRepository, IProductRepository } from '../../../domain/repositories';
import { CartResponseDTO, CartSummaryResponseDTO } from '../../dto/response';
import { CartDTOMapper } from '../../dto/mappers';
import { GetCartQuery, GetCartSummaryQuery } from '../../queries';

/**
 * カート取得ユースケース
 */
export class GetCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository
  ) {}

  /**
   * カート内容を取得
   */
  async execute(query: GetCartQuery): Promise<{
    success: boolean;
    message: string;
    data?: CartResponseDTO;
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

      // ユーザーのカートを取得
      const userId = new UserId(query.userId);
      const cart = await this.cartRepository.findByUserId(userId);

      if (!cart) {
        // カートが存在しない場合は空のカートを返す
        return {
          success: true,
          message: 'Cart is empty',
          data: {
            items: [],
            totalItems: 0,
            totalAmount: 0,
            isEmpty: true
          }
        };
      }

      // カート内の商品情報を取得
      const cartProducts = await this.getCartProducts(cart);

      // DTOに変換
      const cartResponseDTO = CartDTOMapper.toResponseDTO(cart, cartProducts);

      return {
        success: true,
        message: 'Cart retrieved successfully',
        data: cartResponseDTO
      };

    } catch (error) {
      console.error('Error in GetCartUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get cart'
      };
    }
  }

  /**
   * カートサマリを取得
   */
  async getSummary(query: GetCartSummaryQuery): Promise<{
    success: boolean;
    message: string;
    data?: CartSummaryResponseDTO;
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

      // ユーザーのカートを取得
      const userId = new UserId(query.userId);
      const cart = await this.cartRepository.findByUserId(userId);

      if (!cart) {
        return {
          success: true,
          message: 'Cart is empty',
          data: {
            totalItems: 0,
            totalAmount: 0
          }
        };
      }

      // サマリDTOに変換
      const cartSummaryDTO = CartDTOMapper.toSummaryResponseDTO(cart);

      return {
        success: true,
        message: 'Cart summary retrieved successfully',
        data: cartSummaryDTO
      };

    } catch (error) {
      console.error('Error in GetCartUseCase.getSummary:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get cart summary'
      };
    }
  }

  /**
   * カート内の商品情報を取得
   */
  private async getCartProducts(cart: any) {
    const productIds = cart.items.map((item: any) => item.productId);
    const products = await Promise.all(
      productIds.map((id: any) => this.productRepository.findById(id))
    );
    return products.filter(product => product !== null);
  }
}