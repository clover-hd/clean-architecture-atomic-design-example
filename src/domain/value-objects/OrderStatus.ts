/**
 * OrderStatus Value Object
 * 型安全性と不変性を保証するOrderStatus実装
 */
export type OrderStatusType =
  | 'pending'    // 注文待ち
  | 'confirmed'  // 注文確定
  | 'shipped'    // 発送済み
  | 'delivered'  // 配送完了
  | 'cancelled'; // キャンセル

export class OrderStatus {
  private readonly _value: OrderStatusType;

  private constructor(value: OrderStatusType) {
    this._value = value;
  }

  /**
   * 有効なステータス一覧
   */
  public static readonly VALID_STATUSES: OrderStatusType[] = [
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
  ];

  /**
   * ステータスの日本語表示
   */
  private static readonly JAPANESE_NAMES: Record<OrderStatusType, string> = {
    pending: '注文待ち',
    confirmed: '注文確定',
    shipped: '発送済み',
    delivered: '配送完了',
    cancelled: 'キャンセル'
  };

  /**
   * ステータス遷移ルール
   */
  private static readonly VALID_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

  /**
   * OrderStatusを作成する
   * @param value ステータス文字列
   * @throws {Error} 無効なステータスの場合
   */
  public static create(value: string): OrderStatus {
    if (!value || typeof value !== 'string') {
      throw new Error('Status value must be a non-empty string');
    }

    const trimmedValue = value.trim().toLowerCase() as OrderStatusType;

    if (!this.VALID_STATUSES.includes(trimmedValue)) {
      throw new Error(`Invalid status: ${value}. Valid statuses are: ${this.VALID_STATUSES.join(', ')}`);
    }

    return new OrderStatus(trimmedValue);
  }

  /**
   * デフォルトのステータス（pending）を作成する
   */
  public static createDefault(): OrderStatus {
    return new OrderStatus('pending');
  }

  /**
   * 値を取得する（不変性を保証）
   */
  public get value(): OrderStatusType {
    return this._value;
  }

  /**
   * 日本語名を取得する
   */
  public getJapaneseName(): string {
    return OrderStatus.JAPANESE_NAMES[this._value];
  }

  /**
   * 指定されたステータスかどうかチェック
   */
  public is(status: OrderStatusType): boolean {
    return this._value === status;
  }

  /**
   * 指定されたステータスに遷移可能かチェック
   */
  public canTransitionTo(nextStatus: OrderStatusType): boolean {
    return OrderStatus.VALID_TRANSITIONS[this._value].includes(nextStatus);
  }

  /**
   * 遷移可能なステータス一覧を取得
   */
  public getValidTransitions(): OrderStatusType[] {
    return [...OrderStatus.VALID_TRANSITIONS[this._value]];
  }

  /**
   * 注文が完了状態かどうか
   */
  public isCompleted(): boolean {
    return this._value === 'delivered' || this._value === 'cancelled';
  }

  /**
   * 注文がアクティブかどうか（キャンセル・配送完了以外）
   */
  public isActive(): boolean {
    return !this.isCompleted();
  }

  /**
   * 等価性チェック
   */
  public equals(other: OrderStatus): boolean {
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