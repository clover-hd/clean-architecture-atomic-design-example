import { OrderId, UserId, Price, OrderStatus } from '../value-objects';
import { OrderItem } from './OrderItem';
import { Product } from './Product';

/**
 * Order Entity
 * 注文のドメインモデル（集約ルート）
 */
export class Order {
  private readonly _id: OrderId;
  private readonly _userId: UserId;
  private readonly _totalAmount: Price;
  private readonly _status: OrderStatus;
  private readonly _shippingAddress: string;
  private readonly _shippingPhone: string;
  private readonly _notes: string | undefined;
  private readonly _items: OrderItem[];
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(
    id: OrderId,
    userId: UserId,
    totalAmount: Price,
    status: OrderStatus,
    shippingAddress: string,
    shippingPhone: string,
    items: OrderItem[] = [],
    notes?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    // バリデーション
    if (!shippingAddress || shippingAddress.trim().length === 0) {
      throw new Error('Shipping address is required');
    }
    if (!shippingPhone || shippingPhone.trim().length === 0) {
      throw new Error('Shipping phone is required');
    }
    if (shippingAddress.length > 500) {
      throw new Error('Shipping address must be 500 characters or less');
    }
    if (shippingPhone.length > 20) {
      throw new Error('Shipping phone must be 20 characters or less');
    }
    if (notes && notes.length > 1000) {
      throw new Error('Notes must be 1000 characters or less');
    }

    // 注文項目が全て同じ注文IDを持つかチェック
    const invalidItems = items.filter(item => !item.isForOrder(id));
    if (invalidItems.length > 0) {
      throw new Error('All order items must belong to the same order');
    }

    this._id = id;
    this._userId = userId;
    this._totalAmount = totalAmount;
    this._status = status;
    this._shippingAddress = shippingAddress.trim();
    this._shippingPhone = shippingPhone.trim();
    this._notes = notes ? notes.trim() : undefined;
    this._items = [...items]; // 防御的コピー
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * 注文を作成する
   */
  public static create(
    id: OrderId,
    userId: UserId,
    totalAmount: Price,
    shippingAddress: string,
    shippingPhone: string,
    items: OrderItem[] = [],
    notes?: string
  ): Order {
    const status = OrderStatus.createDefault(); // pending
    return new Order(
      id, userId, totalAmount, status, shippingAddress, shippingPhone, items, notes
    );
  }

  /**
   * 既存データから注文を復元する
   */
  public static restore(
    id: OrderId,
    userId: UserId,
    totalAmount: Price,
    status: OrderStatus,
    shippingAddress: string,
    shippingPhone: string,
    createdAt: Date,
    updatedAt: Date,
    items: OrderItem[] = [],
    notes?: string
  ): Order {
    return new Order(
      id, userId, totalAmount, status, shippingAddress, shippingPhone,
      items, notes, createdAt, updatedAt
    );
  }

  // Getters（不変性を保証）
  public get id(): OrderId {
    return this._id;
  }

  public get userId(): UserId {
    return this._userId;
  }

  public get totalAmount(): Price {
    return this._totalAmount;
  }

  public get status(): OrderStatus {
    return this._status;
  }

  public get shippingAddress(): string {
    return this._shippingAddress;
  }

  public get shippingPhone(): string {
    return this._shippingPhone;
  }

  public get notes(): string | undefined {
    return this._notes;
  }

  public get items(): OrderItem[] {
    return [...this._items]; // 防御的コピー
  }

  public get createdAt(): Date {
    return new Date(this._createdAt);
  }

  public get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  public get itemCount(): number {
    return this._items.length;
  }

  /**
   * 注文の総数量を計算
   */
  public getTotalQuantity(): number {
    return this._items.reduce((total, item) => total + item.quantity.value, 0);
  }

  /**
   * 注文項目から総額を再計算
   */
  public recalculateTotalAmount(): Price {
    let total = Price.create(0);
    for (const item of this._items) {
      total = total.add(item.calculateSubtotal());
    }
    return total;
  }

  /**
   * 指定ユーザーの注文かチェック
   */
  public isForUser(userId: UserId): boolean {
    return this._userId.equals(userId);
  }

  /**
   * 注文にアイテムがあるかチェック
   */
  public hasItems(): boolean {
    return this._items.length > 0;
  }

  /**
   * 注文ステータスを更新する（新しいインスタンスを返す）
   */
  public updateStatus(newStatus: OrderStatus): Order {
    // ステータス遷移のバリデーション
    if (!this._status.canTransitionTo(newStatus.value)) {
      throw new Error(
        `Cannot transition from ${this._status.value} to ${newStatus.value}. ` +
        `Valid transitions: ${this._status.getValidTransitions().join(', ')}`
      );
    }

    return new Order(
      this._id,
      this._userId,
      this._totalAmount,
      newStatus,
      this._shippingAddress,
      this._shippingPhone,
      this._items,
      this._notes,
      this._createdAt,
      new Date() // updatedAtを更新
    );
  }

  /**
   * 注文を確定する（新しいインスタンスを返す）
   */
  public confirm(): Order {
    const confirmedStatus = OrderStatus.create('confirmed');
    return this.updateStatus(confirmedStatus);
  }

  /**
   * 注文を発送済みにする（新しいインスタンスを返す）
   */
  public ship(): Order {
    const shippedStatus = OrderStatus.create('shipped');
    return this.updateStatus(shippedStatus);
  }

  /**
   * 注文を配送完了にする（新しいインスタンスを返す）
   */
  public deliver(): Order {
    const deliveredStatus = OrderStatus.create('delivered');
    return this.updateStatus(deliveredStatus);
  }

  /**
   * 注文をキャンセルする（新しいインスタンスを返す）
   */
  public cancel(): Order {
    const cancelledStatus = OrderStatus.create('cancelled');
    return this.updateStatus(cancelledStatus);
  }

  /**
   * 配送情報を更新する（新しいインスタンスを返す）
   */
  public updateShippingInfo(address?: string, phone?: string, notes?: string): Order {
    return new Order(
      this._id,
      this._userId,
      this._totalAmount,
      this._status,
      address || this._shippingAddress,
      phone || this._shippingPhone,
      this._items,
      notes !== undefined ? notes : this._notes,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 等価性チェック
   */
  public equals(other: Order): boolean {
    return this._id.equals(other._id);
  }

  /**
   * JSON表現
   */
  public toJSON(): object {
    const recalculatedTotal = this.recalculateTotalAmount();

    return {
      id: this._id.toJSON(),
      userId: this._userId.toJSON(),
      totalAmount: this._totalAmount.toJSON(),
      totalAmountFormatted: this._totalAmount.toFormattedString(),
      recalculatedTotal: recalculatedTotal.toJSON(),
      recalculatedTotalFormatted: recalculatedTotal.toFormattedString(),
      status: this._status.toJSON(),
      statusJapanese: this._status.getJapaneseName(),
      isCompleted: this._status.isCompleted(),
      isActive: this._status.isActive(),
      validTransitions: this._status.getValidTransitions(),
      shippingAddress: this._shippingAddress,
      shippingPhone: this._shippingPhone,
      notes: this._notes,
      items: this._items.map(item => item.toJSON()),
      itemCount: this.itemCount,
      totalQuantity: this.getTotalQuantity(),
      hasItems: this.hasItems(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }

  /**
   * 商品情報と一緒のJSON表現
   */
  public toJSONWithProducts(products: Product[]): object {
    const itemsWithProducts = this._items.map(item => {
      const product = products.find(p => p.id.equals(item.productId));
      if (!product) {
        throw new Error(`Product not found for order item: ${item.productId.value}`);
      }
      return item.toJSONWithProduct(product);
    });

    return {
      ...this.toJSON(),
      items: itemsWithProducts
    };
  }
}