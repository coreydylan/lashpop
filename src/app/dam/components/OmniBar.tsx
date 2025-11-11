"use client"

import type { ReactNode } from "react"
import clsx from "clsx"
import { X, Grid3x3, LayoutGrid } from "lucide-react"

export interface OmniBarProps {
  mode: "page" | "overlay"
  chipsContent?: ReactNode
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
}

export function OmniBar({
  mode,
  chipsContent,
  selectedCount,
  assetsCount,
  totalAssetsCount,
  canApplyTags,
  onClearSelection,
  onApplyTags,
  gridViewMode,
  onToggleGridView,
  showGridToggle = true,
  counterSlot
}: OmniBarProps) {
  const isOverlay = mode === "overlay"

  const containerClass = clsx(
    "arch-full overflow-hidden transition-colors",
    isOverlay
      ? "bg-black/15 backdrop-blur-sm"
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
    <div className={containerClass}>
      {/* Desktop layout */}
      <div className="hidden lg:flex items-center gap-4 px-6 py-5">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {chipsContent ?? null}
          </div>
        </div>

        <div className="flex-shrink-0 pl-4 flex items-center gap-3">
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
                  className={clsx("p-2 rounded-full transition-colors", hoverClass)}
                  title={gridViewMode === "square" ? "Switch to aspect ratio view" : "Switch to square grid view"}
                >
                  {gridViewMode === "square" ? (
                    <LayoutGrid className={clsx("w-4 h-4", iconColor)} />
                  ) : (
                    <Grid3x3 className={clsx("w-4 h-4", iconColor)} />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="block lg:hidden px-3 py-3 space-y-2">
        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <span className={clsx("text-sm font-semibold", textPrimary)}>
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
                className={clsx("px-3 py-1 rounded-full text-xs font-semibold transition-colors", applyButtonClass)}
              >
                Apply
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={textMuted}>
                {assetsCount} {assetLabel}
              </span>
              {counterSlot && (
                <span className="text-xs font-semibold text-cream bg-dune/40 rounded-full px-3 py-0.5">
                  {counterSlot}
                </span>
              )}
            </div>
            {showGridToggle && (
              <button
                onClick={onToggleGridView}
                className={clsx("p-2 rounded-full transition-colors", hoverClass)}
                aria-label="Toggle grid view"
              >
                {gridViewMode === "square" ? (
                  <LayoutGrid className={clsx("w-4 h-4", iconColor)} />
                ) : (
                  <Grid3x3 className={clsx("w-4 h-4", iconColor)} />
                )}
              </button>
            )}
          </div>
        )}

        <div className="space-y-2 overflow-visible">
          <div className="scrollbar-hidden overflow-x-auto -mx-3 px-3 py-1">
            <div className="flex items-center gap-2 min-w-max">
              {chipsContent ?? null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
