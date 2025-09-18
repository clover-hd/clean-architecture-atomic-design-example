import { UserId, OrderId } from '../../domain/value-objects';

/**
 * 注文取得クエリ
 */
export class GetOrderQuery {
  constructor(public readonly orderId: string) {}

  /**
   * クエリのバリデーション
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.orderId) {
      errors.push('Order ID is required');
    } else {
      try {
        const orderIdNum = parseInt(this.orderId, 10);
        if (isNaN(orderIdNum)) {
          errors.push('Invalid order ID format');
        } else {
          OrderId.create(orderIdNum);
        }
      } catch (error) {
        errors.push('Invalid order ID');
      }
    }

    return errors;
  }
}

/**
 * ユーザー注文リスト取得クエリ
 */
export class GetUserOrderListQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly status?: string
  ) {}

  /**
   * クエリのバリデーション
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

    if (this.page < 1) {
      errors.push('Page must be 1 or greater');
    }

    if (this.limit < 1 || this.limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }

    if (this.status) {
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(this.status)) {
        errors.push('Invalid order status');
      }
    }

    return errors;
  }
}

/**
 * 全注文リスト取得クエリ（管理者用）
 */
export class GetOrderListQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly status?: string,
    public readonly userId?: string
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

    if (this.status) {
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(this.status)) {
        errors.push('Invalid order status');
      }
    }

    if (this.userId) {
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

    return errors;
  }
}