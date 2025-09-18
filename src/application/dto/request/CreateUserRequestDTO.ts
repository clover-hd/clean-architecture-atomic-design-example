/**
 * ユーザー作成リクエストDTO
 */
export interface CreateUserRequestDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * ユーザー作成リクエストDTO検証
 */
export class CreateUserRequestDTOValidator {
  static validate(dto: CreateUserRequestDTO): string[] {
    const errors: string[] = [];

    if (!dto.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      errors.push('Invalid email format');
    }

    if (!dto.password) {
      errors.push('Password is required');
    } else if (dto.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!dto.firstName) {
      errors.push('First name is required');
    } else if (dto.firstName.length > 50) {
      errors.push('First name must be 50 characters or less');
    }

    if (!dto.lastName) {
      errors.push('Last name is required');
    } else if (dto.lastName.length > 50) {
      errors.push('Last name must be 50 characters or less');
    }

    if (dto.phone && dto.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    }

    return errors;
  }
}