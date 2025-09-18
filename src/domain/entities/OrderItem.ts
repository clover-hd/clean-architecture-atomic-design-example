import { OrderId, ProductId, Quantity, Price } from '../value-objects';
import { Product } from './Product';

/**
 * OrderItem Entity
 * 注文商品項目のドメインモデル
 */
export class OrderItem {
  private readonly _id: number;
  private readonly _orderId: OrderId;
  private readonly _productId: ProductId;
  private readonly _quantity: Quantity;
  private readonly _priceAtTime: Price; // 注文時の商品価格
  private readonly _createdAt: Date;

  constructor(
    id: number,
    orderId: OrderId,
    productId: ProductId,
    quantity: Quantity,
    priceAtTime: Price,
    createdAt?: Date
  ) {
    // バリデーション
    if (id <= 0) {
      throw new Error('Order item ID must be a positive integer');
    }

    this._id = id;
    this._orderId = orderId;
    this._productId = productId;
    this._quantity = quantity;
    this._priceAtTime = priceAtTime;
    this._createdAt = createdAt || new Date();
  }

  /**
   * 注文項目を作成する
   */
  public static create(
    id: number,
    orderId: OrderId,
    productId: ProductId,
    quantity: Quantity,
    priceAtTime: Price
  ): OrderItem {
    return new OrderItem(id, orderId, productId, quantity, priceAtTime);
  }

  /**
   * カート項目から注文項目を作成する
   */
  public static createFromCartItem(
    id: number,
    orderId: OrderId,
    productId: ProductId,
    quantity: Quantity,
    product: Product
  ): OrderItem {
    return new OrderItem(id, orderId, productId, quantity, product.price);
  }

  /**
   * 既存データから注文項目を復元する
   */
  public static restore(
    id: number,
    orderId: OrderId,
    productId: ProductId,
    quantity: Quantity,
    priceAtTime: Price,
    createdAt: Date
  ): OrderItem {
    return new OrderItem(id, orderId, productId, quantity, priceAtTime, createdAt);
  }

  // Getters（不変性を保証）
  public get id(): number {
    return this._id;
  }

  public get orderId(): OrderId {
    return this._orderId;
  }

  public get productId(): ProductId {
    return this._productId;
  }

  public get quantity(): Quantity {
    return this._quantity;
  }

  public get priceAtTime(): Price {
    return this._priceAtTime;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt);
  }

  /**
   * 小計を計算する（注文時価格ベース）
   */
  public calculateSubtotal(): Price {
    return this._priceAtTime.multiply(this._quantity.value);
  }

  /**
   * 現在価格との差額を計算する
   */
  public calculatePriceDifference(currentProduct: Product): Price {
    if (!this._productId.equals(currentProduct.id)) {
      throw new Error('Product ID mismatch');
    }

    const currentPrice = currentProduct.price;
    const priceDifference = currentPrice.value - this._priceAtTime.value;

    return Price.create(Math.abs(priceDifference));
  }

  /**
   * 現在価格より高く購入したかチェック
   */
  public isPurchasedAtHigherPrice(currentProduct: Product): boolean {
    if (!this._productId.equals(currentProduct.id)) {
      throw false;
    }
    return this._priceAtTime.isGreaterThan(currentProduct.price);
  }

  /**
   * 現在価格より安く購入したかチェック
   */
  public isPurchasedAtLowerPrice(currentProduct: Product): boolean {
    if (!this._productId.equals(currentProduct.id)) {
      return false;
    }
    return this._priceAtTime.isLessThan(currentProduct.price);
  }

  /**
   * 指定された注文の項目かチェック
   */
  public isForOrder(orderId: OrderId): boolean {
    return this._orderId.equals(orderId);
  }

  /**
   * 指定された商品の項目かチェック
   */
  public isForProduct(productId: ProductId): boolean {
    return this._productId.equals(productId);
  }

  /**
   * 等価性チェック
   */
  public equals(other: OrderItem): boolean {
    return this._id === other._id;
  }

  /**
   * JSON表現
   */
  public toJSON(): object {
    return {
      id: this._id,
      orderId: this._orderId.toJSON(),
      productId: this._productId.toJSON(),
      quantity: this._quantity.toJSON(),
      priceAtTime: this._priceAtTime.toJSON(),
      priceAtTimeFormatted: this._priceAtTime.toFormattedString(),
      subtotal: this.calculateSubtotal().toJSON(),
      subtotalFormatted: this.calculateSubtotal().toFormattedString(),
      createdAt: this._createdAt.toISOString()
    };
  }

  /**
   * 商品情報と一緒のJSON表現
   */
  public toJSONWithProduct(product: Product): object {
    return {
      ...this.toJSON(),
      product: product.toJSON(),
      priceDifference: this.calculatePriceDifference(product).toJSON(),
      priceDifferenceFormatted: this.calculatePriceDifference(product).toFormattedString(),
      isPurchasedAtHigherPrice: this.isPurchasedAtHigherPrice(product),
      isPurchasedAtLowerPrice: this.isPurchasedAtLowerPrice(product)
    };
  }
}