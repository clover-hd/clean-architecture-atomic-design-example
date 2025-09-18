/**
 * ログインリクエストDTO
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * ログインリクエストDTO検証
 */
export class LoginRequestDTOValidator {
  static validate(dto: LoginRequestDTO): string[] {
    const errors: string[] = [];

    if (!dto.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      errors.push('Invalid email format');
    }

    if (!dto.password) {
      errors.push('Password is required');
    }

    return errors;
  }
}