'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PunchlistUserAvatar } from './PunchlistUserAvatar'
import { PunchlistStatusBadge, PunchlistPriorityBadge } from './PunchlistBadges'
import { PunchlistComments } from './PunchlistComments'
import { PunchlistStatusSelect } from './PunchlistStatusSelect'
import type { PunchlistItemWithRelations } from '@/actions/punchlist'
import type { PunchlistUser, PunchlistStatus } from '@/db/schema/punchlist'
import { MessageCircle, ChevronDown, Clock, User } from 'lucide-react'

interface PunchlistItemCardProps {
  item: PunchlistItemWithRelations
  currentUser: PunchlistUser
  onStatusChange: (itemId: string, status: PunchlistStatus) => Promise<void>
  onCommentAdded: () => void
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

export function PunchlistItemCard({
  item,
  currentUser,
  onStatusChange,
  onCommentAdded
}: PunchlistItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: PunchlistStatus) => {
    setIsUpdating(true)
    try {
      await onStatusChange(item.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const isClosed = item.status === 'closed'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-2xl bg-white border transition-all duration-200',
        isClosed
          ? 'border-gray-100 bg-gray-50/50'
          : 'border-gray-200 hover:border-dusty-rose/30 hover:shadow-md'
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
        disabled={isUpdating}
      >
        <div className="flex items-start gap-3">
          {/* Priority indicator */}
          <div className="pt-1">
            <PunchlistPriorityBadge priority={item.priority as 'low' | 'medium' | 'high'} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3
                className={cn(
                  'font-medium',
                  isClosed ? 'text-gray-400 line-through' : 'text-gray-800'
                )}
              >
                {item.title}
              </h3>
              <PunchlistStatusBadge status={item.status as PunchlistStatus} size="sm" />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {item.assignedTo && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{item.assignedTo.name.split(' ')[0]}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimeAgo(item.updatedAt)}</span>
              </div>
              {item.commentCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{item.commentCount}</span>
                </div>
              )}
              <ChevronDown
                className={cn(
                  'w-4 h-4 ml-auto transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              {/* Description */}
              {item.description && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {item.description}
                </p>
              )}

              {/* Actions row */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <PunchlistStatusSelect
                    currentStatus={item.status as PunchlistStatus}
                    onStatusChange={handleStatusChange}
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Created by</span>
                  <PunchlistUserAvatar user={item.createdBy} size="sm" />
                </div>
              </div>

              {/* Comments section */}
              <div className="border-t border-gray-100 pt-4">
                <PunchlistComments
                  itemId={item.id}
                  currentUser={currentUser}
                  onCommentAdded={onCommentAdded}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
