/**
 * Authentication Middleware Tests
 *
 * Tests the authentication and authorization middleware functions:
 * - requireAuth()
 * - requireRole()
 * - requirePermission()
 * - requireCollectionAccess()
 *
 * To run: npm test tests/permissions/auth-middleware.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  requireAuth,
  requireRole,
  requirePermission,
  requireCollectionAccess,
  hasRole,
  hasPermission,
  UnauthorizedError,
  ForbiddenError,
  logPermissionChange
} from '@/lib/server/dam-auth'
import { getDb } from '@/db'
import type { Role, UserPermissions, AuthenticatedUser } from '@/types/permissions'

// Mock database
vi.mock('@/db', () => ({
  getDb: vi.fn()
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

/**
 * Helper to create a mock database with session/user data
 */
function createMockDb(userData: any[] | null = null) {
  const mockSelect = vi.fn().mockReturnThis()
  const mockFrom = vi.fn().mockReturnThis()
  const mockInnerJoin = vi.fn().mockReturnThis()
  const mockLeftJoin = vi.fn().mockReturnThis()
  const mockWhere = vi.fn().mockReturnThis()
  const mockLimit = vi.fn().mockResolvedValue(userData || [])
  const mockInsert = vi.fn().mockReturnThis()
  const mockValues = vi.fn().mockResolvedValue(undefined)

  return {
    select: mockSelect,
    from: mockFrom,
    innerJoin: mockInnerJoin,
    leftJoin: mockLeftJoin,
    where: mockWhere,
    limit: mockLimit,
    insert: mockInsert,
    values: mockValues
  }
}

/**
 * Helper to create a test user
 */
function createTestUser(
  role: Role,
  permissions: Partial<UserPermissions> = {},
  overrides: any = {}
): any {
  return {
    id: 'test-user-id',
    role,
    permissions: {
      canUpload: false,
      canDelete: false,
      canManageUsers: false,
      canManageCollections: false,
      canExport: false,
      allowedCollections: [],
      ...permissions
    },
    teamMemberId: null,
    isActive: true,
    phone: '+1234567890',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides
  }
}

/**
 * Mock cookies function
 */
function mockCookies(token: string | null) {
  const { cookies } = require('next/headers')
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name === 'auth_token' && token) {
        return { value: token }
      }
      return undefined
    })
  })
}

describe('Authentication Middleware Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requireAuth()', () => {

    it('should throw UnauthorizedError when no auth token is provided', async () => {
      mockCookies(null)

      await expect(requireAuth()).rejects.toThrow(UnauthorizedError)
      await expect(requireAuth()).rejects.toThrow('No authentication token provided')
    })

    it('should throw UnauthorizedError when session is expired', async () => {
      mockCookies('expired-token')

      const mockDb = createMockDb([]) // Empty result = expired/invalid
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireAuth()).rejects.toThrow(UnauthorizedError)
      await expect(requireAuth()).rejects.toThrow('Invalid or expired session')
    })

    it('should return user when valid session exists', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('editor')
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      const user = await requireAuth()

      expect(user).toBeDefined()
      expect(user.id).toBe('test-user-id')
      expect(user.role).toBe('editor')
      expect(user.isActive).toBe(true)
    })

    it('should handle missing permissions field gracefully', async () => {
      mockCookies('valid-token')

      const userWithoutPermissions = {
        id: 'test-user-id',
        role: 'viewer',
        permissions: null, // Missing permissions
        teamMemberId: null,
        isActive: true,
        phone: '+1234567890',
        email: 'test@example.com',
        name: 'Test User'
      }

      const mockDb = createMockDb([userWithoutPermissions])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      const user = await requireAuth()

      expect(user.permissions).toBeDefined()
      expect(typeof user.permissions).toBe('object')
    })

    it('should return all user fields correctly', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('admin', {
        canUpload: true,
        canDelete: true
      }, {
        teamMemberId: 'team-123',
        phone: '+19876543210',
        email: 'admin@example.com',
        name: 'Admin User'
      })

      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      const user = await requireAuth()

      expect(user.id).toBe('test-user-id')
      expect(user.role).toBe('admin')
      expect(user.teamMemberId).toBe('team-123')
      expect(user.phone).toBe('+19876543210')
      expect(user.email).toBe('admin@example.com')
      expect(user.name).toBe('Admin User')
      expect(user.permissions.canUpload).toBe(true)
      expect(user.permissions.canDelete).toBe(true)
    })
  })

  describe('requireRole()', () => {

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockCookies(null)

      await expect(requireRole('viewer')).rejects.toThrow(UnauthorizedError)
    })

    it('should throw ForbiddenError when user is inactive', async () => {
      mockCookies('valid-token')

      const inactiveUser = createTestUser('admin', {}, { isActive: false })
      const mockDb = createMockDb([inactiveUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireRole('viewer')).rejects.toThrow(ForbiddenError)
      await expect(requireRole('viewer')).rejects.toThrow('inactive')
    })

    it('should throw ForbiddenError when user role is insufficient', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer')
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireRole('admin')).rejects.toThrow(ForbiddenError)
      await expect(requireRole('admin')).rejects.toThrow('Insufficient role')
    })

    it('should allow viewer when viewer role is required', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer')
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      const user = await requireRole('viewer')

      expect(user.role).toBe('viewer')
    })

    it('should allow editor when viewer role is required (hierarchy)', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('editor')
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      const user = await requireRole('viewer')

      expect(user.role).toBe('editor')
    })

    it('should allow admin when editor role is required (hierarchy)', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('admin')
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      const user = await requireRole('editor')

      expect(user.role).toBe('admin')
    })

    it('should allow super_admin for any required role', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('super_admin')
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireRole('viewer')).resolves.toBeDefined()
      await expect(requireRole('editor')).resolves.toBeDefined()
      await expect(requireRole('admin')).resolves.toBeDefined()
      await expect(requireRole('super_admin')).resolves.toBeDefined()
    })

    it('should reject editor when admin role is required', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('editor')
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireRole('admin')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('requirePermission()', () => {

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockCookies(null)

      await expect(requirePermission('canUpload')).rejects.toThrow(UnauthorizedError)
    })

    it('should throw ForbiddenError when user is inactive', async () => {
      mockCookies('valid-token')

      const inactiveUser = createTestUser('viewer', { canUpload: true }, { isActive: false })
      const mockDb = createMockDb([inactiveUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requirePermission('canUpload')).rejects.toThrow(ForbiddenError)
      await expect(requirePermission('canUpload')).rejects.toThrow('inactive')
    })

    it('should allow admin to have any permission (auto-grant)', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('admin', {}) // No explicit permissions
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requirePermission('canUpload')).resolves.toBeDefined()
      await expect(requirePermission('canDelete')).resolves.toBeDefined()
      await expect(requirePermission('canManageUsers')).resolves.toBeDefined()
      await expect(requirePermission('canManageCollections')).resolves.toBeDefined()
      await expect(requirePermission('canExport')).resolves.toBeDefined()
    })

    it('should allow super_admin to have any permission (auto-grant)', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('super_admin', {})
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requirePermission('canUpload')).resolves.toBeDefined()
      await expect(requirePermission('canDelete')).resolves.toBeDefined()
    })

    it('should allow user with explicit permission', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer', { canUpload: true })
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      const user = await requirePermission('canUpload')

      expect(user.permissions.canUpload).toBe(true)
    })

    it('should reject user without explicit permission', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('editor', { canDelete: false })
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requirePermission('canDelete')).rejects.toThrow(ForbiddenError)
      await expect(requirePermission('canDelete')).rejects.toThrow('Permission denied')
    })

    it('should handle multiple permission checks', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer', {
        canUpload: true,
        canExport: true,
        canDelete: false
      })
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requirePermission('canUpload')).resolves.toBeDefined()
      await expect(requirePermission('canExport')).resolves.toBeDefined()
      await expect(requirePermission('canDelete')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('requireCollectionAccess()', () => {

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockCookies(null)

      await expect(requireCollectionAccess('collection-1', 'view')).rejects.toThrow(UnauthorizedError)
    })

    it('should throw ForbiddenError when user is inactive', async () => {
      mockCookies('valid-token')

      const inactiveUser = createTestUser('viewer', {}, { isActive: false })
      const mockDb = createMockDb([inactiveUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireCollectionAccess('collection-1', 'view')).rejects.toThrow(ForbiddenError)
    })

    it('should allow admin access to any collection', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('admin', {})
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireCollectionAccess('any-collection', 'view')).resolves.toBeDefined()
      await expect(requireCollectionAccess('any-collection', 'edit')).resolves.toBeDefined()
    })

    it('should allow super_admin access to any collection', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('super_admin', {})
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireCollectionAccess('any-collection', 'view')).resolves.toBeDefined()
      await expect(requireCollectionAccess('any-collection', 'edit')).resolves.toBeDefined()
    })

    it('should allow user with "all" collections wildcard', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer', { allowedCollections: ['all'] })
      const mockDb = createMockDb([testUser])
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireCollectionAccess('collection-1', 'view')).resolves.toBeDefined()
      await expect(requireCollectionAccess('collection-2', 'view')).resolves.toBeDefined()
    })

    it('should allow user with specific collection in allowedCollections', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer', {
        allowedCollections: ['collection-1', 'collection-2']
      })

      // Mock collection query
      const mockDb = {
        ...createMockDb([testUser]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { permissions: null } // No collection-specific permissions
        ])
      }
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireCollectionAccess('collection-1', 'view')).resolves.toBeDefined()
    })

    it('should reject user without collection access', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer', {
        allowedCollections: ['collection-1']
      })

      const mockDb = {
        ...createMockDb([testUser]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { permissions: null }
        ])
      }
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireCollectionAccess('collection-2', 'view')).rejects.toThrow(ForbiddenError)
    })

    it('should throw ForbiddenError when collection not found', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer', {})

      const mockDb = {
        ...createMockDb([testUser]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]) // Collection not found
      }
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await expect(requireCollectionAccess('non-existent', 'view')).rejects.toThrow(ForbiddenError)
      await expect(requireCollectionAccess('non-existent', 'view')).rejects.toThrow('not found')
    })

    it('should respect view vs edit permissions on collections', async () => {
      mockCookies('valid-token')

      const testUser = createTestUser('viewer', {})

      // Mock collection with specific permissions
      const mockDb = {
        ...createMockDb([testUser]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            permissions: {
              'tag-value-1': {
                viewers: ['test-user-id'],
                editors: []
              }
            }
          }
        ])
      }
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // User can view
      await expect(requireCollectionAccess('collection-1', 'view')).resolves.toBeDefined()

      // User cannot edit
      await expect(requireCollectionAccess('collection-1', 'edit')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('Helper Functions', () => {

    describe('hasRole()', () => {

      it('should return true when user has exact role', () => {
        const user = createTestUser('editor') as AuthenticatedUser
        expect(hasRole(user, 'editor')).toBe(true)
      })

      it('should return true when user has higher role', () => {
        const user = createTestUser('admin') as AuthenticatedUser
        expect(hasRole(user, 'editor')).toBe(true)
        expect(hasRole(user, 'viewer')).toBe(true)
      })

      it('should return false when user has lower role', () => {
        const user = createTestUser('viewer') as AuthenticatedUser
        expect(hasRole(user, 'editor')).toBe(false)
        expect(hasRole(user, 'admin')).toBe(false)
      })

      it('should handle super_admin correctly', () => {
        const user = createTestUser('super_admin') as AuthenticatedUser
        expect(hasRole(user, 'viewer')).toBe(true)
        expect(hasRole(user, 'editor')).toBe(true)
        expect(hasRole(user, 'admin')).toBe(true)
        expect(hasRole(user, 'super_admin')).toBe(true)
      })
    })

    describe('hasPermission()', () => {

      it('should return true for admin with any permission', () => {
        const user = createTestUser('admin', {}) as AuthenticatedUser
        expect(hasPermission(user, 'canUpload')).toBe(true)
        expect(hasPermission(user, 'canDelete')).toBe(true)
        expect(hasPermission(user, 'canManageUsers')).toBe(true)
      })

      it('should return true for super_admin with any permission', () => {
        const user = createTestUser('super_admin', {}) as AuthenticatedUser
        expect(hasPermission(user, 'canUpload')).toBe(true)
        expect(hasPermission(user, 'canDelete')).toBe(true)
      })

      it('should return true when user has explicit permission', () => {
        const user = createTestUser('viewer', {
          canUpload: true,
          canExport: true
        }) as AuthenticatedUser
        expect(hasPermission(user, 'canUpload')).toBe(true)
        expect(hasPermission(user, 'canExport')).toBe(true)
      })

      it('should return false when user lacks permission', () => {
        const user = createTestUser('viewer', {
          canUpload: false,
          canDelete: false
        }) as AuthenticatedUser
        expect(hasPermission(user, 'canUpload')).toBe(false)
        expect(hasPermission(user, 'canDelete')).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {

    it('should have correct error name for UnauthorizedError', () => {
      const error = new UnauthorizedError('Test message')
      expect(error.name).toBe('UnauthorizedError')
      expect(error.message).toBe('Test message')
    })

    it('should have correct error name for ForbiddenError', () => {
      const error = new ForbiddenError('Test message')
      expect(error.name).toBe('ForbiddenError')
      expect(error.message).toBe('Test message')
    })

    it('should have default messages for custom errors', () => {
      const unauthorizedError = new UnauthorizedError()
      expect(unauthorizedError.message).toContain('Unauthorized')

      const forbiddenError = new ForbiddenError()
      expect(forbiddenError.message).toContain('Forbidden')
    })
  })

  describe('Audit Logging', () => {

    it('should log permission changes to database', async () => {
      const mockInsert = vi.fn().mockReturnThis()
      const mockValues = vi.fn().mockResolvedValue(undefined)

      const mockDb = {
        insert: mockInsert,
        values: mockValues
      }
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await logPermissionChange({
        userId: 'user-123',
        changedBy: 'admin-456',
        action: 'role_changed',
        oldValue: { role: 'viewer' },
        newValue: { role: 'editor' },
        reason: 'Promotion'
      })

      expect(mockInsert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalledWith({
        userId: 'user-123',
        changedBy: 'admin-456',
        action: 'role_changed',
        oldValue: { role: 'viewer' },
        newValue: { role: 'editor' },
        reason: 'Promotion'
      })
    })

    it('should handle optional fields in audit log', async () => {
      const mockInsert = vi.fn().mockReturnThis()
      const mockValues = vi.fn().mockResolvedValue(undefined)

      const mockDb = {
        insert: mockInsert,
        values: mockValues
      }
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      await logPermissionChange({
        userId: 'user-123',
        changedBy: 'admin-456',
        action: 'user_activated'
      })

      expect(mockValues).toHaveBeenCalledWith({
        userId: 'user-123',
        changedBy: 'admin-456',
        action: 'user_activated',
        oldValue: null,
        newValue: null,
        reason: null
      })
    })
  })
})
