/**
 * エラーハンドリングミドルウェア
 * アプリケーション全体のエラーを統一的に処理
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, HttpError, ApiResponse } from '../types';

/**
 * 404 Not Found ハンドラー
 */
export const notFoundHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as HttpError;
  error.statusCode = 404;
  next(error);
};

/**
 * グローバルエラーハンドラー
 */
export const globalErrorHandler = (
  error: HttpError,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // エラーログ出力
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.session?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // APIリクエストの場合はJSONで返す
  if (req.headers.accept?.includes('application/json') || req.path.startsWith('/api/')) {
    const response: ApiResponse = {
      success: false,
      message: statusCode === 500 ? 'Internal Server Error' : message,
      errors: error.errors?.map(err => err.message)
    };

    // 本番環境では詳細なエラー情報を隠す
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      response.message = 'Internal Server Error';
    }

    res.status(statusCode).json(response);
    return;
  }

  // HTMLページの場合はエラーページを表示
  const errorPageData = {
    title: getErrorTitle(statusCode),
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'サーバーエラーが発生しました'
      : message,
    statusCode,
    user: req.session?.userId ? {
      id: req.session.userId,
      username: req.session.username
    } : null,
    isAuthenticated: !!(req.session?.isAuthenticated && req.session?.userId)
  };

  // 開発環境では詳細なエラー情報を表示
  if (process.env.NODE_ENV === 'development') {
    (errorPageData as any).stack = error.stack;
    (errorPageData as any).details = error;
  }

  res.status(statusCode).render('error', errorPageData);
};

/**
 * 非同期エラーキャッチャー
 * async/awaitを使用するルートハンドラーのエラーをキャッチ
 */
export const asyncErrorCatcher = (
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * バリデーションエラーハンドラー
 */
export const validationErrorHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // express-validatorの結果をチェック
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: any) => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    // APIリクエストの場合
    if (req.headers.accept?.includes('application/json')) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.map((err: any) => err.message)
      });
      return;
    }

    // HTMLページの場合はフラッシュメッセージに設定
    if (!req.session.flashErrors) {
      req.session.flashErrors = [];
    }

    validationErrors.forEach((error: any) => {
      req.session.flashErrors.push(error.message);
    });

    // 元のページにリダイレクト
    res.redirect('back');
    return;
  }

  next();
};

/**
 * データベースエラーハンドラー
 */
export const databaseErrorHandler = (
  error: any,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // SQLiteエラーのハンドリング
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const httpError = new Error('この値は既に使用されています') as HttpError;
    httpError.statusCode = 409;
    return next(httpError);
  }

  if (error.code === 'SQLITE_CONSTRAINT_FOREIGN_KEY') {
    const httpError = new Error('関連するデータが見つかりません') as HttpError;
    httpError.statusCode = 400;
    return next(httpError);
  }

  if (error.code === 'SQLITE_CONSTRAINT_NOT_NULL') {
    const httpError = new Error('必須項目が入力されていません') as HttpError;
    httpError.statusCode = 400;
    return next(httpError);
  }

  // その他のデータベースエラー
  if (error.name === 'DatabaseError') {
    const httpError = new Error('データベースエラーが発生しました') as HttpError;
    httpError.statusCode = 500;
    return next(httpError);
  }

  next(error);
};

/**
 * セキュリティエラーハンドラー
 */
export const securityErrorHandler = (
  error: any,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // CSRF エラー
  if (error.code === 'EBADCSRFTOKEN') {
    const httpError = new Error('CSRFトークンが無効です') as HttpError;
    httpError.statusCode = 403;
    return next(httpError);
  }

  // セッションエラー
  if (error.name === 'SessionError') {
    const httpError = new Error('セッションエラーが発生しました') as HttpError;
    httpError.statusCode = 401;
    return next(httpError);
  }

  next(error);
};

/**
 * リクエストタイムアウトハンドラー
 */
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        const error = new Error('Request Timeout') as HttpError;
        error.statusCode = 408;
        next(error);
      }
    }, timeout);

    // レスポンス完了時にタイムアウトをクリア
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

/**
 * ステータスコードに対応するタイトルを取得
 */
function getErrorTitle(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return '不正なリクエスト';
    case 401:
      return '認証が必要です';
    case 403:
      return 'アクセスが禁止されています';
    case 404:
      return 'ページが見つかりません';
    case 408:
      return 'リクエストタイムアウト';
    case 409:
      return '競合エラー';
    case 422:
      return '入力データエラー';
    case 429:
      return 'リクエスト制限';
    case 500:
      return 'サーバーエラー';
    case 502:
      return 'ゲートウェイエラー';
    case 503:
      return 'サービス利用不可';
    default:
      return 'エラーが発生しました';
  }
}

/**
 * ヘルスチェック用のエラーハンドラー
 */
export const healthCheckErrorHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.path === '/health' || req.path === '/healthz') {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
    return;
  }

  next();
};