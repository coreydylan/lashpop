"use client"

import { ReactNode, useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { X, Sparkles, Layers, MousePointer, Trash2, Filter, ChevronRight } from "lucide-react"
import clsx from "clsx"

export type ChipVariant =
  | "command-launcher"    // Command palette button
  | "group-by"           // Group by category chip
  | "tag-existing"       // Existing tag on selected assets (with count)
  | "tag-new"            // New tag to be applied (with border)
  | "filter"             // Active filter chip
  | "stack"              // Stack of multiple chips

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
  isStaticImage?: boolean

  // State
  isSelected?: boolean
  isPending?: boolean | null
  isDissipating?: boolean
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
  isStaticImage = false,
  isSelected = false,
  isPending = false,
  isDissipating = false,
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
  const [isDropdownFading, setIsDropdownFading] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [pendingAction, setPendingAction] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLDivElement>(null)
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update dropdown position when chip position changes
  useEffect(() => {
    if (showDropdown && chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect()
      // Use viewport-relative coordinates for fixed positioning (no scroll offset needed)
      setDropdownPosition({
        top: rect.bottom + 6,
        left: rect.left
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

  // Close dropdown when scrolling on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (showDropdown && !isDropdownFading) {
        // Start fade out animation
        setIsDropdownFading(true)
        
        // Clear any existing fade timeout
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current)
        }

        // Actually close after fade animation completes
        fadeTimeoutRef.current = setTimeout(() => {
          setShowDropdown(false)
          setIsDropdownFading(false)
          setPendingAction(null)
        }, 200) // Match CSS transition duration
      }
    }

    window.addEventListener('omnibar-scroll', handleScroll)
    return () => window.removeEventListener('omnibar-scroll', handleScroll)
  }, [showDropdown, isDropdownFading])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current)
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }
    }
  }, [])

  // Helper functions for delayed dropdown close
  const scheduleClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    closeTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false)
    }, 150) // 150ms delay gives user time to move mouse to dropdown
  }

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  // Build default actions based on chip type
  const getDefaultActions = (): ChipAction[] => {
    const defaultActions: ChipAction[] = []

    // Group By action (for tag chips)
    if (onCategoryClick && categoryName && variant !== "group-by") {
      defaultActions.push({
        label: `Group by ${categoryDisplayName}`,
        icon: <Layers className="w-3.5 h-3.5" />,
        onClick: onCategoryClick,
      })
    }

    // Unselect action (for tag-existing chips)
    if (onUnselectAssets) {
      defaultActions.push({
        label: "Unselect these assets",
        icon: <MousePointer className="w-3.5 h-3.5" />,
        onClick: onUnselectAssets,
      })
    }

    // Remove action (context-dependent)
    if (onRemove) {
      let removeLabel = "Remove"
      
      if (variant === "tag-existing" && count) {
        removeLabel = `Remove from ${count} ${count === 1 ? 'asset' : 'assets'}`
      } else if (variant === "filter") {
        removeLabel = "Remove filter"
      } else if (variant === "group-by") {
        removeLabel = "Remove grouping"
      } else if (variant === "tag-new") {
        removeLabel = "Remove tag"
      } else if (variant === "stack") {
        removeLabel = "Clear group"
      }

      defaultActions.push({
        label: removeLabel,
        icon: <Trash2 className="w-3.5 h-3.5" />,
        onClick: onRemove,
        variant: variant === "tag-existing" ? "danger" : "default"
      })
    }

    return defaultActions
  }

  const allActions = actions || getDefaultActions()
  const hasActions = allActions.length > 0

  // Command Launcher variant - unique design, no dropdown
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

  // Dropdown Menu Component
  const DropdownMenu = () => {
    if (!hasActions || !showDropdown || typeof window === 'undefined') return null

    const dropdown = (
      <div
        ref={dropdownRef}
        className={clsx(
          "fixed min-w-[180px] rounded-2xl shadow-lg overflow-hidden z-[100] backdrop-blur-md transition-opacity duration-200",
          isDropdownFading ? "opacity-0" : "opacity-100"
        )}
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 246, 0.95) 100%)',
          border: '1px solid rgba(161, 151, 129, 0.2)'
        }}
        onMouseEnter={() => !isMobile && cancelClose()}
        onMouseLeave={() => !isMobile && scheduleClose()}
        onClick={(e) => e.stopPropagation()}
      >
        {allActions.map((action, index) => {
          const isPendingThis = pendingAction === index
          const isDanger = action.variant === "danger"
          
          return (
            <button
              key={index}
              onClick={() => {
                // For danger actions, show confirmation unless already confirming
                if (isDanger && !isPendingThis) {
                  // First click - show confirmation
                  setPendingAction(index)
                  // Auto-cancel after 3 seconds
                  if (pendingTimeoutRef.current) {
                    clearTimeout(pendingTimeoutRef.current)
                  }
                  pendingTimeoutRef.current = setTimeout(() => {
                    setPendingAction(null)
                  }, 3000)
                } else {
                  // Second click or non-danger - execute action
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
                <span className="flex-shrink-0">
                  {action.icon}
                </span>
              )}
              <span className="flex-1">
                {isPendingThis ? "Confirm..." : action.label}
              </span>
            </button>
          )
        })}
      </div>
    )

    return createPortal(dropdown, document.body)
  }

  // UNIFIED CHIP DESIGN - All variants use this base structure
  // Differences are only in visual styling (border, background intensity, etc.)
  
  const getChipStyles = () => {
    switch (variant) {
      case "group-by":
        return {
          wrapper: "bg-sage/20 border border-sage/30 shadow-sm",
          showCount: false,
          showBorder: false
        }
      case "tag-new":
        return {
          wrapper: "border-2 border-cream/40 shadow-md",
          showCount: false,
          showBorder: false
        }
      case "filter":
        return {
          wrapper: "border border-cream/20 shadow-sm hover:shadow-md",
          showCount: false,
          showBorder: false
        }
      case "stack":
        return {
          wrapper: "shadow-md border-b-2 border-r-2 border-black/20",
          showCount: false,
          showBorder: true
        }
      case "tag-existing":
      default:
        return {
          wrapper: "shadow-sm",
          showCount: true,
          showBorder: false
        }
    }
  }

  const styles = getChipStyles()

  return (
    <>
      <div 
        ref={chipRef}
        className="relative"
        onMouseEnter={() => {
          if (!isMobile && hasActions && variant !== "stack") {
            cancelClose()
            setShowDropdown(true)
          }
        }}
        onMouseLeave={() => !isMobile && scheduleClose()}
        onClick={(e) => {
          e.stopPropagation() // Prevent propagation to parent elements
          if (onClick) {
            onClick()
          } else if (isMobile && hasActions && variant !== "stack") {
            // On mobile, toggle dropdown on click
            setShowDropdown(!showDropdown)
          } else if (onRemove && !isMobile && !hasActions) {
             // If only remove action and desktop, just execute it
             onRemove()
          } else if (!isMobile && hasActions && variant !== "stack") {
             // On desktop click, also ensure dropdown is shown/toggled
             setShowDropdown(true)
          }
        }}
      >
        <div 
          className={clsx(
            "flex items-center gap-0 rounded-full overflow-hidden transition-all",
            isDissipating && "dissipate-effect",
            (hasActions || onClick) && "cursor-pointer",
            styles.wrapper
          )}
          style={{
            background: variant === "group-by" ? undefined : color,
            minHeight: 'auto',
            height: 'auto',
            ...(variant === "group-by" && {
              background: 'linear-gradient(135deg, rgba(161, 151, 129, 0.35) 0%, rgba(161, 151, 129, 0.25) 100%)',
              filter: 'saturate(1.3) brightness(1.05)'
            })
          }}
        >
          <div className={clsx(
            "flex items-center",
            isMobile ? "gap-1 px-2 py-1" : "gap-1.5 px-2.5 py-1"
          )}>
            {/* Count badge (for tag-existing) */}
            {styles.showCount && count !== undefined && (
              <div className="flex items-center gap-0.5 px-1 py-0.5">
                <span className="text-[10px] font-bold text-cream">{count}</span>
              </div>
            )}

            {/* Avatar/Image */}
            {imageUrl && (
              <div className={clsx(
                "relative rounded-full overflow-hidden border border-cream/30 flex-shrink-0 bg-warm-sand/40",
                isMobile ? "w-4 h-4" : "w-5 h-5"
              )}>
                {imageUrl.includes('placeholder') ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className={clsx("text-cream/60", isMobile ? "w-2.5 h-2.5" : "w-3 h-3")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                ) : isStaticImage ? (
                  // Use pre-cropped image (cropCloseUpCircleUrl)
                  <Image
                    src={imageUrl}
                    alt={optionDisplayName || "Image"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 16px, 20px"
                  />
                ) : imageCrop ? (
                  // Apply crop positioning if crop data exists
                  <Image
                    src={imageUrl}
                    alt={optionDisplayName || "Image"}
                    fill
                    className="absolute inset-0 object-cover"
                    style={{
                      width: `${imageCrop.scale * 100}%`,
                      height: `${imageCrop.scale * 100}%`,
                      left: `${50 - (imageCrop.x * imageCrop.scale)}%`,
                      top: `${50 - (imageCrop.y * imageCrop.scale)}%`
                    }}
                    sizes="(max-width: 768px) 16px, 20px"
                  />
                ) : (
                  // Fallback to object-fit: cover
                  <Image
                    src={imageUrl}
                    alt={optionDisplayName || "Image"}
                    fill
                    className="object-cover"
                    style={{
                      objectPosition: 'center 30%'
                    }}
                    sizes="(max-width: 768px) 16px, 20px"
                  />
                )}
              </div>
            )}
            
            {/* Category (clickable for group-by if enabled) */}
            {categoryDisplayName && (
              <>
                <span className={clsx(
                  "font-semibold uppercase",
                  variant === "group-by" ? "text-sage" : "text-cream",
                  isMobile ? "text-[10px]" : "text-xs"
                )}>
                  {categoryDisplayName}
                </span>
                
                {(optionDisplayName || count !== undefined) && (
                  <>
                    <span className={clsx(
                      variant === "group-by" ? "text-sage/60" : "text-cream/60",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>›</span>
                  </>
                )}
              </>
            )}

            {/* Option/Value */}
            {optionDisplayName && (
              <span className={clsx(
                "font-medium",
                variant === "group-by" ? "text-dune" : "text-cream",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {optionDisplayName}
              </span>
            )}
            
            {/* Count only for Stack variant */}
            {variant === "stack" && count !== undefined && (
              <span className={clsx(
                "font-bold bg-black/20 px-1.5 py-0.5 rounded-full ml-0.5",
                isMobile ? "text-[10px]" : "text-xs text-cream"
              )}>
                {count}
              </span>
            )}
            
            {/* Expand icon for stack */}
            {variant === "stack" && (
               <ChevronRight className={clsx(
                 "opacity-60",
                 isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
               )} />
            )}
          </div>
        </div>
      </div>
      <DropdownMenu />
    </>
  )
}
