# Permission Test Suite - Installation Guide

Quick start guide for setting up and running the permission system tests.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Existing lashpop project setup

## Installation Steps

### 1. Install Testing Dependencies

Run the following command to install Vitest and related packages:

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

**Package Details:**
- `vitest`: Fast unit test framework (Vite-powered, compatible with Jest API)
- `@vitest/ui`: Optional web-based UI for running tests
- `@vitest/coverage-v8`: Coverage reporting using V8

### 2. Update package.json Scripts

Add these scripts to your `package.json` (if not already present):

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:permissions": "vitest run tests/permissions/",
    "test:watch": "vitest watch"
  }
}
```

### 3. Verify TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"],
    // ... other options
  },
  "include": ["src", "tests", "**/*.test.ts"]
}
```

### 4. Verify Vitest Configuration

The test suite includes `vitest.config.ts` which should be at the project root:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 5. Verify Test Setup File

Ensure `tests/setup.ts` exists with test environment configuration.

## Quick Test

Verify installation by running:

```bash
npm test -- --run tests/permissions/permission-helpers.test.ts
```

Expected output:
```
✓ tests/permissions/permission-helpers.test.ts (50)
   ✓ Permission Helper Tests (50)
     ✓ ROLE_HIERARCHY constant (3)
     ✓ hasRoleLevel() (15)
     ✓ hasPermission() (12)
     ✓ canAccessCollection() (15)
     ✓ Integration (5)

Test Files  1 passed (1)
Tests  50 passed (50)
```

## Running the Tests

### All Permission Tests
```bash
npm run test:permissions
```

### Specific Test File
```bash
npm test tests/permissions/api-permissions.test.ts
npm test tests/permissions/auth-middleware.test.ts
npm test tests/permissions/permission-helpers.test.ts
npm test tests/permissions/permission-integration.test.ts
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### With UI Dashboard
```bash
npm run test:ui
```
Then open http://localhost:51204/__vitest__/ in your browser.

### With Coverage Report
```bash
npm run test:coverage
```

Coverage report will be in `coverage/index.html`.

## Test Files Overview

| File | Purpose | Tests | Coverage |
|------|---------|-------|----------|
| `api-permissions.test.ts` | API endpoint security | ~30 | Endpoints |
| `auth-middleware.test.ts` | Middleware functions | ~40 | Auth layer |
| `permission-helpers.test.ts` | Helper utilities | ~50 | Utils |
| `permission-integration.test.ts` | E2E workflows | ~15 | Integration |
| `MANUAL_TEST_PLAN.md` | Manual testing | 150+ | UI/UX |

## Troubleshooting

### Issue: "Cannot find module '@/...'"

**Solution:** Check that `vitest.config.ts` has the correct alias:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

### Issue: "vitest: command not found"

**Solution:** Run `npm install` again, or use npx:
```bash
npx vitest
```

### Issue: Tests fail with database errors

**Solution:** Tests use mocks - ensure mocks are properly set up. Database calls should not reach actual database.

### Issue: TypeScript errors in test files

**Solution:** Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "node"]
  }
}
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test:run

    - name: Generate coverage
      run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella
```

## Manual Testing

For comprehensive manual testing, follow the checklist in:
```
tests/permissions/MANUAL_TEST_PLAN.md
```

This includes:
- UI testing for all roles
- API endpoint testing
- Permission workflows
- Edge cases
- Multi-user scenarios

## Next Steps

1. **Run the tests**: `npm run test:permissions`
2. **Review coverage**: `npm run test:coverage`
3. **Manual testing**: Use `MANUAL_TEST_PLAN.md`
4. **CI integration**: Add to your pipeline
5. **Maintain**: Update tests as features evolve

## Getting Help

- **Documentation**: See `tests/permissions/README.md`
- **Vitest Docs**: https://vitest.dev/
- **Examples**: Review existing test files

## Additional Resources

- [Vitest Configuration](https://vitest.dev/config/)
- [Testing Best Practices](https://vitest.dev/guide/best-practices.html)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Coverage Configuration](https://vitest.dev/guide/coverage.html)

---

**Quick Command Reference:**

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests in watch mode |
| `npm run test:run` | Run all tests once |
| `npm run test:permissions` | Run permission tests only |
| `npm run test:ui` | Open test UI dashboard |
| `npm run test:coverage` | Generate coverage report |
| `npm test -- -t "specific test"` | Run specific test by name |
