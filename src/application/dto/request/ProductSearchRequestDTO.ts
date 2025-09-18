/**
 * 商品検索リクエストDTO
 */
export interface ProductSearchRequestDTO {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 商品検索リクエストDTO検証
 */
export class ProductSearchRequestDTOValidator {
  static validate(dto: ProductSearchRequestDTO): string[] {
    const errors: string[] = [];

    if (dto.minPrice !== undefined && dto.minPrice < 0) {
      errors.push('Min price must be 0 or greater');
    }

    if (dto.maxPrice !== undefined && dto.maxPrice < 0) {
      errors.push('Max price must be 0 or greater');
    }

    if (dto.minPrice !== undefined && dto.maxPrice !== undefined && dto.minPrice > dto.maxPrice) {
      errors.push('Min price must be less than or equal to max price');
    }

    if (dto.page !== undefined && dto.page < 1) {
      errors.push('Page must be 1 or greater');
    }

    if (dto.limit !== undefined && (dto.limit < 1 || dto.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    const validSortBy = ['name', 'price', 'created_at'];
    if (dto.sortBy && !validSortBy.includes(dto.sortBy)) {
      errors.push('Invalid sort by option');
    }

    const validSortOrder = ['asc', 'desc'];
    if (dto.sortOrder && !validSortOrder.includes(dto.sortOrder)) {
      errors.push('Invalid sort order option');
    }

    return errors;
  }
}