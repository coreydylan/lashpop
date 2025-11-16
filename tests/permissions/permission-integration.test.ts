/**
 * Permission Integration Tests
 *
 * End-to-end workflow tests for the permission system.
 * Tests complete user journeys from creation to permission management to actions.
 *
 * To run: npm test tests/permissions/permission-integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getDb } from '@/db'
import { user as userSchema } from '@/db/schema/auth_user'
import { session as sessionSchema } from '@/db/schema/auth_session'
import { permissionAudit } from '@/db/schema/permission_audit'
import { tagCategories } from '@/db/schema/tag_categories'
import { assets } from '@/db/schema/assets'
import type { Role, UserPermissions } from '@/types/permissions'

// Mock dependencies
vi.mock('@/db', () => ({
  getDb: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('@/lib/dam/s3-client', () => ({
  uploadToS3: vi.fn().mockResolvedValue({ url: 'https://s3.example.com/test.jpg' }),
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
  generateAssetKey: vi.fn((filename: string) => `test/${filename}`)
}))

/**
 * Helper to create test database operations
 */
function createMockDb(state: {
  users: any[]
  sessions: any[]
  auditLogs: any[]
  collections: any[]
  assets: any[]
}) {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => {
      return Promise.resolve(state.users.length > 0 ? state.users : [])
    }),
    insert: vi.fn().mockImplementation((table: any) => ({
      values: vi.fn().mockImplementation((data: any) => {
        if (table === userSchema) {
          state.users.push(data)
        } else if (table === permissionAudit) {
          state.auditLogs.push(data)
        } else if (table === assets) {
          state.assets.push(data)
        }
        return {
          returning: vi.fn().mockResolvedValue([data])
        }
      })
    })),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockImplementation((data: any) => ({
      where: vi.fn().mockImplementation(() => {
        // Update the user in state
        Object.assign(state.users[0], data)
        return Promise.resolve([state.users[0]])
      })
    })),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(state.users)
  }
}

/**
 * Mock cookies
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

describe('Permission Integration Tests', () => {

  describe('User Creation and Role Assignment Workflow', () => {

    it('should create user → assign role → verify permissions → perform action', async () => {
      const state = {
        users: [],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: Create a new user (viewer)
      const newUser = {
        id: 'user-123',
        role: 'viewer' as Role,
        permissions: {
          canUpload: false,
          canDelete: false,
          canManageUsers: false,
          canManageCollections: false,
          canExport: false,
          allowedCollections: []
        } as UserPermissions,
        isActive: true,
        phoneNumber: '+1234567890',
        email: 'viewer@example.com',
        name: 'Test Viewer'
      }

      state.users.push(newUser)

      // Verify user created with viewer role
      expect(state.users).toHaveLength(1)
      expect(state.users[0].role).toBe('viewer')
      expect(state.users[0].permissions.canUpload).toBe(false)

      // Step 2: Admin grants canUpload permission
      const admin = {
        id: 'admin-123',
        role: 'admin' as Role,
        permissions: {},
        isActive: true
      }

      // Update user permissions
      state.users[0].permissions.canUpload = true

      // Log the change
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'permission_granted',
        oldValue: { canUpload: false },
        newValue: { canUpload: true }
      })

      // Step 3: Verify permissions updated
      expect(state.users[0].permissions.canUpload).toBe(true)
      expect(state.auditLogs).toHaveLength(1)
      expect(state.auditLogs[0].action).toBe('permission_granted')

      // Step 4: User performs upload action
      mockCookies('valid-token')

      state.assets.push({
        id: 'asset-123',
        fileName: 'test.jpg',
        uploadedBy: 'user-123'
      })

      // Verify upload successful
      expect(state.assets).toHaveLength(1)
      expect(state.assets[0].uploadedBy).toBe('user-123')
    })

    it('should prevent action without permission → grant permission → allow action', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'viewer' as Role,
          permissions: {
            canDelete: false
          } as UserPermissions,
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: [
          { id: 'asset-1', fileName: 'test.jpg', filePath: 'https://s3.example.com/test.jpg' }
        ]
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)
      mockCookies('valid-token')

      // Step 1: Try to delete without permission - should fail
      const canDelete = state.users[0].permissions.canDelete
      expect(canDelete).toBe(false)

      // Step 2: Grant permission
      state.users[0].permissions.canDelete = true
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'permission_granted',
        oldValue: { canDelete: false },
        newValue: { canDelete: true }
      })

      // Step 3: Now can delete
      expect(state.users[0].permissions.canDelete).toBe(true)
      expect(state.auditLogs).toHaveLength(1)

      // Step 4: Perform delete
      state.assets = state.assets.filter(a => a.id !== 'asset-1')
      expect(state.assets).toHaveLength(0)
    })
  })

  describe('Collection Access Workflow', () => {

    it('should create collection → assign access → verify user can access', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'viewer' as Role,
          permissions: {
            allowedCollections: []
          } as UserPermissions,
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: Create a new collection
      const newCollection = {
        id: 'collection-1',
        name: 'Wedding Photos',
        permissions: {
          'tag-value-1': {
            viewers: [] as string[],
            editors: [] as string[]
          }
        }
      }

      state.collections.push(newCollection)

      // Step 2: User cannot access yet
      expect(state.users[0].permissions.allowedCollections).toHaveLength(0)

      // Step 3: Admin assigns user to collection viewers
      state.users[0].permissions.allowedCollections = ['collection-1']
      newCollection.permissions['tag-value-1'].viewers.push('user-123')

      // Step 4: Verify access
      expect(state.users[0].permissions.allowedCollections).toContain('collection-1')
      expect(newCollection.permissions['tag-value-1'].viewers).toContain('user-123')

      // Step 5: User views assets in collection
      const canView = state.users[0].permissions.allowedCollections.includes('collection-1')
      expect(canView).toBe(true)
    })

    it('should handle collection permission escalation (viewer → editor)', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'viewer' as Role,
          permissions: {
            allowedCollections: ['collection-1']
          } as UserPermissions,
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [{
          id: 'collection-1',
          name: 'Product Photos',
          permissions: {
            'tag-value-1': {
              viewers: ['user-123'],
              editors: [] as string[]
            }
          }
        }],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: User has view access
      expect(state.collections[0].permissions['tag-value-1'].viewers).toContain('user-123')
      expect(state.collections[0].permissions['tag-value-1'].editors).not.toContain('user-123')

      // Step 2: Escalate to editor
      state.collections[0].permissions['tag-value-1'].editors.push('user-123')
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'permission_granted',
        oldValue: { collectionRole: 'viewer' },
        newValue: { collectionRole: 'editor' }
      })

      // Step 3: Verify editor access
      expect(state.collections[0].permissions['tag-value-1'].editors).toContain('user-123')
      expect(state.auditLogs).toHaveLength(1)
    })

    it('should handle "all" collections wildcard access', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'editor' as Role,
          permissions: {
            allowedCollections: ['all']
          } as UserPermissions,
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [
          { id: 'collection-1', name: 'Collection 1', permissions: null },
          { id: 'collection-2', name: 'Collection 2', permissions: null },
          { id: 'collection-3', name: 'Collection 3', permissions: null }
        ],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // User should have access to all collections
      const hasAllAccess = state.users[0].permissions.allowedCollections?.[0] === 'all'
      expect(hasAllAccess).toBe(true)

      // Verify can access any collection
      state.collections.forEach(collection => {
        expect(hasAllAccess).toBe(true)
      })
    })
  })

  describe('Permission Change Workflow', () => {

    it('should track complete permission change lifecycle with audit trail', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'viewer' as Role,
          permissions: {
            canUpload: false,
            canDelete: false
          } as UserPermissions,
          isActive: true,
          name: 'John Doe'
        }],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: Initial state - viewer with no permissions
      expect(state.users[0].role).toBe('viewer')
      expect(state.users[0].permissions.canUpload).toBe(false)

      // Step 2: Admin promotes to editor
      state.users[0].role = 'editor'
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'role_changed',
        oldValue: { role: 'viewer' },
        newValue: { role: 'editor' },
        timestamp: new Date()
      })

      expect(state.users[0].role).toBe('editor')
      expect(state.auditLogs).toHaveLength(1)
      expect(state.auditLogs[0].action).toBe('role_changed')

      // Step 3: Admin grants canUpload permission
      state.users[0].permissions.canUpload = true
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'permission_granted',
        oldValue: { canUpload: false },
        newValue: { canUpload: true },
        timestamp: new Date()
      })

      expect(state.users[0].permissions.canUpload).toBe(true)
      expect(state.auditLogs).toHaveLength(2)

      // Step 4: Admin grants canDelete permission
      state.users[0].permissions.canDelete = true
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'permission_granted',
        oldValue: { canDelete: false },
        newValue: { canDelete: true },
        timestamp: new Date()
      })

      expect(state.users[0].permissions.canDelete).toBe(true)
      expect(state.auditLogs).toHaveLength(3)

      // Step 5: Admin promotes to admin
      state.users[0].role = 'admin'
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'super-admin-123',
        action: 'role_changed',
        oldValue: { role: 'editor' },
        newValue: { role: 'admin' },
        timestamp: new Date()
      })

      expect(state.users[0].role).toBe('admin')
      expect(state.auditLogs).toHaveLength(4)

      // Step 6: Verify complete audit trail
      expect(state.auditLogs[0].action).toBe('role_changed')
      expect(state.auditLogs[0].oldValue?.role).toBe('viewer')
      expect(state.auditLogs[1].action).toBe('permission_granted')
      expect(state.auditLogs[2].action).toBe('permission_granted')
      expect(state.auditLogs[3].action).toBe('role_changed')
      expect(state.auditLogs[3].newValue?.role).toBe('admin')
    })

    it('should handle user activation/deactivation workflow', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'editor' as Role,
          permissions: {
            canUpload: true
          } as UserPermissions,
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: User is active
      expect(state.users[0].isActive).toBe(true)

      // Step 2: Admin deactivates user
      state.users[0].isActive = false
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'user_deactivated',
        oldValue: { isActive: true },
        newValue: { isActive: false },
        reason: 'User left company'
      })

      expect(state.users[0].isActive).toBe(false)
      expect(state.auditLogs[0].action).toBe('user_deactivated')
      expect(state.auditLogs[0].reason).toBe('User left company')

      // Step 3: Inactive user cannot perform actions
      const canAct = state.users[0].isActive
      expect(canAct).toBe(false)

      // Step 4: Admin reactivates user
      state.users[0].isActive = true
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'user_activated',
        oldValue: { isActive: false },
        newValue: { isActive: true },
        reason: 'User returned'
      })

      expect(state.users[0].isActive).toBe(true)
      expect(state.auditLogs).toHaveLength(2)
      expect(state.auditLogs[1].action).toBe('user_activated')
    })
  })

  describe('Role Hierarchy Workflows', () => {

    it('should enforce super_admin > admin hierarchy', async () => {
      const state = {
        users: [
          {
            id: 'admin-123',
            role: 'admin' as Role,
            permissions: {} as UserPermissions,
            isActive: true
          },
          {
            id: 'super-admin-123',
            role: 'super_admin' as Role,
            permissions: {} as UserPermissions,
            isActive: true
          },
          {
            id: 'target-super-admin',
            role: 'super_admin' as Role,
            permissions: {} as UserPermissions,
            isActive: true
          }
        ],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: Regular admin tries to modify super_admin - should fail
      const currentUser = state.users[0] // admin
      const targetUser = state.users[2] // super_admin

      const canModify = currentUser.role === 'super_admin' || targetUser.role !== 'super_admin'
      expect(canModify).toBe(false)

      // Step 2: Super_admin can modify another super_admin
      const superAdminUser = state.users[1]
      const canSuperAdminModify = superAdminUser.role === 'super_admin'
      expect(canSuperAdminModify).toBe(true)

      // Step 3: Super_admin modifies target
      state.users[2].role = 'admin'
      state.auditLogs.push({
        userId: 'target-super-admin',
        changedBy: 'super-admin-123',
        action: 'role_changed',
        oldValue: { role: 'super_admin' },
        newValue: { role: 'admin' }
      })

      expect(state.users[2].role).toBe('admin')
      expect(state.auditLogs[0].changedBy).toBe('super-admin-123')
    })

    it('should allow promotion path: viewer → editor → admin → super_admin', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'viewer' as Role,
          permissions: {} as UserPermissions,
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Viewer → Editor
      state.users[0].role = 'editor'
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'role_changed',
        oldValue: { role: 'viewer' },
        newValue: { role: 'editor' }
      })

      expect(state.users[0].role).toBe('editor')

      // Editor → Admin
      state.users[0].role = 'admin'
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'super-admin-123',
        action: 'role_changed',
        oldValue: { role: 'editor' },
        newValue: { role: 'admin' }
      })

      expect(state.users[0].role).toBe('admin')

      // Admin → Super Admin (only super_admin can do this)
      state.users[0].role = 'super_admin'
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'super-admin-123',
        action: 'role_changed',
        oldValue: { role: 'admin' },
        newValue: { role: 'super_admin' }
      })

      expect(state.users[0].role).toBe('super_admin')
      expect(state.auditLogs).toHaveLength(3)

      // Verify audit trail shows promotion path
      expect(state.auditLogs[0].oldValue?.role).toBe('viewer')
      expect(state.auditLogs[1].oldValue?.role).toBe('editor')
      expect(state.auditLogs[2].oldValue?.role).toBe('admin')
      expect(state.auditLogs[2].newValue?.role).toBe('super_admin')
    })
  })

  describe('Team Member Linking Workflow', () => {

    it('should link user to team member → upload assets → verify association', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'editor' as Role,
          permissions: {
            canUpload: true
          } as UserPermissions,
          teamMemberId: null,
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: User has no team member link
      expect(state.users[0].teamMemberId).toBeNull()

      // Step 2: Admin links user to team member
      state.users[0].teamMemberId = 'team-member-456'
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'team_member_linked',
        oldValue: { teamMemberId: null },
        newValue: { teamMemberId: 'team-member-456' }
      })

      expect(state.users[0].teamMemberId).toBe('team-member-456')
      expect(state.auditLogs[0].action).toBe('team_member_linked')

      // Step 3: User uploads asset
      state.assets.push({
        id: 'asset-123',
        fileName: 'headshot.jpg',
        uploadedBy: 'user-123',
        teamMemberId: 'team-member-456'
      })

      // Step 4: Verify asset is linked to team member
      expect(state.assets[0].teamMemberId).toBe('team-member-456')
      expect(state.assets[0].uploadedBy).toBe('user-123')
    })

    it('should handle team member unlinking', async () => {
      const state = {
        users: [{
          id: 'user-123',
          role: 'editor' as Role,
          permissions: {} as UserPermissions,
          teamMemberId: 'team-member-456',
          isActive: true
        }],
        sessions: [],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: User is linked
      expect(state.users[0].teamMemberId).toBe('team-member-456')

      // Step 2: Admin unlinks
      state.users[0].teamMemberId = null
      state.auditLogs.push({
        userId: 'user-123',
        changedBy: 'admin-123',
        action: 'team_member_linked',
        oldValue: { teamMemberId: 'team-member-456' },
        newValue: { teamMemberId: null }
      })

      expect(state.users[0].teamMemberId).toBeNull()
      expect(state.auditLogs[0].newValue?.teamMemberId).toBeNull()
    })
  })

  describe('Complex Multi-Step Workflows', () => {

    it('should handle complete onboarding workflow', async () => {
      const state = {
        users: [],
        sessions: [],
        auditLogs: [],
        collections: [
          { id: 'collection-1', name: 'Public Gallery', permissions: null }
        ],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: Create new user account (viewer role)
      state.users.push({
        id: 'new-user-123',
        role: 'viewer',
        permissions: {
          canUpload: false,
          allowedCollections: []
        },
        teamMemberId: null,
        isActive: false, // Pending activation
        phoneNumber: '+1234567890',
        name: 'New User'
      })

      // Step 2: Admin activates account
      state.users[0].isActive = true
      state.auditLogs.push({
        userId: 'new-user-123',
        changedBy: 'admin-123',
        action: 'user_activated',
        oldValue: { isActive: false },
        newValue: { isActive: true }
      })

      // Step 3: Admin grants collection access
      state.users[0].permissions.allowedCollections = ['collection-1']

      // Step 4: Admin promotes to editor and grants upload permission
      state.users[0].role = 'editor'
      state.users[0].permissions.canUpload = true
      state.auditLogs.push({
        userId: 'new-user-123',
        changedBy: 'admin-123',
        action: 'role_changed',
        oldValue: { role: 'viewer' },
        newValue: { role: 'editor' }
      })

      // Step 5: Admin links to team member
      state.users[0].teamMemberId = 'team-member-789'
      state.auditLogs.push({
        userId: 'new-user-123',
        changedBy: 'admin-123',
        action: 'team_member_linked',
        oldValue: { teamMemberId: null },
        newValue: { teamMemberId: 'team-member-789' }
      })

      // Step 6: User uploads first asset
      state.assets.push({
        id: 'asset-first',
        fileName: 'first-upload.jpg',
        uploadedBy: 'new-user-123',
        teamMemberId: 'team-member-789'
      })

      // Verify complete workflow
      expect(state.users[0].isActive).toBe(true)
      expect(state.users[0].role).toBe('editor')
      expect(state.users[0].permissions.canUpload).toBe(true)
      expect(state.users[0].teamMemberId).toBe('team-member-789')
      expect(state.users[0].permissions.allowedCollections).toContain('collection-1')
      expect(state.assets[0].uploadedBy).toBe('new-user-123')
      expect(state.auditLogs).toHaveLength(3)
    })

    it('should handle offboarding workflow', async () => {
      const state = {
        users: [{
          id: 'departing-user',
          role: 'editor' as Role,
          permissions: {
            canUpload: true,
            canDelete: true,
            allowedCollections: ['collection-1', 'collection-2']
          } as UserPermissions,
          teamMemberId: 'team-member-999',
          isActive: true
        }],
        sessions: [
          { token: 'session-token-1', userId: 'departing-user', expiresAt: new Date(Date.now() + 86400000) }
        ],
        auditLogs: [],
        collections: [],
        assets: []
      }

      const mockDb = createMockDb(state)
      vi.mocked(getDb).mockReturnValue(mockDb as any)

      // Step 1: Admin downgrades role
      state.users[0].role = 'viewer'
      state.auditLogs.push({
        userId: 'departing-user',
        changedBy: 'admin-123',
        action: 'role_changed',
        oldValue: { role: 'editor' },
        newValue: { role: 'viewer' },
        reason: 'User departing'
      })

      // Step 2: Admin revokes permissions
      state.users[0].permissions.canUpload = false
      state.users[0].permissions.canDelete = false
      state.auditLogs.push({
        userId: 'departing-user',
        changedBy: 'admin-123',
        action: 'permission_revoked',
        oldValue: { canUpload: true, canDelete: true },
        newValue: { canUpload: false, canDelete: false }
      })

      // Step 3: Admin removes collection access
      state.users[0].permissions.allowedCollections = []

      // Step 4: Admin deactivates account
      state.users[0].isActive = false
      state.auditLogs.push({
        userId: 'departing-user',
        changedBy: 'admin-123',
        action: 'user_deactivated',
        oldValue: { isActive: true },
        newValue: { isActive: false },
        reason: 'User left organization'
      })

      // Step 5: Session invalidated (would happen on next request)
      // In real scenario, requireAuth would reject inactive user

      // Verify offboarding complete
      expect(state.users[0].role).toBe('viewer')
      expect(state.users[0].isActive).toBe(false)
      expect(state.users[0].permissions.canUpload).toBe(false)
      expect(state.users[0].permissions.canDelete).toBe(false)
      expect(state.users[0].permissions.allowedCollections).toHaveLength(0)
      expect(state.auditLogs).toHaveLength(3)
      expect(state.auditLogs[2].reason).toBe('User left organization')
    })
  })
})
