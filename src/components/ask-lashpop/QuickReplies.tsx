'use client'

import { motion } from 'framer-motion'

interface QuickRepliesProps {
  replies: string[]
  onSelect: (reply: string) => void
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
        {replies.map((reply, index) => (
          <motion.button
            key={reply}
            onClick={() => onSelect(reply)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                       bg-white border border-sage/20 text-dune
                       hover:border-dusty-rose/30 hover:bg-dusty-rose/5
                       transition-colors flex-shrink-0"
          >
            {reply}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
