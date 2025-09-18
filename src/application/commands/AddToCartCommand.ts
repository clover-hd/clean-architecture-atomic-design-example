import { UserId, ProductId, Quantity } from '../../domain/value-objects';

/**
 * カート追加コマンド
 */
export class AddToCartCommand {
  constructor(
    public readonly userId: string,
    public readonly productId: string,
    public readonly quantity: number
  ) {}

  /**
   * コマンドのバリデーション
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push('User ID is required');
    } else {
      try {
        const userIdNum = parseInt(this.userId, 10);
        if (isNaN(userIdNum)) {
          errors.push('Invalid user ID format');
        } else {
          UserId.create(userIdNum);
        }
      } catch (error) {
        errors.push('Invalid user ID');
      }
    }

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

    if (this.quantity === undefined || this.quantity === null) {
      errors.push('Quantity is required');
    } else {
      try {
        Quantity.create(this.quantity);
      } catch (error) {
        errors.push('Invalid quantity');
      }
    }

    return errors;
  }
}

/**
 * カート追加コマンド結果
 */
export interface AddToCartCommandResult {
  success: boolean;
  message: string;
  totalItems?: number;
}