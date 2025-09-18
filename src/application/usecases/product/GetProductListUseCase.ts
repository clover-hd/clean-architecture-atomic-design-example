import { IProductRepository, ProductSearchCriteria } from '../../../domain/repositories';
import { ProductDomainService } from '../../../domain/services';
import { ProductListResponseDTO } from '../../dto/response';
import { ProductDTOMapper } from '../../dto/mappers';
import { GetProductListQuery } from '../../queries';

/**
 * 商品一覧取得ユースケース
 */
export class GetProductListUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly productDomainService: ProductDomainService
  ) {}

  /**
   * 商品一覧を取得
   */
  async execute(query: GetProductListQuery): Promise<{
    success: boolean;
    message: string;
    data?: ProductListResponseDTO;
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
      const searchCriteria: ProductSearchCriteria = {
        name: query.query,
        category: query.category,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        activeOnly: true,
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc'
      };

      // 商品を検索
      const products = await this.productRepository.findByCriteria(searchCriteria);

      // 総件数を取得
      const totalCount = await this.productRepository.countByCriteria(searchCriteria);

      // DTOに変換
      const productListResponse = ProductDTOMapper.toListResponseDTO(
        products,
        query.page,
        query.limit,
        totalCount,
        query
      );

      return {
        success: true,
        message: 'Product list retrieved successfully',
        data: productListResponse
      };

    } catch (error) {
      console.error('Error in GetProductListUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get product list'
      };
    }
  }
}