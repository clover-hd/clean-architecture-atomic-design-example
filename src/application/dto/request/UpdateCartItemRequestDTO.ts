/**
 * カート商品更新リクエストDTO
 */
export interface UpdateCartItemRequestDTO {
  quantity: number;
}

/**
 * カート商品更新リクエストDTO検証
 */
export class UpdateCartItemRequestDTOValidator {
  static validate(dto: UpdateCartItemRequestDTO): string[] {
    const errors: string[] = [];

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