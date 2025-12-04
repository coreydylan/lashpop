'use client'

import { motion } from 'framer-motion'
import { Calendar, Eye, Sparkles, MapPin, Users, Check } from 'lucide-react'
import Image from 'next/image'
import type { DiscoveryMessage as DiscoveryMessageType, DiscoveryAction } from '@/lib/discover-look/types'
import { StyleCard } from './StyleCard'
import { ServiceRecommendationCard } from './ServiceRecommendationCard'

interface DiscoveryMessageProps {
  message: DiscoveryMessageType
  onActionClick: (action: DiscoveryAction) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  calendar: Calendar,
  eye: Eye,
  sparkles: Sparkles,
  'map-pin': MapPin,
  users: Users,
  check: Check,
}

export function DiscoveryMessage({ message, onActionClick }: DiscoveryMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md
                        bg-gradient-to-r from-dusty-rose to-terracotta text-white
                        shadow-sm">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex flex-col gap-3">
      {/* Avatar and message */}
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose/20 to-terracotta/20
                        flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-dusty-rose" />
        </div>
        <div className="flex-1 max-w-[85%]">
          <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-white border border-sage/10 shadow-sm">
            <p className="text-sm text-dune leading-relaxed">{message.content}</p>
          </div>
        </div>
      </div>

      {/* Images */}
      {message.images && message.images.length > 0 && (
        <div className="ml-10 flex flex-wrap gap-2">
          {message.images.map((image) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-24 h-24 rounded-xl overflow-hidden shadow-md"
            >
              <Image
                src={image.filePath}
                alt={image.altText || 'Style example'}
                fill
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Style Cards */}
      {message.styleCards && message.styleCards.length > 0 && (
        <div className="ml-10 flex flex-wrap gap-2">
          {message.styleCards.map((card) => (
            <StyleCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Service Recommendation */}
      {message.serviceRecommendation && (
        <div className="ml-10">
          <ServiceRecommendationCard
            recommendation={message.serviceRecommendation}
            onBook={() => {
              if (message.actions?.find((a) => a.type === 'book_service')) {
                onActionClick(message.actions.find((a) => a.type === 'book_service')!)
              }
            }}
          />
        </div>
      )}

      {/* Action Buttons */}
      {message.actions && message.actions.length > 0 && !message.serviceRecommendation && (
        <div className="ml-10 flex flex-wrap gap-2">
          {message.actions.map((action, index) => {
            const IconComponent = action.icon ? iconMap[action.icon] || Sparkles : Sparkles

            return (
              <motion.button
                key={index}
                onClick={() => onActionClick(action)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                           bg-dusty-rose text-white text-sm font-medium
                           shadow-md hover:shadow-lg transition-shadow"
              >
                <IconComponent className="w-4 h-4" />
                <span>{action.label}</span>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
