/**
 * Domain Repository Interfaces エクスポート
 *
 * 依存関係逆転原則によりDomain層で定義される
 * Repository Interfacesの集約
 */

export type { IUserRepository } from './IUserRepository';
export type { IProductRepository } from './IProductRepository';
export type { ProductSearchCriteria, ProductSortOption } from './IProductRepository';
export type { ICartRepository } from './ICartRepository';
export type { CartStatistics } from './ICartRepository';
export type { IOrderRepository } from './IOrderRepository';
export type {
  OrderSearchCriteria,
  OrderSortOption,
  OrderStatisticsCriteria,
  OrderStatistics,
  SalesStatistics,
  DailySales,
  MonthlySales
} from './IOrderRepository';