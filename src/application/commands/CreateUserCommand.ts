import { Email } from '../../domain/value-objects';

/**
 * ユーザー作成コマンド
 */
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone?: string
  ) {}

  /**
   * コマンドのバリデーション
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.email) {
      errors.push('Email is required');
    } else {
      try {
        Email.create(this.email); // Email value objectでバリデーション
      } catch (error) {
        errors.push('Invalid email format');
      }
    }

    if (!this.password) {
      errors.push('Password is required');
    } else if (this.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!this.firstName) {
      errors.push('First name is required');
    } else if (this.firstName.length > 50) {
      errors.push('First name must be 50 characters or less');
    }

    if (!this.lastName) {
      errors.push('Last name is required');
    } else if (this.lastName.length > 50) {
      errors.push('Last name must be 50 characters or less');
    }

    if (this.phone && this.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    }

    return errors;
  }
}

/**
 * ユーザー作成コマンド結果
 */
export interface CreateUserCommandResult {
  userId: string;
  email: string;
  success: boolean;
  message: string;
}