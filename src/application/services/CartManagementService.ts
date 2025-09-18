import { ICartRepository, IProductRepository } from '../../domain/repositories';
import { CartDomainService } from '../../domain/services';
import {
  AddToCartUseCase,
  GetCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase
} from '../usecases/cart';
import {
  AddToCartCommand,
  UpdateCartItemCommand,
  RemoveFromCartCommand
} from '../commands';
import {
  GetCartQuery,
  GetCartSummaryQuery
} from '../queries';
import {
  CartResponseDTO,
  CartSummaryResponseDTO
} from '../dto/response';

/**
 * カート管理サービス
 * カート関連のUse Caseを調整し、統合的なカート操作を提供
 */
export class CartManagementService {
  private readonly addToCartUseCase: AddToCartUseCase;
  private readonly getCartUseCase: GetCartUseCase;
  private readonly updateCartItemUseCase: UpdateCartItemUseCase;
  private readonly removeFromCartUseCase: RemoveFromCartUseCase;

  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly cartDomainService: CartDomainService
  ) {
    this.addToCartUseCase = new AddToCartUseCase(cartRepository, productRepository, cartDomainService);
    this.getCartUseCase = new GetCartUseCase(cartRepository, productRepository);
    this.updateCartItemUseCase = new UpdateCartItemUseCase(cartRepository, productRepository, cartDomainService);
    this.removeFromCartUseCase = new RemoveFromCartUseCase(cartRepository, productRepository, cartDomainService);
  }

  /**
   * 商品をカートに追加し、更新されたカート情報を返す
   */
  async addProductAndGetCart(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<{
    success: boolean;
    message: string;
    cart?: CartResponseDTO;
  }> {
    try {
      // カートに商品を追加
      const command = new AddToCartCommand(userId, productId, quantity);
      const addResult = await this.addToCartUseCase.execute(command);

      if (!addResult.result.success) {
        return {
          success: false,
          message: addResult.result.message
        };
      }

      return {
        success: true,
        message: addResult.result.message,
        cart: addResult.cart
      };

    } catch (error) {
      console.error('Error in CartManagementService.addProductAndGetCart:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add product to cart'
      };
    }
  }

  /**
   * カート商品の数量を更新し、更新されたカート情報を返す
   */
  async updateQuantityAndGetCart(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<{
    success: boolean;
    message: string;
    cart?: CartResponseDTO;
  }> {
    try {
      const command = new UpdateCartItemCommand(userId, productId, quantity);
      const updateResult = await this.updateCartItemUseCase.execute(command);

      if (!updateResult.result.success) {
        return {
          success: false,
          message: updateResult.result.message
        };
      }

      return {
        success: true,
        message: updateResult.result.message,
        cart: updateResult.cart
      };

    } catch (error) {
      console.error('Error in CartManagementService.updateQuantityAndGetCart:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update cart item'
      };
    }
  }

  /**
   * カートから商品を削除し、更新されたカート情報を返す
   */
  async removeProductAndGetCart(
    userId: string,
    productId: string
  ): Promise<{
    success: boolean;
    message: string;
    cart?: CartResponseDTO;
  }> {
    try {
      const command = new RemoveFromCartCommand(userId, productId);
      const removeResult = await this.removeFromCartUseCase.execute(command);

      if (!removeResult.result.success) {
        return {
          success: false,
          message: removeResult.result.message
        };
      }

      return {
        success: true,
        message: removeResult.result.message,
        cart: removeResult.cart
      };

    } catch (error) {
      console.error('Error in CartManagementService.removeProductAndGetCart:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove product from cart'
      };
    }
  }

  /**
   * カート内容を取得
   */
  async getCart(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: CartResponseDTO;
  }> {
    const query = new GetCartQuery(userId);
    return await this.getCartUseCase.execute(query);
  }

  /**
   * カートサマリを取得（ヘッダー表示用）
   */
  async getCartSummary(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: CartSummaryResponseDTO;
  }> {
    const query = new GetCartSummaryQuery(userId);
    return await this.getCartUseCase.getSummary(query);
  }

  /**
   * カートを空にする
   */
  async clearCart(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // カート内の全商品を取得
      const cartResult = await this.getCart(userId);
      if (!cartResult.success || !cartResult.data || cartResult.data.isEmpty) {
        return {
          success: true,
          message: 'Cart is already empty'
        };
      }

      // 全商品を削除
      for (const item of cartResult.data.items) {
        await this.removeFromCartUseCase.execute(
          new RemoveFromCartCommand(userId, item.productId)
        );
      }

      return {
        success: true,
        message: 'Cart cleared successfully'
      };

    } catch (error) {
      console.error('Error in CartManagementService.clearCart:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear cart'
      };
    }
  }
}