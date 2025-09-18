import { Product } from '../../../domain/entities';
import {
  ProductResponseDTO,
  ProductSummaryResponseDTO,
  ProductListResponseDTO
} from '../response/ProductResponseDTO';
import { ProductSearchRequestDTO } from '../request/ProductSearchRequestDTO';

/**
 * 商品DTOマッパー
 */
export class ProductDTOMapper {
  /**
   * ProductエンティティをProductResponseDTOに変換
   */
  static toResponseDTO(product: Product): ProductResponseDTO {
    return {
      id: product.id.value.toString(),
      name: product.name,
      description: product.description || undefined,
      price: product.price.value,
      stock: product.stock.value,
      category: product.category.value,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailableForSale(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };
  }

  /**
   * ProductエンティティをProductSummaryResponseDTOに変換
   */
  static toSummaryResponseDTO(product: Product): ProductSummaryResponseDTO {
    return {
      id: product.id.value.toString(),
      name: product.name,
      price: product.price.value,
      stock: product.stock.value,
      category: product.category.value,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailableForSale()
    };
  }

  /**
   * Productエンティティの配列をProductListResponseDTOに変換
   */
  static toListResponseDTO(
    products: Product[],
    page: number,
    limit: number,
    total: number,
    searchCriteria?: ProductSearchRequestDTO
  ): ProductListResponseDTO {
    return {
      products: products.map(product => this.toSummaryResponseDTO(product)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: searchCriteria ? {
        query: searchCriteria.query || undefined,
        category: searchCriteria.category || undefined,
        minPrice: searchCriteria.minPrice || undefined,
        maxPrice: searchCriteria.maxPrice || undefined,
        sortBy: searchCriteria.sortBy || undefined,
        sortOrder: searchCriteria.sortOrder || undefined
      } : undefined
    };
  }
}