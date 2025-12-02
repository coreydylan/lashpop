'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import { useAskLashpop } from '@/contexts/AskLashpopContext'
import { AIMessage } from './AIMessage'
import { UserMessage } from './UserMessage'
import { TypingIndicator } from './TypingIndicator'
import { QuickReplies } from './QuickReplies'

export function ChatInterface() {
  const { state, sendMessage } = useAskLashpop()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.isTyping])

  // Focus input when chat opens
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

  const handleQuickReply = (reply: string) => {
    if (state.isTyping) return
    sendMessage(reply)
  }

  // Get last message for quick replies
  const lastMessage = state.messages[state.messages.length - 1]
  const showQuickReplies = lastMessage?.role === 'assistant' && lastMessage?.quickReplies?.length

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
              {message.role === 'assistant' ? (
                <AIMessage message={message} />
              ) : (
                <UserMessage message={message} />
              )}
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
        {showQuickReplies && !state.isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pb-2"
          >
            <QuickReplies
              replies={lastMessage.quickReplies!}
              onSelect={handleQuickReply}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-sage/10 bg-white/50">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={state.isTyping}
            className="flex-1 px-4 py-2.5 rounded-full bg-white border border-sage/20
                       text-dune placeholder:text-dune/40 text-sm
                       focus:outline-none focus:border-dusty-rose/50 focus:ring-2 focus:ring-dusty-rose/20
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          />
          <motion.button
            type="submit"
            disabled={!inputValue.trim() || state.isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-full bg-dusty-rose text-white
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-terracotta transition-colors"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
