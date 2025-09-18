/**
 * ユーザーコントローラー
 * ユーザープロフィール管理と注文履歴を処理
 */

import { BaseController } from './BaseController';
import {
  AuthenticatedRequest,
  ControllerMethod,
  UpdateUserRequest,
  HttpStatusCode
} from '../types';
import { Response } from 'express';

// Application層のUse Cases
import {
  GetUserProfileUseCase,
  UpdateUserProfileUseCase,
  GetOrderUseCase
} from '../../application/usecases';

// Command/Query DTOs
import {
  GetUserQuery,
  UpdateUserCommand,
  GetOrderQuery
} from '../../application/commands';

export class UserController extends BaseController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly getOrderUseCase: GetOrderUseCase
  ) {
    super();
  }

  /**
   * ユーザープロフィールページ表示
   */
  public profile: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        this.setFlashError(req, 'プロフィールを表示するにはログインが必要です');
        return this.redirect(res, '/auth/login');
      }

      const userId = this.getCurrentUserId(req)!;
      const { messages, errors } = this.getFlashMessages(req);

      // ユーザー情報を取得
      const userQuery = new GetUserQuery(userId);
      const result = await this.getUserProfileUseCase.execute(userQuery);

      if (result.success && result.data) {
        this.render(res, 'user/profile', {
          title: 'プロフィール',
          user: result.data,
          messages,
          errors,
          isAuthenticated: true
        });
      } else {
        this.setFlashError(req, 'ユーザー情報の取得に失敗しました');
        this.redirect(res, '/');
      }
    } catch (error) {
      console.error('User profile error:', error);
      this.serverError(res);
    }
  };

  /**
   * ユーザープロフィール取得API
   */
  public getProfile: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res);
      }

      const userId = this.getCurrentUserId(req)!;
      const userQuery = new GetUserQuery(userId);

      // Use Caseを実行
      await this.handleUseCaseResult(
        res,
        this.getUserProfileUseCase.execute(userQuery)
      );
    } catch (error) {
      console.error('Get user profile error:', error);
      this.serverError(res);
    }
  };

  /**
   * プロフィール編集ページ表示
   */
  public editProfile: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        this.setFlashError(req, 'ログインが必要です');
        return this.redirect(res, '/auth/login');
      }

      const userId = this.getCurrentUserId(req)!;
      const { messages, errors } = this.getFlashMessages(req);

      // ユーザー情報を取得
      const userQuery = new GetUserQuery(userId);
      const result = await this.getUserProfileUseCase.execute(userQuery);

      if (result.success && result.data) {
        this.render(res, 'user/edit-profile', {
          title: 'プロフィール編集',
          user: result.data,
          messages,
          errors,
          isAuthenticated: true
        });
      } else {
        this.setFlashError(req, 'ユーザー情報の取得に失敗しました');
        this.redirect(res, '/user/profile');
      }
    } catch (error) {
      console.error('Edit profile page error:', error);
      this.serverError(res);
    }
  };

  /**
   * プロフィール更新処理
   */
  public updateProfile: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res);
      }

      const userId = this.getCurrentUserId(req)!;
      const updateData: UpdateUserRequest = req.body;

      // バリデーション
      const validationErrors = this.validateProfileUpdate(updateData);
      if (validationErrors.length > 0) {
        if (req.headers.accept?.includes('application/json')) {
          return this.validationError(res, validationErrors);
        } else {
          validationErrors.forEach(error => this.setFlashError(req, error.message));
          return this.redirect(res, '/user/edit-profile');
        }
      }

      // パスワード変更のバリデーション
      if (updateData.newPassword) {
        if (updateData.newPassword !== updateData.confirmNewPassword) {
          const error = { field: 'confirmNewPassword', message: '新しいパスワードが一致しません' };
          if (req.headers.accept?.includes('application/json')) {
            return this.validationError(res, [error]);
          } else {
            this.setFlashError(req, error.message);
            return this.redirect(res, '/user/edit-profile');
          }
        }
      }

      // コマンドを作成
      const updateUserCommand = new UpdateUserCommand(
        userId,
        updateData.username,
        updateData.email,
        updateData.currentPassword,
        updateData.newPassword
      );

      // Use Caseを実行
      const result = await this.updateUserProfileUseCase.execute(updateUserCommand);

      if (result.success) {
        // セッション情報を更新
        if (result.data) {
          req.session.username = result.data.username;
        }

        if (req.headers.accept?.includes('application/json')) {
          this.success(res, result.data, result.message);
        } else {
          this.setFlashSuccess(req, result.message);
          this.redirect(res, '/user/profile');
        }
      } else {
        if (req.headers.accept?.includes('application/json')) {
          this.error(res, result.message);
        } else {
          this.setFlashError(req, result.message);
          this.redirect(res, '/user/edit-profile');
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      if (req.headers.accept?.includes('application/json')) {
        this.serverError(res);
      } else {
        this.setFlashError(req, 'プロフィール更新中にエラーが発生しました');
        this.redirect(res, '/user/edit-profile');
      }
    }
  };

  /**
   * 注文履歴ページ表示
   */
  public orderHistory: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        this.setFlashError(req, 'ログインが必要です');
        return this.redirect(res, '/auth/login');
      }

      const userId = this.getCurrentUserId(req)!;
      const { page, limit } = this.getPaginationParams(req);
      const { messages, errors } = this.getFlashMessages(req);

      // 注文履歴を取得（実装は簡略化、実際はGetOrderListUseCaseを使用）
      // TODO: GetOrderListUseCaseを実装する

      const orders = []; // プレースホルダー

      this.render(res, 'user/order-history', {
        title: '注文履歴',
        orders,
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        },
        messages,
        errors,
        user: {
          id: userId,
          username: req.session.username
        },
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Order history error:', error);
      this.serverError(res);
    }
  };

  /**
   * 注文詳細表示
   */
  public orderDetail: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res);
      }

      const userId = this.getCurrentUserId(req)!;
      const orderId = parseInt(req.params.orderId);

      if (!orderId || isNaN(orderId)) {
        return this.error(res, '無効な注文IDです', HttpStatusCode.BAD_REQUEST);
      }

      // 注文詳細を取得
      const orderQuery = new GetOrderQuery(orderId, userId);
      const result = await this.getOrderUseCase.execute(orderQuery);

      if (result.success && result.data) {
        if (req.headers.accept?.includes('application/json')) {
          this.success(res, result.data, result.message);
        } else {
          this.render(res, 'user/order-detail', {
            title: `注文詳細 - ${orderId}`,
            order: result.data,
            user: {
              id: userId,
              username: req.session.username
            },
            isAuthenticated: true
          });
        }
      } else {
        if (req.headers.accept?.includes('application/json')) {
          this.notFound(res, result.message);
        } else {
          this.setFlashError(req, result.message);
          this.redirect(res, '/user/order-history');
        }
      }
    } catch (error) {
      console.error('Order detail error:', error);
      this.serverError(res);
    }
  };

  /**
   * プロフィール更新データのバリデーション
   */
  private validateProfileUpdate(data: UpdateUserRequest) {
    const errors = [];

    if (data.username && data.username.trim().length < 3) {
      errors.push({
        field: 'username',
        message: 'ユーザー名は3文字以上で入力してください'
      });
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push({
        field: 'email',
        message: '有効なメールアドレスを入力してください'
      });
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        errors.push({
          field: 'currentPassword',
          message: 'パスワードを変更するには現在のパスワードが必要です'
        });
      }

      if (data.newPassword.length < 8) {
        errors.push({
          field: 'newPassword',
          message: '新しいパスワードは8文字以上で入力してください'
        });
      }
    }

    return errors;
  }

  /**
   * メールアドレスのバリデーション
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}