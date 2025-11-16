"use client"

import { useState, useMemo } from "react"
import clsx from "clsx"
import {
  Star,
  Monitor,
  FolderTree,
  BarChart3,
  X,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Clock,
  RotateCcw,
  Calendar
} from "lucide-react"
import type { CommandItem } from "./OmniCommandPalette"
import type { DamSettingsData } from "@/db/schema/dam_user_settings"

type TabId = "favorites" | "display" | "groups" | "stats"

interface CommandSettingsProps {
  open: boolean
  onClose: () => void
  settings: DamSettingsData["commandPalette"]
  onSettingsChange: (settings: Partial<DamSettingsData["commandPalette"]>) => void
  commands: CommandItem[]
}

interface Tab {
  id: TabId
  label: string
  icon: typeof Star
}

const TABS: Tab[] = [
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "display", label: "Display", icon: Monitor },
  { id: "groups", label: "Groups", icon: FolderTree },
  { id: "stats", label: "Stats", icon: BarChart3 }
]

export function CommandSettings({
  open,
  onClose,
  settings,
  onSettingsChange,
  commands
}: CommandSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("favorites")
  const [draggedFavorite, setDraggedFavorite] = useState<string | null>(null)
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null)

  // Get favorites list with full command data
  const favoriteCommands = useMemo(() => {
    return (settings?.favorites || [])
      .map(id => commands.find(cmd => cmd.id === id))
      .filter(Boolean) as CommandItem[]
  }, [settings?.favorites, commands])

  // Get all unique groups
  const allGroups = useMemo(() => {
    const groupSet = new Set<string>()
    commands.forEach(cmd => groupSet.add(cmd.group))
    return Array.from(groupSet)
  }, [commands])

  // Sort groups by custom order
  const sortedGroups = useMemo(() => {
    const order = settings?.groupOrder || []
    const orderedGroups = order.filter(g => allGroups.includes(g))
    const unorderedGroups = allGroups.filter(g => !order.includes(g))
    return [...orderedGroups, ...unorderedGroups]
  }, [allGroups, settings?.groupOrder])

  // Calculate usage statistics
  const usageStats = useMemo(() => {
    const usage = settings?.commandUsage || {}
    const entries = Object.entries(usage)
      .map(([id, data]) => {
        const command = commands.find(cmd => cmd.id === id)
        return command ? { command, ...data } : null
      })
      .filter(Boolean)
      .sort((a, b) => b!.count - a!.count)

    // Get total usage
    const totalUsage = entries.reduce((sum, entry) => sum + (entry?.count || 0), 0)

    // Get usage over last 7 days (simulated with day of week pattern)
    const dayOfWeekData = entries.reduce((acc, entry) => {
      if (entry?.dayOfWeekPattern) {
        Object.entries(entry.dayOfWeekPattern).forEach(([day, count]) => {
          acc[day] = (acc[day] || 0) + count
        })
      }
      return acc
    }, {} as Record<string, number>)

    return {
      topCommands: entries.slice(0, 10),
      totalUsage,
      dayOfWeekData
    }
  }, [settings?.commandUsage, commands])

  if (!open) return null

  const handleToggleFavorite = (commandId: string) => {
    const favorites = settings?.favorites || []
    const newFavorites = favorites.includes(commandId)
      ? favorites.filter(id => id !== commandId)
      : [...favorites, commandId]

    onSettingsChange({ favorites: newFavorites })
  }

  const handleReorderFavorites = (fromIndex: number, toIndex: number) => {
    const favorites = [...(settings?.favorites || [])]
    const [moved] = favorites.splice(fromIndex, 1)
    favorites.splice(toIndex, 0, moved)
    onSettingsChange({ favorites })
  }

  const handleReorderGroups = (fromIndex: number, toIndex: number) => {
    const groups = [...sortedGroups]
    const [moved] = groups.splice(fromIndex, 1)
    groups.splice(toIndex, 0, moved)
    onSettingsChange({ groupOrder: groups })
  }

  const handleToggleGroupVisibility = (group: string) => {
    const hidden = settings?.hiddenGroups || []
    const newHidden = hidden.includes(group)
      ? hidden.filter(g => g !== group)
      : [...hidden, group]

    onSettingsChange({ hiddenGroups: newHidden })
  }

  const handleToggleGroupCollapsed = (group: string) => {
    const collapsed = settings?.collapsedGroups || []
    const newCollapsed = collapsed.includes(group)
      ? collapsed.filter(g => g !== group)
      : [...collapsed, group]

    onSettingsChange({ collapsedGroups: newCollapsed })
  }

  const handleResetStats = () => {
    if (confirm("Are you sure you want to reset all usage statistics? This cannot be undone.")) {
      onSettingsChange({
        commandUsage: {},
        commandPairs: {}
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex bg-black/40 backdrop-blur-sm items-start justify-center pt-16"
      onClick={onClose}
    >
      <div
        className="bg-cream text-dune shadow-2xl border border-sage/15 rounded-[32px] w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-sage/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-dusty-rose/10 border border-dusty-rose/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-dusty-rose" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-dune">Command Palette Settings</h2>
                <p className="text-xs text-sage/70 mt-0.5">Customize your command experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-sage/10 hover:bg-sage/20 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 text-sage" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-5">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition",
                    isActive
                      ? "bg-white border border-sage/20 text-dune shadow-sm"
                      : "bg-transparent border border-transparent text-sage/70 hover:text-dune hover:bg-white/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "favorites" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-dune mb-1">Pinned Commands</h3>
                <p className="text-xs text-sage/70">
                  Pin your most-used commands for quick access. Drag to reorder.
                </p>
              </div>

              {favoriteCommands.length === 0 ? (
                <div className="rounded-3xl border border-sage/15 bg-white/50 p-8 text-center">
                  <Star className="w-8 h-8 text-sage/30 mx-auto mb-3" />
                  <p className="text-sm text-sage/70">No pinned commands yet</p>
                  <p className="text-xs text-sage/60 mt-1">Click the star icon on any command below to pin it</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteCommands.map((cmd, index) => (
                    <div
                      key={cmd.id}
                      draggable
                      onDragStart={() => setDraggedFavorite(cmd.id)}
                      onDragEnd={() => setDraggedFavorite(null)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (draggedFavorite && draggedFavorite !== cmd.id) {
                          const draggedIndex = favoriteCommands.findIndex(c => c.id === draggedFavorite)
                          handleReorderFavorites(draggedIndex, index)
                        }
                      }}
                      className={clsx(
                        "flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition",
                        draggedFavorite === cmd.id
                          ? "border-dusty-rose/40 opacity-50"
                          : "border-sage/15 hover:border-dusty-rose/30"
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-sage/40 cursor-grab active:cursor-grabbing" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-dune truncate">{cmd.label}</div>
                        <div className="text-xs text-sage/70 truncate">{cmd.group}</div>
                      </div>
                      <button
                        onClick={() => handleToggleFavorite(cmd.id)}
                        className="w-8 h-8 rounded-full bg-dusty-rose/10 hover:bg-dusty-rose/20 flex items-center justify-center transition"
                      >
                        <Star className="w-4 h-4 text-dusty-rose fill-dusty-rose" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-dune mb-3">All Commands</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {commands
                    .filter(cmd => !settings?.favorites?.includes(cmd.id))
                    .map(cmd => (
                      <div
                        key={cmd.id}
                        className="flex items-center gap-3 rounded-2xl border border-sage/15 bg-white/70 px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-dune truncate">{cmd.label}</div>
                          <div className="text-xs text-sage/70 truncate">{cmd.group}</div>
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(cmd.id)}
                          className="w-8 h-8 rounded-full bg-sage/10 hover:bg-dusty-rose/20 flex items-center justify-center transition group"
                        >
                          <Star className="w-4 h-4 text-sage/50 group-hover:text-dusty-rose" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "display" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-dune mb-1">Display Preferences</h3>
                <p className="text-xs text-sage/70">
                  Control how commands are organized and displayed
                </p>
              </div>

              {/* Frequently Used Section */}
              <div className="rounded-3xl border border-sage/15 bg-white/70 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dune">
                      <TrendingUp className="w-4 h-4 text-dusty-rose" />
                      Frequently Used Section
                    </div>
                    <p className="text-xs text-sage/70 mt-1">
                      Show your most-used commands at the top of the palette
                    </p>
                  </div>
                  <button
                    onClick={() => onSettingsChange({
                      showFrequentlyUsed: !settings?.showFrequentlyUsed
                    })}
                    className={clsx(
                      "relative w-12 h-6 rounded-full transition",
                      settings?.showFrequentlyUsed
                        ? "bg-dusty-rose"
                        : "bg-sage/20"
                    )}
                  >
                    <div
                      className={clsx(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition",
                        settings?.showFrequentlyUsed ? "left-[26px]" : "left-0.5"
                      )}
                    />
                  </button>
                </div>

                {settings?.showFrequentlyUsed && (
                  <div>
                    <label className="text-xs font-semibold text-dune mb-2 block">
                      Number to show: {settings?.frequentlyUsedLimit || 5}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings?.frequentlyUsedLimit || 5}
                      onChange={(e) => onSettingsChange({
                        frequentlyUsedLimit: parseInt(e.target.value)
                      })}
                      className="w-full h-2 rounded-full bg-sage/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dusty-rose"
                    />
                    <div className="flex justify-between text-xs text-sage/60 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="rounded-3xl border border-sage/15 bg-white/70 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dune">
                      <Sparkles className="w-4 h-4 text-dusty-rose" />
                      Smart Suggestions
                    </div>
                    <p className="text-xs text-sage/70 mt-1">
                      Show context-aware command suggestions based on your workflow
                    </p>
                  </div>
                  <button
                    onClick={() => onSettingsChange({
                      showSuggestions: !settings?.showSuggestions
                    })}
                    className={clsx(
                      "relative w-12 h-6 rounded-full transition",
                      settings?.showSuggestions
                        ? "bg-dusty-rose"
                        : "bg-sage/20"
                    )}
                  >
                    <div
                      className={clsx(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition",
                        settings?.showSuggestions ? "left-[26px]" : "left-0.5"
                      )}
                    />
                  </button>
                </div>

                {settings?.showSuggestions && (
                  <div>
                    <label className="text-xs font-semibold text-dune mb-2 block">
                      Suggestions to show: {settings?.suggestionCount || 3}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={settings?.suggestionCount || 3}
                      onChange={(e) => onSettingsChange({
                        suggestionCount: parseInt(e.target.value)
                      })}
                      className="w-full h-2 rounded-full bg-sage/20 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dusty-rose"
                    />
                    <div className="flex justify-between text-xs text-sage/60 mt-1">
                      <span>1</span>
                      <span>5</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-organize */}
              <div className="rounded-3xl border border-sage/15 bg-white/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dune">
                      <BarChart3 className="w-4 h-4 text-dusty-rose" />
                      Auto-organize by Usage
                    </div>
                    <p className="text-xs text-sage/70 mt-1">
                      Automatically reorder groups based on how often you use them
                    </p>
                  </div>
                  <button
                    onClick={() => onSettingsChange({
                      groupByUsage: !settings?.groupByUsage
                    })}
                    className={clsx(
                      "relative w-12 h-6 rounded-full transition",
                      settings?.groupByUsage
                        ? "bg-dusty-rose"
                        : "bg-sage/20"
                    )}
                  >
                    <div
                      className={clsx(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition",
                        settings?.groupByUsage ? "left-[26px]" : "left-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "groups" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-dune mb-1">Group Management</h3>
                <p className="text-xs text-sage/70">
                  Reorder groups, hide sections, or set groups to collapse by default
                </p>
              </div>

              <div className="space-y-2">
                {sortedGroups.map((group, index) => {
                  const isHidden = settings?.hiddenGroups?.includes(group)
                  const isCollapsed = settings?.collapsedGroups?.includes(group)
                  const commandCount = commands.filter(cmd => cmd.group === group).length

                  return (
                    <div
                      key={group}
                      draggable
                      onDragStart={() => setDraggedGroup(group)}
                      onDragEnd={() => setDraggedGroup(null)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (draggedGroup && draggedGroup !== group) {
                          const draggedIndex = sortedGroups.indexOf(draggedGroup)
                          handleReorderGroups(draggedIndex, index)
                        }
                      }}
                      className={clsx(
                        "flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition",
                        draggedGroup === group
                          ? "border-dusty-rose/40 opacity-50"
                          : "border-sage/15 hover:border-dusty-rose/30",
                        isHidden && "opacity-60"
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-sage/40 cursor-grab active:cursor-grabbing flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-dune">{group}</div>
                        <div className="text-xs text-sage/70">
                          {commandCount} command{commandCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleGroupCollapsed(group)}
                          className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition",
                            isCollapsed
                              ? "bg-dusty-rose/10 text-dusty-rose"
                              : "bg-sage/10 text-sage/50 hover:bg-sage/20"
                          )}
                          title={isCollapsed ? "Collapsed by default" : "Expanded by default"}
                        >
                          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleGroupVisibility(group)}
                          className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition",
                            isHidden
                              ? "bg-sage/10 text-sage/50 hover:bg-dusty-rose/20"
                              : "bg-dusty-rose/10 text-dusty-rose hover:bg-dusty-rose/20"
                          )}
                          title={isHidden ? "Hidden" : "Visible"}
                        >
                          {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-dune mb-1">Usage Statistics</h3>
                <p className="text-xs text-sage/70">
                  See how you use the command palette over time
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-sage/15 bg-white/70 p-4">
                  <div className="text-xs text-sage/70 mb-1">Total Commands</div>
                  <div className="text-2xl font-bold text-dune">{usageStats.totalUsage}</div>
                  <div className="text-xs text-sage/60 mt-1">All time</div>
                </div>
                <div className="rounded-2xl border border-sage/15 bg-white/70 p-4">
                  <div className="text-xs text-sage/70 mb-1">Unique Commands</div>
                  <div className="text-2xl font-bold text-dune">{usageStats.topCommands.length}</div>
                  <div className="text-xs text-sage/60 mt-1">Ever used</div>
                </div>
              </div>

              {/* Top Commands */}
              <div className="rounded-3xl border border-sage/15 bg-white/70 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-dune mb-4">
                  <TrendingUp className="w-4 h-4 text-dusty-rose" />
                  Most Used Commands
                </div>
                {usageStats.topCommands.length === 0 ? (
                  <p className="text-sm text-sage/70 text-center py-4">No usage data yet</p>
                ) : (
                  <div className="space-y-3">
                    {usageStats.topCommands.slice(0, 5).map((item, index) => {
                      const maxCount = usageStats.topCommands[0]?.count || 1
                      const percentage = ((item?.count || 0) / maxCount) * 100

                      return (
                        <div key={item?.command.id}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-dune truncate flex-1">
                              {index + 1}. {item?.command.label}
                            </span>
                            <span className="text-sage/70 ml-2">{item?.count}×</span>
                          </div>
                          <div className="h-2 rounded-full bg-sage/10 overflow-hidden">
                            <div
                              className="h-full bg-dusty-rose rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Usage Over Time (Day of Week) */}
              <div className="rounded-3xl border border-sage/15 bg-white/70 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-dune mb-4">
                  <Calendar className="w-4 h-4 text-dusty-rose" />
                  Usage by Day of Week
                </div>
                {Object.keys(usageStats.dayOfWeekData).length === 0 ? (
                  <p className="text-sm text-sage/70 text-center py-4">No usage data yet</p>
                ) : (
                  <div className="space-y-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const count = usageStats.dayOfWeekData[day] || 0
                      const maxCount = Math.max(...Object.values(usageStats.dayOfWeekData))
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

                      return (
                        <div key={day}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-dune w-12">{day}</span>
                            <span className="text-sage/70">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-sage/10 overflow-hidden">
                            <div
                              className="h-full bg-dusty-rose rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="rounded-3xl border border-sage/15 bg-white/70 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-dune mb-4">
                  <Clock className="w-4 h-4 text-dusty-rose" />
                  Recently Used
                </div>
                {usageStats.topCommands.length === 0 ? (
                  <p className="text-sm text-sage/70 text-center py-4">No usage data yet</p>
                ) : (
                  <div className="space-y-2">
                    {usageStats.topCommands
                      .sort((a, b) => {
                        const dateA = new Date(a?.lastUsed || 0)
                        const dateB = new Date(b?.lastUsed || 0)
                        return dateB.getTime() - dateA.getTime()
                      })
                      .slice(0, 5)
                      .map(item => {
                        const lastUsed = item?.lastUsed ? new Date(item.lastUsed) : null
                        const timeAgo = lastUsed
                          ? formatTimeAgo(lastUsed)
                          : "Never"

                        return (
                          <div
                            key={item?.command.id}
                            className="flex items-center justify-between text-sm py-2 border-b border-sage/10 last:border-0"
                          >
                            <span className="text-dune truncate flex-1">{item?.command.label}</span>
                            <span className="text-xs text-sage/70 ml-2">{timeAgo}</span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetStats}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dusty-rose/30 bg-dusty-rose/5 px-4 py-3 text-sm font-semibold text-dusty-rose hover:bg-dusty-rose/10 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Statistics
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sage/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-dusty-rose text-white font-semibold hover:bg-dusty-rose/90 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// Utility function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
