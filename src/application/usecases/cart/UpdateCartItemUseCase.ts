import { UserId, ProductId, Quantity } from '../../../domain/value-objects';
import { ICartRepository, IProductRepository } from '../../../domain/repositories';
import { CartDomainService } from '../../../domain/services';
import { UpdateCartItemCommand, UpdateCartItemCommandResult } from '../../commands';
import { CartResponseDTO } from '../../dto/response';
import { CartDTOMapper } from '../../dto/mappers';

/**
 * カート商品更新ユースケース
 */
export class UpdateCartItemUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly cartDomainService: CartDomainService
  ) {}

  /**
   * カート内の商品数量を更新
   */
  async execute(command: UpdateCartItemCommand): Promise<{
    cart?: CartResponseDTO;
    result: UpdateCartItemCommandResult;
  }> {
    try {
      // コマンドの検証
      const validationErrors = command.validate();
      if (validationErrors.length > 0) {
        return {
          result: {
            success: false,
            message: validationErrors.join(', ')
          }
        };
      }

      // ユーザーのカートを取得
      const userId = new UserId(command.userId);
      const cart = await this.cartRepository.findByUserId(userId);

      if (!cart) {
        return {
          result: {
            success: false,
            message: 'Cart not found'
          }
        };
      }

      // 商品の存在確認
      const productId = new ProductId(command.productId);
      const product = await this.productRepository.findById(productId);

      if (!product) {
        return {
          result: {
            success: false,
            message: 'Product not found'
          }
        };
      }

      // 在庫チェック
      const quantity = new Quantity(command.quantity);
      if (product.stock.value < quantity.value) {
        return {
          result: {
            success: false,
            message: 'Insufficient stock'
          }
        };
      }

      // ドメインサービスでカート商品を更新
      const updatedCart = await this.cartDomainService.updateCartItem(
        cart,
        productId,
        quantity
      );

      // カートを保存
      const savedCart = await this.cartRepository.save(updatedCart);

      // カート内の全商品を取得してDTOに変換
      const cartProducts = await this.getCartProducts(savedCart);
      const cartResponseDTO = CartDTOMapper.toResponseDTO(savedCart, cartProducts);

      return {
        cart: cartResponseDTO,
        result: {
          success: true,
          message: 'Cart item updated successfully',
          totalItems: savedCart.totalItems
        }
      };

    } catch (error) {
      console.error('Error in UpdateCartItemUseCase:', error);
      return {
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update cart item'
        }
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