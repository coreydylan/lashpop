'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PunchlistUserAvatar } from './PunchlistUserAvatar'
import {
  getPunchlistComments,
  addPunchlistComment,
  type PunchlistCommentWithUser
} from '@/actions/punchlist'
import type { PunchlistUser } from '@/db/schema/punchlist'
import { Send, Loader2 } from 'lucide-react'

interface PunchlistCommentsProps {
  itemId: string
  currentUser: PunchlistUser
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

export function PunchlistComments({
  itemId,
  currentUser,
  onCommentAdded
}: PunchlistCommentsProps) {
  const [comments, setComments] = useState<PunchlistCommentWithUser[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    loadComments()
  }, [itemId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const data = await getPunchlistComments(itemId)
      setComments(data)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSending) return

    setIsSending(true)
    try {
      const comment = await addPunchlistComment(itemId, newComment.trim())
      if (comment) {
        setNewComment('')
        await loadComments()
        onCommentAdded()
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        Discussion
        {comments.length > 0 && (
          <span className="text-xs text-gray-400">({comments.length})</span>
        )}
      </h4>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No comments yet. Start the conversation!</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          <AnimatePresence initial={false}>
            {comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <PunchlistUserAvatar user={comment.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {comment.user.name.split(' ')[0]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <PunchlistUserAvatar user={currentUser} size="sm" />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={cn(
              'flex-1 px-3 py-2 text-sm rounded-full border border-gray-200',
              'bg-gray-50 focus:bg-white focus:border-dusty-rose/50 focus:ring-1 focus:ring-dusty-rose/20',
              'outline-none transition-all'
            )}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSending}
            className={cn(
              'p-2 rounded-full transition-all',
              newComment.trim()
                ? 'bg-dusty-rose text-white hover:bg-dusty-rose/90'
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
    </div>
  )
}
