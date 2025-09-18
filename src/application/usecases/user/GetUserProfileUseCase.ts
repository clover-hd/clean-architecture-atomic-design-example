import { UserId } from '../../../domain/value-objects';
import { IUserRepository } from '../../../domain/repositories';
import { UserResponseDTO } from '../../dto/response';
import { UserDTOMapper } from '../../dto/mappers';
import { GetUserQuery } from '../../queries';

/**
 * ユーザープロフィール取得ユースケース
 */
export class GetUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * ユーザープロフィールを取得
   */
  async execute(query: GetUserQuery): Promise<{
    success: boolean;
    message: string;
    data?: UserResponseDTO;
  }> {
    try {
      // クエリの検証
      const validationErrors = query.validate();
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: validationErrors.join(', ')
        };
      }

      // ユーザーを取得
      const userId = new UserId(query.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // DTOに変換して返却
      const userResponseDTO = UserDTOMapper.toResponseDTO(user);

      return {
        success: true,
        message: 'User profile retrieved successfully',
        data: userResponseDTO
      };

    } catch (error) {
      console.error('Error in GetUserProfileUseCase:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user profile'
      };
    }
  }
}