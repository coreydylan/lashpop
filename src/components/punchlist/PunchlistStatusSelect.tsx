'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'
import type { PunchlistStatus } from '@/db/schema/punchlist'

interface PunchlistStatusSelectProps {
  currentStatus: PunchlistStatus
  onStatusChange: (status: PunchlistStatus) => void
  disabled?: boolean
}

const statusOptions: { value: PunchlistStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'bg-sage' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-golden' },
  { value: 'needs_review', label: 'Needs Review', color: 'bg-dusty-rose' },
  { value: 'complete', label: 'Complete', color: 'bg-ocean-mist' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-400' }
]

export function PunchlistStatusSelect({
  currentStatus,
  onStatusChange,
  disabled
}: PunchlistStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentOption = statusOptions.find(o => o.value === currentStatus)!

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (status: PunchlistStatus) => {
    if (status !== currentStatus) {
      onStatusChange(status)
    }
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
          'bg-white border-gray-200 hover:border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn('w-2 h-2 rounded-full', currentOption.color)} />
        <span>{currentOption.label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[160px]"
          >
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                  option.value === currentStatus && 'bg-gray-50'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', option.color)} />
                <span className="flex-1 text-left">{option.label}</span>
                {option.value === currentStatus && (
                  <Check className="w-4 h-4 text-sage" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
