"use client"

import { useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import { Upload as UploadIcon, Users, X } from "lucide-react"
import Link from "next/link"
import { FileUploader } from "./components/FileUploader"
import { AssetGrid } from "./components/AssetGrid"
import { FilterSelector } from "./components/FilterSelector"
import { TagSelector } from "./components/TagSelector"
import { PhotoLightbox } from "./components/PhotoLightbox"
import { OmniBar } from "./components/OmniBar"

interface Asset {
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  uploadedAt: Date
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

interface TeamMember {
  id: string
  name: string
  imageUrl: string
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

export default function DAMPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [tagCategories, setTagCategories] = useState<any[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [uploadingAssetIds, setUploadingAssetIds] = useState<string[]>([])

  // Omni-bar state (used for both filtering and bulk tagging)
  const [omniTeamMemberId, setOmniTeamMemberId] = useState<string | undefined>()
  const [omniTags, setOmniTags] = useState<any[]>([])
  const [existingTags, setExistingTags] = useState<Map<string, number>>(new Map())

  // Grid view state
  const [gridViewMode, setGridViewMode] = useState<"square" | "aspect">("square")
  const [activeLightboxAsset, setActiveLightboxAsset] = useState<Asset | null>(null)
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(-1)
  const [singleTagDrafts, setSingleTagDrafts] = useState<any[]>([])
  const [pendingTagRemoval, setPendingTagRemoval] = useState<{
    tagId: string
    assetIds: string[]
    label: string
    count: number
    context: string
  } | null>(null)

  // Upload panel state
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Fetch initial data
  const [isMobile, setIsMobile] = useState(false)
  const [groupByTags, setGroupByTags] = useState<string[]>([])  // Track up to 2 tags for grouping

  // Helper to make colors more vibrant in lightbox mode
  const getTagColor = (color: string | undefined, isLightbox: boolean = false) => {
    const baseColor = color || "#A19781"
    if (!isLightbox) {
      return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}CC 100%)`
    }
    // In lightbox, use more saturated/vibrant version
    return `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}EE 100%)`
  }

  // Handle grouping by tag category
  const handleGroupBy = (categoryName: string) => {
    if (groupByTags.includes(categoryName)) return // Already grouping by this
    if (groupByTags.length >= 2) return // Max 2 levels
    setGroupByTags([...groupByTags, categoryName])
  }

  const handleRemoveGroupBy = (categoryName: string) => {
    setGroupByTags(groupByTags.filter(c => c !== categoryName))
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    fetchAssets()
    fetchTeamMembers()
    fetchTagCategories()

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setPendingTagRemoval(null)
    setSingleTagDrafts([])
  }, [selectedAssets, activeLightboxAsset])

  // Apply filters when activeFilters changes
  useEffect(() => {
    applyFilters(allAssets, activeFilters)
  }, [activeFilters, allAssets])

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/dam/assets")
      const data = await response.json()
      const fetchedAssets = data.assets || []
      setAllAssets(fetchedAssets)
      const filtered = applyFilters(fetchedAssets, activeFilters)
      setIsLoading(false)
      return filtered
    } catch (error) {
      console.error("Failed to fetch assets:", error)
      setIsLoading(false)
      return []
    }
  }

  const applyFilters = (assetsToFilter: Asset[], filters: ActiveFilter[]) => {
    if (filters.length === 0) {
      setAssets(assetsToFilter)
      return assetsToFilter
    }

    let filtered = assetsToFilter

    // Group filters by category
    const filtersByCategory = filters.reduce((acc, filter) => {
      if (!acc[filter.categoryName]) {
        acc[filter.categoryName] = []
      }
      acc[filter.categoryName].push(filter)
      return acc
    }, {} as Record<string, ActiveFilter[]>)

    // Apply filters (OR within category, AND across categories)
    Object.entries(filtersByCategory).forEach(([categoryName, categoryFilters]) => {
      if (categoryName === "team") {
        // Filter by team member
        const teamMemberIds = categoryFilters.map(f => f.optionId)
        filtered = filtered.filter(asset =>
          asset.teamMemberId && teamMemberIds.includes(asset.teamMemberId)
        )
      } else {
        // Filter by tags
        const tagIds = categoryFilters.map(f => f.optionId)
        filtered = filtered.filter(asset =>
          asset.tags?.some(tag => tagIds.includes(tag.id))
        )
      }
    })

    setAssets(filtered)
    return filtered
  }

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    // Only apply filters if not in selection mode
    if (selectedAssets.length === 0) {
      setActiveFilters(filters)
      applyFilters(allAssets, filters)
    }
  }

  const handleOmniTagsChange = (tags: any[]) => {
    setOmniTags(tags)
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

  const fetchTagCategories = async () => {
    try {
      const response = await fetch("/api/dam/tags")
      const data = await response.json()
      setTagCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch tag categories:", error)
    }
  }

  const handleUploadComplete = (newAssets: Asset[], keepSelected: boolean) => {
    // Refresh the entire asset list to show new uploads
    fetchAssets()
    // Close upload panel after successful upload
    setIsUploadOpen(false)

    if (!keepSelected) {
      // User clicked "Skip Initial Tagging" - clear selection
      setSelectedAssets([])
      setUploadingAssetIds([])
      setOmniTags([])
      setExistingTags(new Map())
    }
  }

  const handleUploadingIdsChange = (assetIds: string[]) => {
    setUploadingAssetIds(assetIds)
    setSelectedAssets(assetIds)
    setOmniTags([])
    setExistingTags(new Map())
  }

  const computeExistingTags = useCallback((assetIds: string[], sourceAssets: Asset[]) => {
    const tagCounts = new Map<string, number>()
    const selectedAssetsData = sourceAssets.filter((asset) => assetIds.includes(asset.id))

    selectedAssetsData.forEach((asset) => {
      asset.tags?.forEach((tag) => {
        tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1)
      })

      if (asset.teamMemberId) {
        const key = `team-${asset.teamMemberId}`
        tagCounts.set(key, (tagCounts.get(key) || 0) + 1)
      }
    })

    return tagCounts
  }, [])

  const handleSingleTagsChange = async (tags: any[]) => {
    if (!activeLightboxAsset) return
    if (tags.length === 0) {
      setSingleTagDrafts([])
      return
    }

    try {
      setSingleTagDrafts(tags)
      await applyTagsToAssetIds([activeLightboxAsset.id], tags)
      setSingleTagDrafts([])
      const updated = await fetchAssets()
      syncActiveLightboxAsset(updated)
    } catch (error) {
      console.error("Failed to add tags:", error)
      setSingleTagDrafts([])
    }
  }

  const requestTagRemoval = (tagId: string, assetIds: string[], label: string, count: number, context: string) => {
    setPendingTagRemoval({ tagId, assetIds, label, count, context })
  }

  const cancelTagRemoval = () => setPendingTagRemoval(null)

  const confirmTagRemoval = async () => {
    if (!pendingTagRemoval) return
    await handleRemoveTag(pendingTagRemoval.tagId, pendingTagRemoval.count, pendingTagRemoval.assetIds, true)
    setPendingTagRemoval(null)
  }

  const syncActiveLightboxAsset = useCallback((updatedAssets?: Asset[]) => {
    setActiveLightboxAsset((prev) => {
      if (!prev) return prev
      const source = updatedAssets || assets
      return source.find((asset) => asset.id === prev.id) || prev
    })
  }, [assets])

  const applyTagsToAssetIds = async (targetAssetIds: string[], tagsToApply: any[]) => {
    if (targetAssetIds.length === 0 || tagsToApply.length === 0) return

    const teamMemberTags = tagsToApply.filter((tag) => tag.category?.name === "team")
    const regularTags = tagsToApply.filter((tag) => tag.category?.name !== "team")

    if (teamMemberTags.length > 0) {
      const teamMemberId = teamMemberTags[0].id
      const response = await fetch("/api/dam/assets/assign-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetIds: targetAssetIds,
          teamMemberId
        })
      })

      if (!response.ok) {
        throw new Error("Failed to assign team member")
      }
    }

    if (regularTags.length > 0) {
      const response = await fetch("/api/dam/assets/bulk-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetIds: targetAssetIds,
          tagIds: regularTags.map((t: any) => t.id),
          additive: true
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save tags")
      }
    }
  }

  const clearSelection = () => {
    setSelectedAssets([])
    setOmniTags([])
    setExistingTags(new Map())
  }

  const toggleGridView = () => {
    setGridViewMode((prev) => (prev === "square" ? "aspect" : "square"))
  }

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedAssets(selectedIds)

    if (selectedIds.length === 0) {
      // Clear selection mode
      setOmniTeamMemberId(undefined)
      setOmniTags([])
      setExistingTags(new Map())
    } else {
      setExistingTags(computeExistingTags(selectedIds, assets))
      setOmniTags([])
    }
    setPendingTagRemoval(null)
  }

  const handleApplyTags = async () => {
    if (omniTags.length === 0 || selectedAssets.length === 0) return

    try {
      await applyTagsToAssetIds(selectedAssets, omniTags)
      await fetchAssets()
      setSelectedAssets([])
      setOmniTags([])
      setExistingTags(new Map())
    } catch (error) {
      console.error("Failed to save tags:", error)
    }
  }

  const handleMultiTagSelectorChange = async (tags: any[]) => {
    if (selectedAssets.length === 0) {
      setOmniTags(tags)
      return
    }

    const newlyAdded = tags.filter((tag: any) => !omniTags.some((existing) => existing.id === tag.id))
    setOmniTags(tags)

    if (newlyAdded.length === 0) return

    try {
      await applyTagsToAssetIds(selectedAssets, newlyAdded)
      const updated = await fetchAssets()
      setExistingTags(computeExistingTags(selectedAssets, updated))
      setOmniTags([])
    } catch (error) {
      console.error("Failed to add tags instantly:", error)
    }
  }

  const handleRemoveTag = async (tagId: string, count: number, targetAssetIds?: string[], skipPrompt = false) => {
    const isTeamMemberTag = tagId.startsWith('team-')
    const label = isTeamMemberTag ? "team member" : "tag"
    const assetIds = targetAssetIds ?? selectedAssets

    if (assetIds.length === 0) return

    if (!skipPrompt && !confirm(`Remove this ${label} from ${count} image${count !== 1 ? 's' : ''}?`)) return

    try {
      if (isTeamMemberTag) {
        // Remove team member from selected assets
        const response = await fetch("/api/dam/assets/remove-team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assetIds
          })
        })

        if (!response.ok) {
          throw new Error("Failed to remove team member")
        }
      } else {
        // Remove regular tag from selected assets
        const response = await fetch("/api/dam/assets/remove-tag", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assetIds,
            tagId
          })
        })

        if (!response.ok) {
          throw new Error("Failed to remove tag")
        }
      }

      const updated = await fetchAssets()

      if (targetAssetIds) {
        syncActiveLightboxAsset(updated)
      } else {
        const newExistingTags = new Map(existingTags)
        newExistingTags.delete(tagId)
        setExistingTags(newExistingTags)
      }
      setPendingTagRemoval(null)
    } catch (error) {
      console.error("Failed to remove tag:", error)
    }
  }

  const handleDelete = async (assetIds: string[]) => {
    try {
      const response = await fetch("/api/dam/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assetIds
        })
      })

      if (response.ok) {
        // Refresh assets
        await fetchAssets()
        setSelectedAssets([])
      }
    } catch (error) {
      console.error("Failed to delete assets:", error)
    }
  }

  const renderGroupByChips = () => {
    if (groupByTags.length === 0) return null

    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${selectedAssets.length > 0 ? 'text-cream' : 'text-sage'} uppercase`}>
          Group By:
        </span>
        {groupByTags.map((categoryName, index) => (
          <div
            key={categoryName}
            className="flex items-center gap-1 px-3 py-1 bg-sage/20 rounded-full"
          >
            <span className="text-xs font-semibold text-sage uppercase">
              {index > 0 && "→ "}
              {categoryName}
            </span>
            <button
              onClick={() => handleRemoveGroupBy(categoryName)}
              className="p-0.5 hover:bg-sage/20 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-sage" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  const renderChips = () => {
    // Always show Group By chips first if any
    const groupByContent = renderGroupByChips()

    if (selectedAssets.length > 0) {
      return (
        <>
          {groupByContent}
          {/* Selection Mode: Show existing tags with counts */}
          {Array.from(existingTags.entries()).map(([tagId, count]) => {
            const isTeamMemberTag = tagId.startsWith('team-')
            const isPending = pendingTagRemoval && pendingTagRemoval.tagId === tagId && pendingTagRemoval.context === "multi"

            if (isTeamMemberTag) {
              const teamMemberId = tagId.replace('team-', '')
              const teamMember = teamMembers.find(m => m.id === teamMemberId)
              if (!teamMember) return null

              return (
                <div
                  key={tagId}
                  className={`flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm ${isMobile ? 'text-xs' : ''}`}
                  style={{
                    background: getTagColor("#BCC9C2", false)
                  }}
                >
                  <div className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
                    {isPending ? (
                      <span className="text-xs font-semibold text-cream">Confirm removal?</span>
                    ) : (
                      <button
                        onClick={() => requestTagRemoval(tagId, selectedAssets, "team member", count, "multi")}
                        className="flex items-center gap-1 hover:bg-black/10 rounded px-1 transition-colors"
                      >
                        <X className="w-3 h-3 text-cream" />
                        <span className="text-xs font-bold text-cream">{count}</span>
                      </button>
                    )}
                    {teamMember.imageUrl && (
                      <img
                        src={teamMember.imageUrl}
                        alt={teamMember.name}
                        className="w-5 h-5 rounded-full object-cover border border-cream/30"
                      />
                    )}
                    <span className="text-xs font-semibold text-cream uppercase tracking-wide">
                      Team
                    </span>
                    <span className="text-cream/80 text-xs">›</span>
                    <span className="text-sm text-cream font-medium">
                      {teamMember.name}
                    </span>
                  </div>
                  {isPending && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10">
                      <button
                        onClick={confirmTagRemoval}
                        className="text-xs font-semibold text-cream bg-black/30 rounded-full px-2 py-0.5"
                      >
                        Remove
                      </button>
                      <button
                        onClick={cancelTagRemoval}
                        className="text-xs font-medium text-cream/80"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            }

            // Regular tag
            const tag = assets
              .flatMap(a => a.tags || [])
              .find(t => t.id === tagId)
            if (!tag) return null

            return (
              <div
                key={tagId}
                className={`flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm ${isMobile ? 'text-xs' : ''}`}
                style={{
                  background: getTagColor(tag.category.color, false)
                }}
              >
                <div className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
                  {isPending ? (
                    <span className="text-xs font-semibold text-cream">Confirm removal?</span>
                  ) : (
                    <button
                      onClick={() => requestTagRemoval(tagId, selectedAssets, "tag", count, "multi")}
                      className="flex items-center gap-1 hover:bg-black/10 rounded px-1 transition-colors"
                    >
                      <X className="w-3 h-3 text-cream" />
                      <span className="text-xs font-bold text-cream">{count}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleGroupBy(tag.category.name)}
                    className={`text-xs font-semibold text-cream uppercase tracking-wide hover:text-white transition-colors ${
                      groupByTags.includes(tag.category.name) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    disabled={groupByTags.includes(tag.category.name) || groupByTags.length >= 2}
                  >
                    {tag.category.displayName}
                  </button>
                  <span className="text-cream/80 text-xs">›</span>
                  <span className="text-sm text-cream font-medium">
                    {tag.displayName}
                  </span>
                </div>
                {isPending && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10">
                    <button
                      onClick={confirmTagRemoval}
                      className="text-xs font-semibold text-cream bg-black/30 rounded-full px-2 py-0.5"
                    >
                      Remove
                    </button>
                    <button
                      onClick={cancelTagRemoval}
                      className="text-xs font-medium text-cream/80"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* New tags to add */}
          {omniTags.map((tag) => {
            const isTeamTag = tag.category.name === "team"
            const teamMember = isTeamTag ? teamMembers.find(m => m.id === tag.id) : null

            return (
              <div
                key={`new-${tag.id}`}
                className={`flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm border-2 border-cream/40 ${isMobile ? 'text-xs' : ''}`}
                style={{
                  background: getTagColor(tag.category.color, false)
                }}
              >
                <div className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
                  {isTeamTag && teamMember?.imageUrl && (
                    <img
                      src={teamMember.imageUrl}
                      alt={tag.displayName}
                      className="w-5 h-5 rounded-full object-cover border border-cream/30"
                    />
                  )}
                  <button
                    onClick={() => handleGroupBy(tag.category.name)}
                    className={`text-xs font-semibold text-cream uppercase tracking-wide hover:text-white transition-colors ${
                      groupByTags.includes(tag.category.name) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    disabled={groupByTags.includes(tag.category.name) || groupByTags.length >= 2}
                  >
                    {tag.category.displayName}
                  </button>
                  <span className="text-cream/80 text-xs">›</span>
                  <span className="text-sm text-cream font-medium">
                    {tag.displayName}
                  </span>
                </div>
                <button
                  onClick={() => setOmniTags(omniTags.filter(t => t.id !== tag.id))}
                  className="px-2 py-1.5 hover:bg-black/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-cream" />
                </button>
              </div>
            )
          })}

          {/* Add Tag button */}
          <TagSelector
            selectedTags={omniTags}
            onTagsChange={handleMultiTagSelectorChange}
          />
        </>
      )
    } else {
      /* Filter Mode */
      // Convert activeFilters to selected IDs format
      const selectedTagIds = activeFilters
        .filter(f => f.categoryName !== 'team')
        .map(f => f.optionId)
      const selectedTeamMemberIds = activeFilters
        .filter(f => f.categoryName === 'team')
        .map(f => f.optionId)

      return (
        <>
          {groupByContent}
          {/* Render active filter chips */}
          {activeFilters.map((filter) => (
            <div
              key={`${filter.categoryId}-${filter.optionId}`}
              className="flex items-center gap-1 arch-full overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
                      style={{
                        objectPosition: 'center 25%',
                        transform: 'scale(2)'
                      }}
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
                onClick={() => {
                  setActiveFilters(activeFilters.filter(
                    f => !(f.categoryId === filter.categoryId && f.optionId === filter.optionId)
                  ))
                }}
                className="px-2 py-1.5 hover:bg-black/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-cream" />
              </button>
            </div>
          ))}
          <FilterSelector
            categories={tagCategories}
            teamMembers={teamMembers}
            selectedTagIds={selectedTagIds}
            selectedTeamMemberIds={selectedTeamMemberIds}
            assets={assets}
            onTagToggle={(tagId) => {
              // Find the tag and its category
              const category = tagCategories.find(cat =>
                cat.tags?.some((tag: any) => tag.id === tagId)
              )
              if (category) {
                const tag = category.tags.find((t: any) => t.id === tagId)
                if (tag) {
                  const isSelected = selectedTagIds.includes(tagId)
                  if (isSelected) {
                    // Remove filter
                    setActiveFilters(activeFilters.filter(f => f.optionId !== tagId))
                  } else {
                    // Add filter
                    const newFilter: ActiveFilter = {
                      categoryId: category.id,
                      categoryName: category.name,
                      categoryDisplayName: category.displayName,
                      categoryColor: category.color,
                      optionId: tag.id,
                      optionName: tag.name,
                      optionDisplayName: tag.displayName
                    }
                    setActiveFilters([...activeFilters, newFilter])
                  }
                }
              }
            }}
            onTeamMemberToggle={(memberId) => {
              const isSelected = selectedTeamMemberIds.includes(memberId)
              if (isSelected) {
                // Remove filter
                setActiveFilters(activeFilters.filter(f => f.optionId !== memberId))
              } else {
                // Add filter
                const member = teamMembers.find(m => m.id === memberId)
                if (member) {
                  const newFilter: ActiveFilter = {
                    categoryId: 'team',
                    categoryName: 'team',
                    categoryDisplayName: 'Team',
                    categoryColor: '#BCC9C2',
                    optionId: member.id,
                    optionName: member.name,
                    optionDisplayName: member.name,
                    imageUrl: member.imageUrl
                  }
                  setActiveFilters([...activeFilters, newFilter])
                }
              }
            }}
            isLightbox={false}
          />
        </>
      )
    }
  }

  const renderLightboxTags = () => {
    if (selectedAssets.length > 0) {
      return renderChips()
    }

    if (!activeLightboxAsset) {
      return (
        <span className="text-sm text-cream/70">Open a photo to view and edit tags.</span>
      )
    }

    const teamMember = activeLightboxAsset.teamMemberId
      ? teamMembers.find((member) => member.id === activeLightboxAsset.teamMemberId)
      : undefined

    const hasTags = Boolean(teamMember) || (activeLightboxAsset.tags && activeLightboxAsset.tags.length > 0)

    return (
      <div className="flex items-center gap-2">
          {teamMember && (
            <div
              className={`flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm border border-white/20 ${isMobile ? 'text-xs' : ''}`}
              style={{
                background: getTagColor("#BCC9C2", true)
              }}
            >
              <div className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
                {teamMember.imageUrl && (
                  <img
                    src={teamMember.imageUrl}
                    alt={teamMember.name}
                    className="w-5 h-5 rounded-full object-cover border border-cream/30"
                  />
                )}
                <button
                  onClick={() => handleGroupBy("team")}
                  className={`text-xs font-semibold text-cream uppercase tracking-wide hover:text-white transition-colors ${
                    groupByTags.includes("team") ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  disabled={groupByTags.includes("team") || groupByTags.length >= 2}
                >
                  Team
                </button>
                <span className="text-cream/80 text-xs">›</span>
                <span className="text-sm text-cream font-medium">
                  {teamMember.name}
                </span>
              </div>
              {pendingTagRemoval && pendingTagRemoval.tagId === `team-${teamMember.id}` && pendingTagRemoval.context === `single-${activeLightboxAsset.id}` ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10">
                  <button
                    onClick={confirmTagRemoval}
                    className="text-xs font-semibold text-cream bg-black/30 rounded-full px-2 py-0.5"
                  >
                    Remove
                  </button>
                  <button
                    onClick={cancelTagRemoval}
                    className="text-xs font-medium text-cream/80"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => requestTagRemoval(`team-${teamMember.id}`, [activeLightboxAsset.id], "team member", 1, `single-${activeLightboxAsset.id}`)}
                  className="px-2 py-1.5 hover:bg-black/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-cream" />
                </button>
              )}
            </div>
          )}

          {activeLightboxAsset.tags?.map((tag) => (
            <div
              key={tag.id}
              className={`flex-shrink-0 flex items-center gap-1 arch-full overflow-hidden shadow-sm border border-white/20 ${isMobile ? 'text-xs' : ''}`}
              style={{
                background: getTagColor(tag.category.color, true)
              }}>
                <div className={`flex items-center gap-2 ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
                  <button
                    onClick={() => handleGroupBy(tag.category.name)}
                    className={`text-xs font-semibold text-cream uppercase tracking-wide hover:text-white transition-colors ${
                      groupByTags.includes(tag.category.name) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    disabled={groupByTags.includes(tag.category.name) || groupByTags.length >= 2}
                  >
                    {tag.category.displayName}
                  </button>
                  <span className="text-cream/80 text-xs">›</span>
                  <span className="text-sm text-cream font-medium">
                    {tag.displayName}
                  </span>
                </div>
              {pendingTagRemoval && pendingTagRemoval.tagId === tag.id && pendingTagRemoval.context === `single-${activeLightboxAsset.id}` ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/10">
                  <button
                    onClick={confirmTagRemoval}
                    className="text-xs font-semibold text-cream bg-black/30 rounded-full px-2 py-0.5"
                  >
                    Remove
                  </button>
                  <button
                    onClick={cancelTagRemoval}
                    className="text-xs font-medium text-cream/80"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => requestTagRemoval(tag.id, [activeLightboxAsset.id], "tag", 1, `single-${activeLightboxAsset.id}`)}
                  className="px-2 py-1.5 hover:bg-black/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-cream" />
                </button>
              )}
            </div>
          ))}

        {!hasTags && (
          <span className="text-sm text-cream/70">No tags yet. Add one below.</span>
        )}
      </div>
    )
  }

  const renderLightboxTagSelector = () => {
    if (selectedAssets.length > 0 || !activeLightboxAsset) {
      return null
    }

    return (
      <div className="min-w-[240px]">
        <TagSelector
          selectedTags={singleTagDrafts}
          onTagsChange={handleSingleTagsChange}
        />
      </div>
    )
  }

  return (
    <PhotoLightbox
      selectedAssetIds={selectedAssets}
      onSelectionChange={handleSelectionChange}
      assets={assets}
      omniBarProps={{
        mode: "page",  // Use exact same mode as grid view
        chipsContent: renderChips(),  // Use same chips renderer
        selectedCount: selectedAssets.length,
        assetsCount: assets.length,
        totalAssetsCount: allAssets.length,
        canApplyTags: selectedAssets.length === 0 ? omniTags.length > 0 : false,
        onClearSelection: clearSelection,
        onApplyTags: handleApplyTags,
        gridViewMode,
        onToggleGridView: toggleGridView,
        showGridToggle: true,  // Show grid toggle like in main view
        counterSlot:
          assets.length > 0 && activeLightboxIndex >= 0
            ? `${Math.min(activeLightboxIndex + 1, assets.length)} / ${assets.length}`
            : undefined
      }}
      onActiveAssetChange={(asset, index) => {
        setActiveLightboxAsset(asset)
        setActiveLightboxIndex(index)
      }}
    >
      <div className="min-h-screen bg-cream">
        {/* Header - not sticky */}
        <header className="bg-cream">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <img
                  src="/lashpop-images/branding/logo.png"
                  alt="LashPop Studios"
                  className="h-10 w-auto mb-2"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(72%) sepia(12%) saturate(635%) hue-rotate(316deg) brightness(95%) contrast(88%)'
                  }}
                />
                <h1 className="text-xs font-semibold text-dune uppercase tracking-wider">
                  Digital Asset Management
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsUploadOpen(!isUploadOpen)}
                  className={`btn ${isUploadOpen ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <UploadIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
                <Link
                  href="/dam/team"
                  className="btn btn-secondary"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">Team</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Sticky Omni Control Bar */}
        <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <OmniBar
              mode="page"
              chipsContent={renderChips()}
              selectedCount={selectedAssets.length}
              assetsCount={assets.length}
              totalAssetsCount={allAssets.length}
              canApplyTags={selectedAssets.length === 0 ? omniTags.length > 0 : false}
              onClearSelection={clearSelection}
              onApplyTags={handleApplyTags}
              gridViewMode={gridViewMode}
              onToggleGridView={toggleGridView}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Collapsible Upload Section */}
          {isUploadOpen && (
            <div className="mb-6">
              <FileUploader
                onUploadComplete={handleUploadComplete}
                onUploadingIdsChange={handleUploadingIdsChange}
              />
            </div>
          )}

          {/* Gallery */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-warm-sand/50 arch-full flex items-center justify-center mx-auto mb-6">
                <UploadIcon className="w-10 h-10 text-sage" />
              </div>
              <h3 className="h3 text-dune mb-3">
                No assets yet
              </h3>
              <p className="body text-sage">
                Click the Upload button to add your first photos
              </p>
            </div>
          ) : (
            <AssetGrid
              assets={assets}
              selectedAssetIds={selectedAssets}
              onSelectionChange={handleSelectionChange}
              onDelete={handleDelete}
              gridViewMode={gridViewMode}
              groupByCategories={groupByTags}
            />
          )}
        </main>
      </div>
    </PhotoLightbox>
  )
}
