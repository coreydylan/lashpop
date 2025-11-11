"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, ChevronLeft } from "lucide-react"

interface FilterOption {
  id: string
  name: string
  displayName: string
  imageUrl?: string
  cropCloseUpCircle?: {
    x: number
    y: number
    scale: number
  }
}

interface FilterCategory {
  id: string
  name: string
  displayName: string
  color?: string
  options: FilterOption[]
}

interface ActiveFilter {
  categoryId: string
  categoryName: string
  categoryDisplayName: string
  categoryColor?: string
  optionId: string
  optionName: string
  optionDisplayName: string
  imageUrl?: string
}

interface FilterAsset {
  id: string
  teamMemberId?: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
    category: {
      id: string
      name: string
      displayName: string
      color?: string
    }
  }>
}

interface FilterSelectorProps {
  activeFilters: ActiveFilter[]
  onFiltersChange: (filters: ActiveFilter[]) => void
  assets?: FilterAsset[]
}

export function FilterSelector({ activeFilters, onFiltersChange, assets = [] }: FilterSelectorProps) {
  const [categories, setCategories] = useState<FilterCategory[]>([])
  const [teamMembers, setTeamMembers] = useState<FilterOption[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  useEffect(() => {
    fetchFilterCategories()
    fetchTeamMembers()
  }, [])

  const optionCounts = useMemo(() => {
    const counts = new Map<string, number>()

    assets.forEach((asset) => {
      if (asset.teamMemberId) {
        const key = `team-${asset.teamMemberId}`
        counts.set(key, (counts.get(key) || 0) + 1)
      }

      asset.tags?.forEach((tag) => {
        const key = `tag-${tag.id}`
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })

    return counts
  }, [assets])

  const fetchFilterCategories = async () => {
    try {
      const response = await fetch("/api/dam/tags")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch filter categories:", error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/dam/team-members")
      const data = await response.json()
    const members = (data.teamMembers || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      displayName: m.name,
      imageUrl: m.imageUrl,
      cropCloseUpCircle: m.cropCloseUpCircle
    }))
      setTeamMembers(members)
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }

  const handleAddFilter = (category: FilterCategory, option: FilterOption) => {
    // Check if this exact filter already exists
    const exists = activeFilters.some(
      (f) => f.categoryId === category.id && f.optionId === option.id
    )
    if (exists) return

    const newFilter: ActiveFilter = {
      categoryId: category.id,
      categoryName: category.name,
      categoryDisplayName: category.displayName,
      categoryColor: category.color,
      optionId: option.id,
      optionName: option.name,
      optionDisplayName: option.displayName
    }

    onFiltersChange([...activeFilters, newFilter])
    setSelectedCategory(null)
    setIsAdding(false)
  }

  const handleAddTeamFilter = (member: any) => {
    const exists = activeFilters.some(
      (f) => f.categoryName === "team" && f.optionId === member.id
    )
    if (exists) return

    const newFilter: ActiveFilter = {
      categoryId: "team",
      categoryName: "team",
      categoryDisplayName: "Team",
      categoryColor: "#BCC9C2",
      optionId: member.id,
      optionName: member.name,
      optionDisplayName: member.displayName,
      imageUrl: member.imageUrl
    }

    onFiltersChange([...activeFilters, newFilter])
    setSelectedCategory(null)
    setIsAdding(false)
  }

  const handleRemoveFilter = (filter: ActiveFilter) => {
    onFiltersChange(
      activeFilters.filter(
        (f) => !(f.categoryId === filter.categoryId && f.optionId === filter.optionId)
      )
    )
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
  }

  const handleBackToCategories = () => {
    setSelectedCategoryId(null)
  }

  const handleCancel = () => {
    setSelectedCategoryId(null)
    setIsAdding(false)
  }

  // Combine team category with tag categories
  const allCategories = useMemo(() => {
    const mapOptions = (options: any[], keyPrefix: string) =>
      options
        .map(option => ({ ...option }))
        .filter(option => (optionCounts.get(`${keyPrefix}-${option.id}`) ?? 0) > 0)

    const teamCategory = {
      id: "team",
      name: "team",
      displayName: "Team",
      color: "#BCC9C2",
      options: mapOptions(teamMembers, "team")
    }

    const tagCategories = categories.map((cat) => ({
      ...cat,
      options: mapOptions(cat.tags || [], "tag")
    }))

    return [teamCategory, ...tagCategories]
  }, [teamMembers, categories, optionCounts])

  const selectableCategories = allCategories.filter((category) => category.options.length > 0)
  const selectedCategory = selectableCategories.find((cat) => cat.id === selectedCategoryId) || null

  useEffect(() => {
    if (selectedCategoryId && !selectedCategory) {
      setSelectedCategoryId(null)
    }
  }, [selectedCategory, selectedCategoryId])

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      {/* Active Filters - Stay on left */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {activeFilters.map((filter) => (
          <motion.div
            key={`${filter.categoryId}-${filter.optionId}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="group flex items-center gap-1 arch-full overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            style={{
              background: `linear-gradient(135deg, ${filter.categoryColor || "#A19781"} 0%, ${filter.categoryColor || "#A19781"}CC 100%)`
            }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5">
              {filter.imageUrl && (
                <div className="w-5 h-5 rounded-full overflow-hidden border border-cream/30 flex-shrink-0">
                  <img
                    src={filter.imageUrl}
                    alt={filter.optionDisplayName}
                    className="w-full h-full object-cover"
                    style={
                      filter.cropCloseUpCircle
                        ? {
                            objectPosition: `${filter.cropCloseUpCircle.x}% ${filter.cropCloseUpCircle.y}%`,
                            transform: `scale(${filter.cropCloseUpCircle.scale})`
                          }
                        : {
                            objectPosition: 'center 25%',
                            transform: 'scale(2)'
                          }
                    }
                  />
                </div>
              )}
              <span className="text-xs font-semibold text-cream uppercase tracking-wide">
                {filter.categoryDisplayName}
              </span>
              <span className="text-cream/80 text-xs">›</span>
              <span className="text-sm text-cream font-medium">
                {filter.optionDisplayName}
              </span>
            </div>
            <button
              onClick={() => handleRemoveFilter(filter)}
              className="px-2 py-1.5 hover:bg-black/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-cream" />
            </button>
          </motion.div>
        ))}

        {/* Add Filter Button - Stays on left */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border flex-shrink-0 ${
            isAdding
              ? "bg-sage text-cream border-sage"
              : "bg-sage/10 hover:bg-sage/20 text-sage border-sage/30"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Filter</span>
        </button>
      </div>

      {/* Category/Option Selector - Scrolls horizontally to the right */}
      <AnimatePresence initial={false} mode="wait">
        {isAdding && (
          <motion.div
            key={selectedCategory ? "options" : "categories"}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 overflow-x-auto flex-1 pb-2 -mb-2"
            style={{ scrollbarWidth: 'thin' }}
          >
            {selectedCategory ? (
              <>
                {/* Back button */}
                <button
                  onClick={handleBackToCategories}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-warm-sand/50 hover:bg-warm-sand text-dune transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                {/* Options */}
                {selectedCategory.options.map((option: any) => {
                  const isActive = activeFilters.some(
                    (f) => f.categoryId === selectedCategory.id && f.optionId === option.id
                  )
                  const isTeamCategory = selectedCategory.id === "team"
                  const optionKey = isTeamCategory ? `team-${option.id}` : `tag-${option.id}`
                  const optionCount = optionCounts.get(optionKey) || 0

                  return (
                    <motion.button
                      key={option.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      onClick={() =>
                        isTeamCategory
                          ? handleAddTeamFilter(option)
                          : handleAddFilter(selectedCategory as FilterCategory, option)
                      }
                      disabled={isActive}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-all shadow-sm ${
                        isActive
                          ? "bg-sage/20 text-sage/60 cursor-not-allowed"
                          : "hover:shadow-md"
                      }`}
                      style={{
                        background: isActive
                          ? undefined
                          : `linear-gradient(135deg, ${selectedCategory.color || "#A19781"} 0%, ${selectedCategory.color || "#A19781"}CC 100%)`,
                        color: isActive ? undefined : "#FAF7F1"
                      }}
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
                      <span className="text-sm whitespace-nowrap">
                        {option.displayName}
                        {isActive && " ✓"}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-white/25 text-white"}`}>
                        {optionCount}
                      </span>
                    </motion.button>
                  )
                })}
              </>
            ) : (
              <>
                {/* Categories */}
                {selectableCategories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    onClick={() => handleCategoryClick(category.id)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full bg-warm-sand/50 hover:bg-warm-sand text-dune transition-all shadow-sm hover:shadow-md"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || "#A19781" }}
                    />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {category.displayName}
                    </span>
                  </motion.button>
                ))}

                {/* Cancel button at end */}
                <button
                  onClick={handleCancel}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full bg-terracotta/20 hover:bg-terracotta/30 text-terracotta transition-colors"
                >
                  <span className="text-sm font-medium whitespace-nowrap">Cancel</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
