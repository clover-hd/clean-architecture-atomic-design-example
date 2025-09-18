/**
 * Domain Services エクスポート
 *
 * 複数Entityにまたがるビジネスロジックを管理する
 * Domain Servicesの集約
 */

export { UserDomainService, type UserStatistics } from './UserDomainService';
export {
  ProductDomainService,
  type PricingAnalysis,
  type ProductStatistics
} from './ProductDomainService';
export {
  OrderDomainService,
  type OrderValueAnalysis
} from './OrderDomainService';
export {
  CartDomainService,
  type CartPricingValidation,
  type PriceInconsistency,
  type CartOptimizationSuggestions,
  type CartAbandonmentAnalysis,
  type ExtendedCartStatistics
} from './CartDomainService';