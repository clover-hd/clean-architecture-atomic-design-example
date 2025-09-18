import { ProductId, Price, ProductCategory, Quantity } from '../value-objects';

/**
 * Product Entity
 * 商品のドメインモデル
 */
export class Product {
  private readonly _id: ProductId;
  private readonly _name: string;
  private readonly _description: string | undefined;
  private readonly _price: Price;
  private readonly _stock: Quantity;
  private readonly _category: ProductCategory;
  private readonly _imageUrl: string | undefined;
  private readonly _isActive: boolean;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(
    id: ProductId,
    name: string,
    price: Price,
    stock: Quantity,
    category: ProductCategory,
    isActive: boolean = true,
    description?: string,
    imageUrl?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    // バリデーション
    if (!name || name.trim().length === 0) {
      throw new Error('Product name is required');
    }
    if (name.length > 200) {
      throw new Error('Product name must be 200 characters or less');
    }
    if (description && description.length > 1000) {
      throw new Error('Product description must be 1000 characters or less');
    }
    if (imageUrl && imageUrl.length > 500) {
      throw new Error('Image URL must be 500 characters or less');
    }

    this._id = id;
    this._name = name.trim();
    this._description = description ? description.trim() : undefined;
    this._price = price;
    this._stock = stock;
    this._category = category;
    this._imageUrl = imageUrl ? imageUrl.trim() : undefined;
    this._isActive = isActive;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * 商品を作成する
   */
  public static create(
    id: ProductId,
    name: string,
    price: Price,
    stock: Quantity,
    category: ProductCategory,
    description?: string,
    imageUrl?: string
  ): Product {
    return new Product(id, name, price, stock, category, true, description, imageUrl);
  }

  /**
   * 既存データから商品を復元する
   */
  public static restore(
    id: ProductId,
    name: string,
    price: Price,
    stock: Quantity,
    category: ProductCategory,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    description?: string,
    imageUrl?: string
  ): Product {
    return new Product(
      id, name, price, stock, category, isActive,
      description, imageUrl, createdAt, updatedAt
    );
  }

  // Getters（不変性を保証）
  public get id(): ProductId {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get price(): Price {
    return this._price;
  }

  public get stock(): Quantity {
    return this._stock;
  }

  public get category(): ProductCategory {
    return this._category;
  }

  public get imageUrl(): string | undefined {
    return this._imageUrl;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt);
  }

  public get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * 在庫が指定数量以上あるかチェック
   */
  public hasEnoughStock(requiredQuantity: Quantity): boolean {
    return this._stock.isGreaterThanOrEqual(requiredQuantity);
  }

  /**
   * 在庫が0かどうかチェック
   */
  public isOutOfStock(): boolean {
    return this._stock.value === 0;
  }

  /**
   * 販売可能かどうかチェック
   */
  public isAvailableForSale(): boolean {
    return this._isActive && !this.isOutOfStock();
  }

  /**
   * 商品情報を更新する（新しいインスタンスを返す）
   */
  public updateInfo(
    name?: string,
    description?: string,
    price?: Price,
    category?: ProductCategory,
    imageUrl?: string
  ): Product {
    return new Product(
      this._id,
      name || this._name,
      price || this._price,
      this._stock,
      category || this._category,
      this._isActive,
      description !== undefined ? description : this._description,
      imageUrl !== undefined ? imageUrl : this._imageUrl,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 在庫を更新する（新しいインスタンスを返す）
   */
  public updateStock(newStock: Quantity): Product {
    return new Product(
      this._id,
      this._name,
      this._price,
      newStock,
      this._category,
      this._isActive,
      this._description,
      this._imageUrl,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 在庫を減らす（新しいインスタンスを返す）
   */
  public decreaseStock(quantity: Quantity): Product {
    if (!this.hasEnoughStock(quantity)) {
      throw new Error('Insufficient stock');
    }
    const newStock = this._stock.subtract(quantity);
    return this.updateStock(newStock);
  }

  /**
   * 在庫を増やす（新しいインスタンスを返す）
   */
  public increaseStock(quantity: Quantity): Product {
    const newStock = this._stock.add(quantity);
    return this.updateStock(newStock);
  }

  /**
   * 商品を有効化する（新しいインスタンスを返す）
   */
  public activate(): Product {
    if (this._isActive) {
      return this;
    }
    return new Product(
      this._id,
      this._name,
      this._price,
      this._stock,
      this._category,
      true,
      this._description,
      this._imageUrl,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 商品を無効化する（新しいインスタンスを返す）
   */
  public deactivate(): Product {
    if (!this._isActive) {
      return this;
    }
    return new Product(
      this._id,
      this._name,
      this._price,
      this._stock,
      this._category,
      false,
      this._description,
      this._imageUrl,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 等価性チェック
   */
  public equals(other: Product): boolean {
    return this._id.equals(other._id);
  }

  /**
   * JSON表現
   */
  public toJSON(): object {
    return {
      id: this._id.toJSON(),
      name: this._name,
      description: this._description,
      price: this._price.toJSON(),
      priceFormatted: this._price.toFormattedString(),
      stock: this._stock.toJSON(),
      category: this._category.toJSON(),
      categoryJapanese: this._category.getJapaneseName(),
      imageUrl: this._imageUrl,
      isActive: this._isActive,
      isAvailableForSale: this.isAvailableForSale(),
      isOutOfStock: this.isOutOfStock(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}