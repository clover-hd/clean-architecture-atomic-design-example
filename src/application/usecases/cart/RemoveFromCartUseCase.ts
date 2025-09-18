import { UserId, ProductId } from '../../../domain/value-objects';
import { ICartRepository, IProductRepository } from '../../../domain/repositories';
import { CartDomainService } from '../../../domain/services';
import { RemoveFromCartCommand, RemoveFromCartCommandResult } from '../../commands';
import { CartResponseDTO } from '../../dto/response';
import { CartDTOMapper } from '../../dto/mappers';

/**
 * カート削除ユースケース
 */
export class RemoveFromCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly cartDomainService: CartDomainService
  ) {}

  /**
   * カートから商品を削除
   */
  async execute(command: RemoveFromCartCommand): Promise<{
    cart?: CartResponseDTO;
    result: RemoveFromCartCommandResult;
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

      const productId = new ProductId(command.productId);

      // カート内に該当商品が存在するかチェック
      const hasProduct = cart.items.some(item => item.productId.equals(productId));
      if (!hasProduct) {
        return {
          result: {
            success: false,
            message: 'Product not found in cart'
          }
        };
      }

      // ドメインサービスでカートから商品を削除
      const updatedCart = await this.cartDomainService.removeProductFromCart(
        cart,
        productId
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
          message: 'Product removed from cart successfully',
          totalItems: savedCart.totalItems
        }
      };

    } catch (error) {
      console.error('Error in RemoveFromCartUseCase:', error);
      return {
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to remove product from cart'
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