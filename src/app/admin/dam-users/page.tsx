"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, ShieldOff, Users } from "lucide-react"

interface User {
  id: string
  phoneNumber: string
  email: string | null
  name: string | null
  damAccess: boolean
  createdAt: Date
}

export default function DAMUsersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/dam-users")
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
      } else {
        console.error("Failed to fetch users:", data.error)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDamAccess = async (userId: string, currentAccess: boolean) => {
    setUpdating(userId)

    try {
      const response = await fetch("/api/admin/dam-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          damAccess: !currentAccess,
        }),
      })

      if (response.ok) {
        // Update local state
        setUsers(users.map(u =>
          u.id === userId ? { ...u, damAccess: !currentAccess } : u
        ))
      } else {
        const data = await response.json()
        alert(`Failed to update access: ${data.error}`)
      }
    } catch (error) {
      console.error("Error updating DAM access:", error)
      alert("Failed to update access")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-warm-sand to-dusty-rose/30">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-dusty-rose/30 to-terracotta/30 backdrop-blur-sm border border-dusty-rose/20">
              <Users className="h-6 w-6 text-terracotta" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="h2 text-dune">DAM User Management</h1>
              <p className="text-sm text-dune/60">Grant or revoke access to the Digital Asset Manager</p>
            </div>
          </div>
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass border border-sage/20 rounded-3xl p-6 shadow-xl"
        >
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dune/60">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-cream/50 rounded-2xl border border-sage/10 hover:border-dusty-rose/20 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-dune">
                        {user.name || "No name"}
                      </div>
                      {user.damAccess && (
                        <div className="px-2 py-0.5 bg-ocean-mist/30 text-ocean-mist rounded-full text-xs font-semibold uppercase tracking-wide border border-ocean-mist/30">
                          DAM Access
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-dune/60 mt-1">
                      {user.phoneNumber}
                    </div>
                    {user.email && (
                      <div className="text-xs text-dune/40 mt-0.5">
                        {user.email}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleDamAccess(user.id, user.damAccess)}
                    disabled={updating === user.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-light transition-all ${
                      user.damAccess
                        ? "bg-terracotta/10 text-terracotta hover:bg-terracotta/20 border border-terracotta/30"
                        : "bg-ocean-mist/10 text-ocean-mist hover:bg-ocean-mist/20 border border-ocean-mist/30"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating === user.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : user.damAccess ? (
                      <>
                        <ShieldOff className="w-4 h-4" />
                        <span className="text-sm">Revoke</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">Grant</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 p-4 bg-golden/10 border border-golden/20 rounded-2xl"
        >
          <p className="text-sm text-dune/70">
            <strong>Note:</strong> Users must be registered (have an account) before they can be granted DAM access.
            Users can register by attempting to login to the DAM with their phone number.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
