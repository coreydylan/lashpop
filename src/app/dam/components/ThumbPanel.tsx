"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import { createPortal } from "react-dom"
import clsx from "clsx"
import {
  Home,
  FolderTree,
  Filter,
  Sparkles,
  LayoutGrid,
  Grid3x3,
  CreditCard,
  X,
  ChevronRight,
  ChevronLeft,
  Folder
} from "lucide-react"

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
  tags?: Tag[]
}

interface Collection {
  id: string
  name: string
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

interface ThumbPanelProps {
  // Collections
  collections?: Collection[]
  activeCollectionId?: string | null
  onSelectCollection?: (id: string | null) => void
  onCreateCollection?: () => void

  // Group by
  groupCategories?: TagCategory[]
  hasTeamMembers?: boolean
  selectedGroupCategories?: string[]
  onGroupCategoryToggle?: (categoryName: string) => void
  maxGroupSelections?: number

  // Filters
  filterCategories?: TagCategory[]
  teamMembers?: TeamMember[]
  selectedTagIds?: string[]
  selectedTeamMemberIds?: string[]
  onTagToggle?: (tagId: string) => void
  onTeamMemberToggle?: (memberId: string) => void
  onClearFiltersAndGroups?: () => void

  // Actions
  onOpenCommandPalette?: () => void
  showGridToggle?: boolean
  gridViewMode?: "square" | "masonry"
  onToggleGridView?: () => void
  onOpenCardSettings?: () => void

  // Selection mode
  selectedCount?: number
  onClearSelection?: () => void
  canApplyTags?: boolean
  onApplyTags?: () => void
}

type MenuView = "main" | "collections" | "groupby" | "filters" | "actions" | "clear"

export function ThumbPanel({
  collections = [],
  activeCollectionId,
  onSelectCollection,
  onCreateCollection,
  groupCategories = [],
  hasTeamMembers = false,
  selectedGroupCategories = [],
  onGroupCategoryToggle,
  maxGroupSelections = 2,
  filterCategories = [],
  teamMembers = [],
  selectedTagIds = [],
  selectedTeamMemberIds = [],
  onTagToggle,
  onTeamMemberToggle,
  onClearFiltersAndGroups,
  onOpenCommandPalette,
  showGridToggle = false,
  gridViewMode = "square",
  onToggleGridView,
  onOpenCardSettings,
  selectedCount = 0,
  onClearSelection,
  canApplyTags = false,
  onApplyTags
}: ThumbPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<MenuView>("main")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setCurrentView("main")
        setExpandedCategory(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Build all available group categories
  const allGroupCategories = [
    ...(hasTeamMembers ? [{
      id: 'team',
      name: 'team',
      displayName: 'Team',
      color: '#BCC9C2'
    }] : []),
    ...groupCategories
  ]

  const handleClose = () => {
    setIsOpen(false)
    setCurrentView("main")
    setExpandedCategory(null)
  }

  const handleBackToMain = () => {
    setCurrentView("main")
    setExpandedCategory(null)
  }

  // Check if there are active filters or groups
  const hasFiltersOrGroups = selectedGroupCategories.length > 0 ||
                             selectedTagIds.length > 0 ||
                             selectedTeamMemberIds.length > 0

  // Build active filters list for Clear menu
  const activeFilters: Array<{ id: string; name: string; type: 'group' | 'filter' }> = []

  // Add group categories
  selectedGroupCategories.forEach(catName => {
    const category = allGroupCategories.find(c => c.name === catName)
    if (category) {
      activeFilters.push({
        id: catName,
        name: category.displayName,
        type: 'group'
      })
    }
  })

  // Add tag filters
  selectedTagIds.forEach(tagId => {
    for (const category of filterCategories) {
      const tag = category.tags?.find(t => t.id === tagId)
      if (tag) {
        activeFilters.push({
          id: tagId,
          name: tag.displayName,
          type: 'filter'
        })
        break
      }
    }
  })

  // Add team member filters
  selectedTeamMemberIds.forEach(memberId => {
    activeFilters.push({
      id: memberId,
      name: 'Team Member',
      type: 'filter'
    })
  })

  // Render different menu views
  const renderMainMenu = () => (
    <div className="space-y-1">
      {/* Clear button - appears at top when filters/groups active */}
      {hasFiltersOrGroups && !selectedCount && (
        <>
          <button
            onClick={() => setCurrentView('clear')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-sand/50 transition-colors border-b border-sage/10"
          >
            <span className="text-sm font-semibold text-dusty-rose">Clear</span>
          </button>
        </>
      )}
      {selectedCount > 0 ? (
        <>
          {/* Selection mode */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-dune">{selectedCount} selected</span>
              <button
                onClick={() => {
                  onClearSelection?.()
                  handleClose()
                }}
                className="p-1.5 hover:bg-sage/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-sage" />
              </button>
            </div>
          </div>
          {canApplyTags && (
            <button
              onClick={() => {
                onApplyTags?.()
                handleClose()
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
            >
              <span className="text-sm font-semibold text-dusty-rose">Apply Tags</span>
              <ChevronRight className="w-4 h-4 text-dusty-rose" />
            </button>
          )}
          {onOpenCommandPalette && (
            <button
              onClick={() => {
                onOpenCommandPalette()
                handleClose()
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-dusty-rose" />
                <span className="text-sm font-medium text-dune">Actions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-sage" />
            </button>
          )}
        </>
      ) : (
        <>
          {/* Normal mode */}
          {collections.length > 0 && (
            <button
              onClick={() => setCurrentView("collections")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-dune" />
                <span className="text-sm font-medium text-dune">Collections</span>
              </div>
              <ChevronRight className="w-4 h-4 text-sage" />
            </button>
          )}
          {allGroupCategories.length > 0 && (
            <button
              onClick={() => setCurrentView("groupby")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderTree className="w-5 h-5 text-dune" />
                <span className="text-sm font-medium text-dune">Group By</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedGroupCategories.length > 0 && (
                  <span className="text-xs text-dusty-rose font-medium">
                    {selectedGroupCategories.length}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-sage" />
              </div>
            </button>
          )}
          {filterCategories.length > 0 && (
            <button
              onClick={() => setCurrentView("filters")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-dune" />
                <span className="text-sm font-medium text-dune">Filters</span>
              </div>
              <div className="flex items-center gap-2">
                {(selectedTagIds.length + selectedTeamMemberIds.length) > 0 && (
                  <span className="text-xs text-dusty-rose font-medium">
                    {selectedTagIds.length + selectedTeamMemberIds.length}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-sage" />
              </div>
            </button>
          )}
          <button
            onClick={() => setCurrentView("actions")}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-dusty-rose" />
              <span className="text-sm font-medium text-dune">Quick Actions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-sage" />
          </button>
        </>
      )}
    </div>
  )

  const renderCollectionsMenu = () => (
    <div className="space-y-1">
      <div className="px-4 py-3 border-b border-sage/10 flex items-center gap-2">
        <button
          onClick={handleBackToMain}
          className="p-1 hover:bg-sage/10 rounded-full transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-sage" />
        </button>
        <span className="text-sm font-semibold text-dune">Collections</span>
      </div>
      <button
        onClick={() => {
          onSelectCollection?.(null)
          handleClose()
        }}
        className={clsx(
          "w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors",
          !activeCollectionId && "bg-dusty-rose/10"
        )}
      >
        <span className={clsx(
          "text-sm",
          !activeCollectionId ? "text-dusty-rose font-medium" : "text-dune"
        )}>
          All Assets
        </span>
        {!activeCollectionId && (
          <div className="w-2 h-2 rounded-full bg-dusty-rose" />
        )}
      </button>
      {collections.map((collection) => (
        <button
          key={collection.id}
          onClick={() => {
            onSelectCollection?.(collection.id)
            handleClose()
          }}
          className={clsx(
            "w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors",
            activeCollectionId === collection.id && "bg-dusty-rose/10"
          )}
        >
          <span className={clsx(
            "text-sm",
            activeCollectionId === collection.id ? "text-dusty-rose font-medium" : "text-dune"
          )}>
            {collection.name}
          </span>
          {activeCollectionId === collection.id && (
            <div className="w-2 h-2 rounded-full bg-dusty-rose" />
          )}
        </button>
      ))}
      {onCreateCollection && (
        <button
          onClick={() => {
            onCreateCollection()
            handleClose()
          }}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-warm-sand/50 transition-colors border-t border-sage/10"
        >
          <span className="text-sm font-medium text-dusty-rose">+ New Collection</span>
        </button>
      )}
    </div>
  )

  const renderGroupByMenu = () => (
    <div className="space-y-1">
      <div className="px-4 py-3 border-b border-sage/10 flex items-center gap-2">
        <button
          onClick={handleBackToMain}
          className="p-1 hover:bg-sage/10 rounded-full transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-sage" />
        </button>
        <span className="text-sm font-semibold text-dune">Group By</span>
      </div>
      {allGroupCategories.map((cat) => {
        const isSelected = selectedGroupCategories.includes(cat.name)
        const isDisabled = !isSelected && selectedGroupCategories.length >= maxGroupSelections

        return (
          <button
            key={cat.id}
            onClick={() => {
              if (!isDisabled) {
                onGroupCategoryToggle?.(cat.name)
                handleClose()
              }
            }}
            disabled={isDisabled}
            className={clsx(
              "w-full flex items-center justify-between px-4 py-3 transition-colors",
              isSelected && "bg-dusty-rose/10",
              !isDisabled && "hover:bg-warm-sand/50",
              isDisabled && "opacity-40 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color || "#A19781" }}
              />
              <span className={clsx(
                "text-sm",
                isSelected ? "text-dusty-rose font-medium" : "text-dune"
              )}>
                {cat.displayName}
              </span>
            </div>
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-dusty-rose" />
            )}
          </button>
        )
      })}
      {selectedGroupCategories.length < maxGroupSelections && (
        <div className="px-4 py-2 border-t border-sage/10">
          <p className="text-xs text-sage/60">
            Select up to {maxGroupSelections} categories
          </p>
        </div>
      )}
    </div>
  )

  const renderFiltersMenu = () => {
    // Check if we're showing Team members
    if (expandedCategory === 'team') {
      return (
        <div className="space-y-1">
          <div className="px-4 py-3 border-b border-sage/10 flex items-center gap-2">
            <button
              onClick={() => setExpandedCategory(null)}
              className="p-1 hover:bg-sage/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-sage" />
            </button>
            <span className="text-sm font-semibold text-dune">Team</span>
          </div>
          {teamMembers.map((member) => {
            const isSelected = selectedTeamMemberIds.includes(member.id)
            return (
              <button
                key={member.id}
                onClick={() => {
                  onTeamMemberToggle?.(member.id)
                  handleClose()
                }}
                className={clsx(
                  "w-full flex items-center gap-2 px-4 py-3 hover:bg-warm-sand/50 transition-colors",
                  isSelected && "bg-dusty-rose/10"
                )}
              >
                {member.imageUrl && !member.imageUrl.includes('placeholder') ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-cream/30 flex-shrink-0">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      style={
                        member.cropCloseUpCircle
                          ? {
                              objectPosition: `${member.cropCloseUpCircle.x}% ${member.cropCloseUpCircle.y}%`,
                              transform: `scale(${member.cropCloseUpCircle.scale})`
                            }
                          : {
                              objectPosition: 'center 25%',
                              transform: 'scale(2)'
                            }
                      }
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-warm-sand/40 border border-cream/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-sage/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                )}
                <span className={clsx(
                  "text-sm flex-1 text-left",
                  isSelected ? "text-dusty-rose font-medium" : "text-dune"
                )}>
                  {member.name}
                </span>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-dusty-rose flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )
    }

    if (expandedCategory) {
      const category = filterCategories.find(c => c.id === expandedCategory)
      if (!category) return null

      return (
        <div className="space-y-1">
          <div className="px-4 py-3 border-b border-sage/10 flex items-center gap-2">
            <button
              onClick={() => setExpandedCategory(null)}
              className="p-1 hover:bg-sage/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-sage" />
            </button>
            <span className="text-sm font-semibold text-dune">{category.displayName}</span>
          </div>
          {category.tags?.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => {
                  onTagToggle?.(tag.id)
                  handleClose()
                }}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors",
                  isSelected && "bg-dusty-rose/10"
                )}
              >
                <span className={clsx(
                  "text-sm",
                  isSelected ? "text-dusty-rose font-medium" : "text-dune"
                )}>
                  {tag.displayName}
                </span>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-dusty-rose" />
                )}
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <div className="space-y-1">
        <div className="px-4 py-3 border-b border-sage/10 flex items-center gap-2">
          <button
            onClick={handleBackToMain}
            className="p-1 hover:bg-sage/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-sage" />
          </button>
          <span className="text-sm font-semibold text-dune">Filters</span>
        </div>
        {/* Team filter category */}
        {teamMembers.length > 0 && (
          <button
            onClick={() => setExpandedCategory('team')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#BCC9C2" }}
              />
              <span className="text-sm text-dune">Team</span>
            </div>
            <ChevronRight className="w-4 h-4 text-sage" />
          </button>
        )}
        {/* Tag filter categories */}
        {filterCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setExpandedCategory(cat.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color || "#A19781" }}
              />
              <span className="text-sm text-dune">{cat.displayName}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-sage" />
          </button>
        ))}
      </div>
    )
  }

  const renderActionsMenu = () => (
    <div className="space-y-1">
      <div className="px-4 py-3 border-b border-sage/10 flex items-center gap-2">
        <button
          onClick={handleBackToMain}
          className="p-1 hover:bg-sage/10 rounded-full transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-sage" />
        </button>
        <span className="text-sm font-semibold text-dune">Quick Actions</span>
      </div>
      {onOpenCommandPalette && (
        <button
          onClick={() => {
            onOpenCommandPalette()
            handleClose()
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-sand/50 transition-colors"
        >
          <Sparkles className="w-5 h-5 text-dusty-rose" />
          <span className="text-sm font-medium text-dune">Command Palette</span>
        </button>
      )}
      {showGridToggle && (
        <button
          onClick={() => {
            onToggleGridView?.()
            handleClose()
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-sand/50 transition-colors"
        >
          {gridViewMode === "square" ? (
            <>
              <LayoutGrid className="w-5 h-5 text-dune" />
              <span className="text-sm font-medium text-dune">Switch to Masonry</span>
            </>
          ) : (
            <>
              <Grid3x3 className="w-5 h-5 text-dune" />
              <span className="text-sm font-medium text-dune">Switch to Square Grid</span>
            </>
          )}
        </button>
      )}
      {onOpenCardSettings && (
        <button
          onClick={() => {
            onOpenCardSettings()
            handleClose()
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-sand/50 transition-colors"
        >
          <CreditCard className="w-5 h-5 text-dune" />
          <span className="text-sm font-medium text-dune">Card Settings</span>
        </button>
      )}
    </div>
  )

  const renderClearMenu = () => (
    <div className="space-y-1">
      <div className="px-4 py-3 border-b border-sage/10 flex items-center gap-2">
        <button
          onClick={handleBackToMain}
          className="p-1 hover:bg-sage/10 rounded-full transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-sage" />
        </button>
        <span className="text-sm font-semibold text-dune">Clear All</span>
      </div>

      {/* Clear All button */}
      <button
        onClick={() => {
          onClearFiltersAndGroups?.()
          handleClose()
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-sand/50 transition-colors border-b border-sage/10"
      >
        <span className="text-sm font-semibold text-dusty-rose">Clear All ({activeFilters.length})</span>
      </button>

      {/* Individual filters and groups */}
      {activeFilters.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (item.type === 'group') {
              onGroupCategoryToggle?.(item.id)
            } else {
              // It's a filter - check if it's a tag or team member
              if (selectedTagIds.includes(item.id)) {
                onTagToggle?.(item.id)
              } else {
                onTeamMemberToggle?.(item.id)
              }
            }
            // Don't close - let users clear multiple items
          }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-warm-sand/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-sage/60 uppercase tracking-wide min-w-[50px]">
              {item.type === 'group' ? 'Group' : 'Filter'}
            </span>
            <span className="text-sm text-dune">{item.name}</span>
          </div>
          <X className="w-4 h-4 text-dusty-rose" />
        </button>
      ))}
    </div>
  )

  const renderCurrentView = () => {
    switch (currentView) {
      case "collections":
        return renderCollectionsMenu()
      case "groupby":
        return renderGroupByMenu()
      case "filters":
        return renderFiltersMenu()
      case "actions":
        return renderActionsMenu()
      case "clear":
        return renderClearMenu()
      default:
        return renderMainMenu()
    }
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "fixed bottom-1/2 translate-y-1/2 right-6 z-50 w-14 h-14 shadow-2xl transition-all duration-300",
          "flex items-center justify-center",
          "bg-gradient-to-br from-dusty-rose to-dusty-rose/90",
          "border border-cream/20",
          "hover:scale-110 active:scale-95",
          isOpen && "rotate-45"
        )}
        style={{
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(194, 158, 148, 0.4)',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-cream" />
        ) : (
          <Sparkles className="w-6 h-6 text-cream" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={clsx(
            "fixed bottom-1/2 translate-y-[calc(50%-80px)] right-6 z-40 w-72 max-h-[70vh] overflow-y-auto",
            "rounded-2xl shadow-2xl",
            "backdrop-blur-md",
            "animate-in slide-in-from-bottom-4 fade-in duration-200"
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 248, 246, 0.98) 100%)',
            border: '1px solid rgba(161, 151, 129, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}
        >
          {renderCurrentView()}
        </div>
      )}
    </>,
    document.body
  )
}
