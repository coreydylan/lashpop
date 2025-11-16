"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Users, Search, Edit2, UserCheck, UserX, Filter } from "lucide-react"
import { EditUserDialog } from "./components/EditUserDialog"
import { PermissionAuditLog } from "./components/PermissionAuditLog"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import type { Role, UserPermissions } from "@/types/permissions"

interface DamUser {
  id: string
  phoneNumber: string
  email: string | null
  name: string | null
  role: Role
  permissions: UserPermissions
  teamMemberId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  teamMemberName?: string | null
  teamMemberPhoto?: string | null
}

interface Collection {
  id: string
  name: string
  displayName: string
}

export default function DAMUsersAdmin() {
  const [users, setUsers] = useState<DamUser[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<Role>('admin')

  // View state
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<DamUser | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchUsers()
    fetchCollections()
    fetchCurrentUser()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/dam-users")
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
      } else {
        console.error("Failed to fetch users:", data.error)
        alert(`Failed to fetch users: ${data.error}`)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      alert("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const fetchCollections = async () => {
    try {
      // Fetch collections from the DAM API (assuming there's an endpoint)
      // For now, we'll use a placeholder
      setCollections([])
    } catch (error) {
      console.error("Error fetching collections:", error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      // Fetch current user's role
      // This would typically come from a session/auth endpoint
      // For now, we'll assume admin
      setCurrentUserRole('admin')
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const handleEditUser = (user: DamUser) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleSaveUser = async (userId: string, updates: any) => {
    // Refresh users list
    await fetchUsers()
  }

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.phoneNumber.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) =>
        statusFilter === 'active' ? user.isActive : !user.isActive
      )
    }

    return filtered
  }, [users, searchQuery, roleFilter, statusFilter])

  const getRoleBadge = (role: Role) => {
    const badges = {
      viewer: { variant: 'outline' as const, label: 'Viewer', color: 'text-gray-600' },
      editor: { variant: 'secondary' as const, label: 'Editor', color: 'text-blue-600' },
      admin: { variant: 'accent' as const, label: 'Admin', color: 'text-purple-600' },
      super_admin: { variant: 'default' as const, label: 'Super Admin', color: 'text-red-600' },
    }
    return badges[role] || badges.viewer
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
      <div className="max-w-7xl mx-auto px-4 py-12">
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
              <p className="text-sm text-dune/60">Manage roles, permissions, and access for all users</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 p-1 bg-cream/50 rounded-full border border-sage/10 inline-flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-dusty-rose text-white shadow-md'
                  : 'text-dune/60 hover:text-dune'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-dusty-rose text-white shadow-md'
                  : 'text-dune/60 hover:text-dune'
              }`}
            >
              Audit Log
            </button>
          </div>
        </motion.div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Filters & Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass border border-sage/20 rounded-3xl p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-dune/40" />
                    <Input
                      placeholder="Search by name, phone, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11"
                    />
                  </div>
                </div>
                <div>
                  <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}>
                    <option value="all">All Roles</option>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </Select>
                </div>
                <div>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
              </div>
              <div className="mt-3 text-xs text-dune/60">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </motion.div>

            {/* Users Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass border border-sage/20 rounded-3xl overflow-hidden shadow-xl"
            >
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-dune/60">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cream/30 border-b border-sage/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                          Team Member
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-dune/70 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10">
                      {filteredUsers.map((user) => {
                        const roleBadge = getRoleBadge(user.role)
                        return (
                          <tr
                            key={user.id}
                            className="hover:bg-cream/20 transition-colors cursor-pointer"
                            onClick={() => handleEditUser(user)}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-dusty-rose/30 to-terracotta/30 flex items-center justify-center border border-dusty-rose/20">
                                  <span className="text-sm font-medium text-terracotta">
                                    {(user.name || user.phoneNumber).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-dune">
                                    {user.name || "No name"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-dune">{user.phoneNumber}</div>
                              {user.email && (
                                <div className="text-xs text-dune/60">{user.email}</div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant={roleBadge.variant} className={roleBadge.color}>
                                {roleBadge.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              {user.teamMemberName ? (
                                <div className="flex items-center gap-2">
                                  {user.teamMemberPhoto && (
                                    <img
                                      src={user.teamMemberPhoto}
                                      alt={user.teamMemberName}
                                      className="h-8 w-8 rounded-full object-cover border border-sage/20"
                                    />
                                  )}
                                  <span className="text-sm text-dune">{user.teamMemberName}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-dune/40">Not linked</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {user.isActive ? (
                                  <>
                                    <UserCheck className="h-4 w-4 text-ocean-mist" />
                                    <span className="text-sm text-ocean-mist">Active</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-4 w-4 text-dune/40" />
                                    <span className="text-sm text-dune/40">Inactive</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditUser(user)
                                }}
                                className="p-2 rounded-full hover:bg-dusty-rose/10 text-dusty-rose transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
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
                <strong>Note:</strong> Click on any user row to edit their permissions, role, and access settings.
                All changes are logged in the audit log for accountability.
              </p>
            </motion.div>
          </>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PermissionAuditLog users={users} />
          </motion.div>
        )}

        {/* Edit User Dialog */}
        <EditUserDialog
          user={editingUser}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveUser}
          currentUserRole={currentUserRole}
          collections={collections}
        />
      </div>
    </div>
  )
}
