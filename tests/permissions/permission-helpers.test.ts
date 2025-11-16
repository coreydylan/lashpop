/**
 * Permission Helper Tests
 *
 * Tests the permission helper functions from /src/types/permissions.ts:
 * - hasRoleLevel()
 * - hasPermission()
 * - canAccessCollection()
 * - ROLE_HIERARCHY constants
 *
 * To run: npm test tests/permissions/permission-helpers.test.ts
 */

import { describe, it, expect } from 'vitest'
import {
  hasRoleLevel,
  hasPermission,
  canAccessCollection,
  ROLE_HIERARCHY,
  type Role,
  type AuthenticatedUser,
  type UserPermissions
} from '@/types/permissions'

/**
 * Helper to create a test user
 */
function createTestUser(
  role: Role,
  permissions: Partial<UserPermissions> = {},
  overrides: Partial<AuthenticatedUser> = {}
): AuthenticatedUser {
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

describe('Permission Helper Tests', () => {

  describe('ROLE_HIERARCHY constant', () => {

    it('should define all roles with correct hierarchy', () => {
      expect(ROLE_HIERARCHY.viewer).toBe(0)
      expect(ROLE_HIERARCHY.editor).toBe(1)
      expect(ROLE_HIERARCHY.admin).toBe(2)
      expect(ROLE_HIERARCHY.super_admin).toBe(3)
    })

    it('should have increasing hierarchy values', () => {
      expect(ROLE_HIERARCHY.viewer).toBeLessThan(ROLE_HIERARCHY.editor)
      expect(ROLE_HIERARCHY.editor).toBeLessThan(ROLE_HIERARCHY.admin)
      expect(ROLE_HIERARCHY.admin).toBeLessThan(ROLE_HIERARCHY.super_admin)
    })

    it('should have all four roles defined', () => {
      const roles = Object.keys(ROLE_HIERARCHY)
      expect(roles).toHaveLength(4)
      expect(roles).toContain('viewer')
      expect(roles).toContain('editor')
      expect(roles).toContain('admin')
      expect(roles).toContain('super_admin')
    })
  })

  describe('hasRoleLevel()', () => {

    describe('Same role comparisons', () => {
      it('should return true when roles are equal - viewer', () => {
        expect(hasRoleLevel('viewer', 'viewer')).toBe(true)
      })

      it('should return true when roles are equal - editor', () => {
        expect(hasRoleLevel('editor', 'editor')).toBe(true)
      })

      it('should return true when roles are equal - admin', () => {
        expect(hasRoleLevel('admin', 'admin')).toBe(true)
      })

      it('should return true when roles are equal - super_admin', () => {
        expect(hasRoleLevel('super_admin', 'super_admin')).toBe(true)
      })
    })

    describe('Higher role comparisons', () => {
      it('should return true when user role is higher - editor vs viewer', () => {
        expect(hasRoleLevel('editor', 'viewer')).toBe(true)
      })

      it('should return true when user role is higher - admin vs editor', () => {
        expect(hasRoleLevel('admin', 'editor')).toBe(true)
      })

      it('should return true when user role is higher - admin vs viewer', () => {
        expect(hasRoleLevel('admin', 'viewer')).toBe(true)
      })

      it('should return true when user role is higher - super_admin vs any', () => {
        expect(hasRoleLevel('super_admin', 'viewer')).toBe(true)
        expect(hasRoleLevel('super_admin', 'editor')).toBe(true)
        expect(hasRoleLevel('super_admin', 'admin')).toBe(true)
      })
    })

    describe('Lower role comparisons', () => {
      it('should return false when user role is lower - viewer vs editor', () => {
        expect(hasRoleLevel('viewer', 'editor')).toBe(false)
      })

      it('should return false when user role is lower - viewer vs admin', () => {
        expect(hasRoleLevel('viewer', 'admin')).toBe(false)
      })

      it('should return false when user role is lower - editor vs admin', () => {
        expect(hasRoleLevel('editor', 'admin')).toBe(false)
      })

      it('should return false when user role is lower - admin vs super_admin', () => {
        expect(hasRoleLevel('admin', 'super_admin')).toBe(false)
      })
    })

    describe('Edge cases', () => {
      it('should handle all role combinations correctly', () => {
        const roles: Role[] = ['viewer', 'editor', 'admin', 'super_admin']

        for (let i = 0; i < roles.length; i++) {
          for (let j = 0; j < roles.length; j++) {
            const userRole = roles[i]
            const requiredRole = roles[j]
            const expected = i >= j

            expect(hasRoleLevel(userRole, requiredRole)).toBe(expected)
          }
        }
      })
    })
  })

  describe('hasPermission()', () => {

    describe('Explicit permissions', () => {
      it('should return true when user has explicit canUpload permission', () => {
        const user = createTestUser('viewer', { canUpload: true })
        expect(hasPermission(user, 'canUpload')).toBe(true)
      })

      it('should return true when user has explicit canDelete permission', () => {
        const user = createTestUser('editor', { canDelete: true })
        expect(hasPermission(user, 'canDelete')).toBe(true)
      })

      it('should return true when user has explicit canManageUsers permission', () => {
        const user = createTestUser('viewer', { canManageUsers: true })
        expect(hasPermission(user, 'canManageUsers')).toBe(true)
      })

      it('should return true when user has explicit canManageCollections permission', () => {
        const user = createTestUser('editor', { canManageCollections: true })
        expect(hasPermission(user, 'canManageCollections')).toBe(true)
      })

      it('should return true when user has explicit canExport permission', () => {
        const user = createTestUser('viewer', { canExport: true })
        expect(hasPermission(user, 'canExport')).toBe(true)
      })
    })

    describe('Missing permissions', () => {
      it('should return false when permission is undefined', () => {
        const user = createTestUser('viewer', {})
        expect(hasPermission(user, 'canUpload')).toBe(false)
        expect(hasPermission(user, 'canDelete')).toBe(false)
      })

      it('should return false when permission is explicitly false', () => {
        const user = createTestUser('viewer', {
          canUpload: false,
          canDelete: false
        })
        expect(hasPermission(user, 'canUpload')).toBe(false)
        expect(hasPermission(user, 'canDelete')).toBe(false)
      })
    })

    describe('Multiple permissions', () => {
      it('should handle multiple permissions correctly', () => {
        const user = createTestUser('editor', {
          canUpload: true,
          canExport: true,
          canDelete: false,
          canManageUsers: false
        })

        expect(hasPermission(user, 'canUpload')).toBe(true)
        expect(hasPermission(user, 'canExport')).toBe(true)
        expect(hasPermission(user, 'canDelete')).toBe(false)
        expect(hasPermission(user, 'canManageUsers')).toBe(false)
      })
    })

    describe('Role-based behavior', () => {
      it('should check permission field regardless of role', () => {
        // hasPermission() in types/permissions.ts only checks the permission field
        // It does NOT auto-grant for admins (that's handled in dam-auth.ts)
        const adminUser = createTestUser('admin', { canUpload: false })
        expect(hasPermission(adminUser, 'canUpload')).toBe(false)

        const viewerUser = createTestUser('viewer', { canUpload: true })
        expect(hasPermission(viewerUser, 'canUpload')).toBe(true)
      })
    })

    describe('Edge cases', () => {
      it('should handle all permission types', () => {
        const permissions: (keyof Omit<UserPermissions, 'allowedCollections'>)[] = [
          'canUpload',
          'canDelete',
          'canManageUsers',
          'canManageCollections',
          'canExport'
        ]

        const user = createTestUser('viewer', {
          canUpload: true,
          canDelete: true,
          canManageUsers: true,
          canManageCollections: true,
          canExport: true
        })

        permissions.forEach(permission => {
          expect(hasPermission(user, permission)).toBe(true)
        })
      })

      it('should handle empty permissions object', () => {
        const user = createTestUser('viewer', {})
        expect(hasPermission(user, 'canUpload')).toBe(false)
      })
    })
  })

  describe('canAccessCollection()', () => {

    describe('Empty allowedCollections', () => {
      it('should return false when allowedCollections is empty array', () => {
        const user = createTestUser('viewer', { allowedCollections: [] })
        expect(canAccessCollection(user, 'collection-1')).toBe(false)
      })

      it('should return false when allowedCollections is undefined', () => {
        const user = createTestUser('viewer', { allowedCollections: undefined })
        expect(canAccessCollection(user, 'collection-1')).toBe(false)
      })
    })

    describe('"all" wildcard', () => {
      it('should return true for any collection when allowedCollections is ["all"]', () => {
        const user = createTestUser('viewer', { allowedCollections: ['all'] })
        expect(canAccessCollection(user, 'collection-1')).toBe(true)
        expect(canAccessCollection(user, 'collection-2')).toBe(true)
        expect(canAccessCollection(user, 'any-collection')).toBe(true)
      })

      it('should only work with exactly ["all"], not ["all", ...]', () => {
        const user = createTestUser('viewer', {
          allowedCollections: ['all', 'collection-1'] as any
        })
        // Has length > 1, so "all" check fails, but 'collection-1' is in the array
        expect(canAccessCollection(user, 'collection-1')).toBe(true)
        expect(canAccessCollection(user, 'collection-2')).toBe(false)
      })
    })

    describe('Specific collections', () => {
      it('should return true when collection is in allowedCollections', () => {
        const user = createTestUser('viewer', {
          allowedCollections: ['collection-1', 'collection-2']
        })
        expect(canAccessCollection(user, 'collection-1')).toBe(true)
        expect(canAccessCollection(user, 'collection-2')).toBe(true)
      })

      it('should return false when collection is not in allowedCollections', () => {
        const user = createTestUser('viewer', {
          allowedCollections: ['collection-1', 'collection-2']
        })
        expect(canAccessCollection(user, 'collection-3')).toBe(false)
        expect(canAccessCollection(user, 'collection-4')).toBe(false)
      })

      it('should handle single collection', () => {
        const user = createTestUser('viewer', {
          allowedCollections: ['collection-1']
        })
        expect(canAccessCollection(user, 'collection-1')).toBe(true)
        expect(canAccessCollection(user, 'collection-2')).toBe(false)
      })
    })

    describe('Case sensitivity', () => {
      it('should be case-sensitive for collection IDs', () => {
        const user = createTestUser('viewer', {
          allowedCollections: ['Collection-1']
        })
        expect(canAccessCollection(user, 'Collection-1')).toBe(true)
        expect(canAccessCollection(user, 'collection-1')).toBe(false)
        expect(canAccessCollection(user, 'COLLECTION-1')).toBe(false)
      })

      it('should be case-sensitive for "all" wildcard', () => {
        const user1 = createTestUser('viewer', {
          allowedCollections: ['all']
        })
        expect(canAccessCollection(user1, 'collection-1')).toBe(true)

        const user2 = createTestUser('viewer', {
          allowedCollections: ['ALL'] as any
        })
        expect(canAccessCollection(user2, 'collection-1')).toBe(false)
        expect(canAccessCollection(user2, 'ALL')).toBe(true)
      })
    })

    describe('Edge cases', () => {
      it('should handle many collections', () => {
        const collections = Array.from({ length: 100 }, (_, i) => `collection-${i}`)
        const user = createTestUser('viewer', {
          allowedCollections: collections
        })

        expect(canAccessCollection(user, 'collection-0')).toBe(true)
        expect(canAccessCollection(user, 'collection-50')).toBe(true)
        expect(canAccessCollection(user, 'collection-99')).toBe(true)
        expect(canAccessCollection(user, 'collection-100')).toBe(false)
      })

      it('should handle special characters in collection IDs', () => {
        const user = createTestUser('viewer', {
          allowedCollections: [
            'collection-1',
            'collection_2',
            'collection:3',
            'collection/4',
            'collection.5'
          ]
        })

        expect(canAccessCollection(user, 'collection-1')).toBe(true)
        expect(canAccessCollection(user, 'collection_2')).toBe(true)
        expect(canAccessCollection(user, 'collection:3')).toBe(true)
        expect(canAccessCollection(user, 'collection/4')).toBe(true)
        expect(canAccessCollection(user, 'collection.5')).toBe(true)
      })

      it('should handle UUIDs as collection IDs', () => {
        const uuid1 = '550e8400-e29b-41d4-a716-446655440000'
        const uuid2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

        const user = createTestUser('viewer', {
          allowedCollections: [uuid1, uuid2]
        })

        expect(canAccessCollection(user, uuid1)).toBe(true)
        expect(canAccessCollection(user, uuid2)).toBe(true)
        expect(canAccessCollection(user, '550e8400-0000-0000-0000-000000000000')).toBe(false)
      })
    })

    describe('Role independence', () => {
      it('should check allowedCollections regardless of role', () => {
        // canAccessCollection() doesn't auto-grant for admins
        // That logic is in requireCollectionAccess() middleware
        const adminUser = createTestUser('admin', {
          allowedCollections: ['collection-1']
        })
        expect(canAccessCollection(adminUser, 'collection-1')).toBe(true)
        expect(canAccessCollection(adminUser, 'collection-2')).toBe(false)

        const viewerUser = createTestUser('viewer', {
          allowedCollections: ['all']
        })
        expect(canAccessCollection(viewerUser, 'any-collection')).toBe(true)
      })
    })
  })

  describe('Integration - Combined helper usage', () => {

    it('should work together for complete permission check', () => {
      const user = createTestUser('editor', {
        canUpload: true,
        canExport: true,
        canDelete: false,
        allowedCollections: ['collection-1', 'collection-2']
      })

      // Role checks
      expect(hasRoleLevel(user.role, 'viewer')).toBe(true)
      expect(hasRoleLevel(user.role, 'editor')).toBe(true)
      expect(hasRoleLevel(user.role, 'admin')).toBe(false)

      // Permission checks
      expect(hasPermission(user, 'canUpload')).toBe(true)
      expect(hasPermission(user, 'canExport')).toBe(true)
      expect(hasPermission(user, 'canDelete')).toBe(false)

      // Collection checks
      expect(canAccessCollection(user, 'collection-1')).toBe(true)
      expect(canAccessCollection(user, 'collection-2')).toBe(true)
      expect(canAccessCollection(user, 'collection-3')).toBe(false)
    })

    it('should handle super_admin with all access', () => {
      const user = createTestUser('super_admin', {
        allowedCollections: ['all']
      })

      // Role checks - super_admin has highest level
      expect(hasRoleLevel(user.role, 'viewer')).toBe(true)
      expect(hasRoleLevel(user.role, 'editor')).toBe(true)
      expect(hasRoleLevel(user.role, 'admin')).toBe(true)
      expect(hasRoleLevel(user.role, 'super_admin')).toBe(true)

      // Collection checks - has access to all
      expect(canAccessCollection(user, 'any-collection')).toBe(true)
    })

    it('should handle viewer with limited access', () => {
      const user = createTestUser('viewer', {
        canExport: true, // Explicit permission
        allowedCollections: ['collection-1']
      })

      // Role checks - viewer is lowest level
      expect(hasRoleLevel(user.role, 'viewer')).toBe(true)
      expect(hasRoleLevel(user.role, 'editor')).toBe(false)

      // Permission checks - only has canExport
      expect(hasPermission(user, 'canExport')).toBe(true)
      expect(hasPermission(user, 'canUpload')).toBe(false)
      expect(hasPermission(user, 'canDelete')).toBe(false)

      // Collection checks - limited access
      expect(canAccessCollection(user, 'collection-1')).toBe(true)
      expect(canAccessCollection(user, 'collection-2')).toBe(false)
    })
  })
})
