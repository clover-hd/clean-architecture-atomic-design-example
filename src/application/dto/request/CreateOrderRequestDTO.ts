/**
 * 注文作成リクエストDTO
 */
export interface CreateOrderRequestDTO {
  shippingAddress: {
    postalCode: string;
    prefecture: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  paymentMethod: 'cash_on_delivery' | 'credit_card' | 'bank_transfer';
  notes?: string;
}

/**
 * 注文作成リクエストDTO検証
 */
export class CreateOrderRequestDTOValidator {
  static validate(dto: CreateOrderRequestDTO): string[] {
    const errors: string[] = [];

    // 配送先住所の検証
    if (!dto.shippingAddress) {
      errors.push('Shipping address is required');
    } else {
      if (!dto.shippingAddress.postalCode) {
        errors.push('Postal code is required');
      } else if (!/^\d{3}-\d{4}$/.test(dto.shippingAddress.postalCode)) {
        errors.push('Postal code must be in format 000-0000');
      }

      if (!dto.shippingAddress.prefecture) {
        errors.push('Prefecture is required');
      }

      if (!dto.shippingAddress.city) {
        errors.push('City is required');
      }

      if (!dto.shippingAddress.addressLine1) {
        errors.push('Address line 1 is required');
      }
    }

    // 連絡先の検証
    if (dto.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.contactEmail)) {
      errors.push('Invalid contact email format');
    }

    if (dto.contactPhone && dto.contactPhone.length > 20) {
      errors.push('Contact phone must be 20 characters or less');
    }

    // 支払い方法の検証
    const validPaymentMethods = ['cash_on_delivery', 'credit_card', 'bank_transfer'];
    if (!dto.paymentMethod || !validPaymentMethods.includes(dto.paymentMethod)) {
      errors.push('Valid payment method is required');
    }

    return errors;
  }
}