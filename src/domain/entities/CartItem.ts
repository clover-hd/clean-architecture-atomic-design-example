import { ProductId, Quantity, Price } from '../value-objects';
import { Product } from './Product';

/**
 * CartItem Entity
 * カート商品項目のドメインモデル
 */
export class CartItem {
  private readonly _id: number;
  private readonly _sessionId: string;
  private readonly _productId: ProductId;
  private readonly _quantity: Quantity;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(
    id: number,
    sessionId: string,
    productId: ProductId,
    quantity: Quantity,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    // バリデーション
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('Session ID is required');
    }
    if (id <= 0) {
      throw new Error('Cart item ID must be a positive integer');
    }

    this._id = id;
    this._sessionId = sessionId.trim();
    this._productId = productId;
    this._quantity = quantity;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * カート項目を作成する
   */
  public static create(
    id: number,
    sessionId: string,
    productId: ProductId,
    quantity: Quantity
  ): CartItem {
    return new CartItem(id, sessionId, productId, quantity);
  }

  /**
   * 既存データからカート項目を復元する
   */
  public static restore(
    id: number,
    sessionId: string,
    productId: ProductId,
    quantity: Quantity,
    createdAt: Date,
    updatedAt: Date
  ): CartItem {
    return new CartItem(id, sessionId, productId, quantity, createdAt, updatedAt);
  }

  // Getters（不変性を保証）
  public get id(): number {
    return this._id;
  }

  public get sessionId(): string {
    return this._sessionId;
  }

  public get productId(): ProductId {
    return this._productId;
  }

  public get quantity(): Quantity {
    return this._quantity;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt);
  }

  public get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * 小計を計算する
   */
  public calculateSubtotal(product: Product): Price {
    if (!this._productId.equals(product.id)) {
      throw new Error('Product ID mismatch');
    }
    return product.price.multiply(this._quantity.value);
  }

  /**
   * 購入可能かチェック
   */
  public isAvailable(product: Product): boolean {
    if (!this._productId.equals(product.id)) {
      return false;
    }
    return product.isAvailableForSale() && product.hasEnoughStock(this._quantity);
  }

  /**
   * 数量を更新する（新しいインスタンスを返す）
   */
  public updateQuantity(newQuantity: Quantity): CartItem {
    return new CartItem(
      this._id,
      this._sessionId,
      this._productId,
      newQuantity,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 数量を増やす（新しいインスタンスを返す）
   */
  public increaseQuantity(amount: Quantity): CartItem {
    const newQuantity = this._quantity.add(amount);
    return this.updateQuantity(newQuantity);
  }

  /**
   * 数量を減らす（新しいインスタンスを返す）
   */
  public decreaseQuantity(amount: Quantity): CartItem {
    const newQuantity = this._quantity.subtract(amount);
    return this.updateQuantity(newQuantity);
  }

  /**
   * 指定された商品のカート項目かチェック
   */
  public isForProduct(productId: ProductId): boolean {
    return this._productId.equals(productId);
  }

  /**
   * 指定されたセッションのカート項目かチェック
   */
  public isForSession(sessionId: string): boolean {
    return this._sessionId === sessionId;
  }

  /**
   * 等価性チェック
   */
  public equals(other: CartItem): boolean {
    return this._id === other._id;
  }

  /**
   * JSON表現
   */
  public toJSON(): object {
    return {
      id: this._id,
      sessionId: this._sessionId,
      productId: this._productId.toJSON(),
      quantity: this._quantity.toJSON(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }

  /**
   * 商品情報と一緒のJSON表現
   */
  public toJSONWithProduct(product: Product): object {
    return {
      ...this.toJSON(),
      product: product.toJSON(),
      subtotal: this.calculateSubtotal(product).toJSON(),
      subtotalFormatted: this.calculateSubtotal(product).toFormattedString(),
      isAvailable: this.isAvailable(product)
    };
  }
}