/**
 * セキュリティミドルウェア
 * セキュリティヘッダーとCORS設定
 */

import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import Tokens from 'csrf';
import { Request, Response, NextFunction } from 'express';

// CSRF tokens instance
const tokens = new Tokens();

/**
 * セキュリティヘッダー設定
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com'
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' },
  permittedCrossDomainPolicies: false
});

/**
 * CORS設定
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    // 開発環境では全てのオリジンを許可
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // 本番環境では特定のオリジンのみ許可
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24時間
});

/**
 * セッション設定
 */
export const sessionConfig = session({
  name: 'ec-site-session',
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPSでのみ送信
    httpOnly: true, // XSS対策
    maxAge: 24 * 60 * 60 * 1000, // 24時間
    sameSite: 'lax' // CSRF対策
  },
  store: undefined // 本番環境ではRedisStoreなどを使用
});

/**
 * セッションストア設定
 * 本番環境では外部ストア（Redis、MongoDB等）を使用する
 */
export const configureSessionStore = () => {
  if (process.env.NODE_ENV === 'production') {
    // TODO: 本番環境用のセッションストアを設定
    // 例: RedisStore、MongoStore等
    console.warn('Warning: Using memory session store in production. Configure external store.');
  }

  return sessionConfig;
};

/**
 * セキュリティログミドルウェア
 */
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 疑わしいリクエストをログ出力
  const suspiciousPatterns = [
    /\.\.\//,           // パストラバーサル
    /<script/i,         // XSS
    /union.*select/i,   // SQLインジェクション
    /javascript:/i,     // JavaScript injection
    /vbscript:/i,       // VBScript injection
  ];

  const url = req.originalUrl;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

  if (isSuspicious) {
    console.warn('Suspicious request detected:', {
      ip: req.ip,
      method: req.method,
      url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Content-Type検証ミドルウェア
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type') || '';

      const isAllowed = allowedTypes.some(type =>
        contentType.toLowerCase().includes(type.toLowerCase())
      );

      if (!isAllowed) {
        res.status(415).json({
          success: false,
          message: 'Unsupported Media Type'
        });
        return;
      }
    }

    next();
  };
};

/**
 * Request Size制限ミドルウェア
 */
export const requestSizeLimit = (limit: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = parseSize(limit);

    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
      return;
    }

    next();
  };
};

/**
 * サイズ文字列をバイト数に変換
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return value * units[unit];
}

/**
 * User-Agent検証ミドルウェア
 */
export const validateUserAgent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userAgent = req.get('User-Agent');

  // User-Agentが存在しない場合は疑わしい
  if (!userAgent) {
    console.warn('Request without User-Agent:', {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }

  // 既知の悪意あるUser-Agentをブロック
  const blockedPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /burpsuite/i,
    /masscan/i
  ];

  if (userAgent && blockedPatterns.some(pattern => pattern.test(userAgent))) {
    res.status(403).json({
      success: false,
      message: 'Blocked User-Agent'
    });
    return;
  }

  next();
};

/**
 * CSRF トークン生成・検証ミドルウェア
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // GETリクエストの場合はトークンを生成してセッションに保存
  if (req.method === 'GET') {
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = tokens.secretSync();
    }
    const token = tokens.create(req.session.csrfSecret);
    res.locals.csrfToken = token;
    return next();
  }

  // POST/PUT/PATCH/DELETEリクエストの場合はトークンを検証
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const token = req.body._csrf || req.get('X-CSRF-Token') || req.get('x-csrf-token');
    const secret = req.session.csrfSecret;

    if (!secret || !token || !tokens.verify(secret, token)) {
      const error = new Error('CSRFトークンが無効です');
      (error as any).code = 'EBADCSRFTOKEN';
      (error as any).statusCode = 403;
      throw error;
    }
  }

  next();
};

/**
 * CSRF エラーハンドリングミドルウェア
 */
export const csrfErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.code === 'EBADCSRFTOKEN') {
    // フォーム送信の場合はリダイレクト
    if (req.accepts('html')) {
      req.session.flashErrors = req.session.flashErrors || [];
      req.session.flashErrors.push('セキュリティトークンが無効です。もう一度お試しください。');
      return res.redirect(req.get('Referrer') || '/');
    }

    // APIリクエストの場合はJSON応答
    return res.status(403).json({
      success: false,
      message: 'CSRFトークンが無効です',
      code: 'INVALID_CSRF_TOKEN'
    });
  }

  next(err);
};