import { UserId } from '../../domain/value-objects';

/**
 * ユーザー更新コマンド
 */
export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly phone?: string
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

    if (this.firstName !== undefined) {
      if (!this.firstName || this.firstName.trim().length === 0) {
        errors.push('First name cannot be empty');
      } else if (this.firstName.length > 50) {
        errors.push('First name must be 50 characters or less');
      }
    }

    if (this.lastName !== undefined) {
      if (!this.lastName || this.lastName.trim().length === 0) {
        errors.push('Last name cannot be empty');
      } else if (this.lastName.length > 50) {
        errors.push('Last name must be 50 characters or less');
      }
    }

    if (this.phone !== undefined && this.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    }

    return errors;
  }
}

/**
 * ユーザー更新コマンド結果
 */
export interface UpdateUserCommandResult {
  userId: string;
  success: boolean;
  message: string;
}