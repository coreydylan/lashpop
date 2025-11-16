"use client"

import { useRef, useEffect, useState } from 'react'
import clsx from 'clsx'
import type { Token } from '@/lib/commands/grammar'
import { findGrammarRule } from '@/lib/commands/grammar'

interface TokenizedInputProps {
  value: string
  onChange: (value: string) => void
  tokens: Token[]
  placeholder?: string
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  error?: string
  autoFocus?: boolean
}

/**
 * TokenizedInput - Displays command input with color-coded tokens
 *
 * Shows tokens in different colors based on their type:
 * - Verbs: dusty-rose
 * - Objects: sage
 * - Modifiers: dune
 * - Chainers: cream-dark
 * - Values: terracotta
 */
export function TokenizedInput({
  value,
  onChange,
  tokens,
  placeholder = 'Type a command...',
  onKeyDown,
  onFocus,
  onBlur,
  error,
  autoFocus = false
}: TokenizedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Sync scroll between input and overlay
  useEffect(() => {
    const input = inputRef.current
    const overlay = overlayRef.current
    if (!input || !overlay) return

    const handleScroll = () => {
      overlay.scrollLeft = input.scrollLeft
    }

    input.addEventListener('scroll', handleScroll)
    return () => input.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFocus = () => {
    setIsFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  // Get color for token type
  const getTokenColor = (token: Token): string => {
    // Check if token has metadata color (from tag/category)
    if (token.metadata?.color) {
      return token.metadata.color
    }

    // Get color from grammar rule
    const grammarRule = findGrammarRule(token.value)
    if (grammarRule?.rule.color) {
      return grammarRule.rule.color
    }

    // Default colors by type
    switch (token.type) {
      case 'verb':
        return '#C4A587' // dusty-rose
      case 'object':
        return '#A19781' // sage
      case 'modifier':
        return '#8B7355' // dune
      case 'chainer':
        return '#D4C4B0' // cream-dark
      case 'value':
        return '#BD8878' // terracotta
      default:
        return '#8B7355' // dune
    }
  }

  // Render tokenized overlay
  const renderTokenOverlay = () => {
    if (tokens.length === 0 || !value) {
      return null
    }

    // Build overlay with colored tokens
    const words = value.split(/(\s+)/)
    let tokenIndex = 0
    let position = 0

    return words.map((word, index) => {
      if (!word) return null

      // If it's whitespace, render it as-is
      if (/^\s+$/.test(word)) {
        position += word.length
        return (
          <span key={index} className="whitespace-pre">
            {word}
          </span>
        )
      }

      // Find matching token
      const token = tokens[tokenIndex]
      tokenIndex++

      if (!token) {
        position += word.length
        return (
          <span key={index} className="text-transparent">
            {word}
          </span>
        )
      }

      const color = getTokenColor(token)
      position += word.length

      return (
        <span
          key={index}
          className="font-semibold"
          style={{ color }}
        >
          {word}
        </span>
      )
    })
  }

  return (
    <div className="relative w-full">
      {/* Token overlay */}
      <div
        ref={overlayRef}
        className={clsx(
          'absolute inset-0 pointer-events-none overflow-hidden whitespace-pre',
          'px-4 py-2.5 text-sm',
          'rounded-[20px]'
        )}
        style={{
          lineHeight: '1.5',
          fontFamily: 'inherit'
        }}
      >
        <div className="inline">
          {renderTokenOverlay()}
        </div>
      </div>

      {/* Actual input (transparent text) */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={clsx(
          'w-full bg-transparent outline-none text-sm',
          'px-4 py-2.5 rounded-[20px]',
          'border transition-colors',
          error
            ? 'border-red-400 bg-red-50/50'
            : isFocused
            ? 'border-dusty-rose/40 bg-white/90'
            : 'border-sage/20 bg-cream/80',
          'placeholder:text-sage/60',
          // Make text transparent so overlay shows through
          tokens.length > 0 && value ? 'text-transparent caret-dune' : 'text-dune'
        )}
        style={{
          caretColor: '#8B7355' // dune color for caret
        }}
      />

      {/* Error message */}
      {error && (
        <div className="absolute left-4 -bottom-6 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}
    </div>
  )
}
