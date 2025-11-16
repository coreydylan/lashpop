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
import { FilterSelector } from "./FilterSelector"
import { GroupBySelector } from "./GroupBySelector"

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
  assets?: FilterAsset[]

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

type MenuView = "main" | "collections" | "groupby" | "filters" | "actions"

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
  assets = [],
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

  // Render different menu views
  const renderMainMenu = () => (
    <div className="space-y-1">
      {selectedCount > 0 ? (
        <>
          {/* Selection mode */}
          <div className="px-4 py-3 border-b border-sage/10">
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
            <div className="px-4 py-2">
              <GroupBySelector
                categories={groupCategories}
                hasTeamMembers={hasTeamMembers}
                selectedCategories={selectedGroupCategories}
                onCategoryToggle={(cat) => {
                  onGroupCategoryToggle?.(cat)
                  handleClose()
                }}
                maxSelections={maxGroupSelections}
              />
            </div>
          )}
          {filterCategories.length > 0 && (
            <div className="px-4 py-2">
              <FilterSelector
                categories={filterCategories}
                teamMembers={teamMembers}
                selectedTagIds={selectedTagIds}
                selectedTeamMemberIds={selectedTeamMemberIds}
                onTagToggle={(tagId) => {
                  onTagToggle?.(tagId)
                  handleClose()
                }}
                onTeamMemberToggle={(memberId) => {
                  onTeamMemberToggle?.(memberId)
                  handleClose()
                }}
                assets={assets}
              />
            </div>
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
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
          "flex items-center justify-center",
          "bg-gradient-to-br from-dusty-rose to-dusty-rose/90",
          "border border-cream/20",
          "hover:scale-110 active:scale-95",
          isOpen && "rotate-45"
        )}
        style={{
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
            "fixed bottom-24 right-6 z-40 w-72 max-h-[70vh] overflow-y-auto",
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
