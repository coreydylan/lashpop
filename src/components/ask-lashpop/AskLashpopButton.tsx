'use client'

import { motion } from 'framer-motion'
import { Sparkles, MessageCircle } from 'lucide-react'
import { useAskLashpop } from '@/contexts/AskLashpopContext'

/**
 * Desktop floating button - Bottom right
 * Only visible on desktop when chat is closed
 */
export function AskLashpopDesktopButton() {
  const { state, toggle } = useAskLashpop()

  if (state.isOpen) return null

  return (
    <motion.button
      onClick={toggle}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="hidden md:flex fixed bottom-6 right-6 z-[99]
                 items-center gap-2 px-5 py-3
                 bg-gradient-to-r from-dusty-rose to-terracotta
                 text-white font-medium text-sm
                 rounded-full shadow-lg
                 hover:shadow-xl transition-shadow"
    >
      <Sparkles className="w-4 h-4" />
      <span>ASK LASHPOP</span>
    </motion.button>
  )
}

/**
 * Mobile header button - Used inside MobileHeader
 * This is the center button that replaces section indicator
 */
export function AskLashpopMobileButton() {
  const { toggle, state } = useAskLashpop()

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full
        transition-all duration-200
        ${state.isOpen
          ? 'bg-dusty-rose text-white'
          : 'bg-dusty-rose/10 border border-dusty-rose/20 text-dusty-rose'
        }
      `}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span className="text-[10px] font-semibold tracking-wider uppercase">
        ASK LASHPOP
      </span>
    </motion.button>
  )
}

/**
 * Alternative: Icon-only mobile button (more compact)
 */
export function AskLashpopMobileIconButton() {
  const { toggle, state } = useAskLashpop()

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        relative p-2 rounded-full transition-all duration-200
        ${state.isOpen
          ? 'bg-dusty-rose text-white'
          : 'bg-dusty-rose/10 text-dusty-rose'
        }
      `}
    >
      {state.isOpen ? (
        <MessageCircle className="w-5 h-5" />
      ) : (
        <Sparkles className="w-5 h-5" />
      )}

      {/* Notification dot when there might be unread */}
      {!state.isOpen && state.messages.length > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-terracotta rounded-full" />
      )}
    </motion.button>
  )
}
