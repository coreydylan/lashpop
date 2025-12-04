'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import { useDiscoverLook } from '@/contexts/DiscoverLookContext'
import { DiscoveryMessage } from './DiscoveryMessage'
import { DiscoveryQuickReplies } from './DiscoveryQuickReplies'
import { TypingIndicator } from './TypingIndicator'
import type { DiscoveryAction } from '@/lib/discover-look/types'

export function DiscoveryChatInterface() {
  const { state, sendMessage, executeAction } = useDiscoverLook()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.isTyping])

  // Focus input when opened
  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [state.isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || state.isTyping) return

    sendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleTextQuickReply = (text: string) => {
    if (state.isTyping) return
    sendMessage(text)
  }

  const handleActionQuickReply = (action: DiscoveryAction) => {
    if (state.isTyping) return
    executeAction(action)
  }

  // Get last message for quick replies
  const lastMessage = state.messages[state.messages.length - 1]
  const showQuickReplies =
    lastMessage?.role === 'assistant' && lastMessage?.quickReplies?.length && !state.isTyping

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {state.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DiscoveryMessage message={message} onActionClick={executeAction} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {state.isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <AnimatePresence>
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pb-2"
          >
            <DiscoveryQuickReplies
              replies={lastMessage.quickReplies!}
              onTextSelect={handleTextQuickReply}
              onActionSelect={handleActionQuickReply}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-sage/10 bg-white/60 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tell me about your style..."
              disabled={state.isTyping}
              className="w-full px-4 py-3 pr-12 rounded-2xl bg-white border border-sage/20
                         text-dune placeholder:text-dune/40 text-sm
                         focus:outline-none focus:border-dusty-rose/50 focus:ring-2 focus:ring-dusty-rose/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all"
            />
            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dusty-rose/30" />
          </div>
          <motion.button
            type="submit"
            disabled={!inputValue.trim() || state.isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl bg-gradient-to-r from-dusty-rose to-terracotta text-white
                       disabled:opacity-40 disabled:cursor-not-allowed
                       shadow-md hover:shadow-lg transition-shadow"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
