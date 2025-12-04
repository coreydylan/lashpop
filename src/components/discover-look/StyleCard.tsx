'use client'

import { motion } from 'framer-motion'
import { Sparkles, Check } from 'lucide-react'
import Image from 'next/image'
import type { StyleCard as StyleCardType } from '@/lib/discover-look/types'

interface StyleCardProps {
  card: StyleCardType
  onClick?: () => void
  isSelected?: boolean
}

export function StyleCard({ card, onClick, isSelected }: StyleCardProps) {
  const isRecommended = card.tags.includes('recommended')

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex flex-col p-3 rounded-xl
        border transition-all
        ${isSelected
          ? 'border-dusty-rose bg-dusty-rose/5 shadow-md'
          : 'border-sage/20 bg-white hover:border-dusty-rose/40 hover:shadow-sm'
        }
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
      style={{ width: '140px' }}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1
                        px-2 py-0.5 rounded-full bg-gradient-to-r from-dusty-rose to-terracotta
                        text-white text-[10px] font-medium shadow-sm">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Best Match</span>
        </div>
      )}

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-dusty-rose
                        flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Image placeholder or actual image */}
      {card.image ? (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2">
          <Image
            src={card.image.filePath}
            alt={card.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-dusty-rose/10 to-terracotta/10
                        flex items-center justify-center mb-2">
          <Sparkles className="w-8 h-8 text-dusty-rose/40" />
        </div>
      )}

      {/* Name */}
      <h4 className="font-medium text-sm text-dune text-left line-clamp-1">
        {card.name}
      </h4>

      {/* Description */}
      <p className="text-[11px] text-dune/60 text-left line-clamp-2 mt-0.5">
        {card.description}
      </p>
    </motion.button>
  )
}
