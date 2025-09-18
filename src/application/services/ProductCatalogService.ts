import { IProductRepository } from '../../domain/repositories';
import { ProductDomainService } from '../../domain/services';
import { GetProductListUseCase, GetProductDetailUseCase } from '../usecases/product';
import { GetProductListQuery, GetProductQuery } from '../queries';
import { ProductListResponseDTO, ProductResponseDTO } from '../dto/response';

/**
 * 商品カタログサービス
 * 商品関連のUse Caseを調整し、統合的な商品情報提供を行う
 */
export class ProductCatalogService {
  private readonly getProductListUseCase: GetProductListUseCase;
  private readonly getProductDetailUseCase: GetProductDetailUseCase;

  constructor(
    private readonly productRepository: IProductRepository,
    private readonly productDomainService: ProductDomainService
  ) {
    this.getProductListUseCase = new GetProductListUseCase(productRepository, productDomainService);
    this.getProductDetailUseCase = new GetProductDetailUseCase(productRepository);
  }

  /**
   * 商品一覧を取得（検索・フィルタリング対応）
   */
  async getProductList(
    page: number = 1,
    limit: number = 20,
    searchOptions?: {
      query?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'name' | 'price' | 'created_at';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: ProductListResponseDTO;
  }> {
    const query = new GetProductListQuery(
      page,
      limit,
      searchOptions?.query,
      searchOptions?.category,
      searchOptions?.minPrice,
      searchOptions?.maxPrice,
      searchOptions?.sortBy,
      searchOptions?.sortOrder
    );

    return await this.getProductListUseCase.execute(query);
  }

  /**
   * 商品詳細を取得
   */
  async getProductDetail(productId: string): Promise<{
    success: boolean;
    message: string;
    data?: ProductResponseDTO;
  }> {
    const query = new GetProductQuery(productId);
    return await this.getProductDetailUseCase.execute(query);
  }

  /**
   * おすすめ商品を取得
   */
  async getRecommendedProducts(
    limit: number = 8,
    category?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: ProductListResponseDTO;
  }> {
    try {
      // おすすめ商品のロジック（例：最新商品、人気商品等）
      // ここでは簡単に最新商品を取得
      return await this.getProductList(1, limit, {
        category,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

    } catch (error) {
      console.error('Error in ProductCatalogService.getRecommendedProducts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get recommended products'
      };
    }
  }

  /**
   * カテゴリ別商品一覧を取得
   */
  async getProductsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'name' | 'price' | 'created_at' = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    success: boolean;
    message: string;
    data?: ProductListResponseDTO;
  }> {
    return await this.getProductList(page, limit, {
      category,
      sortBy,
      sortOrder
    });
  }

  /**
   * 商品検索
   */
  async searchProducts(
    searchQuery: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: ProductListResponseDTO;
  }> {
    if (!searchQuery.trim()) {
      return {
        success: false,
        message: 'Search query cannot be empty'
      };
    }

    return await this.getProductList(page, limit, {
      query: searchQuery.trim(),
      category: filters?.category,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }

  /**
   * 在庫のある商品のみを取得
   */
  async getAvailableProducts(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    message: string;
    data?: ProductListResponseDTO;
  }> {
    try {
      const result = await this.getProductList(page, limit);

      if (result.success && result.data) {
        // 在庫のある商品のみフィルタリング
        const availableProducts = result.data.products.filter(
          product => product.isAvailable && product.stock > 0
        );

        return {
          success: true,
          message: 'Available products retrieved successfully',
          data: {
            ...result.data,
            products: availableProducts
          }
        };
      }

      return result;

    } catch (error) {
      console.error('Error in ProductCatalogService.getAvailableProducts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get available products'
      };
    }
  }
}