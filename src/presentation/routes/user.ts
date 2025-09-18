/**
 * ユーザー関連ルーター
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { UserController } from '../controllers';
import {
  requireAuth,
  csrfProtection,
  validationErrorHandler,
  asyncErrorCatcher,
  rateLimit
} from '../middleware';

// 依存関係注入用
import {
  GetUserProfileUseCase,
  UpdateUserProfileUseCase,
  GetOrderUseCase
} from '../../application/usecases';
import { UserRepository } from '../../infrastructure/repositories';

const router = Router();

// 依存関係の解決
const userRepository = new UserRepository();
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
const getOrderUseCase = new GetOrderUseCase(userRepository as any); // 型を調整

// コントローラーのインスタンス化
const userController = new UserController(
  getUserProfileUseCase,
  updateUserProfileUseCase,
  getOrderUseCase
);

// レート制限設定
const userApiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 20, // 最大20リクエスト
  message: 'Too many user operations. Please try again later.'
});

const profileUpdateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 3, // 最大3回の更新
  message: 'Too many profile update attempts. Please try again later.'
});

// バリデーション規則
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('ユーザー名は3文字以上50文字以下で入力してください')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('ユーザー名は英数字とアンダースコアのみ使用可能です'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('有効なメールアドレスを入力してください'),
  body('currentPassword')
    .optional()
    .isLength({ min: 1 })
    .withMessage('現在のパスワードを入力してください'),
  body('newPassword')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('新しいパスワードは8文字以上128文字以下で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新しいパスワードは小文字、大文字、数字を含む必要があります'),
  body('confirmNewPassword')
    .optional()
    .custom((value, { req }) => {
      if (req.body.newPassword && value !== req.body.newPassword) {
        throw new Error('新しいパスワードが一致しません');
      }
      return true;
    })
];

const orderIdValidation = [
  param('orderId')
    .isInt({ min: 1 })
    .withMessage('注文IDは1以上の整数である必要があります')
];

// ルート定義

/**
 * GET /user/profile - プロフィールページ表示
 */
router.get('/profile',
  requireAuth,
  asyncErrorCatcher(userController.profile)
);

/**
 * GET /api/user/profile - プロフィール取得API
 */
router.get('/api/profile',
  userApiRateLimit,
  requireAuth,
  asyncErrorCatcher(userController.getProfile)
);

/**
 * GET /user/edit-profile - プロフィール編集ページ表示
 */
router.get('/edit-profile',
  requireAuth,
  csrfProtection,
  asyncErrorCatcher(userController.editProfile)
);

/**
 * POST /user/update-profile - プロフィール更新処理
 */
router.post('/update-profile',
  profileUpdateRateLimit,
  requireAuth,
  csrfProtection,
  updateProfileValidation,
  validationErrorHandler,
  asyncErrorCatcher(userController.updateProfile)
);

/**
 * PUT /api/user/profile - プロフィール更新API
 */
router.put('/api/profile',
  profileUpdateRateLimit,
  requireAuth,
  csrfProtection,
  updateProfileValidation,
  validationErrorHandler,
  asyncErrorCatcher(userController.updateProfile)
);

/**
 * GET /user/orders - 注文履歴ページ表示
 */
router.get('/orders',
  requireAuth,
  asyncErrorCatcher(userController.orderHistory)
);

/**
 * GET /user/orders/:orderId - 注文詳細ページ表示
 */
router.get('/orders/:orderId',
  requireAuth,
  orderIdValidation,
  validationErrorHandler,
  asyncErrorCatcher(userController.orderDetail)
);

/**
 * GET /api/user/orders/:orderId - 注文詳細取得API
 */
router.get('/api/orders/:orderId',
  userApiRateLimit,
  requireAuth,
  orderIdValidation,
  validationErrorHandler,
  asyncErrorCatcher(userController.orderDetail)
);

export default router;