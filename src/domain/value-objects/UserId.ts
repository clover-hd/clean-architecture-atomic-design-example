/**
 * ユーザーID Value Object
 * 型安全性と不変性を保証するUserId実装
 */
export class UserId {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * UserIdを作成する
   * @param value 正の整数のユーザーID
   * @throws {Error} 無効な値の場合
   */
  public static create(value: number): UserId {
    if (!Number.isInteger(value)) {
      throw new Error('UserId must be an integer');
    }
    if (value <= 0) {
      throw new Error('UserId must be a positive integer');
    }
    return new UserId(value);
  }

  /**
   * 値を取得する（不変性を保証）
   */
  public get value(): number {
    return this._value;
  }

  /**
   * 等価性チェック
   */
  public equals(other: UserId): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  public toString(): string {
    return this._value.toString();
  }

  /**
   * JSON表現
   */
  public toJSON(): number {
    return this._value;
  }
}