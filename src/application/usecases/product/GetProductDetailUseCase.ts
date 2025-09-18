import { ProductId } from '../../../domain/value-objects';
import { IProductRepository } from '../../../domain/repositories';
import { ProductResponseDTO } from '../../dto/response';
import { ProductDTOMapper } from '../../dto/mappers';
import { GetProductQuery } from '../../queries';

/**
 * 商品詳細取得ユースケース
 */
export class GetProductDetailUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * 商品詳細を取得
   */
  async execute(query: GetProductQuery): Promise<{
    success: boolean;
    message: string;
    data?: ProductResponseDTO;
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

      // 商品を取得
      const productId = new ProductId(query.productId);
      const product = await this.productRepository.findById(productId);

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      // DTOに変換して返却
      const productResponseDTO = ProductDTOMapper.toResponseDTO(product);

      return {
        success: true,
        message: 'Product detail retrieved successfully',
        data: productResponseDTO
      };

    } catch (error) {
      console.error('Error in GetProductDetailUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get product detail'
      };
    }
  }
}