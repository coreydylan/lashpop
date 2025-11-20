"use client"

/* eslint-disable @next/next/no-img-element */

import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from "react"
import clsx from "clsx"
import {
  Search,
  Sparkles,
  Tags,
  Users2,
  Layers,
  Eye,
  Share2,
  Wand2,
  Filter
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface CommandItem {
  id: string
  label: string
  group: string
  description?: string
  badge?: string
  isActive?: boolean
  disabled?: boolean
  onSelect: () => void
  avatarUrl?: string
}

interface OmniCommandPaletteProps {
  open: boolean
  query: string
  onQueryChange: (value: string) => void
  onClose: () => void
  items: CommandItem[]
  isMobile: boolean
  mode?: 'normal' | 'edit' | 'card-settings'
  onModeChange?: (mode: 'normal' | 'edit' | 'card-settings') => void
  tagCategories?: any[]
  onTagCategoriesChange?: (categories: any[]) => void
  visibleCardTags?: string[]
  onVisibleCardTagsChange?: (tagIds: string[]) => void
  contextSummary?: {
    selectionCount: number
    filterCount: number
    totalAssets: number
    activeAssetName?: string
  }
}

export function OmniCommandPalette({
  open,
  query,
  onQueryChange,
  onClose,
  items,
  isMobile,
  mode = 'normal',
  onModeChange,
  tagCategories = [],
  onTagCategoriesChange,
  visibleCardTags = [],
  onVisibleCardTagsChange,
  contextSummary
}: OmniCommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const trimmedQuery = query.trim()

  console.log('OmniCommandPalette render', { open, isMobile, isSearchActive })

  // Wrap onClose to log when it's called
  const handleClose = useCallback(() => {
    console.log('onClose called - command palette closing')
    console.trace('onClose call stack')
    onClose()
  }, [onClose])

  // Edit mode state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [unsavedChanges, setUnsavedChanges] = useState<Map<string, any>>(new Map())

  const getGroupMeta = (groupName: string): { icon: LucideIcon; description: string } => {
    switch (groupName) {
      case "Tag":
        return { icon: Tags, description: "Apply tags to photos" }
      case "Set Tag":
        return { icon: Tags, description: "Replace tags on selection" }
      case "Filter by Tag":
        return { icon: Filter, description: "Narrow the gallery by tags" }
      case "Set Team Member":
        return { icon: Users2, description: "Assign a featured artist" }
      case "Filter by Team":
        return { icon: Users2, description: "Filter by team member" }
      case "Selection":
        return { icon: Wand2, description: "Manage photo selections" }
      case "Select by Filter":
        return { icon: Wand2, description: "Build selections based on tags and team" }
      case "Filters":
        return { icon: Filter, description: "Reset or tweak active filters" }
      case "Grouping":
        return { icon: Layers, description: "Change how the grid clusters photos" }
      case "View":
        return { icon: Eye, description: "Adjust gallery layout or density" }
      case "Actions":
        return { icon: Share2, description: "Open supporting utilities" }
      case "Photo Tools":
        return { icon: Wand2, description: "Photo management actions" }
      case "Current Tags":
        return { icon: Tags, description: "Remove existing tags" }
      default:
        return { icon: Tags, description: "Quick DAM action" }
    }
  }

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    return items.filter(item => {
      // Include group name, label, description, and badge in search
      const target = `${item.group} ${item.label} ${item.description ?? ""} ${item.badge ?? ""}`.toLowerCase()
      return target.includes(normalized)
    })
  }, [items, query])
  const showCategoryGrid = !trimmedQuery && !activeGroup

  const scopedItems = useMemo(() => {
    if (showCategoryGrid) {
      return []
    }
    if (activeGroup) {
      return filteredItems.filter(item => item.group === activeGroup)
    }
    return filteredItems
  }, [filteredItems, activeGroup, showCategoryGrid])

  const grouped = useMemo(() => {
    return scopedItems.reduce<Record<string, CommandItem[]>>((acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group].push(item)
      return acc
    }, {})
  }, [scopedItems])

  const allGroups = useMemo(() => {
    return items.reduce<Record<string, CommandItem[]>>((acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group].push(item)
      return acc
    }, {})
  }, [items])

  const flatList = scopedItems
  const indexLookup = useMemo(() => {
    const map = new Map<string, number>()
    flatList.forEach((entry, index) => map.set(entry.id, index))
    return map
  }, [flatList])

  useEffect(() => {
    if (open) {
      setActiveIndex(0)
      // Only auto-focus on desktop - on mobile, user must tap to search
      if (!isMobile) {
        const id = requestAnimationFrame(() => inputRef.current?.focus())
        return () => cancelAnimationFrame(id)
      }
    } else {
      // Reset search state when closing
      setIsSearchActive(false)
    }
  }, [open, isMobile])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!open) return
      if (event.key === "Escape") {
        event.preventDefault()
        handleClose()
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        if (flatList.length === 0) return
        setActiveIndex(prev => {
          if (event.key === "ArrowDown") {
            return (prev + 1) % flatList.length
          }
          return (prev - 1 + flatList.length) % flatList.length
        })
      }
      if (event.key === "Enter") {
        event.preventDefault()
        const item = flatList[activeIndex]
        if (item && !item.disabled) {
          item.onSelect()
          handleClose()
        }
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, flatList, activeIndex, handleClose])

  useEffect(() => {
    if (!open) {
      onQueryChange("")
      setActiveGroup(null)
    }
  }, [open, onQueryChange])

  useEffect(() => {
    if (trimmedQuery.length > 0 && activeGroup) {
      setActiveGroup(null)
    }
  }, [trimmedQuery, activeGroup])

  if (!open) return null

  const contextLabel = contextSummary
    ? (() => {
        const filterLabel = `${contextSummary.filterCount} filter${contextSummary.filterCount === 1 ? "" : "s"}`
        if (contextSummary.selectionCount > 0) {
          return `${contextSummary.selectionCount} selected · ${filterLabel}`
        }
        if (contextSummary.activeAssetName) {
          return `Editing ${contextSummary.activeAssetName} · ${filterLabel}`
        }
        return `${contextSummary.totalAssets} assets · ${filterLabel}`
      })()
    : undefined

  const renderActionButton = (item: CommandItem) => {
    const index = indexLookup.get(item.id) ?? -1
    const isActive = index === activeIndex
    return (
      <button
        key={item.id}
        disabled={item.disabled}
        onClick={() => {
          if (item.disabled) return
          item.onSelect()
          handleClose()
        }}
        className={clsx(
          "flex items-center gap-3 rounded-2xl border text-left transition shadow-sm min-w-[210px]",
          // Better touch targets on mobile
          isMobile ? "px-4 py-3" : "px-4 py-2",
          isActive ? "border-dusty-rose/60 bg-dusty-rose/10" : "border-sage/15 bg-white/90",
          item.disabled ? "opacity-40 cursor-not-allowed" : "hover:border-dusty-rose/50 hover:bg-dusty-rose/5 active:scale-[0.98]"
        )}
      >
        {item.avatarUrl && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-cream/60 flex-shrink-0">
            <img
              src={item.avatarUrl}
              alt={item.label}
              className="w-full h-full object-cover block"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-dune">
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="text-[10px] uppercase tracking-widest text-sage/70 bg-sage/10 rounded-full px-2 py-0.5">
                {item.badge}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-sage/70 mt-0.5 truncate">{item.description}</p>
          )}
        </div>
      </button>
    )
  }

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[9999] flex bg-black/40 backdrop-blur-sm",
        isMobile ? "items-end" : "items-start justify-center pt-16"
      )}
      onTouchStart={(e) => {
        console.log('Backdrop onTouchStart', { target: e.target, currentTarget: e.currentTarget, isBackdrop: e.target === e.currentTarget })
        // Only close if touching the backdrop itself, not children
        if (e.target === e.currentTarget) {
          console.log('Closing from backdrop touch')
          handleClose()
        }
      }}
      onClick={(e) => {
        console.log('Backdrop onClick', { target: e.target, currentTarget: e.currentTarget, isBackdrop: e.target === e.currentTarget })
        // Only close if clicking the backdrop itself, not children
        if (e.target === e.currentTarget) {
          console.log('Closing from backdrop click')
          handleClose()
        }
      }}
    >
      <div
        className={clsx(
          "bg-cream text-dune shadow-2xl border border-sage/15 flex flex-col",
          isMobile
            ? "w-full rounded-t-[28px] pb-safe-bottom"
            : "w-full max-w-2xl rounded-[32px]",
          // Dynamic height based on search state on mobile
          isMobile && isSearchActive
            ? "max-h-[50vh]" // Smaller when keyboard is up
            : "max-h-[80vh]"  // Larger when keyboard is down
        )}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-sage/10" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-sage/70">
                <Sparkles className="w-3.5 h-3.5" />
                Command
              </div>
              {contextLabel && (
                <p className="text-sm text-dune/70 mt-1">{contextLabel}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeGroup && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveGroup(null)
                    setActiveIndex(0)
                  }}
                  className="text-xs font-semibold text-dusty-rose bg-dusty-rose/10 border border-dusty-rose/20 rounded-full px-3 py-1 transition hover:bg-dusty-rose/15"
                >
                  All actions
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1 text-xs text-sage/80 border border-sage/30 rounded-full px-2 py-1">
                esc
              </div>
            </div>
          </div>
          <div
            className={clsx(
              "mt-4 flex items-center gap-3 rounded-[20px] border bg-cream/80 shadow-inner transition-all",
              isMobile && !isSearchActive
                ? "border-sage/20 cursor-pointer hover:border-sage/30"
                : "border-sage/20"
            )}
            onTouchStart={(e) => {
              console.log('Search wrapper onTouchStart', { target: e.target, currentTarget: e.currentTarget })
              e.preventDefault() // Prevent default touch behavior
              e.stopPropagation() // Prevent touch from bubbling
            }}
            onClick={(e) => {
              console.log('Search wrapper onClick', { target: e.target, currentTarget: e.currentTarget, isMobile, isSearchActive })
              e.preventDefault() // Prevent default click behavior
              e.stopPropagation() // Prevent closing the palette
              if (isMobile && !isSearchActive) {
                console.log('Activating search...')
                setIsSearchActive(true)
                // Small delay to ensure state updates before focusing
                setTimeout(() => inputRef.current?.focus(), 100)
              }
            }}
          >
            <div className="flex items-center gap-3 flex-1 px-4 py-2.5">
              <Search className="w-4 h-4 text-sage/70 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setActiveIndex(0)
                  onQueryChange(event.target.value)
                }}
                onTouchStart={(e) => {
                  console.log('Input onTouchStart', { target: e.target, currentTarget: e.currentTarget })
                  e.preventDefault() // Prevent default touch behavior
                  e.stopPropagation() // Prevent touch from bubbling
                  if (isMobile && !isSearchActive) {
                    console.log('Input touch activating search...')
                    setIsSearchActive(true)
                    // Small delay to ensure state updates before focusing
                    setTimeout(() => inputRef.current?.focus(), 100)
                  }
                }}
                onClick={(e) => {
                  console.log('Input onClick', { target: e.target, currentTarget: e.currentTarget, isMobile, isSearchActive })
                  e.preventDefault() // Prevent default click behavior
                  e.stopPropagation() // Prevent closing palette on input click
                  if (isMobile && !isSearchActive) {
                    console.log('Input click activating search...')
                    setIsSearchActive(true)
                  }
                }}
                onFocus={(e) => {
                  console.log('Input onFocus', { isMobile, isSearchActive })
                  e.stopPropagation() // Prevent closing palette on focus
                  if (isMobile) setIsSearchActive(true)
                }}
                placeholder={isMobile && !isSearchActive ? "Tap to search…" : "Search tags, team, actions…"}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-sage/60"
                readOnly={isMobile && !isSearchActive}
              />
            </div>
            {isMobile && isSearchActive ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.blur()
                  setIsSearchActive(false)
                  onQueryChange("")
                }}
                className="px-4 py-2.5 text-sm font-semibold text-dusty-rose hover:text-dusty-rose/80 transition-colors flex-shrink-0"
              >
                Done
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] uppercase tracking-wider text-sage/60 pr-4">
                <span>/</span>
                <span>cmd</span>
                <span>k</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1 py-3">
          {mode === 'card-settings' ? (
            <div className="px-4 space-y-3">
              <div className="px-2 pb-2">
                <h3 className="text-sm font-semibold text-dune mb-1">Card Tag Visibility</h3>
                <p className="text-xs text-sage/70">Select which tags appear on asset thumbnails</p>
              </div>

              {/* Show All button - only show when some tags are hidden */}
              {visibleCardTags.length > 0 && (
                <button
                  onClick={() => {
                    if (onVisibleCardTagsChange) {
                      onVisibleCardTagsChange([]) // Reset to show all
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dusty-rose/40 bg-dusty-rose/10 px-4 py-2.5 text-left transition hover:bg-dusty-rose/20 hover:shadow-sm"
                >
                  <svg className="w-4 h-4 text-dusty-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-semibold text-dusty-rose">Show All Tags (Reset)</span>
                </button>
              )}

              {/* Team Member option */}
              {(() => {
                const isVisible = visibleCardTags.length === 0 || visibleCardTags.includes('team')
                return (
                  <button
                    key="team"
                    onClick={() => {
                      if (!onVisibleCardTagsChange) return

                      if (visibleCardTags.length === 0) {
                        // Was showing all, now hide team by showing all categories except team
                        const allCategoryIds = tagCategories
                          .filter(cat => cat.isCollection !== true && cat.isRating !== true)
                          .map(cat => cat.id)
                        onVisibleCardTagsChange(allCategoryIds)
                      } else if (visibleCardTags.includes('team')) {
                        // Remove team member from visible list
                        const newVisible = visibleCardTags.filter(id => id !== 'team')
                        // If removing this would leave us with ALL categories selected, reset to show all (empty array)
                        const allCategoryIds = tagCategories
                          .filter(cat => cat.isCollection !== true && cat.isRating !== true)
                          .map(cat => cat.id)
                        const allPossibleIds = ['team', ...allCategoryIds]
                        if (newVisible.length === allPossibleIds.length - 1 &&
                            allPossibleIds.every(id => id === 'team' || newVisible.includes(id))) {
                          onVisibleCardTagsChange([]) // Reset to show all
                        } else {
                          onVisibleCardTagsChange(newVisible)
                        }
                      } else {
                        // Add team member to visible list
                        onVisibleCardTagsChange([...visibleCardTags, 'team'])
                      }
                    }}
                    className="w-full flex items-center gap-3 rounded-2xl border border-sage/20 bg-white/70 px-4 py-3 text-left transition hover:border-dusty-rose/40 hover:shadow-sm"
                  >
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition"
                      style={{
                        borderColor: isVisible ? '#C4A587' : '#E5E0D8',
                        backgroundColor: isVisible ? '#C4A587' : 'transparent'
                      }}
                    >
                      {isVisible && (
                        <svg className="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-dune">Team Member</div>
                      <div className="text-xs text-sage/70 mt-0.5">Show artist attribution on cards</div>
                    </div>
                  </button>
                )
              })()}

              {/* Tag categories */}
              {tagCategories
                .filter(cat => cat.isCollection !== true && cat.isRating !== true)
                .map((category: any) => {
                  const isVisible = visibleCardTags.length === 0 || visibleCardTags.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        if (!onVisibleCardTagsChange) return

                        if (visibleCardTags.length === 0) {
                          // Was showing all, now hide this category by showing all others (including team)
                          const allOtherIds = [
                            'team',
                            ...tagCategories
                              .filter(cat => cat.isCollection !== true && cat.isRating !== true && cat.id !== category.id)
                              .map(cat => cat.id)
                          ]
                          onVisibleCardTagsChange(allOtherIds)
                        } else if (visibleCardTags.includes(category.id)) {
                          // Remove this category from visible list
                          const newVisible = visibleCardTags.filter(id => id !== category.id)
                          // If removing this would leave us with ALL categories selected, reset to show all (empty array)
                          const allCategoryIds = tagCategories
                            .filter(cat => cat.isCollection !== true && cat.isRating !== true)
                            .map(cat => cat.id)
                          const allPossibleIds = ['team', ...allCategoryIds]
                          if (newVisible.length === allPossibleIds.length - 1 &&
                              allPossibleIds.every(id => id === category.id || newVisible.includes(id))) {
                            onVisibleCardTagsChange([])
                          } else {
                            onVisibleCardTagsChange(newVisible)
                          }
                        } else {
                          // Add this category to visible list
                          onVisibleCardTagsChange([...visibleCardTags, category.id])
                        }
                      }}
                      className="w-full flex items-center gap-3 rounded-2xl border border-sage/20 bg-white/70 px-4 py-3 text-left transition hover:border-dusty-rose/40 hover:shadow-sm"
                    >
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition"
                        style={{
                          borderColor: isVisible ? (category.color || '#A19781') : '#E5E0D8',
                          backgroundColor: isVisible ? (category.color || '#A19781') : 'transparent'
                        }}
                      >
                        {isVisible && (
                          <svg className="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-dune">{category.displayName}</div>
                        {category.description && (
                          <div className="text-xs text-sage/70 mt-0.5">{category.description}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
            </div>
          ) : (
            <>
              {flatList.length === 0 && !showCategoryGrid && (
                <div className="px-6 py-12 text-center text-sm text-sage/70">
                  No matches yet. Try another keyword.
                </div>
              )}

              {showCategoryGrid ? (
            <div className="grid gap-3 px-4 pb-6 sm:grid-cols-2">
              {Object.entries(allGroups).map(([groupName, groupItems]) => {
                const meta = getGroupMeta(groupName)
                const Icon = meta.icon
                return (
                  <button
                    key={groupName}
                    onClick={() => {
                      setActiveGroup(groupName)
                      setActiveIndex(0)
                    }}
                    className={clsx(
                      "flex items-center justify-between rounded-3xl border border-sage/20 bg-white/70 text-left shadow-sm transition hover:border-dusty-rose/40 hover:shadow active:scale-[0.98]",
                      isMobile ? "px-5 py-5" : "px-5 py-4"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-dune">
                        <Icon className="w-4 h-4 text-dusty-rose" />
                        {groupName}
                      </div>
                      <p className="text-xs text-sage/70 mt-1">
                        {meta.description}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-sage/70 bg-sage/10 rounded-full px-2 py-0.5">
                      {groupItems.length}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            Object.entries(grouped).map(([groupName, groupItems]) => {
              const meta = getGroupMeta(groupName)

              // Group items by category prefix for better organization
              const categorizedItems = groupItems.reduce<Record<string, CommandItem[]>>((acc, item) => {
                // Extract category from label if it contains a separator
                const category = item.label.includes(' › ')
                  ? item.label.split(' › ')[0]
                  : item.badge || 'Other'
                if (!acc[category]) acc[category] = []
                acc[category].push(item)
                return acc
              }, {})

              const hasMultipleCategories = Object.keys(categorizedItems).length > 1

              return (
                <div key={groupName} className="px-4 pb-4">
                  <div className="rounded-3xl border border-sage/20 bg-white/85 shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-dune">{groupName}</p>
                        <p className="text-xs text-sage/70 mt-0.5">{meta.description}</p>
                      </div>
                      {(!activeGroup || activeGroup !== groupName) && groupItems.length > 3 && (
                        <button
                          onClick={() => {
                            setActiveGroup(groupName)
                            setActiveIndex(0)
                          }}
                          className="text-xs font-semibold text-dusty-rose border border-dusty-rose/30 rounded-full px-3 py-1 hover:bg-dusty-rose/10 transition"
                        >
                          Focus
                        </button>
                      )}
                    </div>
                    {hasMultipleCategories ? (
                      <div className="space-y-3">
                        {Object.entries(categorizedItems)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([category, items], index) => (
                            <div key={category}>
                              {index > 0 && <div className="border-t border-sage/10 pt-2 mb-2" />}
                              <div className="text-[10px] uppercase tracking-widest text-sage/60 mb-1.5 px-1">
                                {category}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {items.map(renderActionButton)}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {groupItems.map(renderActionButton)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
