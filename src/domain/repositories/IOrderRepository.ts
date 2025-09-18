import { Order, OrderItem } from '../entities';
import { OrderId, UserId, OrderStatus, Price } from '../value-objects';

/**
 * Order Repository Interface
 * 注文データアクセスの抽象化
 * 依存関係逆転原則により、Domain層で定義
 */
export interface IOrderRepository {
  /**
   * 注文IDで注文を取得
   * @param id 注文ID
   * @returns 注文エンティティまたはnull
   */
  findById(id: OrderId): Promise<Order | null>;

  /**
   * 複数の注文IDで注文を取得
   * @param ids 注文IDの配列
   * @returns 注文エンティティの配列
   */
  findByIds(ids: OrderId[]): Promise<Order[]>;

  /**
   * ユーザーIDで注文を取得
   * @param userId ユーザーID
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 注文エンティティの配列
   */
  findByUserId(userId: UserId, limit?: number, offset?: number): Promise<Order[]>;

  /**
   * ステータスで注文を取得
   * @param status 注文ステータス
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 注文エンティティの配列
   */
  findByStatus(status: OrderStatus, limit?: number, offset?: number): Promise<Order[]>;

  /**
   * ユーザーIDとステータスで注文を取得
   * @param userId ユーザーID
   * @param status 注文ステータス
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 注文エンティティの配列
   */
  findByUserIdAndStatus(userId: UserId, status: OrderStatus, limit?: number, offset?: number): Promise<Order[]>;

  /**
   * 期間で注文を取得
   * @param startDate 開始日時
   * @param endDate 終了日時
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 注文エンティティの配列
   */
  findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Order[]>;

  /**
   * 金額範囲で注文を取得
   * @param minAmount 最低金額
   * @param maxAmount 最高金額
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 注文エンティティの配列
   */
  findByAmountRange(minAmount: Price, maxAmount: Price, limit?: number, offset?: number): Promise<Order[]>;

  /**
   * 複合条件で注文を検索
   * @param criteria 検索条件
   * @returns 注文エンティティの配列
   */
  findByCriteria(criteria: OrderSearchCriteria): Promise<Order[]>;

  /**
   * 全注文を取得
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 注文エンティティの配列
   */
  findAll(limit?: number, offset?: number): Promise<Order[]>;

  /**
   * 注文を保存（作成・更新）
   * @param order 注文エンティティ
   * @returns 保存された注文エンティティ
   */
  save(order: Order): Promise<Order>;

  /**
   * 新規注文を作成
   * @param order 注文エンティティ
   * @returns 作成された注文エンティティ
   */
  create(order: Order): Promise<Order>;

  /**
   * 注文情報を更新
   * @param order 注文エンティティ
   * @returns 更新された注文エンティティ
   */
  update(order: Order): Promise<Order>;

  /**
   * 注文を削除
   * @param id 注文ID
   */
  delete(id: OrderId): Promise<void>;

  /**
   * 注文の存在チェック
   * @param id 注文ID
   * @returns 存在する場合true
   */
  existsById(id: OrderId): Promise<boolean>;

  /**
   * 注文総数を取得
   * @returns 注文総数
   */
  count(): Promise<number>;

  /**
   * ユーザー別注文数を取得
   * @param userId ユーザーID
   * @returns ユーザー別注文数
   */
  countByUserId(userId: UserId): Promise<number>;

  /**
   * ステータス別注文数を取得
   * @param status 注文ステータス
   * @returns ステータス別注文数
   */
  countByStatus(status: OrderStatus): Promise<number>;

  /**
   * 検索条件にマッチする注文数を取得
   * @param criteria 検索条件
   * @returns マッチする注文数
   */
  countByCriteria(criteria: OrderSearchCriteria): Promise<number>;

  /**
   * 注文項目を取得
   * @param orderId 注文ID
   * @returns 注文項目エンティティの配列
   */
  getOrderItems(orderId: OrderId): Promise<OrderItem[]>;

  /**
   * 注文統計情報を取得
   * @param criteria 統計条件
   * @returns 注文統計情報
   */
  getOrderStatistics(criteria?: OrderStatisticsCriteria): Promise<OrderStatistics>;

  /**
   * 売上統計を取得
   * @param criteria 統計条件
   * @returns 売上統計情報
   */
  getSalesStatistics(criteria?: OrderStatisticsCriteria): Promise<SalesStatistics>;

  /**
   * ユーザーの最新注文を取得
   * @param userId ユーザーID
   * @returns 最新注文エンティティまたはnull
   */
  findLatestByUserId(userId: UserId): Promise<Order | null>;

  /**
   * 注文ステータスを一括更新
   * @param orderIds 注文IDの配列
   * @param newStatus 新しいステータス
   * @returns 更新された注文数
   */
  bulkUpdateStatus(orderIds: OrderId[], newStatus: OrderStatus): Promise<number>;
}

/**
 * 注文検索条件
 */
export interface OrderSearchCriteria {
  /** ユーザーID */
  userId?: UserId;
  /** 注文ステータス */
  status?: OrderStatus;
  /** 開始日時 */
  startDate?: Date;
  /** 終了日時 */
  endDate?: Date;
  /** 最低金額 */
  minAmount?: Price;
  /** 最高金額 */
  maxAmount?: Price;
  /** 取得件数制限 */
  limit?: number;
  /** 取得開始位置 */
  offset?: number;
  /** ソート条件 */
  sortBy?: OrderSortOption;
  /** ソート順序 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 注文ソートオプション
 */
export type OrderSortOption =
  | 'id'
  | 'userId'
  | 'totalAmount'
  | 'status'
  | 'createdAt'
  | 'updatedAt';

/**
 * 注文統計条件
 */
export interface OrderStatisticsCriteria {
  /** 開始日時 */
  startDate?: Date;
  /** 終了日時 */
  endDate?: Date;
  /** ユーザーID */
  userId?: UserId;
  /** 注文ステータス */
  status?: OrderStatus;
}

/**
 * 注文統計情報
 */
export interface OrderStatistics {
  /** 総注文数 */
  totalOrders: number;
  /** ステータス別注文数 */
  ordersByStatus: Record<string, number>;
  /** 平均注文金額 */
  averageOrderAmount: number;
  /** 総売上金額 */
  totalSalesAmount: number;
  /** 期間内の注文数 */
  ordersInPeriod: number;
  /** ユニークユーザー数 */
  uniqueCustomers: number;
  /** リピートユーザー数 */
  repeatCustomers: number;
}

/**
 * 売上統計情報
 */
export interface SalesStatistics {
  /** 日別売上 */
  dailySales: DailySales[];
  /** 月別売上 */
  monthlySales: MonthlySales[];
  /** 最高売上日 */
  topSalesDay: DailySales | null;
  /** 売上成長率 */
  growthRate: number;
  /** 総売上金額 */
  totalSales: number;
}

/**
 * 日別売上
 */
export interface DailySales {
  date: string; // YYYY-MM-DD
  sales: number;
  orderCount: number;
  averageOrderValue: number;
}

/**
 * 月別売上
 */
export interface MonthlySales {
  month: string; // YYYY-MM
  sales: number;
  orderCount: number;
  averageOrderValue: number;
}