import { UserId } from '../../../domain/value-objects';
import { IUserRepository } from '../../../domain/repositories';
import { UpdateUserCommand, UpdateUserCommandResult } from '../../commands';
import { UserResponseDTO } from '../../dto/response';
import { UserDTOMapper } from '../../dto/mappers';

/**
 * ユーザープロフィール更新ユースケース
 */
export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * ユーザープロフィールを更新
   */
  async execute(command: UpdateUserCommand): Promise<{
    user?: UserResponseDTO;
    result: UpdateUserCommandResult;
  }> {
    try {
      // コマンドの検証
      const validationErrors = command.validate();
      if (validationErrors.length > 0) {
        return {
          result: {
            userId: command.userId,
            success: false,
            message: validationErrors.join(', ')
          }
        };
      }

      // 既存ユーザーを取得
      const userId = new UserId(command.userId);
      const existingUser = await this.userRepository.findById(userId);

      if (!existingUser) {
        return {
          result: {
            userId: command.userId,
            success: false,
            message: 'User not found'
          }
        };
      }

      // ユーザー情報を更新（新しいインスタンスを作成）
      const updatedUser = existingUser.updateProfile(
        command.firstName,
        command.lastName,
        command.phone
      );

      // 更新されたユーザーを保存
      const savedUser = await this.userRepository.update(updatedUser);

      // DTOに変換して返却
      const userResponseDTO = UserDTOMapper.toResponseDTO(savedUser);

      return {
        user: userResponseDTO,
        result: {
          userId: savedUser.id.value,
          success: true,
          message: 'User profile updated successfully'
        }
      };

    } catch (error) {
      console.error('Error in UpdateUserProfileUseCase:', error);
      return {
        result: {
          userId: command.userId,
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update user profile'
        }
      };
    }
  }
}