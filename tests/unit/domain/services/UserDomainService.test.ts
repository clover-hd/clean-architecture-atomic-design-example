/**
 * UserDomainService テスト
 * ユーザードメインのビジネスルールと検証ロジックをテスト
 */

import { UserDomainService } from '../../../../src/domain/services/UserDomainService';
import { User } from '../../../../src/domain/entities/User';
import { UserId, Email } from '../../../../src/domain/value-objects';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { TestDataFactory, MockFactory, TestUtils } from '../../../helpers';

describe('UserDomainService', () => {
  let userDomainService: UserDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = MockFactory.createUserRepositoryMock();
    userDomainService = new UserDomainService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUserCreation', () => {
    test('正常なユーザー作成時にエラーがスローされない', async () => {
      // Arrange
      const user = TestDataFactory.createUser({
        email: 'new@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await userDomainService.validateUserCreation(user);
      });

      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(user.email);
    });

    test('重複するメールアドレスでエラーがスローされる', async () => {
      // Arrange
      const user = TestDataFactory.createUser({
        email: 'existing@example.com'
      });

      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userDomainService.validateUserCreation(user),
        'Email already exists'
      );
    });

    test('無効な名前でエラーがスローされる', async () => {
      // Arrange
      const userId = UserId.create(1);
      const email = Email.create('test@example.com');

      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => {
          const user = User.create(userId, email, '', 'User'); // 空の名前
          await userDomainService.validateUserCreation(user);
        },
        'First name is required'
      );
    });
  });

  describe('validateUserUpdate', () => {
    test('正常な更新時にエラーがスローされない', async () => {
      // Arrange
      const existingUser = TestDataFactory.createUser({
        id: 1,
        email: 'existing@example.com'
      });

      const updatedUser = existingUser.updateProfile(
        'Updated',
        'Name',
        '123-456-7890'
      );

      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await userDomainService.validateUserUpdate(updatedUser);
      });
    });

    test('他のユーザーが使用中のメールアドレスでエラーがスローされる', async () => {
      // Arrange
      const existingUser = TestDataFactory.createUser({
        id: 1,
        email: 'user1@example.com'
      });

      const newEmail = Email.create('user2@example.com');
      const updatedUser = User.create(
        existingUser.id,
        newEmail,
        existingUser.firstName,
        existingUser.lastName
      );

      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userDomainService.validateUserUpdate(updatedUser),
        'Email already exists'
      );
    });

    test('同じユーザーの既存メールアドレスは許可される', async () => {
      // Arrange
      const user = TestDataFactory.createUser({
        id: 1,
        email: 'user@example.com'
      });

      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await userDomainService.validateUserUpdate(user);
      });
    });
  });

  describe('canPromoteToAdmin', () => {
    test('一般ユーザーは管理者に昇格できる', async () => {
      // Arrange
      const user = TestDataFactory.createUser({ isAdmin: false });

      // Act
      const result = await userDomainService.canPromoteToAdmin(user);

      // Assert
      expect(result).toBe(true);
    });

    test('既に管理者のユーザーは昇格できない', async () => {
      // Arrange
      const adminUser = TestDataFactory.createAdminUser();

      // Act
      const result = await userDomainService.canPromoteToAdmin(adminUser);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canDemoteFromAdmin', () => {
    test('複数の管理者がいる場合は降格できる', async () => {
      // Arrange
      const adminUser = TestDataFactory.createAdminUser();
      mockUserRepository.countAdmins.mockResolvedValue(2);

      // Act
      const result = await userDomainService.canDemoteFromAdmin(adminUser);

      // Assert
      expect(result).toBe(true);
    });

    test('最後の管理者は降格できない', async () => {
      // Arrange
      const adminUser = TestDataFactory.createAdminUser();
      mockUserRepository.countAdmins.mockResolvedValue(1);

      // Act
      const result = await userDomainService.canDemoteFromAdmin(adminUser);

      // Assert
      expect(result).toBe(false);
    });

    test('一般ユーザーは降格対象外', async () => {
      // Arrange
      const regularUser = TestDataFactory.createUser({ isAdmin: false });

      // Act
      const result = await userDomainService.canDemoteFromAdmin(regularUser);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isEmailAvailable', () => {
    test('未使用のメールアドレスは利用可能', async () => {
      // Arrange
      const email = Email.create('new@example.com');
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act
      const result = await userDomainService.isEmailAvailable(email);

      // Assert
      expect(result).toBe(true);
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(email, undefined);
    });

    test('使用中のメールアドレスは利用不可', async () => {
      // Arrange
      const email = Email.create('existing@example.com');
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Act
      const result = await userDomainService.isEmailAvailable(email);

      // Assert
      expect(result).toBe(false);
    });

    test('除外ユーザーIDを指定した場合の利用可能性チェック', async () => {
      // Arrange
      const email = Email.create('user@example.com');
      const excludeUserId = UserId.create(1);
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act
      const result = await userDomainService.isEmailAvailable(email, excludeUserId);

      // Assert
      expect(result).toBe(true);
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(email, excludeUserId);
    });
  });

  describe('validatePasswordChange', () => {
    test('有効なパスワード変更は通る', () => {
      // Arrange
      const currentPassword = 'currentPassword123';
      const newPassword = 'newPassword123';
      const confirmPassword = 'newPassword123';

      // Act & Assert
      expect(() => {
        userDomainService.validatePasswordChange(
          currentPassword,
          newPassword,
          confirmPassword
        );
      }).not.toThrow();
    });

    test('新しいパスワードと確認パスワードが一致しない場合エラー', () => {
      // Arrange
      const currentPassword = 'currentPassword123';
      const newPassword = 'newPassword123';
      const confirmPassword = 'differentPassword123';

      // Act & Assert
      expect(() => {
        userDomainService.validatePasswordChange(
          currentPassword,
          newPassword,
          confirmPassword
        );
      }).toThrow('Password confirmation does not match');
    });

    test('新しいパスワードが短すぎる場合エラー', () => {
      // Arrange
      const currentPassword = 'currentPassword123';
      const newPassword = '123'; // 短すぎる
      const confirmPassword = '123';

      // Act & Assert
      expect(() => {
        userDomainService.validatePasswordChange(
          currentPassword,
          newPassword,
          confirmPassword
        );
      }).toThrow('Password must be at least 8 characters long');
    });

    test('現在のパスワードが空の場合エラー', () => {
      // Arrange
      const currentPassword = '';
      const newPassword = 'newPassword123';
      const confirmPassword = 'newPassword123';

      // Act & Assert
      expect(() => {
        userDomainService.validatePasswordChange(
          currentPassword,
          newPassword,
          confirmPassword
        );
      }).toThrow('Current password is required');
    });

    test('現在のパスワードと新しいパスワードが同じ場合エラー', () => {
      // Arrange
      const currentPassword = 'samePassword123';
      const newPassword = 'samePassword123';
      const confirmPassword = 'samePassword123';

      // Act & Assert
      expect(() => {
        userDomainService.validatePasswordChange(
          currentPassword,
          newPassword,
          confirmPassword
        );
      }).toThrow('New password must be different from current password');
    });
  });

  describe('エッジケースと境界値テスト', () => {
    test('極めて長いメールアドレスの処理', async () => {
      // Arrange
      const longEmail = 'a'.repeat(100) + '@example.com';
      const email = Email.create(longEmail);
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act
      const result = await userDomainService.isEmailAvailable(email);

      // Assert
      expect(result).toBe(true);
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(email, undefined);
    });

    test('大量のユーザーが存在する状況での管理者降格チェック', async () => {
      // Arrange
      const adminUser = TestDataFactory.createAdminUser();
      mockUserRepository.countAdmins.mockResolvedValue(1000);

      // Act
      const result = await userDomainService.canDemoteFromAdmin(adminUser);

      // Assert
      expect(result).toBe(true);
    });

    test('データベースエラー時の適切なエラーハンドリング', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      mockUserRepository.existsByEmail.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userDomainService.validateUserCreation(user),
        'Database connection failed'
      );
    });
  });

  describe('同時実行制御テスト', () => {
    test('複数の同時ユーザー作成リクエストの処理', async () => {
      // Arrange
      const users = TestDataFactory.createUsers(5);
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act
      const promises = users.map(user =>
        userDomainService.validateUserCreation(user)
      );

      // Assert
      await TestUtils.expectNotToThrow(async () => {
        await Promise.all(promises);
      });

      expect(mockUserRepository.existsByEmail).toHaveBeenCalledTimes(5);
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量データでのバリデーション性能', async () => {
      // Arrange
      const users = TestDataFactory.createUsers(100);
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        const promises = users.map(user =>
          userDomainService.validateUserCreation(user)
        );
        await Promise.all(promises);
      });

      // 100ユーザーの検証が1秒以内に完了することを確認
      expect(duration).toBeLessThan(1000);
    });
  });
});