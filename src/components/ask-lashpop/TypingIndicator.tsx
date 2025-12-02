'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-[90%]">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      {/* Typing Bubble */}
      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-sage/10">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-dusty-rose/60"
              animate={{
                y: [0, -4, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
