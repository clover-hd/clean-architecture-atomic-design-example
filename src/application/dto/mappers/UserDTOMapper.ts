import { User } from '../../../domain/entities';
import { UserId, Email } from '../../../domain/value-objects';
import {
  UserResponseDTO,
  UserSummaryResponseDTO,
  UserListResponseDTO
} from '../response/UserResponseDTO';
import { CreateUserRequestDTO } from '../request/CreateUserRequestDTO';

/**
 * ユーザーDTOマッパー
 */
export class UserDTOMapper {
  /**
   * UserエンティティをUserResponseDTOに変換
   */
  static toResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.id.value.toString(),
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * UserエンティティをUserSummaryResponseDTOに変換
   */
  static toSummaryResponseDTO(user: User): UserSummaryResponseDTO {
    return {
      id: user.id.value.toString(),
      email: user.email.value,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString()
    };
  }

  /**
   * Userエンティティの配列をUserListResponseDTOに変換
   */
  static toListResponseDTO(
    users: User[],
    page: number,
    limit: number,
    total: number
  ): UserListResponseDTO {
    return {
      users: users.map(user => this.toSummaryResponseDTO(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * CreateUserRequestDTOからUserエンティティ作成に必要なデータを抽出
   */
  static extractCreateUserData(dto: CreateUserRequestDTO): {
    email: Email;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
  } {
    return {
      email: Email.create(dto.email),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || undefined
    };
  }

  /**
   * Userエンティティをログイン用のレスポンス形式に変換
   */
  static toLoginUserData(user: User): {
    id: string;
    email: string;
    fullName: string;
    isAdmin: boolean;
  } {
    return {
      id: user.id.value.toString(),
      email: user.email.value,
      fullName: user.fullName,
      isAdmin: user.isAdmin
    };
  }
}