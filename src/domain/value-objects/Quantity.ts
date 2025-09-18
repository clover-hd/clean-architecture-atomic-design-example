/**
 * Quantity Value Object
 * 型安全性と不変性を保証するQuantity実装
 */
export class Quantity {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * Quantityを作成する
   * @param value 正の整数の数量
   * @throws {Error} 無効な値の場合
   */
  public static create(value: number): Quantity {
    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be an integer');
    }
    if (value <= 0) {
      throw new Error('Quantity must be a positive integer');
    }
    if (value > 999) {
      throw new Error('Quantity exceeds maximum allowed value (999)');
    }
    return new Quantity(value);
  }

  /**
   * 値を取得する（不変性を保証）
   */
  public get value(): number {
    return this._value;
  }

  /**
   * 数量を足す
   * @param other 他の数量
   */
  public add(other: Quantity): Quantity {
    return Quantity.create(this._value + other._value);
  }

  /**
   * 数量を引く
   * @param other 他の数量
   */
  public subtract(other: Quantity): Quantity {
    const result = this._value - other._value;
    if (result <= 0) {
      throw new Error('Result quantity must be positive');
    }
    return Quantity.create(result);
  }

  /**
   * 等価性チェック
   */
  public equals(other: Quantity): boolean {
    return this._value === other._value;
  }

  /**
   * 比較
   */
  public isGreaterThan(other: Quantity): boolean {
    return this._value > other._value;
  }

  public isLessThan(other: Quantity): boolean {
    return this._value < other._value;
  }

  public isGreaterThanOrEqual(other: Quantity): boolean {
    return this._value >= other._value;
  }

  public isLessThanOrEqual(other: Quantity): boolean {
    return this._value <= other._value;
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