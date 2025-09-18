/**
 * ProductCategory Value Object
 * 型安全性と不変性を保証するProductCategory実装
 */
export type ProductCategoryType =
  | 'electronics'
  | 'fashion'
  | 'books'
  | 'home'
  | 'sports'
  | 'food';

export class ProductCategory {
  private readonly _value: ProductCategoryType;

  private constructor(value: ProductCategoryType) {
    this._value = value;
  }

  /**
   * 有効なカテゴリ一覧
   */
  public static readonly VALID_CATEGORIES: ProductCategoryType[] = [
    'electronics',
    'fashion',
    'books',
    'home',
    'sports',
    'food'
  ];

  /**
   * カテゴリ名の日本語表示
   */
  private static readonly JAPANESE_NAMES: Record<ProductCategoryType, string> = {
    electronics: '家電・電子機器',
    fashion: 'ファッション',
    books: '書籍',
    home: 'ホーム・キッチン',
    sports: 'スポーツ・アウトドア',
    food: '食品・飲料'
  };

  /**
   * ProductCategoryを作成する
   * @param value カテゴリ文字列
   * @throws {Error} 無効なカテゴリの場合
   */
  public static create(value: string): ProductCategory {
    if (!value || typeof value !== 'string') {
      throw new Error('Category value must be a non-empty string');
    }

    const trimmedValue = value.trim().toLowerCase() as ProductCategoryType;

    if (!this.VALID_CATEGORIES.includes(trimmedValue)) {
      throw new Error(`Invalid category: ${value}. Valid categories are: ${this.VALID_CATEGORIES.join(', ')}`);
    }

    return new ProductCategory(trimmedValue);
  }

  /**
   * 値を取得する（不変性を保証）
   */
  public get value(): ProductCategoryType {
    return this._value;
  }

  /**
   * 日本語名を取得する
   */
  public getJapaneseName(): string {
    return ProductCategory.JAPANESE_NAMES[this._value];
  }

  /**
   * 指定されたカテゴリかどうかチェック
   */
  public is(category: ProductCategoryType): boolean {
    return this._value === category;
  }

  /**
   * 等価性チェック
   */
  public equals(other: ProductCategory): boolean {
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