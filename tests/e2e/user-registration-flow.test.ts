/**
 * ユーザー登録フロー E2Eテスト
 * アプリケーション全体のユーザー登録機能をエンドツーエンドでテスト
 */

import { TestDatabase, TestUtils, TestFixtures } from '../helpers';
import { UserRepository } from '../../src/infrastructure/repositories/UserRepository';
import { UserDomainService } from '../../src/domain/services/UserDomainService';
import { UserRegistrationUseCase } from '../../src/application/usecases/user/UserRegistrationUseCase';
import { CreateUserCommand } from '../../src/application/commands/CreateUserCommand';
import { UserController } from '../../src/presentation/controllers/UserController';
import { GetUserProfileUseCase, UpdateUserProfileUseCase } from '../../src/application/usecases/user';
import { GetUserQuery, UpdateUserCommand } from '../../src/application/commands';
import { Email } from '../../src/domain/value-objects';

describe('ユーザー登録フロー E2Eテスト', () => {
  let testDb: TestDatabase;
  let userRepository: UserRepository;
  let userDomainService: UserDomainService;
  let userRegistrationUseCase: UserRegistrationUseCase;
  let getUserProfileUseCase: GetUserProfileUseCase;
  let updateUserProfileUseCase: UpdateUserProfileUseCase;
  let userController: UserController;
  let fixtures: TestFixtures;

  // 共通セットアップ
  TestUtils.setupTestDatabase();

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    fixtures = TestFixtures.getInstance();

    // インフラストラクチャ層の初期化
    userRepository = new UserRepository();
    (userRepository as any).database = testDb.getDatabase();

    // ドメインサービスの初期化
    userDomainService = new UserDomainService(userRepository);

    // アプリケーション層の初期化
    userRegistrationUseCase = new UserRegistrationUseCase(userRepository, userDomainService);
    getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
    updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository, userDomainService);

    // プレゼンテーション層の初期化
    userController = new UserController(
      getUserProfileUseCase,
      updateUserProfileUseCase,
      null as any // GetOrderUseCase は今回のテストでは不要
    );
  });

  describe('完全なユーザー登録フロー', () => {
    test('新規ユーザー登録から プロフィール更新まで', async () => {
      // === STEP 1: 新規ユーザー登録 ===
      const registrationCommand = new CreateUserCommand(
        'newuser@example.com',
        'New',
        'User',
        'password123',
        '555-1234'
      );

      const registrationResult = await userRegistrationUseCase.execute(registrationCommand);

      // 登録成功の検証
      expect(registrationResult.result.success).toBe(true);
      expect(registrationResult.user).toBeDefined();
      expect(registrationResult.user?.email).toBe('newuser@example.com');
      expect(registrationResult.user?.firstName).toBe('New');
      expect(registrationResult.user?.lastName).toBe('User');

      const userId = registrationResult.result.userId;

      // === STEP 2: データベースへの永続化確認 ===
      const savedUser = await userRepository.findByEmail(Email.create('newuser@example.com'));
      expect(savedUser).toBeDefined();
      expect(savedUser?.id.value.toString()).toBe(userId);
      expect(savedUser?.phone).toBe('555-1234');
      expect(savedUser?.isAdmin).toBe(false);

      // === STEP 3: プロフィール取得 ===
      const profileQuery = new GetUserQuery(userId);
      const profileResult = await getUserProfileUseCase.execute(profileQuery);

      expect(profileResult.success).toBe(true);
      expect(profileResult.data).toBeDefined();
      expect(profileResult.data?.email).toBe('newuser@example.com');

      // === STEP 4: プロフィール更新 ===
      const updateCommand = new UpdateUserCommand(
        userId,
        'UpdatedUser',
        'updated@example.com',
        'password123', // 現在のパスワード
        'newpassword123' // 新しいパスワード
      );

      const updateResult = await updateUserProfileUseCase.execute(updateCommand);

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.email).toBe('updated@example.com');

      // === STEP 5: 更新後のデータ確認 ===
      const updatedUser = await userRepository.findByEmail(Email.create('updated@example.com'));
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe('UpdatedUser');

      // 古いメールアドレスでは見つからないことを確認
      const oldEmailUser = await userRepository.findByEmail(Email.create('newuser@example.com'));
      expect(oldEmailUser).toBeNull();
    });

    test('重複メールアドレスでの登録失敗', async () => {
      // === STEP 1: 最初のユーザー登録 ===
      const firstUserCommand = new CreateUserCommand(
        'duplicate@example.com',
        'First',
        'User',
        'password123'
      );

      const firstResult = await userRegistrationUseCase.execute(firstUserCommand);
      expect(firstResult.result.success).toBe(true);

      // === STEP 2: 同じメールアドレスで2回目の登録を試行 ===
      const secondUserCommand = new CreateUserCommand(
        'duplicate@example.com',
        'Second',
        'User',
        'password456'
      );

      const secondResult = await userRegistrationUseCase.execute(secondUserCommand);

      // 登録失敗の検証
      expect(secondResult.result.success).toBe(false);
      expect(secondResult.result.message).toBe('Email already exists');
      expect(secondResult.user).toBeUndefined();

      // === STEP 3: データベースに最初のユーザーのみ存在することを確認 ===
      const users = await userRepository.findAll();
      const duplicateUsers = users.filter(u => u.email.value === 'duplicate@example.com');
      expect(duplicateUsers).toHaveLength(1);
      expect(duplicateUsers[0].firstName).toBe('First');
    });

    test('無効なデータでの登録とバリデーション', async () => {
      // === STEP 1: 無効なメールアドレス ===
      const invalidEmailCommand = new CreateUserCommand(
        'invalid-email',
        'Test',
        'User',
        'password123'
      );

      const invalidEmailResult = await userRegistrationUseCase.execute(invalidEmailCommand);
      expect(invalidEmailResult.result.success).toBe(false);
      expect(invalidEmailResult.result.message).toContain('Invalid email format');

      // === STEP 2: 短すぎるパスワード ===
      const shortPasswordCommand = new CreateUserCommand(
        'test@example.com',
        'Test',
        'User',
        '123' // 短すぎる
      );

      const shortPasswordResult = await userRegistrationUseCase.execute(shortPasswordCommand);
      expect(shortPasswordResult.result.success).toBe(false);
      expect(shortPasswordResult.result.message).toContain('Password must be at least 8 characters long');

      // === STEP 3: 空の名前 ===
      const emptyNameCommand = new CreateUserCommand(
        'test@example.com',
        '', // 空の名前
        'User',
        'password123'
      );

      const emptyNameResult = await userRegistrationUseCase.execute(emptyNameCommand);
      expect(emptyNameResult.result.success).toBe(false);
      expect(emptyNameResult.result.message).toContain('First name is required');

      // === STEP 4: すべて失敗してデータベースにユーザーが作成されていないことを確認 ===
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(0);
    });
  });

  describe('管理者機能のE2Eテスト', () => {
    test('管理者権限の昇格と降格フロー', async () => {
      // === STEP 1: 通常ユーザーを作成 ===
      const userCommand = new CreateUserCommand(
        'user@example.com',
        'Regular',
        'User',
        'password123'
      );

      const userResult = await userRegistrationUseCase.execute(userCommand);
      expect(userResult.result.success).toBe(true);

      const user = await userRepository.findByEmail(Email.create('user@example.com'));
      expect(user?.isAdmin).toBe(false);

      // === STEP 2: 管理者ユーザーを作成 ===
      const adminCommand = new CreateUserCommand(
        'admin@example.com',
        'Admin',
        'User',
        'password123'
      );

      const adminResult = await userRegistrationUseCase.execute(adminCommand);
      expect(adminResult.result.success).toBe(true);

      // 手動で管理者権限を付与（実際のアプリケーションでは管理画面から）
      let admin = await userRepository.findByEmail(Email.create('admin@example.com'));
      admin = admin!.promoteToAdmin();
      await userRepository.update(admin);

      // === STEP 3: 管理者の昇格可能性チェック ===
      const canPromote = await userDomainService.canPromoteToAdmin(user!);
      expect(canPromote).toBe(true);

      // === STEP 4: ユーザーを管理者に昇格 ===
      const promotedUser = user!.promoteToAdmin();
      await userRepository.update(promotedUser);

      const updatedUser = await userRepository.findByEmail(Email.create('user@example.com'));
      expect(updatedUser?.isAdmin).toBe(true);

      // === STEP 5: 管理者数の確認 ===
      const adminCount = await userRepository.countAdmins();
      expect(adminCount).toBe(2); // admin@example.com + user@example.com

      // === STEP 6: 降格可能性チェック ===
      const canDemote = await userDomainService.canDemoteFromAdmin(updatedUser!);
      expect(canDemote).toBe(true); // 他に管理者がいるので降格可能

      // === STEP 7: 一人を降格 ===
      const demotedUser = updatedUser!.demoteFromAdmin();
      await userRepository.update(demotedUser);

      const finalUser = await userRepository.findByEmail(Email.create('user@example.com'));
      expect(finalUser?.isAdmin).toBe(false);

      // === STEP 8: 最後の管理者は降格不可 ===
      const lastAdmin = await userRepository.findByEmail(Email.create('admin@example.com'));
      const canDemoteLastAdmin = await userDomainService.canDemoteFromAdmin(lastAdmin!);
      expect(canDemoteLastAdmin).toBe(false);
    });
  });

  describe('同時実行とエッジケースのE2Eテスト', () => {
    test('複数の同時登録リクエスト', async () => {
      // === STEP 1: 複数のユーザー登録を同時実行 ===
      const commands = Array.from({ length: 5 }, (_, i) =>
        new CreateUserCommand(
          `concurrent${i}@example.com`,
          `User`,
          `${i}`,
          'password123'
        )
      );

      const promises = commands.map(command =>
        userRegistrationUseCase.execute(command)
      );

      const results = await Promise.all(promises);

      // === STEP 2: すべて成功することを確認 ===
      results.forEach((result, index) => {
        expect(result.result.success).toBe(true);
        expect(result.user?.email).toBe(`concurrent${index}@example.com`);
      });

      // === STEP 3: データベースにすべてのユーザーが存在することを確認 ===
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(5);

      const emails = allUsers.map(u => u.email.value).sort();
      const expectedEmails = commands.map(c => c.email).sort();
      expect(emails).toEqual(expectedEmails);
    });

    test('同じメールアドレスでの競合状態テスト', async () => {
      // === STEP 1: 同じメールアドレスで同時登録を試行 ===
      const sameEmailCommands = [
        new CreateUserCommand('race@example.com', 'User', 'One', 'password123'),
        new CreateUserCommand('race@example.com', 'User', 'Two', 'password123'),
        new CreateUserCommand('race@example.com', 'User', 'Three', 'password123')
      ];

      const promises = sameEmailCommands.map(command =>
        userRegistrationUseCase.execute(command)
      );

      const results = await Promise.all(promises);

      // === STEP 2: 1つだけ成功し、他は失敗することを確認 ===
      const successResults = results.filter(r => r.result.success);
      const failureResults = results.filter(r => !r.result.success);

      expect(successResults).toHaveLength(1);
      expect(failureResults).toHaveLength(2);

      failureResults.forEach(result => {
        expect(result.result.message).toBe('Email already exists');
      });

      // === STEP 3: データベースに1つだけユーザーが存在することを確認 ===
      const users = await userRepository.findAll();
      const raceUsers = users.filter(u => u.email.value === 'race@example.com');
      expect(raceUsers).toHaveLength(1);
    });

    test('極限値でのユーザー登録', async () => {
      // === STEP 1: 最大長の値でユーザー登録 ===
      const maxLengthName = 'A'.repeat(255);
      const maxLengthEmail = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.com';

      const extremeCommand = new CreateUserCommand(
        maxLengthEmail,
        maxLengthName,
        maxLengthName,
        'password123',
        '555-' + '1'.repeat(10) // 長い電話番号
      );

      const result = await userRegistrationUseCase.execute(extremeCommand);

      // === STEP 2: 成功することを確認 ===
      expect(result.result.success).toBe(true);
      expect(result.user?.firstName).toBe(maxLengthName);
      expect(result.user?.email).toBe(maxLengthEmail);

      // === STEP 3: データベースから取得して確認 ===
      const savedUser = await userRepository.findByEmail(Email.create(maxLengthEmail));
      expect(savedUser?.firstName).toBe(maxLengthName);
      expect(savedUser?.lastName).toBe(maxLengthName);
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量ユーザー登録のパフォーマンス', async () => {
      // === STEP 1: 50ユーザーの登録時間を測定 ===
      const userCount = 50;
      const commands = Array.from({ length: userCount }, (_, i) =>
        new CreateUserCommand(
          `perf${i}@example.com`,
          `Performance`,
          `User${i}`,
          'password123'
        )
      );

      const { duration } = await TestUtils.measureExecutionTime(async () => {
        const promises = commands.map(command =>
          userRegistrationUseCase.execute(command)
        );

        const results = await Promise.all(promises);

        // すべて成功することを確認
        expect(results.every(r => r.result.success)).toBe(true);
      });

      // === STEP 2: パフォーマンス要件を確認 ===
      console.log(`50ユーザー登録完了時間: ${duration}ms`);
      expect(duration).toBeLessThan(5000); // 5秒以内

      // === STEP 3: データベースに正しく保存されていることを確認 ===
      const allUsers = await userRepository.findAll();
      expect(allUsers).toHaveLength(userCount);
    });

    test('メモリリークの検出', async () => {
      // === STEP 1: メモリリークテスト ===
      const hasMemoryLeak = await TestUtils.detectMemoryLeak(async () => {
        // 大量のユーザー登録と削除を繰り返す
        for (let i = 0; i < 100; i++) {
          const command = new CreateUserCommand(
            `leak${i}@example.com`,
            'Leak',
            'Test',
            'password123'
          );

          const result = await userRegistrationUseCase.execute(command);
          if (result.result.success) {
            const user = await userRepository.findByEmail(Email.create(`leak${i}@example.com`));
            if (user) {
              await userRepository.delete(user.id);
            }
          }
        }
      });

      // === STEP 2: メモリリークがないことを確認 ===
      expect(hasMemoryLeak).toBe(false);
    });
  });
});