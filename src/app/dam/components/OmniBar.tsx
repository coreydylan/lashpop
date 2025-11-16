"use client"

import type { ReactNode } from "react"
import { useRef, useEffect, useState } from "react"
import clsx from "clsx"
import { X, Grid3x3, LayoutGrid, CreditCard } from "lucide-react"

export interface OmniBarProps {
  mode: "page" | "overlay"
  groupByButton?: ReactNode   // Group By button (left side)
  filterButton?: ReactNode    // Filter button (left side)
  groupByContent?: ReactNode  // Group By chips (top row)
  chipsContent?: ReactNode    // Filter/Tag chips (second row)
  tagSelectorContent?: ReactNode  // Separate content for tag selector
  selectedCount: number
  assetsCount: number
  totalAssetsCount: number
  canApplyTags: boolean
  onClearSelection: () => void
  onApplyTags: () => void
  gridViewMode: "square" | "aspect"
  onToggleGridView: () => void
  showGridToggle?: boolean
  counterSlot?: ReactNode
  onOpenCardSettings?: () => void
  escConfirmationActive?: boolean
  onEscClick?: () => void
}

export function OmniBar({
  mode,
  groupByButton,
  filterButton,
  groupByContent,
  chipsContent,
  tagSelectorContent,
  selectedCount,
  assetsCount,
  totalAssetsCount,
  canApplyTags,
  onClearSelection,
  onApplyTags,
  gridViewMode,
  onToggleGridView,
  showGridToggle = true,
  counterSlot,
  onOpenCardSettings,
  escConfirmationActive = false,
  onEscClick
}: OmniBarProps) {
  const isOverlay = mode === "overlay"

  const containerClass = clsx(
    "arch-full transition-colors overflow-visible",
    isOverlay
      ? "bg-black/25 backdrop-blur-md lg:bg-black/15 lg:backdrop-blur-sm"
      : selectedCount > 0
      ? "bg-dusty-rose/30"
      : "bg-warm-sand/30"
  )

  const textPrimary = isOverlay ? "text-cream" : "text-dune"
  const textMuted = isOverlay ? "text-cream/80" : "text-sage"
  const hoverClass = isOverlay ? "hover:bg-white/10" : "hover:bg-dune/10"
  const borderClass = isOverlay ? "border-white/10" : "border-sage/10"
  const iconColor = isOverlay ? "text-cream" : "text-sage"
  const applyButtonClass = isOverlay
    ? "bg-dusty-rose text-cream shadow-xl hover:bg-dusty-rose/90"
    : "bg-dusty-rose text-cream shadow-lg hover:bg-dusty-rose/80"

  const assetLabel = `asset${assetsCount !== 1 ? "s" : ""}`
  const showTotals = totalAssetsCount > assetsCount

  const hasGroupBy = Boolean(groupByContent)
  const hasChips = Boolean(chipsContent)
  const bothActive = hasGroupBy && hasChips

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)
  const scrollIntervalRef = useRef<number | null>(null)

  // Check scroll position to show/hide scroll indicators
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setShowLeftScroll(scrollLeft > 0)
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScroll()
    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [hasGroupBy, hasChips])

  const startAutoScroll = (direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) return

    const scroll = () => {
      const container = scrollContainerRef.current
      if (!container) return

      const scrollAmount = direction === 'left' ? -8 : 8
      container.scrollLeft += scrollAmount
    }

    scrollIntervalRef.current = window.setInterval(scroll, 16)
  }

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }

  return (
    <div className={containerClass} data-omni-bar>
      {/* Desktop layout */}
      <div className="hidden lg:flex gap-4 px-6 py-5" style={{ minHeight: '60px' }}>
        {/* Left side buttons */}
        {(groupByButton || filterButton) && (
          <div className={clsx(
            "flex gap-2 flex-shrink-0",
            bothActive ? "flex-col justify-start" : "flex-row items-center justify-center"
          )}>
            {groupByButton}
            {filterButton}
          </div>
        )}

        {/* Horizontal scroll container */}
        <div className={clsx(
          "flex-1 min-w-0 relative",
          !bothActive && "flex items-center"
        )}>
          {/* Left scroll indicator */}
          {showLeftScroll && (
            <div
              className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-current to-transparent opacity-10 pointer-events-none z-10"
              style={{ color: isOverlay ? '#F5EFE6' : '#C9BBAA' }}
            />
          )}

          {/* Scroll trigger zones */}
          {showLeftScroll && (
            <div
              className="absolute left-0 top-0 bottom-0 w-16 z-20 cursor-w-resize"
              onMouseEnter={() => startAutoScroll('left')}
              onMouseLeave={stopAutoScroll}
            />
          )}
          {showRightScroll && (
            <div
              className="absolute right-0 top-0 bottom-0 w-16 z-20 cursor-e-resize"
              onMouseEnter={() => startAutoScroll('right')}
              onMouseLeave={stopAutoScroll}
            />
          )}

          {/* Right scroll indicator */}
          {showRightScroll && (
            <div
              className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-current to-transparent opacity-10 pointer-events-none z-10"
              style={{ color: isOverlay ? '#F5EFE6' : '#C9BBAA' }}
            />
          )}

          {/* Scrollable content */}
          <div
            ref={scrollContainerRef}
            className={clsx(
              "overflow-x-auto overflow-y-hidden scrollbar-hidden",
              bothActive ? "py-0.5" : "flex items-center h-full"
            )}
            style={{
              scrollBehavior: 'smooth'
            }}
          >
            {bothActive ? (
              // Stack vertically when both group-by and filter are active
              <div className="space-y-2 min-w-max">
                {hasGroupBy && (
                  <div className="flex items-center gap-2">
                    {groupByContent}
                  </div>
                )}
                {hasChips && (
                  <div className="flex items-center gap-2">
                    {chipsContent}
                    {isOverlay && tagSelectorContent && (
                      <div className="flex items-center gap-2">
                        {tagSelectorContent}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Single horizontal row - vertically centered
              <div className="flex items-center gap-2 min-w-max h-full">
                {groupByContent}
                {chipsContent}
                {isOverlay && tagSelectorContent && !hasChips && (
                  <div className="flex items-center gap-2">
                    {tagSelectorContent}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 pl-4 pt-1 flex items-center gap-3">
          {selectedCount > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <span className={clsx("body whitespace-nowrap font-semibold", textPrimary)}>
                  {selectedCount} selected
                </span>
                {escConfirmationActive ? (
                  <button
                    onClick={onEscClick}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full transition-all font-medium text-xs",
                      isOverlay
                        ? "bg-dusty-rose text-cream hover:bg-dusty-rose/90"
                        : "bg-dusty-rose text-cream hover:bg-dusty-rose/80"
                    )}
                    aria-label="Press ESC again to deselect"
                  >
                    <span>Press</span>
                    <span className="inline-flex items-center border border-current/40 rounded px-1.5 py-0.5 text-[10px] font-semibold">
                      ESC
                    </span>
                    <span>again to deselect {selectedCount}</span>
                  </button>
                ) : (
                  <button
                    onClick={onEscClick || onClearSelection}
                    className={clsx(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
                      hoverClass
                    )}
                    aria-label="Clear selection (ESC)"
                  >
                    <span className={clsx("inline-flex items-center border border-current/40 rounded px-1.5 py-0.5 text-[10px] font-semibold", textPrimary)}>
                      ESC
                    </span>
                    <X className={clsx("w-3.5 h-3.5", textPrimary)} />
                  </button>
                )}
              </div>
              {canApplyTags && (
                <button
                  onClick={onApplyTags}
                  className={clsx("px-6 py-2 rounded-full font-semibold transition-colors", applyButtonClass)}
                >
                  Apply
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={clsx("body whitespace-nowrap", textMuted)}>
                  {assetsCount} {assetLabel}
                  {showTotals && <span className="ml-1">({totalAssetsCount} total)</span>}
                </span>
                {counterSlot && (
                  <span className="text-xs font-semibold text-cream bg-dune/40 rounded-full px-3 py-1">
                    {counterSlot}
                  </span>
                )}
              </div>
              {showGridToggle && (
                <button
                  onClick={onToggleGridView}
                  className={clsx("p-2 rounded-full transition-colors flex items-center justify-center", hoverClass)}
                  title={gridViewMode === "square" ? "Switch to aspect ratio view" : "Switch to square grid view"}
                >
                  {gridViewMode === "square" ? (
                    <LayoutGrid className={clsx("w-4 h-4", iconColor)} />
                  ) : (
                    <Grid3x3 className={clsx("w-4 h-4", iconColor)} />
                  )}
                </button>
              )}
              {onOpenCardSettings && (
                <button
                  onClick={onOpenCardSettings}
                  className={clsx("p-2 rounded-full transition-colors flex items-center justify-center", hoverClass)}
                  title="Customize card display"
                >
                  <CreditCard className={clsx("w-4 h-4", iconColor)} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout - optimized mobile-first design */}
      <div className={clsx("block lg:hidden", isOverlay ? "px-0" : "px-3")}>
        {/* Compact header row */}
        <div className={clsx("flex items-center justify-between py-2", isOverlay ? "px-3" : "")}>
          {selectedCount > 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className={clsx("text-sm font-bold", textPrimary)}>
                  {selectedCount}
                </span>
                {escConfirmationActive ? (
                  <button
                    onClick={onEscClick}
                    className={clsx(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full transition-all font-medium text-[10px]",
                      isOverlay
                        ? "bg-dusty-rose text-cream hover:bg-dusty-rose/90"
                        : "bg-dusty-rose text-cream hover:bg-dusty-rose/80"
                    )}
                    aria-label="Press ESC again to deselect"
                  >
                    <span className="inline-flex items-center border border-current/40 rounded px-1 py-0.5 text-[9px] font-semibold">
                      ESC
                    </span>
                    <span>again</span>
                  </button>
                ) : (
                  <button
                    onClick={onEscClick || onClearSelection}
                    className={clsx(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors",
                      hoverClass
                    )}
                    aria-label="Clear selection"
                  >
                    <span className={clsx("inline-flex items-center border border-current/40 rounded px-1 py-0.5 text-[9px] font-semibold", textPrimary)}>
                      ESC
                    </span>
                    <X className={clsx("w-3 h-3", textPrimary)} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {canApplyTags && (
                  <button
                    onClick={onApplyTags}
                    className={clsx("px-3 py-1 rounded-full text-xs font-semibold transition-colors", applyButtonClass)}
                  >
                    Apply
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className={clsx("text-sm font-medium", textMuted)}>
                  {assetsCount} {assetLabel}
                </span>
                {counterSlot && (
                  <span className="text-[10px] font-bold text-cream bg-dune/30 rounded-full px-2 py-0.5">
                    {counterSlot}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {showGridToggle && (
                  <button
                    onClick={onToggleGridView}
                    className={clsx("p-1.5 rounded-full transition-colors flex items-center justify-center", hoverClass)}
                    aria-label="Toggle grid view"
                  >
                    {gridViewMode === "square" ? (
                      <LayoutGrid className={clsx("w-4 h-4", iconColor)} />
                    ) : (
                      <Grid3x3 className={clsx("w-4 h-4", iconColor)} />
                    )}
                  </button>
                )}
                {onOpenCardSettings && (
                  <button
                    onClick={onOpenCardSettings}
                    className={clsx("p-1.5 rounded-full transition-colors flex items-center justify-center", hoverClass)}
                    aria-label="Card settings"
                  >
                    <CreditCard className={clsx("w-4 h-4", iconColor)} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Compact filter controls - only show buttons when not in selection mode */}
        {selectedCount === 0 && (groupByButton || filterButton) && (
          <div className={clsx("flex items-center gap-1.5 pb-2", isOverlay ? "px-3" : "")}>
            {groupByButton}
            {filterButton}
          </div>
        )}

        {/* Single horizontal scroll row */}
        {(hasGroupBy || hasChips) && (
          <div className="relative w-full overflow-hidden pb-2">
            <div
              className={clsx(
                "overflow-x-auto scrollbar-hidden",
                isOverlay ? "px-3" : "-mx-3 px-3"
              )}
              style={{
                WebkitOverflowScrolling: 'touch',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollSnapType: 'x proximity'
              }}
            >
              {bothActive ? (
                // Stack when both active
                <div className="space-y-1.5 pb-0.5">
                  {hasGroupBy && (
                    <div className="flex flex-nowrap items-center gap-1.5 min-w-max">
                      {groupByContent}
                    </div>
                  )}
                  {hasChips && (
                    <div className="flex flex-nowrap items-center gap-1.5 min-w-max">
                      {chipsContent}
                    </div>
                  )}
                </div>
              ) : (
                // Single row otherwise
                <div className="flex flex-nowrap items-center gap-1.5 min-w-max pb-0.5">
                  {groupByContent}
                  {chipsContent}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tag selector for lightbox/selection mode */}
        {isOverlay && tagSelectorContent && (
          <div className={clsx("pb-2", isOverlay ? "px-3" : "")}>
            {tagSelectorContent}
          </div>
        )}
      </div>
    </div>
  )
}
