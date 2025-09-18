/**
 * カートコントローラー
 * ショッピングカート機能を処理
 */

import { BaseController } from './BaseController';
import {
  AuthenticatedRequest,
  ControllerMethod,
  CartActionRequest,
  HttpStatusCode
} from '../types';
import { Response } from 'express';

// Application層のUse Cases
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase
} from '../../application/usecases';

// Command/Query DTOs
import {
  GetCartQuery,
  AddToCartCommand,
  UpdateCartItemCommand,
  RemoveFromCartCommand
} from '../../application/commands';

export class CartController extends BaseController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase
  ) {
    super();
  }

  /**
   * カートページ表示
   */
  public index: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        this.setFlashError(req, 'カートを表示するにはログインが必要です');
        return this.redirect(res, '/auth/login');
      }

      const userId = this.getCurrentUserId(req)!;
      const { messages, errors } = this.getFlashMessages(req);

      // カート内容を取得
      const cartQuery = new GetCartQuery(userId);
      const result = await this.getCartUseCase.execute(cartQuery);

      if (result.success) {
        this.render(res, 'cart/index', {
          title: 'ショッピングカート',
          cart: result.data || {
            items: [],
            totalItems: 0,
            totalAmount: 0,
            isEmpty: true
          },
          messages,
          errors,
          user: {
            id: userId,
            username: req.session.username
          },
          isAuthenticated: true
        });
      } else {
        this.setFlashError(req, result.message);
        this.render(res, 'cart/index', {
          title: 'ショッピングカート',
          cart: {
            items: [],
            totalItems: 0,
            totalAmount: 0,
            isEmpty: true
          },
          messages,
          errors: [result.message],
          user: {
            id: userId,
            username: req.session.username
          },
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Cart page error:', error);
      this.serverError(res);
    }
  };

  /**
   * カート内容取得API
   */
  public getCart: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res);
      }

      const userId = this.getCurrentUserId(req)!;
      const cartQuery = new GetCartQuery(userId);

      // Use Caseを実行
      await this.handleUseCaseResult(
        res,
        this.getCartUseCase.execute(cartQuery)
      );
    } catch (error) {
      console.error('Get cart error:', error);
      this.serverError(res);
    }
  };

  /**
   * カートに商品追加
   */
  public addItem: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res, 'ログインが必要です');
      }

      const userId = this.getCurrentUserId(req)!;
      const { productId, quantity }: CartActionRequest = req.body;

      // バリデーション
      if (!productId || !quantity || quantity <= 0) {
        return this.error(res, '商品IDと数量は必須です', HttpStatusCode.BAD_REQUEST);
      }

      // コマンドを作成
      const addToCartCommand = new AddToCartCommand(
        userId,
        productId,
        quantity
      );

      // Use Caseを実行
      const result = await this.addToCartUseCase.execute(addToCartCommand);

      if (result.success) {
        // セッションカートも更新
        this.updateSessionCart(req, result.data);

        this.success(res, result.data, result.message, HttpStatusCode.CREATED);
      } else {
        this.error(res, result.message);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      this.serverError(res);
    }
  };

  /**
   * カート商品数量更新
   */
  public updateItem: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res);
      }

      const userId = this.getCurrentUserId(req)!;
      const { productId, quantity }: CartActionRequest = req.body;

      // バリデーション
      if (!productId || quantity < 0) {
        return this.error(res, '商品IDと数量は必須です', HttpStatusCode.BAD_REQUEST);
      }

      // コマンドを作成
      const updateCartCommand = new UpdateCartItemCommand(
        userId,
        productId,
        quantity
      );

      // Use Caseを実行
      const result = await this.updateCartItemUseCase.execute(updateCartCommand);

      if (result.success) {
        // セッションカートも更新
        this.updateSessionCart(req, result.data);

        this.success(res, result.data, result.message);
      } else {
        this.error(res, result.message);
      }
    } catch (error) {
      console.error('Update cart item error:', error);
      this.serverError(res);
    }
  };

  /**
   * カートから商品削除
   */
  public removeItem: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res);
      }

      const userId = this.getCurrentUserId(req)!;
      const productId = parseInt(req.params.productId);

      if (!productId || isNaN(productId)) {
        return this.error(res, '無効な商品IDです', HttpStatusCode.BAD_REQUEST);
      }

      // コマンドを作成
      const removeFromCartCommand = new RemoveFromCartCommand(
        userId,
        productId
      );

      // Use Caseを実行
      const result = await this.removeFromCartUseCase.execute(removeFromCartCommand);

      if (result.success) {
        // セッションカートも更新
        this.updateSessionCart(req, result.data);

        this.success(res, result.data, result.message);
      } else {
        this.error(res, result.message);
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      this.serverError(res);
    }
  };

  /**
   * カートクリア
   */
  public clear: ControllerMethod = async (req, res) => {
    try {
      // 認証チェック
      if (!this.isAuthenticated(req)) {
        return this.unauthorized(res);
      }

      const userId = this.getCurrentUserId(req)!;

      // カートの全アイテムを削除
      // TODO: ClearCartUseCaseを実装するか、既存のUseCaseを使用

      // セッションカートをクリア
      req.session.cart = [];

      this.success(res, { message: 'Cart cleared successfully' }, 'カートをクリアしました');
    } catch (error) {
      console.error('Clear cart error:', error);
      this.serverError(res);
    }
  };

  /**
   * カート商品数取得（ヘッダー表示用）
   */
  public getItemCount: ControllerMethod = async (req, res) => {
    try {
      if (!this.isAuthenticated(req)) {
        return this.success(res, { count: 0 }, 'No items in cart');
      }

      const userId = this.getCurrentUserId(req)!;
      const cartQuery = new GetCartQuery(userId);
      const result = await this.getCartUseCase.execute(cartQuery);

      const count = result.success && result.data
        ? result.data.totalItems
        : 0;

      this.success(res, { count }, 'Cart item count retrieved');
    } catch (error) {
      console.error('Get cart count error:', error);
      this.success(res, { count: 0 }, 'Error retrieving cart count');
    }
  };

  /**
   * セッションカートを更新
   */
  private updateSessionCart(req: AuthenticatedRequest, cartData: any): void {
    if (cartData && cartData.items) {
      req.session.cart = cartData.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        addedAt: item.addedAt || new Date().toISOString()
      }));
    }
  }
}