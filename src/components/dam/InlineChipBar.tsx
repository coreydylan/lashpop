"use client"

import { useRef, useEffect } from "react"
import type { ReactNode } from "react"
import { Plus, Grid3x3 } from "lucide-react"
import clsx from "clsx"

interface InlineChipBarProps {
  groupByContent?: ReactNode
  chipsContent?: ReactNode
  scrollToView?: boolean
  filterSelector?: ReactNode  // FilterSelector component
  groupBySelector?: ReactNode  // GroupBySelector component
}

export function InlineChipBar({
  groupByContent,
  chipsContent,
  scrollToView = false,
  filterSelector,
  groupBySelector
}: InlineChipBarProps) {
  const chipBarRef = useRef<HTMLDivElement>(null)

  const hasGroupBy = Boolean(groupByContent)
  const hasChips = Boolean(chipsContent)

  // Scroll into view when requested
  useEffect(() => {
    if (scrollToView && chipBarRef.current) {
      chipBarRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [scrollToView])

  if (!hasGroupBy && !hasChips && !filterSelector && !groupBySelector) return null

  return (
    <div
      ref={chipBarRef}
      className="lg:hidden w-full transition-all duration-500 ease-out"
    >
      {/* Chips Row */}
      <div className="py-3 border-b border-sage/10">
        <div className="px-6 overflow-x-auto scrollbar-hidden">
          <div className="flex items-center gap-1.5 min-w-max">
            {/* FilterSelector and GroupBySelector render their own buttons */}
            {filterSelector}
            {groupBySelector}

            {/* Existing chips */}
            {groupByContent}
            {chipsContent}
          </div>
        </div>
      </div>
    </div>
  )
}

// Floating toggle button component
interface ChipBarToggleButtonProps {
  isActive: boolean
  onActivate: () => void
  hasContent: boolean
}

export function ChipBarToggleButton({
  isActive,
  onActivate,
  hasContent
}: ChipBarToggleButtonProps) {
  if (!hasContent) return null

  return (
    <button
      onClick={onActivate}
      className={clsx(
        "fixed bottom-1/2 translate-y-[calc(50%+72px)] right-6 z-40 w-14 h-14 shadow-2xl transition-all duration-300 lg:hidden",
        "flex items-center justify-center",
        "bg-gradient-to-br from-sage to-sage/90",
        "border border-cream/20",
        "hover:scale-110 active:scale-95"
      )}
      style={{
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(188, 201, 194, 0.4)',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="Show filters"
    >
      <svg
        className={clsx("w-5 h-5 text-cream transition-transform duration-300", isActive && "rotate-180")}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
