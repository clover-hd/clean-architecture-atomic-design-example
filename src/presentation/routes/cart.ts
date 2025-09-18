/**
 * カート関連ルーター
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { CartController } from '../controllers';
import {
  requireAuth,
  csrfProtection,
  validationErrorHandler,
  asyncErrorCatcher,
  rateLimit
} from '../middleware';

// 依存関係注入用
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase
} from '../../application/usecases';
import { UserRepository, ProductRepository } from '../../infrastructure/repositories';

const router = Router();

// 依存関係の解決（実際の実装では DIContainer で管理）
const userRepository = new UserRepository();
const productRepository = new ProductRepository();
const getCartUseCase = new GetCartUseCase(userRepository as any, productRepository);
const addToCartUseCase = new AddToCartUseCase(userRepository as any, productRepository);
const updateCartItemUseCase = new UpdateCartItemUseCase(userRepository as any, productRepository);
const removeFromCartUseCase = new RemoveFromCartUseCase(userRepository as any, productRepository);

// コントローラーのインスタンス化
const cartController = new CartController(
  getCartUseCase,
  addToCartUseCase,
  updateCartItemUseCase,
  removeFromCartUseCase
);

// レート制限設定
const cartApiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 30, // 最大30リクエスト
  message: 'Too many cart operations. Please try again later.'
});

// バリデーション規則
const addToCartValidation = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('商品IDは1以上の整数である必要があります'),
  body('quantity')
    .isInt({ min: 1, max: 999 })
    .withMessage('数量は1〜999の範囲で指定してください')
];

const updateCartItemValidation = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('商品IDは1以上の整数である必要があります'),
  body('quantity')
    .isInt({ min: 0, max: 999 })
    .withMessage('数量は0〜999の範囲で指定してください')
];

const removeFromCartValidation = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('商品IDは1以上の整数である必要があります')
];

// ルート定義

/**
 * GET /cart - カートページ表示
 */
router.get('/',
  requireAuth,
  asyncErrorCatcher(cartController.index)
);

/**
 * GET /api/cart - カート内容取得API
 */
router.get('/api',
  cartApiRateLimit,
  requireAuth,
  asyncErrorCatcher(cartController.getCart)
);

/**
 * GET /api/cart/count - カート商品数取得API
 */
router.get('/api/count',
  cartApiRateLimit,
  requireAuth,
  asyncErrorCatcher(cartController.getItemCount)
);

/**
 * POST /api/cart/add - カートに商品追加API
 */
router.post('/api/add',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  addToCartValidation,
  validationErrorHandler,
  asyncErrorCatcher(cartController.addItem)
);

/**
 * PUT /api/cart/update - カート商品更新API
 */
router.put('/api/update',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  updateCartItemValidation,
  validationErrorHandler,
  asyncErrorCatcher(cartController.updateItem)
);

/**
 * DELETE /api/cart/remove/:productId - カートから商品削除API
 */
router.delete('/api/remove/:productId',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  removeFromCartValidation,
  validationErrorHandler,
  asyncErrorCatcher(cartController.removeItem)
);

/**
 * DELETE /api/cart/clear - カート全削除API
 */
router.delete('/api/clear',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  asyncErrorCatcher(cartController.clear)
);

// ===========================================
// API Routes for /api/cart/* mounting
// These routes handle frontend requests to /api/cart/*
// ===========================================

/**
 * POST /add - カートに商品追加API (for /api/cart/add)
 */
router.post('/add',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  addToCartValidation,
  validationErrorHandler,
  asyncErrorCatcher(cartController.addItem)
);

/**
 * PUT /update - カート商品更新API (for /api/cart/update)
 */
router.put('/update',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  updateCartItemValidation,
  validationErrorHandler,
  asyncErrorCatcher(cartController.updateItem)
);

/**
 * DELETE /remove/:productId - カートから商品削除API (for /api/cart/remove/:productId)
 */
router.delete('/remove/:productId',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  removeFromCartValidation,
  validationErrorHandler,
  asyncErrorCatcher(cartController.removeItem)
);

/**
 * DELETE /clear - カート全削除API (for /api/cart/clear)
 */
router.delete('/clear',
  cartApiRateLimit,
  requireAuth,
  csrfProtection,
  asyncErrorCatcher(cartController.clear)
);

/**
 * GET / - カート内容取得API (for /api/cart)
 */
router.get('/',
  cartApiRateLimit,
  requireAuth,
  asyncErrorCatcher(cartController.getCart)
);

/**
 * GET /count - カート商品数取得API (for /api/cart/count)
 */
router.get('/count',
  cartApiRateLimit,
  requireAuth,
  asyncErrorCatcher(cartController.getItemCount)
);

export default router;