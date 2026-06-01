"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { Plus, ChevronRight } from "lucide-react"
import clsx from "clsx"

interface Tag {
  id: string
  name: string
  displayName: string
  parentTagId?: string | null
  serviceCategoryId?: string | null
  serviceId?: string | null
  children?: Tag[]
}

interface TagCategory {
  id: string
  name: string
  displayName: string
  color?: string
  tags: Tag[]
  hierarchicalTags?: Tag[] // New: nested structure
}

interface SelectedTag extends Tag {
  category: {
    id: string
    name: string
    displayName: string
    color?: string
  }
}

interface TagSelectorProps {
  selectedTags: SelectedTag[]
  onTagsChange: (tags: SelectedTag[]) => void
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<TagCategory | null>(null)
  const [expandedParentTag, setExpandedParentTag] = useState<Tag | null>(null) // For hierarchical tags
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCategories()
    fetchTeamMembers()
  }, [])

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 6,
        left: rect.left
      })
    }
  }, [isOpen, expandedCategory, expandedParentTag])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setExpandedCategory(null)
        setExpandedParentTag(null)
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/dam/tags")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/dam/team-members")
      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }

  const handleCategoryClick = useCallback((category: TagCategory) => {
    setExpandedCategory(category)
  }, [])

  const handleAddTag = useCallback((category: TagCategory, tag: Tag) => {
    // Check if tag is already selected
    const isAlreadySelected = selectedTags.some((t) => t.id === tag.id)
    if (isAlreadySelected) return

    const newTag: SelectedTag = {
      ...tag,
      category: {
        id: category.id,
        name: category.name,
        displayName: category.displayName,
        color: category.color
      }
    }

    onTagsChange([...selectedTags, newTag])
    // Close dropdown after adding
    setIsOpen(false)
    setExpandedCategory(null)
    setExpandedParentTag(null)
  }, [selectedTags, onTagsChange])

  const handleAddTeamMember = useCallback((member: any) => {
    const isAlreadySelected = selectedTags.some((t) => t.id === member.id)
    if (isAlreadySelected) return

    const newTag: SelectedTag = {
      id: member.id,
      name: member.name,
      displayName: member.name,
      category: {
        id: "team",
        name: "team",
        displayName: "Team",
        color: "#BCC9C2"
      }
    }

    onTagsChange([...selectedTags, newTag])
    // Close dropdown after adding
    setIsOpen(false)
    setExpandedCategory(null)
    setExpandedParentTag(null)
  }, [selectedTags, onTagsChange])

  // Combine team category with tag categories
  const allCategories = [
    {
      id: "team",
      name: "team",
      displayName: "Team",
      color: "#BCC9C2",
      tags: teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        displayName: m.name,
        imageUrl: m.imageUrl,
        cropCloseUpCircle: m.cropCloseUpCircle
      }))
    },
    ...categories
  ]

  const isTeamCategory = expandedCategory?.id === 'team'

  // Check if a category has hierarchical tags (parent tags with children)
  const hasHierarchy = (category: TagCategory) => {
    return category.hierarchicalTags && category.hierarchicalTags.some(t => t.children && t.children.length > 0)
  }

  // Get tags to display - use hierarchical if available
  const getDisplayTags = (category: TagCategory): Tag[] => {
    if (hasHierarchy(category) && category.hierarchicalTags) {
      return category.hierarchicalTags
    }
    return category.tags
  }

  const renderDropdown = () => {
    if (!isOpen || typeof window === 'undefined') return null

    const dropdown = (
      <div
        ref={dropdownRef}
        className="fixed min-w-[240px] max-w-[400px] max-h-[60vh] rounded-2xl shadow-lg overflow-y-auto z-[100] backdrop-blur-md touch-pan-y"
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
        {/* Category list view */}
        {!expandedCategory && (
          <div className="py-1">
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2 text-left hover:bg-warm-sand/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color || "#A19781" }}
                  />
                  <span className="text-sm font-medium text-dune">{cat.displayName}</span>
                </div>
                <span className="text-xs text-sage/60">{cat.tags.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tags view - Level 1 (parent tags or flat tags) */}
        {expandedCategory && !expandedParentTag && (
          <div className="py-1">
            {/* Back button */}
            <button
              onClick={() => setExpandedCategory(null)}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-warm-sand/50 transition-colors border-b border-sage/10"
            >
              <span className="text-sm text-sage">←</span>
              <span className="text-sm font-semibold text-dune">{expandedCategory.displayName}</span>
            </button>

            {/* Tags list - show hierarchical or flat */}
            {getDisplayTags(expandedCategory).map((tag: Tag) => {
              const isSelected = selectedTags.some((t) => t.id === tag.id)
              const hasChildren = tag.children && tag.children.length > 0

              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (isTeamCategory) {
                      handleAddTeamMember(tag)
                    } else if (hasChildren) {
                      // Navigate to children
                      setExpandedParentTag(tag)
                    } else {
                      handleAddTag(expandedCategory, tag)
                    }
                  }}
                  disabled={isSelected && !hasChildren}
                  className={clsx(
                    "w-full flex items-center gap-2 px-4 py-2 text-left transition-colors",
                    isSelected && !hasChildren ? "bg-dusty-rose/10 cursor-not-allowed" : "hover:bg-warm-sand/50"
                  )}
                >
                  {/* Avatar for team members */}
                  {isTeamCategory && (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-cream/30 flex-shrink-0 bg-warm-sand/40">
                      {!(tag as any).imageUrl || (tag as any).imageUrl.includes('placeholder') ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={(tag as any).imageUrl}
                          alt={tag.displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-4 h-4 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>'
                            }
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Name */}
                  <span className={clsx(
                    "text-sm flex-1",
                    isSelected && !hasChildren ? "text-dusty-rose/60 font-medium" : "text-dune"
                  )}>
                    {tag.displayName}
                  </span>

                  {/* Children indicator or selected indicator */}
                  {hasChildren ? (
                    <div className="flex items-center gap-1 text-sage/60">
                      <span className="text-xs">{tag.children?.length}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  ) : isSelected ? (
                    <span className="text-xs text-dusty-rose/60">✓ Added</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {/* Child tags view - Level 2 (services under a category) */}
        {expandedCategory && expandedParentTag && (
          <div className="py-1">
            {/* Back button to parent */}
            <button
              onClick={() => setExpandedParentTag(null)}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-warm-sand/50 transition-colors border-b border-sage/10"
            >
              <span className="text-sm text-sage">←</span>
              <span className="text-sm font-semibold text-dune">{expandedParentTag.displayName}</span>
            </button>

            {/* Option to tag with parent category */}
            {(() => {
              const isParentSelected = selectedTags.some((t) => t.id === expandedParentTag.id)
              return (
                <button
                  onClick={() => handleAddTag(expandedCategory, expandedParentTag)}
                  disabled={isParentSelected}
                  className={clsx(
                    "w-full flex items-center gap-2 px-4 py-2 text-left transition-colors border-b border-sage/5",
                    isParentSelected ? "bg-dusty-rose/10 cursor-not-allowed" : "hover:bg-warm-sand/50"
                  )}
                >
                  <span className={clsx(
                    "text-sm flex-1 italic",
                    isParentSelected ? "text-dusty-rose/60" : "text-sage"
                  )}>
                    Tag as &ldquo;{expandedParentTag.displayName}&rdquo; (all)
                  </span>
                  {isParentSelected && (
                    <span className="text-xs text-dusty-rose/60">✓ Added</span>
                  )}
                </button>
              )
            })()}

            {/* Child tags list */}
            {expandedParentTag.children?.map((childTag: Tag) => {
              const isSelected = selectedTags.some((t) => t.id === childTag.id)

              return (
                <button
                  key={childTag.id}
                  onClick={() => handleAddTag(expandedCategory, childTag)}
                  disabled={isSelected}
                  className={clsx(
                    "w-full flex items-center gap-2 px-4 py-2 text-left transition-colors",
                    isSelected ? "bg-dusty-rose/10 cursor-not-allowed" : "hover:bg-warm-sand/50"
                  )}
                >
                  <span className={clsx(
                    "text-sm flex-1",
                    isSelected ? "text-dusty-rose/60 font-medium" : "text-dune"
                  )}>
                    {childTag.displayName}
                  </span>

                  {isSelected && (
                    <span className="text-xs text-dusty-rose/60">✓ Added</span>
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
      {/* Add Tag Button with Dropdown */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border",
          isOpen
            ? "bg-sage text-cream border-sage"
            : "bg-sage/10 hover:bg-sage/20 text-sage border-sage/30"
        )}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add Tag</span>
      </button>

      {renderDropdown()}
    </>
  )
}
