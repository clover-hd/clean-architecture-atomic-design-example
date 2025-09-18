import { UserId } from '../../domain/value-objects';

/**
 * 配送先住所
 */
export interface ShippingAddress {
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
}

/**
 * 注文作成コマンド
 */
export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly shippingAddress: ShippingAddress,
    public readonly contactEmail?: string,
    public readonly contactPhone?: string,
    public readonly paymentMethod: 'cash_on_delivery' | 'credit_card' | 'bank_transfer' = 'cash_on_delivery',
    public readonly notes?: string
  ) {}

  /**
   * コマンドのバリデーション
   */
  validate(): string[] {
    const errors: string[] = [];

    // ユーザーIDの検証
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

    // 配送先住所の検証
    if (!this.shippingAddress) {
      errors.push('Shipping address is required');
    } else {
      if (!this.shippingAddress.postalCode) {
        errors.push('Postal code is required');
      } else if (!/^\d{3}-\d{4}$/.test(this.shippingAddress.postalCode)) {
        errors.push('Postal code must be in format 000-0000');
      }

      if (!this.shippingAddress.prefecture) {
        errors.push('Prefecture is required');
      }

      if (!this.shippingAddress.city) {
        errors.push('City is required');
      }

      if (!this.shippingAddress.addressLine1) {
        errors.push('Address line 1 is required');
      }
    }

    // 連絡先の検証
    if (this.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.contactEmail)) {
      errors.push('Invalid contact email format');
    }

    if (this.contactPhone && this.contactPhone.length > 20) {
      errors.push('Contact phone must be 20 characters or less');
    }

    // 支払い方法の検証
    const validPaymentMethods = ['cash_on_delivery', 'credit_card', 'bank_transfer'];
    if (!validPaymentMethods.includes(this.paymentMethod)) {
      errors.push('Valid payment method is required');
    }

    return errors;
  }
}

/**
 * 注文作成コマンド結果
 */
export interface CreateOrderCommandResult {
  orderId: string;
  success: boolean;
  message: string;
  totalAmount?: number;
}