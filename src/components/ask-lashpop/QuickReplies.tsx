'use client'

import { motion } from 'framer-motion'
import type { SmartQuickReply, ChatAction } from '@/lib/ask-lashpop/types'

interface QuickRepliesProps {
  replies: SmartQuickReply[]
  onTextSelect: (text: string) => void
  onActionSelect: (action: ChatAction) => void
}

export function QuickReplies({ replies, onTextSelect, onActionSelect }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null

  const handleClick = (reply: SmartQuickReply) => {
    if (reply.type === 'text') {
      onTextSelect(reply.label)
    } else {
      onActionSelect(reply.action)
    }
  }

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
        {replies.map((reply, index) => (
          <motion.button
            key={`${reply.type}-${reply.label}`}
            onClick={() => handleClick(reply)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                       flex-shrink-0 transition-colors
                       ${reply.type === 'action'
                         ? 'bg-dusty-rose/10 border border-dusty-rose/30 text-dune hover:bg-dusty-rose/20'
                         : 'bg-white border border-sage/20 text-dune hover:border-dusty-rose/30 hover:bg-dusty-rose/5'
                       }`}
          >
            {reply.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
