"use client"

import { ReactNode, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Sparkles, Layers, MousePointer, Trash2 } from "lucide-react"
import clsx from "clsx"

export type ChipVariant =
  | "command-launcher"    // Command palette button
  | "group-by"           // Group by category chip
  | "tag-existing"       // Existing tag on selected assets (with count)
  | "tag-new"            // New tag to be applied (with border)
  | "filter"             // Active filter chip

export interface ChipAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: "default" | "danger"
}

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

  // Dropdown actions
  actions?: ChipAction[]
  onUnselectAssets?: () => void  // Unselect assets with this tag

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
  actions,
  onUnselectAssets,
  children
}: OmniChipProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [pendingAction, setPendingAction] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLDivElement>(null)
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update dropdown position when chip position changes
  useEffect(() => {
    if (showDropdown && chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX
      })
    }
  }, [showDropdown])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          chipRef.current && !chipRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setPendingAction(null)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Cleanup pending timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current)
      }
    }
  }, [])

  // Build default actions based on chip type
  const getDefaultActions = (): ChipAction[] => {
    const defaultActions: ChipAction[] = []

    // Group By first
    if (onCategoryClick && categoryName) {
      defaultActions.push({
        label: `Group by ${categoryDisplayName}`,
        icon: <Layers className="w-3.5 h-3.5" />,
        onClick: onCategoryClick,
      })
    }

    // Unselect second
    if (onUnselectAssets) {
      defaultActions.push({
        label: "Unselect these assets",
        icon: <MousePointer className="w-3.5 h-3.5" />,
        onClick: onUnselectAssets,
      })
    }

    // Remove last (danger action)
    if (variant === "tag-existing" && onRemove) {
      defaultActions.push({
        label: `Remove from ${count} ${count === 1 ? 'asset' : 'assets'}`,
        icon: <Trash2 className="w-3.5 h-3.5" />,
        onClick: onRemove,
        variant: "danger"
      })
    }

    return defaultActions
  }

  const allActions = actions || getDefaultActions()
  const hasActions = allActions.length > 0

  // Command Launcher variant
  if (variant === "command-launcher") {
    return (
      <button
        onClick={onClick}
        data-chip-version="v2"
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

  // Dropdown Menu Component
  const DropdownMenu = () => {
    if (!hasActions || !showDropdown || typeof window === 'undefined') return null

    const dropdown = (
      <div
        ref={dropdownRef}
        className="fixed min-w-[180px] rounded-2xl shadow-lg overflow-hidden z-[100] backdrop-blur-md"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 246, 0.95) 100%)',
          border: '1px solid rgba(161, 151, 129, 0.2)'
        }}
        onMouseEnter={() => !isMobile && setShowDropdown(true)}
        onMouseLeave={() => !isMobile && setShowDropdown(false)}
        onClick={(e) => e.stopPropagation()}
      >
        {allActions.map((action, index) => {
          const isPendingThis = pendingAction === index
          const isDanger = action.variant === "danger"

          return (
            <button
              key={index}
              onClick={() => {
                if (isDanger && !isPendingThis) {
                  // First click on danger action - show confirmation
                  setPendingAction(index)
                  // Auto-cancel after 3 seconds
                  if (pendingTimeoutRef.current) {
                    clearTimeout(pendingTimeoutRef.current)
                  }
                  pendingTimeoutRef.current = setTimeout(() => {
                    setPendingAction(null)
                  }, 3000)
                } else {
                  // Either non-danger action or confirming danger action
                  action.onClick()
                  setShowDropdown(false)
                  setPendingAction(null)
                  if (pendingTimeoutRef.current) {
                    clearTimeout(pendingTimeoutRef.current)
                  }
                }
              }}
              onMouseLeave={() => {
                // Cancel confirmation if mouse leaves
                if (isPendingThis) {
                  setPendingAction(null)
                  if (pendingTimeoutRef.current) {
                    clearTimeout(pendingTimeoutRef.current)
                  }
                }
              }}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all text-left group relative overflow-hidden",
                isDanger
                  ? isPendingThis
                    ? "text-cream bg-dusty-rose"
                    : "text-dusty-rose hover:bg-dusty-rose/10"
                  : "text-sage hover:bg-warm-sand/50",
                index < allActions.length - 1 && "border-b border-sage/10"
              )}
              style={isPendingThis ? {
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0px, rgba(255, 255, 255, 0.1) 10px, transparent 10px, transparent 20px)',
                animation: 'candy-cane 0.8s linear infinite'
              } : undefined}
            >
              {action.icon && (
                <span className={clsx(
                  "flex-shrink-0 transition-transform group-hover:scale-110",
                  isPendingThis
                    ? "text-cream"
                    : isDanger ? "text-dusty-rose" : "text-sage/70"
                )}>
                  {action.icon}
                </span>
              )}
              <span className="whitespace-nowrap">
                {isPendingThis ? `Confirm ${action.label.toLowerCase()}?` : action.label}
              </span>
            </button>
          )
        })}
      </div>
    )

    return createPortal(dropdown, document.body)
  }

  // Tag Existing variant (with count)
  if (variant === "tag-existing") {
    return (
      <>
        <div
          ref={chipRef}
          className="relative"
          onMouseEnter={() => !isMobile && hasActions && setShowDropdown(true)}
          onMouseLeave={() => !isMobile && setShowDropdown(false)}
          onClick={() => isMobile && hasActions && setShowDropdown(!showDropdown)}
        >
          <div
            className={clsx(
              "flex items-center gap-0 rounded-full overflow-hidden shadow-sm transition-all",
              isPending && "candy-cane-effect",
              hasActions && "cursor-pointer"
            )}
            style={{
              background: color,
              minHeight: 'auto',
              height: 'auto'
            }}
            onClick={(e) => !hasActions && e.stopPropagation()}
          >
        <div className={clsx(
          "flex items-center",
          isMobile ? "gap-1 px-2 py-1" : "gap-1.5 px-2.5 py-1"
        )}>
          <div className="flex items-center gap-0.5 px-1 py-0.5">
            <span className="text-[10px] font-bold text-cream">{count}</span>
          </div>

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

          <span className={clsx(
            "font-semibold text-cream uppercase",
            isMobile ? "text-[10px]" : "text-xs"
          )}>
            {categoryDisplayName}
          </span>

          <span className={clsx("text-cream/60", isMobile ? "text-[10px]" : "text-xs")}>›</span>
          <span className={clsx("text-cream font-medium", isMobile ? "text-xs" : "text-sm")}>
            {optionDisplayName}
          </span>
        </div>
        </div>
        </div>
        <DropdownMenu />
      </>
    )
  }

  // Tag New variant (to be applied)
  if (variant === "tag-new") {
    return (
      <div
        className={clsx(
          "flex items-center gap-0 rounded-full overflow-hidden shadow-md border-2 border-cream/40 transition-all",
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
          <span className={clsx("text-cream font-medium", isMobile ? "text-xs" : "text-sm")}>
            {optionDisplayName}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className={clsx(
              "hover:bg-black/10 transition-colors",
              isMobile ? "px-2 py-1" : "px-2.5 py-1.5"
            )}
          >
            <X className={clsx("text-cream", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
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
          isMobile ? "gap-1 px-2 py-1" : "gap-1.5 px-2.5 py-1"
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
          <span className={clsx(
            "font-semibold text-cream/90 uppercase",
            isMobile ? "text-[10px]" : "text-xs"
          )}>
            {categoryDisplayName}
          </span>
          <span className={clsx("text-cream/60", isMobile ? "text-[10px]" : "text-xs")}>›</span>
          <span className={clsx("text-cream font-medium", isMobile ? "text-xs" : "text-sm")}>
            {optionDisplayName}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className={clsx(
              "hover:bg-black/15 transition-colors",
              isMobile ? "px-1.5 py-1" : "px-2 py-1"
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
