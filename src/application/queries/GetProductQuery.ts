import { ProductId } from '../../domain/value-objects';

/**
 * 商品取得クエリ
 */
export class GetProductQuery {
  constructor(public readonly productId: string) {}

  /**
   * クエリのバリデーション
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.productId) {
      errors.push('Product ID is required');
    } else {
      try {
        const productIdNum = parseInt(this.productId, 10);
        if (isNaN(productIdNum)) {
          errors.push('Invalid product ID format');
        } else {
          ProductId.create(productIdNum);
        }
      } catch (error) {
        errors.push('Invalid product ID');
      }
    }

    return errors;
  }
}

/**
 * 商品リスト取得クエリ
 */
export class GetProductListQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly query?: string,
    public readonly category?: string,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly sortBy?: 'name' | 'price' | 'created_at',
    public readonly sortOrder?: 'asc' | 'desc'
  ) {}

  /**
   * クエリのバリデーション
   */
  validate(): string[] {
    const errors: string[] = [];

    if (this.page < 1) {
      errors.push('Page must be 1 or greater');
    }

    if (this.limit < 1 || this.limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }

    if (this.minPrice !== undefined && this.minPrice < 0) {
      errors.push('Min price must be 0 or greater');
    }

    if (this.maxPrice !== undefined && this.maxPrice < 0) {
      errors.push('Max price must be 0 or greater');
    }

    if (this.minPrice !== undefined && this.maxPrice !== undefined && this.minPrice > this.maxPrice) {
      errors.push('Min price must be less than or equal to max price');
    }

    const validSortBy = ['name', 'price', 'created_at'];
    if (this.sortBy && !validSortBy.includes(this.sortBy)) {
      errors.push('Invalid sort by option');
    }

    const validSortOrder = ['asc', 'desc'];
    if (this.sortOrder && !validSortOrder.includes(this.sortOrder)) {
      errors.push('Invalid sort order option');
    }

    return errors;
  }
}