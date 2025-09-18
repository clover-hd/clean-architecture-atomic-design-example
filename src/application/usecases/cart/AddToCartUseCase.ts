import { UserId, ProductId, Quantity } from '../../../domain/value-objects';
import { ICartRepository, IProductRepository } from '../../../domain/repositories';
import { CartDomainService } from '../../../domain/services';
import { AddToCartCommand, AddToCartCommandResult } from '../../commands';
import { CartResponseDTO } from '../../dto/response';
import { CartDTOMapper } from '../../dto/mappers';

/**
 * カート追加ユースケース
 */
export class AddToCartUseCase {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly cartDomainService: CartDomainService
  ) {}

  /**
   * カートに商品を追加
   */
  async execute(command: AddToCartCommand): Promise<{
    cart?: CartResponseDTO;
    result: AddToCartCommandResult;
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

      // 商品の存在確認と在庫チェック
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

      if (!product.isAvailable) {
        return {
          result: {
            success: false,
            message: 'Product is not available'
          }
        };
      }

      const quantity = new Quantity(command.quantity);
      if (product.stock.value < quantity.value) {
        return {
          result: {
            success: false,
            message: 'Insufficient stock'
          }
        };
      }

      // ユーザーのカートを取得または作成
      const userId = new UserId(command.userId);
      let cart = await this.cartRepository.findByUserId(userId);

      if (!cart) {
        cart = await this.cartRepository.createForUser(userId);
      }

      // ドメインサービスでカートに商品を追加
      const updatedCart = await this.cartDomainService.addProductToCart(
        cart,
        product,
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
          message: 'Product added to cart successfully',
          totalItems: savedCart.totalItems
        }
      };

    } catch (error) {
      console.error('Error in AddToCartUseCase:', error);
      return {
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to add product to cart'
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