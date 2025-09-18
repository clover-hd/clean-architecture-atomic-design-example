# TypeScript クリーンアーキテクチャ包括的テスト環境

このプロジェクトに実装された包括的なテスト環境の概要と使用方法を説明します。

## テスト環境の概要

### 🎯 実装されたテスト戦略

#### 1. **4層アーキテクチャ対応テスト**
- **Domain層**: ビジネスルール・エンティティ・値オブジェクト・ドメインサービスの包括的テスト
- **Application層**: Use Case・アプリケーションサービス・DTO・コマンド/クエリのテスト
- **Infrastructure層**: Repository実装・データベース統合・外部サービス連携のテスト
- **Presentation層**: Controller・ミドルウェア・ルーティングのHTTPレベルテスト

#### 2. **型安全性テスト**
- TypeScriptの型システムを活用したコンパイル時エラー検証
- 型制約の境界値テスト
- ランタイム型安全性の検証

#### 3. **テストカバレッジ目標**
- **Domain層**: 90%（ビジネスロジックの完全性重視）
- **Application層 Use Case**: 90%（ユースケースの完全性）
- **Infrastructure層 Repository**: 85%（データ整合性）
- **全体**: 85%（高品質保証）

## 📁 ディレクトリ構造

```
tests/
├── unit/                     # 単体テスト
│   ├── domain/               # Domain層テスト
│   │   ├── entities/         # エンティティテスト
│   │   ├── value-objects/    # 値オブジェクトテスト
│   │   └── services/         # ドメインサービステスト
│   ├── application/          # Application層テスト
│   │   ├── usecases/         # Use Caseテスト
│   │   ├── services/         # アプリケーションサービステスト
│   │   └── dto/              # DTOマッパーテスト
│   └── presentation/         # Presentation層テスト
│       ├── controllers/      # コントローラーテスト
│       └── middleware/       # ミドルウェアテスト
├── integration/              # 統合テスト
│   └── infrastructure/       # インフラ統合テスト
│       └── repositories/     # Repository統合テスト
├── e2e/                      # エンドツーエンドテスト
│   └── user-registration-flow.test.ts  # ユーザー登録フロー
├── helpers/                  # テストヘルパー
│   ├── TestDatabase.ts       # テストDB管理
│   ├── MockFactory.ts        # モックファクトリ
│   ├── TestDataFactory.ts    # テストデータ生成
│   ├── TestUtils.ts          # テストユーティリティ
│   └── index.ts              # エクスポート
├── fixtures/                 # テストフィクスチャー
│   └── index.ts              # 統一されたテストデータ
├── setup.ts                  # Jest共通セットアップ
└── README.md                 # このファイル
```

## 🛠️ 実装されたテストツール

### テストヘルパークラス

#### 1. **TestDatabase**
```typescript
// インメモリSQLiteを使用したテスト専用DB
const testDb = TestDatabase.getInstance();
await testDb.initialize();
```

#### 2. **MockFactory**
```typescript
// 型安全なモック生成
const mockUserRepository = MockFactory.createUserRepositoryMock();
const mockRequest = MockFactory.createRequestMock({ body: { email: 'test@example.com' } });
```

#### 3. **TestDataFactory**
```typescript
// 一貫性のあるテストデータ生成
const user = TestDataFactory.createUser({ email: 'test@example.com' });
const products = TestDataFactory.createProducts(10);
```

#### 4. **TestUtils**
```typescript
// 汎用テストユーティリティ
await TestUtils.expectToThrow(async () => await service.method(), 'Expected error');
const { duration } = await TestUtils.measureExecutionTime(async () => { /* テスト対象 */ });
```

#### 5. **TestFixtures**
```typescript
// 統一されたフィクスチャーデータ
const fixtures = TestFixtures.getInstance();
await fixtures.seedDatabase(testDb);
const adminUser = fixtures.getAdminUser();
```

## 🚀 テストの実行方法

### 基本コマンド

```bash
# 全テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジ付きでテスト実行
npm run test:coverage

# 特定のテストファイルを実行
npm test user-registration

# 特定のテストスイートを実行
npm test -- --testNamePattern="UserRegistrationUseCase"
```

### 階層別テスト実行

```bash
# Domain層のみ
npm test tests/unit/domain

# Application層のみ
npm test tests/unit/application

# Infrastructure層のみ
npm test tests/integration/infrastructure

# E2Eテストのみ
npm test tests/e2e
```

### パフォーマンステスト

```bash
# パフォーマンステストを含む
npm test -- --testNamePattern="パフォーマンス"

# メモリリークテスト
npm test -- --testNamePattern="メモリリーク"
```

## 📊 テスト品質指標

### カバレッジ目標値

| 層 | 分岐 | 関数 | 行 | 文 |
|---|------|------|----|----|
| Domain | 90% | 90% | 90% | 90% |
| Application Use Case | 85% | 90% | 90% | 90% |
| Infrastructure Repository | 80% | 85% | 85% | 85% |
| 全体 | 80% | 85% | 85% | 85% |

### テスト種別の役割

1. **単体テスト (Unit Tests)**
   - 各層の個別コンポーネントテスト
   - モックを活用した依存関係の分離
   - ビジネスルールとロジックの検証

2. **統合テスト (Integration Tests)**
   - 実際のデータベースを使用
   - Repository層とDB間の統合確認
   - トランザクション整合性の検証

3. **E2Eテスト (End-to-End Tests)**
   - 全層を通したシナリオテスト
   - ユーザージャーニーの検証
   - 並行性とパフォーマンスの確認

## 🎯 テスト作成ガイドライン

### Domain層テスト

```typescript
describe('User Entity', () => {
  test('正常なユーザー作成', () => {
    // Given
    const userId = UserId.create(1);
    const email = Email.create('test@example.com');

    // When
    const user = User.create(userId, email, 'John', 'Doe');

    // Then
    expect(user.fullName).toBe('John Doe');
  });
});
```

### Application層テスト

```typescript
describe('UserRegistrationUseCase', () => {
  let useCase: UserRegistrationUseCase;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = MockFactory.createUserRepositoryMock();
    useCase = new UserRegistrationUseCase(mockRepository, mockDomainService);
  });

  test('正常なユーザー登録', async () => {
    // Given
    const command = new CreateUserCommand('test@example.com', 'John', 'Doe', 'password');
    mockRepository.findByEmail.mockResolvedValue(null);

    // When
    const result = await useCase.execute(command);

    // Then
    expect(result.result.success).toBe(true);
  });
});
```

### Infrastructure層テスト

```typescript
describe('UserRepository', () => {
  let repository: UserRepository;

  TestUtils.setupTestDatabase();

  test('ユーザー作成と取得', async () => {
    // Given
    const user = TestDataFactory.createUser();

    // When
    const savedUser = await repository.create(user);
    const foundUser = await repository.findById(savedUser.id);

    // Then
    expect(foundUser?.email.value).toBe(user.email.value);
  });
});
```

## 🔧 カスタムマッチャー

```typescript
// カスタムマッチャーの使用例
expect(price).toBeValidPrice();
expect(email).toBeValidEmail();
expect(timestamp).toHaveValidTimestamp();
expect(value).toBeWithinRange(1, 100);
```

## 📈 パフォーマンステスト

```typescript
test('大量データ処理性能', async () => {
  const { duration } = await TestUtils.measureExecutionTime(async () => {
    // テスト対象処理
  });

  expect(duration).toBeLessThan(1000); // 1秒以内
});

test('メモリリーク検出', async () => {
  const hasLeak = await TestUtils.detectMemoryLeak(async () => {
    // メモリリークを検出したい処理
  });

  expect(hasLeak).toBe(false);
});
```

## 🌐 CI/CD統合

### GitHub Actions設定例

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 🎛️ 環境設定

### 環境変数 (.env.test)

```env
NODE_ENV=test
DATABASE_URL=:memory:
LOG_LEVEL=error
TEST_TIMEOUT=30000
```

### VS Code設定

```json
{
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": "watch",
  "jest.showCoverageOnLoad": true
}
```

## 🐛 トラブルシューティング

### よくある問題と解決方法

1. **メモリ不足エラー**
   ```bash
   node --max-old-space-size=4096 node_modules/.bin/jest
   ```

2. **タイムアウトエラー**
   ```typescript
   test('重い処理', async () => {
     // テスト内容
   }, 60000); // 60秒に延長
   ```

3. **モック設定の問題**
   ```typescript
   // beforeEach で必ずクリア
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

## 📝 ベストプラクティス

### Do's ✅

1. **Arrange-Act-Assert パターンを使用**
2. **モックは最小限に、必要な部分のみ**
3. **テストデータは TestDataFactory を使用**
4. **非同期テストは async/await を使用**
5. **エラーケースも必ずテスト**
6. **パフォーマンステストも含める**

### Don'ts ❌

1. **実装詳細をテストしない**
2. **他のテストに依存しない**
3. **テスト間で状態を共有しない**
4. **マジックナンバーを使わない**
5. **テストコードにロジックを入れない**

## 🎓 学習リソース

- [Jest公式ドキュメント](https://jestjs.io/docs/getting-started)
- [テスト駆動開発](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [クリーンアーキテクチャ](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

この包括的なテスト環境により、TypeScriptクリーンアーキテクチャプロジェクトの品質と信頼性を高いレベルで保証することができます。