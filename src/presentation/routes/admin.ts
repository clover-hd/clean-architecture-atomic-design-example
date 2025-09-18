/**
 * 管理者関連ルーター
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { AdminController } from '../controllers';
import {
  requireAdmin,
  csrfProtection,
  validationErrorHandler,
  asyncErrorCatcher,
  rateLimit
} from '../middleware';

const router = Router();

// 依存関係の解決（管理者用Use Casesが実装されたら追加）
// TODO: 管理者用Use Casesを実装後にDI設定を追加

// コントローラーのインスタンス化
const adminController = new AdminController();

// レート制限設定
const adminApiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 30, // 最大30リクエスト
  message: 'Too many admin operations. Please try again later.'
});

const adminUpdateRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 10, // 最大10回の更新操作
  message: 'Too many admin updates. Please try again later.'
});

// バリデーション規則
const orderIdValidation = [
  param('orderId')
    .isInt({ min: 1 })
    .withMessage('注文IDは1以上の整数である必要があります')
];

const orderStatusUpdateValidation = [
  param('orderId')
    .isInt({ min: 1 })
    .withMessage('注文IDは1以上の整数である必要があります'),
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('有効なステータスを選択してください')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数である必要があります'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('表示件数は1〜100の範囲で指定してください')
];

const orderFilterValidation = [
  ...paginationValidation,
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('有効なステータスを選択してください')
];

const userSearchValidation = [
  ...paginationValidation,
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('検索キーワードは100文字以内で入力してください')
];

const productSearchValidation = [
  ...paginationValidation,
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
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'created_at', 'stock'])
    .withMessage('並び順は name, price, created_at, stock のいずれかである必要があります'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('ソート順は asc または desc である必要があります')
];

const statisticsValidation = [
  query('period')
    .optional()
    .isIn(['1d', '7d', '30d', '90d', '1y'])
    .withMessage('期間は 1d, 7d, 30d, 90d, 1y のいずれかである必要があります')
];

// ルート定義

/**
 * GET /admin - 管理者ダッシュボード
 */
router.get('/',
  requireAdmin,
  asyncErrorCatcher(adminController.dashboard)
);

/**
 * GET /admin/dashboard - 管理者ダッシュボード（リダイレクト対応）
 */
router.get('/dashboard',
  requireAdmin,
  asyncErrorCatcher(adminController.dashboard)
);

/**
 * GET /admin/orders - 注文管理ページ
 */
router.get('/orders',
  requireAdmin,
  orderFilterValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.orders)
);

/**
 * GET /api/admin/orders - 注文管理API
 */
router.get('/api/orders',
  adminApiRateLimit,
  requireAdmin,
  orderFilterValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.orders)
);

/**
 * PUT /api/admin/orders/:orderId/status - 注文ステータス更新API
 */
router.put('/api/orders/:orderId/status',
  adminUpdateRateLimit,
  requireAdmin,
  csrfProtection,
  orderStatusUpdateValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.updateOrderStatus)
);

/**
 * GET /admin/users - ユーザー管理ページ
 */
router.get('/users',
  requireAdmin,
  userSearchValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.users)
);

/**
 * GET /api/admin/users - ユーザー管理API
 */
router.get('/api/users',
  adminApiRateLimit,
  requireAdmin,
  userSearchValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.users)
);

/**
 * GET /admin/products - 商品管理ページ
 */
router.get('/products',
  requireAdmin,
  productSearchValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.products)
);

/**
 * GET /api/admin/products - 商品管理API
 */
router.get('/api/products',
  adminApiRateLimit,
  requireAdmin,
  productSearchValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.products)
);

/**
 * GET /api/admin/statistics - 統計データ取得API
 */
router.get('/api/statistics',
  adminApiRateLimit,
  requireAdmin,
  statisticsValidation,
  validationErrorHandler,
  asyncErrorCatcher(adminController.getStatistics)
);

export default router;