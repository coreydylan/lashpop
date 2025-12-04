'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose/20 to-terracotta/20
                      flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-dusty-rose" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-sage/10 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-dusty-rose/60"
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
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
