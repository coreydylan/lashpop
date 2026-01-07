'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  getPunchlistComments,
  getPunchlistItem,
  addPunchlistComment,
  type PunchlistCommentWithUser,
  type PunchlistItemWithRelations
} from '@/actions/punchlist'
import type { PunchlistUser } from '@/db/schema/punchlist'
import { X, Send, Loader2 } from 'lucide-react'

interface PunchlistCommentsDrawerProps {
  itemId: string | null
  currentUser: PunchlistUser
  onClose: () => void
  onCommentAdded: () => void
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function UserInitials({ user }: { user: PunchlistUser }) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors: Record<string, string> = {
    sage: 'bg-sage/20 text-sage',
    'dusty-rose': 'bg-dusty-rose/20 text-dusty-rose',
    'ocean-mist': 'bg-ocean-mist/30 text-dune'
  }

  return (
    <div
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
        colors[user.avatarColor] || colors.sage
      )}
    >
      {initials}
    </div>
  )
}

export function PunchlistCommentsDrawer({
  itemId,
  currentUser,
  onClose,
  onCommentAdded
}: PunchlistCommentsDrawerProps) {
  const [item, setItem] = useState<PunchlistItemWithRelations | null>(null)
  const [comments, setComments] = useState<PunchlistCommentWithUser[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (itemId) {
      loadData()
    }
  }, [itemId])

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  const loadData = async () => {
    if (!itemId) return
    setIsLoading(true)
    try {
      const [itemData, commentsData] = await Promise.all([
        getPunchlistItem(itemId),
        getPunchlistComments(itemId)
      ])
      setItem(itemData)
      setComments(commentsData)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !itemId || isSending) return

    setIsSending(true)
    try {
      await addPunchlistComment(itemId, newComment.trim())
      setNewComment('')
      await loadData()
      onCommentAdded()
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AnimatePresence>
      {itemId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium text-gray-800">
                    {item?.title || 'Loading...'}
                  </h2>
                  {item && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Created by {item.createdBy.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {/* Description */}
              {item?.description && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No comments yet</p>
                  <p className="text-xs text-gray-300 mt-1">Start the conversation</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <UserInitials user={comment.user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {comment.user.name.split(' ')[0]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-gray-200 p-4"
            >
              <div className="flex gap-2">
                <UserInitials user={currentUser} />
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className={cn(
                    'flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200',
                    'bg-gray-50 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-200',
                    'outline-none transition-all'
                  )}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSending}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    newComment.trim()
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
