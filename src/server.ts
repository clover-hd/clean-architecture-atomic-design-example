/**
 * サーバー起動設定
 * HTTP/HTTPSサーバーの起動とクラスター管理
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cluster from 'cluster';
import os from 'os';
import { createApp, setupGracefulShutdown, setupDevelopmentHelpers } from './app';

/**
 * サーバー設定インターフェース
 */
interface ServerConfig {
  port: number;
  host: string;
  httpsPort?: number;
  sslKeyPath?: string;
  sslCertPath?: string;
  clusterMode: boolean;
  maxWorkers?: number;
}

/**
 * 環境変数からサーバー設定を構築
 */
function getServerConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    httpsPort: process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : undefined,
    sslKeyPath: process.env.SSL_KEY_PATH,
    sslCertPath: process.env.SSL_CERT_PATH,
    clusterMode: process.env.CLUSTER_MODE === 'true',
    maxWorkers: process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS) : os.cpus().length
  };
}

/**
 * HTTPサーバーを起動
 */
async function startHttpServer(config: ServerConfig): Promise<http.Server> {
  const app = await createApp();

  // 開発環境用ヘルパーを設定
  setupDevelopmentHelpers(app);

  const server = http.createServer(app);

  // アプリにサーバー参照を設定（グレースフルシャットダウン用）
  (app as any).server = server;

  // グレースフルシャットダウンを設定
  setupGracefulShutdown(app);

  // サーバー起動
  server.listen(config.port, config.host, () => {
    console.log(`🚀 HTTP Server running on http://${config.host}:${config.port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🆔 Process ID: ${process.pid}`);

    if (cluster.isWorker) {
      console.log(`👷 Worker ${process.pid} started`);
    }
  });

  // サーバーエラーハンドリング
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof config.port === 'string'
      ? 'Pipe ' + config.port
      : 'Port ' + config.port;

    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  return server;
}

/**
 * HTTPSサーバーを起動（オプション）
 */
async function startHttpsServer(config: ServerConfig): Promise<https.Server | null> {
  if (!config.httpsPort || !config.sslKeyPath || !config.sslCertPath) {
    console.log('🔐 HTTPS configuration not found, skipping HTTPS server');
    return null;
  }

  try {
    // SSL証明書の読み込み
    const privateKey = fs.readFileSync(config.sslKeyPath, 'utf8');
    const certificate = fs.readFileSync(config.sslCertPath, 'utf8');

    const credentials = {
      key: privateKey,
      cert: certificate
    };

    const app = await createApp();
    setupDevelopmentHelpers(app);

    const httpsServer = https.createServer(credentials, app);

    // グレースフルシャットダウンを設定
    (app as any).server = httpsServer;
    setupGracefulShutdown(app);

    httpsServer.listen(config.httpsPort, config.host, () => {
      console.log(`🔐 HTTPS Server running on https://${config.host}:${config.httpsPort}`);
    });

    httpsServer.on('error', (error: NodeJS.ErrnoException) => {
      console.error('HTTPS Server error:', error);
    });

    return httpsServer;
  } catch (error) {
    console.error('Failed to start HTTPS server:', error);
    return null;
  }
}

/**
 * クラスターモードでサーバーを起動
 */
function startClusterServer(config: ServerConfig): void {
  const numWorkers = Math.min(config.maxWorkers || os.cpus().length, os.cpus().length);

  if (cluster.isMaster) {
    console.log(`🎯 Master process ${process.pid} is running`);
    console.log(`🔀 Starting ${numWorkers} workers...`);

    // ワーカープロセスを起動
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    // ワーカープロセスの監視
    cluster.on('exit', (worker, code, signal) => {
      console.log(`💔 Worker ${worker.process.pid} died (${signal || code})`);

      // ワーカーが異常終了した場合は再起動
      if (code !== 0 && !worker.exitedAfterDisconnect) {
        console.log('🔄 Starting a new worker...');
        cluster.fork();
      }
    });

    // マスタープロセスの優雅な終了
    process.on('SIGTERM', () => {
      console.log('🛑 Master received SIGTERM, shutting down gracefully...');

      cluster.disconnect(() => {
        console.log('👋 All workers disconnected');
        process.exit(0);
      });
    });

    // クラスター統計を定期的にログ出力（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const workers = Object.keys(cluster.workers || {}).length;
        console.log(`📊 Active workers: ${workers}`);
      }, 30000);
    }

  } else {
    // ワーカープロセス
    (async () => {
      try {
        await startHttpServer(config);

        if (config.httpsPort) {
          await startHttpsServer(config);
        }
      } catch (error) {
        console.error('Failed to start worker process:', error);
        process.exit(1);
      }
    })();
  }
}

/**
 * シングルプロセスモードでサーバーを起動
 */
async function startSingleServer(config: ServerConfig): Promise<void> {
  console.log('🔂 Starting single process server...');

  const httpServer = await startHttpServer(config);
  const httpsServer = await startHttpsServer(config);

  // プロセス統計を定期的にログ出力（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      console.log(`📊 Memory usage: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }, 60000);
  }
}

/**
 * サーバー起動の健全性チェック
 */
function performHealthCheck(config: ServerConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const http = require('http');

    const options = {
      hostname: config.host === '0.0.0.0' ? 'localhost' : config.host,
      port: config.port,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res: any) => {
      if (res.statusCode === 200) {
        console.log('✅ Health check passed');
        resolve();
      } else {
        reject(new Error(`Health check failed with status: ${res.statusCode}`));
      }
    });

    req.on('error', (err: Error) => {
      reject(new Error(`Health check failed: ${err.message}`));
    });

    req.on('timeout', () => {
      reject(new Error('Health check timed out'));
    });

    req.end();
  });
}

/**
 * メインサーバー起動関数
 */
export async function startServer(): Promise<void> {
  console.log('🎬 Starting EC Site Server...');

  const config = getServerConfig();

  // 設定情報をログ出力
  console.log('⚙️  Server Configuration:');
  console.log(`   • HTTP Port: ${config.port}`);
  console.log(`   • Host: ${config.host}`);
  console.log(`   • HTTPS Port: ${config.httpsPort || 'Not configured'}`);
  console.log(`   • Cluster Mode: ${config.clusterMode}`);
  console.log(`   • Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    // サーバー起動
    if (config.clusterMode && process.env.NODE_ENV === 'production') {
      startClusterServer(config);
    } else {
      await startSingleServer(config);
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  // 開発環境でのヘルスチェック
  if (process.env.NODE_ENV === 'development' && !cluster.isMaster) {
    setTimeout(() => {
      performHealthCheck(config)
        .then(() => {
          console.log('🎉 Server started successfully!');
        })
        .catch((error) => {
          console.error('❌ Server health check failed:', error.message);
        });
    }, 1000);
  }
}

// このファイルが直接実行された場合はサーバーを起動
if (require.main === module) {
  startServer();
}