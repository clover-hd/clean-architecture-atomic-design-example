/**
 * Price Value Object
 * 型安全性と不変性を保証するPrice実装（円単位）
 */
export class Price {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * Priceを作成する
   * @param value 正の整数の価格（円単位）
   * @throws {Error} 無効な値の場合
   */
  public static create(value: number): Price {
    if (!Number.isInteger(value)) {
      throw new Error('Price must be an integer (yen)');
    }
    if (value < 0) {
      throw new Error('Price must be non-negative');
    }
    if (value > 10000000) {
      throw new Error('Price exceeds maximum allowed value (10,000,000 yen)');
    }
    return new Price(value);
  }

  /**
   * 値を取得する（不変性を保証）
   */
  public get value(): number {
    return this._value;
  }

  /**
   * 税込み価格を計算する
   * @param taxRate 税率（例: 0.1 for 10%）
   */
  public withTax(taxRate: number): Price {
    if (taxRate < 0 || taxRate > 1) {
      throw new Error('Tax rate must be between 0 and 1');
    }
    const taxIncludedValue = Math.floor(this._value * (1 + taxRate));
    return Price.create(taxIncludedValue);
  }

  /**
   * 価格を掛ける
   * @param multiplier 乗数
   */
  public multiply(multiplier: number): Price {
    if (multiplier < 0) {
      throw new Error('Multiplier must be non-negative');
    }
    if (!Number.isInteger(multiplier)) {
      throw new Error('Multiplier must be an integer');
    }
    return Price.create(this._value * multiplier);
  }

  /**
   * 価格を足す
   * @param other 他の価格
   */
  public add(other: Price): Price {
    return Price.create(this._value + other._value);
  }

  /**
   * 価格を引く
   * @param other 他の価格
   */
  public subtract(other: Price): Price {
    const result = this._value - other._value;
    if (result < 0) {
      throw new Error('Result price cannot be negative');
    }
    return Price.create(result);
  }

  /**
   * フォーマットされた文字列表現（カンマ区切り）
   */
  public toFormattedString(): string {
    return `¥${this._value.toLocaleString('ja-JP')}`;
  }

  /**
   * 等価性チェック
   */
  public equals(other: Price): boolean {
    return this._value === other._value;
  }

  /**
   * 比較
   */
  public isGreaterThan(other: Price): boolean {
    return this._value > other._value;
  }

  public isLessThan(other: Price): boolean {
    return this._value < other._value;
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