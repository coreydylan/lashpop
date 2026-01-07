'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { PunchlistLoginForm } from '@/components/punchlist'
import { PunchlistTable } from '@/components/punchlist/PunchlistTable'
import { PunchlistCommentsDrawer } from '@/components/punchlist/PunchlistCommentsDrawer'
import {
  getCurrentPunchlistUser,
  getPunchlistItems,
  getPunchlistStats,
  getAllPunchlistUsers,
  updatePunchlistItemStatus,
  updatePunchlistItem,
  createPunchlistItem,
  deletePunchlistItem,
  logoutPunchlist,
  type PunchlistItemWithRelations
} from '@/actions/punchlist'
import type { PunchlistUser, PunchlistStatus, PunchlistPriority } from '@/db/schema/punchlist'
import { LogOut, Loader2 } from 'lucide-react'

type FilterOption = PunchlistStatus | 'all'

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'needs_review', label: 'Review' },
  { value: 'complete', label: 'Done' },
  { value: 'closed', label: 'Closed' }
]

export default function PunchlistPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<PunchlistUser | null>(null)
  const [items, setItems] = useState<PunchlistItemWithRelations[]>([])
  const [users, setUsers] = useState<PunchlistUser[]>([])
  const [filter, setFilter] = useState<FilterOption>('all')
  const [commentsItemId, setCommentsItemId] = useState<string | null>(null)
  const [counts, setCounts] = useState({
    all: 0,
    open: 0,
    in_progress: 0,
    needs_review: 0,
    complete: 0,
    closed: 0
  })

  const loadData = useCallback(async () => {
    try {
      const [itemsData, statsData, usersData] = await Promise.all([
        getPunchlistItems(),
        getPunchlistStats(),
        getAllPunchlistUsers()
      ])

      setItems(itemsData)
      setCounts({
        all: statsData.total,
        open: statsData.open,
        in_progress: statsData.inProgress,
        needs_review: statsData.needsReview,
        complete: statsData.complete,
        closed: statsData.closed
      })
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading punchlist data:', error)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const user = await getCurrentPunchlistUser()
      setCurrentUser(user)
      if (user) {
        await loadData()
      }
    } finally {
      setIsLoading(false)
    }
  }, [loadData])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLoginSuccess = () => {
    checkAuth()
  }

  const handleLogout = async () => {
    await logoutPunchlist()
    setCurrentUser(null)
    setItems([])
  }

  const handleStatusChange = async (itemId: string, status: PunchlistStatus) => {
    await updatePunchlistItemStatus(itemId, status)
    await loadData()
  }

  const handlePriorityChange = async (itemId: string, priority: PunchlistPriority) => {
    await updatePunchlistItem(itemId, { priority })
    await loadData()
  }

  const handleTitleChange = async (itemId: string, title: string) => {
    await updatePunchlistItem(itemId, { title })
    await loadData()
  }

  const handleCreateItem = async (title: string) => {
    await createPunchlistItem({ title })
    await loadData()
  }

  const handleDeleteItem = async (itemId: string) => {
    await deletePunchlistItem(itemId)
    await loadData()
  }

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true
    return item.status === filter
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Login state
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <PunchlistLoginForm onSuccess={handleLoginSuccess} />
      </div>
    )
  }

  // Main punchlist view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-semibold text-gray-800">
                LashPop Punchlist
              </h1>
              <span className="text-xs text-gray-400 hidden sm:inline">
                {counts.all} items
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 -mb-px overflow-x-auto pb-px">
            {filterOptions.map(option => {
              const count = counts[option.value === 'all' ? 'all' : option.value]
              const isActive = filter === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs',
                      isActive ? 'bg-gray-100' : 'bg-gray-50'
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <PunchlistTable
          items={filteredItems}
          users={users}
          currentUser={currentUser}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onTitleChange={handleTitleChange}
          onCreateItem={handleCreateItem}
          onDeleteItem={handleDeleteItem}
          onOpenComments={setCommentsItemId}
        />
      </main>

      {/* Comments Drawer */}
      <PunchlistCommentsDrawer
        itemId={commentsItemId}
        currentUser={currentUser}
        onClose={() => setCommentsItemId(null)}
        onCommentAdded={loadData}
      />
    </div>
  )
}
