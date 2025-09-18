/**
 * 認証コントローラー
 * ログイン、ログアウト、ユーザー登録を処理
 */

import { BaseController } from './BaseController';
import {
  AuthenticatedRequest,
  ControllerMethod,
  LoginRequest,
  RegisterRequest,
  HttpStatusCode
} from '../types';
import { Response } from 'express';

// Application層のUse Cases
import {
  LoginUseCase,
  UserRegistrationUseCase
} from '../../application/usecases';

// Request DTOs
import {
  LoginRequestDTO,
  CreateUserRequestDTO
} from '../../application/dto/request';

export class AuthController extends BaseController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly userRegistrationUseCase: UserRegistrationUseCase
  ) {
    super();
  }

  /**
   * ログインページ表示
   */
  public showLoginForm: ControllerMethod = async (req, res) => {
    try {
      // 既にログインしている場合はホームページにリダイレクト
      if (this.isAuthenticated(req)) {
        return this.redirect(res, '/');
      }

      const { messages, errors } = this.getFlashMessages(req);

      this.render(res, 'auth/login', {
        title: 'ログイン',
        description: 'アカウントにログインして、お買い物をお楽しみください。',
        messages,
        errors
      });
    } catch (error) {
      console.error('Login form display error:', error);
      this.serverError(res);
    }
  };

  /**
   * ログイン処理
   */
  public login: ControllerMethod = async (req, res) => {
    try {
      const { username, password }: LoginRequest = req.body;

      // 基本的なバリデーション
      if (!username || !password) {
        this.setFlashError(req, 'ユーザー名とパスワードを入力してください');
        return this.redirect(res, '/auth/login');
      }

      // Use Caseに渡すDTOを作成
      const loginRequest = new LoginRequestDTO(username, password);

      // ログイン実行
      const result = await this.loginUseCase.execute(
        loginRequest.email,
        loginRequest.password
      );

      if (result.success && result.data) {
        // セッションに認証情報を保存
        req.session.isAuthenticated = true;
        req.session.userId = result.data.user.id;
        req.session.username = result.data.user.username;

        // セッションを保存
        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        this.setFlashSuccess(req, result.message);
        this.redirect(res, '/');
      } else {
        this.setFlashError(req, result.message);
        this.redirect(res, '/auth/login');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.setFlashError(req, 'ログイン処理中にエラーが発生しました');
      this.redirect(res, '/auth/login');
    }
  };

  /**
   * ユーザー登録ページ表示
   */
  public showRegisterForm: ControllerMethod = async (req, res) => {
    try {
      // 既にログインしている場合はホームページにリダイレクト
      if (this.isAuthenticated(req)) {
        return this.redirect(res, '/');
      }

      const { messages, errors } = this.getFlashMessages(req);

      this.render(res, 'auth/register', {
        title: 'ユーザー登録',
        messages,
        errors
      });
    } catch (error) {
      console.error('Register form display error:', error);
      this.serverError(res);
    }
  };

  /**
   * ユーザー登録処理
   */
  public register: ControllerMethod = async (req, res) => {
    try {
      const { username, email, password, confirmPassword }: RegisterRequest = req.body;

      // 基本的なバリデーション
      const validationErrors = this.validateRegistration({
        username,
        email,
        password,
        confirmPassword
      });

      if (validationErrors.length > 0) {
        validationErrors.forEach(error => this.setFlashError(req, error));
        return this.redirect(res, '/auth/register');
      }

      // Use Caseに渡すDTOを作成
      const createUserRequest = new CreateUserRequestDTO(
        username,
        email,
        password
      );

      // ユーザー登録実行
      const result = await this.userRegistrationUseCase.execute(createUserRequest);

      if (result.success) {
        this.setFlashSuccess(req, 'ユーザー登録が完了しました。ログインしてください。');
        this.redirect(res, '/auth/login');
      } else {
        this.setFlashError(req, result.message);
        this.redirect(res, '/auth/register');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.setFlashError(req, 'ユーザー登録処理中にエラーが発生しました');
      this.redirect(res, '/auth/register');
    }
  };

  /**
   * ログアウト処理
   */
  public logout: ControllerMethod = async (req, res) => {
    try {
      // セッションを破棄
      req.session.destroy((err) => {
        if (err) {
          console.error('Logout error:', err);
          this.setFlashError(req, 'ログアウト処理中にエラーが発生しました');
          return this.redirect(res, '/');
        }

        // セッションCookieをクリア
        res.clearCookie('connect.sid');
        this.redirect(res, '/auth/login');
      });
    } catch (error) {
      console.error('Logout error:', error);
      this.serverError(res);
    }
  };

  /**
   * API: ログイン状態確認
   */
  public checkAuthStatus: ControllerMethod = async (req, res) => {
    try {
      const isAuthenticated = this.isAuthenticated(req);
      const userId = this.getCurrentUserId(req);

      this.success(res, {
        isAuthenticated,
        userId,
        username: req.session.username
      }, 'Authentication status retrieved');
    } catch (error) {
      console.error('Auth status check error:', error);
      this.serverError(res);
    }
  };

  /**
   * 登録データのバリデーション
   */
  private validateRegistration(data: RegisterRequest): string[] {
    const errors: string[] = [];

    if (!data.username || data.username.trim().length < 3) {
      errors.push('ユーザー名は3文字以上で入力してください');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('有効なメールアドレスを入力してください');
    }

    if (!data.password || data.password.length < 8) {
      errors.push('パスワードは8文字以上で入力してください');
    }

    if (data.password !== data.confirmPassword) {
      errors.push('パスワードが一致しません');
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