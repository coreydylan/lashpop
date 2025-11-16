# Permission System Test Suite

Comprehensive testing suite for the Digital Asset Management (DAM) permission system, including authentication, authorization, role-based access control, and audit logging.

## Overview

This test suite provides automated tests for:
- API endpoint authentication and authorization
- Authentication middleware functions
- Permission helper utilities
- End-to-end permission workflows
- Manual testing checklist

## Test Files

### 1. `api-permissions.test.ts`
Tests API endpoints with different authentication and permission scenarios.

**Coverage:**
- Upload endpoint (`/api/dam/upload`)
  - Authentication validation
  - Permission checks (canUpload)
  - Role-based access
  - Inactive user handling
- Delete endpoint (`/api/dam/delete`)
  - Permission checks (canDelete)
  - Admin auto-grant
  - Role hierarchy
- User management endpoint (`/api/admin/dam-users`)
  - Admin-only access
  - Super admin restrictions
  - Permission change auditing
- Collection-level access control
- Session expiry handling
- Permission inheritance and overrides

**Test Count:** ~30 tests

### 2. `auth-middleware.test.ts`
Tests the authentication and authorization middleware functions.

**Coverage:**
- `requireAuth()` - Session validation
  - Valid/invalid/expired tokens
  - Missing cookies
  - User field handling
- `requireRole()` - Role hierarchy enforcement
  - Role comparison (viewer < editor < admin < super_admin)
  - Inactive user blocking
  - Insufficient role errors
- `requirePermission()` - Permission checks
  - Explicit permissions
  - Admin/super_admin auto-grant
  - Inactive user blocking
- `requireCollectionAccess()` - Collection access control
  - View vs edit permissions
  - "all" collections wildcard
  - Collection-specific permissions
  - Admin/super_admin override
- `hasRole()` and `hasPermission()` - Helper functions
- `logPermissionChange()` - Audit logging
- Error handling (UnauthorizedError, ForbiddenError)

**Test Count:** ~40 tests

### 3. `permission-helpers.test.ts`
Tests the permission helper functions from `/src/types/permissions.ts`.

**Coverage:**
- `ROLE_HIERARCHY` constant validation
- `hasRoleLevel()` - Role comparison logic
  - Same role
  - Higher role
  - Lower role
  - All combinations
- `hasPermission()` - Permission checking
  - Explicit permissions
  - Missing permissions
  - Multiple permissions
- `canAccessCollection()` - Collection access logic
  - Empty collections
  - "all" wildcard
  - Specific collections
  - Case sensitivity
  - Special characters and UUIDs
- Integration scenarios

**Test Count:** ~50 tests

### 4. `permission-integration.test.ts`
End-to-end integration tests for complete permission workflows.

**Coverage:**
- User creation → role assignment → permission grant → action
- Collection creation → access assignment → verification
- Permission change lifecycle with audit trail
- User activation/deactivation workflow
- Role hierarchy enforcement
- Team member linking workflow
- Complex multi-step workflows
  - Complete onboarding (create → activate → grant → link → upload)
  - Complete offboarding (downgrade → revoke → deactivate)

**Test Count:** ~15 tests

### 5. `MANUAL_TEST_PLAN.md`
Comprehensive manual testing checklist covering all aspects of the permission system.

**Sections:**
1. Authentication Tests (login, session, logout)
2. Viewer Role Tests (UI, API, explicit permissions)
3. Editor Role Tests (UI, API, permission combinations)
4. Admin Role Tests (user management, restrictions)
5. Super Admin Role Tests (full access)
6. Inactive User Tests
7. Collection-Level Permissions
8. Audit Log Tests
9. API Endpoint Security
10. Edge Cases and Error Handling
11. Multi-User Scenarios
12. Performance and Scale

**Total Checklist Items:** ~150+

## Setup

### Install Dependencies

First, install the required testing packages:

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes test files:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

### Update package.json

Add test scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:permissions": "vitest run tests/permissions/"
  }
}
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test
```

### Run Tests Once (CI Mode)
```bash
npm run test:run
```

### Run with UI
```bash
npm run test:ui
```

### Run Permission Tests Only
```bash
npm run test:permissions
```

### Run Specific Test File
```bash
npm test tests/permissions/api-permissions.test.ts
npm test tests/permissions/auth-middleware.test.ts
npm test tests/permissions/permission-helpers.test.ts
npm test tests/permissions/permission-integration.test.ts
```

### Run with Coverage
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

## Test Structure

### Mocking Strategy

Tests use mocking to isolate components:
- **Database (`@/db`)**: Mocked with query builder simulation
- **Next.js cookies**: Mocked to simulate authentication tokens
- **S3 operations**: Mocked to avoid actual AWS calls

### Helper Functions

Each test file includes helper functions:
- `createTestUser()` - Generate test user objects
- `createMockDb()` - Create mock database instance
- `mockCookies()` - Set up authentication cookies
- `createMockRequest()` - Generate Next.js request objects

### Test Organization

Tests are organized using Vitest's `describe()` blocks:
```typescript
describe('Feature Group', () => {
  describe('Specific Feature', () => {
    it('should do something specific', () => {
      // Test implementation
    })
  })
})
```

## Writing New Tests

### Example Test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { requireAuth } from '@/lib/server/dam-auth'

describe('New Feature', () => {
  it('should validate user permissions', async () => {
    // Arrange
    const mockUser = createTestUser('editor', { canUpload: true })
    mockDatabase([mockUser])
    mockCookies('valid-token')

    // Act
    const user = await requireAuth()

    // Assert
    expect(user.id).toBe('test-user-id')
    expect(user.permissions.canUpload).toBe(true)
  })
})
```

## Manual Testing

Use the `MANUAL_TEST_PLAN.md` checklist for manual testing:

1. Print or open the checklist
2. Set up test environment with users for each role
3. Go through each section systematically
4. Check off completed tests
5. Document any failures or issues
6. Summarize results at the end

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

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
      - run: npm run test:run
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Coverage Goals

Target coverage levels:
- **API Routes**: 80%+
- **Middleware**: 90%+
- **Helper Functions**: 95%+
- **Overall**: 85%+

## Troubleshooting

### Common Issues

**1. Module Resolution Errors**
- Ensure `vitest.config.ts` has correct path aliases
- Check `tsconfig.json` includes test files

**2. Mock Not Working**
- Use `vi.mock()` at the top level of the file
- Clear mocks between tests with `vi.clearAllMocks()`

**3. Async Test Failures**
- Ensure all async functions use `await`
- Mock async operations properly

**4. Type Errors**
- Add `/// <reference types="vitest/globals" />` to test files
- Install `@types/node` for Node.js types

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --reporter=verbose
```

Run single test in isolation:
```bash
npm test -- -t "should return true when user has exact role"
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Names**: Use descriptive test names
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock Minimally**: Only mock external dependencies
5. **Test Edge Cases**: Include error scenarios
6. **Keep Tests Fast**: Avoid unnecessary delays
7. **Update Tests**: Keep tests in sync with code changes

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://vitest.dev/guide/best-practices.html)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)

## Contributing

When adding new permission features:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add integration tests for workflows
4. Update manual test plan
5. Maintain coverage above thresholds

## Support

For issues or questions:
- Check this README
- Review test examples
- Consult Vitest documentation
- Contact the development team
