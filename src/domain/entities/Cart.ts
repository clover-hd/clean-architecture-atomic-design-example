import { Price, Quantity } from '../value-objects';
import { CartItem } from './CartItem';
import { Product } from './Product';

/**
 * Cart Entity
 * カートのドメインモデル（集約ルート）
 */
export class Cart {
  private readonly _sessionId: string;
  private readonly _items: CartItem[];

  constructor(sessionId: string, items: CartItem[] = []) {
    // バリデーション
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('Session ID is required');
    }

    // セッションIDが一致しない項目がないかチェック
    const invalidItems = items.filter(item => !item.isForSession(sessionId));
    if (invalidItems.length > 0) {
      throw new Error('All cart items must belong to the same session');
    }

    this._sessionId = sessionId.trim();
    this._items = [...items]; // 防御的コピー
  }

  /**
   * カートを作成する
   */
  public static create(sessionId: string): Cart {
    return new Cart(sessionId);
  }

  /**
   * 既存データからカートを復元する
   */
  public static restore(sessionId: string, items: CartItem[]): Cart {
    return new Cart(sessionId, items);
  }

  // Getters（不変性を保証）
  public get sessionId(): string {
    return this._sessionId;
  }

  public get items(): CartItem[] {
    return [...this._items]; // 防御的コピー
  }

  public get itemCount(): number {
    return this._items.length;
  }

  /**
   * カートが空かどうかチェック
   */
  public isEmpty(): boolean {
    return this._items.length === 0;
  }

  /**
   * 総商品数量を計算
   */
  public getTotalQuantity(): number {
    return this._items.reduce((total, item) => total + item.quantity.value, 0);
  }

  /**
   * 総金額を計算
   */
  public getTotalAmount(products: Product[]): Price {
    let total = Price.create(0);

    for (const item of this._items) {
      const product = products.find(p => p.id.equals(item.productId));
      if (!product) {
        throw new Error(`Product not found for cart item: ${item.productId.value}`);
      }
      const subtotal = item.calculateSubtotal(product);
      total = total.add(subtotal);
    }

    return total;
  }

  /**
   * 指定商品がカートにあるかチェック
   */
  public hasProduct(productId: any): boolean {
    return this._items.some(item => item.isForProduct(productId));
  }

  /**
   * 指定商品のカート項目を取得
   */
  public getItemForProduct(productId: any): CartItem | undefined {
    return this._items.find(item => item.isForProduct(productId));
  }

  /**
   * 全商品が購入可能かチェック
   */
  public isAllItemsAvailable(products: Product[]): boolean {
    return this._items.every(item => {
      const product = products.find(p => p.id.equals(item.productId));
      return product && item.isAvailable(product);
    });
  }

  /**
   * 購入不可な商品があるかチェック
   */
  public hasUnavailableItems(products: Product[]): boolean {
    return !this.isAllItemsAvailable(products);
  }

  /**
   * 商品をカートに追加する（新しいインスタンスを返す）
   */
  public addItem(newItem: CartItem): Cart {
    if (!newItem.isForSession(this._sessionId)) {
      throw new Error('Cart item session ID mismatch');
    }

    const existingItemIndex = this._items.findIndex(item =>
      item.isForProduct(newItem.productId)
    );

    let updatedItems: CartItem[];

    if (existingItemIndex >= 0) {
      // 既存商品の場合、数量を統合
      const existingItem = this._items[existingItemIndex];
      if (!existingItem) {
        throw new Error('Unexpected error: existing item not found');
      }
      const updatedItem = existingItem.increaseQuantity(newItem.quantity);

      updatedItems = [
        ...this._items.slice(0, existingItemIndex),
        updatedItem,
        ...this._items.slice(existingItemIndex + 1)
      ];
    } else {
      // 新商品の場合、追加
      updatedItems = [...this._items, newItem];
    }

    return new Cart(this._sessionId, updatedItems);
  }

  /**
   * カート項目を更新する（新しいインスタンスを返す）
   */
  public updateItem(itemId: number, newQuantity: Quantity): Cart {
    const itemIndex = this._items.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      throw new Error('Cart item not found');
    }

    const item = this._items[itemIndex];
    if (!item) {
      throw new Error('Unexpected error: item not found at index');
    }
    const updatedItem = item.updateQuantity(newQuantity);

    const updatedItems = [
      ...this._items.slice(0, itemIndex),
      updatedItem,
      ...this._items.slice(itemIndex + 1)
    ];

    return new Cart(this._sessionId, updatedItems);
  }

  /**
   * カート項目を削除する（新しいインスタンスを返す）
   */
  public removeItem(itemId: number): Cart {
    const updatedItems = this._items.filter(item => item.id !== itemId);
    return new Cart(this._sessionId, updatedItems);
  }

  /**
   * 指定商品のカート項目を削除する（新しいインスタンスを返す）
   */
  public removeItemByProduct(productId: any): Cart {
    const updatedItems = this._items.filter(item => !item.isForProduct(productId));
    return new Cart(this._sessionId, updatedItems);
  }

  /**
   * カートを空にする（新しいインスタンスを返す）
   */
  public clear(): Cart {
    return new Cart(this._sessionId, []);
  }

  /**
   * JSON表現
   */
  public toJSON(): object {
    return {
      sessionId: this._sessionId,
      items: this._items.map(item => item.toJSON()),
      itemCount: this.itemCount,
      totalQuantity: this.getTotalQuantity(),
      isEmpty: this.isEmpty()
    };
  }

  /**
   * 商品情報と一緒のJSON表現
   */
  public toJSONWithProducts(products: Product[]): object {
    const itemsWithProducts = this._items.map(item => {
      const product = products.find(p => p.id.equals(item.productId));
      if (!product) {
        throw new Error(`Product not found for cart item: ${item.productId.value}`);
      }
      return item.toJSONWithProduct(product);
    });

    const totalAmount = this.getTotalAmount(products);

    return {
      sessionId: this._sessionId,
      items: itemsWithProducts,
      itemCount: this.itemCount,
      totalQuantity: this.getTotalQuantity(),
      totalAmount: totalAmount.toJSON(),
      totalAmountFormatted: totalAmount.toFormattedString(),
      isEmpty: this.isEmpty(),
      isAllItemsAvailable: this.isAllItemsAvailable(products),
      hasUnavailableItems: this.hasUnavailableItems(products)
    };
  }
}