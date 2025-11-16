"use client"

import { useState, useEffect } from "react"
import { X, Mail, Loader2 } from "lucide-react"
import { PermissionBadge, type PermissionLevel } from "./PermissionBadge"

interface SharedUser {
  id: string
  email: string
  permission: PermissionLevel
  sharedAt: Date
}

interface SharedUsersListProps {
  resourceId: string
  resourceType: "asset" | "collection" | "set"
  isOwner?: boolean
}

export function SharedUsersList({
  resourceId,
  resourceType,
  isOwner = false
}: SharedUsersListProps) {
  const [users, setUsers] = useState<SharedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetchSharedUsers()
  }, [resourceId, resourceType])

  const fetchSharedUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dam/sharing/${resourceType}/${resourceId}/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch shared users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!isOwner) return

    if (!confirm("Remove this user's access?")) return

    try {
      setRemoving(userId)
      const response = await fetch(`/api/dam/sharing/${resourceType}/${resourceId}/users/${userId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
      } else {
        throw new Error("Failed to remove user")
      }
    } catch (error) {
      console.error("Failed to remove user:", error)
      alert("Failed to remove user access")
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-sage animate-spin" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-6">
        <Mail className="w-8 h-8 text-sage/40 mx-auto mb-2" />
        <p className="text-sm text-sage">Not shared with anyone yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-sage uppercase tracking-wide">
        Shared with ({users.length})
      </h4>
      <div className="space-y-1">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-2 rounded-xl bg-warm-sand/20 hover:bg-warm-sand/30 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-sage" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dune truncate">{user.email}</p>
                <p className="text-xs text-sage">
                  Shared {new Date(user.sharedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PermissionBadge level={user.permission} size="sm" />
              {isOwner && user.permission !== "owner" && (
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  disabled={removing === user.id}
                  className="p-1 rounded-full hover:bg-dusty-rose/10 transition-colors disabled:opacity-50"
                >
                  {removing === user.id ? (
                    <Loader2 className="w-3.5 h-3.5 text-dusty-rose animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-dusty-rose" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
