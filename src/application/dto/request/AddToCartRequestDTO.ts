/**
 * カート追加リクエストDTO
 */
export interface AddToCartRequestDTO {
  productId: string;
  quantity: number;
}

/**
 * カート追加リクエストDTO検証
 */
export class AddToCartRequestDTOValidator {
  static validate(dto: AddToCartRequestDTO): string[] {
    const errors: string[] = [];

    if (!dto.productId) {
      errors.push('Product ID is required');
    }

    if (dto.quantity === undefined || dto.quantity === null) {
      errors.push('Quantity is required');
    } else if (dto.quantity < 1) {
      errors.push('Quantity must be at least 1');
    } else if (dto.quantity > 99) {
      errors.push('Quantity must be 99 or less');
    }

    return errors;
  }
}