/**
 * 認証関連ルーター
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers';
import {
  guestOnly,
  requireAuth,
  csrfProtection,
  validationErrorHandler,
  asyncErrorCatcher,
  rateLimit
} from '../middleware';

// 依存関係注入用（実際の実装では DIContainer を使用）
import {
  LoginUseCase,
  UserRegistrationUseCase
} from '../../application/usecases';
import { UserRepository } from '../../infrastructure/repositories';

const router = Router();

// 依存関係の解決（実際の実装では DIContainer で管理）
const userRepository = new UserRepository();
const loginUseCase = new LoginUseCase(userRepository);
const userRegistrationUseCase = new UserRegistrationUseCase(userRepository);

// コントローラーのインスタンス化
const authController = new AuthController(
  loginUseCase,
  userRegistrationUseCase
);

// レート制限設定
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回の試行
  message: 'Too many authentication attempts. Please try again later.'
});

// バリデーション規則
const loginValidation = [
  body('username')
    .trim()
    .isLength({ min: 1 })
    .withMessage('ユーザー名は必須です'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('パスワードは必須です')
];

const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('ユーザー名は3文字以上50文字以下で入力してください')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('ユーザー名は英数字とアンダースコアのみ使用可能です'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('有効なメールアドレスを入力してください'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('パスワードは8文字以上128文字以下で入力してください')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('パスワードは小文字、大文字、数字を含む必要があります'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('パスワードが一致しません');
      }
      return true;
    })
];

// ルート定義

/**
 * GET /auth/login - ログインページ表示
 */
router.get('/login',
  guestOnly,
  csrfProtection,
  asyncErrorCatcher(authController.showLoginForm)
);

/**
 * POST /auth/login - ログイン処理
 */
router.post('/login',
  authRateLimit,
  guestOnly,
  csrfProtection,
  loginValidation,
  validationErrorHandler,
  asyncErrorCatcher(authController.login)
);

/**
 * GET /auth/register - ユーザー登録ページ表示
 */
router.get('/register',
  guestOnly,
  csrfProtection,
  asyncErrorCatcher(authController.showRegisterForm)
);

/**
 * POST /auth/register - ユーザー登録処理
 */
router.post('/register',
  authRateLimit,
  guestOnly,
  csrfProtection,
  registerValidation,
  validationErrorHandler,
  asyncErrorCatcher(authController.register)
);

/**
 * POST /auth/logout - ログアウト処理
 */
router.post('/logout',
  requireAuth,
  csrfProtection,
  asyncErrorCatcher(authController.logout)
);

/**
 * GET /auth/logout - ログアウト処理（GETリクエスト対応）
 */
router.get('/logout',
  requireAuth,
  asyncErrorCatcher(authController.logout)
);

/**
 * GET /api/auth/status - 認証状態確認API
 */
router.get('/api/status',
  asyncErrorCatcher(authController.checkAuthStatus)
);

export default router;