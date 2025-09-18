/**
 * モックファクトリー
 * 各層のテストで使用するモックオブジェクトを生成
 */

import { jest } from '@jest/globals';
import {
  IUserRepository,
  IProductRepository,
  ICartRepository,
  IOrderRepository
} from '../../src/domain/repositories';
import {
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem
} from '../../src/domain/entities';
import {
  UserId,
  Email,
  Price,
  ProductId,
  OrderId,
  Quantity,
  ProductCategory,
  OrderStatus
} from '../../src/domain/value-objects';
import {
  UserDomainService,
  ProductDomainService,
  CartDomainService,
  OrderDomainService
} from '../../src/domain/services';

export class MockFactory {
  /**
   * IUserRepository のモックを作成
   */
  public static createUserRepositoryMock(): jest.Mocked<IUserRepository> {
    return {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
      existsById: jest.fn(),
      count: jest.fn(),
      findAdmins: jest.fn(),
      countAdmins: jest.fn(),
      findCreatedAfter: jest.fn(),
      findUpdatedAfter: jest.fn(),
      findByCriteria: jest.fn(),
      createMany: jest.fn(),
      updatePartial: jest.fn()
    } as jest.Mocked<IUserRepository>;
  }

  /**
   * IProductRepository のモックを作成
   */
  public static createProductRepositoryMock(): jest.Mocked<IProductRepository> {
    return {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCategory: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      findFeatured: jest.fn(),
      findByPriceRange: jest.fn(),
      findLowStock: jest.fn(),
      updateStock: jest.fn(),
      count: jest.fn(),
      countByCategory: jest.fn()
    } as jest.Mocked<IProductRepository>;
  }

  /**
   * ICartRepository のモックを作成
   */
  public static createCartRepositoryMock(): jest.Mocked<ICartRepository> {
    return {
      findBySessionId: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      findItems: jest.fn(),
      getTotalAmount: jest.fn(),
      getTotalQuantity: jest.fn()
    } as jest.Mocked<ICartRepository>;
  }

  /**
   * IOrderRepository のモックを作成
   */
  public static createOrderRepositoryMock(): jest.Mocked<IOrderRepository> {
    return {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
      findByStatus: jest.fn(),
      count: jest.fn(),
      countByUser: jest.fn(),
      findRecent: jest.fn(),
      getTotalSales: jest.fn()
    } as jest.Mocked<IOrderRepository>;
  }

  /**
   * UserDomainService のモックを作成
   */
  public static createUserDomainServiceMock(): jest.Mocked<UserDomainService> {
    return {
      validateUserCreation: jest.fn(),
      validateUserUpdate: jest.fn(),
      canPromoteToAdmin: jest.fn(),
      canDemoteFromAdmin: jest.fn(),
      isEmailAvailable: jest.fn(),
      validatePasswordChange: jest.fn()
    } as jest.Mocked<UserDomainService>;
  }

  /**
   * ProductDomainService のモックを作成
   */
  public static createProductDomainServiceMock(): jest.Mocked<ProductDomainService> {
    return {
      validateProductCreation: jest.fn(),
      validateStockUpdate: jest.fn(),
      calculateDiscountedPrice: jest.fn(),
      isProductAvailable: jest.fn(),
      canUpdateProduct: jest.fn()
    } as jest.Mocked<ProductDomainService>;
  }

  /**
   * CartDomainService のモックを作成
   */
  public static createCartDomainServiceMock(): jest.Mocked<CartDomainService> {
    return {
      validateAddToCart: jest.fn(),
      validateCartCheckout: jest.fn(),
      calculateTotalAmount: jest.fn(),
      mergeCartItems: jest.fn(),
      validateCartItem: jest.fn()
    } as jest.Mocked<CartDomainService>;
  }

  /**
   * OrderDomainService のモックを作成
   */
  public static createOrderDomainServiceMock(): jest.Mocked<OrderDomainService> {
    return {
      validateOrderCreation: jest.fn(),
      validateStatusTransition: jest.fn(),
      calculateOrderTotal: jest.fn(),
      canCancelOrder: jest.fn(),
      canRefundOrder: jest.fn()
    } as jest.Mocked<OrderDomainService>;
  }

  /**
   * Express Request のモックを作成
   */
  public static createRequestMock(options: {
    body?: any;
    params?: any;
    query?: any;
    session?: any;
    headers?: any;
    user?: any;
  } = {}): any {
    return {
      body: options.body || {},
      params: options.params || {},
      query: options.query || {},
      session: options.session || {},
      headers: options.headers || {},
      user: options.user || null,
      ...options
    };
  }

  /**
   * Express Response のモックを作成
   */
  public static createResponseMock(): any {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.render = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  }

  /**
   * Next関数のモックを作成
   */
  public static createNextMock(): jest.Mock {
    return jest.fn();
  }

  /**
   * BCrypt のモックを作成
   */
  public static createBcryptMock(): any {
    return {
      hash: jest.fn().mockResolvedValue('hashed_password'),
      compare: jest.fn().mockResolvedValue(true),
      genSalt: jest.fn().mockResolvedValue('salt')
    };
  }

  /**
   * 複数のRepositoryモックを一括作成
   */
  public static createRepositoryMocks() {
    return {
      userRepository: this.createUserRepositoryMock(),
      productRepository: this.createProductRepositoryMock(),
      cartRepository: this.createCartRepositoryMock(),
      orderRepository: this.createOrderRepositoryMock()
    };
  }

  /**
   * 複数のDomainServiceモックを一括作成
   */
  public static createDomainServiceMocks() {
    return {
      userDomainService: this.createUserDomainServiceMock(),
      productDomainService: this.createProductDomainServiceMock(),
      cartDomainService: this.createCartDomainServiceMock(),
      orderDomainService: this.createOrderDomainServiceMock()
    };
  }
}