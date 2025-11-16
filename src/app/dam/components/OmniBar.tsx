"use client"

import type { ReactNode } from "react"
import clsx from "clsx"
import { X, Grid3x3, LayoutGrid, CreditCard } from "lucide-react"
import ThumbnailSizeSlider from "./ThumbnailSizeSlider"

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
  thumbnailSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  onThumbnailSizeChange?: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => void
  showGridToggle?: boolean
  showThumbnailSlider?: boolean
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
  thumbnailSize = 'md',
  onThumbnailSizeChange,
  showGridToggle = true,
  showThumbnailSlider = true,
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

        <div className={clsx(
          "flex-1 min-w-0 flex",
          bothActive ? "items-start" : "items-center"  // Vertically center if only one row active
        )}>
          {/* Two-row layout when both group-by and chips are active, single row otherwise */}
          <div className={clsx(
            "w-full",
            bothActive && "space-y-2"
          )}>
            {/* Group By row (top) */}
            {hasGroupBy && (
              <div className="flex flex-wrap items-center gap-2">
                {groupByContent}
              </div>
            )}

            {/* Filter/Tag chips row (bottom) */}
            {hasChips && (
              <div className={clsx(
                "flex flex-wrap gap-2",
                isOverlay && tagSelectorContent ? "items-start" : "items-center"
              )}>
                <div className="flex flex-wrap items-center gap-2">
                  {chipsContent}
                </div>
                {isOverlay && tagSelectorContent && (
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
              {showThumbnailSlider && onThumbnailSizeChange && (
                <div className="flex items-center border-l border-sage/20 pl-3">
                  <ThumbnailSizeSlider
                    value={thumbnailSize}
                    onChange={onThumbnailSizeChange}
                  />
                </div>
              )}
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

      {/* Mobile layout */}
      <div className={clsx("block lg:hidden py-2 space-y-3", isOverlay ? "px-0" : "px-3")}>
        {/* Header row */}
        <div className={clsx("flex items-center justify-between", isOverlay ? "px-3" : "")}>
          {selectedCount > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <span className={clsx("text-base font-bold", textPrimary)}>
                  {selectedCount} selected
                </span>
                {escConfirmationActive ? (
                  <button
                    onClick={onEscClick}
                    className={clsx(
                      "flex items-center gap-1 px-2 py-1 rounded-full transition-all font-medium text-xs",
                      isOverlay
                        ? "bg-dusty-rose text-cream hover:bg-dusty-rose/90"
                        : "bg-dusty-rose text-cream hover:bg-dusty-rose/80"
                    )}
                    aria-label="Press ESC again to deselect"
                  >
                    <span className="inline-flex items-center border border-current/40 rounded px-1 py-0.5 text-[9px] font-semibold">
                      ESC
                    </span>
                    <span className="text-[11px]">again</span>
                  </button>
                ) : (
                  <button
                    onClick={onEscClick || onClearSelection}
                    className={clsx(
                      "flex items-center gap-1 px-1.5 py-1 rounded-full transition-colors",
                      hoverClass
                    )}
                    aria-label="Clear selection (ESC)"
                  >
                    <span className={clsx("inline-flex items-center border border-current/40 rounded px-1 py-0.5 text-[9px] font-semibold", textPrimary)}>
                      ESC
                    </span>
                    <X className={clsx("w-3.5 h-3.5", textPrimary)} />
                  </button>
                )}
              </div>
              {canApplyTags && (
                <button
                  onClick={onApplyTags}
                  className={clsx("px-4 py-1.5 rounded-full text-sm font-semibold transition-colors", applyButtonClass)}
                >
                  Apply
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className={clsx("text-base", textMuted)}>
                  {assetsCount} {assetLabel}
                </span>
                {counterSlot && (
                  <span className="text-xs font-bold text-cream bg-dune/30 rounded-full px-2.5 py-0.5">
                    {counterSlot}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showGridToggle && (
                  <button
                    onClick={onToggleGridView}
                    className={clsx("p-2 rounded-full transition-colors flex items-center justify-center", hoverClass)}
                    aria-label="Toggle grid view"
                  >
                    {gridViewMode === "square" ? (
                      <LayoutGrid className={clsx("w-5 h-5", iconColor)} />
                    ) : (
                      <Grid3x3 className={clsx("w-5 h-5", iconColor)} />
                    )}
                  </button>
                )}
                {onOpenCardSettings && (
                  <button
                    onClick={onOpenCardSettings}
                    className={clsx("p-2 rounded-full transition-colors flex items-center justify-center", hoverClass)}
                    aria-label="Customize card display"
                  >
                    <CreditCard className={clsx("w-5 h-5", iconColor)} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail size slider row (mobile) - only when no selection */}
        {selectedCount === 0 && showThumbnailSlider && onThumbnailSizeChange && (
          <div className={clsx("flex justify-center", isOverlay ? "px-3" : "")}>
            <ThumbnailSizeSlider
              value={thumbnailSize}
              onChange={onThumbnailSizeChange}
            />
          </div>
        )}

        {/* Group By row (mobile) */}
        {hasGroupBy && (
          <div className="relative w-full overflow-hidden">
            <div className={clsx("overflow-x-auto scrollbar-hidden", isOverlay ? "px-3" : "-mx-3 px-3")}>
              <div className="flex flex-nowrap items-center gap-2 min-w-max pb-1">
                {groupByContent}
              </div>
            </div>
          </div>
        )}

        {/* Chips/Filters area - always scroll in overlay mode, wrap in normal mode */}
        {hasChips && (
          <div className="relative w-full overflow-hidden">
            {/* In overlay (lightbox), always use horizontal scroll. In normal mode, wrap if many selected */}
            {isOverlay || selectedCount <= 3 ? (
              <div
                className={clsx(
                  "overflow-x-auto scrollbar-hidden",
                  isOverlay ? "mx-0 px-3" : "-mx-3 px-3"
                )}
                style={isOverlay ? {
                  WebkitOverflowScrolling: 'touch',
                  overflowX: 'auto',
                  overflowY: 'hidden'
                } : undefined}
              >
                <div className="flex flex-nowrap items-center gap-2 min-w-max pb-1">
                  {chipsContent}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {chipsContent}
              </div>
            )}
          </div>
        )}

        {/* Separate tag selector row for lightbox mode */}
        {isOverlay && tagSelectorContent && (
          <div className="relative w-full overflow-hidden">
            <div
              className="overflow-x-auto scrollbar-hidden px-3"
              style={{
                WebkitOverflowScrolling: 'touch',
                overflowX: 'auto',
                overflowY: 'hidden'
              }}
            >
              <div className="min-w-max pb-1">
                {tagSelectorContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
