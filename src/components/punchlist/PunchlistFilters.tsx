'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { PunchlistStatus } from '@/db/schema/punchlist'

type FilterOption = PunchlistStatus | 'all'

interface PunchlistFiltersProps {
  currentFilter: FilterOption
  onFilterChange: (filter: FilterOption) => void
  counts: {
    all: number
    open: number
    in_progress: number
    needs_review: number
    complete: number
    closed: number
  }
}

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'needs_review', label: 'Review' },
  { value: 'complete', label: 'Complete' },
  { value: 'closed', label: 'Closed' }
]

export function PunchlistFilters({
  currentFilter,
  onFilterChange,
  counts
}: PunchlistFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map(option => {
        const count = counts[option.value === 'all' ? 'all' : option.value]
        const isActive = currentFilter === option.value

        return (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              'relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              'flex items-center gap-2',
              isActive
                ? 'text-gray-800'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-white rounded-full shadow-sm border border-gray-200"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
            <span
              className={cn(
                'relative z-10 text-xs px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-gray-100' : 'bg-gray-50'
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
