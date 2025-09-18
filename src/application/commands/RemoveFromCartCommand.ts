import { UserId, ProductId } from '../../domain/value-objects';

/**
 * カート削除コマンド
 */
export class RemoveFromCartCommand {
  constructor(
    public readonly userId: string,
    public readonly productId: string
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

    return errors;
  }
}

/**
 * カート削除コマンド結果
 */
export interface RemoveFromCartCommandResult {
  success: boolean;
  message: string;
  totalItems?: number;
}