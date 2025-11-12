"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useMemo } from "react"
import clsx from "clsx"
import { Plus, Check, X } from "lucide-react"

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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  // Handle hover for desktop
  const handleMouseEnter = useCallback((categoryId: string) => {
    if (!isTouchDevice) {
      setHoveredCategory(categoryId)
    }
  }, [isTouchDevice])

  const handleMouseLeave = useCallback(() => {
    if (!isTouchDevice) {
      setHoveredCategory(null)
    }
  }, [isTouchDevice])

  // Handle click on category
  const handleCategoryClick = useCallback((categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCategory(categoryId)
  }, [])

  const handleTagClick = useCallback((tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onTagToggle(tagId)
    // Stay in the same category to allow multiple selections
  }, [onTagToggle])

  const handleTeamMemberClick = useCallback((memberId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onTeamMemberToggle) {
      onTeamMemberToggle(memberId)
    }
    // Stay in the same category to allow multiple selections
  }, [onTeamMemberToggle])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleBodyClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      // Don't close if clicking on filter elements
      if (!target.closest('.filter-selector')) {
        setIsOpen(false)
        setExpandedCategory(null)
      }
    }

    // Add event listener after a delay to prevent immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleBodyClick)
      document.addEventListener('touchstart', handleBodyClick)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleBodyClick)
      document.removeEventListener('touchstart', handleBodyClick)
    }
  }, [isOpen])

  const baseTextColor = isLightbox ? "text-cream" : "text-sage"
  const hoverBg = isLightbox ? "hover:bg-white/10" : "hover:bg-sage/10"
  const activeBg = isLightbox ? "bg-white/15" : "bg-sage/15"
  const plusBg = isLightbox ? "bg-dusty-rose/80" : "bg-dusty-rose"

  // Memoized count calculations for better performance
  const optionCounts = useMemo(() => {
    const counts = new Map<string, number>()

    // Calculate all counts in a single pass through assets
    assets.forEach(asset => {
      // Count team members
      if (asset.teamMemberId) {
        const key = `team-${asset.teamMemberId}`
        counts.set(key, (counts.get(key) || 0) + 1)
      }

      // Count tags
      asset.tags?.forEach(tag => {
        const key = `tag-${tag.id}`
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })

    return counts
  }, [assets])

  // Get option count from memoized calculations
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
      options: teamMembers
        .map(m => ({
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
      options: (cat.tags || [])
        .map(tag => ({
          id: tag.id,
          name: tag.name,
          displayName: tag.displayName,
          count: getOptionCount(cat.id, tag.id)
        }))
    }))
  ] // Show all categories and options, even with 0 count
  .map(cat => ({
    ...cat,
    count: cat.options.reduce((sum: number, opt: any) => sum + (opt.count || 0), 0)
  })), [categories, getOptionCount, teamMembers])

  // Show + Filters button first
  if (!isOpen) {
    return (
      <div className="filter-selector">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            baseTextColor, hoverBg,
            "border",
            isLightbox ? "border-white/20" : "border-sage/20"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>
    )
  }

  // If a category is expanded, show its options
  if (expandedCategory) {
    const category = allCategories.find(c => c.id === expandedCategory)
    if (category && category.options && category.options.length > 0) {
      const isTeamCategory = category.id === 'team'

      return (
        <div className="filter-selector flex flex-wrap items-start gap-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpandedCategory(null)
            }}
            className={clsx(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              baseTextColor, hoverBg,
              "border",
              isLightbox ? "border-white/20" : "border-sage/20"
            )}
          >
            ← Back
          </button>

          <span className={clsx("px-2 text-sm font-semibold", baseTextColor)}>
            {category.displayName}
          </span>

          <span className={clsx("text-xs", isLightbox ? "text-cream/60" : "text-sage/60")}>
            (select multiple)
          </span>
        </div>

        {/* Divider */}
        <div className={clsx("h-6 w-px", isLightbox ? "bg-white/20" : "bg-sage/20")} />

        {category.options.map((option: any) => {
          const isSelected = isTeamCategory
            ? selectedTeamMemberIds.includes(option.id)
            : selectedTagIds.includes(option.id)

          return (
            <button
              key={option.id}
              onClick={(e) => isTeamCategory
                ? handleTeamMemberClick(option.id, e)
                : handleTagClick(option.id, e)}
              className={clsx(
                "flex items-center gap-2 pr-2 pl-3 py-1.5 rounded-full text-sm font-medium transition-all min-w-[100px]",
                isSelected ? "bg-dusty-rose text-cream" : clsx(baseTextColor, hoverBg),
                "border",
                isSelected
                  ? "border-dusty-rose"
                  : isLightbox ? "border-white/20" : "border-sage/20"
              )}
            >
              {isTeamCategory && option.imageUrl && (
                <div className="w-5 h-5 rounded-full overflow-hidden border border-cream/30 flex-shrink-0">
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
              <span>{option.displayName}</span>
              {/* Show check icon if selected, count otherwise */}
              {isSelected ? (
                <div
                  className="ml-auto w-6 h-6 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: '#CDA89E',
                    border: '2px solid #CDA89E',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}
                >
                  <Check className="w-3.5 h-3.5 text-cream" strokeWidth={3} />
                </div>
              ) : (
                <div
                  className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    backgroundColor: isLightbox ? 'rgba(255, 255, 255, 0.1)' : 'rgba(138, 124, 105, 0.1)',
                    border: `2px solid ${isLightbox ? '#F2EDE5' : '#8A7C69'}`,
                    color: isLightbox ? '#F2EDE5' : '#8A7C69'
                  }}
                >
                  {option.count || 0}
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
    }
    // If no valid category found, just fall through to show categories
  }

  // Show categories with transforming bullet to plus
  return (
    <div className="filter-selector flex items-start gap-2">
      {allCategories.map((category) => {
        const isHovered = hoveredCategory === category.id

        return (
          <button
            key={category.id}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              baseTextColor,
              isHovered && !isTouchDevice ? activeBg : "transparent",
              "border",
              isLightbox ? "border-white/20" : "border-sage/20"
            )}
            onMouseEnter={() => handleMouseEnter(category.id)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => handleCategoryClick(category.id, e)}
          >
            {/* Count badge - enhanced visual style */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                backgroundColor: isHovered
                  ? (category.color || "#A19781")
                  : isLightbox ? 'rgba(255, 255, 255, 0.1)' : 'rgba(138, 124, 105, 0.05)',
                border: `2px solid ${category.color || "#A19781"}`,
                color: isHovered
                  ? '#F2EDE5'
                  : (isLightbox ? '#F2EDE5' : (category.color || "#A19781")),
                boxShadow: isHovered ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {category.count || 0}
            </div>
            <span>{category.displayName}</span>
          </button>
        )
      })}

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(false)
          setExpandedCategory(null)
        }}
        className={clsx(
          "p-1.5 rounded-full transition-all",
          baseTextColor,
          hoverBg,
          "border",
          isLightbox ? "border-white/20" : "border-sage/20"
        )}
        aria-label="Close filters"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
