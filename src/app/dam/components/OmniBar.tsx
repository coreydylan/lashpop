"use client"

import type { ReactNode } from "react"
import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
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
  gridViewMode: "square" | "aspect" | "masonry"
  onToggleGridView: () => void
  showGridToggle?: boolean
  counterSlot?: ReactNode
  onOpenCardSettings?: () => void
  escConfirmationActive?: boolean
  onEscClick?: () => void
  // Mobile-specific props
  collectionSelector?: ReactNode
  onOpenCommandPalette?: () => void
  // Collection info for mobile indicator
  activeCollectionName?: string
  activeCollectionColor?: string
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
  onEscClick,
  collectionSelector,
  onOpenCommandPalette,
  activeCollectionName,
  activeCollectionColor
}: OmniBarProps) {
  const isOverlay = mode === "overlay"

  const containerClass = clsx(
    "transition-colors overflow-visible",
    "lg:arch-full",  // Rounded corners only on desktop
    isOverlay
      ? "bg-black/25 backdrop-blur-md lg:bg-black/15 lg:backdrop-blur-sm"
      : selectedCount > 0
      ? "lg:bg-dusty-rose/30"  // Only apply background on desktop when selected
      : "lg:bg-warm-sand/30"  // Subtle background only on desktop
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
  const mobileChipsContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)
  const scrollIntervalRef = useRef<number | null>(null)
  
  // Smooth scrolling refs
  const scrollTarget = useRef<number | null>(null)
  const scrollAnimationFrame = useRef<number | null>(null)

  // Check scroll position to show/hide scroll indicators
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    // Use a small tolerance (1px) for float arithmetic
    const shouldShowLeft = scrollLeft > 1
    const shouldShowRight = scrollLeft < scrollWidth - clientWidth - 1
    
    if (shouldShowLeft !== showLeftScroll) setShowLeftScroll(shouldShowLeft)
    if (shouldShowRight !== showRightScroll) setShowRightScroll(shouldShowRight)
  }

  // Handle mouse wheel for horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    const container = scrollContainerRef.current
    if (!container) return

    // If we're already at the edge, let the parent handle the scroll (vertical page scroll)
    const { scrollLeft, scrollWidth, clientWidth } = container
    const isAtLeft = scrollLeft <= 0
    const isAtRight = scrollLeft >= scrollWidth - clientWidth - 1

    // If deltaX is dominant, it's a horizontal scroll (trackpad/horizontal mouse) - let it happen naturally
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Cancel any ongoing smooth scroll if user switches to trackpad/native
      scrollTarget.current = null
      if (scrollAnimationFrame.current) {
        cancelAnimationFrame(scrollAnimationFrame.current)
        scrollAnimationFrame.current = null
      }
      return
    }

    // If deltaY is dominant, convert to horizontal scroll
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      // Check if we can scroll in the requested direction
      if ((e.deltaY < 0 && isAtLeft) || (e.deltaY > 0 && isAtRight)) return

      e.preventDefault()

      // Smooth scroll logic
      const currentScroll = container.scrollLeft
      // Use existing target if we're already animating, otherwise current scroll
      const startPoint = scrollTarget.current !== null ? scrollTarget.current : currentScroll
      
      // Adjust sensitivity factor (0.7 feels good)
      const delta = e.deltaY * 0.7
      
      // Update target (clamped)
      scrollTarget.current = Math.max(0, Math.min(scrollWidth - clientWidth, startPoint + delta))

      // Start animation loop if not running
      if (!scrollAnimationFrame.current) {
        const animateScroll = () => {
          if (!container || scrollTarget.current === null) {
            scrollAnimationFrame.current = null
            return
          }

          const current = container.scrollLeft
          const target = scrollTarget.current
          const diff = target - current

          // Snap when close enough
          if (Math.abs(diff) < 1) {
            container.scrollLeft = target
            scrollTarget.current = null
            scrollAnimationFrame.current = null
            return
          }

          // Lerp for smoothness (0.15 is a good balance between smooth and responsive)
          container.scrollLeft = current + diff * 0.15
          scrollAnimationFrame.current = requestAnimationFrame(animateScroll)
        }
        scrollAnimationFrame.current = requestAnimationFrame(animateScroll)
      }
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Use ResizeObserver to detect content/container size changes robustly
    const resizeObserver = new ResizeObserver(() => {
      checkScroll()
    })
    
    resizeObserver.observe(container)
    resizeObserver.observe(container.firstElementChild as Element || container) // Observe content wrapper too
    
    // Listen for scroll events
    container.addEventListener('scroll', checkScroll)
    
    // Initial check
    checkScroll()
    
    // Also check periodically to handle image loads or animations
    const interval = setInterval(checkScroll, 500)

    return () => {
      resizeObserver.disconnect()
      container.removeEventListener('scroll', checkScroll)
      clearInterval(interval)
      stopAutoScroll() // Ensure scrolling stops on unmount
    }
  }, [showLeftScroll, showRightScroll]) // Re-bind if state changes (though logic inside doesn't depend on closure state much)

  // Handle mobile chips scroll to close dropdowns
  useEffect(() => {
    const mobileContainer = mobileChipsContainerRef.current
    if (!mobileContainer) return

    const handleMobileScroll = () => {
      // Dispatch custom event to close all chip dropdowns
      window.dispatchEvent(new CustomEvent('omnibar-scroll'))
    }

    mobileContainer.addEventListener('scroll', handleMobileScroll)
    return () => {
      mobileContainer.removeEventListener('scroll', handleMobileScroll)
    }
  }, [])

  // Cleanup smooth scroll animation on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationFrame.current) {
        cancelAnimationFrame(scrollAnimationFrame.current)
      }
    }
  }, [])

  const startAutoScroll = (direction: 'left' | 'right') => {
    // Cancel any smooth scrolling from mouse wheel
    if (scrollAnimationFrame.current) {
      cancelAnimationFrame(scrollAnimationFrame.current)
      scrollAnimationFrame.current = null
      scrollTarget.current = null
    }

    // Clear any existing scroll interval first to allow direction change
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }

    const scroll = () => {
      const container = scrollContainerRef.current
      if (!container) {
        console.log('OmniBar: No container ref')
        return
      }

      // Check bounds to stop auto-scrolling if we hit the edge
      const { scrollLeft, scrollWidth, clientWidth } = container
      if (direction === 'left' && scrollLeft <= 0) {
        stopAutoScroll()
        return
      }
      if (direction === 'right' && scrollLeft >= scrollWidth - clientWidth - 1) {
        stopAutoScroll()
        return
      }

      const scrollAmount = direction === 'left' ? -8 : 8
      container.scrollLeft += scrollAmount
    }

    // Start scrolling immediately
    scroll()

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
      <div className="hidden lg:flex gap-4 px-4 py-3 items-center" style={{ minHeight: '52px' }}>
        {/* Left side buttons - always horizontal */}
        {(groupByButton || filterButton) && (
          <div className="flex gap-2 flex-shrink-0 items-center">
            {groupByButton}
            {filterButton}
          </div>
        )}

        {/* Horizontal scroll container for chips */}
        <div className="flex-1 min-w-0 relative flex items-center">
          {/* Scroll trigger zones - High z-index to overlay chips */}
          {showLeftScroll && (
            <div
              className="absolute left-0 top-0 bottom-0 w-16 z-[60] cursor-w-resize"
              style={{ background: 'rgba(0,0,0,0)', touchAction: 'none' }}
              onMouseEnter={() => startAutoScroll('left')}
              onMouseLeave={stopAutoScroll}
            />
          )}
          {showRightScroll && (
            <div
              className="absolute right-0 top-0 bottom-0 w-16 z-[60] cursor-e-resize"
              style={{ background: 'rgba(0,0,0,0)', touchAction: 'none' }}
              onMouseEnter={() => startAutoScroll('right')}
              onMouseLeave={stopAutoScroll}
            />
          )}

          {/* Scrollable content - always single horizontal row */}
          <div
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="overflow-x-auto overflow-y-hidden scrollbar-hidden w-full max-w-full flex items-center h-full"
            style={{
              scrollBehavior: 'auto'
            }}
          >
            <div className="flex items-center gap-2 min-w-max">
              {groupByContent}
              {chipsContent}
              {isOverlay && tagSelectorContent}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 ml-auto pl-4 flex items-center gap-3">
          {selectedCount > 0 ? (
            <>
              <div className="flex items-center gap-2">
                {!escConfirmationActive && (
                  <span className={clsx("body whitespace-nowrap font-semibold", textPrimary)}>
                    {selectedCount} selected
                  </span>
                )}
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

      {/* Mobile layout - show asset count and active chips */}
      <div className="block lg:hidden">
        {/* Asset count / selection count row */}
        <div className={clsx(
          "flex items-center justify-between py-1.5",
          isOverlay ? "px-0" : "px-3"
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className={clsx("text-xs font-bold", textPrimary)}>
                  {selectedCount} selected
                </span>
                {!escConfirmationActive && (
                  <button
                    onClick={onEscClick || onClearSelection}
                    className={clsx(
                      "flex items-center justify-center rounded-full transition-colors",
                      hoverClass,
                      "w-5 h-5"
                    )}
                    aria-label="Clear selection"
                  >
                    <X className={clsx("w-3.5 h-3.5", textPrimary)} />
                  </button>
                )}
                {escConfirmationActive && (
                  <button
                    onClick={onEscClick}
                    className={clsx(
                      "flex items-center px-2 py-0.5 rounded-full transition-all font-medium text-[10px]",
                      isOverlay
                        ? "bg-dusty-rose text-cream hover:bg-dusty-rose/90"
                        : "bg-dusty-rose text-cream hover:bg-dusty-rose/80"
                    )}
                    aria-label="Confirm deselect"
                  >
                    <span>Unselect {selectedCount} items?</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <span className={clsx("text-xs font-medium", textMuted)}>
                  {assetsCount} {assetLabel}
                </span>
                {/* Collection indicator on mobile */}
                {activeCollectionName && (
                  <>
                    <span className={clsx("text-xs", textMuted)}>·</span>
                    <button
                      onClick={onOpenCommandPalette}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all"
                      style={{
                        backgroundColor: activeCollectionColor ? `${activeCollectionColor}20` : undefined,
                        color: activeCollectionColor || '#A19781',
                        border: `1px solid ${activeCollectionColor ? `${activeCollectionColor}40` : '#A1978140'}`
                      }}
                    >
                      <span className="truncate max-w-[120px]">{activeCollectionName}</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          {counterSlot && (
            <span className="text-[9px] font-bold text-sage flex-shrink-0">
              {counterSlot}
            </span>
          )}
        </div>

        {/* Active filter/group chips - always show when there are chips */}
        {(hasGroupBy || hasChips) && (
          <div
            ref={mobileChipsContainerRef}
            className={clsx(
              "pb-2 pt-0.5 overflow-x-auto scrollbar-hidden",
              isOverlay ? "px-0" : "px-3"
            )}
          >
            <div className="flex items-center gap-1.5 min-w-max">
              {groupByContent}
              {chipsContent}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
