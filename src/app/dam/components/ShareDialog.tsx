"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, ChevronDown, UserPlus, Calendar } from "lucide-react"
import { PermissionBadge, PermissionLevel } from "./PermissionBadge"

interface User {
  id: string
  name: string
  email: string
  imageUrl?: string
}

interface SharedUser extends User {
  permissionLevel: PermissionLevel
  sharedAt: string
}

interface ShareDialogProps {
  resourceType: "asset" | "collection" | "set"
  resourceId: string
  isOpen: boolean
  onClose: () => void
}

export function ShareDialog({
  resourceType,
  resourceId,
  isOpen,
  onClose
}: ShareDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("viewer")
  const [expirationDate, setExpirationDate] = useState("")
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Fetch existing shared users
  useEffect(() => {
    if (isOpen) {
      fetchSharedUsers()
    }
  }, [isOpen, resourceType, resourceId])

  // Search users with debounce
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true)

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/dam/sharing/search-users?q=${encodeURIComponent(searchQuery)}`
          )
          if (response.ok) {
            const data = await response.json()
            setSearchResults(data.users || [])
          }
        } catch (err) {
          console.error("Error searching users:", err)
        } finally {
          setIsSearching(false)
        }
      }, 300)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const fetchSharedUsers = async () => {
    try {
      const response = await fetch(
        `/api/dam/sharing/list?resourceType=${resourceType}&resourceId=${resourceId}`
      )
      if (response.ok) {
        const data = await response.json()
        setSharedUsers(data.shares || [])
      }
    } catch (err) {
      console.error("Error fetching shared users:", err)
    }
  }

  const handleShare = async () => {
    if (!selectedUser) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dam/sharing/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          userId: selectedUser.id,
          permissionLevel,
          expiresAt: expirationDate || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to share resource")
      }

      // Reset form and refresh list
      setSelectedUser(null)
      setSearchQuery("")
      setPermissionLevel("viewer")
      setExpirationDate("")
      await fetchSharedUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share resource")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      await fetch("/api/dam/sharing/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          userId
        })
      })
      await fetchSharedUsers()
    } catch (err) {
      console.error("Error removing user:", err)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dune/50 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-cream arch-full shadow-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-sage/20">
              <div>
                <h2 className="h3 text-dune">Share {resourceType}</h2>
                <p className="caption text-sage mt-1">
                  Give others access to this resource
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-11 h-11 rounded-full hover:bg-warm-sand/30 flex items-center justify-center transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6 text-sage" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* User Search */}
              <div className="space-y-4 mb-8">
                <label className="caption text-dune block">
                  Add people
                </label>

                <div className="relative">
                  {selectedUser ? (
                    <div className="flex items-center gap-3 px-4 py-3 arch-full border-2 border-sage/40 bg-warm-sand/30">
                      <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-dune">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="body text-dune font-medium truncate">
                          {selectedUser.name}
                        </p>
                        <p className="text-xs text-sage truncate">
                          {selectedUser.email}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="text-sage hover:text-dune transition-colors"
                        aria-label="Clear selection"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sage" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name or email..."
                          className="w-full pl-12 pr-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune placeholder-sage/60 focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none"
                        />
                      </div>

                      {/* Search Results Dropdown */}
                      {searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-cream arch-full border-2 border-sage/20 shadow-2xl z-50 max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="px-4 py-8 text-center text-sage">
                              Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-sand/30 transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-dune">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="body text-dune font-medium truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-sage truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center text-sage">
                              No users found
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Permission Level */}
                {selectedUser && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="caption text-dune block mb-3">
                        Permission Level
                      </label>
                      <select
                        value={permissionLevel}
                        onChange={(e) => setPermissionLevel(e.target.value as PermissionLevel)}
                        className="w-full px-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none cursor-pointer"
                      >
                        <option value="viewer">Viewer - View only</option>
                        <option value="editor">Editor - View and edit</option>
                        <option value="admin">Admin - Full control</option>
                      </select>
                    </div>

                    <div>
                      <label className="caption text-dune block mb-3">
                        Expiration (Optional)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sage pointer-events-none" />
                        <input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => setExpirationDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-12 pr-4 py-3 arch-full border-2 border-sage/20 bg-warm-sand/20 text-dune focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 px-4 py-3 arch-full bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
                  {error}
                </div>
              )}

              {/* Shared Users List */}
              {sharedUsers.length > 0 && (
                <div>
                  <h3 className="caption text-dune mb-4">
                    People with access ({sharedUsers.length})
                  </h3>
                  <div className="space-y-2">
                    {sharedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-4 py-3 arch-full bg-warm-sand/20 border border-sage/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-dune">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="body text-dune font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-sage truncate">
                            {user.email}
                          </p>
                        </div>
                        <PermissionBadge
                          permissionLevel={user.permissionLevel}
                          variant="small"
                        />
                        {user.permissionLevel !== "owner" && (
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-sage hover:text-terracotta transition-colors"
                            aria-label="Remove access"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-sage/20 px-6 py-5">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="btn btn-secondary px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={!selectedUser || isLoading}
                  className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sharing..." : "Share"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
