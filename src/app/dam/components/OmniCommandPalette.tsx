"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
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
  contextSummary
}: OmniCommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const trimmedQuery = query.trim()

  const getGroupMeta = (groupName: string): { icon: LucideIcon; description: string } => {
    if (groupName.startsWith("Set ")) {
      return {
        icon: Wand2,
        description: `Replace ${groupName.replace("Set ", "")} for the current context`
      }
    }
    if (groupName.startsWith("Filter by")) {
      return {
        icon: Filter,
        description: "Narrow the gallery instantly"
      }
    }
    switch (groupName) {
      case "Set Team Member":
        return { icon: Users2, description: "Assign a featured artist" }
      case "Selection":
        return { icon: Wand2, description: "Commit queued changes" }
      case "Filters":
        return { icon: Filter, description: "Reset or tweak active filters" }
      case "Grouping":
        return { icon: Layers, description: "Change how the grid clusters photos" }
      case "View":
        return { icon: Eye, description: "Adjust gallery layout or density" }
      case "Actions":
        return { icon: Share2, description: "Open supporting utilities" }
      default:
        return { icon: Tags, description: "Quick DAM action" }
    }
  }

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    return items.filter(item => {
      const target = `${item.label} ${item.description ?? ""}`.toLowerCase()
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
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!open) return
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
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
          onClose()
        }
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, flatList, activeIndex, onClose])

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
          onClose()
        }}
        className={clsx(
          "flex items-center gap-3 rounded-2xl border px-4 py-2 text-left transition shadow-sm min-w-[210px]",
          isActive ? "border-dusty-rose/60 bg-dusty-rose/10" : "border-sage/15 bg-white/90",
          item.disabled ? "opacity-40 cursor-not-allowed" : "hover:border-dusty-rose/50 hover:bg-dusty-rose/5"
        )}
      >
        {item.avatarUrl && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-cream/60 flex-shrink-0">
            <img
              src={item.avatarUrl}
              alt={item.label}
              className="w-full h-full object-cover"
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
      onClick={onClose}
    >
      <div
        className={clsx(
          "bg-cream text-dune shadow-2xl border border-sage/15 flex flex-col",
          isMobile
            ? "w-full rounded-t-[28px] max-h-[80vh]"
            : "w-full max-w-2xl rounded-[32px] max-h-[80vh]"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-sage/10">
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
                  onClick={() => {
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
          <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-sage/20 bg-cream/80 px-4 py-2.5 shadow-inner">
            <Search className="w-4 h-4 text-sage/70" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setActiveIndex(0)
                onQueryChange(event.target.value)
              }}
              placeholder="Search tags, team, actions…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-sage/60"
            />
            <div className="hidden sm:flex items-center gap-1 text-[11px] uppercase tracking-wider text-sage/60">
              <span>/</span>
              <span>cmd</span>
              <span>k</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1 py-3">
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
                    className="flex items-center justify-between rounded-3xl border border-sage/20 bg-white/70 px-5 py-4 text-left shadow-sm transition hover:border-dusty-rose/40 hover:shadow"
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
                    <div className="flex flex-wrap gap-2">
                      {groupItems.map(renderActionButton)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
