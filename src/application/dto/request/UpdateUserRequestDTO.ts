/**
 * ユーザー更新リクエストDTO
 */
export interface UpdateUserRequestDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/**
 * ユーザー更新リクエストDTO検証
 */
export class UpdateUserRequestDTOValidator {
  static validate(dto: UpdateUserRequestDTO): string[] {
    const errors: string[] = [];

    if (dto.firstName !== undefined) {
      if (!dto.firstName || dto.firstName.trim().length === 0) {
        errors.push('First name cannot be empty');
      } else if (dto.firstName.length > 50) {
        errors.push('First name must be 50 characters or less');
      }
    }

    if (dto.lastName !== undefined) {
      if (!dto.lastName || dto.lastName.trim().length === 0) {
        errors.push('Last name cannot be empty');
      } else if (dto.lastName.length > 50) {
        errors.push('Last name must be 50 characters or less');
      }
    }

    if (dto.phone !== undefined && dto.phone.length > 20) {
      errors.push('Phone number must be 20 characters or less');
    }

    return errors;
  }
}