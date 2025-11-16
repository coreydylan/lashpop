/**
 * Vitest Test Setup
 *
 * Global setup for all test files
 */

import { beforeAll, afterAll, afterEach } from 'vitest'

// Setup runs before all tests
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.BETTER_AUTH_SECRET = 'test-secret-key'
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
})

// Cleanup after each test
afterEach(() => {
  // Clear all mocks after each test
  // This is done automatically by vitest when using vi.mock()
})

// Cleanup after all tests
afterAll(() => {
  // Final cleanup if needed
})
