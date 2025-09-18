/**
 * 認証ミドルウェア
 * 認証状態の確認と権限チェックを行う
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * 認証必須ミドルウェア
 * ログインしていない場合はログインページにリダイレクト
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session?.isAuthenticated || !req.session?.userId) {
    // APIリクエストの場合は401を返す
    if (req.headers.accept?.includes('application/json') ||
        req.headers['content-type']?.includes('application/json') ||
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // フラッシュメッセージを設定
    if (!req.session.flashErrors) {
      req.session.flashErrors = [];
    }
    req.session.flashErrors.push('ログインが必要です');

    // 元のURLを保存してログイン後にリダイレクト
    req.session.returnTo = req.originalUrl;

    res.redirect('/auth/login');
    return;
  }

  // ユーザー情報をリクエストに添付
  req.user = {
    id: req.session.userId,
    username: req.session.username || '',
    email: '' // 必要に応じてセッションから取得
  };

  next();
};

/**
 * 認証任意ミドルウェア
 * ログインしている場合はユーザー情報をリクエストに添付
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.session?.isAuthenticated && req.session?.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.username || '',
      email: ''
    };
  }

  next();
};

/**
 * 管理者権限必須ミドルウェア
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // まず認証チェック
  if (!req.session?.isAuthenticated || !req.session?.userId) {
    if (req.headers.accept?.includes('application/json') ||
        req.headers['content-type']?.includes('application/json') ||
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    res.redirect('/auth/login');
    return;
  }

  // 管理者権限チェック
  // TODO: 実際の実装では、ユーザーのロール情報をデータベースから取得
  const isAdmin = req.session.username === 'admin';

  if (!isAdmin) {
    if (req.headers.accept?.includes('application/json') ||
        req.headers['content-type']?.includes('application/json') ||
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
      return;
    }

    // フラッシュメッセージを設定
    if (!req.session.flashErrors) {
      req.session.flashErrors = [];
    }
    req.session.flashErrors.push('管理者権限が必要です');

    res.redirect('/');
    return;
  }

  // ユーザー情報をリクエストに添付
  req.user = {
    id: req.session.userId,
    username: req.session.username || '',
    email: ''
  };

  next();
};

/**
 * ゲスト専用ミドルウェア
 * ログイン済みユーザーをホームページにリダイレクト
 */
export const guestOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.session?.isAuthenticated && req.session?.userId) {
    // APIリクエストの場合は既にログイン済みの旨を返す
    if (req.headers.accept?.includes('application/json')) {
      res.status(200).json({
        success: true,
        message: 'Already authenticated',
        data: {
          userId: req.session.userId,
          username: req.session.username
        }
      });
      return;
    }

    res.redirect('/');
    return;
  }

  next();
};

/**
 * セッション初期化ミドルウェア
 * セッションの基本構造を初期化
 */
export const initializeSession = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // セッションの基本プロパティを初期化
  if (!req.session.flashErrors) {
    req.session.flashErrors = [];
  }

  if (!req.session.flashMessages) {
    req.session.flashMessages = [];
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  next();
};

/**
 * CSRF保護ミドルウェア（簡易版）
 * 実際の本番環境では、より堅牢なCSRF保護を実装する必要があります
 */
export const csrfProtection = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // GETリクエストはCSRFトークンを生成
  if (req.method === 'GET') {
    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    // レスポンスのローカル変数にCSRFトークンを設定（EJSテンプレートで使用）
    res.locals.csrfToken = csrfToken;
  }

  // POST、PUT、DELETE リクエストはCSRFトークンを検証
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const sessionToken = req.session.csrfToken;
    const requestToken = req.body._csrf || req.headers['x-csrf-token'];

    if (!sessionToken || !requestToken || sessionToken !== requestToken) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(403).json({
          success: false,
          message: 'Invalid CSRF token'
        });
        return;
      }

      res.status(403).render('error', {
        title: 'セキュリティエラー',
        message: 'CSRFトークンが無効です',
        statusCode: 403
      });
      return;
    }
  }

  next();
};

/**
 * CSRFトークン生成
 */
function generateCSRFToken(): string {
  return `csrf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * レート制限ミドルウェア（簡易版）
 * 実際の本番環境では、Redisなどを使用したより堅牢な実装が必要
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // 古いエントリを削除
    const current = rateLimitStore.get(key);
    if (!current || current.resetTime < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      next();
      return;
    }

    // カウントを増加
    current.count++;

    if (current.count > options.max) {
      const message = options.message || 'Too many requests';

      if (req.headers.accept?.includes('application/json')) {
        res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        });
        return;
      }

      res.status(429).render('error', {
        title: 'レート制限',
        message,
        statusCode: 429
      });
      return;
    }

    next();
  };
};