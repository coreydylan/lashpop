"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import clsx from 'clsx'
import { Sparkles, Info, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { TokenizedInput } from './TokenizedInput'
import { parseCommand, autocomplete, isCommandComplete, type ContextData, type Suggestion } from '@/lib/commands/autocomplete-engine'
import { compileCommand, type CompiledCommand } from '@/lib/commands/command-compiler'

interface CommandAutocompleteProps {
  open: boolean
  onClose: () => void
  onExecute: (command: CompiledCommand) => void
  context: ContextData
  isMobile: boolean
}

/**
 * CommandAutocomplete - Main autocomplete UI component
 *
 * Features:
 * - Tokenized input with color-coded tokens
 * - Real-time suggestions as you type
 * - Command preview before execution
 * - Keyboard navigation (arrows, enter, escape)
 */
export function CommandAutocomplete({
  open,
  onClose,
  onExecute,
  context,
  isMobile
}: CommandAutocompleteProps) {
  const [input, setInput] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Parse command and get suggestions
  const parseResult = useMemo(() => {
    return parseCommand(input, cursorPosition, context)
  }, [input, cursorPosition, context])

  const { tokens, isValid, error, suggestions } = parseResult

  // Compile command for preview
  const compiledCommand = useMemo(() => {
    if (!isValid || tokens.length === 0) return null
    return compileCommand(tokens, context)
  }, [tokens, isValid, context])

  // Check if command is complete and ready to execute
  const isComplete = useMemo(() => {
    return isCommandComplete(tokens) && compiledCommand !== null
  }, [tokens, compiledCommand])

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setInput('')
      setCursorPosition(0)
      setActiveIndex(0)
    }
  }, [open])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(0)
  }, [suggestions])

  // Auto-scroll active suggestion into view
  useEffect(() => {
    if (suggestionsRef.current) {
      const activeElement = suggestionsRef.current.children[activeIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeIndex])

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    setCursorPosition(value.length)
  }, [])

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: Suggestion) => {
    const result = autocomplete(input, cursorPosition, suggestion)
    setInput(result.newInput)
    setCursorPosition(result.newCursorPosition)
    setActiveIndex(0)
  }, [input, cursorPosition])

  // Handle command execution
  const handleExecute = useCallback(() => {
    if (!isComplete || !compiledCommand) return

    onExecute(compiledCommand)
    onClose()
  }, [isComplete, compiledCommand, onExecute, onClose])

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(prev => (prev + 1) % Math.max(1, suggestions.length))
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(prev => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length))
    }

    if (event.key === 'Tab' && suggestions.length > 0) {
      event.preventDefault()
      handleSelectSuggestion(suggestions[activeIndex])
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      // If we have suggestions and one is active, apply it
      if (suggestions.length > 0 && !isComplete) {
        handleSelectSuggestion(suggestions[activeIndex])
      }
      // Otherwise, execute the command if complete
      else if (isComplete) {
        handleExecute()
      }
    }
  }, [suggestions, activeIndex, isComplete, onClose, handleSelectSuggestion, handleExecute])

  if (!open) return null

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[9999] flex bg-black/40 backdrop-blur-sm',
        isMobile ? 'items-end pb-safe-bottom' : 'items-start justify-center pt-16'
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          'bg-cream text-dune shadow-2xl border border-sage/15 flex flex-col',
          isMobile
            ? 'w-full rounded-t-[28px] max-h-[80vh]'
            : 'w-full max-w-2xl rounded-[32px] max-h-[80vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-sage/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-sage/70">
              <Sparkles className="w-3.5 h-3.5" />
              Natural Language Commands
            </div>
            <div className="flex items-center gap-1 text-xs text-sage/80 border border-sage/30 rounded-full px-2 py-1">
              esc
            </div>
          </div>

          {/* Tokenized Input */}
          <TokenizedInput
            value={input}
            onChange={handleInputChange}
            tokens={tokens}
            placeholder="Try: select untagged and tag as bridal"
            onKeyDown={handleKeyDown}
            error={error}
            autoFocus={!isMobile}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1 py-3">
          {/* Command Preview */}
          {compiledCommand && (
            <div className={clsx(
              'mx-4 mb-3 p-4 rounded-2xl border',
              isComplete
                ? 'bg-dusty-rose/10 border-dusty-rose/30'
                : 'bg-sage/5 border-sage/20'
            )}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-dusty-rose" />
                  ) : (
                    <Info className="w-5 h-5 text-sage/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-dune mb-1">
                    {compiledCommand.description}
                  </div>
                  <div className="text-xs text-sage/70">
                    {compiledCommand.preview}
                  </div>
                  {isComplete && (
                    <button
                      onClick={handleExecute}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-dusty-rose text-cream rounded-full text-sm font-semibold hover:bg-dusty-rose/90 transition-colors"
                    >
                      Execute Command
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !compiledCommand && (
            <div className="mx-4 mb-3 p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-red-900 mb-1">
                    Invalid Command
                  </div>
                  <div className="text-xs text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-4 pb-4">
              <div className="rounded-3xl border border-sage/20 bg-white/85 shadow-sm p-4">
                <div className="text-xs font-semibold text-sage/70 uppercase tracking-wider mb-3">
                  Suggestions
                </div>
                <div ref={suggestionsRef} className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={clsx(
                        'w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition shadow-sm',
                        index === activeIndex
                          ? 'border-dusty-rose/60 bg-dusty-rose/10 shadow'
                          : 'border-sage/15 bg-white/90 hover:border-dusty-rose/40'
                      )}
                    >
                      {/* Color indicator */}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: suggestion.color || '#A19781' }}
                      />

                      {/* Avatar for team members */}
                      {suggestion.metadata?.avatarUrl && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-cream/60 flex-shrink-0">
                          <img
                            src={suggestion.metadata.avatarUrl}
                            alt={suggestion.displayText}
                            className="w-full h-full object-cover"
                            style={{
                              objectPosition: 'center 25%',
                              transform: 'scale(2)'
                            }}
                          />
                        </div>
                      )}

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-dune">
                          {suggestion.displayText}
                        </div>
                        <div className="text-xs text-sage/70 mt-0.5">
                          {suggestion.description}
                        </div>
                      </div>

                      {/* Type badge */}
                      <div className="flex-shrink-0 text-[10px] uppercase tracking-widest text-sage/60 bg-sage/10 rounded-full px-2 py-0.5">
                        {suggestion.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Help text when empty */}
          {input.length === 0 && (
            <div className="px-4 pb-4">
              <div className="rounded-3xl border border-sage/20 bg-white/85 shadow-sm p-6">
                <div className="text-sm font-semibold text-dune mb-3">
                  Try these commands:
                </div>
                <div className="space-y-2 text-sm text-sage/80">
                  <div className="flex items-start gap-2">
                    <span className="text-dusty-rose font-bold">•</span>
                    <div>
                      <span className="font-mono text-dune">select all</span>
                      <span className="text-sage/60"> - Select all visible assets</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-dusty-rose font-bold">•</span>
                    <div>
                      <span className="font-mono text-dune">select untagged</span>
                      <span className="text-sage/60"> - Select untagged assets</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-dusty-rose font-bold">•</span>
                    <div>
                      <span className="font-mono text-dune">filter by bridal</span>
                      <span className="text-sage/60"> - Filter by tag</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-dusty-rose font-bold">•</span>
                    <div>
                      <span className="font-mono text-dune">tag as editorial</span>
                      <span className="text-sage/60"> - Tag selected assets</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-dusty-rose font-bold">•</span>
                    <div>
                      <span className="font-mono text-dune">group by mood</span>
                      <span className="text-sage/60"> - Group assets by category</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-dusty-rose font-bold">•</span>
                    <div>
                      <span className="font-mono text-dune">select untagged and tag as bridal</span>
                      <span className="text-sage/60"> - Chain multiple actions</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-sage/10">
                  <div className="text-xs text-sage/60">
                    <div className="font-semibold mb-1">Keyboard shortcuts:</div>
                    <div className="space-y-1">
                      <div><span className="font-mono">Tab</span> - Accept suggestion</div>
                      <div><span className="font-mono">↑ ↓</span> - Navigate suggestions</div>
                      <div><span className="font-mono">Enter</span> - Execute command</div>
                      <div><span className="font-mono">Esc</span> - Close</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No suggestions */}
          {input.length > 0 && suggestions.length === 0 && !error && !compiledCommand && (
            <div className="px-6 py-8 text-center text-sm text-sage/70">
              <Info className="w-8 h-8 text-sage/50 mx-auto mb-2" />
              Keep typing to see suggestions...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
