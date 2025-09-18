import { IUserRepository } from '../../domain/repositories';
import { LoginUseCase, UserRegistrationUseCase } from '../usecases/user';
import { UserDomainService } from '../../domain/services';
import { CreateUserCommand } from '../commands';
import { LoginResponseDTO, LogoutResponseDTO, AuthStatusResponseDTO, UserResponseDTO } from '../dto/response';
import { UserDTOMapper } from '../dto/mappers';

/**
 * 認証サービス
 * 複数の認証関連Use Caseを調整し、セッション管理を統合的に提供
 */
export class AuthenticationService {
  private readonly loginUseCase: LoginUseCase;
  private readonly registrationUseCase: UserRegistrationUseCase;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService
  ) {
    this.loginUseCase = new LoginUseCase(userRepository);
    this.registrationUseCase = new UserRegistrationUseCase(userRepository, userDomainService);
  }

  /**
   * ユーザー登録とログインを連続実行
   */
  async registerAndLogin(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: UserResponseDTO | undefined;
    loginData?: LoginResponseDTO | undefined;
  }> {
    try {
      // ユーザー登録
      const command = new CreateUserCommand(email, password, firstName, lastName, phone);
      const registrationResult = await this.registrationUseCase.execute(command);

      if (!registrationResult.result.success) {
        return {
          success: false,
          message: registrationResult.result.message
        };
      }

      // 登録成功後、自動ログイン
      const loginResult = await this.loginUseCase.execute(email, password);

      return {
        success: true,
        message: 'Registration and login successful',
        user: registrationResult.user,
        loginData: loginResult.data
      };

    } catch (error) {
      console.error('Error in AuthenticationService.registerAndLogin:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration and login failed'
      };
    }
  }

  /**
   * ログイン処理
   */
  async login(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    data?: LoginResponseDTO;
  }> {
    return await this.loginUseCase.execute(email, password);
  }

  /**
   * ログアウト処理
   */
  async logout(sessionId: string): Promise<LogoutResponseDTO> {
    try {
      // セッション無効化処理
      // 実際の実装では、セッションストアからセッションを削除
      console.log(`Logging out session: ${sessionId}`);

      return {
        message: 'Logout successful'
      };

    } catch (error) {
      console.error('Error in AuthenticationService.logout:', error);
      return {
        message: 'Logout failed'
      };
    }
  }

  /**
   * 認証状態確認
   */
  async checkAuthStatus(sessionId?: string): Promise<AuthStatusResponseDTO> {
    try {
      if (!sessionId) {
        return {
          isAuthenticated: false
        };
      }

      // セッション検証処理
      // 実際の実装では、セッションストアからユーザー情報を取得
      const isValidSession = await this.validateSession(sessionId);

      if (!isValidSession) {
        return {
          isAuthenticated: false
        };
      }

      // セッションからユーザー情報を取得
      const user = await this.getUserFromSession(sessionId);

      return {
        isAuthenticated: true,
        user: user ? UserDTOMapper.toLoginUserData(user) : undefined
      };

    } catch (error) {
      console.error('Error in AuthenticationService.checkAuthStatus:', error);
      return {
        isAuthenticated: false
      };
    }
  }

  /**
   * セッション検証（プレースホルダー実装）
   */
  private async validateSession(sessionId: string): Promise<boolean> {
    // TODO: 実際の実装では、セッションストアでセッションの有効性を確認
    return sessionId.startsWith('session_');
  }

  /**
   * セッションからユーザー取得（プレースホルダー実装）
   */
  private async getUserFromSession(sessionId: string): Promise<any> {
    // TODO: 実際の実装では、セッションストアからユーザーIDを取得し、
    // ユーザーリポジトリからユーザー情報を取得
    return null;
  }
}