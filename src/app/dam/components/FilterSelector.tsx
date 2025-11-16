"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import clsx from "clsx"
import { Plus, Filter } from "lucide-react"

interface Tag {
  id: string
  name: string
  displayName: string
  categoryId: string
}

interface TagCategory {
  id: string
  name: string
  displayName: string
  color?: string
  tags: Tag[]
}

interface TeamMember {
  id: string
  name: string
  imageUrl?: string
  cropCloseUpCircle?: {
    x: number
    y: number
    scale: number
  } | null
}

interface FilterAsset {
  id: string
  teamMemberId?: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
    categoryId: string
  }>
}

interface FilterSelectorProps {
  categories: TagCategory[]
  teamMembers?: TeamMember[]
  selectedTagIds: string[]
  selectedTeamMemberIds?: string[]
  onTagToggle: (tagId: string) => void
  onTeamMemberToggle?: (memberId: string) => void
  isLightbox?: boolean
  assets?: FilterAsset[]
}

export function FilterSelector({
  categories,
  teamMembers = [],
  selectedTagIds,
  selectedTeamMemberIds = [],
  onTagToggle,
  onTeamMemberToggle,
  isLightbox = false,
  assets = []
}: FilterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update dropdown position when opened (below button)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      // Use viewport-relative coordinates for fixed positioning (no scroll offset needed)
      setDropdownPosition({
        top: rect.bottom + 6,
        left: rect.left
      })
    }
  }, [isOpen, expandedCategory])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setExpandedCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Memoized count calculations
  const optionCounts = useMemo(() => {
    const counts = new Map<string, number>()

    assets.forEach(asset => {
      if (asset.teamMemberId) {
        const key = `team-${asset.teamMemberId}`
        counts.set(key, (counts.get(key) || 0) + 1)
      }

      asset.tags?.forEach(tag => {
        const key = `tag-${tag.id}`
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })

    return counts
  }, [assets])

  const getOptionCount = useCallback((categoryId: string, optionId: string) => {
    const key = categoryId === 'team' ? `team-${optionId}` : `tag-${optionId}`
    return optionCounts.get(key) || 0
  }, [optionCounts])

  // Create combined categories including Team
  const allCategories = useMemo(() => [
    ...(teamMembers.length > 0 ? [{
      id: 'team',
      name: 'team',
      displayName: 'Team',
      color: '#BCC9C2',
      options: teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        displayName: m.name,
        imageUrl: m.imageUrl,
        cropCloseUpCircle: m.cropCloseUpCircle,
        count: getOptionCount('team', m.id)
      }))
    }] : []),
    ...categories.map(cat => ({
      ...cat,
      options: (cat.tags || []).map(tag => ({
        id: tag.id,
        name: tag.name,
        displayName: tag.displayName,
        count: getOptionCount(cat.id, tag.id)
      }))
    }))
  ].map(cat => ({
    ...cat,
    count: cat.options.reduce((sum: number, opt: any) => sum + (opt.count || 0), 0)
  })), [categories, getOptionCount, teamMembers])

  const handleCategoryClick = useCallback((categoryId: string) => {
    setExpandedCategory(categoryId)
  }, [])

  const handleOptionClick = useCallback((categoryId: string, optionId: string) => {
    if (categoryId === 'team' && onTeamMemberToggle) {
      onTeamMemberToggle(optionId)
    } else {
      onTagToggle(optionId)
    }
    // Auto-collapse after selection
    setIsOpen(false)
    setExpandedCategory(null)
  }, [onTagToggle, onTeamMemberToggle])

  // Dropdown menu
  const DropdownMenu = () => {
    if (!isOpen || typeof window === 'undefined') return null

    const category = expandedCategory ? allCategories.find(c => c.id === expandedCategory) : null
    const isTeamCategory = category?.id === 'team'

    const dropdown = (
      <div
        ref={dropdownRef}
        className="fixed min-w-[240px] max-w-[400px] rounded-2xl shadow-lg overflow-hidden z-[100] backdrop-blur-md"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 246, 0.95) 100%)',
          border: '1px solid rgba(161, 151, 129, 0.2)'
        }}
      >
        {/* Category list view */}
        {!expandedCategory && (
          <div className="py-1">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left hover:bg-warm-sand/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color || "#A19781" }}
                  />
                  <span className="text-sm font-medium text-dune">{cat.displayName}</span>
                </div>
                <span className="text-xs text-sage/60">{cat.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Options view */}
        {expandedCategory && category && (
          <div className="py-1">
            {/* Back button */}
            <button
              onClick={() => setExpandedCategory(null)}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-warm-sand/50 transition-colors border-b border-sage/10"
            >
              <span className="text-sm text-sage">←</span>
              <span className="text-sm font-semibold text-dune">{category.displayName}</span>
            </button>

            {/* Options list */}
            {category.options.map((option: any) => {
              const isSelected = isTeamCategory
                ? selectedTeamMemberIds.includes(option.id)
                : selectedTagIds.includes(option.id)

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(category.id, option.id)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-4 py-2 text-left transition-colors",
                    isSelected ? "bg-dusty-rose/10" : "hover:bg-warm-sand/50"
                  )}
                >
                  {/* Avatar for team members */}
                  {isTeamCategory && option.imageUrl && (
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-cream/30 flex-shrink-0">
                      <img
                        src={option.imageUrl}
                        alt={option.displayName}
                        className="w-full h-full object-cover"
                        style={
                          option.cropCloseUpCircle
                            ? {
                                objectPosition: `${option.cropCloseUpCircle.x}% ${option.cropCloseUpCircle.y}%`,
                                transform: `scale(${option.cropCloseUpCircle.scale})`
                              }
                            : {
                                objectPosition: 'center 25%',
                                transform: 'scale(2)'
                              }
                        }
                      />
                    </div>
                  )}

                  {/* Name */}
                  <span className={clsx(
                    "text-sm flex-1",
                    isSelected ? "text-dusty-rose font-medium" : "text-dune"
                  )}>
                    {option.displayName}
                  </span>

                  {/* Count */}
                  <span className="text-xs text-sage/60">{option.count}</span>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-dusty-rose flex-shrink-0" />
                  )}
                </button>
              )
            })}
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
        <Plus className="w-3 h-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Filter</span>
      </button>
      <DropdownMenu />
    </>
  )
}
