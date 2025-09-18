/**
 * OrderId Value Object
 * 型安全性と不変性を保証するOrderId実装
 */
export class OrderId {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * OrderIdを作成する
   * @param value 正の整数の注文ID
   * @throws {Error} 無効な値の場合
   */
  public static create(value: number): OrderId {
    if (!Number.isInteger(value)) {
      throw new Error('OrderId must be an integer');
    }
    if (value <= 0) {
      throw new Error('OrderId must be a positive integer');
    }
    return new OrderId(value);
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
  public equals(other: OrderId): boolean {
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