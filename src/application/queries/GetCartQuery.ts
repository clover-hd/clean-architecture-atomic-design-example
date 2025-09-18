import { UserId } from '../../domain/value-objects';

/**
 * カート取得クエリ
 */
export class GetCartQuery {
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
 * カートサマリ取得クエリ（ヘッダー表示用）
 */
export class GetCartSummaryQuery {
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