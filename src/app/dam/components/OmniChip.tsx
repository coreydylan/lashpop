"use client"

import { ReactNode } from "react"
import { X, Sparkles } from "lucide-react"
import clsx from "clsx"

export type ChipVariant =
  | "command-launcher"    // Command palette button
  | "group-by"           // Group by category chip
  | "tag-existing"       // Existing tag on selected assets (with count)
  | "tag-new"            // New tag to be applied (with border)
  | "filter"             // Active filter chip

export interface OmniChipProps {
  variant: ChipVariant

  // Content
  categoryName?: string
  categoryDisplayName?: string
  optionDisplayName?: string
  count?: number

  // Styling
  color?: string
  imageUrl?: string
  imageCrop?: {
    x: number
    y: number
    scale: number
  } | null

  // State
  isSelected?: boolean
  isPending?: boolean | null
  isDisabled?: boolean
  isMobile?: boolean

  // Actions
  onClick?: () => void
  onRemove?: () => void
  onCategoryClick?: () => void

  // Custom content
  children?: ReactNode
}

export function OmniChip({
  variant,
  categoryName,
  categoryDisplayName,
  optionDisplayName,
  count,
  color = "#A19781",
  imageUrl,
  imageCrop,
  isSelected = false,
  isPending = false,
  isDisabled = false,
  isMobile = false,
  onClick,
  onRemove,
  onCategoryClick,
  children
}: OmniChipProps) {

  // Command Launcher variant
  if (variant === "command-launcher") {
    return (
      <button
        onClick={onClick}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all shadow-sm border",
          isSelected
            ? "bg-dune text-cream border-dune/40 hover:bg-dune/90"
            : "bg-cream text-dune border-sage/20 hover:border-dusty-rose/40",
          isMobile ? "text-sm" : "text-sm"
        )}
      >
        <Sparkles className="w-4 h-4 text-dusty-rose" />
        <span>Command Palette</span>
        <span className="hidden sm:inline-flex items-center text-[11px] uppercase tracking-widest border border-current/40 rounded-full px-2 py-0.5">
          /
        </span>
      </button>
    )
  }

  // Group By variant
  if (variant === "group-by") {
    return (
      <div className={clsx(
        "flex items-center gap-1.5 rounded-full transition-all",
        isMobile ? "px-2.5 py-1" : "px-3 py-1.5",
        isSelected ? "bg-sage/30" : "bg-sage/20"
      )}>
        <span className={clsx(
          "font-semibold uppercase",
          isMobile ? "text-[10px]" : "text-xs",
          isSelected ? "text-dune" : "text-sage"
        )}>
          {categoryDisplayName}
        </span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-0.5 hover:bg-sage/20 rounded-full transition-colors"
          >
            <X className={clsx("text-sage", isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} />
          </button>
        )}
      </div>
    )
  }

  // Tag Existing variant (with count)
  if (variant === "tag-existing") {
    return (
      <div
        className={clsx(
          "flex items-center gap-0 rounded-full overflow-hidden shadow-sm transition-all",
          isPending && "candy-cane-effect"
        )}
        style={{
          background: color,
          minHeight: 'auto',
          height: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={clsx(
          "flex items-center",
          isMobile ? "gap-1 px-1.5 py-0.5" : "gap-1 px-2 py-1"
        )}>
          {isPending ? (
            <button
              onClick={onRemove}
              className="flex items-center gap-1 bg-black/20 hover:bg-black/30 transition-all w-full px-1 rounded-full"
            >
              <X className="w-3 h-3 text-cream animate-bounce" />
              <span className={clsx("text-cream font-semibold", isMobile ? "text-[9px]" : "text-[10px]")}>
                Remove from {count} {count === 1 ? 'asset' : 'assets'}?
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={onRemove}
                className="flex items-center gap-0.5 hover:bg-black/10 rounded-full transition-colors px-1 py-0.5"
              >
                <X className="w-2.5 h-2.5 text-cream" />
                <span className="text-[9px] font-bold text-cream">{count}</span>
              </button>

              {imageUrl && (
                <div className={clsx(
                  "rounded-full overflow-hidden border border-cream/30 flex-shrink-0",
                  isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
                )}>
                  <img
                    src={imageUrl}
                    alt={optionDisplayName}
                    className="w-full h-full object-cover"
                    style={
                      imageCrop
                        ? {
                            objectPosition: `${imageCrop.x}% ${imageCrop.y}%`,
                            transform: `scale(${imageCrop.scale})`
                          }
                        : {
                            objectPosition: 'center 25%',
                            transform: 'scale(2)'
                          }
                    }
                  />
                </div>
              )}

              {onCategoryClick ? (
                <button
                  onClick={onCategoryClick}
                  disabled={isDisabled}
                  className={clsx(
                    "font-semibold text-cream uppercase hover:text-white transition-colors",
                    isMobile ? "text-[9px]" : "text-[10px]",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {categoryDisplayName}
                </button>
              ) : (
                <span className={clsx(
                  "font-semibold text-cream uppercase",
                  isMobile ? "text-[9px]" : "text-[10px]"
                )}>
                  {categoryDisplayName}
                </span>
              )}

              <span className={clsx("text-cream/60", isMobile ? "text-[9px]" : "text-[10px]")}>›</span>
              <span className={clsx("text-cream font-medium", isMobile ? "text-[10px]" : "text-[11px]")}>
                {optionDisplayName}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  // Tag New variant (to be applied)
  if (variant === "tag-new") {
    return (
      <div
        className={clsx(
          "flex items-center gap-0 rounded-full overflow-hidden shadow-sm border-2 border-cream/40 transition-all",
          isMobile ? "" : ""
        )}
        style={{
          background: color
        }}
      >
        <div className={clsx(
          "flex items-center",
          isMobile ? "gap-1.5 px-2.5 py-1" : "gap-2 px-3 py-1.5"
        )}>
          {imageUrl && (
            <div className={clsx(
              "rounded-full overflow-hidden border border-cream/30 flex-shrink-0",
              isMobile ? "w-4 h-4" : "w-5 h-5"
            )}>
              <img
                src={imageUrl}
                alt={optionDisplayName}
                className="w-full h-full object-cover"
                style={
                  imageCrop
                    ? {
                        objectPosition: `${imageCrop.x}% ${imageCrop.y}%`,
                        transform: `scale(${imageCrop.scale})`
                      }
                    : {
                        objectPosition: 'center 25%',
                        transform: 'scale(2)'
                      }
                }
              />
            </div>
          )}

          {onCategoryClick ? (
            <button
              onClick={onCategoryClick}
              disabled={isDisabled}
              className={clsx(
                "font-semibold text-cream uppercase tracking-wide hover:text-white transition-colors",
                isMobile ? "text-[10px]" : "text-xs",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {categoryDisplayName}
            </button>
          ) : (
            <span className={clsx(
              "font-semibold text-cream uppercase tracking-wide",
              isMobile ? "text-[10px]" : "text-xs"
            )}>
              {categoryDisplayName}
            </span>
          )}

          <span className={clsx("text-cream/70", isMobile ? "text-[10px]" : "text-xs")}>›</span>
          <span className={clsx("text-cream font-medium", isMobile ? "text-[11px]" : "text-sm")}>
            {optionDisplayName}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className={clsx(
              "hover:bg-black/10 transition-colors",
              isMobile ? "px-1.5 py-1" : "px-2 py-1.5"
            )}
          >
            <X className={clsx("text-cream", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
          </button>
        )}
      </div>
    )
  }

  // Filter variant
  if (variant === "filter") {
    return (
      <div
        className={clsx(
          "flex items-center gap-0 overflow-hidden transition-all rounded-full shadow-sm hover:shadow-md",
          isMobile ? "" : ""
        )}
        style={{
          backgroundColor: color,
          border: `1px solid ${color}`
        }}
      >
        <div className={clsx(
          "flex items-center",
          isMobile ? "gap-1 px-2 py-0.5" : "gap-1.5 px-2.5 py-1"
        )}>
          {imageUrl && (
            <div className={clsx(
              "rounded-full overflow-hidden border border-cream/30 flex-shrink-0",
              isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
            )}>
              <img
                src={imageUrl}
                alt={optionDisplayName}
                className="w-full h-full object-cover"
                style={
                  imageCrop
                    ? {
                        objectPosition: `${imageCrop.x}% ${imageCrop.y}%`,
                        transform: `scale(${imageCrop.scale})`
                      }
                    : {
                        objectPosition: 'center 25%',
                        transform: 'scale(2)'
                      }
                }
              />
            </div>
          )}
          <span className={clsx(
            "font-semibold text-cream/90 uppercase",
            isMobile ? "text-[10px]" : "text-[10px]"
          )}>
            {categoryDisplayName}
          </span>
          <span className={clsx("text-cream/60", isMobile ? "text-[10px]" : "text-[10px]")}>›</span>
          <span className={clsx("text-cream font-medium", isMobile ? "text-[11px]" : "text-xs")}>
            {optionDisplayName}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className={clsx(
              "hover:bg-black/15 transition-colors",
              isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
            )}
          >
            <X className={clsx("text-cream/80 hover:text-cream", isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
          </button>
        )}
      </div>
    )
  }

  // Fallback for custom content
  return <div onClick={onClick}>{children}</div>
}
