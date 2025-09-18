/**
 * Routes index
 * 全てのルーターを統合
 */

import { Router } from 'express';
import authRouter from './auth';
import homeRouter from './home';
import productRouter from './product';
import cartRouter from './cart';
import userRouter from './user';
import adminRouter from './admin';
import { healthCheckErrorHandler } from '../middleware';

const router = Router();

// ヘルスチェックエンドポイント
router.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

router.use(healthCheckErrorHandler);

// 各機能のルーターを統合
router.use('/auth', authRouter);
router.use('/', homeRouter);
router.use('/product', productRouter);
router.use('/products', productRouter); // Add products route
router.use('/cart', cartRouter);
router.use('/api/cart', cartRouter); // Add API cart route to fix frontend path mismatch
router.use('/user', userRouter);
router.use('/admin', adminRouter);

export default router;