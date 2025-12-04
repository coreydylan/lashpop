'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useDiscoverLook } from '@/contexts/DiscoverLookContext'

interface DiscoverLookButtonProps {
  variant?: 'hero' | 'floating' | 'inline'
  className?: string
}

/**
 * Button to open the Discover Your Look AI
 * Multiple variants for different placements
 */
export function DiscoverLookButton({ variant = 'hero', className = '' }: DiscoverLookButtonProps) {
  const { open, state } = useDiscoverLook()

  if (variant === 'hero') {
    return (
      <motion.button
        onClick={() => open('standalone')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          group relative overflow-hidden
          px-6 py-3.5 rounded-full
          bg-gradient-to-r from-dusty-rose via-terracotta to-golden
          text-white font-medium
          shadow-lg shadow-dusty-rose/25
          transition-all duration-300
          hover:shadow-xl hover:shadow-dusty-rose/30
          ${className}
        `}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'linear',
            repeatDelay: 3,
          }}
        />

        <span className="relative flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="tracking-wide">Discover Your Look</span>
        </span>
      </motion.button>
    )
  }

  if (variant === 'floating') {
    return (
      <motion.button
        onClick={() => open('standalone')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          fixed bottom-6 left-6 z-50
          hidden md:flex items-center gap-2
          px-5 py-3 rounded-full
          bg-gradient-to-r from-dusty-rose to-terracotta
          text-white text-sm font-medium
          shadow-lg shadow-dusty-rose/30
          hover:shadow-xl transition-shadow
          ${state.isOpen ? 'hidden' : ''}
          ${className}
        `}
      >
        <Sparkles className="w-4 h-4" />
        <span>Discover Your Look</span>
      </motion.button>
    )
  }

  // Inline variant
  return (
    <motion.button
      onClick={() => open('inline')}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-2
        px-4 py-2 rounded-full
        bg-dusty-rose/10 border border-dusty-rose/20
        text-dusty-rose text-sm font-medium
        hover:bg-dusty-rose/20 transition-colors
        ${className}
      `}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>Discover Your Look</span>
    </motion.button>
  )
}
