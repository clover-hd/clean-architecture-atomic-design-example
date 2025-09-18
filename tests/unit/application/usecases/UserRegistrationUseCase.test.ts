/**
 * UserRegistrationUseCase テスト
 * ユーザー登録ユースケースの包括的なテスト
 */

import { UserRegistrationUseCase } from '../../../../src/application/usecases/user/UserRegistrationUseCase';
import { CreateUserCommand } from '../../../../src/application/commands/CreateUserCommand';
import { IUserRepository } from '../../../../src/domain/repositories/IUserRepository';
import { UserDomainService } from '../../../../src/domain/services/UserDomainService';
import { User } from '../../../../src/domain/entities/User';
import { UserId, Email } from '../../../../src/domain/value-objects';
import { TestDataFactory, MockFactory, TestUtils } from '../../../helpers';
import * as bcrypt from 'bcrypt';

// bcryptのモック
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserRegistrationUseCase', () => {
  let useCase: UserRegistrationUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockUserDomainService: jest.Mocked<UserDomainService>;

  beforeEach(() => {
    mockUserRepository = MockFactory.createUserRepositoryMock();
    mockUserDomainService = MockFactory.createUserDomainServiceMock();
    useCase = new UserRegistrationUseCase(mockUserRepository, mockUserDomainService);

    // bcryptのデフォルトモック設定
    mockBcrypt.hash.mockResolvedValue('hashed_password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系テスト', () => {
    test('有効なコマンドで新規ユーザーが正常に作成される', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123',
        '123-456-7890'
      );

      const createdUser = TestDataFactory.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.result.message).toBe('User created successfully');
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.firstName).toBe('Test');
      expect(result.user?.lastName).toBe('User');

      // モック呼び出しの検証
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'test@example.com' })
      );
      expect(mockUserDomainService.validateUserCreation).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    test('電話番号なしでユーザーが作成される', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123'
        // phone は省略
      );

      const createdUser = TestDataFactory.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.phone).toBeUndefined();
    });
  });

  describe('バリデーションエラーテスト', () => {
    test('無効なメールアドレスでバリデーションエラー', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'invalid-email',
        'Test',
        'User',
        'password123'
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toContain('Invalid email format');
      expect(result.user).toBeUndefined();

      // リポジトリが呼ばれていないことを確認
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    test('空の名前でバリデーションエラー', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        '', // 空の名前
        'User',
        'password123'
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toContain('First name is required');
      expect(result.user).toBeUndefined();
    });

    test('短すぎるパスワードでバリデーションエラー', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        '123' // 短すぎるパスワード
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toContain('Password must be at least 8 characters long');
      expect(result.user).toBeUndefined();
    });

    test('複数のバリデーションエラーが統合される', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'invalid-email',
        '', // 空の名前
        'User',
        '123' // 短いパスワード
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toContain('Invalid email format');
      expect(result.result.message).toContain('First name is required');
      expect(result.result.message).toContain('Password must be at least 8 characters long');
    });
  });

  describe('ビジネスルールエラーテスト', () => {
    test('既存のメールアドレスで登録エラー', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'existing@example.com',
        'Test',
        'User',
        'password123'
      );

      const existingUser = TestDataFactory.createUser({
        email: 'existing@example.com'
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toBe('Email already exists');
      expect(result.user).toBeUndefined();

      // 重複チェック後は処理が停止することを確認
      expect(mockUserDomainService.validateUserCreation).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    test('ドメインサービスのバリデーションエラー', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123'
      );

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockRejectedValue(
        new Error('Domain validation failed')
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toBe('Domain validation failed');
      expect(result.user).toBeUndefined();

      // バリデーション失敗後は作成処理が呼ばれないことを確認
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('システムエラーテスト', () => {
    test('データベースエラー時の適切なエラーハンドリング', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123'
      );

      mockUserRepository.findByEmail.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toBe('Database connection failed');
      expect(result.user).toBeUndefined();
    });

    test('パスワードハッシュ化エラー時の適切なエラーハンドリング', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123'
      );

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockRejectedValue(new Error('Hash generation failed'));

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toBe('Hash generation failed');
      expect(result.user).toBeUndefined();
    });

    test('ユーザー作成時のデータベースエラー', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123'
      );

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockRejectedValue(
        new Error('Failed to create user in database')
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toBe('Failed to create user in database');
      expect(result.user).toBeUndefined();
    });

    test('未知のエラー時の適切なエラーハンドリング', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123'
      );

      mockUserRepository.findByEmail.mockRejectedValue('Unknown error');

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(false);
      expect(result.result.message).toBe('Unknown error occurred');
      expect(result.user).toBeUndefined();
    });
  });

  describe('エッジケースと境界値テスト', () => {
    test('最大長の名前での登録', async () => {
      // Arrange
      const longName = 'A'.repeat(255);
      const command = new CreateUserCommand(
        'test@example.com',
        longName,
        longName,
        'password123'
      );

      const createdUser = TestDataFactory.createUser({
        email: 'test@example.com',
        firstName: longName,
        lastName: longName
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.user?.firstName).toBe(longName);
      expect(result.user?.lastName).toBe(longName);
    });

    test('最長メールアドレスでの登録', async () => {
      // Arrange
      const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.com';
      const command = new CreateUserCommand(
        longEmail,
        'Test',
        'User',
        'password123'
      );

      const createdUser = TestDataFactory.createUser({
        email: longEmail,
        firstName: 'Test',
        lastName: 'User'
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.user?.email).toBe(longEmail);
    });

    test('特殊文字を含む名前での登録', async () => {
      // Arrange
      const specialName = 'Tëst-Üsér_123';
      const command = new CreateUserCommand(
        'test@example.com',
        specialName,
        specialName,
        'password123'
      );

      const createdUser = TestDataFactory.createUser({
        email: 'test@example.com',
        firstName: specialName,
        lastName: specialName
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.result.success).toBe(true);
      expect(result.user?.firstName).toBe(specialName);
    });
  });

  describe('並行性テスト', () => {
    test('同時に複数のユーザー登録リクエスト', async () => {
      // Arrange
      const commands = [
        new CreateUserCommand('user1@example.com', 'User', 'One', 'password123'),
        new CreateUserCommand('user2@example.com', 'User', 'Two', 'password123'),
        new CreateUserCommand('user3@example.com', 'User', 'Three', 'password123')
      ];

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);

      // 各ユーザーに対応するモックレスポンス
      commands.forEach((command, index) => {
        const user = TestDataFactory.createUser({
          email: command.email,
          firstName: command.firstName,
          lastName: command.lastName
        });
        mockUserRepository.create.mockResolvedValueOnce(user);
      });

      // Act
      const promises = commands.map(command => useCase.execute(command));
      const results = await Promise.all(promises);

      // Assert
      results.forEach((result, index) => {
        expect(result.result.success).toBe(true);
        expect(result.user?.email).toBe(commands[index].email);
      });

      expect(mockUserRepository.create).toHaveBeenCalledTimes(3);
    });

    test('同じメールアドレスでの同時登録の競合状態', async () => {
      // Arrange
      const sameEmailCommands = [
        new CreateUserCommand('same@example.com', 'User', 'One', 'password123'),
        new CreateUserCommand('same@example.com', 'User', 'Two', 'password123')
      ];

      // 最初のチェックでは存在しないが、2回目で存在する
      mockUserRepository.findByEmail
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(TestDataFactory.createUser({ email: 'same@example.com' }));

      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue(
        TestDataFactory.createUser({ email: 'same@example.com' })
      );

      // Act
      const promises = sameEmailCommands.map(command => useCase.execute(command));
      const results = await Promise.all(promises);

      // Assert
      const successCount = results.filter(r => r.result.success).length;
      const errorCount = results.filter(r => !r.result.success).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1);

      const errorResult = results.find(r => !r.result.success);
      expect(errorResult?.result.message).toBe('Email already exists');
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量のユーザー登録処理の性能', async () => {
      // Arrange
      const userCount = 100;
      const commands = Array.from({ length: userCount }, (_, i) =>
        new CreateUserCommand(
          `user${i}@example.com`,
          `User`,
          `${i}`,
          'password123'
        )
      );

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);

      commands.forEach((command, index) => {
        const user = TestDataFactory.createUser({
          email: command.email,
          firstName: command.firstName,
          lastName: command.lastName
        });
        mockUserRepository.create.mockResolvedValueOnce(user);
      });

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        const promises = commands.map(command => useCase.execute(command));
        const results = await Promise.all(promises);

        expect(results.every(r => r.result.success)).toBe(true);
      });

      // 100ユーザーの登録が2秒以内に完了することを確認
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('型安全性テスト', () => {
    test('コマンドの型安全性', () => {
      // Arrange & Act & Assert
      expect(() => {
        new CreateUserCommand(
          'test@example.com',
          'Test',
          'User',
          'password123',
          '123-456-7890'
        );
      }).not.toThrow();

      // TypeScriptコンパイル時に型エラーを検証
      // @ts-expect-error - 必須パラメータが不足
      // new CreateUserCommand('test@example.com');
    });

    test('レスポンスの型安全性', async () => {
      // Arrange
      const command = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        'password123'
      );

      const createdUser = TestDataFactory.createUser({
        email: 'test@example.com'
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserDomainService.validateUserCreation.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await useCase.execute(command);

      // Assert - 型の存在確認
      TestUtils.expectObjectToHaveProperties(result, ['user', 'result']);
      TestUtils.expectObjectToHaveProperties(result.result, [
        'userId', 'email', 'success', 'message'
      ]);

      if (result.user) {
        TestUtils.expectObjectToHaveProperties(result.user, [
          'id', 'email', 'firstName', 'lastName'
        ]);
      }
    });
  });
});