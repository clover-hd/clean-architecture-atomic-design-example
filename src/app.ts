/**
 * Express アプリケーション設定
 * ミドルウェア、ルーター、エラーハンドリングを統合
 */

import express, { Express } from 'express';
import path from 'path';
import morgan from 'morgan';
import compression from 'compression';
import expressLayouts from 'express-ejs-layouts';
import dotenv from 'dotenv';

// 環境設定の読み込み
dotenv.config({
  path: path.join(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`)
});

// データベース設定のインポート
import { DatabaseConfig } from './infrastructure/database';

// ミドルウェアのインポート
import {
  securityHeaders,
  corsConfig,
  sessionConfig,
  initializeSession,
  notFoundHandler,
  globalErrorHandler,
  databaseErrorHandler,
  securityErrorHandler,
  timeoutHandler,
  securityLogger,
  validateContentType,
  validateUserAgent,
  csrfProtection,
  csrfErrorHandler
} from './presentation/middleware';

// ルーターのインポート
import router from './presentation/routes';

/**
 * Express アプリケーションを作成・設定
 */
export async function createApp(): Promise<Express> {
  const app = express();

  // データベース初期化
  try {
    await DatabaseConfig.initialize();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }

  // ===========================================
  // 基本設定
  // ===========================================

  // テンプレートエンジン設定
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));

  // EJSレイアウト設定
  app.use(expressLayouts);
  app.set('layout', 'templates/base');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);

  // 信頼できるプロキシ設定（本番環境でロードバランサーを使用する場合）
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ===========================================
  // リクエスト前処理ミドルウェア
  // ===========================================

  // リクエストタイムアウト（30秒）
  app.use(timeoutHandler(30000));

  // セキュリティロギング
  app.use(securityLogger);

  // User-Agent検証
  app.use(validateUserAgent);

  // セキュリティヘッダー
  app.use(securityHeaders);

  // CORS設定
  app.use(corsConfig);

  // 圧縮
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }));

  // HTTPリクエストログ
  const morganFormat = process.env.NODE_ENV === 'production'
    ? 'combined'
    : 'dev';

  app.use(morgan(morganFormat, {
    skip: (req, res) => {
      // ヘルスチェックエンドポイントはログに記録しない
      return req.url === '/health' || req.url === '/healthz';
    }
  }));

  // 静的ファイル配信
  app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: process.env.NODE_ENV === 'production',
    lastModified: process.env.NODE_ENV === 'production'
  }));

  // ===========================================
  // リクエスト解析ミドルウェア
  // ===========================================

  // JSONリクエストボディ解析（サイズ制限付き）
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
      // Content-Type検証
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        const error = new Error('Invalid Content-Type');
        (error as any).statusCode = 415;
        throw error;
      }
    }
  }));

  // URLエンコードされたリクエストボディ解析
  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  // Content-Type検証（APIエンドポイント用）
  app.use('/api/*', validateContentType([
    'application/json',
    'application/x-www-form-urlencoded'
  ]));

  // ===========================================
  // セッション管理
  // ===========================================

  // セッション設定
  app.use(sessionConfig);

  // セッション初期化
  app.use(initializeSession);

  // ===========================================
  // CSRF保護
  // ===========================================

  // CSRF保護ミドルウェア
  app.use(csrfProtection);

  // ===========================================
  // ビューテンプレート用グローバル変数
  // ===========================================

  app.use((req, res, next) => {
    // テンプレートで使用するグローバル変数を設定
    res.locals.NODE_ENV = process.env.NODE_ENV;
    res.locals.APP_NAME = 'ECサイト';
    res.locals.APP_VERSION = process.env.npm_package_version || '1.0.0';

    // 現在のパス情報
    res.locals.currentPath = req.path;
    res.locals.currentUrl = req.originalUrl;

    // セッション情報をテンプレートで使用可能にする
    res.locals.isAuthenticated = !!(req.session && (req.session as any).isAuthenticated);
    res.locals.user = (req.session as any)?.userId ? {
      id: (req.session as any).userId,
      username: (req.session as any).username
    } : null;

    // フラッシュメッセージ
    res.locals.messages = (req.session as any)?.flashMessages || [];
    res.locals.errors = (req.session as any)?.flashErrors || [];

    // カート情報
    res.locals.cartItemCount = (req.session as any)?.cart?.length || 0;

    next();
  });

  // ===========================================
  // ルーティング
  // ===========================================

  // メインルーター
  app.use('/', router);

  // ===========================================
  // エラーハンドリング
  // ===========================================

  // 特定エラータイプのハンドラー
  app.use(csrfErrorHandler);
  app.use(databaseErrorHandler);
  app.use(securityErrorHandler);

  // 404 Not Found ハンドラー
  app.use(notFoundHandler);

  // グローバルエラーハンドラー
  app.use(globalErrorHandler);

  return app;
}

/**
 * アプリケーションの正常シャットダウン処理
 */
export function setupGracefulShutdown(app: Express): void {
  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    // サーバーを新しいリクエストを受け付けない状態にする
    const server = (app as any).server;
    if (server) {
      server.close(() => {
        console.log('HTTP server closed.');

        // データベース接続などのクリーンアップ処理
        // TODO: データベース接続プールのクリーンアップを実装

        process.exit(0);
      });

      // タイムアウト時の強制終了
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    }
  };

  // シャットダウンシグナルの処理
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // 未捕捉例外の処理
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

/**
 * 開発環境用のヘルパー関数
 */
export function setupDevelopmentHelpers(app: Express): void {
  if (process.env.NODE_ENV === 'development') {
    // 開発環境専用のミドルウェアやルートを設定

    // エラーページでスタックトレースを表示
    app.locals.showStackTrace = true;

    // 開発用のデバッグ情報
    app.use('/debug/session', (req, res) => {
      res.json({
        session: req.session,
        user: (req as any).user,
        headers: req.headers
      });
    });

    app.use('/debug/env', (req, res) => {
      const safeEnv = Object.keys(process.env)
        .filter(key => !key.toLowerCase().includes('secret') && !key.toLowerCase().includes('password'))
        .reduce((obj, key) => {
          obj[key] = process.env[key];
          return obj;
        }, {} as any);

      res.json(safeEnv);
    });
  }
}

export default createApp;