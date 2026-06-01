"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import clsx from "clsx"
import { FolderTree } from "lucide-react"

interface TagCategory {
  id: string
  name: string
  displayName: string
  color?: string
}

interface GroupBySelectorProps {
  categories: TagCategory[]
  hasTeamMembers: boolean
  selectedCategories: string[]
  onCategoryToggle: (categoryName: string) => void
  isLightbox?: boolean
  maxSelections?: number
}

export function GroupBySelector({
  categories,
  hasTeamMembers,
  selectedCategories,
  onCategoryToggle,
  isLightbox = false,
  maxSelections = 2
}: GroupBySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 6,
        left: rect.left
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Lock body scroll when dropdown is open on mobile
  useEffect(() => {
    if (!isOpen) return

    // Only lock scroll on mobile (width < 1024px which is lg breakpoint)
    const isMobile = window.innerWidth < 1024
    if (!isMobile) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    const originalPosition = window.getComputedStyle(document.body).position

    // Lock scroll
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    return () => {
      // Restore scroll
      document.body.style.overflow = originalStyle
      document.body.style.position = originalPosition
      document.body.style.width = ''
    }
  }, [isOpen])

  const handleCategoryClick = useCallback((categoryName: string) => {
    onCategoryToggle(categoryName)
    // Auto-collapse after selection
    setIsOpen(false)
  }, [onCategoryToggle])

  // Build all available categories including Team
  const allCategories = [
    ...(hasTeamMembers ? [{
      id: 'team',
      name: 'team',
      displayName: 'Team',
      color: '#BCC9C2'
    }] : []),
    ...(categories || [])
  ]

  const renderDropdown = () => {
    if (!isOpen || typeof window === 'undefined') return null

    const dropdown = (
      <div
        ref={dropdownRef}
        className="fixed min-w-[200px] max-h-[60vh] rounded-2xl shadow-lg overflow-y-auto z-[100] backdrop-blur-md touch-pan-y"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 246, 0.95) 100%)',
          border: '1px solid rgba(161, 151, 129, 0.2)',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
        onTouchMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
          <div className="py-1">
            {allCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.name)
              const isDisabled = !isSelected && selectedCategories.length >= maxSelections

              return (
                <button
                  key={cat.id}
                  onClick={() => !isDisabled && handleCategoryClick(cat.name)}
                  disabled={isDisabled}
                  className={clsx(
                    "w-full flex items-center justify-between gap-3 px-4 py-2 text-left transition-colors",
                    isSelected && "bg-dusty-rose/10",
                    !isDisabled && "hover:bg-warm-sand/50",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || "#A19781" }}
                    />
                    <span className={clsx(
                      "text-sm font-medium",
                      isSelected ? "text-dusty-rose" : "text-dune"
                    )}>
                      {cat.displayName}
                    </span>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-dusty-rose flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer hint */}
          {selectedCategories.length < maxSelections && (
            <div className="px-4 py-2 border-t border-sage/10">
              <p className="text-xs text-sage/60">
                Select up to {maxSelections} categories
              </p>
            </div>
          )}
      </div>
    )

    return createPortal(dropdown, document.body)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center rounded-full transition-all",
          "gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide leading-none",
          "h-[26px]", // Match chip height
          isLightbox
            ? "bg-sage/20 text-cream border border-sage/30"
            : "bg-sage/20 text-sage border border-sage/30 hover:bg-sage/30"
        )}
        style={{ minHeight: '26px', maxHeight: '26px' }}
      >
        <FolderTree className="w-3 h-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Group By</span>
      </button>
      {renderDropdown()}
    </>
  )
}
