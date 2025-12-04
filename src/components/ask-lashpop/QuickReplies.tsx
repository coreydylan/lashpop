'use client'

import { motion } from 'framer-motion'
import { getCategoryColors } from '@/lib/category-colors'
import { getCategoryIcon } from '@/components/icons/CategoryIcons'
import type { SmartQuickReply, ChatAction } from '@/lib/ask-lashpop/types'

interface QuickRepliesProps {
  replies: SmartQuickReply[]
  onTextSelect: (text: string) => void
  onActionSelect: (action: ChatAction) => void
}

// Map common terms to category slugs
const CATEGORY_KEYWORDS: Record<string, string> = {
  lash: 'lashes',
  lashes: 'lashes',
  'lash lift': 'lashes',
  'lash extensions': 'lashes',
  brow: 'brows',
  brows: 'brows',
  'brow lamination': 'brows',
  facial: 'facials',
  facials: 'facials',
  wax: 'waxing',
  waxing: 'waxing',
  pmu: 'permanent-makeup',
  'permanent makeup': 'permanent-makeup',
  microblading: 'permanent-makeup',
  specialty: 'specialty',
  bundle: 'bundles',
  bundles: 'bundles',
}

// Detect if a reply label is category-related and return the category slug
function detectCategory(label: string): string | null {
  const lowerLabel = label.toLowerCase()

  // Check for exact category names first
  for (const [keyword, slug] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lowerLabel.includes(keyword)) {
      return slug
    }
  }

  return null
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
        {replies.map((reply, index) => {
          // Check if this reply should use category colors
          const categorySlug = detectCategory(reply.label)
          const categoryColors = categorySlug ? getCategoryColors(categorySlug) : null
          const CategoryIcon = categorySlug ? getCategoryIcon(categoryColors?.iconName || categorySlug) : null

          // Use category colors if detected, otherwise fall back to default styling
          const usesCategoryStyle = !!categoryColors

          return (
            <motion.button
              key={`${reply.type}-${reply.label}`}
              onClick={() => handleClick(reply)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                         flex-shrink-0 transition-colors flex items-center gap-1.5
                         ${!usesCategoryStyle && reply.type === 'action'
                           ? 'bg-dusty-rose/10 border border-dusty-rose/30 text-dune hover:bg-dusty-rose/20'
                           : !usesCategoryStyle
                           ? 'bg-white border border-sage/20 text-dune hover:border-dusty-rose/30 hover:bg-dusty-rose/5'
                           : 'border hover:scale-105'
                         }`}
              style={usesCategoryStyle ? {
                backgroundColor: categoryColors!.light,
                borderColor: categoryColors!.medium,
                color: categoryColors!.primary,
              } : undefined}
            >
              {CategoryIcon && <CategoryIcon className="w-3 h-3 flex-shrink-0" />}
              {reply.label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
