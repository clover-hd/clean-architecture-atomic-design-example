import { UserId } from '../../domain/value-objects';

/**
 * ユーザー取得クエリ
 */
export class GetUserQuery {
  constructor(public readonly userId: string) {}

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

    return errors;
  }
}

/**
 * メールアドレスでユーザー取得クエリ
 */
export class GetUserByEmailQuery {
  constructor(public readonly email: string) {}

  /**
   * クエリのバリデーション
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Invalid email format');
    }

    return errors;
  }
}

/**
 * ユーザーリスト取得クエリ
 */
export class GetUserListQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly isAdmin?: boolean
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

    return errors;
  }
}