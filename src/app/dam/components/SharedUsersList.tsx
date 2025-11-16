"use client"

import { useState, useEffect } from "react"
import { Trash2, ChevronDown } from "lucide-react"
import { PermissionBadge, PermissionLevel } from "./PermissionBadge"
import { motion, AnimatePresence } from "framer-motion"

interface SharedUser {
  id: string
  name: string
  email: string
  permissionLevel: PermissionLevel
  sharedAt: string
  imageUrl?: string
}

interface SharedUsersListProps {
  resourceType: "asset" | "collection" | "set"
  resourceId: string
}

export function SharedUsersList({
  resourceType,
  resourceId
}: SharedUsersListProps) {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchSharedUsers()
  }, [resourceType, resourceId])

  const fetchSharedUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/dam/sharing/list?resourceType=${resourceType}&resourceId=${resourceId}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch shared users")
      }

      const data = await response.json()
      setSharedUsers(data.shares || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shared users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePermission = async (userId: string, newPermission: PermissionLevel) => {
    try {
      const response = await fetch("/api/dam/sharing/update-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          userId,
          permissionLevel: newPermission
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update permission")
      }

      // Update local state
      setSharedUsers(users =>
        users.map(user =>
          user.id === userId
            ? { ...user, permissionLevel: newPermission }
            : user
        )
      )
      setEditingUserId(null)
    } catch (err) {
      console.error("Error updating permission:", err)
      alert("Failed to update permission. Please try again.")
    }
  }

  const handleRevokeAccess = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user's access?")) {
      return
    }

    try {
      const response = await fetch("/api/dam/sharing/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          userId
        })
      })

      if (!response.ok) {
        throw new Error("Failed to revoke access")
      }

      // Update local state
      setSharedUsers(users => users.filter(user => user.id !== userId))
    } catch (err) {
      console.error("Error revoking access:", err)
      alert("Failed to revoke access. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  if (isLoading) {
    return (
      <div className="px-6 py-8 text-center">
        <div className="inline-block w-8 h-8 border-3 border-sage/30 border-t-sage rounded-full animate-spin" />
        <p className="caption text-sage mt-4">Loading shared users...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-6 arch-full bg-terracotta/10 border border-terracotta/30">
        <p className="text-sm text-terracotta">{error}</p>
      </div>
    )
  }

  if (sharedUsers.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-sage">No users have access to this resource yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {sharedUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-4 px-4 py-4 arch-full bg-warm-sand/20 border border-sage/10 hover:border-sage/20 transition-all"
          >
            {/* User Avatar */}
            <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-base font-medium text-dune">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="body text-dune font-medium truncate">
                  {user.name}
                </p>
                {user.permissionLevel === "owner" && (
                  <PermissionBadge
                    permissionLevel="owner"
                    variant="small"
                  />
                )}
              </div>
              <p className="text-sm text-sage truncate">
                {user.email}
              </p>
              <p className="text-xs text-sage/70 mt-1">
                Shared {formatDate(user.sharedAt)}
              </p>
            </div>

            {/* Permission Dropdown */}
            {user.permissionLevel !== "owner" && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                    className="flex items-center gap-2 px-3 py-2 arch-full border border-sage/20 bg-cream hover:bg-warm-sand/30 transition-colors text-sm"
                  >
                    <PermissionBadge
                      permissionLevel={user.permissionLevel}
                      variant="small"
                    />
                    <ChevronDown className="w-4 h-4 text-sage" />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {editingUserId === user.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 bg-cream arch-full border-2 border-sage/20 shadow-2xl z-10 min-w-[160px]"
                      >
                        {(["viewer", "editor", "admin"] as PermissionLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => handleUpdatePermission(user.id, level)}
                            className={`w-full px-4 py-3 text-left hover:bg-warm-sand/30 transition-colors first:rounded-t-[24px] last:rounded-b-[24px] ${
                              user.permissionLevel === level ? "bg-dusty-rose/10" : ""
                            }`}
                          >
                            <PermissionBadge
                              permissionLevel={level}
                              variant="small"
                            />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRevokeAccess(user.id)}
                  className="w-10 h-10 rounded-full hover:bg-terracotta/10 flex items-center justify-center transition-colors group"
                  aria-label="Remove access"
                  title="Remove access"
                >
                  <Trash2 className="w-5 h-5 text-sage group-hover:text-terracotta transition-colors" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
