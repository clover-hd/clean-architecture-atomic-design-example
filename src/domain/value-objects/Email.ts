/**
 * Email Value Object
 * 型安全性と不変性を保証するEmail実装
 */
export class Email {
  private readonly _value: string;

  // RFC 5322に準拠した基本的なメールアドレス形式
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Emailを作成する
   * @param value メールアドレス文字列
   * @throws {Error} 無効な形式の場合
   */
  public static create(value: string): Email {
    if (!value || typeof value !== 'string') {
      throw new Error('Email value must be a non-empty string');
    }

    const trimmedValue = value.trim().toLowerCase();

    if (!this.EMAIL_REGEX.test(trimmedValue)) {
      throw new Error('Invalid email format');
    }

    if (trimmedValue.length > 254) {
      throw new Error('Email address is too long (max 254 characters)');
    }

    return new Email(trimmedValue);
  }

  /**
   * 値を取得する（不変性を保証）
   */
  public get value(): string {
    return this._value;
  }

  /**
   * ドメイン部分を取得する
   */
  public getDomain(): string {
    const parts = this._value.split('@');
    return parts[1] || '';
  }

  /**
   * ローカル部分を取得する
   */
  public getLocalPart(): string {
    const parts = this._value.split('@');
    return parts[0] || '';
  }

  /**
   * 等価性チェック
   */
  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  public toString(): string {
    return this._value;
  }

  /**
   * JSON表現
   */
  public toJSON(): string {
    return this._value;
  }
}