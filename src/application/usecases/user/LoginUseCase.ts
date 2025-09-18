import { Email } from '../../../domain/value-objects';
import { IUserRepository } from '../../../domain/repositories';
import { LoginResponseDTO } from '../../dto/response';
import { UserDTOMapper } from '../../dto/mappers';
import * as bcrypt from 'bcryptjs';

/**
 * ログインユースケース
 */
export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * ログインを実行
   */
  async execute(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    data?: LoginResponseDTO;
  }> {
    try {
      // 入力値の検証
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required'
        };
      }

      // ユーザーの存在確認
      const emailVO = new Email(email);
      const user = await this.userRepository.findByEmail(emailVO);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // パスワードの検証（実際の実装ではデータベースのハッシュ化パスワードと比較）
      // 注意: この実装例では簡略化されています
      // 実際にはユーザーテーブルにpassword_hashカラムが必要です
      const isValidPassword = await this.validatePassword(password, user.id.value);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // セッションIDを生成（実際の実装ではセッションストアに保存）
      const sessionId = this.generateSessionId();

      // レスポンスデータを構築
      const loginResponse: LoginResponseDTO = {
        user: UserDTOMapper.toLoginUserData(user),
        sessionId,
        message: 'Login successful'
      };

      return {
        success: true,
        message: 'Login successful',
        data: loginResponse
      };

    } catch (error) {
      console.error('Error in LoginUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * パスワード検証（プレースホルダー実装）
   * 実際の実装では、データベースからハッシュ化されたパスワードを取得して比較
   */
  private async validatePassword(password: string, userId: string): Promise<boolean> {
    // TODO: 実際の実装では、userRepositoryからハッシュ化されたパスワードを取得
    // const hashedPassword = await this.userRepository.getPasswordHash(userId);
    // return await bcrypt.compare(password, hashedPassword);

    // 現在は簡略化された実装
    return password.length >= 8;
  }

  /**
   * セッションID生成
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}