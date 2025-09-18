/**
 * ホーム関連ルーター
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { HomeController } from '../controllers';
import {
  optionalAuth,
  validationErrorHandler,
  asyncErrorCatcher,
  rateLimit
} from '../middleware';

// 依存関係注入用
import {
  GetProductListUseCase
} from '../../application/usecases';
import { ProductRepository } from '../../infrastructure/repositories';
import { ProductDomainService } from '../../domain/services';

const router = Router();

// 依存関係の解決
const productRepository = new ProductRepository();
const productDomainService = new ProductDomainService();
const getProductListUseCase = new GetProductListUseCase(
  productRepository,
  productDomainService
);

// コントローラーのインスタンス化
const homeController = new HomeController(getProductListUseCase);

// レート制限設定（検索API用）
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 30, // 最大30回の検索リクエスト
  message: 'Too many search requests. Please try again later.'
});

// バリデーション規則
const productSearchValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('表示件数は1〜100の範囲で指定してください'),
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
    .isIn(['name', 'price', 'createdAt', 'updatedAt'])
    .withMessage('並び順は name, price, createdAt, updatedAt のいずれかである必要があります'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('ソート順は asc または desc である必要があります')
];

// ルート定義

/**
 * GET / - トップページ
 */
router.get('/',
  optionalAuth,
  asyncErrorCatcher(homeController.index)
);

// Products route moved to product router

/**
 * GET /api/products/search - 商品検索API
 */
router.get('/api/products/search',
  searchRateLimit,
  optionalAuth,
  productSearchValidation,
  validationErrorHandler,
  asyncErrorCatcher(homeController.searchProducts)
);

export default router;