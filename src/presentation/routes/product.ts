/**
 * 商品関連ルーター
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import { ProductController } from '../controllers';
import {
  optionalAuth,
  validationErrorHandler,
  asyncErrorCatcher,
  rateLimit
} from '../middleware';

// 依存関係注入用
import {
  GetProductDetailUseCase,
  GetProductListUseCase
} from '../../application/usecases';
import { ProductRepository } from '../../infrastructure/repositories';
import { ProductDomainService } from '../../domain/services';

const router = Router();

// 依存関係の解決
const productRepository = new ProductRepository();
const productDomainService = new ProductDomainService();
const getProductDetailUseCase = new GetProductDetailUseCase(
  productRepository,
  productDomainService
);
const getProductListUseCase = new GetProductListUseCase(
  productRepository,
  productDomainService
);

// コントローラーのインスタンス化
const productController = new ProductController(
  getProductDetailUseCase,
  getProductListUseCase
);

// レート制限設定
const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 60, // 最大60リクエスト
  message: 'Too many API requests. Please try again later.'
});

const suggestionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 30, // 最大30リクエスト
  message: 'Too many suggestion requests. Please try again later.'
});

// バリデーション規則
const productIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('商品IDは1以上の整数である必要があります')
];

const categoryValidation = [
  param('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('カテゴリ名は1〜50文字で入力してください')
];

const availabilityValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('商品IDは1以上の整数である必要があります'),
  query('quantity')
    .optional()
    .isInt({ min: 1, max: 999 })
    .withMessage('数量は1〜999の範囲で指定してください')
];

const suggestionValidation = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('検索キーワードは2〜100文字で入力してください')
];

const productListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('表示件数は1〜100の範囲で指定してください'),
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('検索キーワードは100文字以内で入力してください'),
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('カテゴリは50文字以内で入力してください'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小価格は0以上である必要があります'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最大価格は0以上である必要があります'),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'created_at'])
    .withMessage('並び順は name, price, created_at のいずれかである必要があります'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('ソート順は asc または desc である必要があります')
];

// ルート定義

/**
 * GET /api/product/:id - 商品詳細API
 */
router.get('/api/:id',
  apiRateLimit,
  optionalAuth,
  productIdValidation,
  validationErrorHandler,
  asyncErrorCatcher(productController.getDetail)
);

/**
 * GET /api/products - 商品一覧API
 */
router.get('/api',
  apiRateLimit,
  optionalAuth,
  productListValidation,
  validationErrorHandler,
  asyncErrorCatcher(productController.getList)
);

/**
 * GET /api/product/:id/availability - 商品在庫確認API
 */
router.get('/api/:id/availability',
  apiRateLimit,
  optionalAuth,
  availabilityValidation,
  validationErrorHandler,
  asyncErrorCatcher(productController.checkAvailability)
);

/**
 * GET /api/products/suggestions - 商品検索サジェストAPI
 */
router.get('/api/suggestions',
  suggestionRateLimit,
  optionalAuth,
  suggestionValidation,
  validationErrorHandler,
  asyncErrorCatcher(productController.searchSuggestions)
);

/**
 * GET /api/products/category/:category - カテゴリ別商品一覧API
 */
router.get('/api/category/:category',
  apiRateLimit,
  optionalAuth,
  categoryValidation,
  productListValidation,
  validationErrorHandler,
  asyncErrorCatcher(productController.byCategory)
);

/**
 * GET /product/:id - 商品詳細ページ
 */
router.get('/:id',
  optionalAuth,
  productIdValidation,
  validationErrorHandler,
  asyncErrorCatcher(productController.detail)
);

/**
 * GET / - 商品一覧ページ (handles /products)
 */
router.get('/',
  optionalAuth,
  productListValidation,
  validationErrorHandler,
  asyncErrorCatcher(productController.list)
);

export default router;