'use client'

import { motion } from 'framer-motion'
import {
  MapPin,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Eye,
  Check
} from 'lucide-react'
import { useAskLashpop } from '@/contexts/AskLashpopContext'
import type { ChatMessage, ChatAction } from '@/lib/ask-lashpop/types'

interface AIMessageProps {
  message: ChatMessage
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'map-pin': MapPin,
  'map': MapPin,
  'location': MapPin,
  'calendar': Calendar,
  'book': Calendar,
  'phone': Phone,
  'call': Phone,
  'mail': Mail,
  'email': Mail,
  'external': ExternalLink,
  'link': ExternalLink,
  'sparkles': Sparkles,
  'eye': Eye,
  'view': Eye,
  'check': Check,
  'success': Check,
}

function getIcon(iconName?: string) {
  if (!iconName) return ChevronRight
  return iconMap[iconName.toLowerCase()] || ChevronRight
}

// Strip markdown formatting from AI responses
function stripMarkdown(text: string): string {
  return text
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bullet points and convert to sentence flow
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // Remove numbered lists formatting
    .replace(/^\d+\.\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function AIMessage({ message }: AIMessageProps) {
  const { executeAction } = useAskLashpop()

  const handleActionClick = (action: ChatAction) => {
    executeAction(action)
  }

  return (
    <div className="flex gap-3 max-w-[90%]">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose to-terracotta flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 space-y-2">
        {/* Message Bubble */}
        <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-sage/10">
          <p className="text-sm text-dune whitespace-pre-wrap leading-relaxed">
            {stripMarkdown(message.content)}
          </p>
        </div>

        {/* Action Buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.actions.map((action, index) => {
              const Icon = getIcon(action.icon)
              return (
                <motion.button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                             bg-dusty-rose/10 border border-dusty-rose/20
                             text-dusty-rose text-sm font-medium
                             hover:bg-dusty-rose hover:text-white hover:border-dusty-rose
                             transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
