'use client'

import { motion } from 'framer-motion'

interface QuickRepliesProps {
  replies: string[]
  onSelect: (reply: string) => void
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply, index) => (
        <motion.button
          key={reply}
          onClick={() => onSelect(reply)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-3 py-1.5 rounded-full text-xs font-medium
                     bg-white border border-sage/20 text-dune
                     hover:border-dusty-rose/30 hover:bg-dusty-rose/5
                     transition-colors"
        >
          {reply}
        </motion.button>
      ))}
    </div>
  )
}
