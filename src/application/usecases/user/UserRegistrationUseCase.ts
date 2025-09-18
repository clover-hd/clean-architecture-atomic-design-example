import { User } from '../../../domain/entities';
import { UserId, Email } from '../../../domain/value-objects';
import { IUserRepository } from '../../../domain/repositories';
import { UserDomainService } from '../../../domain/services';
import { CreateUserCommand, CreateUserCommandResult } from '../../commands';
import { UserResponseDTO } from '../../dto/response';
import { UserDTOMapper } from '../../dto/mappers';
import * as bcrypt from 'bcryptjs';

/**
 * ユーザー登録ユースケース
 */
export class UserRegistrationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService
  ) {}

  /**
   * ユーザー登録を実行
   */
  async execute(command: CreateUserCommand): Promise<{
    user?: UserResponseDTO;
    result: CreateUserCommandResult;
  }> {
    try {
      // コマンドの検証
      const validationErrors = command.validate();
      if (validationErrors.length > 0) {
        return {
          result: {
            userId: '',
            email: command.email,
            success: false,
            message: validationErrors.join(', ')
          }
        };
      }

      // メールアドレスの重複チェック
      const email = new Email(command.email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return {
          result: {
            userId: '',
            email: command.email,
            success: false,
            message: 'Email already exists'
          }
        };
      }

      // パスワードのハッシュ化
      const hashedPassword = await bcrypt.hash(command.password, 10);

      // 新しいUserエンティティを作成
      const userId = new UserId();
      const newUser = User.create(
        userId,
        email,
        command.firstName,
        command.lastName,
        command.phone
      );

      // ドメインサービスでビジネスルールを検証
      await this.userDomainService.validateUserCreation(newUser);

      // ユーザーを保存
      const savedUser = await this.userRepository.create(newUser);

      // DTOに変換して返却
      const userResponseDTO = UserDTOMapper.toResponseDTO(savedUser);

      return {
        user: userResponseDTO,
        result: {
          userId: savedUser.id.value,
          email: savedUser.email.value,
          success: true,
          message: 'User created successfully'
        }
      };

    } catch (error) {
      console.error('Error in UserRegistrationUseCase:', error);
      return {
        result: {
          userId: '',
          email: command.email,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }
}