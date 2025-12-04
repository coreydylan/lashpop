'use client'

import { motion } from 'framer-motion'
import { Sparkles, Calendar, Eye, MapPin, BookOpen } from 'lucide-react'
import type { DiscoveryQuickReply, DiscoveryAction } from '@/lib/discover-look/types'

interface DiscoveryQuickRepliesProps {
  replies: DiscoveryQuickReply[]
  onTextSelect: (text: string) => void
  onActionSelect: (action: DiscoveryAction) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  calendar: Calendar,
  eye: Eye,
  'map-pin': MapPin,
  book: BookOpen,
}

export function DiscoveryQuickReplies({
  replies,
  onTextSelect,
  onActionSelect,
}: DiscoveryQuickRepliesProps) {
  const handleClick = (reply: DiscoveryQuickReply) => {
    if (reply.type === 'text') {
      onTextSelect(reply.label)
    } else if (reply.type === 'action') {
      onActionSelect(reply.action)
    } else if (reply.type === 'preference') {
      // Handle preference updates inline
      onTextSelect(reply.label)
    }
  }

  // Determine chip style based on content
  const getChipStyle = (reply: DiscoveryQuickReply) => {
    const label = reply.label.toLowerCase()

    // Action-based styling
    if (reply.type === 'action') {
      if (label.includes('book')) {
        return 'bg-dusty-rose text-white border-dusty-rose'
      }
      if (label.includes('show') || label.includes('see')) {
        return 'bg-terracotta/10 text-terracotta border-terracotta/20'
      }
    }

    // Content-based styling
    if (label.includes('lashes') || label.includes('lash')) {
      return 'bg-[#CDA89E]/15 text-[#8A5E55] border-[#CDA89E]/30'
    }
    if (label.includes('brows') || label.includes('brow')) {
      return 'bg-[#D4AF75]/15 text-[#8B7355] border-[#D4AF75]/30'
    }
    if (label.includes('facials') || label.includes('facial') || label.includes('skin')) {
      return 'bg-[#BCC9C2]/15 text-[#5A6B62] border-[#BCC9C2]/30'
    }

    // Default
    return 'bg-white text-dune border-sage/20 hover:border-dusty-rose/30'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply, index) => {
        const chipStyle = getChipStyle(reply)
        const IconComponent =
          reply.type === 'action' && reply.icon ? iconMap[reply.icon] : null

        return (
          <motion.button
            key={index}
            onClick={() => handleClick(reply)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`
              flex items-center gap-1.5 px-3.5 py-2 rounded-full
              text-sm font-medium border
              shadow-sm hover:shadow-md transition-all
              ${chipStyle}
            `}
          >
            {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
            <span>{reply.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
