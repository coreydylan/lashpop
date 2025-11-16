"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { AuthenticatedUser, Role } from '@/types/permissions'
import { canAccessCollection as checkCollectionAccess } from '@/types/permissions'

/**
 * Permissions Context Interface
 *
 * Provides access to the current user's permissions and helper functions
 * for checking access throughout the application.
 */
interface PermissionsContextType {
  // Current user data
  user: AuthenticatedUser | null

  // Loading and error states
  isLoading: boolean
  error: string | null

  // Permission helper functions
  canUpload: () => boolean
  canDelete: () => boolean
  canManageUsers: () => boolean
  canManageCollections: () => boolean
  canExport: () => boolean
  canAccessCollection: (collectionId: string) => boolean
  hasRole: (minRole: Role) => boolean

  // Refresh function to manually reload user data
  refresh: () => Promise<void>
}

/**
 * Permissions Context
 */
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

/**
 * Permissions Provider Props
 */
interface PermissionsProviderProps {
  children: ReactNode
}

/**
 * Permissions Provider Component
 *
 * Fetches and provides the current user's permissions throughout the application.
 * Automatically fetches user data on mount and provides helper functions for
 * checking permissions.
 *
 * @example
 * ```tsx
 * <PermissionsProvider>
 *   <App />
 * </PermissionsProvider>
 * ```
 */
export function PermissionsProvider({ children }: PermissionsProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch current user's permissions from the API
   */
  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/dam/me')

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated
          setUser(null)
          setError('Not authenticated')
          return
        }

        throw new Error('Failed to fetch user permissions')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      console.error('Error fetching user permissions:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch user on mount
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  /**
   * Check if user can upload assets
   */
  const canUpload = useCallback(() => {
    if (!user || !user.isActive) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    return user.permissions.canUpload === true
  }, [user])

  /**
   * Check if user can delete assets
   */
  const canDelete = useCallback(() => {
    if (!user || !user.isActive) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    return user.permissions.canDelete === true
  }, [user])

  /**
   * Check if user can manage users
   */
  const canManageUsers = useCallback(() => {
    if (!user || !user.isActive) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    return user.permissions.canManageUsers === true
  }, [user])

  /**
   * Check if user can manage collections
   */
  const canManageCollections = useCallback(() => {
    if (!user || !user.isActive) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    return user.permissions.canManageCollections === true
  }, [user])

  /**
   * Check if user can export assets
   */
  const canExport = useCallback(() => {
    if (!user || !user.isActive) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    return user.permissions.canExport === true
  }, [user])

  /**
   * Check if user can access a specific collection
   */
  const canAccessCollection = useCallback((collectionId: string) => {
    if (!user || !user.isActive) return false
    if (user.role === 'admin' || user.role === 'super_admin') return true
    return checkCollectionAccess(user, collectionId)
  }, [user])

  /**
   * Check if user has a minimum role level
   */
  const hasRole = useCallback((minRole: Role) => {
    if (!user || !user.isActive) return false

    const roleHierarchy: Record<Role, number> = {
      viewer: 0,
      editor: 1,
      admin: 2,
      super_admin: 3
    }

    return roleHierarchy[user.role] >= roleHierarchy[minRole]
  }, [user])

  const value: PermissionsContextType = {
    user,
    isLoading,
    error,
    canUpload,
    canDelete,
    canManageUsers,
    canManageCollections,
    canExport,
    canAccessCollection,
    hasRole,
    refresh: fetchUser
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * usePermissions Hook
 *
 * Access the permissions context from any component.
 * Must be used within a PermissionsProvider.
 *
 * @throws {Error} If used outside of PermissionsProvider
 * @returns {PermissionsContextType} The permissions context value
 *
 * @example
 * ```tsx
 * const { user, canUpload, canDelete } = usePermissions()
 *
 * if (canUpload()) {
 *   return <FileUploader />
 * }
 * ```
 */
export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext)

  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }

  return context
}

/**
 * Permission Guard Component Props
 */
interface RequirePermissionProps {
  children: ReactNode
  permission: 'canUpload' | 'canDelete' | 'canManageUsers' | 'canManageCollections' | 'canExport'
  fallback?: ReactNode
}

/**
 * RequirePermission Component
 *
 * Conditionally renders children only if the user has the specified permission.
 * Optionally renders a fallback component if permission is denied.
 *
 * @example
 * ```tsx
 * <RequirePermission permission="canUpload">
 *   <FileUploader />
 * </RequirePermission>
 *
 * <RequirePermission permission="canDelete" fallback={<div>Access denied</div>}>
 *   <DeleteButton />
 * </RequirePermission>
 * ```
 */
export function RequirePermission({ children, permission, fallback = null }: RequirePermissionProps) {
  const context = usePermissions()

  // While loading, don't render anything (or could render a loading state)
  if (context.isLoading) {
    return null
  }

  // Check if user has the required permission
  const hasPermission = context[permission]()

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Role Guard Component Props
 */
interface RequireRoleProps {
  children: ReactNode
  role: Role
  fallback?: ReactNode
}

/**
 * RequireRole Component
 *
 * Conditionally renders children only if the user has the specified role or higher.
 * Optionally renders a fallback component if role requirement is not met.
 *
 * @example
 * ```tsx
 * <RequireRole role="admin">
 *   <AdminPanel />
 * </RequireRole>
 *
 * <RequireRole role="editor" fallback={<div>Editor access required</div>}>
 *   <EditButton />
 * </RequireRole>
 * ```
 */
export function RequireRole({ children, role, fallback = null }: RequireRoleProps) {
  const { hasRole, isLoading } = usePermissions()

  // While loading, don't render anything (or could render a loading state)
  if (isLoading) {
    return null
  }

  // Check if user has the required role
  if (!hasRole(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Collection Access Guard Component Props
 */
interface RequireCollectionAccessProps {
  children: ReactNode
  collectionId: string
  fallback?: ReactNode
}

/**
 * RequireCollectionAccess Component
 *
 * Conditionally renders children only if the user has access to the specified collection.
 * Optionally renders a fallback component if access is denied.
 *
 * @example
 * ```tsx
 * <RequireCollectionAccess collectionId="collection-123">
 *   <CollectionContent />
 * </RequireCollectionAccess>
 *
 * <RequireCollectionAccess
 *   collectionId="collection-123"
 *   fallback={<div>No access to this collection</div>}
 * >
 *   <CollectionEditor />
 * </RequireCollectionAccess>
 * ```
 */
export function RequireCollectionAccess({ children, collectionId, fallback = null }: RequireCollectionAccessProps) {
  const { canAccessCollection, isLoading } = usePermissions()

  // While loading, don't render anything (or could render a loading state)
  if (isLoading) {
    return null
  }

  // Check if user has access to the collection
  if (!canAccessCollection(collectionId)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
