# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **TypeScript EC Site** implementing **Clean Architecture** with **4-layer design** pattern. The application is an e-commerce platform built with Express.js, SQLite, and EJS templating.

### Core Architecture Pattern

The codebase follows strict Clean Architecture principles with clear layer boundaries:

```
src/
├── domain/          # Domain Layer - Business logic and entities
├── application/     # Application Layer - Use cases and orchestration
├── infrastructure/  # Infrastructure Layer - Data persistence and external services
├── presentation/    # Presentation Layer - HTTP handlers and routes
└── shared/         # Shared utilities and types
```

**Dependency Rule**: Dependencies point inward. Domain has no dependencies, Application depends only on Domain, Infrastructure implements Domain interfaces, Presentation orchestrates Application use cases.

### TypeScript Path Aliases

The project uses comprehensive path mapping in `tsconfig.json`:

```
@/*                 → src/*
@/domain/*          → src/domain/*
@/application/*     → src/application/*
@/infrastructure/*  → src/infrastructure/*
@/presentation/*    → src/presentation/*
@/shared/*          → src/shared/*
```

Always use these aliases for imports to maintain clean architecture boundaries.

## Essential Commands

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to dist/
npm start           # Run compiled production build
```

### Code Quality
```bash
npm run lint        # Run ESLint on src/**/*.ts
npm run lint:fix    # Auto-fix ESLint violations
npm run format      # Format code with Prettier
npm run format:check # Check Prettier formatting
```

### Testing
```bash
npm test            # Run all tests with Jest
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

Tests are organized by architecture layer:
- `tests/unit/` - Individual component tests
- `tests/integration/` - Cross-layer integration tests
- `tests/e2e/` - End-to-end application tests
- `tests/domain/` - Domain logic tests

### Database
```bash
npm run db:migrate  # Execute database migrations
npm run db:seed     # Insert seed data
```

Database files are stored in `database/` directory using SQLite.

## Architecture Patterns

### Domain Layer (`src/domain/`)

**Entities**: Rich domain models with business logic and invariants
- Example: `User.ts` has validation, business methods like `promoteToAdmin()`
- Immutable by design - methods return new instances

**Value Objects**: Type-safe primitives with validation
- `UserId`, `Email`, `Price`, `OrderStatus` etc.
- Encapsulate validation and business rules

**Repository Interfaces**: Define data access contracts
- `IUserRepository`, `IProductRepository`, etc.
- Implemented by Infrastructure layer

**Domain Services**: Complex business logic spanning multiple entities
- `UserDomainService`, `OrderDomainService`, etc.

### Application Layer (`src/application/`)

**Use Cases**: Single-purpose application operations
- Follow pattern: `GetUserProfileUseCase`, `CreateOrderUseCase`
- Return structured results with success/failure status

**Commands/Queries**: CQRS pattern implementation
- Commands: `CreateUserCommand`, `UpdateCartCommand`
- Queries: `GetUserQuery`, `GetOrderQuery`

**DTOs**: Data transfer objects for external communication
- Request DTOs: `CreateUserRequestDTO`
- Response DTOs: `UserResponseDTO`
- Mappers: Convert between domain entities and DTOs

**Services**: Application orchestration services
- `CartManagementService`, `OrderManagementService`

### Infrastructure Layer (`src/infrastructure/`)

**Repository Implementations**: Concrete data access using SQLite
- `UserRepository` implements `IUserRepository`
- Uses `DatabaseErrorHandler` for consistent error handling
- All database operations wrapped with error context

**Database**: SQLite connection and query execution
- `Database.ts` - Connection management and query methods
- Supports transactions with `withTransaction()`

**Mappers**: Convert between database rows and domain entities
- `UserMapper.toDomain()`, `UserMapper.toInsertParams()`

### Presentation Layer (`src/presentation/`)

**Controllers**: HTTP request handlers
- Extend `BaseController` for common functionality
- Handle both HTML and JSON responses
- Use Use Cases for business logic

**Routes**: Express.js route definitions
- Organized by feature: `auth.ts`, `user.ts`, `admin.ts`

**Middleware**: Cross-cutting concerns
- Authentication, validation, error handling

## Key Implementation Patterns

### Error Handling Strategy

1. **Domain Layer**: Throws business domain exceptions
2. **Infrastructure Layer**: Uses `DatabaseErrorHandler` with context
3. **Application Layer**: Returns structured `{success, message, data}` results
4. **Presentation Layer**: Converts to appropriate HTTP responses

### Value Object Pattern

All domain primitives are Value Objects:
```typescript
// Don't use raw types
const userId: string = "123";

// Use Value Objects
const userId = new UserId("123"); // Validates on construction
```

### Repository Pattern

Always program against interfaces:
```typescript
// In Use Cases - depend on interface
constructor(private userRepository: IUserRepository) {}

// In Infrastructure - provide implementation
class UserRepository implements IUserRepository {
  // SQLite-specific implementation
}
```

### CQRS Pattern

Separate commands (writes) from queries (reads):
```typescript
// Commands modify state
const command = new CreateUserCommand(email, firstName, lastName);

// Queries fetch data
const query = new GetUserQuery(userId);
```

### Dependency Injection

Use constructor injection consistently:
```typescript
// Controllers receive Use Cases
constructor(
  private getUserUseCase: GetUserProfileUseCase,
  private updateUserUseCase: UpdateUserProfileUseCase
) {}
```

## Testing Strategy

### Coverage Requirements (jest.config.js)
- **Domain Layer**: 90% coverage (business-critical)
- **Application Use Cases**: 90% coverage (core workflows)
- **Infrastructure Repositories**: 85% coverage (data integrity)
- **Overall**: 80% minimum coverage

### Test Organization
- Unit tests for individual components
- Integration tests for layer interactions
- E2E tests for complete user workflows
- Domain tests for business logic validation

### Running Single Tests
```bash
# Run specific test file
npm test UserRepository.test.ts

# Run tests matching pattern
npm test --testNamePattern="User creation"

# Run tests in specific directory
npm test tests/domain/
```

## Development Guidelines

### Clean Architecture Enforcement

1. **Never import from outer layers**: Domain cannot import from Application/Infrastructure/Presentation
2. **Use dependency injection**: Pass dependencies through constructors
3. **Keep entities pure**: No framework dependencies in Domain layer
4. **Repository pattern**: All data access through interfaces

### Code Style (ESLint + Prettier)

- **Naming**: camelCase variables, PascalCase types/classes
- **Imports**: Use path aliases (`@/domain/*` not `../../../domain/*`)
- **No console.log**: Use proper logging (except in development scripts)
- **TypeScript strict mode**: Enabled with all strict checking options

### Path Structure Conventions

- **Entities**: `src/domain/entities/`
- **Value Objects**: `src/domain/value-objects/`
- **Use Cases**: `src/application/usecases/{feature}/`
- **Repositories**: Interface in `src/domain/repositories/`, Implementation in `src/infrastructure/repositories/`
- **Controllers**: `src/presentation/controllers/`

This architecture supports scalable development while maintaining clear separation of concerns and testability.