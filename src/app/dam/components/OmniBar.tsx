"use client"

import type { ReactNode } from "react"
import clsx from "clsx"
import { X, Grid3x3, LayoutGrid, CreditCard } from "lucide-react"

export interface OmniBarProps {
  mode: "page" | "overlay"
  chipsContent?: ReactNode
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
}

export function OmniBar({
  mode,
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
  onOpenCardSettings
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

  return (
    <div className={containerClass} data-omni-bar>
      {/* Desktop layout */}
      <div className="hidden lg:flex items-start gap-4 px-6 py-5">
        <div className="flex-1 min-w-0">
          <div className={isOverlay && tagSelectorContent ? "space-y-3" : ""}>
            <div className="flex flex-wrap items-start gap-2">
              {chipsContent ?? null}
            </div>
            {isOverlay && tagSelectorContent && (
              <div className="flex items-center gap-2">
                {tagSelectorContent}
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
                <button
                  onClick={onClearSelection}
                  className={clsx("p-1 rounded-full transition-colors", hoverClass)}
                  aria-label="Clear selection"
                >
                  <X className={clsx("w-4 h-4", textPrimary)} />
                </button>
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

      {/* Mobile layout */}
      <div className={clsx("block lg:hidden py-2 space-y-3", isOverlay ? "px-0" : "px-3")}>
        {/* Header row */}
        <div className={clsx("flex items-center justify-between", isOverlay ? "px-3" : "")}>
          {selectedCount > 0 ? (
            <>
              <div className="flex items-center gap-3">
                <span className={clsx("text-base font-bold", textPrimary)}>
                  {selectedCount} selected
                </span>
                <button
                  onClick={onClearSelection}
                  className={clsx("p-1.5 rounded-full transition-colors", hoverClass)}
                  aria-label="Clear selection"
                >
                  <X className={clsx("w-4 h-4", textPrimary)} />
                </button>
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

        {/* Chips/Filters area - always scroll in overlay mode, wrap in normal mode */}
        {chipsContent && (
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
